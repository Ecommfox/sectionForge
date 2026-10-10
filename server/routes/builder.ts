import type { BuilderModelSummary } from '../../src/types/builder';
import type { BuilderEntriesResponse, BuilderModelsResponse, BuilderTestConnectionResponse } from '../../src/api/types';
import { AppError } from '../lib/errors';
import { readJsonObject } from '../middleware/validate';
import { listBuilderEntries, listBuilderModels } from '../lib/builderClient';

function requireApiKey(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 256) {
    throw new AppError('A valid Builder.io public API key is required.', 'INVALID_API_KEY', 400);
  }
  return value.trim();
}

function requireModelName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 128) {
    throw new AppError('A valid Builder.io model name is required.', 'INVALID_MODEL_NAME', 400);
  }
  return value.trim();
}

export async function handleBuilderRequest(request: Request, pathname: string): Promise<Response> {
  if (request.method !== 'POST') {
    throw new AppError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  }

  const body = await readJsonObject(request);
  const apiKey = requireApiKey(body.apiKey);

  if (pathname === '/api/builder/models' || pathname === '/api/builder/test-connection') {
    const models: BuilderModelSummary[] = await listBuilderModels(apiKey);
    if (pathname === '/api/builder/test-connection') {
      const response: BuilderTestConnectionResponse = {
        success: true,
        message: `Connected to Builder.io. ${models.length} model${models.length === 1 ? '' : 's'} found.`,
        modelCount: models.length
      };
      return Response.json(response);
    }

    const response: BuilderModelsResponse = { models };
    return Response.json(response);
  }

  if (pathname === '/api/builder/entries') {
    const modelName = requireModelName(body.modelName);
    const records = await listBuilderEntries(apiKey, modelName);
    const response: BuilderEntriesResponse = { entries: records };
    return Response.json(response);
  }

  throw new AppError('Builder.io API route not found.', 'NOT_FOUND', 404);
}
