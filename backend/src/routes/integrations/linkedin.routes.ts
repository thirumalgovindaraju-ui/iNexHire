// src/routes/integrations/linkedin.routes.ts
// SIMULATION ONLY — there is no real LinkedIn Talent Solutions API integration
// here. A genuine integration requires LinkedIn partner approval and OAuth app
// credentials this project does not have. Every simulated response below is
// clearly labeled `simulated: true`; never remove that flag when consuming
// this data, and never present it as a real LinkedIn account, post, or applicant.
import { randomUUID } from 'crypto';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { generateSimulatedLinkedInApplicants } from '../../services/ai.service';
import { createInterviewAndSendInvite } from '../candidate.routes';

const router = Router();
router.use(authenticate);

const LINKEDIN_PROFILE_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Guesses a display name from a LinkedIn profile slug, e.g.
// "john-doe-4a2b3c1d" -> "John Doe". This is simple pattern matching on the
// URL, NOT a real profile lookup — LinkedIn's slug format is not documented
// and this is best-effort only.
function guessNameFromSlug(slug: string): string {
  const words = slug.split('-').filter((w) => {
    // Drop trailing random-looking ID segments (long alphanumeric mixes with digits)
    const looksLikeId = /\d/.test(w) && w.length >= 6;
    return !looksLikeId;
  });
  if (words.length === 0) return 'LinkedIn Candidate';
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function getLinkedInIntegration(organizationId: string) {
  return prisma.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider: 'LINKEDIN' } },
  });
}

// GET /api/integrations/linkedin/status
router.get('/status', async (req, res, next) => {
  try {
    const integration = await getLinkedInIntegration(req.user!.organizationId);
    res.json({ success: true, integration: integration ?? null, simulated: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/linkedin/auth — simulated OAuth initiation.
// No real request to linkedin.com is made; the frontend shows its own
// simulated consent step and then calls /callback to finish "connecting".
router.get('/auth', async (_req, res, next) => {
  try {
    res.json({
      success: true,
      simulated: true,
      message: 'Simulated LinkedIn OAuth initiated. No real request to LinkedIn is made — this app has no LinkedIn partner/OAuth credentials.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/linkedin/callback — finalizes the simulated connection.
router.get('/callback', async (req, res, next) => {
  try {
    const integration = await prisma.integration.upsert({
      where: { organizationId_provider: { organizationId: req.user!.organizationId, provider: 'LINKEDIN' } },
      create: {
        organizationId: req.user!.organizationId,
        provider: 'LINKEDIN',
        status: 'CONNECTED',
        config: { simulated: true, connectedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
      update: {
        status: 'CONNECTED',
        config: { simulated: true, connectedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
    });
    res.json({ success: true, integration, simulated: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/linkedin/invite
// body: { profileUrl, email, openingId, name? }
// Deviates from the originally sketched /invite/:profileUrl path param — a
// full URL doesn't belong in a path segment. email is required and must be
// provided by the recruiter (we have no real way to extract it from a profile
// URL), so this can send a genuine interview invite to a genuine address.
router.post('/invite', async (req, res, next) => {
  try {
    const { profileUrl, email, openingId, name } = req.body as {
      profileUrl?: string;
      email?: string;
      openingId?: string;
      name?: string;
    };
    if (!openingId) throw new AppError(400, 'openingId required');
    if (!profileUrl) throw new AppError(400, 'profileUrl required');
    if (!email || !EMAIL_REGEX.test(email)) throw new AppError(400, 'A valid candidate email is required');

    const match = LINKEDIN_PROFILE_REGEX.exec(profileUrl.trim());
    if (!match) throw new AppError(400, 'profileUrl must look like https://www.linkedin.com/in/<slug>');
    const slug = match[2];

    const integration = await getLinkedInIntegration(req.user!.organizationId);
    if (integration?.status !== 'CONNECTED') throw new AppError(400, 'Connect LinkedIn before inviting candidates');

    const opening = await prisma.opening.findFirst({
      where: { id: openingId, organizationId: req.user!.organizationId },
      include: { organization: true },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const candidateName = name?.trim() || guessNameFromSlug(slug);

    const candidate = await prisma.candidate.upsert({
      where: { email_openingId: { email, openingId } },
      create: { name: candidateName, email, openingId },
      update: { name: candidateName },
    });

    const interview = await createInterviewAndSendInvite(candidate, opening);

    await prisma.auditLog.create({
      data: {
        organizationId: req.user!.organizationId,
        userId: req.user!.userId,
        action: 'CANDIDATE_IMPORTED_LINKEDIN',
        resourceType: 'CANDIDATE',
        resourceId: candidate.id,
        metadata: { profileUrl, simulated: true },
      },
    });

    res.status(201).json({
      success: true,
      candidate,
      interview,
      simulated: true,
      note: 'Name was guessed from the profile URL via simple pattern matching, not a real LinkedIn API call.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/linkedin/job-post/:openingId — simulated job posting
router.post('/job-post/:openingId', async (req, res, next) => {
  try {
    const opening = await prisma.opening.findFirst({
      where: { id: req.params.openingId, organizationId: req.user!.organizationId },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const integration = await getLinkedInIntegration(req.user!.organizationId);
    if (integration?.status !== 'CONNECTED') throw new AppError(400, 'Connect LinkedIn before posting jobs');

    const existingConfig = (integration.config as any) ?? {};
    const postedOpenings: string[] = Array.isArray(existingConfig.postedOpenings) ? existingConfig.postedOpenings : [];
    if (!postedOpenings.includes(opening.id)) postedOpenings.push(opening.id);

    const simulatedJobPostId = `sim_linkedin_job_${randomUUID().slice(0, 8)}`;
    const updated = await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncCount: { increment: 1 },
        config: { ...existingConfig, postedOpenings, simulated: true } as unknown as Prisma.InputJsonValue,
      },
    });

    res.json({
      success: true,
      simulated: true,
      jobPostId: simulatedJobPostId,
      postedAt: updated.lastSyncAt,
      message: 'Simulation mode — this job was not actually posted to LinkedIn. Production requires LinkedIn Talent Solutions API partner approval.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/linkedin/applicants/:openingId — simulated applicant list
router.get('/applicants/:openingId', async (req, res, next) => {
  try {
    const opening = await prisma.opening.findFirst({
      where: { id: req.params.openingId, organizationId: req.user!.organizationId },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const integration = await getLinkedInIntegration(req.user!.organizationId);
    if (integration?.status !== 'CONNECTED') throw new AppError(400, 'Connect LinkedIn first');

    const generated = await generateSimulatedLinkedInApplicants({
      jobTitle: opening.title,
      skills: opening.skills,
      count: 6,
    });

    const applicants = generated.map((a) => {
      const slug = `${a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomUUID().slice(0, 6)}`;
      return { ...a, profileUrl: `https://www.linkedin.com/in/${slug}` };
    });

    res.json({ success: true, applicants, simulated: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/integrations/linkedin/applicants/import
// body: { openingId, applicant: { name, profileUrl } }
// Creates a Candidate record only — deliberately never sends a real invite,
// since the email is fabricated (LinkedIn scraping/API access doesn't exist
// here). The recruiter must correct the email before inviting from the
// Candidates page.
router.post('/applicants/import', async (req, res, next) => {
  try {
    const { openingId, applicant } = req.body as {
      openingId?: string;
      applicant?: { name?: string; profileUrl?: string };
    };
    if (!openingId) throw new AppError(400, 'openingId required');
    if (!applicant?.name) throw new AppError(400, 'applicant.name required');

    const opening = await prisma.opening.findFirst({
      where: { id: openingId, organizationId: req.user!.organizationId },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const integration = await getLinkedInIntegration(req.user!.organizationId);
    if (integration?.status !== 'CONNECTED') throw new AppError(400, 'Connect LinkedIn first');

    const placeholderEmail = `${applicant.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}.${randomUUID().slice(0, 6)}@simulated-linkedin-import.example`;

    const candidate = await prisma.candidate.create({
      data: { name: applicant.name, email: placeholderEmail, openingId },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: req.user!.organizationId,
        userId: req.user!.userId,
        action: 'CANDIDATE_IMPORTED_LINKEDIN',
        resourceType: 'CANDIDATE',
        resourceId: candidate.id,
        metadata: { profileUrl: applicant.profileUrl, simulated: true, placeholderEmail: true },
      },
    });

    res.status(201).json({
      success: true,
      candidate,
      simulated: true,
      note: 'This candidate has a fabricated placeholder email since real LinkedIn contact info is not available in simulation mode. Edit the email before sending an interview invite.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
