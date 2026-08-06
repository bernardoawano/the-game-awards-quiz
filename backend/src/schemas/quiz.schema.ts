import * as z from 'zod';

export const answerSchema = z.object({
  questionId: z.number().int().positive(),
  nominationId: z.number().int().positive(),
});
export type AnswerInput = z.infer<typeof answerSchema>;

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
