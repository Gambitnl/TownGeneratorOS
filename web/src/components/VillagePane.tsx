import React, { FC, useState } from 'react';
import { VillageLayout } from '../services/villageGenerationService';
import { BuildingDetails, BuildingLibrary } from '../services/BuildingLibrary';
import { BuildingDetailsModal } from './BuildingDetailsModal';
import { Point } from '../types/point';

interface Props {
  layout: VillageLayout;
  onEnterBuilding?: (id: string, type: string) => void;
}

export const VillagePane: FC<Props> = ({ layout, onEnterBuilding }) => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDetails | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const fillForType: Record<string, string> = {
    house: '#8fbc8f',
    inn: '#daa520', 
    blacksmith: '#696969',
    farm: '#deb887',
    mill: '#d2691e',
    woodworker: '#cd853f',
    fisher: '#4682b4',
    market: '#ff69b4',
    chapel: '#dcdcdc',
    stable: '#bc8f8f',
    well: '#708090',
    granary: '#f4a460',
    farmland: '#deb887',
    alchemist: '#9370db',
    herbalist: '#228b22',
    magic_shop: '#8a2be2',
    temple: '#f0e68c',
    monster_hunter: '#dc143c',
    enchanter: '#4169e1',
    fortune_teller: '#da70d6'
  };

  const handleBuildingMouseEnter = (event: React.MouseEvent, buildingId: string, buildingType: string) => {
    if (!isPanning) {
      const tooltipText = BuildingLibrary.generateTooltip(buildingType);
      
      setTooltip({
        text: tooltipText,
        x: event.clientX,
        y: event.clientY - 10
      });
    }
  };

  const handleBuildingMouseLeave = () => {
    setTooltip(null);
  };

  const handleBuildingClick = (buildingId: string, buildingType: string) => {
    if (!isPanning) {
      const buildingDetails = BuildingLibrary.generateBuilding(buildingType);
      setSelectedBuilding(buildingDetails);
      onEnterBuilding?.(buildingId, buildingType);
    }
  };

  const handleCloseModal = () => {
    setSelectedBuilding(null);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    
    const zoomSensitivity = 0.001;
    const zoomFactor = 1 - event.deltaY * zoomSensitivity;
    
    setZoom(prevZoom => {
      const newZoom = Math.max(0.1, Math.min(5, prevZoom * zoomFactor));
      return newZoom;
    });
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button
      setIsPanning(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
      
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setTooltip(null);
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const getRoadPoints = (road: any): string => {
    // Handle both old format (Street with vertices) and new format (Point[])
    if (Array.isArray(road.pathPoints)) {
      return road.pathPoints.map((p: Point) => `${p.x},${p.y}`).join(' ');
    } else if (road.pathPoints.vertices) {
      return road.pathPoints.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ');
    }
    return '';
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      minWidth: '1000px',
      minHeight: '700px',
      overflow: 'hidden'
    }}>
      {/* Zoom Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '8px',
        borderRadius: '8px'
      }}>
        <button 
          onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
          style={{
            background: '#4CAF50',
            border: 'none',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          +
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
          style={{
            background: '#f44336',
            border: 'none',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          -
        </button>
        <button 
          onClick={resetView}
          style={{
            background: '#2196F3',
            border: 'none',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          ⌂
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        Zoom: {Math.round(zoom * 100)}%
      </div>

      <div 
        style={{ 
          width: '100%',
          height: '100%',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          cursor: isPanning ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox="-300 -225 600 450" 
          style={{ 
            border: '3px solid #8B4513',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f4f1de 0%, #e9c46a 50%, #f4a261 100%)',
            width: '100%',
            height: '100%',
            minWidth: '1000px',
            minHeight: '700px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
      {layout.roads.map((road) => (
        <polyline
          key={road.id}
          points={getRoadPoints(road)}
          stroke={road.roadType === 'main' ? '#8B4513' : road.roadType === 'side' ? '#A0522D' : '#D2691E'}
          fill="none"
          strokeWidth={road.width ? road.width * 0.5 : 1.2}
        />
      ))}
      {layout.buildings.map((b) => (
        <polygon
          key={b.id}
          points={b.polygon.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ')}
          fill={fillForType[b.type] || '#8fbc8f'}
          stroke="#2c3e50"
          strokeWidth="1"
          onClick={() => handleBuildingClick(b.id, b.type)}
          onMouseEnter={(e) => handleBuildingMouseEnter(e, b.id, b.type)}
          onMouseLeave={handleBuildingMouseLeave}
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            filter: 'brightness(1)'
          }}
          className="village-building"
          data-type={b.type}
        />
      ))}
      
      {/* Building Entrances */}
      {layout.buildings.map((b) => (
        <circle
          key={`entrance_${b.id}`}
          cx={b.entryPoint.x}
          cy={b.entryPoint.y}
          r="2"
          fill="#8B4513"
          stroke="#FFF"
          strokeWidth="0.5"
          className="building-entrance"
        />
      ))}
      {/* Village Walls */}
      {layout.walls && layout.walls.map((wall) => (
        <g key={wall.id}>
          {/* Wall segments */}
          {wall.segments && (
            <>
              {/* Wall shadow/base */}
              <polygon
                points={wall.segments.map((p: Point) => `${p.x + 1},${p.y + 1}`).join(' ')}
                stroke="#2c3e50"
                strokeWidth="6"
                fill="none"
                pointerEvents="none"
                opacity="0.3"
              />
              {/* Main wall */}
              <polygon
                points={wall.segments.map((p: Point) => `${p.x},${p.y}`).join(' ')}
                stroke="#34495e"
                strokeWidth="4"
                fill="none"
                strokeDasharray="none"
                pointerEvents="none"
                style={{ pointerEvents: 'none' }}
              />
              {/* Wall highlight */}
              <polygon
                points={wall.segments.map((p: Point) => `${p.x - 0.5},${p.y - 0.5}`).join(' ')}
                stroke="#5d6d7e"
                strokeWidth="1"
                fill="none"
                pointerEvents="none"
                opacity="0.7"
              />
            </>
          )}
          
          {/* Gates */}
          {wall.gates && wall.gates.map((gate) => (
            <g key={gate.id} style={{ pointerEvents: 'none' }}>
              {/* Gate shadow */}
              <circle
                cx={gate.position.x + 1}
                cy={gate.position.y + 1}
                r={gate.width / 2 + 1}
                fill="#2c3e50"
                opacity="0.3"
                pointerEvents="none"
              />
              {/* Gate opening (break in wall) */}
              <circle
                cx={gate.position.x}
                cy={gate.position.y}
                r={gate.width / 2}
                fill="#f4f1de"
                stroke="#8B4513"
                strokeWidth="2"
                pointerEvents="none"
              />
              {/* Gate structure */}
              <rect
                x={gate.position.x - 2}
                y={gate.position.y - gate.width / 2}
                width="4"
                height={gate.width}
                fill="#8B4513"
                stroke="#654321"
                strokeWidth="1"
                pointerEvents="none"
              />
              <text
                x={gate.position.x}
                y={gate.position.y + 2}
                textAnchor="middle"
                fontSize="7"
                fill="#654321"
                fontWeight="bold"
                pointerEvents="none"
              >
                ⛩️
              </text>
            </g>
          ))}
        </g>
      ))}
      
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {tooltip.text}
        </div>
      )}
        </svg>
      </div>

    {/* CSS Styles */}
    <style>{`
      .village-building:hover {
        filter: brightness(1.3) !important;
        stroke: #fff !important;
        stroke-width: 3 !important;
        cursor: pointer;
        transform: scale(1.02);
        drop-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      }
      .village-building {
        transition: all 0.2s ease;
        filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
      }
      
      /* Special building type highlights */
      .village-building[data-type="inn"]:hover {
        stroke: #DAA520 !important;
      }
      .village-building[data-type="blacksmith"]:hover {
        stroke: #FF6B35 !important;
      }
      .village-building[data-type="alchemist"]:hover {
        stroke: #9370DB !important;
      }
      .village-building[data-type="magic_shop"]:hover {
        stroke: #8A2BE2 !important;
      }
      .village-building[data-type="temple"]:hover {
        stroke: #F0E68C !important;
      }
      
      .building-entrance {
        pointer-events: none;
        transition: all 0.2s ease;
      }
      
      .village-building:hover + .building-entrance {
        r: 3;
        fill: #DAA520;
        stroke: #FFF;
        stroke-width: 1;
      }
    `}</style>

    {/* Building Details Modal */}
    <BuildingDetailsModal 
      building={selectedBuilding}
      onClose={handleCloseModal}
    />

    </div>
  );
};
