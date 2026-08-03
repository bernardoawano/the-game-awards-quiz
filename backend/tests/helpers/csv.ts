import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parse } from 'csv-parse/sync';

export type VotedBy = 'jury' | 'fan';

export interface RawRow {
  year: number;
  category: string;
  nominee: string;
  company: string | null;
  isWinner: boolean;
  votedBy: VotedBy;
}

interface CsvRecord {
  year: string;
  category: string;
  nominee: string;
  company: string;
  winner: string;
  voted: string;
}

const CSV_PATH = path.join(__dirname, '..', '..', '..', 'data', 'the_game_awards.csv');

export function loadRawRows(): RawRow[] {
  const content = readFileSync(CSV_PATH, 'utf8');
  const records = parse<CsvRecord>(content, { columns: true });

  return records.map((record) => ({
    year: Number(record.year),
    category: record.category,
    nominee: record.nominee,
    company: record.company === '' ? null : record.company,
    isWinner: record.winner === '1',
    votedBy: record.voted as VotedBy,
  }));
}
