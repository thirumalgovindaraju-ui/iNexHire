// src/routes/whatsapp.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { sendWhatsApp } from '../services/whatsapp.service';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

// Admins see every candidate in the org; recruiters are scoped to candidates
// under openings they personally created.
function openingScope(req: any) {
  return {
    organizationId: req.user!.organizationId,
    ...(req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {}),
  };
}

async function findOwnedCandidate(candidateId: string, req: any) {
  return prisma.candidate.findFirst({
    where: { id: candidateId, opening: openingScope(req) },
    include: { opening: { include: { organization: true } } },
  });
}

const sendSchema = z.object({
  candidateId: z.string(),
  messageType: z.enum(['INVITE', 'REMINDER', 'RESULT', 'OFFER', 'CUSTOM']),
  customMessage: z.string().optional(),
});

// POST /api/whatsapp/send
router.post('/send', validate(sendSchema), async (req, res, next) => {
  try {
    const { candidateId, messageType, customMessage } = req.body;
    const candidate = await findOwnedCandidate(candidateId, req);
    if (!candidate) throw new AppError(404, 'Candidate not found');
    if (!candidate.phone) throw new AppError(400, 'Candidate has no phone number on file');
    if (messageType === 'CUSTOM' && !customMessage?.trim()) {
      throw new AppError(400, 'customMessage required for CUSTOM message type');
    }

    const { log, simulated } = await sendWhatsApp({
      candidateId: candidate.id,
      phone: candidate.phone,
      messageType,
      candidateName: candidate.name,
      role: candidate.opening.title,
      company: candidate.opening.organization.name,
      customMessage,
    });

    res.status(201).json({ success: true, log, simulated });
  } catch (err) {
    next(err);
  }
});

// POST /api/whatsapp/invite/:candidateId
router.post('/invite/:candidateId', async (req, res, next) => {
  try {
    const candidate = await findOwnedCandidate(req.params.candidateId, req);
    if (!candidate) throw new AppError(404, 'Candidate not found');
    if (!candidate.phone) throw new AppError(400, 'Candidate has no phone number on file');

    const interview = await prisma.interview.findFirst({
      where: { candidateId: candidate.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!interview) throw new AppError(400, 'Candidate has no active interview invite to send');

    const link = `${env.appUrl}/interview/${interview.inviteToken}`;
    const { log, simulated } = await sendWhatsApp({
      candidateId: candidate.id,
      phone: candidate.phone,
      messageType: 'INVITE',
      candidateName: candidate.name,
      role: candidate.opening.title,
      company: candidate.opening.organization.name,
      link,
    });

    res.status(201).json({ success: true, log, simulated });
  } catch (err) {
    next(err);
  }
});

// POST /api/whatsapp/remind/:interviewId
router.post('/remind/:interviewId', async (req, res, next) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: { id: req.params.interviewId, candidate: { opening: openingScope(req) } },
      include: { candidate: { include: { opening: { include: { organization: true } } } } },
    });
    if (!interview) throw new AppError(404, 'Interview not found');
    if (!interview.candidate.phone) throw new AppError(400, 'Candidate has no phone number on file');
    if (interview.status !== 'PENDING') throw new AppError(400, 'Interview is not pending — reminder not applicable');

    const link = `${env.appUrl}/interview/${interview.inviteToken}`;
    const { log, simulated } = await sendWhatsApp({
      candidateId: interview.candidate.id,
      phone: interview.candidate.phone,
      messageType: 'REMINDER',
      candidateName: interview.candidate.name,
      role: interview.candidate.opening.title,
      company: interview.candidate.opening.organization.name,
      link,
    });

    res.status(201).json({ success: true, log, simulated });
  } catch (err) {
    next(err);
  }
});

// GET /api/whatsapp/logs — all org logs (admin only) — MUST be registered before /logs/:candidateId
router.get('/logs', requireAdmin, async (req, res, next) => {
  try {
    const logs = await prisma.whatsAppLog.findMany({
      where: { candidate: { opening: { organizationId: req.user!.organizationId } } },
      orderBy: { sentAt: 'desc' },
      take: 200,
      include: { candidate: { select: { id: true, name: true, phone: true } } },
    });
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

// GET /api/whatsapp/logs/:candidateId
router.get('/logs/:candidateId', async (req, res, next) => {
  try {
    const candidate = await findOwnedCandidate(req.params.candidateId, req);
    if (!candidate) throw new AppError(404, 'Candidate not found');

    const logs = await prisma.whatsAppLog.findMany({
      where: { candidateId: req.params.candidateId },
      orderBy: { sentAt: 'desc' },
    });
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

export default router;
