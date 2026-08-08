import { cookies } from 'next/headers';

import { getApiUrl, parseResponse } from './api-error';

export { ApiError } from './api-error';

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { ...init?.headers, Cookie: cookieHeader },
  });
  return parseResponse<T>(response);
}
