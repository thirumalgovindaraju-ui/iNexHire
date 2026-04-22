// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Prisma unique constraint violation
  if ((err as any).code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A record with this value already exists',
    });
  }

  // Prisma not found
  if ((err as any).code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
