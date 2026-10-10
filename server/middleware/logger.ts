import type { ApiMiddleware } from './types';

export const requestLogger: ApiMiddleware = async (request, context, next) => {
  const response = await next(request, context);
  const pathname = new URL(request.url).pathname;

  console.info(JSON.stringify({
    requestId: context.requestId,
    method: request.method,
    path: pathname,
    status: response.status,
    durationMs: Date.now() - context.startedAt
  }));

  return response;
};
