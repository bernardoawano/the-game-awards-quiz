import { sign, verify } from 'jsonwebtoken';

import { env } from '../config/env';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const JWT_EXPIRES_IN = '7d';

export const AUTH_COOKIE_NAME = 'tga_token';
export const AUTH_COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_MS;

export function signAuthToken(userId: number): string {
  return sign({ sub: String(userId) }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

export function verifyAuthToken(token: string): number {
  const decoded = verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Token com payload inválido.');
  }
  const userId = Number(decoded.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Token com identificador de usuário inválido.');
  }
  return userId;
}
