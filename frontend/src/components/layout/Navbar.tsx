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
          <a href="/explore">Explorar</a>
          {user !== null && <a href="/quiz">Quiz</a>}
          {user !== null && <a href="/quiz/history">Histórico</a>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user === null ? (
            <>
              <a href="/login">Login</a>
              <a href="/register">Registro</a>
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
