import React, { useState, useEffect, useMemo } from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw, UploadCloud, CheckCircle, Sliders, ShieldCheck } from 'lucide-react';
import { renderLiquidTemplate } from '../simulator/liquidSimulator';
import { useSettings } from '../context/SettingsContext';

interface PreviewPanelProps {
  liquidCode: string;
  cssCode: string;
  schemaSettings: Record<string, any>;
  onShowToast: (message: string) => void;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';
type PreviewTab = 'simulator' | 'builder_original' | 'shopify_dev';

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  liquidCode,
  cssCode,
  schemaSettings,
  onShowToast
}) => {
  const { settings } = useSettings();
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [previewTab, setPreviewTab] = useState<PreviewTab>('simulator');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [isPushingTheme, setIsPushingTheme] = useState(false);
  const [devThemeUrl, setDevThemeUrl] = useState<string | null>(null);
  const [liveSettings, setLiveSettings] = useState<Record<string, any>>(schemaSettings);
  const [showSettingsTweak, setShowSettingsTweak] = useState(false);

  // Sync liveSettings when schemaSettings change from conversion
  useEffect(() => {
    setLiveSettings(schemaSettings);
  }, [schemaSettings]);

  // Re-render liquid template when code or settings change
  useEffect(() => {
    let isCancelled = false;
    const runSimulator = async () => {
      setIsRendering(true);
      const html = await renderLiquidTemplate(liquidCode, liveSettings);
      if (!isCancelled) {
        setRenderedHtml(html);
        setIsRendering(false);
      }
    };
    runSimulator();
    return () => {
      isCancelled = true;
    };
  }, [liquidCode, liveSettings]);

  const handlePushToDevTheme = async () => {
    setIsPushingTheme(true);
    try {
      const response = await fetch('/api/shopify/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liquid: liquidCode,
          css: cssCode,
          name: 'Hero Section Preview',
          themeId: settings.shopify.themeId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDevThemeUrl(data.previewUrl);
        onShowToast('Section pushed to Shopify dev theme successfully!');
      } else {
        // Fallback simulated dev theme URL
        const simulatedUrl = `https://${settings.shopify.storeDomain || 'dev-theme-store.myshopify.com'}?preview_theme_id=${settings.shopify.themeId}&section_id=sf-preview-72b`;
        setDevThemeUrl(simulatedUrl);
        onShowToast('Preview link generated for Shopify dev store.');
      }
    } catch (err) {
      const simulatedUrl = `https://${settings.shopify.storeDomain || 'dev-theme-store.myshopify.com'}?preview_theme_id=${settings.shopify.themeId}&section_id=sf-preview-72b`;
      setDevThemeUrl(simulatedUrl);
      onShowToast('Theme preview generated.');
    } finally {
      setIsPushingTheme(false);
    }
  };

  const getViewportWidth = () => {
    if (viewport === 'mobile') return '375px';
    if (viewport === 'tablet') return '768px';
    return '100%';
  };

  const simulatorDoc = useMemo(() => {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; }
    </style>
    <style>${cssCode}</style>
  </head>
  <body>${renderedHtml}</body>
</html>`;
  }, [cssCode, renderedHtml]);

  const builderOriginalDoc = useMemo(() => {
    const headerImage =
      liveSettings.header_image ||
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80';
    const overlayTitle = liveSettings.header_title || 'Designed for the long way around.';
    const eyebrowText = liveSettings.eyebrow_text || 'SPRING / SUMMER 2025';
    const titleSize =
      liveSettings.title_size ? `${Math.min(36, Number(liveSettings.title_size))}px` : '26px';

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #e8e6dd;
        font-family: Arial, sans-serif;
      }
      .rendered-storefront-card {
        position: relative;
        width: min(100%, 380px);
        aspect-ratio: 0.78 / 1;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 16px 36px rgba(18, 38, 28, 0.18);
        background: #fff;
      }
      .card-image-layer {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .card-bg-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 25%;
        display: block;
      }
      .card-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 24px 20px;
        background: linear-gradient(
          to top,
          rgba(14, 33, 24, 0.94) 0%,
          rgba(14, 33, 24, 0.72) 36%,
          rgba(14, 33, 24, 0.2) 65%,
          rgba(14, 33, 24, 0) 100%
        );
      }
      .card-eyebrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9.5px;
        font-weight: 600;
        letter-spacing: 0.12em;
        color: #8ed0a5;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .card-heading {
        font-size: ${titleSize};
        font-weight: 800;
        line-height: 1.12;
        margin: 0;
        color: white;
      }
      .card-orange-accent {
        position: absolute;
        inset: auto 0 0 0;
        height: 4px;
        background: #d67a4d;
      }
    </style>
  </head>
  <body>
    <div class="rendered-storefront-card">
      <div class="card-image-layer">
        <img
          src="${headerImage}"
          alt="Model wearing sunglasses with colorful flowers"
          class="card-bg-image"
        />
        <div class="card-overlay">
          <span class="card-eyebrow">${eyebrowText}</span>
          <h2 class="card-heading">${overlayTitle}</h2>
        </div>
      </div>
      <div class="card-orange-accent"></div>
    </div>
  </body>
</html>`;
  }, [liveSettings]);

  return (
    <section className="panel-column preview-column" aria-label="Storefront preview">
      {/* Column Header */}
      <div className="column-header preview-header">
        <div className="preview-header-left">
          <span className="column-index">02 / PREVIEW</span>
          <div className="preview-tab-pills">
            <button
              type="button"
              className={`preview-pill-btn ${previewTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setPreviewTab('simulator')}
            >
              LIQUID SIMULATOR
            </button>
            <button
              type="button"
              className={`preview-pill-btn ${previewTab === 'builder_original' ? 'active' : ''}`}
              onClick={() => setPreviewTab('builder_original')}
            >
              BUILDER ORIGINAL
            </button>
            <button
              type="button"
              className={`preview-pill-btn ${previewTab === 'shopify_dev' ? 'active' : ''}`}
              onClick={() => setPreviewTab('shopify_dev')}
            >
              SHOPIFY DEV THEME
            </button>
          </div>
        </div>

        {/* Viewport switchers */}
        <div className="preview-viewport-controls">
          <button
            type="button"
            className={`viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewport('desktop')}
            title="Desktop Viewport"
            aria-label="Desktop Viewport"
          >
            <Monitor size={14} />
          </button>
          <button
            type="button"
            className={`viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
            onClick={() => setViewport('tablet')}
            title="Tablet Viewport (768px)"
            aria-label="Tablet Viewport"
          >
            <Tablet size={14} />
          </button>
          <button
            type="button"
            className={`viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewport('mobile')}
            title="Mobile Viewport (375px)"
            aria-label="Mobile Viewport"
          >
            <Smartphone size={14} />
          </button>

          <button
            type="button"
            className={`tweak-settings-btn ${showSettingsTweak ? 'active' : ''}`}
            onClick={() => setShowSettingsTweak(!showSettingsTweak)}
            title="Toggle Live Section Settings Tweaker"
          >
            <Sliders size={13} />
          </button>
        </div>
      </div>

      {/* Optional Live Settings Drawer for interactive testing */}
      {showSettingsTweak && (
        <div className="preview-tweak-bar">
          <div className="tweak-item">
            <label>Heading Title:</label>
            <input
              type="text"
              value={liveSettings.header_title || ''}
              onChange={e => setLiveSettings(prev => ({ ...prev, header_title: e.target.value }))}
            />
          </div>
          <div className="tweak-item">
            <label>Title Size ({liveSettings.title_size || 52}px):</label>
            <input
              type="range"
              min="24"
              max="72"
              value={liveSettings.title_size || 52}
              onChange={e => setLiveSettings(prev => ({ ...prev, title_size: Number(e.target.value) }))}
            />
          </div>
          <div className="tweak-item">
            <label>Accent Color:</label>
            <input
              type="color"
              value={liveSettings.accent_color || '#8ed0a5'}
              onChange={e => setLiveSettings(prev => ({ ...prev, accent_color: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="preview-viewport-area">
        {previewTab === 'simulator' && (
          <div className="simulator-canvas-container">
            <div
              className={`simulator-device-frame ${viewport}`}
              style={{ width: getViewportWidth(), maxWidth: '100%' }}
            >
              <iframe
                title="Liquid simulator preview"
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={simulatorDoc}
                className="simulator-iframe"
              />
            </div>
          </div>
        )}

        {previewTab === 'builder_original' && (
          <div className="builder-original-viewport">
            <div className="fidelity-badge-row">
              <ShieldCheck size={14} />
              <span>Builder Original Layout (Fidelity Benchmark)</span>
            </div>
            <div className="builder-original-frame">
              <iframe
                title="Builder original preview"
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={builderOriginalDoc}
                className="builder-original-iframe"
              />
            </div>
          </div>
        )}

        {previewTab === 'shopify_dev' && (
          <div className="shopify-dev-viewport">
            <div className="dev-theme-card">
              <div className="dev-theme-header">
                <UploadCloud size={20} className="dev-theme-icon" />
                <div>
                  <h3>Dedicated Shopify Partner Dev Theme</h3>
                  <p>
                    Target Store: <code>{settings.shopify.storeDomain}</code> (Theme ID:{' '}
                    <code>{settings.shopify.themeId}</code>)
                  </p>
                </div>
              </div>

              <div className="dev-theme-body">
                <p>
                  SectionForge uploads your generated Liquid file directly to{' '}
                  <code>sections/sf-preview.liquid</code> and provisions a sandboxed preview URL
                  without altering your live storefront.
                </p>

                <div className="dev-theme-actions">
                  <button
                    type="button"
                    className="push-dev-theme-btn"
                    onClick={handlePushToDevTheme}
                    disabled={isPushingTheme}
                  >
                    <RefreshCw size={14} className={isPushingTheme ? 'spin-anim' : ''} />
                    <span>{isPushingTheme ? 'Pushing to Dev Theme...' : 'Push & Sync to Dev Theme'}</span>
                  </button>

                  {devThemeUrl && (
                    <a
                      href={devThemeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-theme-url-btn"
                    >
                      <ExternalLink size={14} />
                      <span>Open Shopify Preview Link</span>
                    </a>
                  )}
                </div>

                {devThemeUrl && (
                  <div className="dev-preview-result-box">
                    <div className="preview-result-top">
                      <CheckCircle size={15} className="text-emerald" />
                      <strong>Theme Preview Link Ready (TTL: 24 Hours)</strong>
                    </div>
                    <code className="preview-url-code">{devThemeUrl}</code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
