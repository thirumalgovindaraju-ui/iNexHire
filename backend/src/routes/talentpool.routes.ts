// src/routes/talentpool.routes.ts
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/talent-pool
router.get('/', async (req, res, next) => {
  try {
    const entries = await prisma.talentPoolEntry.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { candidate: { select: { name: true, email: true, phone: true } } },
      orderBy: { addedAt: 'desc' },
    });
    res.json({ success: true, entries });
  } catch (err) {
    next(err);
  }
});

// POST /api/talent-pool — add a candidate to the pool
router.post('/', async (req, res, next) => {
  try {
    const { candidateId, notes } = req.body;
    if (!candidateId) throw new AppError(400, 'candidateId required');

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, opening: { organizationId: req.user!.organizationId } },
    });
    if (!candidate) throw new AppError(404, 'Candidate not found');

    const entry = await prisma.talentPoolEntry.create({
      data: { candidateId, organizationId: req.user!.organizationId, notes },
    });
    res.json({ success: true, entry });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/talent-pool/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await prisma.talentPoolEntry.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });
    if (!entry) throw new AppError(404, 'Talent pool entry not found');

    await prisma.talentPoolEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
