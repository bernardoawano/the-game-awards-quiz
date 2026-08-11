import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/session';

export default async function LoginPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  if (user !== null) {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>
      <LoginForm />
    </div>
  );
}
