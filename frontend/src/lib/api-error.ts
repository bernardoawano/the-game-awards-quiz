import type { ErrorCode } from '@/types/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url === undefined) {
    throw new Error('NEXT_PUBLIC_API_URL não está definida.');
  }
  return url;
}

export async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const body: unknown = await response.json();
  if (!response.ok) {
    const errorBody = body as { error: { code: ErrorCode; message: string } };
    throw new ApiError(response.status, errorBody.error.code, errorBody.error.message);
  }
  return body as T;
}
