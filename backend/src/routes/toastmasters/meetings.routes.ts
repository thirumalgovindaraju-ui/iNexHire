// src/routes/toastmasters/meetings.routes.ts — meeting CRUD + club settings
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';
import { TM_ROLE_NAMES, findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// ─── Club settings ──────────────────────────────────────────────────────────

// GET /api/toastmasters/club
router.get('/club', async (req, res, next) => {
  try {
    const club = await prisma.tmClub.findUnique({ where: { organizationId: req.user!.organizationId } });
    res.json({ success: true, club });
  } catch (err) {
    next(err);
  }
});

const upsertClubSchema = z.object({
  name: z.string().optional(),
  charterNumber: z.string().optional(),
  area: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
});

// PUT /api/toastmasters/club
router.put('/club', validate(upsertClubSchema), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof upsertClubSchema>;
    const club = await prisma.tmClub.upsert({
      where: { organizationId: req.user!.organizationId },
      create: { organizationId: req.user!.organizationId, ...data },
      update: data,
    });
    res.json({ success: true, club });
  } catch (err) {
    next(err);
  }
});

// ─── Meetings ───────────────────────────────────────────────────────────────

// GET /api/toastmasters — list, with quick stats
router.get('/', async (req, res, next) => {
  try {
    const meetings = await prisma.tmMeeting.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        roleAssignments: { select: { memberId: true } },
        _count: { select: { evaluations: true } },
      },
      orderBy: { date: 'desc' },
    });

    const withRoleCounts = meetings.map(({ roleAssignments, ...m }) => ({
      ...m,
      roleCount: { filled: roleAssignments.filter((r) => r.memberId != null).length, total: roleAssignments.length },
    }));

    res.json({ success: true, meetings: withRoleCounts });
  } catch (err) {
    next(err);
  }
});

const createMeetingSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  theme: z.string().optional(),
  meetingNumber: z.number().int().optional(),
  wordOfDay: z.string().optional(),
  wordMeaning: z.string().optional(),
  wordType: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
});

// POST /api/toastmasters — creates the meeting pre-seeded with all 15 empty roles
router.post('/', validate(createMeetingSchema), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof createMeetingSchema>;
    const club = await prisma.tmClub.findUnique({ where: { organizationId: req.user!.organizationId } });

    const meeting = await prisma.tmMeeting.create({
      data: {
        organizationId: req.user!.organizationId,
        createdById: req.user!.userId,
        clubId: club?.id,
        ...data,
        date: new Date(data.date),
        roleAssignments: {
          create: TM_ROLE_NAMES.map((roleName) => ({ roleName })),
        },
      },
      include: { roleAssignments: true },
    });

    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

// GET /api/toastmasters/:id
router.get('/:id', async (req, res, next) => {
  try {
    const meeting = await prisma.tmMeeting.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        club: true,
        roleAssignments: { include: { member: true }, orderBy: { createdAt: 'asc' } },
        agendaItems: { orderBy: { sequence: 'asc' }, include: { roleAssignment: { include: { member: true } } } },
        educationSessions: { include: { presenter: true } },
        evaluations: true,
        grammarianLog: true,
        _count: { select: { ahCounters: true, timerLogs: true, tableTopicResponses: true } },
      },
    });
    if (!meeting) throw new AppError(404, 'Meeting not found');
    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

const updateMeetingSchema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  theme: z.string().optional(),
  meetingNumber: z.number().int().optional(),
  wordOfDay: z.string().optional(),
  wordMeaning: z.string().optional(),
  wordType: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

// PATCH /api/toastmasters/:id
router.patch('/:id', validate(updateMeetingSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const { date, ...rest } = req.body as z.infer<typeof updateMeetingSchema>;
    const meeting = await prisma.tmMeeting.update({
      where: { id: req.params.id },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/toastmasters/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    await prisma.tmMeeting.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
