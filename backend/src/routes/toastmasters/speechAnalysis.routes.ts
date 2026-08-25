// src/routes/toastmasters/speechAnalysis.routes.ts — voice-recorded speech AI analysis
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';
import { analyzeSpeech } from '../../services/ai.service';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/speech-analysis — all analyses for a meeting (used by the report)
router.get('/:id/speech-analysis', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const analyses = await prisma.tmSpeechAnalysis.findMany({
      where: { meetingId: req.params.id },
      include: { roleAssignment: { include: { member: true } } },
    });
    res.json({ success: true, analyses });
  } catch (err) {
    next(err);
  }
});

// GET /api/toastmasters/roles/:roleAssignmentId/speech-analysis — one speaker's analysis
router.get('/roles/:roleAssignmentId/speech-analysis', async (req, res, next) => {
  try {
    const analysis = await prisma.tmSpeechAnalysis.findFirst({
      where: {
        roleAssignmentId: req.params.roleAssignmentId,
        meeting: { organizationId: req.user!.organizationId },
      },
      include: { roleAssignment: { include: { member: true } } },
    });
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
});

const analyzeSpeechSchema = z.object({
  roleAssignmentId: z.string(),
  transcript: z.string().min(1),
  durationSeconds: z.number().int().nonnegative().optional(),
});

// POST /api/toastmasters/:id/analyze-speech — run Claude analysis on a recorded transcript
router.post('/:id/analyze-speech', validate(analyzeSpeechSchema), async (req, res, next) => {
  try {
    const meeting = await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const { roleAssignmentId, transcript, durationSeconds } = req.body as z.infer<typeof analyzeSpeechSchema>;

    const role = await prisma.tmRoleAssignment.findFirst({
      where: { id: roleAssignmentId, meetingId: req.params.id },
    });
    if (!role) throw new AppError(404, 'Role assignment not found on this meeting');

    const result = await analyzeSpeech({
      transcript,
      durationSeconds,
      wordOfDay: meeting.wordOfDay ?? undefined,
    });
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

    const analysis = await prisma.tmSpeechAnalysis.upsert({
      where: { roleAssignmentId },
      create: {
        meetingId: req.params.id,
        roleAssignmentId,
        transcript,
        wordCount,
        durationSeconds,
        grammarScore: result.grammar.score,
        grammarErrors: result.grammar.errors as any,
        grammarSuggestions: result.grammar.suggestions as any,
        fillerWordCounts: result.fillerWords as any,
        contentScore: result.evaluation.contentScore,
        deliveryScore: result.evaluation.deliveryScore,
        languageScore: result.evaluation.languageScore,
        overallScore: result.evaluation.overallScore,
        commendations: result.evaluation.commendations as any,
        recommendations: result.evaluation.recommendations as any,
        openingFeedback: result.evaluation.openingFeedback,
        bodyFeedback: result.evaluation.bodyFeedback,
        conclusionFeedback: result.evaluation.conclusionFeedback,
        wordOfDayUsed: result.wordOfDayUsed,
        summary: result.summary,
      },
      update: {
        transcript,
        wordCount,
        durationSeconds,
        grammarScore: result.grammar.score,
        grammarErrors: result.grammar.errors as any,
        grammarSuggestions: result.grammar.suggestions as any,
        fillerWordCounts: result.fillerWords as any,
        contentScore: result.evaluation.contentScore,
        deliveryScore: result.evaluation.deliveryScore,
        languageScore: result.evaluation.languageScore,
        overallScore: result.evaluation.overallScore,
        commendations: result.evaluation.commendations as any,
        recommendations: result.evaluation.recommendations as any,
        openingFeedback: result.evaluation.openingFeedback,
        bodyFeedback: result.evaluation.bodyFeedback,
        conclusionFeedback: result.evaluation.conclusionFeedback,
        wordOfDayUsed: result.wordOfDayUsed,
        summary: result.summary,
      },
      include: { roleAssignment: { include: { member: true } } },
    });

    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
});

export default router;
