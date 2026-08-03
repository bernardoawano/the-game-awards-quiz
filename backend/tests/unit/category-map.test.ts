import { CATEGORY_MAP, normalizeCategory, slugify } from '../../prisma/category-map';
import { partitionEligibility } from '../../prisma/eligibility';
import { loadRawRows } from '../helpers/csv';

describe('CATEGORY_MAP', () => {
  const rows = loadRawRows();

  it('has every raw CSV category as a key (0 unknown)', () => {
    const rawCategories = new Set(rows.map((row) => row.category));
    const missing = [...rawCategories].filter((category) => !(category in CATEGORY_MAP));
    expect(missing).toEqual([]);
  });

  it('produces globally unique slugs for every canonical category', () => {
    const canonicals = new Set(Object.values(CATEGORY_MAP));
    const slugs = [...canonicals].map(slugify);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('never maps two categories that coexist in the same year to the same canonical', () => {
    const yearsByCategory = new Map<string, Set<number>>();
    for (const row of rows) {
      const years = yearsByCategory.get(row.category) ?? new Set<number>();
      years.add(row.year);
      yearsByCategory.set(row.category, years);
    }

    const rawCategories = [...yearsByCategory.keys()];
    for (let i = 0; i < rawCategories.length; i++) {
      for (let j = i + 1; j < rawCategories.length; j++) {
        const a = rawCategories[i]!;
        const b = rawCategories[j]!;
        if (CATEGORY_MAP[a] !== CATEGORY_MAP[b]) continue;

        const yearsA = yearsByCategory.get(a)!;
        const yearsB = yearsByCategory.get(b)!;
        const overlaps = [...yearsA].some((year) => yearsB.has(year));
        expect(overlaps).toBe(false);
      }
    }
  });

  it('keeps the 154/9 eligibility split after normalizing every category', () => {
    const normalizedRows = rows.map((row) => ({ ...row, category: normalizeCategory(row.category) }));
    const { eligible, ineligible } = partitionEligibility(normalizedRows);
    expect(eligible).toHaveLength(154);
    expect(ineligible).toHaveLength(9);
  });

  it('slugifies "Player\'s Voice" to "players-voice"', () => {
    expect(slugify("Player's Voice")).toBe('players-voice');
  });

  it('throws for an unknown category', () => {
    expect(() => normalizeCategory('Categoria Inventada')).toThrow();
  });
});
