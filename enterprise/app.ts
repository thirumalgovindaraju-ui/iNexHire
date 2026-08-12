// src/app.ts — REPLACE ENTIRE FILE WITH THIS
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// ─── Core Routes ──────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import openingRoutes from './routes/opening.routes';
import candidateRoutes from './routes/candidate.routes';
import interviewRoutes from './routes/interview.routes';
import reportRoutes from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';
import uploadRoutes from './routes/upload.routes';
import adaptiveRoutes from './routes/adaptive.routes';

// ─── Enterprise Routes ────────────────────────────────────────────────────────
import complianceRoutes from './routes/compliance.routes';
import { sentimentRouter }     from './routes/sentiment.routes';
import { cultureFitRouter }    from './routes/culturefit.routes';
import { retentionRouter }     from './routes/retention.routes';
import { offerRouter }         from './routes/offer.routes';
import { auditLogRouter }      from './routes/auditlog.routes';
import { chatbotRouter }       from './routes/chatbot.routes';
import { rankingRouter }       from './routes/ranking.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { brandingRouter }      from './routes/branding.routes';
import { talentPoolRouter }    from './routes/talentpool.routes';
import { analyticsRouter }     from './routes/analytics.routes';

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
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many requests, try again later' },
  }));

  app.use('/api/chatbot', rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30, // chatbot gets higher limit for real-time feel
    message: { success: false, error: 'Too many messages, slow down' },
  }));

  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

  // ─── Parsing ───────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Logging ───────────────────────────────────────────────────────────────
  if (!env.isProd) app.use(morgan('dev'));

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.nodeEnv, timestamp: new Date().toISOString() });
  });

  // ─── Core Routes ───────────────────────────────────────────────────────────
  app.use('/api/auth',        authRoutes);
  app.use('/api/openings',    openingRoutes);
  app.use('/api/candidates',  candidateRoutes);
  app.use('/api/interviews',  interviewRoutes);
  app.use('/api/interviews',  adaptiveRoutes);
  app.use('/api/reports',     reportRoutes);
  app.use('/api/dashboard',   dashboardRoutes);
  app.use('/api/upload',      uploadRoutes);

  // ─── Enterprise Routes ─────────────────────────────────────────────────────
  app.use('/api/compliance',      complianceRoutes);
  app.use('/api/sentiment',       sentimentRouter);
  app.use('/api/culture-fit',     cultureFitRouter);
  app.use('/api/retention',       retentionRouter);
  app.use('/api/offers',          offerRouter);
  app.use('/api/audit-logs',      auditLogRouter);
  app.use('/api/chatbot',         chatbotRouter);
  app.use('/api/ranking',         rankingRouter);
  app.use('/api/notifications',   notificationsRouter);
  app.use('/api/branding',        brandingRouter);
  app.use('/api/talent-pool',     talentPoolRouter);
  app.use('/api/analytics',       analyticsRouter);

  // ─── 404 ───────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // ─── Error Handler ─────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
