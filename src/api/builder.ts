import type { BuilderEntry, BuilderModelSummary } from '../types/builder';
import { adaptBuilderEntry } from '../adapters/builderEntry';
import { postJson } from './client';
import type {
  BuilderEntriesResponse,
  BuilderModelsResponse,
  BuilderTestConnectionResponse
} from './types';

export function testConnection(apiKey: string): Promise<BuilderTestConnectionResponse> {
  return postJson('/api/builder/test-connection', { apiKey });
}

export async function listModels(apiKey: string): Promise<BuilderModelSummary[]> {
  const response = await postJson<BuilderModelsResponse>('/api/builder/models', { apiKey });
  return response.models;
}

export async function listEntries(apiKey: string, modelName: string): Promise<BuilderEntry[]> {
  const response = await postJson<BuilderEntriesResponse>('/api/builder/entries', {
    apiKey,
    modelName
  });
  return response.entries.map(entry => adaptBuilderEntry(entry, modelName));
}
