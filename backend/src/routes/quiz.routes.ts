import { Router } from 'express';

import * as quizController from '../controllers/quiz.controller';
import { requireAuth } from '../middlewares/require-auth';
import { validate } from '../middlewares/validate';
import { answerSchema, historyQuerySchema } from '../schemas/quiz.schema';

export const quizRoutes = Router();

quizRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
quizRoutes.use(requireAuth);

quizRoutes.get('/next', quizController.next);
quizRoutes.post('/answer', validate(answerSchema), quizController.answer);
quizRoutes.get('/history', validate(historyQuerySchema, 'query'), quizController.history);
quizRoutes.get('/stats', quizController.stats);
