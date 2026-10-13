import axios from 'axios';
import type { ShopifyDevelopmentTheme } from '../../src/api/types';
import { AppError } from './errors';

const SHOPIFY_API_VERSION = '2026-07';
const REQUEST_TIMEOUT_MS = 8_000;

interface ShopifyThemeRecord {
  id?: number | string;
  name?: string;
  role?: string;
}

interface ShopifyThemesResponse {
  themes?: ShopifyThemeRecord[];
}

const shopifyClient = axios.create({
  adapter: 'fetch',
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
  fetchOptions: { redirect: 'error' },
  maxContentLength: 2 * 1024 * 1024
});

function normalizeShopDomain(value: string): string {
  const domain = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/.test(domain)) {
    throw new AppError('Enter a valid Shopify .myshopify.com store domain.', 'INVALID_STORE_DOMAIN', 400);
  }
  return domain;
}

function normalizeAccessToken(value: string): string {
  const token = value.trim();
  if (token.length < 8 || token.length > 8192 || /[\r\n]/.test(token)) {
    throw new AppError('A valid Shopify Admin API access token is required.', 'INVALID_ACCESS_TOKEN', 400);
  }
  return token;
}

function normalizeThemeId(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const themeId = value.trim();
  if (!/^\d{1,32}$/.test(themeId)) {
    throw new AppError('The Shopify theme ID must contain only digits.', 'INVALID_THEME_ID', 400);
  }
  return themeId;
}

export interface ShopifyConnectionInput {
  storeDomain: string;
  accessToken: string;
  themeId?: string;
}

export interface ShopifyConnectionResult {
  storeDomain: string;
  developmentThemes: ShopifyDevelopmentTheme[];
  selectedTheme?: ShopifyDevelopmentTheme;
}

export async function verifyShopifyConnection(
  input: ShopifyConnectionInput
): Promise<ShopifyConnectionResult> {
  const storeDomain = normalizeShopDomain(input.storeDomain);
  const accessToken = normalizeAccessToken(input.accessToken);
  const requestedThemeId = normalizeThemeId(input.themeId);
  const endpoint = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/themes.json?fields=id,name,role`;

  let payload: ShopifyThemesResponse;
  try {
    const response = await shopifyClient.get<ShopifyThemesResponse>(endpoint, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    payload = response.data;
    console.log("Shopify store succesfully connected:", payload);
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new AppError('Shopify connection test timed out.', 'UPSTREAM_TIMEOUT', 504);
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new AppError('Shopify rejected the access token or the token lacks permission to read themes.', 'SHOPIFY_UNAUTHORIZED', 401);
    }
    if (error.response) {
      throw new AppError(`Shopify theme request failed with status ${error.response.status}.`, 'SHOPIFY_UPSTREAM_ERROR', 502);
    }
    throw new AppError('Could not reach the configured Shopify store.', 'SHOPIFY_UNAVAILABLE', 502);
  }

  if (!payload || !Array.isArray(payload.themes)) {
    throw new AppError('Shopify returned an invalid themes response.', 'INVALID_UPSTREAM_RESPONSE', 502);
  }

  const developmentThemes = payload.themes.flatMap(theme => {
    const id = theme.id === undefined ? '' : String(theme.id);
    if (!/^\d+$/.test(id) || typeof theme.name !== 'string' || theme.role !== 'development') return [];
    return [{ id, name: theme.name, role: 'development' as const }];
  });

  if (developmentThemes.length === 0) {
    throw new AppError('The token is valid, but Shopify returned no development themes for this store.', 'DEV_THEME_NOT_FOUND', 404);
  }

  const selectedTheme = requestedThemeId
    ? developmentThemes.find(theme => theme.id === requestedThemeId)
    : developmentThemes.length === 1
      ? developmentThemes[0]
      : undefined;

  if (requestedThemeId && !selectedTheme) {
    throw new AppError('The selected theme is not a development theme accessible to this token.', 'DEV_THEME_NOT_FOUND', 404);
  }

  return { storeDomain, developmentThemes, ...(selectedTheme ? { selectedTheme } : {}) };
}
