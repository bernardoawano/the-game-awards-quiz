import type { Request, Response } from 'express';

import type { AnswerInput, HistoryQuery } from '../schemas/quiz.schema';
import * as quizService from '../services/quiz.service';

export async function next(req: Request, res: Response): Promise<void> {
  const question = await quizService.getNextQuestion(req.user!.id);
  res.status(200).json({ question });
}

export async function answer(req: Request, res: Response): Promise<void> {
  const input = res.locals.validated as AnswerInput;
  const result = await quizService.answerQuestion(req.user!.id, input.questionId, input.nominationId);
  res.status(200).json(result);
}

export async function history(req: Request, res: Response): Promise<void> {
  const query = res.locals.validated as HistoryQuery;
  const result = await quizService.getHistory(req.user!.id, query.page, query.pageSize);
  res.status(200).json(result);
}

export async function stats(req: Request, res: Response): Promise<void> {
  const result = await quizService.getStats(req.user!.id);
  res.status(200).json(result);
}
