// src/routes/ranking.routes.ts
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { rankCandidates } from '../services/ai.service';

const router = Router();
router.use(authenticate);

// POST /api/ranking/:openingId — AI-rank all candidates with a report for an opening
router.post('/:openingId', async (req, res, next) => {
  try {
    const opening = await prisma.opening.findFirst({
      where: { id: req.params.openingId, organizationId: req.user!.organizationId },
      include: {
        candidates: {
          include: { interviews: { include: { report: true } } },
        },
      },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const candidateData = opening.candidates
      .filter((c) => c.interviews.some((i) => i.report))
      .map((c) => {
        const latestInterview = c.interviews.find((i) => i.report);
        const report = latestInterview?.report;
        return {
          id: c.id,
          name: c.name,
          overallScore: report?.overallScore ?? 0,
          skills: report?.skillScores ? Object.keys(report.skillScores as Record<string, number>) : [],
          summary: report?.summary ?? '',
        };
      });

    const ranked = await rankCandidates(candidateData, opening.title, opening.skills ?? []);

    res.json({ success: true, ranked, total: ranked.length });
  } catch (err) {
    next(err);
  }
});

export default router;
