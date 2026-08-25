// src/routes/toastmasters/members.routes.ts — club member directory
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/members
router.get('/members', async (req, res, next) => {
  try {
    const members = await prisma.tmMember.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, members });
  } catch (err) {
    next(err);
  }
});

const createMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  memberNumber: z.string().optional(),
  pathwaysPath: z.string().optional(),
  level: z.string().optional(),
  baseUserId: z.string().optional(),
  active: z.boolean().optional(),
});

// POST /api/toastmasters/members
router.post('/members', validate(createMemberSchema), async (req, res, next) => {
  try {
    const member = await prisma.tmMember.create({
      data: { organizationId: req.user!.organizationId, ...(req.body as z.infer<typeof createMemberSchema>) },
    });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
});

const updateMemberSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  memberNumber: z.string().optional(),
  pathwaysPath: z.string().optional(),
  level: z.string().optional(),
  active: z.boolean().optional(),
});

// PATCH /api/toastmasters/members/:memberId
router.patch('/members/:memberId', validate(updateMemberSchema), async (req, res, next) => {
  try {
    const existing = await prisma.tmMember.findFirst({
      where: { id: req.params.memberId, organizationId: req.user!.organizationId },
    });
    if (!existing) throw new AppError(404, 'Member not found');

    const member = await prisma.tmMember.update({
      where: { id: req.params.memberId },
      data: req.body as z.infer<typeof updateMemberSchema>,
    });
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
});

// GET /api/toastmasters/members/:memberId/last-evaluator
// Looks up who most recently evaluated this member, across past meetings —
// used by the role assignment UI to suggest re-pairing a speaker with their
// previous evaluator.
router.get('/members/:memberId/last-evaluator', async (req, res, next) => {
  try {
    const member = await prisma.tmMember.findFirst({
      where: { id: req.params.memberId, organizationId: req.user!.organizationId },
    });
    if (!member) throw new AppError(404, 'Member not found');

    const evaluation = await prisma.tmEvaluation.findFirst({
      where: {
        speaker: { memberId: req.params.memberId },
        meeting: { organizationId: req.user!.organizationId },
      },
      orderBy: { createdAt: 'desc' },
      include: { evaluator: { include: { member: true } } },
    });

    res.json({ success: true, evaluatorMember: evaluation?.evaluator.member ?? null });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/toastmasters/members/:memberId — role assignments referencing this
// member are set to unassigned automatically (optional FK, ON DELETE SET NULL);
// required-FK references (e.g. TmAhCounter) instead hit P2003, which errorHandler
// turns into a clean 409 rather than a 500.
router.delete('/members/:memberId', async (req, res, next) => {
  try {
    const existing = await prisma.tmMember.findFirst({
      where: { id: req.params.memberId, organizationId: req.user!.organizationId },
    });
    if (!existing) throw new AppError(404, 'Member not found');

    await prisma.tmMember.delete({ where: { id: req.params.memberId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
