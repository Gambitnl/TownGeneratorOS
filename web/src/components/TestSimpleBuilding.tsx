import React, { useState, useEffect } from 'react';
import { SimpleBuildingGenerator, BuildingType, SocialClass, GenerationOptions } from '../services/SimpleBuildingGenerator';
import { SimpleBuildingPane } from './SimpleBuildingPane';

export const TestSimpleBuilding: React.FC = () => {
  const [building, setBuilding] = useState<any>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    buildingType: 'house_small',
    socialClass: 'common',
    seed: 12345
  });

  const generateBuilding = () => {
    const generator = new SimpleBuildingGenerator(options.seed);
    const newBuilding = generator.generate(options);
    setBuilding(newBuilding);
  };

  useEffect(() => {
    generateBuilding();
  }, [options]);

  const handleBuildingTypeChange = (type: BuildingType) => {
    setOptions(prev => ({ ...prev, buildingType: type }));
  };

  const handleSocialClassChange = (socialClass: SocialClass) => {
    setOptions(prev => ({ ...prev, socialClass }));
  };

  const handleNewSeed = () => {
    setOptions(prev => ({ ...prev, seed: Math.floor(Math.random() * 1000000) }));
  };

  if (!building) {
    return <div>Generating building...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Building Generator Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Generation Options</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Building Type: </label>
          <select 
            value={options.buildingType} 
            onChange={e => handleBuildingTypeChange(e.target.value as BuildingType)}
          >
            <option value="house_small">Small House</option>
            <option value="house_large">Large House</option>
            <option value="tavern">Tavern</option>
            <option value="blacksmith">Blacksmith</option>
            <option value="shop">Shop</option>
            <option value="market_stall">Market Stall</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Social Class: </label>
          <select 
            value={options.socialClass} 
            onChange={e => handleSocialClassChange(e.target.value as SocialClass)}
          >
            <option value="poor">Poor</option>
            <option value="common">Common</option>
            <option value="wealthy">Wealthy</option>
            <option value="noble">Noble</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Seed: {options.seed} </label>
          <button onClick={handleNewSeed}>New Random Seed</button>
        </div>
      </div>

      <SimpleBuildingPane 
        building={building}
        scale={1}
        showGrid={true}
        showLighting={true}
      />
    </div>
  );
};