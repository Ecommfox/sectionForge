import { AppError } from '../lib/errors';

const MAX_JSON_BODY_BYTES = 64 * 1024;

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new AppError('Content-Type must be application/json.', 'UNSUPPORTED_MEDIA_TYPE', 415);
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
    throw new AppError('Request body is too large.', 'PAYLOAD_TOO_LARGE', 413);
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    throw new AppError('Could not read request body.', 'INVALID_REQUEST', 400);
  }

  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_BYTES) {
    throw new AppError('Request body is too large.', 'PAYLOAD_TOO_LARGE', 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AppError('Request body must be valid JSON.', 'INVALID_JSON', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object.', 'INVALID_REQUEST', 400);
  }

  return body as Record<string, unknown>;
}
