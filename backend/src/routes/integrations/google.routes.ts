// src/routes/integrations/google.routes.ts — real Google OAuth connect flow for the
// AI PA Agent. Unlike integrations/linkedin.routes.ts (simulated, org-level), this is a
// genuine per-user OAuth connection to the user's own Gmail + Calendar, stored on
// PaGoogleAccount (see prisma/schema.prisma for the no-send-scope rationale).
import { Router } from 'express';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { signOAuthState, verifyOAuthState } from '../../utils/jwt';
import { getAuthUrl, exchangeCodeForTokens } from '../../services/google.service';

const router = Router();

// GET /api/integrations/google/connect — behind auth, called via XHR from the SPA.
router.get('/connect', authenticate, async (req, res, next) => {
  try {
    if (!env.googleClientId || !env.googleClientSecret) {
      throw new AppError(503, 'Google OAuth is not configured on this server yet');
    }
    // Google's callback is a plain top-level browser redirect and can't carry our
    // Authorization header, so identify the user via a short-lived signed "state"
    // round-tripped through Google instead.
    res.json({ success: true, url: getAuthUrl(signOAuthState(req.user!.userId)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/google/status — behind auth, called via XHR from the SPA.
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const account = await prisma.paGoogleAccount.findUnique({ where: { userId: req.user!.userId } });
    res.json({ success: true, connected: !!account, googleEmail: account?.googleEmail ?? null });
  } catch (err) {
    next(err);
  }
});

// GET /api/integrations/google/callback?code=...&state=...
// NOT behind `authenticate` — Google redirects the browser here directly (a plain
// top-level navigation, no Authorization header), so the user is identified via the
// signed `state` param minted in /connect instead. Redirects back into the app rather
// than returning JSON, since this isn't an XHR call.
router.get('/callback', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  try {
    if (!code || !state) throw new AppError(400, 'Missing authorization code or state');
    const { userId } = verifyOAuthState(state);
    const tokens = await exchangeCodeForTokens(code);
    await prisma.paGoogleAccount.upsert({
      where: { userId },
      create: {
        userId,
        googleEmail: tokens.googleEmail,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scope: tokens.scope,
        tokenExpiresAt: new Date(tokens.expiryDate),
      },
      update: {
        googleEmail: tokens.googleEmail,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scope: tokens.scope,
        tokenExpiresAt: new Date(tokens.expiryDate),
        connectedAt: new Date(),
      },
    });
    res.redirect(`${env.appUrl}/pa-agent?connected=1`);
  } catch (err) {
    console.error('[google.routes] callback failed:', err);
    res.redirect(`${env.appUrl}/pa-agent?connected=0`);
  }
});

// DELETE /api/integrations/google/disconnect — behind auth, called via XHR from the SPA.
router.delete('/disconnect', authenticate, async (req, res, next) => {
  try {
    await prisma.paGoogleAccount.deleteMany({ where: { userId: req.user!.userId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
