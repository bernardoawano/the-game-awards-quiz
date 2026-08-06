import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../lib/jwt';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: unknown = req.cookies[AUTH_COOKIE_NAME];

  if (typeof token !== 'string') {
    next(AppError.unauthenticated());
    return;
  }

  try {
    const userId = verifyAuthToken(token);
    req.user = { id: userId };
    next();
  } catch {
    next(AppError.unauthenticated());
  }
}
