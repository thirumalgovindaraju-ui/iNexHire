// src/middleware/requireRole.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new AppError(403, 'Admin access required'));
  }
  return next();
}

export function requireRecruiter(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'RECRUITER')) {
    return next(new AppError(403, 'Recruiter access required'));
  }
  return next();
}
