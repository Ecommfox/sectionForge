import type { BuilderEntry } from '../types/builder';

interface BuilderContentRecord {
  id?: string;
  _id?: string;
  name?: string;
  modelName?: string;
  model?: { name?: string };
  published?: string | boolean;
  lastUpdated?: string;
  data?: BuilderEntry['data'];
}

export function adaptBuilderEntry(
  value: unknown,
  requestedModelName: string
): BuilderEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Builder.io returned an entry that is not an object.');
  }
  const record = value as BuilderContentRecord;
  const id = record.id || record._id;
  if (!id || !record.data || typeof record.data !== 'object') {
    throw new Error('Builder.io returned an entry without an id or data object.');
  }

  return {
    id,
    name: record.name || String(record.data.title || 'Untitled Builder entry'),
    modelName: record.modelName || record.model?.name || requestedModelName,
    lastUpdated: record.lastUpdated || 'Unknown',
    published: record.published === false || record.published === 'draft' ? 'draft' : 'published',
    data: record.data
  };
}
