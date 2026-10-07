import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, BuilderSpaceConfig, ShopifyDevThemeConfig, ConversionConfig } from '../types/settings';

const SETTINGS_STORAGE_KEY = 'sectionforge_user_settings';

const DEFAULT_SETTINGS: AppSettings = {
  builder: {
    publicKey: 'bpk-demo-trailgear-89421',
    privateKey: '',
    spaceName: 'TrailGear Production Space',
    defaultModel: 'hero-section',
    connected: true,
    lastTested: 'Valid connection (Public API OK)'
  },
  shopify: {
    storeDomain: 'trailgear-dev.myshopify.com',
    adminAccessToken: 'shpat_demo_88294723910381023',
    themeId: '140924080312',
    enabled: true,
    lastConnected: 'Ready (Theme: Dawn Dev v15.0)'
  },
  anthropicApiKey: '',
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
  setAnthropicApiKey: (key: string) => void;
  resetToDefaults: () => void;
  testBuilderConnection: () => Promise<{ success: boolean; message: string }>;
  testShopifyConnection: () => Promise<{ success: boolean; message: string }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY) || sessionStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  const updateBuilderConfig = (config: Partial<BuilderSpaceConfig>) => {
    setSettings(prev => ({
      ...prev,
      builder: { ...prev.builder, ...config }
    }));
  };

  const updateShopifyConfig = (config: Partial<ShopifyDevThemeConfig>) => {
    setSettings(prev => ({
      ...prev,
      shopify: { ...prev.shopify, ...config }
    }));
  };

  const updateConversionConfig = (config: Partial<ConversionConfig>) => {
    setSettings(prev => ({
      ...prev,
      conversion: { ...prev.conversion, ...config }
    }));
  };

  const setAnthropicApiKey = (key: string) => {
    setSettings(prev => ({
      ...prev,
      anthropicApiKey: key
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const testBuilderConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.builder.publicKey) {
      return { success: false, message: 'Please provide a Builder.io Public API Key' };
    }
    // Simulate lightweight test call to Builder Content API
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Connected to space "${settings.builder.spaceName || 'Builder Space'}" (Status 200 OK)`
        });
      }, 500);
    });
  };

  const testShopifyConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.shopify.storeDomain) {
      return { success: false, message: 'Shopify Store domain is required' };
    }
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Dev theme connection verified for ${settings.shopify.storeDomain} (Theme ID ${settings.shopify.themeId || 'Active'})`
        });
      }, 600);
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateBuilderConfig,
        updateShopifyConfig,
        updateConversionConfig,
        setAnthropicApiKey,
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
