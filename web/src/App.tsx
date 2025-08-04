import React, { useState } from 'react';
import { VillagePane } from './components/VillagePane';
import {
  generateVillageLayout,
  VillageLayout,
  VillageOptions,
} from './services/villageGenerationService';

const defaultOptions: VillageOptions = {
  type: 'farming',
  size: 'small',
  includeFarmland: true,
  includeMarket: true,
  includeWalls: true,
  includeWells: true,
};

export const App: React.FC = () => {
  const [options, setOptions] = useState<VillageOptions>(defaultOptions);
  const [layout, setLayout] = useState<VillageLayout>();

  const handleCheckbox = (key: keyof VillageOptions) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOptions((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const handleSelect = (
    key: 'type' | 'size'
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({ ...prev, [key]: e.target.value as any }));
  };

  const handleGenerate = async () => {
    const seed = Date.now().toString();
    const l = await generateVillageLayout(seed, options);
    setLayout(l);
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Type:
          <select value={options.type} onChange={handleSelect('type')}>
            <option value="farming">farming</option>
            <option value="fishing">fishing</option>
            <option value="fortified">fortified</option>
          </select>
        </label>
        <label style={{ marginLeft: '1rem' }}>
          Size:
          <select value={options.size} onChange={handleSelect('size')}>
            <option value="small">small</option>
            <option value="medium">medium</option>
          </select>
        </label>
        <label style={{ marginLeft: '1rem' }}>
          <input
            type="checkbox"
            checked={options.includeFarmland !== false}
            onChange={handleCheckbox('includeFarmland')}
          />
          Farmland
        </label>
        <label style={{ marginLeft: '1rem' }}>
          <input
            type="checkbox"
            checked={options.includeMarket !== false}
            onChange={handleCheckbox('includeMarket')}
          />
          Market
        </label>
        <label style={{ marginLeft: '1rem' }}>
          <input
            type="checkbox"
            checked={options.includeWalls !== false}
            onChange={handleCheckbox('includeWalls')}
          />
          Walls
        </label>
        <label style={{ marginLeft: '1rem' }}>
          <input
            type="checkbox"
            checked={options.includeWells !== false}
            onChange={handleCheckbox('includeWells')}
          />
          Wells
        </label>
      </div>
      <button onClick={handleGenerate}>Generate Village</button>
      <div style={{ marginTop: '1rem' }}>
        {layout && <VillagePane layout={layout} />}
      </div>
    </div>
  );
};
