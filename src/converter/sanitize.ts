import { BuilderEntry, BuilderBlockNode } from '../types/builder';

/**
 * Sanitizes Builder JSON before LLM processing or code generation:
 * - Drops Builder runtime JS scripts, state, inputs, animation metadata
 * - Recursively strips internal noise while preserving block hierarchy, bindings, and responsive styles
 */
export function sanitizeBuilderEntry(entry: BuilderEntry): BuilderEntry {
  const cleanBlocks = (blocks?: BuilderBlockNode[]): BuilderBlockNode[] => {
    if (!blocks) return [];
    return blocks
      .filter(block => {
        // Drop builder/theme-editor design mode helpers
        const code = block.component?.options?.code || '';
        if (code.includes('request.design_mode') || code.includes('Builder live theme sync')) {
          return false;
        }
        return true;
      })
      .map(block => {
        const cleaned: BuilderBlockNode = {
          layerName: block.layerName,
          component: block.component ? {
            name: block.component.name,
            options: { ...block.component.options }
          } : undefined,
          responsiveStyles: block.responsiveStyles,
          bindings: block.bindings,
          show: block.show,
          repeat: block.repeat,
          children: cleanBlocks(block.children)
        };
        return cleaned;
      });
  };

  return {
    id: entry.id,
    name: entry.name,
    modelName: entry.modelName,
    lastUpdated: entry.lastUpdated,
    published: entry.published,
    data: {
      sectionData: entry.data.sectionData || [],
      customFonts: entry.data.customFonts || [],
      blocks: cleanBlocks(entry.data.blocks)
    }
  };
}
