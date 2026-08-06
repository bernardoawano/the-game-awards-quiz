import { computeQuizStats, isAnswerCorrect } from '../../src/lib/quiz-scoring';

describe('isAnswerCorrect', () => {
  it('returns true when the chosen nomination matches the correct one', () => {
    expect(isAnswerCorrect(5, 5)).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isAnswerCorrect(5, 6)).toBe(false);
  });
});

describe('computeQuizStats', () => {
  it('returns accuracy 0 when nothing has been answered (no division by zero)', () => {
    expect(computeQuizStats({ totalQuestions: 154, answered: 0, correct: 0 })).toEqual({
      answered: 0,
      correct: 0,
      accuracy: 0,
      remaining: 154,
    });
  });

  it('computes a rounded percentage and remaining count', () => {
    expect(computeQuizStats({ totalQuestions: 154, answered: 3, correct: 2 })).toEqual({
      answered: 3,
      correct: 2,
      accuracy: 67,
      remaining: 151,
    });
  });
});
