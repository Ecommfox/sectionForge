import { Router } from 'express';
import type { ShopifyTestConnectionResponse } from '../../src/api/types';
import { AppError } from '../lib/errors';
import { verifyShopifyConnection } from '../lib/shopifyClient';
import { readJsonObject } from '../middleware/validate';

export const shopifyRouter = Router();

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${field} is required.`, 'INVALID_REQUEST', 400);
  }
  return value;
}

shopifyRouter.post('/test-connection', async (request, response) => {
  const body = readJsonObject(request);
  const storeDomain = requireString(body.storeDomain, 'Shopify store domain');
  const accessToken = requireString(body.adminAccessToken, 'Shopify Admin API access token');
  const themeId = body.themeId === undefined ? undefined : requireString(body.themeId, 'Shopify theme ID');

  const result = await verifyShopifyConnection({ storeDomain, accessToken, themeId });

  console.log('Shopify connection verification result:', response, 'Shopify request payload', request);

  const selectedSuffix = result.selectedTheme
    ? ` Verified development theme "${result.selectedTheme.name}" (${result.selectedTheme.id}).`
    : ` Found ${result.developmentThemes.length} development themes; select one to validate its ID.`;
  const bodyResponse: ShopifyTestConnectionResponse = {
    success: true,
    message: `Connected to Shopify store ${result.storeDomain}.${selectedSuffix}`,
    developmentThemes: result.developmentThemes
  };
  response.json(bodyResponse);
});

shopifyRouter.all(['/test-connection', '/themes', '/preview'], (request, response, next) => {
  if (request.path === '/test-connection' || request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    next(new AppError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405));
    return;
  }
  next(new AppError('Shopify integration is not implemented yet.', 'NOT_IMPLEMENTED', 501));
});
