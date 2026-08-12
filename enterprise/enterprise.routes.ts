// ─── SPLIT THIS INTO SEPARATE FILES IN backend/src/routes/ ───────────────────
// Each section marked with its filename

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/sentiment.routes.ts
// ════════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { analyseSentiment } from '../services/ai.service';

const sentimentRouter = Router();
sentimentRouter.use(authenticate);

// POST /api/sentiment/:interviewId — run sentiment analysis
sentimentRouter.post('/:interviewId', async (req, res, next) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: { id: req.params.interviewId },
      include: { responses: true, opening: { select: { organizationId: true } } },
    });
    if (!interview || interview.opening.organizationId !== req.user!.organizationId)
      throw new AppError('Interview not found', 404);

    const transcripts = interview.responses.map(r => r.transcript || '').filter(Boolean);
    if (transcripts.length === 0) throw new AppError('No transcripts available', 400);

    const result = await analyseSentiment(transcripts);

    const report = await prisma.sentimentReport.upsert({
      where: { interviewId: req.params.interviewId },
      create: { interviewId: req.params.interviewId, ...result },
      update: { ...result },
    });

    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// GET /api/sentiment/:interviewId
sentimentRouter.get('/:interviewId', async (req, res, next) => {
  try {
    const report = await prisma.sentimentReport.findUnique({
      where: { interviewId: req.params.interviewId },
    });
    res.json({ success: true, report: report ?? null });
  } catch (err) { next(err); }
});

export { sentimentRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/culturefit.routes.ts
// ════════════════════════════════════════════════════════════════════════════
import { scoreCultureFit } from '../services/ai.service';

const cultureFitRouter = Router();
cultureFitRouter.use(authenticate);

// POST /api/culture-fit/:interviewId
cultureFitRouter.post('/:interviewId', async (req, res, next) => {
  try {
    const { cultureDimensions = [], companyValues = '' } = req.body;

    const interview = await prisma.interview.findFirst({
      where: { id: req.params.interviewId },
      include: { responses: true, opening: { select: { organizationId: true, title: true } } },
    });
    if (!interview || interview.opening.organizationId !== req.user!.organizationId)
      throw new AppError('Interview not found', 404);

    const transcripts = interview.responses.map(r => r.transcript || '').filter(Boolean);
    const result = await scoreCultureFit(transcripts, cultureDimensions, companyValues);

    const score = await prisma.cultureFitScore.upsert({
      where: { interviewId: req.params.interviewId },
      create: { interviewId: req.params.interviewId, ...result },
      update: { ...result },
    });

    res.json({ success: true, score });
  } catch (err) { next(err); }
});

// GET /api/culture-fit/:interviewId
cultureFitRouter.get('/:interviewId', async (req, res, next) => {
  try {
    const score = await prisma.cultureFitScore.findUnique({
      where: { interviewId: req.params.interviewId },
    });
    res.json({ success: true, score: score ?? null });
  } catch (err) { next(err); }
});

export { cultureFitRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/retention.routes.ts
// ════════════════════════════════════════════════════════════════════════════
import { predictRetention } from '../services/ai.service';

const retentionRouter = Router();
retentionRouter.use(authenticate);

// POST /api/retention/:interviewId
retentionRouter.post('/:interviewId', async (req, res, next) => {
  try {
    const { salaryRange } = req.body;
    const interview = await prisma.interview.findFirst({
      where: { id: req.params.interviewId },
      include: { responses: true, opening: { select: { organizationId: true, title: true } } },
    });
    if (!interview || interview.opening.organizationId !== req.user!.organizationId)
      throw new AppError('Interview not found', 404);

    const transcripts = interview.responses.map(r => r.transcript || '').filter(Boolean);
    const result = await predictRetention(transcripts, interview.opening.title, salaryRange);

    const prediction = await prisma.retentionPrediction.upsert({
      where: { interviewId: req.params.interviewId },
      create: { interviewId: req.params.interviewId, ...result },
      update: { ...result },
    });

    res.json({ success: true, prediction });
  } catch (err) { next(err); }
});

// GET /api/retention/:interviewId
retentionRouter.get('/:interviewId', async (req, res, next) => {
  try {
    const prediction = await prisma.retentionPrediction.findUnique({
      where: { interviewId: req.params.interviewId },
    });
    res.json({ success: true, prediction: prediction ?? null });
  } catch (err) { next(err); }
});

export { retentionRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/offer.routes.ts
// ════════════════════════════════════════════════════════════════════════════
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { generateOfferLetter } from '../services/ai.service';

const offerRouter = Router();
offerRouter.use(authenticate);

const createOfferSchema = z.object({
  candidateId: z.string(),
  jobTitle: z.string(),
  department: z.string(),
  salary: z.string(),
  startDate: z.string(),
  reportingTo: z.string(),
  benefits: z.array(z.string()).optional(),
});

// GET /api/offers — list all offers for this org
offerRouter.get('/', async (req, res, next) => {
  try {
    const offers = await prisma.offerLetter.findMany({
      where: {
        candidate: {
          opening: { organizationId: req.user!.organizationId },
        },
      },
      include: { candidate: { select: { name: true, email: true, opening: { select: { title: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, offers });
  } catch (err) { next(err); }
});

// POST /api/offers — generate and create offer
offerRouter.post('/', validate(createOfferSchema), async (req, res, next) => {
  try {
    const { candidateId, jobTitle, department, salary, startDate, reportingTo, benefits } = req.body;

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, opening: { organizationId: req.user!.organizationId } },
      include: { opening: { select: { title: true } } },
    });
    if (!candidate) throw new AppError('Candidate not found', 404);

    const org = await prisma.organization.findUnique({ where: { id: req.user!.organizationId } });

    const htmlContent = await generateOfferLetter({
      candidateName: candidate.name,
      jobTitle, department, salary, startDate, reportingTo,
      companyName: org?.name ?? 'Our Company',
      benefits,
    });

    const offer = await prisma.offerLetter.create({
      data: { candidateId, content: htmlContent, status: 'DRAFT' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        action: 'OFFER_CREATED',
        resourceType: 'OFFER',
        resourceId: offer.id,
        metadata: { candidateId, jobTitle },
      },
    });

    res.json({ success: true, offer });
  } catch (err) { next(err); }
});

// PATCH /api/offers/:id/send — mark as sent
offerRouter.patch('/:id/send', async (req, res, next) => {
  try {
    const offer = await prisma.offerLetter.update({
      where: { id: req.params.id },
      data: { status: 'SENT', sentAt: new Date() },
    });
    res.json({ success: true, offer });
  } catch (err) { next(err); }
});

// GET /api/offers/:id
offerRouter.get('/:id', async (req, res, next) => {
  try {
    const offer = await prisma.offerLetter.findUnique({
      where: { id: req.params.id },
      include: { candidate: { select: { name: true, email: true } } },
    });
    if (!offer) throw new AppError('Offer not found', 404);
    res.json({ success: true, offer });
  } catch (err) { next(err); }
});

export { offerRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/auditlog.routes.ts
// ════════════════════════════════════════════════════════════════════════════

const auditLogRouter = Router();
auditLogRouter.use(authenticate);

// GET /api/audit-logs — paginated audit log for this org
auditLogRouter.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const where = {
      organizationId: req.user!.organizationId,
      ...(action && { action }),
      ...(resourceType && { resourceType }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

export { auditLogRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/chatbot.routes.ts
// ════════════════════════════════════════════════════════════════════════════
import { chatbotReply } from '../services/ai.service';

const chatbotRouter = Router();

// POST /api/chatbot/message — candidate-facing, no auth required
chatbotRouter.post('/message', async (req, res, next) => {
  try {
    const { candidateId, openingId, messages, userMessage } = req.body;
    if (!userMessage) throw new AppError('Message required', 400);

    const opening = await prisma.opening.findUnique({
      where: { id: openingId },
      select: { title: true, jobDescription: true, organization: { select: { name: true } } },
    });
    if (!opening) throw new AppError('Opening not found', 404);

    const allMessages = [...(messages || []), { role: 'user' as const, content: userMessage }];

    const reply = await chatbotReply(
      allMessages,
      opening.title,
      opening.organization.name,
      opening.jobDescription ?? '',
    );

    // Persist session
    if (candidateId && openingId) {
      const existing = await prisma.chatSession.findFirst({
        where: { candidateId, openingId, status: 'active' },
      });
      const updatedMessages = [...allMessages, { role: 'assistant', content: reply, timestamp: new Date().toISOString() }];
      if (existing) {
        await prisma.chatSession.update({ where: { id: existing.id }, data: { messages: updatedMessages } });
      } else {
        await prisma.chatSession.create({ data: { candidateId, openingId, messages: updatedMessages } });
      }
    }

    res.json({ success: true, reply });
  } catch (err) { next(err); }
});

export { chatbotRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/ranking.routes.ts
// ════════════════════════════════════════════════════════════════════════════
import { rankCandidates } from '../services/ai.service';

const rankingRouter = Router();
rankingRouter.use(authenticate);

// POST /api/ranking/:openingId — rank all candidates for an opening
rankingRouter.post('/:openingId', async (req, res, next) => {
  try {
    const opening = await prisma.opening.findFirst({
      where: { id: req.params.openingId, organizationId: req.user!.organizationId },
      include: {
        candidates: {
          include: {
            interviews: { include: { report: true } },
          },
        },
      },
    });
    if (!opening) throw new AppError('Opening not found', 404);

    const candidateData = opening.candidates
      .filter(c => c.interviews.some(i => i.report))
      .map(c => {
        const latestInterview = c.interviews.find(i => i.report);
        const report = latestInterview?.report as any;
        return {
          id: c.id,
          name: c.name,
          overallScore: report?.overallScore ?? 0,
          skills: (report?.skillScores ? Object.keys(report.skillScores) : []),
          summary: report?.summary ?? '',
        };
      });

    const ranked = await rankCandidates(
      candidateData,
      opening.title,
      opening.skills ?? [],
    );

    res.json({ success: true, ranked, total: ranked.length });
  } catch (err) { next(err); }
});

export { rankingRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/notifications.routes.ts
// ════════════════════════════════════════════════════════════════════════════

const notificationsRouter = Router();
notificationsRouter.use(authenticate);

// GET /api/notifications
notificationsRouter.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id, organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
notificationsRouter.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export { notificationsRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/branding.routes.ts
// ════════════════════════════════════════════════════════════════════════════

const brandingRouter = Router();
brandingRouter.use(authenticate);

// GET /api/branding
brandingRouter.get('/', async (req, res, next) => {
  try {
    const config = await prisma.brandingConfig.findUnique({
      where: { organizationId: req.user!.organizationId },
    });
    res.json({ success: true, config: config ?? null });
  } catch (err) { next(err); }
});

// PUT /api/branding — upsert branding config
brandingRouter.put('/', async (req, res, next) => {
  try {
    const { logoUrl, primaryColor, secondaryColor, companyName, tagline, emailTemplate, customDomain } = req.body;
    const config = await prisma.brandingConfig.upsert({
      where: { organizationId: req.user!.organizationId },
      create: { organizationId: req.user!.organizationId, logoUrl, primaryColor, secondaryColor, companyName, tagline, emailTemplate, customDomain },
      update: { logoUrl, primaryColor, secondaryColor, companyName, tagline, emailTemplate, customDomain },
    });
    res.json({ success: true, config });
  } catch (err) { next(err); }
});

export { brandingRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/talentpool.routes.ts
// ════════════════════════════════════════════════════════════════════════════

const talentPoolRouter = Router();
talentPoolRouter.use(authenticate);

// GET /api/talent-pool
talentPoolRouter.get('/', async (req, res, next) => {
  try {
    const entries = await prisma.talentPoolEntry.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { candidate: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, entries });
  } catch (err) { next(err); }
});

// POST /api/talent-pool — add candidate to pool
talentPoolRouter.post('/', async (req, res, next) => {
  try {
    const { candidateId, tags, notes } = req.body;
    const entry = await prisma.talentPoolEntry.create({
      data: { candidateId, organizationId: req.user!.organizationId, tags: tags ?? [], notes },
    });
    res.json({ success: true, entry });
  } catch (err) { next(err); }
});

// DELETE /api/talent-pool/:id
talentPoolRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.talentPoolEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export { talentPoolRouter };

// ════════════════════════════════════════════════════════════════════════════
// FILE: backend/src/routes/analytics.routes.ts
// ════════════════════════════════════════════════════════════════════════════

const analyticsRouter = Router();
analyticsRouter.use(authenticate);

// GET /api/analytics — org-level analytics
analyticsRouter.get('/', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalOpenings, activeOpenings, totalCandidates,
      totalInterviews, completedInterviews, totalOffers,
      recentReports, biasScores,
    ] = await Promise.all([
      prisma.opening.count({ where: { organizationId: orgId } }),
      prisma.opening.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      prisma.candidate.count({ where: { opening: { organizationId: orgId } } }),
      prisma.interview.count({ where: { opening: { organizationId: orgId } } }),
      prisma.interview.count({ where: { opening: { organizationId: orgId }, status: 'COMPLETED' } }),
      prisma.offerLetter.count({ where: { candidate: { opening: { organizationId: orgId } } } }),
      prisma.report.findMany({
        where: { interview: { opening: { organizationId: orgId }, createdAt: { gte: since } } },
        select: { overallScore: true, recommendation: true },
      }),
      prisma.biasAudit.findMany({
        where: { opening: { organizationId: orgId } },
        select: { score: true, flags: true },
      }),
    ]);

    const avgScore = recentReports.length
      ? Math.round(recentReports.reduce((s, r) => s + (r.overallScore ?? 0), 0) / recentReports.length)
      : 0;

    const avgBiasScore = biasScores.length
      ? Math.round(biasScores.reduce((s, b) => s + b.score, 0) / biasScores.length)
      : 100;

    const recommendations = recentReports.reduce((acc, r) => {
      const key = r.recommendation ?? 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      stats: {
        totalOpenings, activeOpenings, totalCandidates,
        totalInterviews, completedInterviews, totalOffers,
        avgInterviewScore: avgScore,
        avgComplianceScore: avgBiasScore,
        completionRate: totalInterviews > 0
          ? Math.round((completedInterviews / totalInterviews) * 100) : 0,
        recommendations,
      },
    });
  } catch (err) { next(err); }
});

export { analyticsRouter };
