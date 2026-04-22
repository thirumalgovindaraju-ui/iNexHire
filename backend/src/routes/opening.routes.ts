// src/routes/opening.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import {
  generateJobDescription,
  generateInterviewQuestions,
  parseSkillsFromJD,
} from '../services/ai.service';

const router = Router();
router.use(authenticate);

const createOpeningSchema = z.object({
  title: z.string().min(2),
  department: z.string().optional(),
  location: z.string().optional(),
  jobDescription: z.string().min(50),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  questionCount: z.number().int().min(3).max(20).default(10),
});

const updateOpeningSchema = createOpeningSchema.partial();

// GET /api/openings
router.get('/', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      organizationId: req.user!.organizationId,
      ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [openings, total] = await Promise.all([
      prisma.opening.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { candidates: true, questions: true } },
        },
      }),
      prisma.opening.count({ where }),
    ]);

    res.json({ success: true, openings, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/openings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const opening = await prisma.opening.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { candidates: true } },
      },
    });
    if (!opening) throw new AppError(404, 'Opening not found');
    res.json({ success: true, opening });
  } catch (err) {
    next(err);
  }
});

// POST /api/openings
router.post('/', validate(createOpeningSchema), async (req, res, next) => {
  try {
    const skills = await parseSkillsFromJD(req.body.jobDescription);

    const opening = await prisma.opening.create({
      data: {
        ...req.body,
        skills,
        createdById: req.user!.userId,
        organizationId: req.user!.organizationId,
      },
    });
    res.status(201).json({ success: true, opening });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/openings/:id
router.patch('/:id', validate(updateOpeningSchema), async (req, res, next) => {
  try {
    const existing = await prisma.opening.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });
    if (!existing) throw new AppError(404, 'Opening not found');

    const data: any = { ...req.body };
    if (req.body.jobDescription) {
      data.skills = await parseSkillsFromJD(req.body.jobDescription);
    }

    const opening = await prisma.opening.update({ where: { id: req.params.id }, data });
    res.json({ success: true, opening });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/openings/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.opening.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });
    if (!existing) throw new AppError(404, 'Opening not found');
    await prisma.opening.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/openings/generate-jd
router.post('/generate-jd', async (req, res, next) => {
  try {
    const { title, department, skills, level } = req.body;
    if (!title) throw new AppError(400, 'title is required');

    const jobDescription = await generateJobDescription({ title, department, skills, level });
    const parsedSkills = await parseSkillsFromJD(jobDescription);

    res.json({ success: true, jobDescription, skills: parsedSkills });
  } catch (err) {
    next(err);
  }
});

// POST /api/openings/:id/generate-questions
router.post('/:id/generate-questions', async (req, res, next) => {
  try {
    const opening = await prisma.opening.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });
    if (!opening) throw new AppError(404, 'Opening not found');

    const { difficulty = opening.difficulty, count = opening.questionCount, replace = false } = req.body;

    const generated = await generateInterviewQuestions({
      jobTitle: opening.title,
      jobDescription: opening.jobDescription,
      skills: opening.skills,
      difficulty,
      count,
    });

    if (replace) {
      await prisma.question.deleteMany({ where: { openingId: opening.id } });
    }

    const startOrder = replace ? 1 : (await prisma.question.count({ where: { openingId: opening.id } })) + 1;

    const questions = await prisma.$transaction(
      generated.map((q, i) =>
        prisma.question.create({
          data: {
            openingId: opening.id,
            text: q.text,
            type: q.type,
            timeLimit: q.timeLimit,
            order: startOrder + i,
          },
        })
      )
    );

    res.json({ success: true, questions, count: questions.length });
  } catch (err) {
    next(err);
  }
});

export default router;
