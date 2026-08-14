// src/routes/culturefit.routes.ts
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { scoreCultureFit } from '../services/ai.service';

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

// POST /api/culture-fit/:interviewId
router.post('/:interviewId', async (req, res, next) => {
  try {
    const { cultureDimensions = [], companyValues = '' } = req.body;

    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const transcripts = interview.responses.map((r) => r.transcript || '').filter(Boolean);
    if (transcripts.length === 0) throw new AppError(400, 'No transcripts available for this interview');

    const result = await scoreCultureFit(transcripts, cultureDimensions, companyValues);
    const data = {
      ...result,
      dimensions: result.dimensions as unknown as Prisma.InputJsonValue,
    };

    const score = await prisma.cultureFitScore.upsert({
      where: { interviewId: req.params.interviewId },
      create: { interviewId: req.params.interviewId, ...data },
      update: data,
    });

    res.json({ success: true, score });
  } catch (err) {
    next(err);
  }
});

// GET /api/culture-fit/:interviewId
router.get('/:interviewId', async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const score = await prisma.cultureFitScore.findUnique({ where: { interviewId: req.params.interviewId } });
    res.json({ success: true, score: score ?? null });
  } catch (err) {
    next(err);
  }
});

export default router;
