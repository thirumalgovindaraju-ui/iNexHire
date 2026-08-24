// src/routes/toastmasters/grammarian.routes.ts — word-of-the-day usage tracking
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/grammarian
router.get('/:id/grammarian', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const log = await prisma.tmGrammarianLog.findUnique({ where: { meetingId: req.params.id } });
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
});

const upsertGrammarianSchema = z.object({
  wordOfDay: z.string().optional(),
  correctUses: z.number().int().nonnegative().optional(),
  incorrectUses: z.number().int().nonnegative().optional(),
  goodGrammarExamples: z.string().optional(),
  errorsNoted: z.string().optional(),
});

// PUT /api/toastmasters/:id/grammarian
router.put('/:id/grammarian', validate(upsertGrammarianSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const data = req.body as z.infer<typeof upsertGrammarianSchema>;

    const log = await prisma.tmGrammarianLog.upsert({
      where: { meetingId: req.params.id },
      create: { meetingId: req.params.id, ...data },
      update: data,
    });

    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
});

export default router;
