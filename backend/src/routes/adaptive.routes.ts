// backend/src/routes/adaptive.routes.ts
// Add this to interview routes OR call as standalone endpoint
// POST /api/interviews/:id/adaptive  — called after each answer to get follow-up decision

import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { getAdaptiveDecision } from '../services/adaptive.service';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/db';

const router = Router();

const schema = z.object({
  questionId: z.string(),
  answer: z.string(),
  score: z.number().min(0).max(100),
  questionNumber: z.number(),
  totalQuestions: z.number(),
  previousFollowUps: z.number().default(0),
});

// POST /api/interviews/:id/adaptive
router.post('/:id/adaptive', validate(schema), async (req, res, next) => {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: {
        candidate: {
          include: { opening: { select: { title: true } } },
        },
      },
    });
    if (!interview) throw new AppError(404, 'Interview not found');

    const question = await prisma.question.findUnique({
      where: { id: req.body.questionId },
      select: { text: true },
    });
    if (!question) throw new AppError(404, 'Question not found');

    const decision = await getAdaptiveDecision({
      jobTitle: interview.candidate.opening.title,
      question: question.text,
      answer: req.body.answer,
      score: req.body.score,
      questionNumber: req.body.questionNumber,
      totalQuestions: req.body.totalQuestions,
      previousFollowUps: req.body.previousFollowUps,
    });

    res.json({ success: true, decision });
  } catch (err) {
    next(err);
  }
});

export default router;
