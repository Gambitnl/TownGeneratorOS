import React, { useState } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

interface ControlPanelProps {
  onGenerate: (size: string) => void;
  onRandomGenerate: () => void;
  isLoading: boolean;
}

interface CustomGenerationSettings {
  // Ward counts
  castleCount: number;
  marketCount: number;
  cathedralCount: number;
  militaryWardCount: number;
  patriciateWardCount: number;
  craftsmenWardCount: number;
  merchantWardCount: number;
  slumCount: number;
  parkCount: number;
  farmCount: number;
  administrationWardCount: number;
  gateWardCount: number;
  commonWardCount: number;
  
  // Infrastructure
  hasWalls: boolean;
  hasGates: boolean;
  hasTowers: boolean;
  streetDensity: number; // 0-1
  roadDensity: number; // 0-1
  
  // Special features
  hasPlaza: boolean;
  hasCitadel: boolean;
  
  // Generation parameters
  totalPatches: number;
  seed: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  onRandomGenerate, 
  isLoading 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customSettings, setCustomSettings] = useState<CustomGenerationSettings>({
    // Default ward counts
    castleCount: 1,
    marketCount: 1,
    cathedralCount: 1,
    militaryWardCount: 1,
    patriciateWardCount: 2,
    craftsmenWardCount: 3,
    merchantWardCount: 2,
    slumCount: 2,
    parkCount: 1,
    farmCount: 2,
    administrationWardCount: 1,
    gateWardCount: 2,
    commonWardCount: 4,
    
    // Infrastructure
    hasWalls: true,
    hasGates: true,
    hasTowers: true,
    streetDensity: 0.7,
    roadDensity: 0.5,
    
    // Special features
    hasPlaza: true,
    hasCitadel: true,
    
    // Generation parameters
    totalPatches: 20,
    seed: Math.floor(Math.random() * 1000000)
  });

  const handleSizeGenerate = (size: string) => {
    onGenerate(size);
  };

  const handleCustomGenerate = () => {
    // Convert custom settings to a generation command
    const totalWards = Object.values(customSettings).filter((v, i) => 
      i < 13 && typeof v === 'number'
    ).reduce((sum, count) => sum + (count as number), 0);
    
    console.log('Custom generation settings:', customSettings);
    console.log('Total wards to generate:', totalWards);
    
    // For now, use the total patches as a size indicator
    onGenerate(`custom-${customSettings.totalPatches}`);
  };

  const updateCustomSetting = (key: keyof CustomGenerationSettings, value: number | boolean) => {
    setCustomSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetCustomSettings = () => {
    setCustomSettings({
      castleCount: 1,
      marketCount: 1,
      cathedralCount: 1,
      militaryWardCount: 1,
      patriciateWardCount: 2,
      craftsmenWardCount: 3,
      merchantWardCount: 2,
      slumCount: 2,
      parkCount: 1,
      farmCount: 2,
      administrationWardCount: 1,
      gateWardCount: 2,
      commonWardCount: 4,
      hasWalls: true,
      hasGates: true,
      hasTowers: true,
      streetDensity: 0.7,
      roadDensity: 0.5,
      hasPlaza: true,
      hasCitadel: true,
      totalPatches: 20,
      seed: Math.floor(Math.random() * 1000000)
    });
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3>Generate Settlement</h3>
        <div className="button-grid">
          <Button 
            variant="primary" 
            onClick={() => handleSizeGenerate('village')}
            disabled={isLoading}
          >
            Village
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSizeGenerate('town')}
            disabled={isLoading}
          >
            Town
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSizeGenerate('city')}
            disabled={isLoading}
          >
            City
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSizeGenerate('capital')}
            disabled={isLoading}
          >
            Capital
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowCustom(!showCustom)}
            disabled={isLoading}
          >
            🎛️ Custom
          </Button>
        </div>
      </div>

      {showCustom && (
        <div className="custom-generation-panel">
          <div className="custom-header">
            <h4>🎛️ Custom Town Generation</h4>
            <div className="custom-controls">
              <Button variant="outline" size="small" onClick={resetCustomSettings}>
                Reset
              </Button>
              <Button variant="primary" size="small" onClick={handleCustomGenerate}>
                Generate Custom Town
              </Button>
            </div>
          </div>

          <div className="custom-sections">
            {/* Ward Distribution */}
            <div className="custom-section">
              <h5>🏛️ Ward Distribution</h5>
              <div className="ward-controls">
                <div className="ward-control">
                  <label>Castle: {customSettings.castleCount}</label>
                  <input 
                    type="range" 
                    min="0" max="3" 
                    value={customSettings.castleCount}
                    onChange={(e) => updateCustomSetting('castleCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Market: {customSettings.marketCount}</label>
                  <input 
                    type="range" 
                    min="0" max="5" 
                    value={customSettings.marketCount}
                    onChange={(e) => updateCustomSetting('marketCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Cathedral: {customSettings.cathedralCount}</label>
                  <input 
                    type="range" 
                    min="0" max="3" 
                    value={customSettings.cathedralCount}
                    onChange={(e) => updateCustomSetting('cathedralCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Military: {customSettings.militaryWardCount}</label>
                  <input 
                    type="range" 
                    min="0" max="4" 
                    value={customSettings.militaryWardCount}
                    onChange={(e) => updateCustomSetting('militaryWardCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Patriciate: {customSettings.patriciateWardCount}</label>
                  <input 
                    type="range" 
                    min="0" max="6" 
                    value={customSettings.patriciateWardCount}
                    onChange={(e) => updateCustomSetting('patriciateWardCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Craftsmen: {customSettings.craftsmenWardCount}</label>
                  <input 
                    type="range" 
                    min="0" max="8" 
                    value={customSettings.craftsmenWardCount}
                    onChange={(e) => updateCustomSetting('craftsmenWardCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Merchant: {customSettings.merchantWardCount}</label>
                  <input 
                    type="range" 
                    min="0" max="6" 
                    value={customSettings.merchantWardCount}
                    onChange={(e) => updateCustomSetting('merchantWardCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Slum: {customSettings.slumCount}</label>
                  <input 
                    type="range" 
                    min="0" max="8" 
                    value={customSettings.slumCount}
                    onChange={(e) => updateCustomSetting('slumCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Park: {customSettings.parkCount}</label>
                  <input 
                    type="range" 
                    min="0" max="4" 
                    value={customSettings.parkCount}
                    onChange={(e) => updateCustomSetting('parkCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Farm: {customSettings.farmCount}</label>
                  <input 
                    type="range" 
                    min="0" max="6" 
                    value={customSettings.farmCount}
                    onChange={(e) => updateCustomSetting('farmCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Administration: {customSettings.administrationWardCount}</label>
                  <input 
                    type="range" 
                    min="0" max="3" 
                    value={customSettings.administrationWardCount}
                    onChange={(e) => updateCustomSetting('administrationWardCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Gate Ward: {customSettings.gateWardCount}</label>
                  <input 
                    type="range" 
                    min="0" max="4" 
                    value={customSettings.gateWardCount}
                    onChange={(e) => updateCustomSetting('gateWardCount', parseInt(e.target.value))}
                  />
                </div>
                <div className="ward-control">
                  <label>Common: {customSettings.commonWardCount}</label>
                  <input 
                    type="range" 
                    min="0" max="10" 
                    value={customSettings.commonWardCount}
                    onChange={(e) => updateCustomSetting('commonWardCount', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="custom-section">
              <h5>🏗️ Infrastructure</h5>
              <div className="infrastructure-controls">
                <div className="checkbox-control">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={customSettings.hasWalls}
                      onChange={(e) => updateCustomSetting('hasWalls', e.target.checked)}
                    />
                    City Walls
                  </label>
                </div>
                <div className="checkbox-control">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={customSettings.hasGates}
                      onChange={(e) => updateCustomSetting('hasGates', e.target.checked)}
                    />
                    Gates
                  </label>
                </div>
                <div className="checkbox-control">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={customSettings.hasTowers}
                      onChange={(e) => updateCustomSetting('hasTowers', e.target.checked)}
                    />
                    Towers
                  </label>
                </div>
                <div className="slider-control">
                  <label>Street Density: {Math.round(customSettings.streetDensity * 100)}%</label>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1"
                    value={customSettings.streetDensity}
                    onChange={(e) => updateCustomSetting('streetDensity', parseFloat(e.target.value))}
                  />
                </div>
                <div className="slider-control">
                  <label>Road Density: {Math.round(customSettings.roadDensity * 100)}%</label>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1"
                    value={customSettings.roadDensity}
                    onChange={(e) => updateCustomSetting('roadDensity', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Special Features */}
            <div className="custom-section">
              <h5>⭐ Special Features</h5>
              <div className="special-controls">
                <div className="checkbox-control">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={customSettings.hasPlaza}
                      onChange={(e) => updateCustomSetting('hasPlaza', e.target.checked)}
                    />
                    Central Plaza
                  </label>
                </div>
                <div className="checkbox-control">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={customSettings.hasCitadel}
                      onChange={(e) => updateCustomSetting('hasCitadel', e.target.checked)}
                    />
                    Citadel
                  </label>
                </div>
              </div>
            </div>

            {/* Generation Parameters */}
            <div className="custom-section">
              <h5>⚙️ Generation Parameters</h5>
              <div className="parameter-controls">
                <div className="parameter-control">
                  <label>Total Patches: {customSettings.totalPatches}</label>
                  <input 
                    type="range" 
                    min="10" max="50" 
                    value={customSettings.totalPatches}
                    onChange={(e) => updateCustomSetting('totalPatches', parseInt(e.target.value))}
                  />
                </div>
                <div className="parameter-control">
                  <label>Seed: {customSettings.seed}</label>
                  <input 
                    type="number" 
                    value={customSettings.seed}
                    onChange={(e) => updateCustomSetting('seed', parseInt(e.target.value) || 0)}
                  />
                  <Button 
                    variant="outline" 
                    size="small" 
                    onClick={() => updateCustomSetting('seed', Math.floor(Math.random() * 1000000))}
                  >
                    Random
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="control-section">
        <Button 
          variant="secondary" 
          onClick={onRandomGenerate}
          disabled={isLoading}
        >
          🎲 Random Town
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isLoading}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </Button>
      </div>

      {showAdvanced && (
        <div className="advanced-section">
          <h4>Advanced Options</h4>
          <p>Advanced generation options will be available here.</p>
        </div>
      )}

      {isLoading && <LoadingSpinner />}
    </div>
  );
};