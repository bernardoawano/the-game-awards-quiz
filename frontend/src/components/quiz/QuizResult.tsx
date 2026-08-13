import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { QuizAnswerResult } from '@/types/api';

interface QuizResultProps {
  result: QuizAnswerResult;
  onNext: () => void;
}

export function QuizResult({ result, onNext }: QuizResultProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant={result.isCorrect ? 'success' : 'error'} live="polite">
        {result.isCorrect ? 'Você acertou!' : 'Você errou.'} O vencedor foi{' '}
        <strong>{result.correctNomination.nominee}</strong>.
      </Alert>
      <Button onClick={onNext}>Próxima pergunta</Button>
    </div>
  );
}
