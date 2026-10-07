export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function formatCssProperties(styles: Record<string, string | number>): string {
  return Object.entries(styles)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, value]) => `  ${camelToKebab(key)}: ${value};`)
    .join('\n');
}

export interface ScopedRule {
  selector: string;
  large: Record<string, string | number>;
  medium?: Record<string, string | number>;
  small?: Record<string, string | number>;
}

export function generateResponsiveCss(
  rules: ScopedRule[],
  breakpoints = { medium: 991, small: 640 }
): string {
  const largeBlocks: string[] = [];
  const mediumBlocks: string[] = [];
  const smallBlocks: string[] = [];

  for (const rule of rules) {
    if (rule.large && Object.keys(rule.large).length > 0) {
      largeBlocks.push(`${rule.selector} {\n${formatCssProperties(rule.large)}\n}`);
    }
    if (rule.medium && Object.keys(rule.medium).length > 0) {
      mediumBlocks.push(`  ${rule.selector} {\n${formatCssProperties(rule.medium).replace(/^  /gm, '    ')}\n  }`);
    }
    if (rule.small && Object.keys(rule.small).length > 0) {
      smallBlocks.push(`  ${rule.selector} {\n${formatCssProperties(rule.small).replace(/^  /gm, '    ')}\n  }`);
    }
  }

  let cssOutput = `/* SectionForge Scoped Styles */\n` + largeBlocks.join('\n\n');

  if (mediumBlocks.length > 0) {
    cssOutput += `\n\n@media screen and (max-width: ${breakpoints.medium}px) {\n${mediumBlocks.join('\n\n')}\n}`;
  }

  if (smallBlocks.length > 0) {
    cssOutput += `\n\n@media screen and (max-width: ${breakpoints.small}px) {\n${smallBlocks.join('\n\n')}\n}`;
  }

  return cssOutput;
}
