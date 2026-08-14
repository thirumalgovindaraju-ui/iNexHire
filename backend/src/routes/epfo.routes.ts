// src/routes/epfo.routes.ts
// SIMULATION ONLY — there is no real EPFO/UAN API integration here. A genuine
// integration would call https://unifiedportal-emp.epfindia.gov.in/api and
// requires government approval from the Ministry of Labour & Employment.
// Every response from this router carries `isSimulated: true` and the
// disclaimer below; never remove either when consuming this data.
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateSimulatedEmploymentHistory, SimulatedEmploymentRecord } from '../services/ai.service';

const router = Router();
router.use(authenticate);

export const EPFO_SIMULATION_DISCLAIMER =
  'Simulation mode — production requires EPFO API approval from Ministry of Labour, Government of India.';

const UAN_REGEX = /^\d{12}$/;

interface Discrepancy {
  claim: string;
  epfoFinding: string;
  severity: 'high' | 'medium' | 'low';
}

function monthsBetween(start: string, end: string | null): number {
  const [sy, sm] = start.split('-').map(Number);
  const endDate = end ? end : new Date().toISOString().slice(0, 7);
  const [ey, em] = endDate.split('-').map(Number);
  return Math.max(0, (ey - sy) * 12 + (em - sm));
}

function computeDiscrepancies(
  history: SimulatedEmploymentRecord[],
  statedExperienceYears?: number,
  statedEmployers?: string[]
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  const totalYears = history.reduce((sum, h) => sum + monthsBetween(h.startDate, h.endDate), 0) / 12;

  if (typeof statedExperienceYears === 'number') {
    const diff = Math.abs(statedExperienceYears - totalYears);
    if (diff >= 1) {
      discrepancies.push({
        claim: `Candidate stated approximately ${statedExperienceYears} years of experience`,
        epfoFinding: `Simulated EPFO history shows approximately ${totalYears.toFixed(1)} years across ${history.length} employer(s)`,
        severity: diff >= 2 ? 'high' : 'medium',
      });
    }
  }

  if (statedEmployers?.length) {
    for (const claimed of statedEmployers) {
      const claimedLower = claimed.toLowerCase().trim();
      if (!claimedLower) continue;
      const found = history.some(
        (h) => h.employer.toLowerCase().includes(claimedLower) || claimedLower.includes(h.employer.toLowerCase())
      );
      if (!found) {
        discrepancies.push({
          claim: `Candidate claims to have worked at "${claimed}"`,
          epfoFinding: 'Not found in simulated EPFO employment history',
          severity: 'high',
        });
      }
    }
  }

  return discrepancies;
}

async function findOwnedCandidate(candidateId: string, organizationId: string) {
  return prisma.candidate.findFirst({
    where: { id: candidateId, opening: { organizationId } },
    include: { opening: { select: { title: true } } },
  });
}

// POST /api/epfo/verify
router.post('/verify', async (req, res, next) => {
  try {
    const { candidateId, uanNumber, statedExperienceYears, statedEmployers } = req.body as {
      candidateId?: string;
      uanNumber?: string;
      statedExperienceYears?: number;
      statedEmployers?: string[];
    };
    if (!candidateId) throw new AppError(400, 'candidateId required');
    if (!uanNumber) throw new AppError(400, 'uanNumber required');
    if (!UAN_REGEX.test(uanNumber)) throw new AppError(400, 'UAN must be exactly 12 digits');

    const candidate = await findOwnedCandidate(candidateId, req.user!.organizationId);
    if (!candidate) throw new AppError(404, 'Candidate not found');

    const history = await generateSimulatedEmploymentHistory({
      candidateName: candidate.name,
      roleAppliedFor: candidate.opening.title,
    });

    let status: 'VERIFIED' | 'MANUAL_REVIEW' | 'FAILED';
    let discrepancies: Discrepancy[] = [];

    if (history.length === 0) {
      status = 'FAILED';
    } else {
      discrepancies = computeDiscrepancies(history, statedExperienceYears, statedEmployers);
      status = discrepancies.length > 0 ? 'MANUAL_REVIEW' : 'VERIFIED';
    }

    const verification = await prisma.employmentVerification.upsert({
      where: { candidateId },
      create: {
        candidateId,
        uanNumber,
        verifiedAt: new Date(),
        status,
        employmentHistory: history as unknown as Prisma.InputJsonValue,
        discrepancies: discrepancies as unknown as Prisma.InputJsonValue,
        isSimulated: true,
      },
      update: {
        uanNumber,
        verifiedAt: new Date(),
        status,
        employmentHistory: history as unknown as Prisma.InputJsonValue,
        discrepancies: discrepancies as unknown as Prisma.InputJsonValue,
        isSimulated: true,
      },
    });

    res.json({ success: true, verification, disclaimer: EPFO_SIMULATION_DISCLAIMER });
  } catch (err) {
    next(err);
  }
});

// GET /api/epfo/:candidateId
router.get('/:candidateId', async (req, res, next) => {
  try {
    const candidate = await findOwnedCandidate(req.params.candidateId, req.user!.organizationId);
    if (!candidate) throw new AppError(404, 'Candidate not found');

    const verification = await prisma.employmentVerification.findUnique({
      where: { candidateId: req.params.candidateId },
    });
    res.json({ success: true, verification: verification ?? null, disclaimer: EPFO_SIMULATION_DISCLAIMER });
  } catch (err) {
    next(err);
  }
});

export default router;
