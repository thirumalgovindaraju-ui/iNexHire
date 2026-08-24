// src/routes/toastmasters/timer.routes.ts — green/yellow/red speech timing results
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/timer-logs
router.get('/:id/timer-logs', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const timerLogs = await prisma.tmTimerLog.findMany({
      where: { meetingId: req.params.id },
      include: { roleAssignment: { include: { member: true } } },
    });
    res.json({ success: true, timerLogs });
  } catch (err) {
    next(err);
  }
});

const submitTimerLogSchema = z.object({
  roleAssignmentId: z.string(),
  actualDurationSecs: z.number().int().nonnegative(),
  result: z.enum(['UNDER', 'WITHIN', 'OVER']),
  notes: z.string().optional(),
});

// POST /api/toastmasters/:id/timer-logs — one log per role, upserted
router.post('/:id/timer-logs', validate(submitTimerLogSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const { roleAssignmentId, ...rest } = req.body as z.infer<typeof submitTimerLogSchema>;

    const timerLog = await prisma.tmTimerLog.upsert({
      where: { meetingId_roleAssignmentId: { meetingId: req.params.id, roleAssignmentId } },
      create: { meetingId: req.params.id, roleAssignmentId, ...rest },
      update: rest,
      include: { roleAssignment: { include: { member: true } } },
    });

    res.json({ success: true, timerLog });
  } catch (err) {
    next(err);
  }
});

export default router;
