// src/routes/interview.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { enqueueEvaluation } from '../jobs/evaluation.job';

const router = Router();

// ─── Recruiter routes (require auth) ─────────────────────────────────────────

// GET /api/interviews  (recruiter sees all for their org)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { openingId, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      candidate: { opening: { organizationId: req.user!.organizationId } },
      ...(openingId ? { candidate: { openingId } } : {}),
      ...(status ? { status } : {}),
    };

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          report: { select: { overallScore: true, recommendation: true, decision: true } },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    res.json({ success: true, interviews, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// ─── Candidate routes (no auth — uses invite token) ───────────────────────────

// GET /api/interviews/start/:token
router.get('/start/:token', async (req, res, next) => {
  try {
    const interview = await prisma.interview.findUnique({
      where: { inviteToken: req.params.token },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        responses: { select: { questionId: true } },
        candidate: {
          include: {
            opening: {
              include: {
                questions: { orderBy: { order: 'asc' } },
                organization: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!interview) throw new AppError(404, 'Interview not found');
    if (interview.status === 'EXPIRED' || interview.expiresAt < new Date()) {
      await prisma.interview.update({ where: { id: interview.id }, data: { status: 'EXPIRED' } });
      throw new AppError(410, 'This interview link has expired');
    }
    if (interview.status === 'COMPLETED' || interview.status === 'EVALUATED') {
      throw new AppError(409, 'Interview already completed');
    }

    // Mark as in progress
    if (interview.status === 'PENDING') {
      await prisma.interview.update({
        where: { id: interview.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
    }

    const answeredQuestionIds = interview.responses.map((r: any) => r.questionId);

    res.json({
      success: true,
      interviewId: interview.id,
      candidate: interview.candidate,
      opening: {
        title: interview.candidate.opening.title,
        organization: interview.candidate.opening.organization.name,
      },
      questions: interview.candidate.opening.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        timeLimit: q.timeLimit,
        order: q.order,
        answered: answeredQuestionIds.includes(q.id),
      })),
      totalQuestions: interview.candidate.opening.questions.length,
      answeredCount: answeredQuestionIds.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/interviews/:id/respond
const respondSchema = z.object({
  questionId: z.string(),
  transcript: z.string().optional(),
  audioUrl: z.string().optional(),
  duration: z.number().optional(),
});

router.post('/:id/respond', validate(respondSchema), async (req, res, next) => {
  try {
    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!interview) throw new AppError(404, 'Interview not found');
    if (interview.status !== 'IN_PROGRESS') throw new AppError(400, 'Interview is not in progress');

    const response = await prisma.response.upsert({
      where: { interviewId_questionId: { interviewId: interview.id, questionId: req.body.questionId } },
      create: {
        interviewId: interview.id,
        questionId: req.body.questionId,
        transcript: req.body.transcript,
        audioUrl: req.body.audioUrl,
        duration: req.body.duration,
      },
      update: {
        transcript: req.body.transcript,
        audioUrl: req.body.audioUrl,
        duration: req.body.duration,
      },
    });

    res.json({ success: true, response: { id: response.id } });
  } catch (err) {
    next(err);
  }
});

// POST /api/interviews/:id/proctor-event
router.post('/:id/proctor-event', async (req, res, next) => {
  try {
    const { eventType, metadata } = req.body;
    if (!eventType) throw new AppError(400, 'eventType required');

    await prisma.proctorLog.create({
      data: { interviewId: req.params.id, eventType, metadata },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/interviews/:id/complete
router.post('/:id/complete', async (req, res, next) => {
  try {
    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!interview) throw new AppError(404, 'Interview not found');
    if (interview.status === 'COMPLETED' || interview.status === 'EVALUATED') {
      return res.json({ success: true, message: 'Already completed' });
    }

    await prisma.interview.update({
      where: { id: interview.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Kick off async evaluation
    await enqueueEvaluation(interview.id);

    res.json({ success: true, message: 'Interview submitted. Report will be ready shortly.' });
  } catch (err) {
    next(err);
  }
});

export default router;
