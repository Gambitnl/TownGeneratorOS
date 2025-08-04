import React, { useState, useEffect } from 'react';
import { CityMap } from '../services/CityMap';
import { Model } from '../services/Model';
import { StateManager } from '../services/StateManager';
import { Tooltip } from './Tooltip';
import { CitySizeButton } from './CitySizeButton';

export const TownScene: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const [tooltipText, setTooltipText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize StateManager and create initial model
    StateManager.pullParams();
    StateManager.pushParams();
    
    setLoading(true);
    try {
      const newModel = new Model(StateManager.size, StateManager.seed);
      setModel(newModel);
    } catch (error) {
      console.error('Error creating model:', error);
      // Fallback: try with a different size or seed
      try {
        const fallbackModel = new Model(6, Date.now() % 100000);
        setModel(fallbackModel);
      } catch (fallbackError) {
        console.error('Fallback model creation also failed:', fallbackError);
      }
    }
    setLoading(false);
  }, []);

  const handleGenerate = (size: number) => {
    setLoading(true);
    try {
      const newModel = new Model(size);
      setModel(newModel);
    } catch (error) {
      console.error('Error generating new model:', error);
      // Try again with a random seed
      try {
        const fallbackModel = new Model(size, Date.now() % 100000);
        setModel(fallbackModel);
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Medieval Town Generator</h1>
      {loading && <div>Loading...</div>}
      {model && !loading && <CityMap model={model} />}
      <Tooltip text={tooltipText} />
      <div style={{ position: 'absolute', top: '1px', right: '1px', display: 'flex', flexDirection: 'column' }}>
        <CitySizeButton label="Small Town" minSize={6} maxSize={10} onGenerate={handleGenerate} />
        <CitySizeButton label="Large Town" minSize={10} maxSize={15} onGenerate={handleGenerate} />
        <CitySizeButton label="Small City" minSize={15} maxSize={24} onGenerate={handleGenerate} />
        <CitySizeButton label="Large City" minSize={24} maxSize={40} onGenerate={handleGenerate} />
      </div>
    </div>
  );
};
