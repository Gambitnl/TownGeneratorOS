import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VillageLayout, VillageBuilding } from '../services/VillageGenerator';
import ProceduralBuildingRenderer from './ProceduralBuildingRenderer';

interface EnhancedVillagePaneProps {
  village: VillageLayout;
  scale: number;
  showGrid?: boolean;
  showRoomLabels?: boolean;
  showFurniture?: boolean;
}

const EnhancedVillagePane: React.FC<EnhancedVillagePaneProps> = ({
  village,
  scale,
  showGrid: initialShowGrid = true,
  showRoomLabels: initialShowRoomLabels = true,
  showFurniture: initialShowFurniture = true
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<VillageBuilding | null>(null);
  const [viewMode, setViewMode] = useState<'village' | 'building'>('village');
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [showRoomLabels, setShowRoomLabels] = useState(initialShowRoomLabels);
  const [showFurniture, setShowFurniture] = useState(initialShowFurniture);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate village bounds for rendering
  const bounds = village.bounds?.getBounds() || { x: 0, y: 0, width: 800, height: 600 };
  const padding = 50;
  const viewWidth = (bounds.width + padding * 2) * scale;
  const viewHeight = (bounds.height + padding * 2) * scale;
  
  // Safe access to bounds properties
  const minX = bounds.x;
  const minY = bounds.y;

  const handleBuildingClick = (building: VillageBuilding) => {
    if (building.proceduralPlan) {
      setSelectedBuilding(building);
      setViewMode('building');
    }
  };

  const handleBackToVillage = () => {
    setSelectedBuilding(null);
    setViewMode('village');
  };

  const renderBuilding = (building: VillageBuilding) => {
    const polygon = building.polygon;
    const pathData = `M ${polygon.vertices.map(vertex => 
      `${(vertex.x - minX + padding) * scale} ${(vertex.y - minY + padding) * scale}`
    ).join(' L ')} Z`;

    // Color buildings based on their type
    const buildingColors: Record<string, string> = {
      house: '#DEB887',
      inn: '#CD853F',
      blacksmith: '#696969',
      market: '#F4A460',
      chapel: '#D3D3D3',
      farm: '#90EE90',
      mill: '#8B4513',
      alchemist: '#9370DB',
      wizard_tower: '#4B0082'
    };

    const color = buildingColors[building.type] || '#D2B48C';
    const isClickable = building.proceduralPlan !== undefined;

    return (
      <g key={building.id} className="building">
        <path
          d={pathData}
          fill={color}
          stroke="#8B4513"
          strokeWidth={1.5 * scale}
          className={isClickable ? 'cursor-pointer' : ''}
          style={{ 
            filter: isClickable ? 'brightness(1.1)' : undefined,
            transition: 'filter 0.2s'
          }}
          onClick={() => isClickable && handleBuildingClick(building)}
          onMouseEnter={(e) => {
            if (isClickable) {
              e.currentTarget.style.filter = 'brightness(1.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (isClickable) {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }
          }}
        />
        
        {/* Building label */}
        <text
          x={(polygon.vertices.reduce((sum, v) => sum + v.x, 0) / polygon.vertices.length - minX + padding) * scale}
          y={(polygon.vertices.reduce((sum, v) => sum + v.y, 0) / polygon.vertices.length - minY + padding) * scale}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(8, 12 * scale)}
          fill="#333"
          fontWeight="bold"
          pointerEvents="none"
        >
          {building.vocation || building.type}
        </text>
        
        {/* Procedural building indicator */}
        {building.proceduralPlan && (
          <circle
            cx={(polygon.vertices.reduce((sum, v) => sum + v.x, 0) / polygon.vertices.length - minX + padding) * scale}
            cy={(polygon.vertices.reduce((sum, v) => sum + v.y, 0) / polygon.vertices.length - minY + padding) * scale - 15 * scale}
            r={3 * scale}
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth={1}
          />
        )}
      </g>
    );
  };

  const renderRoad = (road: any) => {
    const pathPoints = road.pathPoints.map((point: any) => 
      `${(point.x - minX + padding) * scale},${(point.y - minY + padding) * scale}`
    ).join(' ');
    
    const width = (road.width || 4) * scale;
    
    return (
      <g key={road.id} className="road">
        <polyline
          points={pathPoints}
          stroke="#8B7355"
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  const renderWalls = (walls: any[]) => {
    return walls.map(wall => (
      <g key={wall.id} className="wall">
        {/* Wall segments */}
        {wall.segments && (
          <polyline
            points={wall.segments.map((point: any) => 
              `${(point.x - minX + padding) * scale},${(point.y - minY + padding) * scale}`
            ).join(' ')}
            stroke="#696969"
            strokeWidth={3 * scale}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Gates */}
        {wall.gates && wall.gates.map((gate: any, index: number) => (
          <circle
            key={`${wall.id}-gate-${index}`}
            cx={(gate.position.x - minX + padding) * scale}
            cy={(gate.position.y - minY + padding) * scale}
            r={gate.width * scale}
            fill="none"
            stroke="#654321"
            strokeWidth={2 * scale}
          />
        ))}
      </g>
    ));
  };

  const renderVillageView = () => (
    <div className="village-view">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">Village Overview</h3>
        <p className="text-sm text-gray-600">
          Click on buildings with golden dots to view detailed D&D layouts
        </p>
      </div>
      
      <svg
        ref={svgRef}
        width={viewWidth}
        height={viewHeight}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        style={{ border: '1px solid #ccc', backgroundColor: '#f0f8f0' }}
      >
        {/* Background */}
        <rect width={viewWidth} height={viewHeight} fill="#90EE90" opacity="0.3" />
        
        {/* Grid */}
        {showGrid && (
          <defs>
            <pattern id="grid" width={25 * scale} height={25 * scale} patternUnits="userSpaceOnUse">
              <path d={`M ${25 * scale} 0 L 0 0 0 ${25 * scale}`} fill="none" stroke="#ddd" strokeWidth="0.5" />
            </pattern>
          </defs>
        )}
        {showGrid && <rect width={viewWidth} height={viewHeight} fill="url(#grid)" />}
        
        {/* Roads */}
        {village.roads.map(renderRoad)}
        
        {/* Buildings */}
        {village.buildings.map(renderBuilding)}
        
        {/* Walls */}
        {renderWalls(village.walls)}
      </svg>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Buildings:</strong> {village.buildings.length}</p>
        <p><strong>Detailed Buildings:</strong> {village.buildings.filter(b => b.proceduralPlan).length}</p>
        <p><strong>Roads:</strong> {village.roads.length}</p>
        <p><strong>Walls:</strong> {village.walls.length}</p>
      </div>
    </div>
  );

  const renderBuildingView = () => {
    if (!selectedBuilding?.proceduralPlan) return null;

    return (
      <div className="building-view">
        <div className="mb-4">
          <button
            onClick={handleBackToVillage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
          >
            ← Back to Village
          </button>
          <h3 className="text-lg font-bold">
            {selectedBuilding.vocation || selectedBuilding.type} - Detailed D&D Layout
          </h3>
          <p className="text-sm text-gray-600">
            Grid scale: 5 feet per square | Building ID: {selectedBuilding.id}
          </p>
        </div>
        
        <ProceduralBuildingRenderer
          building={selectedBuilding.proceduralPlan}
          scale={scale}
          showGrid={showGrid}
          showRoomLabels={showRoomLabels}
          showFurniture={showFurniture}
        />

        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-bold mb-2">D&D Usage Notes:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Each grid square = 5 feet (standard D&D scale)</li>
            <li>• Room layouts are procedurally generated based on building type</li>
            <li>• Furniture placement considers logical room usage</li>
            <li>• Exterior features include gardens, wells, storage areas</li>
            <li>• Use this layout for detailed building exploration</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-village-pane">
      {viewMode === 'village' ? renderVillageView() : renderBuildingView()}
      
      {/* View controls */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="flex items-center space-x-4">
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
  );
};

export default EnhancedVillagePane;