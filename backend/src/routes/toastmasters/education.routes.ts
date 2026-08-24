// src/routes/toastmasters/education.routes.ts — educational session (topic + presenter)
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/education
router.get('/:id/education', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const educationSessions = await prisma.tmEducationSession.findMany({
      where: { meetingId: req.params.id },
      include: { presenter: true },
    });
    res.json({ success: true, educationSessions });
  } catch (err) {
    next(err);
  }
});

const createEducationSchema = z.object({
  topic: z.string().min(1),
  presenterId: z.string().optional(),
  durationMins: z.number().int().positive().optional(),
});

// POST /api/toastmasters/:id/education
router.post('/:id/education', validate(createEducationSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const educationSession = await prisma.tmEducationSession.create({
      data: { meetingId: req.params.id, ...(req.body as z.infer<typeof createEducationSchema>) },
      include: { presenter: true },
    });
    res.json({ success: true, educationSession });
  } catch (err) {
    next(err);
  }
});

const updateEducationSchema = z.object({
  topic: z.string().optional(),
  presenterId: z.string().nullable().optional(),
  durationMins: z.number().int().positive().optional(),
});

// PATCH /api/toastmasters/education/:sessionId
router.patch('/education/:sessionId', validate(updateEducationSchema), async (req, res, next) => {
  try {
    const existing = await prisma.tmEducationSession.findFirst({
      where: { id: req.params.sessionId, meeting: { organizationId: req.user!.organizationId } },
    });
    if (!existing) throw new AppError(404, 'Education session not found');

    const educationSession = await prisma.tmEducationSession.update({
      where: { id: req.params.sessionId },
      data: req.body as z.infer<typeof updateEducationSchema>,
      include: { presenter: true },
    });
    res.json({ success: true, educationSession });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/toastmasters/education/:sessionId
router.delete('/education/:sessionId', async (req, res, next) => {
  try {
    const existing = await prisma.tmEducationSession.findFirst({
      where: { id: req.params.sessionId, meeting: { organizationId: req.user!.organizationId } },
    });
    if (!existing) throw new AppError(404, 'Education session not found');

    await prisma.tmEducationSession.delete({ where: { id: req.params.sessionId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
