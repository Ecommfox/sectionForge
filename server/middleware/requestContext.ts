import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestContext: RequestHandler = (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Request-Id', randomUUID());
  next();
};
