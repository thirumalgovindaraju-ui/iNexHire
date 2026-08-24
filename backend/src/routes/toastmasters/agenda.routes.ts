// src/routes/toastmasters/agenda.routes.ts — agenda builder (duration/start/end per slot)
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/agenda
router.get('/:id/agenda', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const agendaItems = await prisma.tmAgendaItem.findMany({
      where: { meetingId: req.params.id },
      include: { roleAssignment: { include: { member: true } } },
      orderBy: { sequence: 'asc' },
    });
    res.json({ success: true, agendaItems });
  } catch (err) {
    next(err);
  }
});

const createAgendaItemSchema = z.object({
  sequence: z.number().int(),
  activityName: z.string().min(1),
  durationMins: z.number().int().positive().optional(),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  roleAssignmentId: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/toastmasters/:id/agenda
router.post('/:id/agenda', validate(createAgendaItemSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const agendaItem = await prisma.tmAgendaItem.create({
      data: { meetingId: req.params.id, ...(req.body as z.infer<typeof createAgendaItemSchema>) },
    });
    res.json({ success: true, agendaItem });
  } catch (err) {
    next(err);
  }
});

// POST /api/toastmasters/:id/agenda/bulk — replace the whole agenda (used by the drag-to-reorder builder)
router.post('/:id/agenda/bulk', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const items = req.body.items as Array<z.infer<typeof createAgendaItemSchema>>;
    if (!Array.isArray(items)) throw new AppError(400, 'items must be an array');

    await prisma.$transaction([
      prisma.tmAgendaItem.deleteMany({ where: { meetingId: req.params.id } }),
      prisma.tmAgendaItem.createMany({
        data: items.map((item) => ({ meetingId: req.params.id, ...item })),
      }),
    ]);

    const agendaItems = await prisma.tmAgendaItem.findMany({
      where: { meetingId: req.params.id },
      include: { roleAssignment: { include: { member: true } } },
      orderBy: { sequence: 'asc' },
    });
    res.json({ success: true, agendaItems });
  } catch (err) {
    next(err);
  }
});

const updateAgendaItemSchema = z.object({
  sequence: z.number().int().optional(),
  activityName: z.string().optional(),
  durationMins: z.number().int().positive().optional(),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  actualStart: z.string().nullable().optional(),
  actualEnd: z.string().nullable().optional(),
  roleAssignmentId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

// PATCH /api/toastmasters/agenda/:itemId
router.patch('/agenda/:itemId', validate(updateAgendaItemSchema), async (req, res, next) => {
  try {
    const existing = await prisma.tmAgendaItem.findFirst({
      where: { id: req.params.itemId, meeting: { organizationId: req.user!.organizationId } },
    });
    if (!existing) throw new AppError(404, 'Agenda item not found');

    const { actualStart, actualEnd, ...rest } = req.body as z.infer<typeof updateAgendaItemSchema>;
    const agendaItem = await prisma.tmAgendaItem.update({
      where: { id: req.params.itemId },
      data: {
        ...rest,
        ...(actualStart !== undefined ? { actualStart: actualStart ? new Date(actualStart) : null } : {}),
        ...(actualEnd !== undefined ? { actualEnd: actualEnd ? new Date(actualEnd) : null } : {}),
      },
    });
    res.json({ success: true, agendaItem });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/toastmasters/agenda/:itemId
router.delete('/agenda/:itemId', async (req, res, next) => {
  try {
    const existing = await prisma.tmAgendaItem.findFirst({
      where: { id: req.params.itemId, meeting: { organizationId: req.user!.organizationId } },
    });
    if (!existing) throw new AppError(404, 'Agenda item not found');

    await prisma.tmAgendaItem.delete({ where: { id: req.params.itemId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
