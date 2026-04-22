// src/routes/report.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/reports/:interviewId
router.get('/:interviewId', async (req, res, next) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.interviewId,
        candidate: { opening: { organizationId: req.user!.organizationId } },
      },
      include: {
        candidate: {
          include: {
            opening: { select: { id: true, title: true, skills: true } },
          },
        },
        report: true,
        responses: {
          include: { question: true },
          orderBy: { question: { order: 'asc' } },
        },
        proctorLogs: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!interview) throw new AppError(404, 'Interview not found');
    if (!interview.report) {
      return res.json({
        success: true,
        status: interview.status,
        message: interview.status === 'COMPLETED'
          ? 'Report is being generated, check back in a minute'
          : 'Interview not yet completed',
      });
    }

    res.json({
      success: true,
      report: {
        ...interview.report,
        interview: {
          id: interview.id,
          startedAt: interview.startedAt,
          completedAt: interview.completedAt,
          status: interview.status,
        },
        candidate: interview.candidate,
        opening: interview.candidate.opening,
        responses: interview.responses.map((r) => ({
          question: r.question.text,
          questionType: r.question.type,
          transcript: r.transcript,
          score: r.score,
          feedback: r.feedback,
          duration: r.duration,
        })),
        proctorSummary: {
          totalEvents: interview.proctorLogs.length,
          events: interview.proctorLogs.map((l) => ({
            type: l.eventType,
            timestamp: l.timestamp,
          })),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:interviewId/decision
const decisionSchema = z.object({
  decision: z.enum(['MOVE_FORWARD', 'REJECT', 'ON_HOLD', 'PENDING']),
  notes: z.string().optional(),
});

router.patch('/:interviewId/decision', validate(decisionSchema), async (req, res, next) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.interviewId,
        candidate: { opening: { organizationId: req.user!.organizationId } },
      },
      include: { report: true },
    });

    if (!interview) throw new AppError(404, 'Interview not found');
    if (!interview.report) throw new AppError(400, 'Report not yet generated');

    const report = await prisma.report.update({
      where: { interviewId: interview.id },
      data: { decision: req.body.decision, decisionNotes: req.body.notes },
    });

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

export default router;
