import { ExploreFilters } from '@/components/explore/ExploreFilters';
import { NominationsTable } from '@/components/explore/NominationsTable';
import { serverFetch } from '@/lib/api';
import type { Category, Nomination } from '@/types/api';

interface ExplorePageProps {
  searchParams: Promise<{ year?: string; categoryId?: string }>;
}

// Só a ausência do param cai no default (undefined); presente-porém-inválido
// (ex. "abc" → NaN) segue pro backend, que já valida e responde 400 corretamente.
function parseIntParam(value: string | undefined): number | undefined {
  return value === undefined ? undefined : Number(value);
}

export default async function ExplorePage({ searchParams }: ExplorePageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const requestedYear = parseIntParam(params.year);
  const categoryId = parseIntParam(params.categoryId);

  const years = await serverFetch<number[]>('/api/years');
  const latestYear = years[years.length - 1];
  if (latestYear === undefined) {
    throw new Error('Nenhum ano disponível no catálogo.');
  }
  const year = requestedYear ?? latestYear;

  const [categories, nominations] = await Promise.all([
    serverFetch<Category[]>(`/api/categories?year=${year}`),
    serverFetch<Nomination[]>(
      `/api/nominations?year=${year}${categoryId !== undefined ? `&categoryId=${categoryId}` : ''}`,
    ),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Explorar indicações</h1>
      <ExploreFilters years={years} categories={categories} selectedYear={year} selectedCategoryId={categoryId} />
      <div className="mt-6">
        <NominationsTable nominations={nominations} />
      </div>
    </div>
  );
}
