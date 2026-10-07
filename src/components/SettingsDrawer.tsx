import React, { useState } from 'react';
import { X, Key, Shield, User, Store, Cpu, Check, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { TEST_PROFILES } from '../context/AuthContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

type TabType = 'profile' | 'builder' | 'shopify' | 'ai' | 'preferences';

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onShowToast }) => {
  const { currentUser, storageTarget, loginAs, loginCustom, setStorageTarget, clearSession } = useAuth();
  const {
    settings,
    updateBuilderConfig,
    updateShopifyConfig,
    updateConversionConfig,
    setAnthropicApiKey,
    testBuilderConnection,
    testShopifyConnection,
    resetToDefaults
  } = useSettings();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isTestingBuilder, setIsTestingBuilder] = useState(false);
  const [builderTestResult, setBuilderTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingShopify, setIsTestingShopify] = useState(false);
  const [shopifyTestResult, setShopifyTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  if (!isOpen) return null;

  const handleTestBuilder = async () => {
    setIsTestingBuilder(true);
    setBuilderTestResult(null);
    try {
      const res = await testBuilderConnection();
      setBuilderTestResult(res);
      onShowToast(res.message);
    } finally {
      setIsTestingBuilder(false);
    }
  };

  const handleTestShopify = async () => {
    setIsTestingShopify(true);
    setShopifyTestResult(null);
    try {
      const res = await testShopifyConnection();
      setShopifyTestResult(res);
      onShowToast(res.message);
    } finally {
      setIsTestingShopify(false);
    }
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    loginCustom(customName, customEmail || `${customName.toLowerCase().replace(/\s+/g, '')}@example.com`);
    setShowCustomForm(false);
    onShowToast(`Signed in as ${customName}`);
  };

  return (
    <div className="settings-drawer-overlay" onClick={onClose} aria-label="Close settings drawer">
      <div
        className="settings-drawer-container"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="User Settings"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-title">
            <span className="drawer-eyebrow">CONFIGURATION &amp; SESSION</span>
            <h2 className="drawer-title">User Settings</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="drawer-nav-tabs">
          <button
            className={`drawer-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={14} />
            <span>Profile &amp; Auth</span>
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            <Key size={14} />
            <span>Builder.io</span>
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Cpu size={14} />
            <span>Claude AI</span>
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'shopify' ? 'active' : ''}`}
            onClick={() => setActiveTab('shopify')}
          >
            <Store size={14} />
            <span>Shopify Dev</span>
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Shield size={14} />
            <span>Preferences</span>
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="drawer-body">
          {/* TAB 1: Profile & Auth */}
          {activeTab === 'profile' && (
            <div className="drawer-section">
              <div className="user-profile-badge-card">
                <div
                  className="user-profile-avatar"
                  style={{ backgroundColor: currentUser?.avatarColor || '#153123' }}
                >
                  {currentUser?.initials || 'U'}
                </div>
                <div className="user-profile-info">
                  <div className="user-profile-name">{currentUser?.name || 'Anonymous Visitor'}</div>
                  <div className="user-profile-role">{currentUser?.roleTitle || 'Developer Mode'}</div>
                  <div className="user-profile-email">{currentUser?.email || 'No email attached'}</div>
                </div>
              </div>

              <div className="settings-field-group">
                <label className="field-label">Active Space</label>
                <div className="field-readonly-value">
                  {currentUser?.spaceName || settings.builder.spaceName || 'Default Sandbox'}
                </div>
              </div>

              {/* Quick switch test profiles */}
              <div className="settings-field-group">
                <div className="field-label-row">
                  <label className="field-label">Switch Test Profile</label>
                  <span className="field-badge">Instant Login</span>
                </div>
                <p className="field-help-text">
                  Switch between pre-configured persona sessions stored in your browser.
                </p>

                <div className="test-profiles-grid">
                  {TEST_PROFILES.map(profile => (
                    <button
                      key={profile.id}
                      type="button"
                      className={`profile-card-btn ${currentUser?.id === profile.id ? 'selected' : ''}`}
                      onClick={() => {
                        loginAs(profile);
                        onShowToast(`Logged in as ${profile.name}`);
                      }}
                    >
                      <div className="profile-btn-avatar" style={{ backgroundColor: profile.avatarColor }}>
                        {profile.initials}
                      </div>
                      <div className="profile-btn-details">
                        <div className="profile-btn-name">{profile.name}</div>
                        <div className="profile-btn-role">{profile.roleTitle}</div>
                      </div>
                      {currentUser?.id === profile.id && <Check size={16} className="profile-check-icon" />}
                    </button>
                  ))}
                </div>

                {!showCustomForm ? (
                  <button
                    type="button"
                    className="custom-signin-link-btn"
                    onClick={() => setShowCustomForm(true)}
                  >
                    + Sign in as custom user
                  </button>
                ) : (
                  <form onSubmit={handleCustomLogin} className="custom-user-form">
                    <div className="form-row">
                      <label className="field-sublabel">Full Name</label>
                      <input
                        type="text"
                        className="field-text-input"
                        placeholder="e.g. Alex Chen"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label className="field-sublabel">Email Address</label>
                      <input
                        type="email"
                        className="field-text-input"
                        placeholder="alex@example.com"
                        value={customEmail}
                        onChange={e => setCustomEmail(e.target.value)}
                      />
                    </div>
                    <div className="custom-form-actions">
                      <button type="submit" className="save-btn-small">
                        Apply Profile
                      </button>
                      <button
                        type="button"
                        className="cancel-btn-small"
                        onClick={() => setShowCustomForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Browser storage policy */}
              <div className="settings-field-group">
                <label className="field-label">Browser Session Persistence</label>
                <div className="storage-toggle-row">
                  <button
                    type="button"
                    className={`storage-pill ${storageTarget === 'localStorage' ? 'active' : ''}`}
                    onClick={() => {
                      setStorageTarget('localStorage');
                      onShowToast('Session persistence set to localStorage');
                    }}
                  >
                    localStorage (Persistent across tabs)
                  </button>
                  <button
                    type="button"
                    className={`storage-pill ${storageTarget === 'sessionStorage' ? 'active' : ''}`}
                    onClick={() => {
                      setStorageTarget('sessionStorage');
                      onShowToast('Session persistence set to sessionStorage');
                    }}
                  >
                    sessionStorage (Cleared on tab close)
                  </button>
                </div>
              </div>

              <div className="privacy-callout">
                <Shield size={16} className="privacy-icon" />
                <div>
                  <strong>Session Privacy Guarantee</strong>
                  <p>
                    All API keys and content are stored in this browser session only. Credentials are never
                    stored on third-party servers.
                  </p>
                </div>
              </div>

              <div className="drawer-footer-actions">
                <button
                  type="button"
                  className="danger-action-btn"
                  onClick={() => {
                    clearSession();
                    onShowToast('Browser session cleared.');
                  }}
                >
                  <LogOut size={14} />
                  <span>Clear Session Data</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Builder.io API */}
          {activeTab === 'builder' && (
            <div className="drawer-section">
              <div className="section-description">
                Connect your Builder.io space to read section entries and schemas using the Content API.
              </div>

              <div className="settings-field-group">
                <label className="field-label">Space Name</label>
                <input
                  type="text"
                  className="field-text-input"
                  value={settings.builder.spaceName}
                  onChange={e => updateBuilderConfig({ spaceName: e.target.value })}
                  placeholder="e.g. TrailGear Staging Space"
                />
              </div>

              <div className="settings-field-group">
                <div className="field-label-row">
                  <label className="field-label">Public API Key</label>
                  <span className="field-badge">Required for Content</span>
                </div>
                <input
                  type="text"
                  className="field-text-input font-mono"
                  value={settings.builder.publicKey}
                  onChange={e => updateBuilderConfig({ publicKey: e.target.value })}
                  placeholder="bpk-..."
                />
                <span className="field-help-text">Found in Builder.io &gt; Space Settings &gt; API Keys</span>
              </div>

              <div className="settings-field-group">
                <div className="field-label-row">
                  <label className="field-label">Private Key (Optional)</label>
                  <span className="field-badge muted">For Admin GraphQL</span>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="field-text-input font-mono"
                  value={settings.builder.privateKey || ''}
                  onChange={e => updateBuilderConfig({ privateKey: e.target.value })}
                  placeholder="bpr-..."
                />
                <div className="show-key-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showApiKey}
                      onChange={e => setShowApiKey(e.target.checked)}
                    />
                    <span>Show key values</span>
                  </label>
                </div>
              </div>

              <div className="settings-field-group">
                <label className="field-label">Default Section Model</label>
                <input
                  type="text"
                  className="field-text-input font-mono"
                  value={settings.builder.defaultModel}
                  onChange={e => updateBuilderConfig({ defaultModel: e.target.value })}
                  placeholder="hero-section"
                />
              </div>

              <div className="connection-test-box">
                <button
                  type="button"
                  className="test-btn"
                  onClick={handleTestBuilder}
                  disabled={isTestingBuilder}
                >
                  <RefreshCw size={14} className={isTestingBuilder ? 'spin-anim' : ''} />
                  <span>{isTestingBuilder ? 'Testing API...' : 'Test Space Connection'}</span>
                </button>

                {builderTestResult && (
                  <div
                    className={`test-result-indicator ${
                      builderTestResult.success ? 'success' : 'error'
                    }`}
                  >
                    {builderTestResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{builderTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Claude AI */}
          {activeTab === 'ai' && (
            <div className="drawer-section">
              <div className="section-description">
                Configure the AI conversion backend. By default, sectionForge uses deterministic pre-pass
                extraction combined with Claude 3.7 Sonnet for developer-grade Liquid markup.
              </div>

              <div className="settings-field-group">
                <div className="field-label-row">
                  <label className="field-label">Anthropic API Key (BYOK)</label>
                  <span className="field-badge">Browser Session Only</span>
                </div>
                <input
                  type="password"
                  className="field-text-input font-mono"
                  value={settings.anthropicApiKey || ''}
                  onChange={e => setAnthropicApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                />
                <span className="field-help-text">
                  Leave blank to use the local high-fidelity converter engine with standard schema generation.
                </span>
              </div>

              <div className="ai-feature-card">
                <div className="ai-feature-header">
                  <Cpu size={16} />
                  <span>Deterministic Pre-Pass + Claude Engine</span>
                </div>
                <p className="ai-feature-body">
                  1. Sanitizes Builder AST (strips IDs, state, and runtime JS noise).<br />
                  2. Maps sectionData directly to typed Shopify schema settings.<br />
                  3. Rewrites window.data.hero.* bindings to section.settings.*.<br />
                  4. Computes responsive CSS with media queries (max-width: 991px &amp; 640px).
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Shopify Dev Theme */}
          {activeTab === 'shopify' && (
            <div className="drawer-section">
              <div className="section-description">
                Configure your partner development theme for instant real-store rendering (Action 5).
              </div>

              <div className="settings-field-group">
                <label className="field-label">Store Domain</label>
                <input
                  type="text"
                  className="field-text-input font-mono"
                  value={settings.shopify.storeDomain}
                  onChange={e => updateShopifyConfig({ storeDomain: e.target.value })}
                  placeholder="your-dev-store.myshopify.com"
                />
              </div>

              <div className="settings-field-group">
                <label className="field-label">Admin API Access Token</label>
                <input
                  type="password"
                  className="field-text-input font-mono"
                  value={settings.shopify.adminAccessToken}
                  onChange={e => updateShopifyConfig({ adminAccessToken: e.target.value })}
                  placeholder="shpat_..."
                />
                <span className="field-help-text">Requires write_themes and read_themes scope.</span>
              </div>

              <div className="settings-field-group">
                <label className="field-label">Target Theme ID</label>
                <input
                  type="text"
                  className="field-text-input font-mono"
                  value={settings.shopify.themeId}
                  onChange={e => updateShopifyConfig({ themeId: e.target.value })}
                  placeholder="140924080312"
                />
              </div>

              <div className="connection-test-box">
                <button
                  type="button"
                  className="test-btn"
                  onClick={handleTestShopify}
                  disabled={isTestingShopify}
                >
                  <RefreshCw size={14} className={isTestingShopify ? 'spin-anim' : ''} />
                  <span>{isTestingShopify ? 'Verifying Theme...' : 'Test Dev Theme Sync'}</span>
                </button>

                {shopifyTestResult && (
                  <div
                    className={`test-result-indicator ${
                      shopifyTestResult.success ? 'success' : 'error'
                    }`}
                  >
                    {shopifyTestResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{shopifyTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Preferences */}
          {activeTab === 'preferences' && (
            <div className="drawer-section">
              <div className="settings-field-group">
                <label className="field-label">CSS Scope Prefix</label>
                <input
                  type="text"
                  className="field-text-input font-mono"
                  value={settings.conversion.cssPrefix}
                  onChange={e => updateConversionConfig({ cssPrefix: e.target.value })}
                  placeholder="sf-"
                />
                <span className="field-help-text">Prevents style collisions with theme stylesheet.</span>
              </div>

              <div className="settings-field-group">
                <label className="field-label">Orphan Bindings Strategy</label>
                <div className="select-wrapper">
                  <select
                    className="field-select font-mono"
                    value={settings.conversion.handleOrphanBindings}
                    onChange={e =>
                      updateConversionConfig({
                        handleOrphanBindings: e.target.value as 'warn' | 'auto_setting'
                      })
                    }
                  >
                    <option value="warn">Warn in Report only (Keep static fallback)</option>
                    <option value="auto_setting">Auto-create schema setting in schema</option>
                  </select>
                </div>
              </div>

              <div className="settings-field-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.conversion.embedStyles}
                    onChange={e => updateConversionConfig({ embedStyles: e.target.checked })}
                  />
                  <span>Embed CSS inside &#123;% stylesheet %&#125; tag in export</span>
                </label>
              </div>

              <div className="drawer-footer-actions">
                <button
                  type="button"
                  className="secondary-outline-btn"
                  onClick={() => {
                    resetToDefaults();
                    onShowToast('Settings reset to default values.');
                  }}
                >
                  Reset All to Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
