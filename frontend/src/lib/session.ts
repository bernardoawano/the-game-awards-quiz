import { redirect } from 'next/navigation';

import type { CurrentUser } from '@/types/api';

import { ApiError, serverFetch } from './api';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await serverFetch<CurrentUser>('/api/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect('/login');
  }
  return user;
}
