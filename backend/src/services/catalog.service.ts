import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

const categorySelect = { id: true, canonicalName: true, slug: true } as const satisfies Prisma.CategorySelect;
type CategoryListItem = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

const nominationSelect = {
  id: true,
  year: true,
  categoryId: true,
  nominee: true,
  company: true,
  isWinner: true,
  votedBy: true,
} as const satisfies Prisma.NominationSelect;
type NominationListItem = Prisma.NominationGetPayload<{ select: typeof nominationSelect }>;

export async function getYears(): Promise<number[]> {
  // distinct + orderBy na mesma coluna: o Prisma 7 sem `nativeDistinct` deduplica em JS
  // sobre linhas já ordenadas pelo SQL, então o resultado ascendente sai correto de
  // qualquer forma — não vale adicionar a preview feature só pra isso com 805 linhas.
  const rows = await prisma.nomination.findMany({
    distinct: ['year'],
    select: { year: true },
    orderBy: { year: 'asc' },
  });
  return rows.map((row) => row.year);
}

export async function getCategories(year?: number): Promise<CategoryListItem[]> {
  return prisma.category.findMany({
    where: year !== undefined ? { nominations: { some: { year } } } : undefined,
    select: categorySelect,
    orderBy: { canonicalName: 'asc' },
  });
}

export async function getNominations(filter: {
  year?: number;
  categoryId?: number;
}): Promise<NominationListItem[]> {
  return prisma.nomination.findMany({
    where: {
      ...(filter.year !== undefined ? { year: filter.year } : {}),
      ...(filter.categoryId !== undefined ? { categoryId: filter.categoryId } : {}),
    },
    select: nominationSelect,
    orderBy: [{ year: 'asc' }, { nominee: 'asc' }],
  });
}
