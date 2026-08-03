export type EligibilityReason = 'MULTIPLE_WINNERS' | 'NO_WINNER' | 'SINGLE_NOMINEE';

export interface EligibilityInput {
  year: number;
  category: string;
  nominee: string;
  isWinner: boolean;
}

export interface EligibleCombo {
  year: number;
  category: string;
  nomineeCount: number;
  winnerCount: number;
}

export interface IneligibleCombo extends EligibleCombo {
  reason: EligibilityReason;
}

export function partitionEligibility(
  rows: EligibilityInput[],
): { eligible: EligibleCombo[]; ineligible: IneligibleCombo[] } {
  const groups = new Map<string, EligibleCombo>();

  for (const row of rows) {
    const key = `${row.year}|${row.category}`;
    const group = groups.get(key) ?? {
      year: row.year,
      category: row.category,
      nomineeCount: 0,
      winnerCount: 0,
    };
    group.nomineeCount += 1;
    if (row.isWinner) group.winnerCount += 1;
    groups.set(key, group);
  }

  const eligible: EligibleCombo[] = [];
  const ineligible: IneligibleCombo[] = [];

  for (const group of groups.values()) {
    if (group.nomineeCount >= 2 && group.winnerCount === 1) {
      eligible.push(group);
      continue;
    }
    const reason: EligibilityReason =
      group.nomineeCount < 2 ? 'SINGLE_NOMINEE' : group.winnerCount === 0 ? 'NO_WINNER' : 'MULTIPLE_WINNERS';
    ineligible.push({ ...group, reason });
  }

  return { eligible, ineligible };
}
