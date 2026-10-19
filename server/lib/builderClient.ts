import type { BuilderModelSummary } from '../../src/types/builder';
import { AppError } from './errors';
import { fetchJson } from './http';

interface BuilderModelRecord {
  id?: string;
  name: string;
}

interface BuilderModelsGraphQLResponse {
  data?: {
    models?: BuilderModelRecord[];
  };
  errors?: Array<{ message?: string }>;
}

interface BuilderHtmlResponse {
  data?: {
    html?: unknown;
  };
}

export async function listBuilderModels(privateKey: string): Promise<BuilderModelSummary[]> {
  const url = new URL('https://cdn.builder.io/api/v2/admin');

  const response = await fetchJson<BuilderModelsGraphQLResponse>(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    privateKey,
    data: { query: 'query Models { models { id, name } }' }
  });

  if (response?.errors?.length) {
    throw new AppError('Builder.io Admin API returned a GraphQL error.', 'BUILDER_UPSTREAM_ERROR', 502);
  }
  const records = response?.data?.models;
  if (!Array.isArray(records)) {
    throw new AppError('Builder.io returned an invalid models response.', 'INVALID_UPSTREAM_RESPONSE', 502);
  }


  return records.flatMap(record => {
    const id = record.id;
    const name = record?.name
    if (!id) return [];
    return [{
      id,
      name:  name,
      kind: 'section' as const
    }];
  });
}

export async function listBuilderEntries(apiKey: string, modelName: string): Promise<unknown[]> {
  const url = new URL(`https://cdn.builder.io/api/v3/content/${encodeURIComponent(modelName)}`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('limit', '100');

  const response = await fetchJson<{ results?: unknown[] }>(url.toString());

  if (!response || !Array.isArray(response.results)) {
    throw new AppError('Builder.io returned an invalid entries response.', 'INVALID_UPSTREAM_RESPONSE', 502);
  }

  return response.results;
}

export async function getBuilderEntryHtml(
  apiKey: string,
  modelName: string,
  entryId: string
): Promise<string> {
  const url = new URL(`https://cdn.builder.io/api/v3/html/${encodeURIComponent(modelName)}`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('includeUnpublished', 'true');
  url.searchParams.set('query.id', entryId);

  const response = await fetchJson<BuilderHtmlResponse>(url.toString());
  const html = response?.data?.html;
  if (typeof html !== 'string') {
    throw new AppError('Builder.io returned an invalid HTML response.', 'INVALID_UPSTREAM_RESPONSE', 502);
  }

  return html;
}
