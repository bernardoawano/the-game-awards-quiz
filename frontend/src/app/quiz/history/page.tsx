import { HistoryList } from '@/components/quiz/HistoryList';
import { Pagination } from '@/components/quiz/Pagination';
import { StatsSummary } from '@/components/quiz/StatsSummary';
import { serverFetch } from '@/lib/api';
import { requireUser } from '@/lib/session';
import type { QuizHistoryPage, QuizStats } from '@/types/api';

interface HistoryPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps): Promise<React.ReactElement> {
  await requireUser();
  const params = await searchParams;
  const pageQuery = params.page !== undefined ? `?page=${params.page}` : '';

  const [stats, history] = await Promise.all([
    serverFetch<QuizStats>('/api/quiz/stats'),
    serverFetch<QuizHistoryPage>(`/api/quiz/history${pageQuery}`),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Histórico</h1>
      <StatsSummary stats={stats} />
      <div className="mt-6">
        <HistoryList items={history.items} />
      </div>
      <div className="mt-6">
        <Pagination page={history.page} pageSize={history.pageSize} total={history.total} />
      </div>
    </div>
  );
}
