// src/routes/offer.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { generateOfferLetter } from '../services/ai.service';

const router = Router();
router.use(authenticate);

// GET /api/offers — list all offers for this org
router.get('/', async (req, res, next) => {
  try {
    const offers = await prisma.offerLetter.findMany({
      where: {
        candidate: { opening: { organizationId: req.user!.organizationId } },
      },
      include: {
        candidate: { select: { name: true, email: true, opening: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, offers });
  } catch (err) {
    next(err);
  }
});

// GET /api/offers/eligible — candidates with a completed report, for the "New Offer" picker
router.get('/eligible', async (req, res, next) => {
  try {
    const interviews = await prisma.interview.findMany({
      where: {
        candidate: { opening: { organizationId: req.user!.organizationId } },
        report: { isNot: null },
      },
      select: {
        id: true,
        candidateId: true,
        candidate: { select: { name: true, email: true, opening: { select: { title: true, department: true } } } },
        report: { select: { overallScore: true, recommendation: true, decision: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, interviews });
  } catch (err) {
    next(err);
  }
});

const createOfferSchema = z.object({
  candidateId: z.string(),
  interviewId: z.string(),
  baseSalary: z.number().int().positive(),
  equity: z.number().optional(),
  signingBonus: z.number().int().optional(),
  startDate: z.string(),
  reportingTo: z.string(),
  department: z.string().optional(),
  benefits: z.array(z.string()).optional(),
});

// POST /api/offers — generate and create an offer letter
router.post('/', validate(createOfferSchema), async (req, res, next) => {
  try {
    const {
      candidateId, interviewId, baseSalary, equity, signingBonus,
      startDate, reportingTo, department, benefits,
    } = req.body as z.infer<typeof createOfferSchema>;

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, opening: { organizationId: req.user!.organizationId } },
      include: { opening: { select: { title: true, department: true } } },
    });
    if (!candidate) throw new AppError(404, 'Candidate not found');

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, candidateId },
    });
    if (!interview) throw new AppError(404, 'Interview not found for this candidate');

    const org = await prisma.organization.findUnique({ where: { id: req.user!.organizationId } });

    const content = await generateOfferLetter({
      candidateName: candidate.name,
      jobTitle: candidate.opening.title,
      department: department ?? candidate.opening.department ?? 'N/A',
      salary: `$${baseSalary.toLocaleString()}`,
      startDate,
      reportingTo,
      companyName: org?.name ?? 'Our Company',
      benefits,
    });

    const offer = await prisma.offerLetter.create({
      data: {
        candidateId, interviewId, baseSalary, equity, signingBonus,
        startDate: new Date(startDate),
        content,
        status: 'DRAFT',
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: req.user!.organizationId,
        userId: req.user!.userId,
        action: 'OFFER_CREATED',
        resourceType: 'OFFER',
        resourceId: offer.id,
        metadata: { candidateId, baseSalary },
      },
    });

    res.json({ success: true, offer });
  } catch (err) {
    next(err);
  }
});

// GET /api/offers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const offer = await prisma.offerLetter.findFirst({
      where: { id: req.params.id, candidate: { opening: { organizationId: req.user!.organizationId } } },
      include: { candidate: { select: { name: true, email: true, opening: { select: { title: true } } } } },
    });
    if (!offer) throw new AppError(404, 'Offer not found');
    res.json({ success: true, offer });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/offers/:id/send — mark as sent
router.patch('/:id/send', async (req, res, next) => {
  try {
    const existing = await prisma.offerLetter.findFirst({
      where: { id: req.params.id, candidate: { opening: { organizationId: req.user!.organizationId } } },
    });
    if (!existing) throw new AppError(404, 'Offer not found');

    const offer = await prisma.offerLetter.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: req.user!.organizationId,
        userId: req.user!.userId,
        action: 'OFFER_SENT',
        resourceType: 'OFFER',
        resourceId: offer.id,
      },
    });

    res.json({ success: true, offer });
  } catch (err) {
    next(err);
  }
});

export default router;
