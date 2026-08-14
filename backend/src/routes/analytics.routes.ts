// src/routes/analytics.routes.ts
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/analytics — org-level analytics
router.get('/', async (req, res, next) => {
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
      prisma.opening.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.candidate.count({ where: { opening: { organizationId: orgId } } }),
      prisma.interview.count({ where: { candidate: { opening: { organizationId: orgId } } } }),
      prisma.interview.count({
        where: { candidate: { opening: { organizationId: orgId } }, status: 'COMPLETED' },
      }),
      prisma.offerLetter.count({ where: { candidate: { opening: { organizationId: orgId } } } }),
      prisma.report.findMany({
        where: {
          interview: { candidate: { opening: { organizationId: orgId } } },
          createdAt: { gte: since },
        },
        select: { overallScore: true, recommendation: true },
      }),
      prisma.biasAudit.findMany({
        where: { opening: { organizationId: orgId } },
        select: { score: true },
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
  } catch (err) {
    next(err);
  }
});

export default router;
