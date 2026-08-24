// src/routes/toastmasters/tabletopics.routes.ts — Table Topics round responses
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/table-topics
router.get('/:id/table-topics', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const responses = await prisma.tmTableTopicResponse.findMany({
      where: { meetingId: req.params.id },
      include: { member: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, responses });
  } catch (err) {
    next(err);
  }
});

const createResponseSchema = z.object({
  speakerName: z.string().min(1),
  isMember: z.boolean().optional(),
  memberId: z.string().optional(),
  topicGiven: z.string().optional(),
  durationSecs: z.number().int().nonnegative().optional(),
  timerResult: z.enum(['UNDER', 'WITHIN', 'OVER']).optional(),
});

// POST /api/toastmasters/:id/table-topics
router.post('/:id/table-topics', validate(createResponseSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const response = await prisma.tmTableTopicResponse.create({
      data: { meetingId: req.params.id, ...(req.body as z.infer<typeof createResponseSchema>) },
      include: { member: true },
    });
    res.json({ success: true, response });
  } catch (err) {
    next(err);
  }
});

const updateResponseSchema = createResponseSchema.partial();

// PATCH /api/toastmasters/table-topics/:responseId
router.patch('/table-topics/:responseId', validate(updateResponseSchema), async (req, res, next) => {
  try {
    const existing = await prisma.tmTableTopicResponse.findFirst({
      where: { id: req.params.responseId, meeting: { organizationId: req.user!.organizationId } },
    });
    if (!existing) throw new AppError(404, 'Table topic response not found');

    const response = await prisma.tmTableTopicResponse.update({
      where: { id: req.params.responseId },
      data: req.body as z.infer<typeof updateResponseSchema>,
      include: { member: true },
    });
    res.json({ success: true, response });
  } catch (err) {
    next(err);
  }
});

export default router;
