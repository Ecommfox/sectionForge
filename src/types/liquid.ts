export interface SchemaSetting {
  type: string;
  id?: string;
  content?: string;
  label?: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  info?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface ShopifySectionSchema {
  name: string;
  tag?: string;
  class?: string;
  settings: SchemaSetting[];
  blocks?: Array<{
    type: string;
    name: string;
    settings: SchemaSetting[];
  }>;
  presets?: Array<{
    name: string;
    settings?: Record<string, any>;
  }>;
}

export type ReportSeverity = 'info' | 'warning' | 'unsupported';

export interface ConversionReportItem {
  id: string;
  severity: ReportSeverity;
  blockName: string;
  title: string;
  details: string;
  suggestedAction?: string;
}

export interface ConversionOutput {
  liquid: string;
  css: string;
  schema: ShopifySectionSchema;
  fullSectionFile: string;
  report: ConversionReportItem[];
  timestamp: string;
  stats: {
    settingsCount: number;
    blocksCount: number;
    warningsCount: number;
    droppedHelpersCount: number;
  };
}
