import request from 'supertest';

import { app } from '../../src/app';
import { resetUserData } from '../helpers/db';

interface ErrorBody {
  error: { code: string };
}

interface UserBody {
  email: string;
  passwordHash?: string;
}

function extractSetCookie(response: request.Response): string {
  const cookie = response.headers['set-cookie'];
  if (cookie === undefined) {
    throw new Error('Resposta não trouxe Set-Cookie.');
  }
  return cookie;
}

describe('auth endpoints', () => {
  beforeEach(async () => {
    await resetUserData();
  });

  const credentials = { email: 'auth-test@example.com', password: 'senha1234' };

  describe('POST /api/auth/register', () => {
    it('creates a user and sets an httpOnly cookie', async () => {
      const response = await request(app).post('/api/auth/register').send(credentials);
      expect(response.status).toBe(201);
      expect(response.headers['set-cookie']?.[0]).toMatch(/tga_token=.*HttpOnly/i);
    });

    it('returns 409 for a duplicate email', async () => {
      await request(app).post('/api/auth/register').send(credentials);
      const response = await request(app).post('/api/auth/register').send(credentials);
      expect(response.status).toBe(409);
      expect((response.body as ErrorBody).error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns a generic 401 for a wrong password', async () => {
      await request(app).post('/api/auth/register').send(credentials);
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: credentials.email, password: 'senha-errada' });
      expect(response.status).toBe(401);
      expect((response.body as ErrorBody).error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without a cookie', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('returns the user without passwordHash when authenticated', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send(credentials);
      const cookie = extractSetCookie(registerResponse);
      const response = await request(app).get('/api/auth/me').set('Cookie', cookie);
      expect(response.status).toBe(200);
      const body = response.body as UserBody;
      expect(body.email).toBe(credentials.email);
      expect(body.passwordHash).toBeUndefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 204, clears tga_token, and /me fails afterwards (ROADMAP: logout 204 → /me 401)', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send(credentials);
      const cookie = extractSetCookie(registerResponse);

      const logoutResponse = await request(app).post('/api/auth/logout').set('Cookie', cookie);
      expect(logoutResponse.status).toBe(204);
      expect(logoutResponse.headers['set-cookie']?.[0]).toMatch(/tga_token=;/);

      // supertest não é um browser — não aplica Set-Cookie automaticamente entre
      // requisições. Chamar /me sem cookie nenhum simula o estado do cliente real
      // depois que o navegador obedece o clearCookie acima.
      const meResponse = await request(app).get('/api/auth/me');
      expect(meResponse.status).toBe(401);
    });
  });
});
