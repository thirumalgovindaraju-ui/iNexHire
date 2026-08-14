// src/routes/livevideo.routes.ts
// Live video interviews via Jitsi Meet's free public server (meet.jit.si) —
// no API key, no account, no cost. The room itself is just a random slug;
// anyone who has the roomName URL can join, so roomName must stay unguessable.
import { randomUUID } from 'crypto';
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

async function findOwnedInterview(interviewId: string, organizationId: string) {
  return prisma.interview.findFirst({
    where: { id: interviewId, candidate: { opening: { organizationId } } },
    include: {
      candidate: {
        select: {
          name: true,
          opening: { select: { title: true, questions: { orderBy: { order: 'asc' } } } },
        },
      },
    },
  });
}

function generateRoomName(): string {
  // meet.jit.si room names are effectively public if guessed — keep this long and random.
  return `nexhire-${randomUUID().replace(/-/g, '')}`;
}

// ─── Recruiter-facing (authenticated, keyed by interviewId) ──────────────────

// POST /api/live-video/create/:interviewId
// body: { scheduledAt: ISO string }
router.post('/create/:interviewId', authenticate, async (req, res, next) => {
  try {
    const { scheduledAt } = req.body as { scheduledAt?: string };
    if (!scheduledAt) throw new AppError(400, 'scheduledAt required');
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) throw new AppError(400, 'scheduledAt must be a valid date');

    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    // Upsert: calling this again (e.g. rescheduling) updates scheduledAt but
    // keeps the same roomName, so a link already shared with the candidate
    // stays valid.
    const existing = await prisma.liveInterview.findUnique({ where: { interviewId: interview.id } });
    const liveInterview = existing
      ? await prisma.liveInterview.update({
          where: { interviewId: interview.id },
          data: { scheduledAt: scheduledDate },
        })
      : await prisma.liveInterview.create({
          data: {
            interviewId: interview.id,
            roomName: generateRoomName(),
            scheduledAt: scheduledDate,
          },
        });

    res.status(existing ? 200 : 201).json({ success: true, liveInterview });
  } catch (err) {
    next(err);
  }
});

// GET /api/live-video/:interviewId
router.get('/:interviewId', authenticate, async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const liveInterview = await prisma.liveInterview.findUnique({ where: { interviewId: interview.id } });
    res.json({
      success: true,
      liveInterview: liveInterview ?? null,
      candidate: { name: interview.candidate.name, openingTitle: interview.candidate.opening.title },
      questions: interview.candidate.opening.questions,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/live-video/:interviewId/end
router.patch('/:interviewId/end', authenticate, async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const existing = await prisma.liveInterview.findUnique({ where: { interviewId: interview.id } });
    if (!existing) throw new AppError(404, 'Live interview room not found');

    const liveInterview = await prisma.liveInterview.update({
      where: { interviewId: interview.id },
      data: { endedAt: new Date() },
    });
    res.json({ success: true, liveInterview });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/live-video/:interviewId/join — recruiter (host) joining
router.patch('/:interviewId/join', authenticate, async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.interviewId, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const existing = await prisma.liveInterview.findUnique({ where: { interviewId: interview.id } });
    if (!existing) throw new AppError(404, 'Live interview room not found');

    const liveInterview = await prisma.liveInterview.update({
      where: { interviewId: interview.id },
      data: { hostJoined: true, startedAt: existing.startedAt ?? new Date() },
    });
    res.json({ success: true, liveInterview });
  } catch (err) {
    next(err);
  }
});

// ─── Candidate-facing (no auth, keyed by inviteToken — candidates never see
// the raw interviewId, same pattern as GET /api/interviews/start/:token) ──────

async function findLiveInterviewByToken(token: string) {
  const interview = await prisma.interview.findUnique({
    where: { inviteToken: token },
    include: { candidate: { select: { name: true, opening: { select: { title: true } } } } },
  });
  if (!interview) return null;
  const liveInterview = await prisma.liveInterview.findUnique({ where: { interviewId: interview.id } });
  return { interview, liveInterview };
}

// GET /api/live-video/by-token/:token
router.get('/by-token/:token', async (req, res, next) => {
  try {
    const result = await findLiveInterviewByToken(req.params.token);
    if (!result) throw new AppError(404, 'Interview not found');
    res.json({
      success: true,
      liveInterview: result.liveInterview ?? null,
      candidate: { name: result.interview.candidate.name, openingTitle: result.interview.candidate.opening.title },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/live-video/by-token/:token/join — candidate (guest) joining
router.patch('/by-token/:token/join', async (req, res, next) => {
  try {
    const result = await findLiveInterviewByToken(req.params.token);
    if (!result?.liveInterview) throw new AppError(404, 'Live interview room not found');

    const liveInterview = await prisma.liveInterview.update({
      where: { interviewId: result.interview.id },
      data: { guestJoined: true, startedAt: result.liveInterview.startedAt ?? new Date() },
    });
    res.json({ success: true, liveInterview });
  } catch (err) {
    next(err);
  }
});

export default router;
