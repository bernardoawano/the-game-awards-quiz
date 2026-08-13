import { Card } from '@/components/ui/Card';
import type { QuizStats } from '@/types/api';

interface QuizCompleteProps {
  stats: QuizStats;
}

export function QuizComplete({ stats }: QuizCompleteProps): React.ReactElement {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 text-center">
      <h1 className="mb-4 text-2xl font-bold">Você respondeu todas as perguntas!</h1>
      <Card className="flex flex-col gap-2">
        <p>
          Acertos: <strong>{stats.correct}</strong> de <strong>{stats.answered}</strong> ({stats.accuracy}%)
        </p>
      </Card>
    </div>
  );
}
