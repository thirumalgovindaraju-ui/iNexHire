// src/routes/notifications.routes.ts
import { Router } from 'express';
import { prisma } from '../config/db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId, organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, read: false },
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
