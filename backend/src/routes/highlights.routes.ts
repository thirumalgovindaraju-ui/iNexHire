// src/routes/highlights.routes.ts
// No real video processing — NexHire only records audio+transcripts server-side,
// so this extracts highlights from the interview transcript. See ai.service.ts
// extractHighlights() and CLAUDE.md's note on this module.
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { extractHighlights } from '../services/ai.service';

const router = Router();
router.use(authenticate);

function openingScope(req: any) {
  return {
    organizationId: req.user!.organizationId,
    ...(req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {}),
  };
}

async function findOwnedInterview(interviewId: string, req: any) {
  return prisma.interview.findFirst({
    where: { id: interviewId, candidate: { opening: openingScope(req) } },
    include: {
      candidate: { include: { opening: { select: { title: true } } } },
      responses: { include: { question: true }, orderBy: { question: { order: 'asc' } } },
    },
  });
}

// POST /api/highlights/:interviewId — extract highlights from the interview transcript
router.post('/:interviewId', async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req);
    if (!interview) throw new AppError(404, 'Interview not found');
    if (interview.responses.length === 0) throw new AppError(400, 'No responses to analyze yet');

    const transcripts = interview.responses.map((r, i) =>
      `Q${i + 1} (${r.question.type}): ${r.question.text}\nCandidate's answer: ${r.transcript ?? '(no response given)'}`
    );

    const extracted = await extractHighlights(transcripts, interview.candidate.opening.title);

    // Regenerate — clear any prior extraction for this interview before saving the new one.
    await prisma.videoHighlight.deleteMany({ where: { interviewId: interview.id } });
    if (extracted.length > 0) {
      await prisma.videoHighlight.createMany({
        data: extracted.map((h) => ({
          interviewId: interview.id,
          type: h.type,
          questionIndex: Math.max(0, Math.min(interview.responses.length - 1, h.questionIndex)),
          transcript: h.transcript,
          score: h.score,
          summary: h.summary,
        })),
      });
    }

    const highlights = await prisma.videoHighlight.findMany({
      where: { interviewId: interview.id },
      orderBy: { score: 'desc' },
    });

    res.status(201).json({ success: true, highlights });
  } catch (err) {
    next(err);
  }
});

// GET /api/highlights/:interviewId — get existing highlights
router.get('/:interviewId', async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req);
    if (!interview) throw new AppError(404, 'Interview not found');

    const highlights = await prisma.videoHighlight.findMany({
      where: { interviewId: interview.id },
      orderBy: { score: 'desc' },
    });

    res.json({ success: true, highlights });
  } catch (err) {
    next(err);
  }
});

export default router;
