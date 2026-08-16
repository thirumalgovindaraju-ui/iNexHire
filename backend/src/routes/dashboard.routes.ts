// src/routes/dashboard.routes.ts
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/dashboard — admins see org-wide stats; recruiters see only
// openings they personally created (and everything under those openings).
router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId;
    const isAdmin = req.user!.role === 'ADMIN';
    const openingFilter = { organizationId: orgId, ...(isAdmin ? {} : { createdById: req.user!.userId }) };

    const [
      totalOpenings,
      activeOpenings,
      totalCandidates,
      totalInterviews,
      completedInterviews,
      evaluatedInterviews,
      recentInterviews,
      recentOpenings,
    ] = await Promise.all([
      prisma.opening.count({ where: openingFilter }),
      prisma.opening.count({ where: { ...openingFilter, isActive: true } }),
      prisma.candidate.count({ where: { opening: openingFilter } }),
      prisma.interview.count({ where: { candidate: { opening: openingFilter } } }),
      prisma.interview.count({
        where: { candidate: { opening: openingFilter }, status: 'COMPLETED' },
      }),
      prisma.interview.count({
        where: { candidate: { opening: openingFilter }, status: 'EVALUATED' },
      }),
      prisma.interview.findMany({
        where: { candidate: { opening: openingFilter } },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          candidate: { select: { name: true, email: true, opening: { select: { title: true } } } },
          report: { select: { overallScore: true, recommendation: true, decision: true } },
        },
      }),
      prisma.opening.findMany({
        where: openingFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { candidates: true } } },
      }),
    ]);

    // Average score from evaluated interviews
    const reportsWithScores = await prisma.report.findMany({
      where: { interview: { candidate: { opening: openingFilter } } },
      select: { overallScore: true, recommendation: true },
    });

    const avgScore = reportsWithScores.length
      ? Math.round(reportsWithScores.reduce((s, r) => s + r.overallScore, 0) / reportsWithScores.length)
      : 0;

    const recommendationCounts = reportsWithScores.reduce(
      (acc, r) => {
        acc[r.recommendation] = (acc[r.recommendation] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({
      success: true,
      metrics: {
        totalOpenings,
        activeOpenings,
        totalCandidates,
        totalInterviews,
        completedInterviews,
        evaluatedInterviews,
        avgScore,
        recommendationCounts,
        completionRate: totalInterviews
          ? Math.round(((completedInterviews + evaluatedInterviews) / totalInterviews) * 100)
          : 0,
      },
      recentInterviews: recentInterviews.map((i) => ({
        id: i.id,
        candidateName: i.candidate.name,
        candidateEmail: i.candidate.email,
        openingTitle: i.candidate.opening.title,
        status: i.status,
        completedAt: i.completedAt,
        score: i.report?.overallScore ?? null,
        recommendation: i.report?.recommendation ?? null,
        decision: i.report?.decision ?? null,
      })),
      recentOpenings,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
