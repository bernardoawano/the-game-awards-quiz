export function isAnswerCorrect(chosenNominationId: number, correctNominationId: number): boolean {
  return chosenNominationId === correctNominationId;
}

export function computeQuizStats(params: {
  totalQuestions: number;
  answered: number;
  correct: number;
}): { answered: number; correct: number; accuracy: number; remaining: number } {
  const accuracy = params.answered === 0 ? 0 : Math.round((params.correct / params.answered) * 100);
  return {
    answered: params.answered,
    correct: params.correct,
    accuracy,
    remaining: params.totalQuestions - params.answered,
  };
}
