import { AppError } from '../lib/errors';
import { readJsonObject } from '../middleware/validate';
import type { ShopifyTestConnectionResponse } from '../../src/api/types';
import { verifyShopifyConnection } from '../lib/shopifyClient';

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${field} is required.`, 'INVALID_REQUEST', 400);
  }
  return value;
}

export async function handleShopifyRequest(request: Request, pathname: string): Promise<Response> {
  if (request.method !== 'POST') {
    throw new AppError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  }

  if (pathname !== '/api/shopify/test-connection') {
    throw new AppError('Shopify integration is not implemented yet.', 'NOT_IMPLEMENTED', 501);
  }

  const body = await readJsonObject(request);
  const storeDomain = requireString(body.storeDomain, 'Shopify store domain');
  const accessToken = requireString(body.adminAccessToken, 'Shopify Admin API access token');
  const themeId = body.themeId === undefined ? undefined : requireString(body.themeId, 'Shopify theme ID');

  const result = await verifyShopifyConnection({ storeDomain, accessToken, themeId });
  const selectedSuffix = result.selectedTheme
    ? ` Verified development theme "${result.selectedTheme.name}" (${result.selectedTheme.id}).`
    : ` Found ${result.developmentThemes.length} development themes; select one to validate its ID.`;
  const response: ShopifyTestConnectionResponse = {
    success: true,
    message: `Connected to Shopify store ${result.storeDomain}.${selectedSuffix}`,
    developmentThemes: result.developmentThemes
  };
  return Response.json(response);
}
