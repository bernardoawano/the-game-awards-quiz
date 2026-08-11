'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError, clientFetch } from '@/lib/api.client';

interface FieldErrors {
  email?: string;
  password?: string;
}

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Informe um email válido.';
  }
  if (password.length < 8) {
    errors.password = 'A senha precisa ter pelo menos 8 caracteres.';
  }
  return errors;
}

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = getStringValue(formData, 'email');
    const password = getStringValue(formData, 'password');

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setFormError(null);
    setIsPending(true);
    try {
      await clientFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      router.push('/quiz' as Route);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.');
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex flex-col gap-4">
      {formError !== null && <Alert variant="error">{formError}</Alert>}
      <Input label="Email" id="email" name="email" type="email" error={fieldErrors.email} />
      <Input label="Senha" id="password" name="password" type="password" error={fieldErrors.password} />
      <Button type="submit" isLoading={isPending}>
        Entrar
      </Button>
    </form>
  );
}
