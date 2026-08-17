// src/routes/branding.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/branding/public/:organizationId — unauthenticated, candidate-facing.
// Only ever returns fields safe for a public page — never the full config
// (domain, accentColor, fontFamily etc. stay internal).
router.get('/public/:organizationId', async (req, res, next) => {
  try {
    const config = await prisma.brandingConfig.findUnique({ where: { organizationId: req.params.organizationId } });
    if (!config) {
      return res.json({ success: true, branding: null });
    }
    res.json({
      success: true,
      branding: {
        companyName: config.companyName,
        logoUrl: config.logoUrl,
        primaryColor: config.primaryColor,
        tagline: config.welcomeMsg,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/branding — authenticated, full config for the caller's org
router.get('/', authenticate, async (req, res, next) => {
  try {
    const config = await prisma.brandingConfig.findUnique({ where: { organizationId: req.user!.organizationId } });
    res.json({ success: true, branding: config });
  } catch (err) {
    next(err);
  }
});

const brandingSchema = z.object({
  companyName: z.string().max(200).optional(),
  domain: z.string().max(200).optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  fontFamily: z.string().max(50).optional(),
  welcomeMsg: z.string().max(2000).optional(),
});

// PUT /api/branding — authenticated, upsert (one config per org)
router.put('/', authenticate, validate(brandingSchema), async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) throw new AppError(400, 'No branding fields provided');

    const config = await prisma.brandingConfig.upsert({
      where: { organizationId: req.user!.organizationId },
      create: { organizationId: req.user!.organizationId, ...req.body },
      update: req.body,
    });

    res.json({ success: true, branding: config });
  } catch (err) {
    next(err);
  }
});

export default router;
