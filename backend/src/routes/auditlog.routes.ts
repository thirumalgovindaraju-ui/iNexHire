// src/routes/auditlog.routes.ts
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireRole';

const router = Router();
router.use(authenticate);

// GET /api/audit-logs — paginated audit log for this org (admin only)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const where = {
      organizationId: req.user!.organizationId,
      ...(action && { action }),
      ...(resourceType && { resourceType }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
