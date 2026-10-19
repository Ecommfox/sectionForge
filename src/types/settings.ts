export interface BuilderSpaceConfig {
  publicKey: string;
  privateKey?: string;
  spaceName: string;
  defaultModel: string;
  connected: boolean;
  lastTested?: string;
}

export interface ShopifyDevThemeConfig {
  storeDomain: string;
  adminAccessToken: string;
  themeId: string;
  enabled: boolean;
  lastConnected?: string;
}

export interface ConversionConfig {
  cssPrefix: string;
  embedStyles: boolean;
  handleOrphanBindings: 'warn' | 'auto_setting';
  includeSchemaComments: boolean;
  responsiveBreakpoints: {
    medium: number;
    small: number;
  };
}

export interface AppSettings {
  builder: BuilderSpaceConfig;
  shopify: ShopifyDevThemeConfig;
  conversion: ConversionConfig;
}
