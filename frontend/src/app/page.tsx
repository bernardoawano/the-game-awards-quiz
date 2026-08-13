import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function HomePage(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">TGA Quiz — Guess the Winner</h1>
      <p className="text-gray-600">
        Reviva o histórico do The Game Awards (2014–2019): explore os indicados e vencedores de cada
        categoria, ou teste sua memória adivinhando quem levou o prêmio.
      </p>
      <Card className="flex flex-col gap-4 sm:flex-row">
        <Button asChild>
          <Link href="/explore">Explorar indicações</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/quiz">Jogar Quiz</Link>
        </Button>
      </Card>
    </div>
  );
}
