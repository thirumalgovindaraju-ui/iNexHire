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
