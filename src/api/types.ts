import type { BuilderModelSummary } from '../types/builder';

export interface BuilderTestConnectionResponse {
  success: true;
  message: string;
  modelCount: number;
}

export interface BuilderModelsResponse {
  models: BuilderModelSummary[];
}

export interface BuilderEntriesResponse {
  entries: unknown[];
}

export interface ShopifyDevelopmentTheme {
  id: string;
  name: string;
  role: 'development';
}

export interface ShopifyTestConnectionResponse {
  success: true;
  message: string;
  developmentThemes: ShopifyDevelopmentTheme[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
