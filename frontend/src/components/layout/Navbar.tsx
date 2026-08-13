import Link from 'next/link';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { getCurrentUser } from '@/lib/session';

export async function Navbar(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-gray-200 bg-surface">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            TGA Quiz
          </Link>
          <Link href="/explore">Explorar</Link>
          {user !== null && <Link href="/quiz">Quiz</Link>}
          {user !== null && <Link href="/quiz/history">Histórico</Link>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user === null ? (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Registro</Link>
            </>
          ) : (
            <>
              <span className="text-gray-600">{user.email}</span>
              <LogoutButton />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
