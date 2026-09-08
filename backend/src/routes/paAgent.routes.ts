// src/routes/paAgent.routes.ts — AI PA Agent: daily briefing (emails + calendar
// summarized into action items), action-item tracking, and draft-only email
// composition (see services/google.service.ts for why this can never send mail).
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { fetchRecentEmails, fetchTodayEvents, createGmailDraft } from '../services/google.service';
import { generatePaBriefing, generatePaEmailDraft } from '../services/ai.service';

const router = Router();
router.use(authenticate);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

async function buildAndStoreBriefing(userId: string, organizationId: string) {
  const [emails, events, user] = await Promise.all([
    fetchRecentEmails(userId),
    fetchTodayEvents(userId),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  const result = await generatePaBriefing({ userName: user.name, emails, events });
  const date = todayKey();

  const briefing = await prisma.paBriefing.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, summary: result as any },
    update: { summary: result as any, generatedAt: new Date() },
  });

  // Replace this run's auto-generated action items (manual ones, if ever added, are
  // untouched since they won't have briefingId set to this briefing).
  await prisma.paActionItem.deleteMany({ where: { briefingId: briefing.id } });
  if (result.actionItems.length) {
    await prisma.paActionItem.createMany({
      data: result.actionItems.map((item) => ({
        userId,
        briefingId: briefing.id,
        title: item.title,
        description: item.description,
        sourceType: item.sourceGmailId ? 'EMAIL' : 'MANUAL',
        sourceRef: item.sourceGmailId ?? null,
      })),
    });
  }

  // Surface today's schedule through the existing notification bell rather than
  // building separate reminder-delivery infrastructure.
  if (result.scheduleHighlights.length) {
    await prisma.notification.createMany({
      data: result.scheduleHighlights.map((h) => ({
        userId,
        organizationId,
        type: 'PA_SCHEDULE_HIGHLIGHT',
        title: h.title,
        message: `Today at ${h.time}`,
        resourceType: 'PA_BRIEFING',
        resourceId: briefing.id,
      })),
    });
  }

  return briefing;
}

// GET /api/pa/briefing/today — returns today's briefing, generating it on first visit.
router.get('/briefing/today', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const date = todayKey();
    let briefing = await prisma.paBriefing.findUnique({ where: { userId_date: { userId, date } } });
    if (!briefing) briefing = await buildAndStoreBriefing(userId, req.user!.organizationId);

    const actionItems = await prisma.paActionItem.findMany({
      where: { userId, briefingId: briefing.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, briefing, actionItems });
  } catch (err) {
    next(err);
  }
});

// POST /api/pa/briefing/refresh — force-regenerates today's briefing.
router.post('/briefing/refresh', async (req, res, next) => {
  try {
    const briefing = await buildAndStoreBriefing(req.user!.userId, req.user!.organizationId);
    const actionItems = await prisma.paActionItem.findMany({
      where: { userId: req.user!.userId, briefingId: briefing.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, briefing, actionItems });
  } catch (err) {
    next(err);
  }
});

const updateActionItemSchema = z.object({ status: z.enum(['PENDING', 'DONE', 'DISMISSED']) });

// PATCH /api/pa/action-items/:id
router.patch('/action-items/:id', validate(updateActionItemSchema), async (req, res, next) => {
  try {
    const { status } = req.body as z.infer<typeof updateActionItemSchema>;
    const existing = await prisma.paActionItem.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!existing) throw new AppError(404, 'Action item not found');
    const item = await prisma.paActionItem.update({ where: { id: existing.id }, data: { status } });
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

const createDraftSchema = z.object({ instruction: z.string().min(1), context: z.string().optional() });

// POST /api/pa/drafts — draft an email from a natural-language instruction, and save it
// as a real Gmail draft (never sent — see google.service.ts).
router.post('/drafts', validate(createDraftSchema), async (req, res, next) => {
  try {
    const { instruction, context } = req.body as z.infer<typeof createDraftSchema>;
    const { to, subject, body } = await generatePaEmailDraft({ instruction, context });
    const gmailDraftId = await createGmailDraft(req.user!.userId, { to: to || undefined, subject, body });
    const draft = await prisma.paEmailDraft.create({
      data: {
        userId: req.user!.userId,
        instruction,
        toEmail: to || null,
        subject,
        body,
        gmailDraftId,
        status: 'CREATED_IN_GMAIL',
      },
    });
    res.status(201).json({ success: true, draft });
  } catch (err) {
    next(err);
  }
});

// GET /api/pa/drafts
router.get('/drafts', async (req, res, next) => {
  try {
    const drafts = await prisma.paEmailDraft.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, drafts });
  } catch (err) {
    next(err);
  }
});

export default router;
