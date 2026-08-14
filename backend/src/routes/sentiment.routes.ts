// src/routes/sentiment.routes.ts
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { analyseSentiment } from '../services/ai.service';

const router = Router();
router.use(authenticate);

async function findOwnedInterview(interviewId: string, organizationId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: {
      responses: true,
      candidate: { select: { opening: { select: { organizationId: true } } } },
    },
  });
  if (!interview || interview.candidate.opening.organizationId !== organizationId) return null;
  return interview;
}

// POST /api/sentiment/:interviewId — run sentiment analysis
router.post('/:interviewId', async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const transcripts = interview.responses.map((r) => r.transcript || '').filter(Boolean);
    if (transcripts.length === 0) throw new AppError(400, 'No transcripts available for this interview');

    const result = await analyseSentiment(transcripts);
    const data = {
      ...result,
      emotionTimeline: result.emotionTimeline as unknown as Prisma.InputJsonValue,
    };

    const report = await prisma.sentimentReport.upsert({
      where: { interviewId: req.params.interviewId },
      create: { interviewId: req.params.interviewId, ...data },
      update: data,
    });

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

// GET /api/sentiment/:interviewId — fetch existing report
router.get('/:interviewId', async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const report = await prisma.sentimentReport.findUnique({ where: { interviewId: req.params.interviewId } });
    res.json({ success: true, report: report ?? null });
  } catch (err) {
    next(err);
  }
});

export default router;
