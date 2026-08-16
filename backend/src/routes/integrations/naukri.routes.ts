// src/routes/integrations/naukri.routes.ts
// SIMULATION ONLY — there is no real Naukri.com API integration here. A genuine
// integration requires a Naukri RMS/Recruiter API partnership this project does
// not have. Every generated candidate below is entirely fictional, AI-generated
// data; never remove `simulated: true` from a response when consuming it.
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireRole';
import { AppError } from '../../middleware/errorHandler';
import { generateSimulatedNaukriCandidates, scoreNaukriMatches } from '../../services/ai.service';
import { createInterviewAndSendInvite } from '../candidate.routes';

const router = Router();
router.use(authenticate);

async function getNaukriIntegration(organizationId: string) {
  return prisma.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider: 'NAUKRI' } },
  });
}

function openingScope(req: any) {
  return {
    organizationId: req.user!.organizationId,
    ...(req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {}),
  };
}

// GET /api/integrations/naukri/status
router.get('/status', async (req, res, next) => {
  try {
    const integration = await getNaukriIntegration(req.user!.organizationId);
    res.json({ success: true, integration: integration ?? null, simulated: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/naukri/connect — admin only, stores a (simulated) API key
router.post('/connect', requireAdmin, async (req, res, next) => {
  try {
    const { apiKey } = req.body as { apiKey?: string };
    if (!apiKey || apiKey.trim().length < 4) throw new AppError(400, 'A (simulated) API key is required');

    const integration = await prisma.integration.upsert({
      where: { organizationId_provider: { organizationId: req.user!.organizationId, provider: 'NAUKRI' } },
      create: {
        organizationId: req.user!.organizationId,
        provider: 'NAUKRI',
        status: 'CONNECTED',
        config: { simulated: true, connectedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
      update: {
        status: 'CONNECTED',
        config: { simulated: true, connectedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
    });

    res.json({
      success: true,
      integration,
      simulated: true,
      message: 'Simulation mode — no real Naukri.com API key was validated. Production requires a Naukri Recruiter/RMS API partnership.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/naukri/search
router.get('/search', async (req, res, next) => {
  try {
    const { skills, location, minExp, maxExp, minSalary, maxSalary, openingId } = req.query as Record<string, string>;

    const integration = await getNaukriIntegration(req.user!.organizationId);
    if (integration?.status !== 'CONNECTED') throw new AppError(400, 'Connect Naukri.com first');

    const skillsList = skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const generated = await generateSimulatedNaukriCandidates({
      skills: skillsList,
      location: location ?? '',
      minExp: minExp ? Number(minExp) : undefined,
      maxExp: maxExp ? Number(maxExp) : undefined,
      minSalary: minSalary ? Number(minSalary) : undefined,
      maxSalary: maxSalary ? Number(maxSalary) : undefined,
      count: 10,
    });

    let matchPercents: Record<string, number> = {};
    let opening: { id: string; title: string; skills: string[] } | null = null;

    if (openingId) {
      opening = await prisma.opening.findFirst({
        where: { id: openingId, ...openingScope(req) },
        select: { id: true, title: true, skills: true },
      });
      if (!opening) throw new AppError(404, 'Opening not found');

      matchPercents = await scoreNaukriMatches({
        candidates: generated.map((c) => ({
          name: c.name,
          skills: c.skills,
          experienceYears: c.experienceYears,
          currentRole: c.currentRole,
        })),
        jobTitle: opening.title,
        requiredSkills: opening.skills,
      });
    }

    const candidates = generated.map((c) => ({
      ...c,
      matchPercent: matchPercents[c.name] ?? null,
    }));

    res.json({ success: true, candidates, simulated: true, opening });
  } catch (err) {
    next(err);
  }
});

const IMPORT_INPUT_KEYS = [
  'naukriId', 'name', 'email', 'phone', 'currentRole', 'currentCompany',
  'experienceYears', 'skills', 'location', 'salaryLakhs', 'resumeHeadline',
] as const;

// POST /api/integrations/naukri/import
router.post('/import', async (req, res, next) => {
  try {
    const body = req.body as Record<string, any>;
    if (!body.name) throw new AppError(400, 'name required');

    const integration = await getNaukriIntegration(req.user!.organizationId);
    if (integration?.status !== 'CONNECTED') throw new AppError(400, 'Connect Naukri.com first');

    const data: Record<string, any> = { organizationId: req.user!.organizationId };
    for (const key of IMPORT_INPUT_KEYS) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (data.skills !== undefined) data.skills = data.skills as Prisma.InputJsonValue;

    const naukriCandidate = await prisma.naukriCandidate.create({ data: data as any });

    res.status(201).json({ success: true, naukriCandidate, simulated: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/naukri/imported
router.get('/imported', async (req, res, next) => {
  try {
    const imported = await prisma.naukriCandidate.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { importedAt: 'desc' },
    });
    res.json({ success: true, imported });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/naukri/invite/:naukriCandidateId
router.post('/invite/:naukriCandidateId', async (req, res, next) => {
  try {
    const { openingId } = req.body as { openingId?: string };
    if (!openingId) throw new AppError(400, 'openingId required');

    const naukriCandidate = await prisma.naukriCandidate.findFirst({
      where: { id: req.params.naukriCandidateId, organizationId: req.user!.organizationId },
    });
    if (!naukriCandidate) throw new AppError(404, 'Naukri candidate not found');

    const opening = await prisma.opening.findFirst({
      where: { id: openingId, ...openingScope(req) },
      include: { organization: true },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    // Real Naukri candidates don't have a verified email in simulation mode — fabricate
    // a guaranteed-non-deliverable placeholder rather than risk emailing a real person.
    const email = naukriCandidate.email
      ?? `${naukriCandidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}.${naukriCandidate.id.slice(-6)}@simulated-naukri-import.example`;

    const candidate = await prisma.candidate.upsert({
      where: { email_openingId: { email, openingId } },
      create: {
        name: naukriCandidate.name,
        email,
        phone: naukriCandidate.phone ?? undefined,
        openingId,
      },
      update: {},
    });

    const interview = await createInterviewAndSendInvite(candidate, opening);

    await prisma.naukriCandidate.update({
      where: { id: naukriCandidate.id },
      data: { status: 'INVITED', candidateId: candidate.id },
    });

    res.status(201).json({ success: true, candidate, interview, simulated: !naukriCandidate.email });
  } catch (err) {
    next(err);
  }
});

export default router;
