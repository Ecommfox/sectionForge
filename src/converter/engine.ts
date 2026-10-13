import { BuilderEntry, BuilderBlockNode } from '../types/builder';
import { ConversionOutput, ConversionReportItem, ShopifySectionSchema } from '../types/liquid';
import { sanitizeBuilderEntry } from './sanitize';
import { mapSectionDataToSchema } from './schemaMapper';
import { camelToKebab, generateResponsiveCss, ScopedRule } from './stylesProcessor';
import { AppSettings } from '../types/settings';

/**
 * Extracts setting key from expressions like:
 * window.data.hero.header_title -> header_title
 * data.hero.title_size -> title_size
 */
export function extractBindingKey(bindingExpression?: string): string | null {
  if (!bindingExpression) return null;
  const match = bindingExpression.match(/(?:window\.)?data\.(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/);
  return match ? match[1] : null;
}

export function convertBuilderSection(
  rawEntry: BuilderEntry,
  settings: AppSettings
): ConversionOutput {
  const sanitized = sanitizeBuilderEntry(rawEntry);
  const report: ConversionReportItem[] = [];
  const discoveredBindings = new Set<string>();
  const prefix = settings.conversion.cssPrefix || 'sf-';
  const sectionId = sanitized.modelName.replace(/[^a-zA-Z0-9_]/g, '-');
  const baseClass = `${prefix}${sectionId}`;

  // 1. Font inspection
  if (rawEntry.data.customFonts && rawEntry.data.customFonts.length > 0) {
    for (const font of rawEntry.data.customFonts) {
      report.push({
        id: `font-${font.name}`,
        severity: 'info',
        blockName: 'Font Registry',
        title: `Custom font detected: "${font.name}"`,
        details: `Builder uses the "${font.name}" custom font. Ensure this font is loaded in your theme.liquid via Shopify font_picker or Google Fonts stylesheet.`,
        suggestedAction: `Add <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.name)}:wght@400;600;800&display=swap"> to theme head.`
      });
    }
  }

  // 2. Discover all bindings in AST
  const scanBindings = (nodes?: BuilderBlockNode[]) => {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.bindings) {
        for (const [key, expr] of Object.entries(node.bindings)) {
          const extracted = extractBindingKey(expr);
          if (extracted) discoveredBindings.add(extracted);
        }
      }
      if (node.show) {
        const extracted = extractBindingKey(node.show);
        if (extracted) discoveredBindings.add(extracted);
      }
      scanBindings(node.children);
    }
  };
  scanBindings(sanitized.data.blocks);

  // 3. Check for dropped design-mode scripts
  const rawBlocksCount = countBlocks(rawEntry.data.blocks);
  const sanitizedBlocksCount = countBlocks(sanitized.data.blocks);
  const droppedCount = rawBlocksCount - sanitizedBlocksCount;
  if (droppedCount > 0) {
    report.push({
      id: 'dropped-design-mode-helper',
      severity: 'info',
      blockName: 'Builder Theme Editor Sync',
      title: 'Dropped Builder design-mode helper script',
      details: 'Stripped unnecessary {% if request.design_mode %} script tag from output to produce clean production-ready Shopify Liquid.',
      suggestedAction: 'None needed. Production themes do not require Builder client editor hooks.'
    });
  }

  // 4. Generate Schema via schemaMapper
  const { schema, reportItems: schemaReports } = mapSectionDataToSchema(
    sanitized.name,
    sanitized.data.sectionData,
    discoveredBindings,
    settings.conversion.handleOrphanBindings
  );
  report.push(...schemaReports);

  // 5. Convert the sanitized Builder block tree into Liquid and scoped CSS.
  const cssRules: ScopedRule[] = [];
  const liquidBody = renderBuilderBlocks(sanitized.data.blocks, baseClass, cssRules, report);
  const generatedCss = generateResponsiveCss(cssRules, settings.conversion.responsiveBreakpoints);
  const liquidMarkup = `{% comment %}
  Section: ${sanitized.name}
  Generated via SectionForge (Builder.io -> Shopify Liquid Converter)
{% endcomment %}

<section class="${baseClass}">
${liquidBody || '  <!-- No convertible Builder blocks found. -->'}
</section>`;

  // 7. Format complete section file with {% stylesheet %} and {% schema %}
  const schemaFormatted = JSON.stringify(schema, null, 2);
  const fullSectionFile = `${liquidMarkup}

{% stylesheet %}
${generatedCss}
{% endstylesheet %}

{% schema %}
${schemaFormatted}
{% endschema %}`;

  return {
    liquid: liquidMarkup,
    css: generatedCss,
    schema,
    fullSectionFile,
    report,
    timestamp: new Date().toLocaleTimeString(),
    stats: {
      settingsCount: schema.settings.length,
      blocksCount: sanitized.data.blocks?.length || 0,
      warningsCount: report.filter(r => r.severity === 'warning').length,
      droppedHelpersCount: droppedCount
    }
  };
}

function countBlocks(blocks?: BuilderBlockNode[]): number {
  if (!blocks) return 0;
  let count = blocks.length;
  for (const b of blocks) {
    count += countBlocks(b.children);
  }
  return count;
}

function renderBuilderBlocks(
  blocks: BuilderBlockNode[] | undefined,
  baseClass: string,
  cssRules: ScopedRule[],
  report: ConversionReportItem[],
  parentPath: number[] = []
): string {
  if (!blocks?.length) return '';

  return blocks.map((block, index) => {
    const path = [...parentPath, index];
    const className = `${baseClass}__node-${path.join('-')}`;
    const selector = `.${className}`;
    const responsiveStyles = block.responsiveStyles;

    if (responsiveStyles) {
      cssRules.push({
        selector,
        large: responsiveStyles.large || {},
        medium: responsiveStyles.medium,
        small: responsiveStyles.small
      });
    }

    const inlineStyles = Object.entries(block.bindings || {})
      .filter(([binding]) => binding.startsWith('style.'))
      .flatMap(([binding, expression]) => {
        const settingId = extractBindingKey(expression);
        if (!settingId) return [];
        const property = camelToKebab(binding.slice('style.'.length));
        return [`${property}: {{ section.settings.${settingId} | escape }};`];
      });
    const styleAttribute = inlineStyles.length
      ? ` style="${inlineStyles.join(' ')}"`
      : '';

    const children = renderBuilderBlocks(block.children, baseClass, cssRules, report, path);
    const componentName = block.component?.name || '';
    const options = block.component?.options || {};
    const normalizedName = componentName.trim().toLowerCase();
    const textBinding = getComponentBinding(block, 'text');
    const text = renderValue(textBinding, options.text, true);
    let markup: string;

    if (normalizedName === 'custom code') {
      markup = wrapComponent(className, String(options.code || ''), children, styleAttribute);
    } else if (normalizedName === 'heading') {
      const requestedLevel = Number(options.level) || 2;
      const tag = `h${Math.min(6, Math.max(1, requestedLevel))}`;
      markup = `<${tag} class="${className}"${styleAttribute}>${text}${children}</${tag}>`;
    } else if (normalizedName === 'text') {
      markup = wrapComponent(className, text, children, styleAttribute);
    } else if (normalizedName === 'button') {
      const href = renderValue(getComponentBinding(block, 'link'), options.link || '#', true);
      markup = `<a class="${className}" href="${href}"${styleAttribute}>${text}${children}</a>`;
    } else if (normalizedName === 'image') {
      const imageSource = renderValue(
        getComponentBinding(block, 'image') || getComponentBinding(block, 'src'),
        options.image || options.src || '',
        true
      );
      const alt = escapeHtml(String(options.alt || ''));
      markup = `<img class="${className}" src="${imageSource}" alt="${alt}"${styleAttribute} />${children}`;
    } else if (normalizedName === 'card') {
      const title = renderValue(getComponentBinding(block, 'title'), options.title || '', true);
      const description = renderValue(getComponentBinding(block, 'desc'), options.desc || '', true);
      markup = `<article class="${className}"${styleAttribute}><h3>${title}</h3><p>${description}</p>${children}</article>`;
    } else {
      if (componentName && !['box', 'container', 'column', 'columns', 'section', 'fragment', 'div'].includes(normalizedName)) {
        report.push({
          id: `unsupported-${path.join('-')}`,
          severity: 'unsupported',
          blockName: componentName,
          title: `Component not specifically mapped: "${componentName}"`,
          details: 'The Builder component was retained as a generic container; its component-specific behavior may need manual conversion.',
          suggestedAction: 'Replace this output with theme-compatible markup for the Builder component.'
        });
      }
      const content = options.text !== undefined
        ? text
        : options.title !== undefined
          ? renderValue(getComponentBinding(block, 'title'), options.title, true)
          : '';
      markup = wrapComponent(className, content, children, styleAttribute);
    }

    const showSetting = block.show ? extractBindingKey(block.show) : null;
    return showSetting
      ? `{% if section.settings.${showSetting} != blank %}\n${markup}\n{% endif %}`
      : markup;
  }).join('\n');
}

function getComponentBinding(block: BuilderBlockNode, option: string): string | undefined {
  return Object.entries(block.bindings || {}).find(
    ([binding]) => binding === `component.options.${option}`
  )?.[1];
}

function renderValue(binding: string | undefined, fallback: unknown, escape: boolean): string {
  const settingId = extractBindingKey(binding);
  if (settingId) {
    return `{{ section.settings.${settingId}${escape ? ' | escape' : ''} }}`;
  }
  const value = fallback == null ? '' : String(fallback);
  return escape && !/<[a-z][\s\S]*>/i.test(value) ? escapeHtml(value) : value;
}

function wrapComponent(className: string, content: string, children: string, styleAttribute: string): string {
  return `<div class="${className}"${styleAttribute}>${content}${children}</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
