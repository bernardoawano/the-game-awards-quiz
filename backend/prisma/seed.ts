import { normalizeCategory, slugify } from './category-map';
import { partitionEligibility } from './eligibility';
import { prisma } from '../src/lib/prisma';
import { loadRawRows, type RawRow } from '../tests/helpers/csv';

const FORCE = process.argv.includes('--force');

function mustGet<K, V>(map: Map<K, V>, key: K, context: string): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`${context}: chave não encontrada (${String(key)})`);
  }
  return value;
}

function normalizeRows(rows: RawRow[]): { normalized: RawRow[]; unknown: string[] } {
  const unknown = new Set<string>();
  const normalized: RawRow[] = [];
  for (const row of rows) {
    try {
      normalized.push({ ...row, category: normalizeCategory(row.category) });
    } catch {
      unknown.add(row.category);
    }
  }
  return { normalized, unknown: [...unknown] };
}

async function assertCanReseed(): Promise<void> {
  const existingAttempts = await prisma.quizAttempt.count();
  if (existingAttempts > 0 && !FORCE) {
    console.error(
      `Encontradas ${existingAttempts} tentativa(s) de quiz já respondidas. ` +
        'Rode "npx tsx prisma/seed.ts --force" (dentro de backend/) para apagar o catálogo e recriar, ' +
        'ou "npm run db:reset -w backend" para recriar o banco inteiro do zero.',
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const rawRows = loadRawRows();
  const { normalized, unknown } = normalizeRows(rawRows);

  if (unknown.length > 0) {
    console.error('Categorias desconhecidas encontradas no CSV (fora do CATEGORY_MAP):');
    for (const category of unknown) console.error(`  - ${category}`);
    process.exit(1);
  }

  await assertCanReseed();

  const { eligible, ineligible } = partitionEligibility(normalized);
  const canonicalCategories = [...new Set(normalized.map((row) => row.category))].sort();

  await prisma.$transaction([
    ...(FORCE ? [prisma.quizAttempt.deleteMany()] : []),
    prisma.quizQuestion.deleteMany(),
    prisma.nomination.deleteMany(),
    prisma.category.deleteMany(),
    prisma.category.createMany({
      data: canonicalCategories.map((canonicalName) => ({ canonicalName, slug: slugify(canonicalName) })),
    }),
  ]);

  const categories = await prisma.category.findMany();
  const categoryIdByName = new Map(categories.map((c) => [c.canonicalName, c.id]));

  await prisma.nomination.createMany({
    data: normalized.map((row) => ({
      year: row.year,
      categoryId: mustGet(categoryIdByName, row.category, 'categoryIdByName'),
      nominee: row.nominee,
      company: row.company,
      isWinner: row.isWinner,
      votedBy: row.votedBy,
    })),
  });

  const nominations = await prisma.nomination.findMany();
  const nominationIdByKey = new Map(nominations.map((n) => [`${n.year}|${n.categoryId}|${n.nominee}`, n.id]));

  const winnerNomineeByCombo = new Map<string, string>();
  for (const row of normalized) {
    if (row.isWinner) winnerNomineeByCombo.set(`${row.year}|${row.category}`, row.nominee);
  }

  await prisma.quizQuestion.createMany({
    data: eligible.map((combo) => {
      const categoryId = mustGet(categoryIdByName, combo.category, 'categoryIdByName');
      const winnerNominee = mustGet(winnerNomineeByCombo, `${combo.year}|${combo.category}`, 'winnerNomineeByCombo');
      const correctNominationId = mustGet(
        nominationIdByKey,
        `${combo.year}|${categoryId}|${winnerNominee}`,
        'nominationIdByKey',
      );
      return { year: combo.year, categoryId, correctNominationId };
    }),
  });

  console.warn(`categories: ${categories.length}`);
  console.warn(`nominations: ${nominations.length} · quiz_questions: ${eligible.length} · descartadas: ${ineligible.length}`);
  for (const combo of ineligible) console.warn(`  - ${combo.year} ${combo.category}: ${combo.reason}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
