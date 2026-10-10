import { handleRequest } from '../../server';

interface PagesFunctionContext {
  request: Request;
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  return handleRequest(context.request);
}
