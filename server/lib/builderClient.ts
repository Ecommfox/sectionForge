import type { BuilderModelSummary } from '../../src/types/builder';
import { AppError } from './errors';
import { fetchJson } from './http';

interface BuilderModelRecord {
  id?: string;
  _id?: string;
  name?: string;
  kind?: string;
  entryCount?: number;
}

export async function listBuilderModels(apiKey: string): Promise<BuilderModelSummary[]> {
  const url = new URL('https://builder.io/api/v1/models');
  url.searchParams.set('apiKey', apiKey);

  const records = await fetchJson<BuilderModelRecord[]>(url.toString());
  if (!Array.isArray(records)) {
    throw new AppError('Builder.io returned an invalid models response.', 'INVALID_UPSTREAM_RESPONSE', 502);
  }
    
  console.log(records)

  return records.flatMap(record => {
    const id = record.id || record._id;
    if (!id || !record.name) return [];
    const kind = record.kind === 'page' || record.kind === 'data' ? record.kind : 'section';
    return [{
      id,
      name: record.name,
      kind,
      ...(typeof record.entryCount === 'number' ? { entryCount: record.entryCount } : {})
    }];
  });
}

export async function listBuilderEntries(apiKey: string, modelName: string): Promise<unknown[]> {
  const url = new URL(`https://cdn.builder.io/api/v3/content/${encodeURIComponent(modelName)}`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('limit', '100');

  const response = await fetchJson<{ results?: unknown[] }>(url.toString());

   console.log(response)

  if (!response || !Array.isArray(response.results)) {
    throw new AppError('Builder.io returned an invalid entries response.', 'INVALID_UPSTREAM_RESPONSE', 502);
  }

  return response.results;
}
