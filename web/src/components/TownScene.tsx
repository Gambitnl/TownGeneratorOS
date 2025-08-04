import React, { useState, useEffect } from 'react';
import { CityMap } from '../services/CityMap';
import { Model } from '../services/Model';
import { Tooltip } from './Tooltip';
import { CitySizeButton } from './CitySizeButton';

export const TownScene: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const [tooltipText, setTooltipText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const newModel = new Model(15);
    setModel(newModel);
    setLoading(false);
  }, []);

  const handleGenerate = (size: number) => {
    setLoading(true);
    const newModel = new Model(size);
    setModel(newModel);
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
