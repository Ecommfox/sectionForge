import type { AppSettings } from '../types/settings';

export const SETTINGS_STORAGE_KEY = 'sectionforge_user_settings';

type StorageWriter = Pick<Storage, 'setItem'>;
type StorageCleaner = Pick<Storage, 'removeItem'>;

export function sanitizeSettingsForStorage(settings: AppSettings): AppSettings {
  const { anthropicApiKey: _removedAnthropicKey, ...settingsWithoutAnthropicKey } =
    settings as AppSettings & { anthropicApiKey?: string };
  return {
    ...settingsWithoutAnthropicKey,
    builder: { ...settings.builder, privateKey: '' },
    shopify: { ...settings.shopify, adminAccessToken: '' }
  };
}

export function persistSettings(
  settings: AppSettings,
  localStorage: StorageWriter,
  sessionStorage: StorageCleaner
): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettingsForStorage(settings)));
  sessionStorage.removeItem(SETTINGS_STORAGE_KEY);
}
