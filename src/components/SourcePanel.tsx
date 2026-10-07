import React, { useState } from 'react';
import { Layers, FileJson, CheckCircle2, ChevronRight, ChevronDown, Sparkles, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { BuilderEntry, BuilderBlockNode } from '../types/builder';
import { useSettings } from '../context/SettingsContext';

interface SourcePanelProps {
  entries: BuilderEntry[];
  selectedEntry: BuilderEntry;
  onSelectEntry: (entry: BuilderEntry) => void;
  rawJson: string;
  onRawJsonChange: (json: string) => void;
  onOpenSettings: () => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
  rawJson,
  onRawJsonChange,
  onOpenSettings
}) => {
  const { settings } = useSettings();
  const [sourceMode, setSourceMode] = useState<'explorer' | 'json'>('explorer');
  const [selectedModel, setSelectedModel] = useState<string>(selectedEntry.modelName || 'hero-section');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    block_hero_container: true,
    block_hero_content: true,
    block_bg_image_wrap: true
  });
  const [jsonError, setJsonError] = useState<string | null>(null);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleJsonChange = (val: string) => {
    onRawJsonChange(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'Malformed JSON');
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      const formatted = JSON.stringify(parsed, null, 2);
      onRawJsonChange(formatted);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'Cannot format invalid JSON');
    }
  };

  const renderBlockNode = (node: BuilderBlockNode, depth = 0) => {
    const nodeId = node.id || Math.random().toString(36).substring(2, 7);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[nodeId] ?? true;
    const componentName = node.component?.name || (node.children ? 'Container' : 'Element');
    const hasBindings = node.bindings && Object.keys(node.bindings).length > 0;
    const hasShow = !!node.show;

    return (
      <div key={nodeId} className="tree-node-item" style={{ paddingLeft: `${depth * 14}px` }}>
        <div className="tree-node-row">
          {hasChildren ? (
            <button
              type="button"
              className="tree-expand-toggle"
              onClick={() => toggleNode(nodeId)}
              aria-label="Toggle node"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="tree-expand-spacer" />
          )}

          <div className="tree-node-content">
            <span className="node-layer-name">{node.layerName || componentName}</span>
            <span className="node-component-badge">{componentName}</span>

            {hasBindings && (
              <span className="node-flag-tag binding" title="Contains dynamic setting binding">
                bind
              </span>
            )}
            {hasShow && (
              <span className="node-flag-tag show" title="Conditional visibility rule">
                show
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-children-container">
            {node.children!.map(child => renderBlockNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="panel-column source-column" aria-label="Builder section source">
      {/* Column Header */}
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-index">01 / SOURCE</span>
          <div className="source-mode-toggles">
            <button
              type="button"
              className={`mode-toggle-btn ${sourceMode === 'explorer' ? 'active' : ''}`}
              onClick={() => setSourceMode('explorer')}
            >
              <Layers size={12} />
              <span>EXPLORER</span>
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${sourceMode === 'json' ? 'active' : ''}`}
              onClick={() => setSourceMode('json')}
            >
              <FileJson size={12} />
              <span>JSON AST</span>
            </button>
          </div>
        </div>

        <div className="source-space-indicator" onClick={onOpenSettings} title="Click to edit Builder space credentials">
          <span className="status-dot online"></span>
          <span className="space-label">{settings.builder.spaceName || 'Sandbox Space'}</span>
        </div>
      </div>

      {sourceMode === 'explorer' ? (
        <div className="source-explorer-content">
          {/* Space connection banner */}
          <div className="space-summary-card">
            <div className="space-meta-row">
              <div className="space-chip">
                <Key size={11} />
                <span>Public Key: {settings.builder.publicKey.substring(0, 12)}...</span>
              </div>
              <button type="button" className="edit-space-btn" onClick={onOpenSettings}>
                Configure
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div className="source-section-block">
            <div className="section-micro-header">
              <span>SELECT MODEL</span>
              <span className="section-micro-sub">Section Models</span>
            </div>
            <div className="model-pill-group">
              {['hero-section', 'announcement-bar', 'benefit-grid'].map(model => (
                <button
                  key={model}
                  type="button"
                  className={`model-pill ${selectedModel === model ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedModel(model);
                    const matching = entries.find(e => e.modelName === model);
                    if (matching) onSelectEntry(matching);
                  }}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Entries list */}
          <div className="source-section-block">
            <div className="section-micro-header">
              <span>ENTRIES ({entries.length})</span>
              <span className="section-micro-sub">Pick to convert</span>
            </div>
            <div className="entry-cards-list">
              {entries.map(entry => {
                const isSelected = selectedEntry.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={`entry-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectEntry(entry);
                      setSelectedModel(entry.modelName);
                    }}
                  >
                    <div className="entry-card-header">
                      <h4 className="entry-title">{entry.name}</h4>
                      {isSelected && <CheckCircle2 size={14} className="entry-selected-check" />}
                    </div>
                    <div className="entry-card-meta">
                      <span className="entry-model-tag">{entry.modelName}</span>
                      <span className="entry-updated-text">{entry.lastUpdated}</span>
                      <span className="entry-published-status">{entry.published}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block Tree Hierarchy */}
          <div className="source-section-block block-tree-section">
            <div className="section-micro-header">
              <span>BLOCK TREE HIERARCHY</span>
              <span className="section-micro-sub">
                {selectedEntry.data.blocks?.length || 0} Root Blocks
              </span>
            </div>
            <div className="block-tree-viewport">
              {selectedEntry.data.blocks && selectedEntry.data.blocks.length > 0 ? (
                selectedEntry.data.blocks.map(rootBlock => renderBlockNode(rootBlock))
              ) : (
                <div className="empty-tree-notice">No blocks found in this section entry.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Raw JSON mode */
        <div className="source-json-content">
          <div className="json-toolbar">
            <span className="json-stat">
              {rawJson.length} characters &bull; {jsonError ? 'Syntax error' : 'Valid AST'}
            </span>
            <button type="button" className="format-json-btn" onClick={formatJson}>
              Format JSON
            </button>
          </div>
          {jsonError && (
            <div className="json-error-banner">
              <AlertTriangle size={13} />
              <span>{jsonError}</span>
            </div>
          )}
          <textarea
            className="code-textarea"
            value={rawJson}
            onChange={e => handleJsonChange(e.target.value)}
            spellCheck="false"
            aria-label="Raw Builder JSON AST"
          />
        </div>
      )}
    </section>
  );
};
