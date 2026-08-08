import { getApiUrl, parseResponse } from './api-error';

export { ApiError } from './api-error';

export async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  return parseResponse<T>(response);
}
