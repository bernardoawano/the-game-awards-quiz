import type { Route } from 'next';
import Link from 'next/link';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function Pagination({ page, pageSize, total }: PaginationProps): React.ReactElement | null {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginação do histórico" className="flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link href={`/quiz/history?page=${page - 1}` as Route}>Anterior</Link>
      ) : (
        <span className="text-gray-400">Anterior</span>
      )}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/quiz/history?page=${page + 1}` as Route}>Próxima</Link>
      ) : (
        <span className="text-gray-400">Próxima</span>
      )}
    </nav>
  );
}
