'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { QuizResult } from '@/components/quiz/QuizResult';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ApiError, clientFetch } from '@/lib/api.client';
import type { QuizAnswerResult, QuizQuestion } from '@/types/api';

interface QuizCardProps {
  question: QuizQuestion;
}

export function QuizCard({ question }: QuizCardProps): React.ReactElement {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAnswerResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (selectedId === null) {
      setFormError('Escolha um indicado antes de confirmar.');
      return;
    }

    setFormError(null);
    setIsPending(true);
    try {
      const answer = await clientFetch<QuizAnswerResult>('/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify({ questionId: question.id, nominationId: selectedId }),
      });
      setResult(answer);
      setIsPending(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        router.refresh();
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login');
        return;
      }
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível registrar sua resposta.');
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <p className="text-sm text-gray-500">{question.year}</p>
      <h1 className="mb-6 text-2xl font-bold">{question.category.canonicalName}</h1>

      {result !== null ? (
        <QuizResult result={result} onNext={() => router.refresh()} />
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          {formError !== null && <Alert variant="error">{formError}</Alert>}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-gray-700">Quem venceu?</legend>
            {question.nominations.map((nomination) => (
              <label
                key={nomination.id}
                className="flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="nomination"
                  checked={selectedId === nomination.id}
                  onChange={() => setSelectedId(nomination.id)}
                />
                <span>{nomination.nominee}</span>
                {nomination.company !== null && <span className="text-gray-500">— {nomination.company}</span>}
              </label>
            ))}
          </fieldset>
          <Button type="submit" isLoading={isPending} disabled={selectedId === null || isPending}>
            Confirmar
          </Button>
        </form>
      )}
    </div>
  );
}
