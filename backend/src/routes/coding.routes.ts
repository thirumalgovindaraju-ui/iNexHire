// src/routes/coding.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { reviewCode } from '../services/ai.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const router = Router();

const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  python: 71,
  java: 62,
  sql: 82,
};

// Judge0 only executes code — it doesn't score it, so this is combined with
// reviewCode() below regardless of whether execution ran. Returns null (not
// thrown) on any failure so a broken/misconfigured Judge0 key never blocks
// the AI review or the candidate's submission.
async function runOnJudge0(language: string, code: string, stdin?: string): Promise<string | null> {
  const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];
  if (!languageId) return null;
  try {
    const res = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': env.judge0ApiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({ language_id: languageId, source_code: code, stdin: stdin ?? '' }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { stdout?: string; stderr?: string; compile_output?: string; status?: { description?: string } };
    return data.stdout || data.stderr || data.compile_output || data.status?.description || null;
  } catch (err) {
    logger.error('[coding.routes] Judge0 execution failed:', err);
    return null;
  }
}

const submitSchema = z.object({
  interviewId: z.string(),
  questionId: z.string(),
  language: z.enum(['javascript', 'python', 'java', 'sql']),
  code: z.string().min(1),
  timeSpentSec: z.number().optional(),
});

// POST /api/coding/submit — candidate-facing, no auth. Same trust model as the
// existing unauthenticated /api/interviews/:id/respond: the interviewId itself
// (only reachable via the candidate's invite link) is the access boundary.
router.post('/submit', validate(submitSchema), async (req, res, next) => {
  try {
    const { interviewId, questionId, language, code, timeSpentSec } = req.body;

    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new AppError(404, 'Interview not found');
    if (interview.status !== 'IN_PROGRESS') throw new AppError(400, 'Interview is not in progress');

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new AppError(404, 'Question not found');

    const testCases = Array.isArray(question.testCases) ? (question.testCases as any[]) : undefined;

    let output: string | null = null;
    if (env.judge0ApiKey) {
      output = await runOnJudge0(language, code, testCases?.[0]?.input);
    }

    const review = await reviewCode({ code, language, question: question.text, testCases });

    const assessment = await prisma.codingAssessment.create({
      data: {
        interviewId,
        questionId,
        language,
        code,
        output,
        aiScore: review.score,
        aiFeedback: review.feedback,
        timeSpentSec,
      },
    });

    res.status(201).json({
      success: true,
      assessment: {
        ...assessment,
        bugs: review.bugs,
        suggestions: review.suggestions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/coding/:interviewId — recruiter view, org/ownership scoped
router.get('/:interviewId', authenticate, async (req, res, next) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.interviewId,
        candidate: {
          opening: {
            organizationId: req.user!.organizationId,
            ...(req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {}),
          },
        },
      },
    });
    if (!interview) throw new AppError(404, 'Interview not found');

    const assessments = await prisma.codingAssessment.findMany({
      where: { interviewId: req.params.interviewId },
      include: { question: { select: { text: true, order: true } } },
      orderBy: { submittedAt: 'asc' },
    });

    res.json({ success: true, assessments });
  } catch (err) {
    next(err);
  }
});

export default router;
