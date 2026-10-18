import { postJson } from './client';
import type { ShopifyTestConnectionResponse } from './types';

export async function testConnection(
  storeDomain: string,
  adminAccessToken: string,
  themeId?: string
): Promise<ShopifyTestConnectionResponse> {
  const response: ShopifyTestConnectionResponse = await postJson('/api/shopify/test-connection', {
    storeDomain,
    adminAccessToken,
    ...(themeId ? { themeId } : {})
  });

  console.log('Shopify response of test connection ',response);
return response;
}
