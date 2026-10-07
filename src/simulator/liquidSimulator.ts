import { Liquid } from 'liquidjs';

const engine = new Liquid({
  strictFilters: false,
  strictVariables: false
});

// Register Shopify Liquid filters
engine.registerFilter('image_url', (src: string, options?: any) => {
  if (!src) return '';
  return src;
});

engine.registerFilter('image_tag', (src: string, ...args: any[]) => {
  let className = '';
  let alt = '';
  let loading = 'lazy';

  for (const arg of args) {
    if (typeof arg === 'string') {
      const classMatch = arg.match(/class:\s*['"]([^'"]+)['"]/);
      if (classMatch) className = classMatch[1];
      const altMatch = arg.match(/alt:\s*['"]([^'"]+)['"]/);
      if (altMatch) alt = altMatch[1];
      const loadMatch = arg.match(/loading:\s*['"]([^'"]+)['"]/);
      if (loadMatch) loading = loadMatch[1];
    }
  }

  return `<img src="${src}" class="${className}" alt="${alt}" loading="${loading}" />`;
});

engine.registerFilter('asset_url', (src: string) => src);

export async function renderLiquidTemplate(
  liquidCode: string,
  sectionSettings: Record<string, any>
): Promise<string> {
  try {
    const context = {
      section: {
        id: 'template--preview',
        settings: sectionSettings
      },
      request: {
        design_mode: false
      }
    };
    return await engine.parseAndRender(liquidCode, context);
  } catch (error: any) {
    return `<div style="padding: 24px; color: #e5572b; font-family: monospace; font-size: 13px; background: #fff5f2; border: 1px solid #f9c7be; border-radius: 4px;">
      <strong>Liquid Simulator Parse Error:</strong><br/>
      ${error?.message || 'Syntax error'}
    </div>`;
  }
}
