import type { RequestHandler } from 'express';

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = Date.now();
  response.on('finish', () => {
    console.info(JSON.stringify({
      requestId: response.getHeader('X-Request-Id'),
      method: request.method,
      path: request.path,
      status: response.statusCode,
      durationMs: Date.now() - startedAt
    }));
  });
  next();
};
