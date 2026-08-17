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
import complianceRoutes from './routes/compliance.routes';
import offerRoutes from './routes/offer.routes';
import sentimentRoutes from './routes/sentiment.routes';
import cultureFitRoutes from './routes/culturefit.routes';
import retentionRoutes from './routes/retention.routes';
import chatbotRoutes from './routes/chatbot.routes';
import rankingRoutes from './routes/ranking.routes';
import talentPoolRoutes from './routes/talentpool.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationsRoutes from './routes/notifications.routes';
import auditLogRoutes from './routes/auditlog.routes';
import templatesRoutes from './routes/templates.routes';
import epfoRoutes from './routes/epfo.routes';
import linkedinRoutes from './routes/integrations/linkedin.routes';
import naukriRoutes from './routes/integrations/naukri.routes';
import liveVideoRoutes from './routes/livevideo.routes';
import proctoringRoutes from './routes/proctoring.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import codingRoutes from './routes/coding.routes';
import groupDiscussionRoutes from './routes/groupdiscussion.routes';
import highlightsRoutes from './routes/highlights.routes';
import compensationRoutes from './routes/compensation.routes';
import brandingRoutes from './routes/branding.routes';

export function createApp() {
  const app = express();

  // ─── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  const allowedOrigins = [env.appUrl, 'https://salmon-smoke-034fd6400.7.azurestaticapps.net'];
  app.use(cors({
    origin: env.isProd ? allowedOrigins : '*',
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
  app.use('/api/compliance', complianceRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/sentiment', sentimentRoutes);
  app.use('/api/culture-fit', cultureFitRoutes);
  app.use('/api/retention', retentionRoutes);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/api/ranking', rankingRoutes);
  app.use('/api/talent-pool', talentPoolRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/audit-logs', auditLogRoutes);
  app.use('/api/templates', templatesRoutes);
  app.use('/api/epfo', epfoRoutes);
  app.use('/api/integrations/linkedin', linkedinRoutes);
  app.use('/api/integrations/naukri', naukriRoutes);
  app.use('/api/live-video', liveVideoRoutes);
  app.use('/api/proctoring', proctoringRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/coding', codingRoutes);
  app.use('/api/gd', groupDiscussionRoutes);
  app.use('/api/highlights', highlightsRoutes);
  app.use('/api/compensation', compensationRoutes);
  app.use('/api/branding', brandingRoutes);

  // ─── 404 ───────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // ─── Error Handler ─────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
