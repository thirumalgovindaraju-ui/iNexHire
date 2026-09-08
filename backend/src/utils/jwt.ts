// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../middleware/auth';

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as any);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.refreshTokenExpiresIn } as any);
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.jwtSecret) as { userId: string };
}

/** Short-lived, signed "state" param for OAuth redirect flows (e.g. Google connect) —
 * the provider's callback is a plain top-level browser navigation and so can't carry our
 * normal Authorization header, so this carries the userId across that redirect instead. */
export function signOAuthState(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '10m' } as any);
}

export function verifyOAuthState(state: string): { userId: string } {
  return jwt.verify(state, env.jwtSecret) as { userId: string };
}
