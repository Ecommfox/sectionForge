import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppSettings } from '../types/settings';
import { persistSettings, SETTINGS_STORAGE_KEY } from './settingsStorage';

test('persistSettings strips Builder and Shopify credentials from browser storage', () => {
  const localValues = new Map<string, string>();
  const sessionValues = new Map([[SETTINGS_STORAGE_KEY, 'legacy credentials']]);
  const settings = {
    builder: {
      publicKey: 'public-key',
      privateKey: 'builder-private-secret',
      spaceName: 'Test space',
      defaultModel: 'hero-section',
      connected: false
    },
    shopify: {
      storeDomain: 'example.myshopify.com',
      adminAccessToken: 'shopify-admin-secret',
      themeId: '',
      enabled: false
    },
    conversion: {
      cssPrefix: 'sf-',
      embedStyles: true,
      handleOrphanBindings: 'warn',
      includeSchemaComments: true,
      responsiveBreakpoints: { medium: 991, small: 640 }
    },
    anthropicApiKey: 'legacy-anthropic-secret'
  } as AppSettings & { anthropicApiKey: string };

  persistSettings(
    settings,
    { setItem: (key, value) => localValues.set(key, value) },
    { removeItem: key => sessionValues.delete(key) }
  );

  const serialized = localValues.get(SETTINGS_STORAGE_KEY);
  assert.ok(serialized);
  const persisted = JSON.parse(serialized) as AppSettings;
  assert.equal(persisted.builder.privateKey, '');
  assert.equal(persisted.shopify.adminAccessToken, '');
  assert.equal(serialized.includes('builder-private-secret'), false);
  assert.equal(serialized.includes('shopify-admin-secret'), false);
  assert.equal(serialized.includes('legacy-anthropic-secret'), false);
  assert.equal(serialized.includes('anthropicApiKey'), false);
  assert.equal(sessionValues.has(SETTINGS_STORAGE_KEY), false);
});
