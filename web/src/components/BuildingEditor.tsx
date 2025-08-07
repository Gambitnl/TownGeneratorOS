import React, { useState } from 'react';
import { BuildingPlan } from '../services/ProceduralBuildingGenerator';
import { StandaloneBuildingGenerator, BuildingType, SocialClass } from '../services/StandaloneBuildingGenerator';
import ProceduralBuildingRenderer from './ProceduralBuildingRenderer';

interface BuildingEditorProps {
  initialBuilding?: BuildingPlan;
}

const BuildingEditor: React.FC<BuildingEditorProps> = ({ initialBuilding }) => {
  const [buildingPlan, setBuildingPlan] = useState<BuildingPlan | null>(initialBuilding || null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRoomLabels, setShowRoomLabels] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType>('house_small');
  const [selectedSocialClass, setSelectedSocialClass] = useState<SocialClass>('common');
  const [customLotSize, setCustomLotSize] = useState({ width: 20, height: 20 });
  const [useLotSize, setUseLotSize] = useState(false);

  const handleGenerateNewBuilding = () => {
    const options = {
      buildingType: selectedBuildingType,
      socialClass: selectedSocialClass,
      seed: Math.floor(Math.random() * 1000000),
      lotSize: useLotSize ? customLotSize : undefined
    };
    
    const newBuilding = StandaloneBuildingGenerator.generateBuilding(options);
    setBuildingPlan(newBuilding);
  };

  return (
    <div className="building-editor">
      <div className="controls p-4 bg-gray-100 rounded mb-4">
        <h2 className="text-xl font-bold mb-4">Building Editor</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building Type
              </label>
              <select
                value={selectedBuildingType}
                onChange={(e) => setSelectedBuildingType(e.target.value as BuildingType)}
                className="w-full p-2 border rounded"
                aria-label="Building Type"
              >
                <option value="house_small">Small House</option>
                <option value="house_large">Large House</option>
                <option value="tavern">Tavern</option>
                <option value="blacksmith">Blacksmith</option>
                <option value="shop">Shop</option>
                <option value="market_stall">Market Stall</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social Class
              </label>
              <select
                value={selectedSocialClass}
                onChange={(e) => setSelectedSocialClass(e.target.value as SocialClass)}
                className="w-full p-2 border rounded"
                aria-label="Social Class"
              >
                <option value="poor">Poor</option>
                <option value="common">Common</option>
                <option value="wealthy">Wealthy</option>
                <option value="noble">Noble</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={useLotSize}
                  onChange={(e) => setUseLotSize(e.target.checked)}
                  className="mr-2"
                />
                Custom Lot Size
              </label>
              
              {useLotSize && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600">Width</label>
                    <input
                      type="number"
                      value={customLotSize.width}
                      onChange={(e) => setCustomLotSize(prev => ({ ...prev, width: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full p-1 border rounded"
                      aria-label="Lot Width"
                      title="Lot Width"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Height</label>
                    <input
                      type="number"
                      value={customLotSize.height}
                      onChange={(e) => setCustomLotSize(prev => ({ ...prev, height: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full p-1 border rounded"
                      aria-label="Lot Height"
                      title="Lot Height"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleGenerateNewBuilding}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Generate New Building
            </button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="mr-2"
              />
              Show Grid
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showRoomLabels}
                onChange={(e) => setShowRoomLabels(e.target.checked)}
                className="mr-2"
              />
              Show Room Labels
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showFurniture}
                onChange={(e) => setShowFurniture(e.target.checked)}
                className="mr-2"
              />
              Show Furniture
            </label>
          </div>
        </div>
      </div>

      {buildingPlan && (
        <ProceduralBuildingRenderer
          building={buildingPlan}
          scale={1}
          showGrid={showGrid}
          showRoomLabels={showRoomLabels}
          showFurniture={showFurniture}
        />
      )}
    </div>
  );
};

export default BuildingEditor;
