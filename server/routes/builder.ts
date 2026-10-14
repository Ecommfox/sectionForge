import { Router } from 'express';
import type { Request } from 'express';
import type { BuilderModelSummary } from '../../src/types/builder';
import type {
  BuilderEntriesResponse,
  BuilderModelsResponse,
  BuilderTestConnectionResponse
} from '../../src/api/types';
import { AppError } from '../lib/errors';
import { listBuilderEntries, listBuilderModels } from '../lib/builderClient';
import { readJsonObject } from '../middleware/validate';

export const builderRouter = Router();

function requireCredential(value: unknown, message: string, code: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 256) {
    throw new AppError(message, code, 400);
  }
  return value.trim();
}

function requirePrivateKey(request: Request): string {
  const authorization = request.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return requireCredential(
    match?.[1],
    'A valid Builder.io private API key is required in the Authorization header.',
    'INVALID_PRIVATE_API_KEY'
  );
}

function requireModelName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 128) {
    throw new AppError('A valid Builder.io model name is required.', 'INVALID_MODEL_NAME', 400);
  }
  return value.trim();
}

async function respondWithModels(request: Request, testConnection: boolean) {
  const privateKey = requirePrivateKey(request);
  const models: BuilderModelSummary[] = await listBuilderModels(privateKey);

  if (testConnection) {
    const response: BuilderTestConnectionResponse = {
      success: true,
      message: `Connected to Builder.io. ${models.length} model${models.length === 1 ? '' : 's'} found.`,
      modelCount: models.length
    };

    console.log('Builder.io test connection response:', response);
    return response;
  }

  const response: BuilderModelsResponse = { models };
  return response;
}

builderRouter.post('/models', async (request, response) => {
  response.json(await respondWithModels(request, false));
});

builderRouter.post('/test-connection', async (request, response) => {
  response.json(await respondWithModels(request, true));
});

builderRouter.post('/entries', async (request, response) => {
  const body = readJsonObject(request);
  const apiKey = requireCredential(
    body.apiKey,
    'A valid Builder.io public API key is required.',
    'INVALID_API_KEY'
  );
  const modelName = requireModelName(body.modelName);
  const records = await listBuilderEntries(apiKey, modelName);
  const result: BuilderEntriesResponse = { entries: records };
  response.json(result);
});

builderRouter.all(['/models', '/test-connection', '/entries'], (_request, response, next) => {
  response.setHeader('Allow', 'POST');
  next(new AppError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405));
});
