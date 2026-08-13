import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { QuizHistoryItem } from '@/types/api';

interface HistoryListProps {
  items: QuizHistoryItem[];
}

export function HistoryList({ items }: HistoryListProps): React.ReactElement {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhuma tentativa ainda"
        description="Responda perguntas no Quiz para ver seu histórico aqui."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="rounded border border-gray-200 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">
              {item.year} · {item.category.canonicalName}
            </span>
            <Badge variant={item.isCorrect ? 'success' : 'neutral'}>{item.isCorrect ? 'Acertou' : 'Errou'}</Badge>
          </div>
          <p className="mt-1">
            Sua escolha: <strong>{item.chosenNomination.nominee}</strong> · Vencedor:{' '}
            <strong>{item.correctNomination.nominee}</strong>
          </p>
        </li>
      ))}
    </ul>
  );
}
