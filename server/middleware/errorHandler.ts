import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (isParserError(error)) {
    appError = error.type === 'entity.too.large'
      ? new AppError('Request body is too large.', 'PAYLOAD_TOO_LARGE', 413)
      : new AppError('Request body must be valid JSON.', 'INVALID_JSON', 400);
  } else {
    console.error('Unhandled API error:', error instanceof Error ? error.name : typeof error);
    appError = new AppError('An unexpected server error occurred.', 'INTERNAL_ERROR', 500);
  }

  response.status(appError.status).json({
    error: { code: appError.code, message: appError.message }
  });
};

function isParserError(
  error: unknown
): error is Error & { type: 'entity.too.large' | 'entity.parse.failed' } {
  return typeof error === 'object'
    && error !== null
    && 'type' in error
    && (error.type === 'entity.too.large' || error.type === 'entity.parse.failed');
}
