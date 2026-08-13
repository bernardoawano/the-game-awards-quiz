import { Card } from '@/components/ui/Card';
import type { QuizStats } from '@/types/api';

interface StatsSummaryProps {
  stats: QuizStats;
}

export function StatsSummary({ stats }: StatsSummaryProps): React.ReactElement {
  return (
    <Card className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-2xl font-bold">{stats.answered}</p>
        <p className="text-sm text-gray-500">Respondidas</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{stats.correct}</p>
        <p className="text-sm text-gray-500">Acertos</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{stats.accuracy}%</p>
        <p className="text-sm text-gray-500">Taxa de acerto</p>
      </div>
    </Card>
  );
}
