// src/routes/toastmasters/roles.routes.ts — role assignment + speech details
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';
import { findOwnedMeeting } from './helpers';

const router = Router();
router.use(authenticate);

// GET /api/toastmasters/:id/roles
router.get('/:id/roles', async (req, res, next) => {
  try {
    await findOwnedMeeting(req.params.id, req.user!.organizationId);
    const roles = await prisma.tmRoleAssignment.findMany({
      where: { meetingId: req.params.id },
      include: { member: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, roles });
  } catch (err) {
    next(err);
  }
});

const assignRoleSchema = z.object({
  memberId: z.string().nullable().optional(),
  assigneeType: z.enum(['HUMAN', 'AI_AGENT']).optional(),
  speechTitle: z.string().optional(),
  speechProject: z.string().optional(),
  manualNumber: z.string().optional(),
  pathwaysProject: z.string().optional(),
  greenMins: z.number().int().positive().optional(),
  yellowMins: z.number().int().positive().optional(),
  redMins: z.number().int().positive().optional(),
});

// PATCH /api/toastmasters/roles/:roleId — assign member / AI agent / speech details
router.patch('/roles/:roleId', validate(assignRoleSchema), async (req, res, next) => {
  try {
    const existing = await prisma.tmRoleAssignment.findFirst({
      where: { id: req.params.roleId, meeting: { organizationId: req.user!.organizationId } },
    });
    if (!existing) throw new AppError(404, 'Role not found');

    const { assigneeType, ...rest } = req.body as z.infer<typeof assignRoleSchema>;
    const data: Record<string, unknown> = { ...rest };
    if (assigneeType) {
      data.assigneeType = assigneeType;
      // Switching to/from AI Agent always starts the agent state from a clean
      // slate; any content already generated in TmSpeechAnalysis/TmEvaluation/etc.
      // is left alone — a human recording over it, or the agent re-running, will
      // naturally overwrite it via those tables' own unique-key upserts.
      if (assigneeType === 'AI_AGENT') data.memberId = null;
      data.agentStatus = null;
      data.agentOutput = null;
      data.agentRunAt = null;
    }

    const role = await prisma.tmRoleAssignment.update({
      where: { id: req.params.roleId },
      data,
      include: { member: true },
    });
    res.json({ success: true, role });
  } catch (err) {
    next(err);
  }
});

export default router;
