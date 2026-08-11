'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import { Select } from '@/components/ui/Select';
import type { Category } from '@/types/api';

interface ExploreFiltersProps {
  years: number[];
  categories: Category[];
  selectedYear: number;
  selectedCategoryId?: number;
}

function buildUrl(year: number, categoryId?: number): string {
  const params = new URLSearchParams({ year: String(year) });
  if (categoryId !== undefined) {
    params.set('categoryId', String(categoryId));
  }
  return `/explore?${params.toString()}`;
}

export function ExploreFilters({
  years,
  categories,
  selectedYear,
  selectedCategoryId,
}: ExploreFiltersProps): React.ReactElement {
  const router = useRouter();

  function handleYearChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    router.push(buildUrl(Number(event.target.value)) as Route);
  }

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;
    router.push(buildUrl(selectedYear, value === '' ? undefined : Number(value)) as Route);
  }

  return (
    <div className="flex flex-wrap gap-4">
      <Select label="Ano" id="year-filter" value={selectedYear} onChange={handleYearChange}>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Select>
      <Select
        label="Categoria"
        id="category-filter"
        value={selectedCategoryId !== undefined ? String(selectedCategoryId) : ''}
        onChange={handleCategoryChange}
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.canonicalName}
          </option>
        ))}
      </Select>
    </div>
  );
}
