import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { AUTH_COOKIE_MAX_AGE_MS, AUTH_COOKIE_NAME } from '../lib/jwt';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import * as authService from '../services/auth.service';

// Compartilhado entre set (register/login) e clear (logout) — se os atributos
// divergirem entre res.cookie e res.clearCookie, alguns browsers não limpam o cookie.
const authCookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  secure: env.NODE_ENV === 'production',
};

export async function register(req: Request, res: Response): Promise<void> {
  const input = res.locals.validated as RegisterInput;
  const { token } = await authService.register(input);
  res.cookie(AUTH_COOKIE_NAME, token, { ...authCookieOptions, maxAge: AUTH_COOKIE_MAX_AGE_MS });
  res.status(201).json({ registered: true });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = res.locals.validated as LoginInput;
  const { token } = await authService.login(input);
  res.cookie(AUTH_COOKIE_NAME, token, { ...authCookieOptions, maxAge: AUTH_COOKIE_MAX_AGE_MS });
  res.status(200).json({ loggedIn: true });
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.user!.id;
  const user = await authService.getCurrentUser(userId);
  if (user === null) {
    next(AppError.unauthenticated());
    return;
  }
  res.status(200).json(user);
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
  res.status(204).send();
}
