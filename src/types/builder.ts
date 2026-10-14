export interface SectionDataField {
  type: 'image_picker' | 'text' | 'textarea' | 'url' | 'range' | 'select' | 'color' | 'header' | 'checkbox' | 'radio' | string;
  id: string;
  label: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  info?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface ResponsiveStyles {
  large?: Record<string, string | number>;
  medium?: Record<string, string | number>;
  small?: Record<string, string | number>;
}

export interface BuilderBlockNode {
  id?: string;
  '@type'?: string;
  component?: {
    name: string;
    options?: Record<string, any>;
  };
  children?: BuilderBlockNode[];
  responsiveStyles?: ResponsiveStyles;
  bindings?: Record<string, string>;
  show?: string;
  repeat?: {
    collection?: string;
    itemName?: string;
  };
  layerName?: string;
}

export interface BuilderEntry {
  id: string;
  name: string;
  modelName: string;
  origin?: 'builder';
  lastUpdated: string;
  published: 'published' | 'draft';
  data: {
    sectionData?: SectionDataField[];
    blocks?: BuilderBlockNode[];
    customFonts?: Array<{ name: string; file?: string; weights?: string[] }>;
    jsCode?: string;
    state?: Record<string, any>;
    inputs?: any[];
    [key: string]: any;
  };
}

export interface BuilderModelSummary {
  id: string;
  name: string;
  kind: 'section' | 'page' | 'data';
  entryCount?: number;
}
