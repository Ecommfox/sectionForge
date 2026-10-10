export interface RequestContext {
  requestId: string;
  startedAt: number;
}

export type ApiHandler = (request: Request, context: RequestContext) => Promise<Response>;

export type ApiMiddleware = (
  request: Request,
  context: RequestContext,
  next: ApiHandler
) => Promise<Response>;
