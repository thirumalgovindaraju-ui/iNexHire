// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import openingRoutes from './routes/opening.routes';
import candidateRoutes from './routes/candidate.routes';
import interviewRoutes from './routes/interview.routes';
import reportRoutes from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';
import uploadRoutes from './routes/upload.routes';
import adaptiveRoutes from './routes/adaptive.routes';

export function createApp() {
  const app = express();

  // ─── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: env.isProd ? env.appUrl : '*',
    credentials: true,
  }));

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20,
    message: { success: false, error: 'Too many requests, try again later' },
  }));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  }));

  // ─── Parsing ───────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Logging ───────────────────────────────────────────────────────────────
  if (!env.isProd) {
    app.use(morgan('dev'));
  }

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.nodeEnv, timestamp: new Date().toISOString() });
  });

  // ─── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/openings', openingRoutes);
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/interviews', adaptiveRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/upload', uploadRoutes);

  // ─── 404 ───────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // ─── Error Handler ─────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
