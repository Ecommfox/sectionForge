import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';

const apiClient = axios.create({
  timeout: 10_000,
  headers: { Accept: 'application/json' }
});

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function postJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>
): Promise<T> {
  try {
    const response = await apiClient.post<T>(path, body, { headers });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;

    const axiosError = error as AxiosError<ApiErrorResponse>;
    const failure = axiosError.response?.data?.error;
    throw new ApiClientError(
      failure?.message || (axiosError.response
        ? `Request failed with status ${axiosError.response.status}.`
        : 'The API could not be reached.'),
      failure?.code || (axiosError.code === 'ECONNABORTED' ? 'REQUEST_TIMEOUT' : 'API_UNAVAILABLE'),
      axiosError.response?.status || 0
    );
  }
}
