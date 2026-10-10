import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { SourcePanel } from './components/SourcePanel';
import { PreviewPanel } from './components/PreviewPanel';
import { CodePanel } from './components/CodePanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { GOLDEN_HERO_ENTRY, ALL_SAMPLE_ENTRIES } from './fixtures/sampleHero';
import { BuilderEntry } from './types/builder';
import { convertBuilderSection } from './converter/engine';
import { useSettings } from './context/SettingsContext';
import { listEntries, listModels } from './api/builder';
import { BuilderModelSummary } from './types/builder';

export const App: React.FC = () => {
  const { settings } = useSettings();
  const [entries, setEntries] = useState<BuilderEntry[]>(ALL_SAMPLE_ENTRIES);
  const [models, setModels] = useState<BuilderModelSummary[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BuilderEntry>(GOLDEN_HERO_ENTRY);
  const [rawJson, setRawJson] = useState<string>(() => JSON.stringify(GOLDEN_HERO_ENTRY, null, 2));

  // Compute initial conversion
  const initialConversion = useMemo(
    () => convertBuilderSection(GOLDEN_HERO_ENTRY, settings),
    []
  );

  const [conversion, setConversion] = useState(initialConversion);
  const [liquidCode, setLiquidCode] = useState(initialConversion.liquid);
  const [cssCode, setCssCode] = useState(initialConversion.css);
  const [isConverting, setIsConverting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(3);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSelectEntry = (entry: BuilderEntry) => {
    setSelectedEntry(entry);
    const jsonStr = JSON.stringify(entry, null, 2);
    setRawJson(jsonStr);
    const res = convertBuilderSection(entry, settings);
    setConversion(res);
    setLiquidCode(res.liquid);
    setCssCode(res.css);
    setCurrentStep(3);
    showToast(`Loaded "${entry.name}"`);
  };

  const handleRawJsonChange = (jsonStr: string) => {
    setRawJson(jsonStr);
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        const normalizedEntry: BuilderEntry = {
          id: parsed.id || 'bldr_custom_' + Date.now(),
          name: parsed.name || parsed.component?.name || 'Custom Section',
          modelName: parsed.modelName || 'custom-section',
          lastUpdated: 'Just now',
          published: 'draft',
          data: parsed.data || parsed
        };
        setSelectedEntry(normalizedEntry);
      }
    } catch (e) {
      // Allow user to finish typing
    }
  };

  const handleRefreshModels = async () => {
    if (!settings.builder.publicKey.trim()) {
      showToast('Add your Builder.io Public API Key in settings first.');
      return;
    }

    setIsLoadingModels(true);
    try {
      const result = await listModels(settings.builder.publicKey);
      setModels(result);
      if (result.length === 0) {
        showToast('Connected, but no Builder.io models were found.');
      } else {
        showToast(`Loaded ${result.length} Builder.io models.`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load Builder.io models.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSelectModel = async (modelName: string) => {
    setIsLoadingEntries(true);
    try {
      const result = await listEntries(settings.builder.publicKey, modelName);
      setEntries(result);
      if (result.length > 0) {
        handleSelectEntry(result[0]);
      } else {
        showToast(`No entries found in "${modelName}".`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load Builder.io entries.');
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleConvert = () => {
    setIsConverting(true);
    setCurrentStep(3);
    setTimeout(() => {
      try {
        const res = convertBuilderSection(selectedEntry, settings);
        setConversion(res);
        setLiquidCode(res.liquid);
        setCssCode(res.css);
        setCurrentStep(4);
        showToast('Section successfully converted to Shopify Liquid & CSS.');
      } catch (e: any) {
        showToast(`Conversion error: ${e.message}`);
      } finally {
        setIsConverting(false);
      }
    }, 550);
  };

  const handleResetCode = () => {
    setLiquidCode(conversion.liquid);
    setCssCode(conversion.css);
    showToast('Code reset to originally generated version.');
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    if (stepIndex === 1) {
      setIsSettingsOpen(true);
    }
  };

  // Extract initial settings for simulator
  const activeSectionSettings = useMemo(() => {
    return conversion.schema.settings.reduce((acc, s) => {
      if (s.id && s.default !== undefined) {
        acc[s.id] = s.default;
      }
      return acc;
    }, {} as Record<string, any>);
  }, [conversion.schema]);

  return (
    <div className="app-container">
      {/* Top Header Banner */}
      <Header
        currentStep={currentStep}
        onStepClick={handleStepClick}
        onConvert={handleConvert}
        isConverting={isConverting}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3-Column Workbench Grid */}
      <main className="workbench-grid" aria-label="SectionForge conversion workbench">
        {/* Column 1: Source Explorer & AST */}
        <SourcePanel
          entries={entries}
          selectedEntry={selectedEntry}
          onSelectEntry={handleSelectEntry}
          rawJson={rawJson}
          onRawJsonChange={handleRawJsonChange}
          onOpenSettings={() => setIsSettingsOpen(true)}
          models={models}
          isLoadingModels={isLoadingModels}
          isLoadingEntries={isLoadingEntries}
          onRefreshModels={handleRefreshModels}
          onSelectModel={handleSelectModel}
        />

        {/* Column 2: Live Simulator & Storefront Preview */}
        <PreviewPanel
          liquidCode={liquidCode}
          cssCode={cssCode}
          schemaSettings={activeSectionSettings}
          onShowToast={showToast}
        />

        {/* Column 3: Generated Code (Liquid / CSS / Schema / Report) */}
        <CodePanel
          conversion={conversion}
          liquidCode={liquidCode}
          cssCode={cssCode}
          onLiquidChange={setLiquidCode}
          onCssChange={setCssCode}
          onReset={handleResetCode}
          onShowToast={showToast}
        />
      </main>

      {/* User Settings Right Slide Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onShowToast={showToast}
      />

      {/* Feedback Toast Notification */}
      <div className={`feedback-toast ${toastMessage ? 'active' : ''}`} role="status">
        {toastMessage}
      </div>
    </div>
  );
};
