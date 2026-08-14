// src/routes/compliance.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { scanBias } from '../services/ai.service';

const router = Router();
router.use(authenticate);

const scanSchema = z.object({
  scanType: z.enum(['jd', 'questions']).default('jd'),
  jurisdiction: z.enum(['IN', 'UK', 'US', 'ALL']).default('ALL'),
});

// POST /api/compliance/:openingId — trigger a bias scan
router.post(
  '/:openingId',
  validate(scanSchema),
  async (req, res, next) => {
    try {
      const { openingId } = req.params;
      const { scanType, jurisdiction } = req.body as {
        scanType: 'jd' | 'questions';
        jurisdiction: 'IN' | 'UK' | 'US' | 'ALL';
      };

      // Fetch the opening and verify it belongs to this org
      const opening = await prisma.opening.findFirst({
        where: { id: openingId, organizationId: req.user!.organizationId },
        include: { questions: true },
      });
      if (!opening) throw new AppError(404, 'Opening not found');

      // Choose the text to scan
      const textToScan =
        scanType === 'jd'
          ? opening.jobDescription
          : opening.questions.map((q) => q.text).join('\n');

      // Run Claude bias scan
      const result = await scanBias(textToScan, scanType, jurisdiction);

      // Upsert — replace any previous audit for this opening
      const audit = await prisma.biasAudit.upsert({
        where: { openingId },
        create: {
          openingId,
          flags: result.flags as unknown as Prisma.InputJsonValue,
          score: result.score,
          jurisdiction,
        },
        update: {
          flags: result.flags as unknown as Prisma.InputJsonValue,
          score: result.score,
          jurisdiction,
          resolvedAt: null,
          resolvedBy: null,
        },
      });

      res.json({ success: true, audit });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/compliance/:openingId — fetch existing audit result
router.get('/:openingId', async (req, res, next) => {
  try {
    const { openingId } = req.params;

    // Verify org ownership
    const opening = await prisma.opening.findFirst({
      where: { id: openingId, organizationId: req.user!.organizationId },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const audit = await prisma.biasAudit.findUnique({ where: { openingId } });
    res.json({ success: true, audit: audit ?? null });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/compliance/:openingId/resolve — mark as resolved
router.patch('/:openingId/resolve', async (req, res, next) => {
  try {
    const { openingId } = req.params;

    const opening = await prisma.opening.findFirst({
      where: { id: openingId, organizationId: req.user!.organizationId },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const audit = await prisma.biasAudit.update({
      where: { openingId },
      data: { resolvedAt: new Date(), resolvedBy: req.user!.userId },
    });

    res.json({ success: true, audit });
  } catch (err) {
    next(err);
  }
});

// GET /api/compliance — list all audits for this org's openings
router.get('/', async (req, res, next) => {
  try {
    const openings = await prisma.opening.findMany({
      where: { organizationId: req.user!.organizationId },
      select: { id: true, title: true },
    });

    const openingIds = openings.map((o) => o.id);
    const audits = await prisma.biasAudit.findMany({
      where: { openingId: { in: openingIds } },
      orderBy: { createdAt: 'desc' },
    });

    // Attach title to each audit for the frontend list
    const openingMap = Object.fromEntries(openings.map((o) => [o.id, o.title]));
    const result = audits.map((a) => ({
      ...a,
      openingTitle: openingMap[a.openingId] ?? 'Unknown',
    }));

    res.json({ success: true, audits: result });
  } catch (err) {
    next(err);
  }
});

export default router;
