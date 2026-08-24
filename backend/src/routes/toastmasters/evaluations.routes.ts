// src/routes/toastmasters/evaluations.routes.ts — speaker/evaluator paired evaluations
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/evaluations
router.get('/:id/evaluations', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const evaluations = await prisma.tmEvaluation.findMany({
      where: { meetingId: req.params.id },
      include: {
        speaker: { include: { member: true } },
        evaluator: { include: { member: true } },
      },
    });
    res.json({ success: true, evaluations });
  } catch (err) {
    next(err);
  }
});

const submitEvaluationSchema = z.object({
  speakerRoleId: z.string(),
  evaluatorRoleId: z.string(),
  commendations: z.string().optional(),
  recommendations: z.string().optional(),
  ratingContent: z.number().int().min(1).max(5).optional(),
  ratingDelivery: z.number().int().min(1).max(5).optional(),
  ratingLanguage: z.number().int().min(1).max(5).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  openingFeedback: z.string().optional(),
  bodyFeedback: z.string().optional(),
  conclusionFeedback: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
});

// POST /api/toastmasters/:id/evaluations — one evaluation per speaker role, upserted
router.post('/:id/evaluations', validate(submitEvaluationSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const { speakerRoleId, ...rest } = req.body as z.infer<typeof submitEvaluationSchema>;

    const evaluation = await prisma.tmEvaluation.upsert({
      where: { meetingId_speakerRoleId: { meetingId: req.params.id, speakerRoleId } },
      create: { meetingId: req.params.id, speakerRoleId, ...rest },
      update: rest,
      include: {
        speaker: { include: { member: true } },
        evaluator: { include: { member: true } },
      },
    });

    res.json({ success: true, evaluation });
  } catch (err) {
    next(err);
  }
});

export default router;
