// src/routes/communicationAssessment.routes.ts
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateCommunicationAssessment } from '../services/ai.service';

const router = Router();
router.use(authenticate);

async function findOwnedInterview(interviewId: string, organizationId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: {
      responses: true,
      candidate: { select: { opening: { select: { organizationId: true } } } },
    },
  });
  if (!interview || interview.candidate.opening.organizationId !== organizationId) return null;
  return interview;
}

// Shared by the manual POST route below and the auto-trigger fired from
// interview.routes.ts POST /:id/complete — no org check here, callers that need
// one (i.e. the recruiter-facing route) do it themselves before calling this.
export async function runCommunicationAssessment(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { responses: true },
  });
  if (!interview) throw new AppError(404, 'Interview not found');

  const transcript = interview.responses
    .filter((r) => r.transcript)
    .map((r, i) => `[Answer ${i + 1}]: ${r.transcript}`)
    .join('\n\n');
  if (!transcript) throw new AppError(400, 'No transcripts available for this interview');

  const result = await generateCommunicationAssessment(transcript, {
    startedAt: interview.startedAt ?? interview.createdAt,
    endedAt: interview.completedAt ?? new Date(),
  });

  const data = {
    overallScore: result.overallScore,
    communicationScore: result.communicationScore,
    communicationLevel: result.communicationLevel,
    summary: result.summary,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    durationSeconds: result.durationSeconds,
    linguisticAccuracy: result.linguisticAccuracy as unknown as Prisma.InputJsonValue,
    phoneticClarity: result.phoneticClarity as unknown as Prisma.InputJsonValue,
    vocalProsody: result.vocalProsody as unknown as Prisma.InputJsonValue,
    operationalFluency: result.operationalFluency as unknown as Prisma.InputJsonValue,
    lexicalInteractiveIntelligence: result.lexicalInteractiveIntelligence as unknown as Prisma.InputJsonValue,
  };

  return prisma.communicationAssessment.upsert({
    where: { interviewId },
    create: { interviewId, ...data },
    update: data,
  });
}

// POST /api/interviews/:id/assessment/generate — generate (or re-run) the scorecard
router.post('/:id/assessment/generate', async (req, res, next) => {
  try {
    const owned = await findOwnedInterview(req.params.id, req.user!.organizationId);
    if (!owned) throw new AppError(404, 'Interview not found');

    const assessment = await runCommunicationAssessment(req.params.id);
    res.json({ success: true, assessment });
  } catch (err) {
    next(err);
  }
});

// GET /api/interviews/:id/assessment — fetch the stored scorecard
router.get('/:id/assessment', async (req, res, next) => {
  try {
    const interview = await findOwnedInterview(req.params.id, req.user!.organizationId);
    if (!interview) throw new AppError(404, 'Interview not found');

    const assessment = await prisma.communicationAssessment.findUnique({ where: { interviewId: req.params.id } });
    res.json({ success: true, assessment: assessment ?? null });
  } catch (err) {
    next(err);
  }
});

export default router;
