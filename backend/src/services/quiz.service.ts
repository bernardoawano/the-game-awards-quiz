import { AppError } from '../errors/AppError';
import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { computeQuizStats, isAnswerCorrect } from '../lib/quiz-scoring';

const nominationSelect = { id: true, nominee: true, company: true } as const satisfies Prisma.NominationSelect;
const categorySelect = { id: true, canonicalName: true } as const satisfies Prisma.CategorySelect;

type NominationSummary = Prisma.NominationGetPayload<{ select: typeof nominationSelect }>;

export interface QuizQuestionDto {
  id: number;
  year: number;
  category: Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;
  nominations: NominationSummary[];
}

export async function getNextQuestion(userId: number): Promise<QuizQuestionDto | null> {
  const pending = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM quiz_questions q
    WHERE NOT EXISTS (
      SELECT 1 FROM quiz_attempts a
      WHERE a.quiz_question_id = q.id AND a.user_id = ${userId}
    )
    ORDER BY random()
    LIMIT 1
  `;

  const next = pending[0];
  if (next === undefined) {
    return null;
  }

  const question = await prisma.quizQuestion.findUniqueOrThrow({
    where: { id: next.id },
    select: { id: true, year: true, categoryId: true, category: { select: categorySelect } },
  });

  const nominations = await prisma.nomination.findMany({
    where: { year: question.year, categoryId: question.categoryId },
    select: nominationSelect,
    orderBy: { nominee: 'asc' },
  });

  return { id: question.id, year: question.year, category: question.category, nominations };
}

export async function answerQuestion(
  userId: number,
  questionId: number,
  nominationId: number,
): Promise<{ isCorrect: boolean; correctNomination: NominationSummary }> {
  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: { year: true, categoryId: true, correctNominationId: true },
  });
  if (question === null) {
    throw AppError.notFound();
  }

  const chosenNomination = await prisma.nomination.findFirst({
    where: { id: nominationId, year: question.year, categoryId: question.categoryId },
    select: { id: true },
  });
  if (chosenNomination === null) {
    throw AppError.validation('Este indicado não pertence a esta pergunta.');
  }

  const isCorrect = isAnswerCorrect(nominationId, question.correctNominationId);

  try {
    await prisma.quizAttempt.create({
      data: { userId, quizQuestionId: questionId, chosenNominationId: nominationId, isCorrect },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw AppError.questionAlreadyAnswered();
    }
    throw error;
  }

  const correctNomination = await prisma.nomination.findUniqueOrThrow({
    where: { id: question.correctNominationId },
    select: nominationSelect,
  });

  return { isCorrect, correctNomination };
}

const historySelect = {
  id: true,
  isCorrect: true,
  answeredAt: true,
  chosenNomination: { select: { id: true, nominee: true } },
  quizQuestion: {
    select: {
      year: true,
      category: { select: categorySelect },
      correctNomination: { select: { id: true, nominee: true } },
    },
  },
} as const satisfies Prisma.QuizAttemptSelect;

type HistoryRow = Prisma.QuizAttemptGetPayload<{ select: typeof historySelect }>;

function toHistoryItem(row: HistoryRow) {
  return {
    id: row.id,
    year: row.quizQuestion.year,
    category: row.quizQuestion.category,
    chosenNomination: row.chosenNomination,
    correctNomination: row.quizQuestion.correctNomination,
    isCorrect: row.isCorrect,
    answeredAt: row.answeredAt,
  };
}

export async function getHistory(
  userId: number,
  page: number,
  pageSize: number,
): Promise<{ items: ReturnType<typeof toHistoryItem>[]; page: number; pageSize: number; total: number }> {
  const [rows, total] = await prisma.$transaction([
    prisma.quizAttempt.findMany({
      where: { userId },
      select: historySelect,
      orderBy: { answeredAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quizAttempt.count({ where: { userId } }),
  ]);

  return { items: rows.map(toHistoryItem), page, pageSize, total };
}

export async function getStats(
  userId: number,
): Promise<{ answered: number; correct: number; accuracy: number; remaining: number }> {
  const [totalQuestions, answered, correct] = await prisma.$transaction([
    prisma.quizQuestion.count(),
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.quizAttempt.count({ where: { userId, isCorrect: true } }),
  ]);

  return computeQuizStats({ totalQuestions, answered, correct });
}
