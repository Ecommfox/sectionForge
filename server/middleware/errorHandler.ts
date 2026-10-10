import { AppError } from '../lib/errors';
import type { ApiMiddleware } from './types';

export const errorHandler: ApiMiddleware = async (_request, _context, next) => {
  try {
    return await next(_request, _context);
  } catch (error) {
    const appError = error instanceof AppError
      ? error
      : new AppError('An unexpected server error occurred.', 'INTERNAL_ERROR', 500);

    return Response.json(
      { error: { code: appError.code, message: appError.message } },
      { status: appError.status }
    );
  }
};
