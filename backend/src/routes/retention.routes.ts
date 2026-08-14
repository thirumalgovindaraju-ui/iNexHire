// src/routes/retention.routes.ts
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { predictRetention } from '../services/ai.service';

const router = Router();
router.use(authenticate);

async function findOwnedInterview(interviewId: string, organizationId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: {
      responses: true,
      candidate: { select: { opening: { select: { organizationId: true, title: true } } } },
    },
  });
  if (!interview || interview.candidate.opening.organizationId !== organizationId) return null;
  return interview;
}

// POST /api/retention/:interviewId
router.post('/:interviewId', async (req, res, next) => {
  try {
    const { salaryRange } = req.body;

    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const transcripts = interview.responses.map((r) => r.transcript || '').filter(Boolean);
    if (transcripts.length === 0) throw new AppError(400, 'No transcripts available for this interview');

    const result = await predictRetention(transcripts, interview.candidate.opening.title, salaryRange);
    const data = {
      ...result,
      riskFactors: result.riskFactors as unknown as Prisma.InputJsonValue,
      positiveFactors: result.positiveFactors as unknown as Prisma.InputJsonValue,
    };

    const prediction = await prisma.retentionPrediction.upsert({
      where: { interviewId: req.params.interviewId },
      create: { interviewId: req.params.interviewId, ...data },
      update: data,
    });

    res.json({ success: true, prediction });
  } catch (err) {
    next(err);
  }
});

// GET /api/retention/:interviewId
router.get('/:interviewId', async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const prediction = await prisma.retentionPrediction.findUnique({ where: { interviewId: req.params.interviewId } });
    res.json({ success: true, prediction: prediction ?? null });
  } catch (err) {
    next(err);
  }
});

export default router;
