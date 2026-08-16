// src/routes/proctoring.routes.ts
import { Router, Request } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { JwtPayload } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { registerClient, unregisterClient } from '../services/sseProctoring.service';

const router = Router();

// Browser EventSource cannot send custom headers (no Authorization: Bearer),
// only the URL it connects to — so this one endpoint accepts the JWT via a
// ?token= query param as a fallback, in addition to the header. The token is
// still fully verified either way; this isn't a lower-security path, just a
// different transport for the same credential.
function authenticateSSE(req: Request): JwtPayload {
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = headerToken ?? queryToken;
  if (!token) throw new AppError(401, 'No token provided');
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

// GET /api/proctoring/stream/:interviewId — recruiter subscribes while
// viewing a live interview; see interview.routes.ts's proctor-event handler
// for where events actually get pushed to this stream.
router.get('/stream/:interviewId', async (req, res, next) => {
  try {
    const user = authenticateSSE(req);

    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.interviewId,
        candidate: {
          opening: {
            organizationId: user.organizationId,
            ...(user.role !== 'ADMIN' ? { createdById: user.userId } : {}),
          },
        },
      },
    });
    if (!interview) throw new AppError(404, 'Interview not found');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(': connected\n\n');

    registerClient(req.params.interviewId, res);
    req.on('close', () => unregisterClient(req.params.interviewId, res));
  } catch (err) {
    next(err);
  }
});

export default router;
