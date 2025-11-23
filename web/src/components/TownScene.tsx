import React, { useState, useEffect } from 'react';
import { CityMap } from '../services/CityMap';
import { GridModel } from '../services/GridModel';
import { StateManager } from '../services/StateManager';
import { Tooltip } from './Tooltip';
import { ControlPanel } from './ControlPanel';
// import { InfoPanel } from './InfoPanel';
import { LoadingOverlay } from './LoadingOverlay';
import { vttExporter } from '../utils/exporters/VTTExporter';

export const TownScene: React.FC = () => {
  const [model, setModel] = useState<GridModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltipText, setTooltipText] = useState('');
  const [size, setSize] = useState(StateManager.size);
  const [seed, setSeed] = useState(StateManager.seed);
  const [loadingMessage, setLoadingMessage] = useState('Generating town...');

  // Layer visibility state
  const [showGrid, setShowGrid] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [showWater, setShowWater] = useState(true);

  useEffect(() => {
    // Initial model generation
    generateModel(size, seed);
  }, []);

  const generateModel = (newSize: number, newSeed?: number) => {
    setLoading(true);
    setLoadingMessage('Generating town...');

    // Small delay to show loading state
    setTimeout(() => {
      const actualSeed = newSeed !== undefined ? newSeed : -1;
      // Map size: small=20, medium=50, large=100
      const mapSize = newSize === 0 ? 20 : (newSize === 1 ? 50 : 100);
      const newModel = new GridModel(mapSize, mapSize, actualSeed);

      setModel(newModel);
      setSize(newSize);

      // Update StateManager and URL
      StateManager.size = newSize;
      if (actualSeed !== -1) {
        StateManager.seed = actualSeed;
      }
      StateManager.pushParams();

      setSeed(StateManager.seed);

      console.log('GridModel created', {
        size: mapSize,
        seed: StateManager.seed
      });

      setLoading(false);
    }, 100);
  };

  const handleGenerate = (newSize: number) => {
    generateModel(newSize);
  };

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
  };

  const handleSeedChange = (newSeed: string) => {
    const seedValue = parseInt(newSeed, 10);
    if (!isNaN(seedValue) && seedValue > 0) {
      setSeed(seedValue);
    }
  };

  const handleRegenerate = () => {
    generateModel(size);
  };

  const handleApplyCustom = () => {
    generateModel(size, seed);
  };

  const handleExport = () => {
    // This will be implemented in CityMap component
    const event = new CustomEvent('exportCanvas');
    window.dispatchEvent(event);
  };

  const handleExportJSON = () => {
    if (model) {
      vttExporter.downloadJSON(model, `town-map-${StateManager.seed}.vtt.json`);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copied to clipboard! Share it to reproduce this exact town.');
    });
  };

  const handleToggleLayer = (layer: 'grid' | 'zones' | 'water') => {
    if (layer === 'grid') setShowGrid(prev => !prev);
    if (layer === 'zones') setShowZones(prev => !prev);
    if (layer === 'water') setShowWater(prev => !prev);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Medieval Town Generator (Grid Mode)</h1>
        <p className="app-subtitle">Procedurally generated medieval settlements with 5ft tiles</p>
      </header>

      <main className="main-content">
        <div className="canvas-container">
          {loading && <LoadingOverlay message={loadingMessage} />}
          {model && (
            <CityMap
              model={model}
              showGrid={showGrid}
              showZones={showZones}
              showWater={showWater}
            />
          )}
        </div>

        <ControlPanel
          size={size}
          seed={seed}
          onSizeChange={handleSizeChange}
          onSeedChange={handleSeedChange}
          onGenerate={handleGenerate}
          onRegenerate={handleRegenerate}
          onApplyCustom={handleApplyCustom}
          onExport={handleExport}
          onExportJSON={handleExportJSON}
          onShare={handleShare}
          showGrid={showGrid}
          showZones={showZones}
          showWater={showWater}
          onToggleLayer={handleToggleLayer}
        />

        {/* {model && <InfoPanel model={model} />} */}
      </main>

      <Tooltip text={tooltipText} />
    </div>
  );
};
