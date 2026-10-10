import { postJson } from './client';
import type { ShopifyTestConnectionResponse } from './types';

export function testConnection(
  storeDomain: string,
  adminAccessToken: string,
  themeId?: string
): Promise<ShopifyTestConnectionResponse> {
  return postJson('/api/shopify/test-connection', {
    storeDomain,
    adminAccessToken,
    ...(themeId ? { themeId } : {})
  });
}
