// src/routes/candidate.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { sendInterviewInvite } from '../services/email.service';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

const addCandidateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  openingId: z.string(),
  sendInvite: z.boolean().default(false),
});

const bulkAddSchema = z.object({
  openingId: z.string(),
  candidates: z.array(z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  })),
  sendInvites: z.boolean().default(false),
});

// GET /api/candidates
router.get('/', async (req, res, next) => {
  try {
    const { openingId, page = '1', limit = '20', search } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify opening belongs to this org if provided
    if (openingId) {
      const opening = await prisma.opening.findFirst({
        where: { id: openingId, organizationId: req.user!.organizationId },
      });
      if (!opening) throw new AppError(404, 'Opening not found');
    }

    const where: any = {
      opening: { organizationId: req.user!.organizationId },
      ...(openingId ? { openingId } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          opening: { select: { id: true, title: true } },
          interviews: {
            select: { id: true, status: true, completedAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    res.json({ success: true, candidates, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/candidates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: req.params.id,
        opening: { organizationId: req.user!.organizationId },
      },
      include: {
        opening: { select: { id: true, title: true, skills: true } },
        interviews: {
          include: {
            report: true,
            _count: { select: { proctorLogs: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!candidate) throw new AppError(404, 'Candidate not found');
    res.json({ success: true, candidate });
  } catch (err) {
    next(err);
  }
});

// POST /api/candidates
router.post('/', validate(addCandidateSchema), async (req, res, next) => {
  try {
    const { sendInvite, ...candidateData } = req.body;

    // Verify opening belongs to this org
    const opening = await prisma.opening.findFirst({
      where: { id: candidateData.openingId, organizationId: req.user!.organizationId },
      include: { organization: true },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const candidate = await prisma.candidate.create({ data: candidateData });

    let interview = null;
    if (sendInvite) {
      interview = await createInterviewAndSendInvite(candidate, opening);
    }

    res.status(201).json({ success: true, candidate, interview });
  } catch (err) {
    next(err);
  }
});

// POST /api/candidates/bulk
router.post('/bulk', validate(bulkAddSchema), async (req, res, next) => {
  try {
    const { openingId, candidates, sendInvites } = req.body;

    const opening = await prisma.opening.findFirst({
      where: { id: openingId, organizationId: req.user!.organizationId },
      include: { organization: true },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const results = [];
    const errors = [];

    for (const c of candidates) {
      try {
        const candidate = await prisma.candidate.upsert({
          where: { email_openingId: { email: c.email, openingId } },
          create: { ...c, openingId },
          update: {},
        });

        let interview = null;
        if (sendInvites) {
          const existing = await prisma.interview.findFirst({
            where: { candidateId: candidate.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          });
          if (!existing) {
            interview = await createInterviewAndSendInvite(candidate, opening);
          }
        }

        results.push({ candidate, interview, status: 'ok' });
      } catch (err: any) {
        errors.push({ email: c.email, error: err.message });
      }
    }

    res.json({ success: true, added: results.length, errors, results });
  } catch (err) {
    next(err);
  }
});

// POST /api/candidates/:id/send-invite
router.post('/:id/send-invite', async (req, res, next) => {
  try {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: req.params.id,
        opening: { organizationId: req.user!.organizationId },
      },
      include: {
        opening: { include: { organization: true } },
      },
    });
    if (!candidate) throw new AppError(404, 'Candidate not found');

    // Check for existing active invite
    const existing = await prisma.interview.findFirst({
      where: { candidateId: candidate.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });

    let interview = existing;
    if (!existing) {
      interview = await createInterviewAndSendInvite(candidate, candidate.opening);
    } else {
      // Resend invite for existing interview
      const link = `${env.appUrl}/interview/${existing.inviteToken}`;
      await sendInterviewInvite({
        to: candidate.email,
        candidateName: candidate.name,
        jobTitle: candidate.opening.title,
        companyName: candidate.opening.organization.name,
        interviewLink: link,
        expiryDate: existing.expiresAt,
      });
    }

    res.json({ success: true, interview });
  } catch (err) {
    next(err);
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function createInterviewAndSendInvite(
  candidate: any,
  opening: any
): Promise<any> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.inviteExpiryDays);

  const interview = await prisma.interview.create({
    data: { candidateId: candidate.id, expiresAt },
  });

  const link = `${env.appUrl}/interview/${interview.inviteToken}`;
  await sendInterviewInvite({
    to: candidate.email,
    candidateName: candidate.name,
    jobTitle: opening.title,
    companyName: opening.organization?.name ?? 'Company',
    interviewLink: link,
    expiryDate: expiresAt,
  });

  return interview;
}

export default router;
