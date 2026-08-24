// src/routes/toastmasters/report.routes.ts — full meeting report + awards
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(authenticate);

async function loadFullMeeting(meetingId: string, organizationId: string) {
  const meeting = await prisma.tmMeeting.findFirst({
    where: { id: meetingId, organizationId },
    include: {
      club: true,
      roleAssignments: { include: { member: true }, orderBy: { createdAt: 'asc' } },
      agendaItems: { orderBy: { sequence: 'asc' }, include: { roleAssignment: { include: { member: true } } } },
      educationSessions: { include: { presenter: true } },
      evaluations: {
        include: {
          speaker: { include: { member: true } },
          evaluator: { include: { member: true } },
        },
      },
      ahCounters: { include: { member: true } },
      grammarianLog: true,
      timerLogs: { include: { roleAssignment: { include: { member: true } } } },
      tableTopicResponses: { include: { member: true } },
      report: true,
    },
  });
  if (!meeting) throw new AppError(404, 'Meeting not found');
  return meeting;
}

// GET /api/toastmasters/:id/report — live view, no persistence
router.get('/:id/report', async (req, res, next) => {
  try {
    const meeting = await loadFullMeeting(req.params.id, req.user!.organizationId);
    res.json({ success: true, report: meeting });
  } catch (err) {
    next(err);
  }
});

const generateReportSchema = z.object({
  bestSpeakerRoleId: z.string().optional(),
  bestTableTopicId: z.string().optional(),
  bestEvaluatorRoleId: z.string().optional(),
});

// POST /api/toastmasters/:id/report/generate — persist a snapshot with awards.
// Awards are editable by the caller (e.g. General Evaluator's picks); bestSpeakerRoleId
// falls back to the highest-rated evaluation only when not explicitly provided.
router.post('/:id/report/generate', validate(generateReportSchema), async (req, res, next) => {
  try {
    const meeting = await loadFullMeeting(req.params.id, req.user!.organizationId);
    const { bestSpeakerRoleId, bestTableTopicId, bestEvaluatorRoleId } = req.body as z.infer<typeof generateReportSchema>;

    const topRatedSpeaker = meeting.evaluations
      .filter((e) => e.overallRating != null)
      .sort((a, b) => (b.overallRating ?? 0) - (a.overallRating ?? 0))[0];

    const awards = {
      bestSpeakerRoleId: bestSpeakerRoleId ?? topRatedSpeaker?.speakerRoleId,
      bestTableTopicId,
      bestEvaluatorRoleId,
    };

    const report = await prisma.tmMeetingReport.upsert({
      where: { meetingId: req.params.id },
      create: { meetingId: req.params.id, reportJson: meeting as any, ...awards },
      update: { reportJson: meeting as any, ...awards },
    });

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

export default router;
