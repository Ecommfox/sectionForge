import type { Request } from 'express';
import { AppError } from '../lib/errors';

export function readJsonObject(request: Request): Record<string, unknown> {
  if (!request.is('application/json')) {
    throw new AppError('Content-Type must be application/json.', 'UNSUPPORTED_MEDIA_TYPE', 415);
  }

  const body: unknown = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object.', 'INVALID_REQUEST', 400);
  }

  return body as Record<string, unknown>;
}
