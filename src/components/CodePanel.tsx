import React, { useState } from 'react';
import { Copy, Check, RotateCcw, FileCode, Palette, Braces, AlertCircle, Info, AlertTriangle, Download } from 'lucide-react';
import { ConversionOutput } from '../types/liquid';

interface CodePanelProps {
  conversion: ConversionOutput;
  liquidCode: string;
  cssCode: string;
  onLiquidChange: (val: string) => void;
  onCssChange: (val: string) => void;
  onReset: () => void;
  onShowToast: (message: string) => void;
}

type TabType = 'liquid' | 'css' | 'schema' | 'report';

export const CodePanel: React.FC<CodePanelProps> = ({
  conversion,
  liquidCode,
  cssCode,
  onLiquidChange,
  onCssChange,
  onReset,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('liquid');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTab(label);
      onShowToast(`${label} copied to clipboard.`);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      onShowToast('Failed to copy to clipboard');
    }
  };

  const copyCurrentTab = () => {
    if (activeTab === 'liquid') {
      copyToClipboard(liquidCode, 'Liquid markup');
    } else if (activeTab === 'css') {
      copyToClipboard(cssCode, 'CSS Stylesheet');
    } else if (activeTab === 'schema') {
      copyToClipboard(JSON.stringify(conversion.schema, null, 2), 'Schema JSON');
    } else if (activeTab === 'report') {
      copyToClipboard(
        JSON.stringify(conversion.report, null, 2),
        'Conversion Report'
      );
    }
  };

  const copyFullSection = () => {
    const full = `${liquidCode}

{% stylesheet %}
${cssCode}
{% endstylesheet %}

{% schema %}
${JSON.stringify(conversion.schema, null, 2)}
{% endschema %}`;
    copyToClipboard(full, 'Full Shopify Section (.liquid)');
  };

  const warningsCount = conversion.report.filter(r => r.severity === 'warning').length;

  return (
    <section className="panel-column code-column" aria-label="Generated Shopify code">
      {/* Code Column Header */}
      <div className="column-header code-header">
        <div className="tab-group" role="tablist">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'liquid' ? 'active' : ''}`}
            onClick={() => setActiveTab('liquid')}
            role="tab"
            aria-selected={activeTab === 'liquid'}
          >
            <FileCode size={12} className="tab-icon" />
            <span>LIQUID</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
            role="tab"
            aria-selected={activeTab === 'css'}
          >
            <Palette size={12} className="tab-icon" />
            <span>CSS</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
            onClick={() => setActiveTab('schema')}
            role="tab"
            aria-selected={activeTab === 'schema'}
          >
            <Braces size={12} className="tab-icon" />
            <span>SCHEMA</span>
          </button>
          <button
            type="button"
            className={`tab-btn report-tab ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
            role="tab"
            aria-selected={activeTab === 'report'}
          >
            <AlertCircle size={12} className="tab-icon" />
            <span>REPORT</span>
            {warningsCount > 0 && <span className="warning-count-pill">{warningsCount}</span>}
          </button>
        </div>

        <div className="code-header-actions">
          <button
            type="button"
            className="secondary-code-action-btn"
            onClick={onReset}
            title="Reset code to original generated output"
          >
            <RotateCcw size={11} />
            <span>RESET</span>
          </button>

          <button
            type="button"
            className="copy-action-btn"
            onClick={copyCurrentTab}
            title="Copy currently selected tab"
          >
            {copiedTab ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedTab ? 'COPIED!' : 'COPY TAB'}</span>
          </button>

          <button
            type="button"
            className="copy-full-section-btn"
            onClick={copyFullSection}
            title="Copy ready-to-paste .liquid section containing markup, stylesheet, and schema"
          >
            <span>COPY FULL SECTION</span>
          </button>
        </div>
      </div>

      {/* Editor & Viewports */}
      <div className="code-viewport">
        {activeTab === 'liquid' && (
          <div className="editor-container">
            <div className="editor-subhead">
              <span className="editor-mode-label">Editable Liquid Markup</span>
              <span className="editor-hint">Changes automatically reflect in the theme simulator</span>
            </div>
            <textarea
              className="code-textarea dark-mode"
              value={liquidCode}
              onChange={e => onLiquidChange(e.target.value)}
              spellCheck="false"
              aria-label="Shopify Liquid markup editor"
            />
          </div>
        )}

        {activeTab === 'css' && (
          <div className="editor-container">
            <div className="editor-subhead">
              <span className="editor-mode-label">Scoped Section Stylesheet</span>
              <span className="editor-hint">Includes base styles and media query breakpoints</span>
            </div>
            <textarea
              className="code-textarea dark-mode"
              value={cssCode}
              onChange={e => onCssChange(e.target.value)}
              spellCheck="false"
              aria-label="Shopify CSS stylesheet editor"
            />
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="editor-container">
            <div className="editor-subhead">
              <span className="editor-mode-label">Shopify Theme Schema (Read-only JSON)</span>
              <span className="editor-hint">{conversion.schema.settings.length} settings mapped</span>
            </div>
            <pre className="code-content schema-view">
              <code>{JSON.stringify(conversion.schema, null, 2)}</code>
            </pre>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="report-viewport">
            {/* Report Header stats */}
            <div className="report-stats-grid">
              <div className="report-stat-card">
                <span className="stat-label">SCHEMA SETTINGS</span>
                <span className="stat-value">{conversion.stats.settingsCount}</span>
              </div>
              <div className="report-stat-card">
                <span className="stat-label">BLOCKS PROCESSED</span>
                <span className="stat-value">{conversion.stats.blocksCount}</span>
              </div>
              <div className="report-stat-card">
                <span className="stat-label">WARNINGS</span>
                <span className={`stat-value ${warningsCount > 0 ? 'warning' : 'ok'}`}>
                  {warningsCount}
                </span>
              </div>
              <div className="report-stat-card">
                <span className="stat-label">STRIPPED NOISE</span>
                <span className="stat-value">{conversion.stats.droppedHelpersCount} scripts</span>
              </div>
            </div>

            {/* Findings list */}
            <div className="report-items-list">
              <div className="report-items-header">
                <h3>Conversion Fidelity &amp; Audit Log</h3>
                <span className="report-timestamp">Generated at {conversion.timestamp}</span>
              </div>

              {conversion.report.length === 0 ? (
                <div className="empty-report-card">
                  <Check size={18} className="text-emerald" />
                  <div>
                    <strong>100% Clean Conversion</strong>
                    <p>All bindings, settings, and styles mapped directly with zero warnings.</p>
                  </div>
                </div>
              ) : (
                conversion.report.map((item, index) => (
                  <div key={`${item.id}-${index}`} className={`report-item-card ${item.severity}`}>
                    <div className="report-item-header">
                      <div className="report-item-badge-wrap">
                        {item.severity === 'warning' ? (
                          <span className="severity-badge warning">
                            <AlertTriangle size={11} /> WARNING
                          </span>
                        ) : item.severity === 'unsupported' ? (
                          <span className="severity-badge unsupported">
                            <AlertCircle size={11} /> UNSUPPORTED
                          </span>
                        ) : (
                          <span className="severity-badge info">
                            <Info size={11} /> INFO
                          </span>
                        )}
                        <span className="report-block-target">{item.blockName}</span>
                      </div>
                      <h4 className="report-item-title">{item.title}</h4>
                    </div>

                    <p className="report-item-details">{item.details}</p>

                    {item.suggestedAction && (
                      <div className="report-suggested-action">
                        <strong>Action:</strong> {item.suggestedAction}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
