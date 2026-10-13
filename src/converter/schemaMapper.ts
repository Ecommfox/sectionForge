import { SectionDataField } from '../types/builder';
import { SchemaSetting, ShopifySectionSchema, ConversionReportItem } from '../types/liquid';

export function mapSectionDataToSchema(
  sectionName: string,
  sectionData: SectionDataField[] = [],
  discoveredBindings: Set<string>,
  orphanStrategy: 'warn' | 'auto_setting' = 'warn'
): { schema: ShopifySectionSchema; reportItems: ConversionReportItem[] } {
  const settings: SchemaSetting[] = [];
  const reportItems: ConversionReportItem[] = [];
  const definedSettingIds = new Set<string>();

  for (const field of sectionData) {
    if (field.type === 'header') {
      settings.push({
        type: 'header',
        content: field.label || 'Section Header'
      });
      continue;
    }

    definedSettingIds.add(field.id);

    const setting: SchemaSetting = {
      type: mapSettingType(field.type),
      id: sanitizeSettingId(field.id),
      label: field.label || field.id
    };

    if (field.default !== undefined) {
      setting.default = field.default;
    }

    if (field.type === 'range') {
      if (field.min !== undefined) setting.min = field.min;
      if (field.max !== undefined) setting.max = field.max;
      if (field.step !== undefined) setting.step = field.step;
      if (field.unit !== undefined) setting.unit = field.unit;
    }

    if (field.type === 'select' && field.options) {
      setting.options = field.options.map(opt => ({
        value: opt.value,
        label: opt.label
      }));
    }

    settings.push(setting);
  }

  // Check for orphan bindings (referenced in bindings but missing from sectionData)
  for (const bindingId of discoveredBindings) {
    if (!definedSettingIds.has(bindingId)) {
      if (orphanStrategy === 'auto_setting') {
        settings.push({
          type: 'text',
          id: sanitizeSettingId(bindingId),
          label: `Auto-generated: ${bindingId}`,
          default: ''
        });
        reportItems.push({
          id: `orphan-${bindingId}`,
          severity: 'info',
          blockName: 'Schema Generator',
          title: `Auto-created setting for orphan binding "${bindingId}"`,
          details: `A binding to "${bindingId}" was found in block styles/attributes without a matching sectionData entry. Auto-created a schema setting.`,
          suggestedAction: 'Review the setting type and default value in {% schema %}.'
        });
      } else {
        reportItems.push({
          id: `orphan-${bindingId}`,
          severity: 'warning',
          blockName: 'Style / Binding Resolver',
          title: `Orphan binding referenced: "${bindingId}"`,
          details: `Block style references "data.hero.${bindingId}", but no corresponding setting was defined in sectionData. The converter retained the static fallback value.`,
          suggestedAction: 'Add this field to Builder sectionData or convert to a static CSS property.'
        });
      }
    }
  }

  const schema: ShopifySectionSchema = {
    name: sectionName || 'Builder Hero Section',
    tag: 'section',
    class: 'section',
    settings,
    presets: [
      {
        name: sectionName || 'Hero Section',
        settings: settings.reduce((acc, s) => {
          if (s.id && s.default !== undefined) {
            acc[s.id] = s.default;
          }
          return acc;
        }, {} as Record<string, any>)
      }
    ]
  };

  return { schema, reportItems };
}

function mapSettingType(builderType: string): string {
  const map: Record<string, string> = {
    text: 'text',
    textarea: 'textarea',
    image_picker: 'image_picker',
    url: 'url',
    range: 'range',
    select: 'select',
    color: 'color',
    checkbox: 'checkbox',
    radio: 'radio',
    header: 'header'
  };
  return map[builderType] || 'text';
}

function sanitizeSettingId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  
}
