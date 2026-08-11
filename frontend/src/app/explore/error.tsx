'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export default function ExploreError({ reset }: { error: Error; reset: () => void }): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Alert variant="error">Não foi possível carregar os indicados. Tente novamente.</Alert>
      <div className="mt-4">
        <Button onClick={() => reset()}>Tentar novamente</Button>
      </div>
    </div>
  );
}
