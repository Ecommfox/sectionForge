import type { ApiMiddleware } from './types';

export const requestContext: ApiMiddleware = async (request, context, next) => {
  const response = await next(request, context);
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Request-Id', context.requestId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
