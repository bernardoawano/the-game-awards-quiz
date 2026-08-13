import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizComplete } from '@/components/quiz/QuizComplete';
import { serverFetch } from '@/lib/api';
import { requireUser } from '@/lib/session';
import type { QuizQuestion, QuizStats } from '@/types/api';

export default async function QuizPage(): Promise<React.ReactElement> {
  await requireUser();

  const [{ question }, stats] = await Promise.all([
    serverFetch<{ question: QuizQuestion | null }>('/api/quiz/next'),
    serverFetch<QuizStats>('/api/quiz/stats'),
  ]);

  if (question === null) {
    return <QuizComplete stats={stats} />;
  }

  return <QuizCard key={question.id} question={question} />;
}
