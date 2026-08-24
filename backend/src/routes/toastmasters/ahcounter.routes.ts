// src/routes/toastmasters/ahcounter.routes.ts — tap-to-increment filler word counts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

const FILLER_COLUMN: Record<string, string> = {
  um: 'umCount',
  uh: 'uhCount',
  so: 'soCount',
  like: 'likeCount',
  er: 'erCount',
  you_know: 'youKnowCount',
  other: 'otherCount',
};

// GET /api/toastmasters/:id/ah-counter
router.get('/:id/ah-counter', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const counters = await prisma.tmAhCounter.findMany({
      where: { meetingId: req.params.id },
      include: { member: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, counters });
  } catch (err) {
    next(err);
  }
});

const tapAhCounterSchema = z.object({
  memberId: z.string(),
  fillerWord: z.enum(['um', 'uh', 'so', 'like', 'er', 'you_know', 'other']),
});

// POST /api/toastmasters/:id/ah-counter — tap-to-increment for one member/word
router.post('/:id/ah-counter', validate(tapAhCounterSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const { memberId, fillerWord } = req.body as z.infer<typeof tapAhCounterSchema>;
    const column = FILLER_COLUMN[fillerWord];

    const counter = await prisma.tmAhCounter.upsert({
      where: { meetingId_memberId: { meetingId: req.params.id, memberId } },
      create: { meetingId: req.params.id, memberId, [column]: 1 } as any,
      update: { [column]: { increment: 1 } } as any,
      include: { member: true },
    });

    res.json({ success: true, counter });
  } catch (err) {
    next(err);
  }
});

const bulkSchema = z.object({
  counters: z.array(z.object({
    memberId: z.string(),
    umCount: z.number().int().nonnegative(),
    uhCount: z.number().int().nonnegative(),
    soCount: z.number().int().nonnegative(),
    likeCount: z.number().int().nonnegative(),
    erCount: z.number().int().nonnegative(),
    youKnowCount: z.number().int().nonnegative(),
    otherCount: z.number().int().nonnegative(),
  })),
});

// POST /api/toastmasters/:id/ah-counter/bulk — overwrite absolute counts for many
// members at once (the live tracker tallies locally and batches saves here, rather
// than round-tripping to the server on every tap).
router.post('/:id/ah-counter/bulk', validate(bulkSchema), async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const { counters } = req.body as z.infer<typeof bulkSchema>;

    const saved = await prisma.$transaction(
      counters.map(({ memberId, ...counts }) => prisma.tmAhCounter.upsert({
        where: { meetingId_memberId: { meetingId: req.params.id, memberId } },
        create: { meetingId: req.params.id, memberId, ...counts },
        update: counts,
        include: { member: true },
      }))
    );

    res.json({ success: true, counters: saved });
  } catch (err) {
    next(err);
  }
});

export default router;
