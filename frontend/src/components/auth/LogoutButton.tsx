'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { clientFetch } from '@/lib/api.client';

export function LogoutButton(): React.ReactElement {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsPending(true);
    await clientFetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isPending}
      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
    >
      Sair
    </button>
  );
}
