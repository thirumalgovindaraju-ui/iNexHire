// src/routes/groupdiscussion.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { moderateGD, evaluateGD, GDParticipant, GDTranscriptEntry } from '../services/groupdiscussion.service';

const router = Router();

function openingScope(req: any) {
  return {
    organizationId: req.user!.organizationId,
    ...(req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {}),
  };
}

// GET /api/gd — list sessions for an opening (recruiter, authenticated)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { openingId } = req.query as Record<string, string>;
    const sessions = await prisma.groupDiscussion.findMany({
      where: {
        opening: openingScope(req),
        ...(openingId ? { openingId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { opening: { select: { id: true, title: true } } },
    });
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  openingId: z.string(),
  topic: z.string().min(3),
  candidateIds: z.array(z.string()).min(2, 'Select at least 2 participants'),
  duration: z.number().min(5).max(60).default(15),
});

// POST /api/gd/create — recruiter, authenticated
router.post('/create', authenticate, validate(createSchema), async (req, res, next) => {
  try {
    const { openingId, topic, candidateIds, duration } = req.body;

    const opening = await prisma.opening.findFirst({ where: { id: openingId, ...openingScope(req) } });
    if (!opening) throw new AppError(404, 'Opening not found');

    const candidates = await prisma.candidate.findMany({ where: { id: { in: candidateIds }, openingId } });
    if (candidates.length < 2) throw new AppError(400, 'At least 2 valid candidates from this opening are required');

    const participants: GDParticipant[] = candidates.map((c) => ({ candidateId: c.id, name: c.name, speakingTime: 0, score: null }));

    const gd = await prisma.groupDiscussion.create({
      data: {
        openingId,
        topic,
        duration,
        participants: participants as unknown as Prisma.InputJsonValue,
      },
    });

    res.status(201).json({ success: true, groupDiscussion: gd });
  } catch (err) {
    next(err);
  }
});

// GET /api/gd/:id — unauthenticated: both the recruiter dashboard and the
// candidate-facing GDRoom poll this. The session id (an unguessable cuid) is
// the access boundary, the same trust model as the individual interview's
// invite-token flow (see interview.routes.ts /start/:token).
router.get('/:id', async (req, res, next) => {
  try {
    const gd = await prisma.groupDiscussion.findUnique({ where: { id: req.params.id } });
    if (!gd) throw new AppError(404, 'Group discussion not found');
    res.json({ success: true, groupDiscussion: gd });
  } catch (err) {
    next(err);
  }
});

// POST /api/gd/:id/start — recruiter, authenticated
router.post('/:id/start', authenticate, async (req, res, next) => {
  try {
    const gd = await prisma.groupDiscussion.findFirst({ where: { id: req.params.id, opening: openingScope(req) } });
    if (!gd) throw new AppError(404, 'Group discussion not found');
    if (gd.status !== 'PENDING') throw new AppError(400, 'Session already started');

    const updated = await prisma.groupDiscussion.update({
      where: { id: gd.id },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });
    res.json({ success: true, groupDiscussion: updated });
  } catch (err) {
    next(err);
  }
});

const messageSchema = z.object({
  speakerId: z.string(),
  message: z.string().min(1),
});

// POST /api/gd/:id/message — candidate-facing, unauthenticated (mirrors the
// unauthenticated POST /api/interviews/:id/respond trust model).
router.post('/:id/message', validate(messageSchema), async (req, res, next) => {
  try {
    const gd = await prisma.groupDiscussion.findUnique({ where: { id: req.params.id } });
    if (!gd) throw new AppError(404, 'Group discussion not found');
    if (gd.status !== 'ACTIVE') throw new AppError(400, 'Group discussion is not active');

    const { speakerId, message } = req.body as { speakerId: string; message: string };
    const existingTranscript = (Array.isArray(gd.transcript) ? gd.transcript : []) as unknown as GDTranscriptEntry[];

    const { moderatorMessage, updatedTranscript } = await moderateGD(gd.id, message, speakerId, existingTranscript);

    let transcript = updatedTranscript;
    if (moderatorMessage) {
      transcript = [...transcript, { speaker: 'AI Moderator', text: moderatorMessage, timestamp: new Date().toISOString() }];
    }

    const participants = ((Array.isArray(gd.participants) ? gd.participants : []) as unknown as GDParticipant[]).map((p) =>
      p.candidateId === speakerId ? { ...p, speakingTime: (p.speakingTime ?? 0) + 1 } : p
    );

    const updated = await prisma.groupDiscussion.update({
      where: { id: gd.id },
      data: {
        transcript: transcript as unknown as Prisma.InputJsonValue,
        participants: participants as unknown as Prisma.InputJsonValue,
      },
    });

    res.json({ success: true, groupDiscussion: updated, moderatorMessage });
  } catch (err) {
    next(err);
  }
});

// POST /api/gd/:id/complete — unauthenticated (mirrors POST /api/interviews/:id/complete:
// the session timer on the candidate side can end it directly); generates the AI evaluation.
router.post('/:id/complete', async (req, res, next) => {
  try {
    const gd = await prisma.groupDiscussion.findUnique({ where: { id: req.params.id } });
    if (!gd) throw new AppError(404, 'Group discussion not found');
    if (gd.status === 'COMPLETED') {
      return res.json({ success: true, groupDiscussion: gd, message: 'Already completed' });
    }

    const participants = (Array.isArray(gd.participants) ? gd.participants : []) as unknown as GDParticipant[];
    const transcript = (Array.isArray(gd.transcript) ? gd.transcript : []) as unknown as GDTranscriptEntry[];

    const evaluation = await evaluateGD(gd.id, participants, transcript);

    const scoredParticipants = participants.map((p) => ({
      ...p,
      score: evaluation.scores.find((s) => s.candidateId === p.candidateId)?.overall ?? null,
    }));

    const report = {
      scores: evaluation.scores,
      ranking: evaluation.ranking,
      topPerformer: evaluation.topPerformer,
      summary: evaluation.summary,
    };

    const updated = await prisma.groupDiscussion.update({
      where: { id: gd.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        participants: scoredParticipants as unknown as Prisma.InputJsonValue,
        report: report as unknown as Prisma.InputJsonValue,
      },
    });

    res.json({ success: true, groupDiscussion: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
