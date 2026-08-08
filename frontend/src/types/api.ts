export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'QUESTION_ALREADY_ANSWERED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

export interface Category {
  id: number;
  canonicalName: string;
  slug: string;
}

export interface Nomination {
  id: number;
  year: number;
  categoryId: number;
  nominee: string;
  company: string | null;
  isWinner: boolean;
  votedBy: 'jury' | 'fan';
}

export interface CurrentUser {
  id: number;
  email: string;
  createdAt: string;
}

export interface QuizNominationOption {
  id: number;
  nominee: string;
  company: string | null;
}

export interface QuizQuestion {
  id: number;
  year: number;
  category: { id: number; canonicalName: string };
  nominations: QuizNominationOption[];
}

export interface QuizAnswerResult {
  isCorrect: boolean;
  correctNomination: QuizNominationOption;
}

export interface QuizHistoryItem {
  id: number;
  year: number;
  category: { id: number; canonicalName: string };
  chosenNomination: { id: number; nominee: string };
  correctNomination: { id: number; nominee: string };
  isCorrect: boolean;
  answeredAt: string;
}

export interface QuizHistoryPage {
  items: QuizHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface QuizStats {
  answered: number;
  correct: number;
  accuracy: number;
  remaining: number;
}
