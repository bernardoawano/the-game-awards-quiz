import { partitionEligibility } from '../../prisma/eligibility';
import { loadRawRows } from '../helpers/csv';

describe('partitionEligibility', () => {
  const { eligible, ineligible } = partitionEligibility(loadRawRows());

  it('finds 154 eligible and 9 ineligible combinations in the real dataset', () => {
    expect(eligible).toHaveLength(154);
    expect(ineligible).toHaveLength(9);
  });

  it('names the 9 ineligible combinations with their exact reason', () => {
    const byKey = new Map(ineligible.map((combo) => [`${combo.year}|${combo.category}`, combo.reason]));

    expect(byKey.get('2014|ESports Team of the Year')).toBe('MULTIPLE_WINNERS');
    expect(byKey.get('2014|Trending Gamer')).toBe('NO_WINNER');
    expect(byKey.get('2014|Industry Icon Award')).toBe('SINGLE_NOMINEE');
    expect(byKey.get('2015|Industry Icon Award')).toBe('SINGLE_NOMINEE');
    expect(byKey.get('2016|ESports Game of the Year')).toBe('NO_WINNER');
    expect(byKey.get('2016|Industry Icon Award')).toBe('SINGLE_NOMINEE');
    expect(byKey.get('2017|Industry Icon Award')).toBe('SINGLE_NOMINEE');
    expect(byKey.get('2018|Industry Icon Award')).toBe('SINGLE_NOMINEE');
    expect(byKey.get('2019|Global Gaming Citizens')).toBe('MULTIPLE_WINNERS');
    expect(byKey.size).toBe(9);
  });

  it('treats 2016 Best Fan Creation as eligible with 2 nominees', () => {
    const combo = eligible.find((entry) => entry.year === 2016 && entry.category === 'Best Fan Creation');
    expect(combo).toMatchObject({ nomineeCount: 2, winnerCount: 1 });
  });

  it('flags MULTIPLE_WINNERS for a synthetic combo with 2 winners', () => {
    const result = partitionEligibility([
      { year: 2099, category: 'Synthetic', nominee: 'A', isWinner: true },
      { year: 2099, category: 'Synthetic', nominee: 'B', isWinner: true },
    ]);
    expect(result.ineligible).toEqual([
      { year: 2099, category: 'Synthetic', nomineeCount: 2, winnerCount: 2, reason: 'MULTIPLE_WINNERS' },
    ]);
  });

  it('flags NO_WINNER for a synthetic combo with 0 winners', () => {
    const result = partitionEligibility([
      { year: 2099, category: 'Synthetic', nominee: 'A', isWinner: false },
      { year: 2099, category: 'Synthetic', nominee: 'B', isWinner: false },
    ]);
    expect(result.ineligible).toEqual([
      { year: 2099, category: 'Synthetic', nomineeCount: 2, winnerCount: 0, reason: 'NO_WINNER' },
    ]);
  });

  it('flags SINGLE_NOMINEE for a synthetic combo with 1 nominee', () => {
    const result = partitionEligibility([{ year: 2099, category: 'Synthetic', nominee: 'A', isWinner: true }]);
    expect(result.ineligible).toEqual([
      { year: 2099, category: 'Synthetic', nomineeCount: 1, winnerCount: 1, reason: 'SINGLE_NOMINEE' },
    ]);
  });
});
