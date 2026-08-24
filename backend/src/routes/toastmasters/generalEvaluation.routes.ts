// src/routes/toastmasters/generalEvaluation.routes.ts — General Evaluator's meeting write-up
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/general-evaluation
router.get('/:id/general-evaluation', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const generalEvaluation = await prisma.tmGeneralEvaluation.findUnique({ where: { meetingId: req.params.id } });
    res.json({ success: true, generalEvaluation });
  } catch (err) {
    next(err);
  }
});

const upsertSchema = z.object({
  overallFeedback: z.string().optional(),
  evaluatorFeedback: z.array(z.object({ evaluatorRoleId: z.string(), feedback: z.string() })).optional(),
  bestSpeakerRoleId: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
});

// PUT /api/toastmasters/:id/general-evaluation
router.put('/:id/general-evaluation', validate(upsertSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const data = req.body as z.infer<typeof upsertSchema>;

    const generalEvaluation = await prisma.tmGeneralEvaluation.upsert({
      where: { meetingId: req.params.id },
      create: { meetingId: req.params.id, ...data },
      update: data,
    });

    res.json({ success: true, generalEvaluation });
  } catch (err) {
    next(err);
  }
});

export default router;
