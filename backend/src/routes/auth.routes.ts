import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { authRateLimit } from '../middlewares/auth-rate-limit';
import { requireAuth } from '../middlewares/require-auth';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

export const authRoutes = Router();

authRoutes.use(authRateLimit);
authRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

authRoutes.post('/register', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.get('/me', requireAuth, authController.me);
authRoutes.post('/logout', authController.logout);
