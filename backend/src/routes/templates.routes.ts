// src/routes/templates.routes.ts
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/templates — list templates, optionally filtered by sector/level
router.get('/', async (req, res, next) => {
  try {
    const { sector, level } = req.query as { sector?: string; level?: string };
    const templates = await prisma.jobTemplate.findMany({
      where: {
        isActive: true,
        ...(sector && { sector }),
        ...(level && { level }),
      },
      orderBy: [{ sector: 'asc' }, { title: 'asc' }],
    });
    res.json({ success: true, templates });
  } catch (err) {
    next(err);
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const template = await prisma.jobTemplate.findUnique({ where: { id: req.params.id } });
    if (!template) throw new AppError(404, 'Template not found');
    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
});

export default router;
