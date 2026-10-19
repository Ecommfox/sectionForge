import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, BuilderSpaceConfig, ShopifyDevThemeConfig, ConversionConfig } from '../types/settings';
import { testConnection } from '../api/builder';
import { testConnection as testShopifyApiConnection } from '../api/shopify';
import type { ShopifyDevelopmentTheme } from '../api/types';
import { persistSettings, sanitizeSettingsForStorage, SETTINGS_STORAGE_KEY } from './settingsStorage';

const DEFAULT_SETTINGS: AppSettings = {
  builder: {
    publicKey: '',
    privateKey: '',
    spaceName: 'TrailGear Production Space',
    defaultModel: 'hero-section',
    connected: false
  },
  shopify: {
    storeDomain: 'trailgear-dev.myshopify.com',
    adminAccessToken: '',
    themeId: '',
    enabled: false
  },
  conversion: {
    cssPrefix: 'sf-',
    embedStyles: true,
    handleOrphanBindings: 'warn',
    includeSchemaComments: true,
    responsiveBreakpoints: {
      medium: 991,
      small: 640
    }
  }
};

interface SettingsContextType {
  settings: AppSettings;
  updateBuilderConfig: (config: Partial<BuilderSpaceConfig>) => void;
  updateShopifyConfig: (config: Partial<ShopifyDevThemeConfig>) => void;
  updateConversionConfig: (config: Partial<ConversionConfig>) => void;
  resetToDefaults: () => void;
  testBuilderConnection: () => Promise<{ success: boolean; message: string }>;
  testShopifyConnection: () => Promise<{
    success: boolean;
    message: string;
    developmentThemes?: ShopifyDevelopmentTheme[];
  }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function getStoredSettings(): AppSettings {
  let serialized: string | null = null;
  try {
    serialized = localStorage.getItem(SETTINGS_STORAGE_KEY) || sessionStorage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    return DEFAULT_SETTINGS;
  }

  if (!serialized) return DEFAULT_SETTINGS;

  try {
    const stored: unknown = JSON.parse(serialized);
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return DEFAULT_SETTINGS;

    const values = stored as Partial<AppSettings>;
    const settings = sanitizeSettingsForStorage({
      ...DEFAULT_SETTINGS,
      ...values,
      builder: {
        ...DEFAULT_SETTINGS.builder,
        ...(values.builder || {}),
        privateKey: ''
      },
      shopify: {
        ...DEFAULT_SETTINGS.shopify,
        ...(values.shopify || {}),
        adminAccessToken: ''
      }
    });

    try {
      persistSettings(settings, localStorage, sessionStorage);
    } catch (error) {
      console.warn('Could not remove legacy credentials from browser storage.', error);
    }
    return settings;
  } catch {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      sessionStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (storageError) {
      console.warn('Could not clear invalid stored settings.', storageError);
    }
    return DEFAULT_SETTINGS;
  }
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);

  useEffect(() => {
    try {
      persistSettings(settings, localStorage, sessionStorage);
    } catch (error) {
      console.warn('Settings persistence failed.', error);
    }
  }, [settings]);

  const updateBuilderConfig = (config: Partial<BuilderSpaceConfig>) => {
    setSettings(prev => {
      const keyChanged =
        (config.publicKey !== undefined && config.publicKey !== prev.builder.publicKey) ||
        (config.privateKey !== undefined && config.privateKey !== prev.builder.privateKey);
      return {
        ...prev,
        builder: {
          ...prev.builder,
          ...config,
          ...(keyChanged ? { connected: false, lastTested: undefined } : {})
        }
      };
    });
  };

  const updateShopifyConfig = (config: Partial<ShopifyDevThemeConfig>) => {
    setSettings(prev => {
      const storeChanged = config.storeDomain !== undefined && config.storeDomain !== prev.shopify.storeDomain;
      const connectionInputChanged =
        storeChanged ||
        (config.adminAccessToken !== undefined && config.adminAccessToken !== prev.shopify.adminAccessToken) ||
        (config.themeId !== undefined && config.themeId !== prev.shopify.themeId);
      return {
        ...prev,
        shopify: {
          ...prev.shopify,
          ...config,
          ...(storeChanged ? { themeId: '' } : {}),
          ...(connectionInputChanged ? { lastConnected: undefined } : {})
        }
      };
    });
  };

  const updateConversionConfig = (config: Partial<ConversionConfig>) => {
    setSettings(prev => ({
      ...prev,
      conversion: { ...prev.conversion, ...config }
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const testBuilderConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.builder.privateKey?.trim()) {
      updateBuilderConfig({ connected: false, lastTested: undefined });
      return { success: false, message: 'Please provide a Builder.io Private API Key' };
    }
    try {
      const result = await testConnection(settings.builder.privateKey);
      updateBuilderConfig({
        connected: true,
        lastTested: result.message
      });

      return { success: true, message: result.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Builder.io connection failed.';
      updateBuilderConfig({ connected: false, lastTested: message });
      return { success: false, message };
    }
  };

  const testShopifyConnection = async (): Promise<{
    success: boolean;
    message: string;
    developmentThemes?: ShopifyDevelopmentTheme[];
  }> => {
    if (!settings.shopify.storeDomain.trim()) {
      return { success: false, message: 'Shopify Store domain is required.' };
    }
    if (!settings.shopify.adminAccessToken.trim()) {
      return { success: false, message: 'Enter a Shopify Admin API access token.' };
    }

    try {
      const result = await testShopifyApiConnection(
        settings.shopify.storeDomain,
        settings.shopify.adminAccessToken,
        settings.shopify.themeId.trim() || undefined
      );
      const selectedTheme = result.developmentThemes.find(theme => theme.id === settings.shopify.themeId) ||
        (result.developmentThemes.length === 1 ? result.developmentThemes[0] : undefined);
      const message = selectedTheme
        ? `Connected to ${settings.shopify.storeDomain}; verified development theme "${selectedTheme.name}" (${selectedTheme.id}).`
        : `Connected to ${settings.shopify.storeDomain}; found ${result.developmentThemes.length} development themes. Select one below.`;
      updateShopifyConfig({
        ...(selectedTheme ? { themeId: selectedTheme.id } : {}),
        lastConnected: message
      });
      return { success: true, message, developmentThemes: result.developmentThemes };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Shopify connection failed.';
      updateShopifyConfig({ lastConnected: undefined });
      return { success: false, message };
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateBuilderConfig,
        updateShopifyConfig,
        updateConversionConfig,
        resetToDefaults,
        testBuilderConnection,
        testShopifyConnection
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
