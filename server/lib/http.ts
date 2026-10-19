import axios from 'axios';
import { AppError } from './errors';

const REQUEST_TIMEOUT_MS = 8_000;
const ALLOWED_UPSTREAM_HOSTS = new Set(['builder.io', 'cdn.builder.io']);

interface FetchJsonOptions {
  method?: 'GET' | 'POST';
  data?: unknown;
  privateKey?: string;
  headers?: Record<string, string>;
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const target = new URL(url);
  if (target.protocol !== 'https:' || !ALLOWED_UPSTREAM_HOSTS.has(target.hostname)) {
    throw new AppError('The upstream destination is not allowed.', 'UPSTREAM_NOT_ALLOWED', 500);
  }

  const upstreamClient = axios.create({
    adapter: 'fetch',
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      ...options.headers,
      ...(options.privateKey ? { Authorization: `Bearer ${options.privateKey}` } : {})
    },
    fetchOptions: { redirect: 'error' },
    maxContentLength: 5 * 1024 * 1024
  });

  try {
    const response = await upstreamClient.request<T>({
      method: options.method ?? 'GET',
      url: target.toString(),
      ...(options.data !== undefined ? { data: options.data } : {})
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new AppError('Builder.io request timed out.', 'UPSTREAM_TIMEOUT', 504);
      }
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new AppError('Builder.io rejected the API credential.', 'BUILDER_UNAUTHORIZED', 401);
        }
        if (status === 403) {
          throw new AppError('The Builder.io API credential lacks permission for this resource.', 'BUILDER_FORBIDDEN', 403);
        }
        throw new AppError(
          `Builder.io request failed with status ${status}.`,
          'BUILDER_UPSTREAM_ERROR',
          status === 401 || status === 403 ? 502 : 503
        );
      }
      throw new AppError('Could not reach Builder.io.', 'UPSTREAM_UNAVAILABLE', 502);
    }
    throw error;
  }
}
