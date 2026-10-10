import { AppError } from '../lib/errors';
import { handleBuilderRequest } from './builder';
import { handleShopifyRequest } from './shopify';

interface ApiRoute {
  method: string;
  path: string;
  handle: (request: Request, path: string) => Promise<Response>;
}

const routes: ApiRoute[] = [
  { method: 'POST', path: '/api/builder/test-connection', handle: handleBuilderRequest },
  { method: 'POST', path: '/api/builder/models', handle: handleBuilderRequest },
  { method: 'POST', path: '/api/builder/entries', handle: handleBuilderRequest },
  { method: 'POST', path: '/api/shopify/test-connection', handle: handleShopifyRequest },
  { method: 'POST', path: '/api/shopify/themes', handle: handleShopifyRequest },
  { method: 'POST', path: '/api/shopify/preview', handle: handleShopifyRequest }
];

function methodNotAllowed(allowedMethod: string): Response {
  return Response.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed.'
      }
    },
    { status: 405, headers: { Allow: allowedMethod } }
  );
}

export async function handleApiRoute(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const route = routes.find(candidate => candidate.path === pathname);
  if (!route) {
    throw new AppError('API route not found.', 'NOT_FOUND', 404);
  }
  if (request.method !== route.method) {
    return methodNotAllowed(route.method);
  }

  return route.handle(request, pathname);
}
