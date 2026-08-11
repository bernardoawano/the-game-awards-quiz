import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Nomination } from '@/types/api';

interface NominationsTableProps {
  nominations: Nomination[];
}

export function NominationsTable({ nominations }: NominationsTableProps): React.ReactElement {
  if (nominations.length === 0) {
    return (
      <EmptyState
        title="Nenhum indicado para este filtro"
        description="Tente escolher outro ano ou categoria."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th scope="col" className="py-2 pr-4 font-medium text-gray-700">
              Indicado
            </th>
            <th scope="col" className="py-2 pr-4 font-medium text-gray-700">
              Empresa
            </th>
            <th scope="col" className="py-2 pr-4 font-medium text-gray-700">
              Resultado
            </th>
          </tr>
        </thead>
        <tbody>
          {nominations.map((nomination) => (
            <tr key={nomination.id} className="border-b border-gray-100">
              <td className="py-2 pr-4">{nomination.nominee}</td>
              <td className="py-2 pr-4 text-gray-600">{nomination.company ?? '—'}</td>
              <td className="py-2 pr-4">{nomination.isWinner && <Badge variant="success">Vencedor</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
