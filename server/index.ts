import { handleApiRoute } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { requestContext } from './middleware/requestContext';
import type { ApiHandler, ApiMiddleware, RequestContext } from './middleware/types';

const middleware: ApiMiddleware[] = [requestContext, requestLogger, errorHandler];

const apiHandler: ApiHandler = (request: Request, _context: RequestContext) => handleApiRoute(request);

const pipeline = middleware.reduceRight<ApiHandler>(
  (next, current) => (request, context) => current(request, context, next),
  apiHandler
);

export async function handleRequest(request: Request): Promise<Response> {
  const context: RequestContext = {
    requestId: crypto.randomUUID(),
    startedAt: Date.now()
  };
  return pipeline(request, context);
}
