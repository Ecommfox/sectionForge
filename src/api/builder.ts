import type { BuilderEntry, BuilderModelSummary } from '../types/builder';
import { adaptBuilderEntry } from '../adapters/builderEntry';
import { ApiClientError, postJson } from './client';
import type {
  BuilderEntriesResponse,
  BuilderModelsResponse,
  BuilderTestConnectionResponse
} from './types';

export async function testConnection(privateKey: string): Promise<BuilderTestConnectionResponse> {
  const response = await postJson<BuilderModelsResponse>(
    '/api/builder/models',
    {},
    { Authorization: `Bearer ${privateKey}` }
  );
  if (!Array.isArray(response?.models)) {
    throw new ApiClientError(
      'Builder.io returned an invalid models response.',
      'INVALID_UPSTREAM_RESPONSE',
      502
    );
  }

  console.log('Builder.io models response:', response);

  const modelCount = response.models.length;
  return {
    success: true,
    message: `Connected to Builder.io. ${modelCount} model${modelCount === 1 ? '' : 's'} found.`,
    modelCount
  };
}

export async function listModels(privateKey: string): Promise<BuilderModelSummary[]> {
  const response = await postJson<BuilderModelsResponse>(
    '/api/builder/models',
    {},
    { Authorization: `Bearer ${privateKey}` }
  );
  return response.models;
}

export async function listEntries(apiKey: string, modelName: string): Promise<BuilderEntry[]> {
  const response = await postJson<BuilderEntriesResponse>('/api/builder/entries', {
    apiKey,
    modelName
  });
  return response.entries.map(entry => adaptBuilderEntry(entry, modelName));
}
