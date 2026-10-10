import axios from 'axios';
import { AppError } from './errors';

const REQUEST_TIMEOUT_MS = 8_000;
const ALLOWED_UPSTREAM_HOSTS = new Set(['builder.io', 'cdn.builder.io']);

const upstreamClient = axios.create({
  adapter: 'fetch',
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
  fetchOptions: { redirect: 'error' },
  maxContentLength: 5 * 1024 * 1024
});

export async function fetchJson<T>(url: string): Promise<T> {
  const target = new URL(url);
  if (target.protocol !== 'https:' || !ALLOWED_UPSTREAM_HOSTS.has(target.hostname)) {
    throw new AppError('The upstream destination is not allowed.', 'UPSTREAM_NOT_ALLOWED', 500);
  }

  try {
    const response = await upstreamClient.get<T>(target.toString());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new AppError('Builder.io request timed out.', 'UPSTREAM_TIMEOUT', 504);
      }
      if (error.response) {
        const status = error.response.status;
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
