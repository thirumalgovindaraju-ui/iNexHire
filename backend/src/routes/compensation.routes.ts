// src/routes/compensation.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { generateCompensationBenchmark } from '../services/ai.service';

const router = Router();
router.use(authenticate);

const benchmarkSchema = z.object({
  jobTitle: z.string().min(2),
  location: z.string().min(2),
  minExp: z.number().min(0),
  maxExp: z.number().min(0),
});

// POST /api/compensation/benchmark
router.post('/benchmark', validate(benchmarkSchema), async (req, res, next) => {
  try {
    const { jobTitle, location, minExp, maxExp } = req.body;
    if (maxExp < minExp) throw new AppError(400, 'maxExp must be >= minExp');

    const result = await generateCompensationBenchmark({ jobTitle, location, minExp, maxExp });

    const benchmark = await prisma.compensationBenchmark.create({
      data: {
        organizationId: req.user!.organizationId,
        jobTitle,
        location,
        experienceMin: minExp,
        experienceMax: maxExp,
        p25Salary: result.p25,
        p50Salary: result.p50,
        p75Salary: result.p75,
        p90Salary: result.p90,
      },
    });

    res.status(201).json({
      success: true,
      benchmark: {
        ...benchmark,
        topCompanies: result.topCompanies,
        premiumSkills: result.premiumSkills,
        trend: result.trend,
        analysis: result.analysis,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/compensation/benchmark — existing benchmarks for this org
router.get('/benchmark', async (req, res, next) => {
  try {
    const benchmarks = await prisma.compensationBenchmark.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { generatedAt: 'desc' },
    });
    res.json({ success: true, benchmarks });
  } catch (err) {
    next(err);
  }
});

const compareSchema = z.object({
  benchmarkId: z.string(),
  expectedSalaryLakhs: z.number().min(0),
});

// POST /api/compensation/compare — deterministic percentile interpolation against
// the stored benchmark; no AI call needed for a purely numeric comparison.
router.post('/compare', validate(compareSchema), async (req, res, next) => {
  try {
    const { benchmarkId, expectedSalaryLakhs } = req.body;
    const benchmark = await prisma.compensationBenchmark.findFirst({
      where: { id: benchmarkId, organizationId: req.user!.organizationId },
    });
    if (!benchmark) throw new AppError(404, 'Benchmark not found');

    const { p25Salary, p50Salary, p75Salary, p90Salary } = benchmark;

    // Piecewise-linear interpolation across the 4 known percentile points, with
    // two extrapolated end anchors (0th ~ 60% of P25, 100th ~ 130% of P90) so
    // salaries outside the P25-P90 band still get a sensible estimated percentile.
    function estimatePercentile(salary: number): number {
      const points: [number, number][] = [
        [0, p25Salary * 0.6], [25, p25Salary], [50, p50Salary], [75, p75Salary], [90, p90Salary], [100, p90Salary * 1.3],
      ];
      for (let i = 1; i < points.length; i++) {
        const [pPrev, sPrev] = points[i - 1];
        const [pNext, sNext] = points[i];
        if (salary <= sNext || i === points.length - 1) {
          if (sNext === sPrev) return pNext;
          const ratio = (salary - sPrev) / (sNext - sPrev);
          return Math.round(pPrev + ratio * (pNext - pPrev));
        }
      }
      return 100;
    }

    const percentile = Math.max(0, Math.min(100, estimatePercentile(expectedSalaryLakhs)));

    let competitive: 'BELOW_MARKET' | 'COMPETITIVE' | 'ABOVE_MARKET' | 'HIGH_RISK';
    if (percentile < 25) competitive = 'BELOW_MARKET';
    else if (percentile <= 75) competitive = 'COMPETITIVE';
    else if (percentile <= 90) competitive = 'ABOVE_MARKET';
    else competitive = 'HIGH_RISK';

    const suggestedRange = {
      min: percentile > 75 ? p50Salary : p25Salary,
      max: percentile < 25 ? p50Salary : p75Salary,
    };

    res.json({
      success: true,
      comparison: {
        expectedSalaryLakhs,
        percentile,
        competitive,
        suggestedRange,
        benchmark: { p25Salary, p50Salary, p75Salary, p90Salary },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
