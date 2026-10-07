import React from 'react';
import { Settings, Sparkles, RefreshCw, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  onConvert: () => void;
  isConverting: boolean;
  onOpenSettings: () => void;
}

const STEPS = [
  { index: 1, label: '01 CONNECT' },
  { index: 2, label: '02 SELECT' },
  { index: 3, label: '03 CONVERT' },
  { index: 4, label: '04 EDIT' },
  { index: 5, label: '05 PREVIEW' }
];

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onStepClick,
  onConvert,
  isConverting,
  onOpenSettings
}) => {
  const { currentUser } = useAuth();

  return (
    <header className="header-banner">
      <div className="header-left">
        <div className="eyebrow-row">
          <span className="eyebrow-tag">BUILDER SECTION CONVERTER</span>
          <span className="version-tag">v1.2 PRO</span>
        </div>
        <h1 className="main-title">Forge storefront-ready code.</h1>

        {/* 5-Step Process Stepper */}
        <nav className="process-stepper" aria-label="Conversion workflow steps">
          {STEPS.map(step => {
            const isActive = step.index === currentStep;
            const isCompleted = step.index < currentStep;
            return (
              <button
                key={step.index}
                type="button"
                className={`step-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => onStepClick(step.index)}
              >
                <span className="step-indicator-number">{step.index}</span>
                <span className="step-label">{step.label.split(' ')[1]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="header-right">
        {/* User profile & session badge */}
        <button
          type="button"
          className="user-profile-header-btn"
          onClick={onOpenSettings}
          title="Open User Profile & Settings Drawer"
        >
          <div
            className="user-header-avatar"
            style={{ backgroundColor: currentUser?.avatarColor || '#153123' }}
          >
            {currentUser?.initials || 'U'}
          </div>
          <div className="user-header-text">
            <span className="user-header-name">{currentUser?.name || 'Visitor'}</span>
            <span className="user-header-role">{currentUser?.roleTitle?.split(' ')[0] || 'Agency'}</span>
          </div>
        </button>

        {/* Settings drawer button */}
        <button
          type="button"
          className="settings-toggle-btn"
          onClick={onOpenSettings}
          title="Configure API Keys, Dev Theme & Preferences"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        {/* Primary Convert Button */}
        <button
          type="button"
          className="primary-action-btn"
          id="convertBtn"
          onClick={onConvert}
          disabled={isConverting}
        >
          {isConverting ? (
            <>
              <RefreshCw size={13} className="spin-anim mr-1" />
              <span>CONVERTING...</span>
            </>
          ) : (
            <>
              <Sparkles size={13} className="mr-1" />
              <span>CONVERT SECTION</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
