import React, { FC } from 'react';
import { VillageLayout } from '../services/villageGenerationService';
import { Point } from '../types/point';

interface Props {
  layout: VillageLayout;
  onEnterBuilding?: (id: string, type: string) => void;
}

export const VillagePane: FC<Props> = ({ layout, onEnterBuilding }) => {
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
    farmland: '#deb887'
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
    <svg width="400" height="400" viewBox="-100 -100 200 200" style={{ border: '1px solid #ccc' }}>
      {layout.roads.map((road) => (
        <polyline
          key={road.id}
          points={getRoadPoints(road)}
          stroke={road.roadType === 'main' ? '#8B4513' : road.roadType === 'side' ? '#A0522D' : '#D2691E'}
          fill="none"
          strokeWidth={road.width ? road.width * 0.3 : 0.8}
        />
      ))}
      {layout.buildings.map((b) => (
        <polygon
          key={b.id}
          points={b.polygon.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ')}
          fill={fillForType[b.type] || '#8fbc8f'}
          stroke="#333"
          strokeWidth="0.5"
          onClick={() => onEnterBuilding?.(b.id, b.type)}
          style={{ cursor: 'pointer' }}
          title={`${b.type}${b.vocation ? ` (${b.vocation})` : ''}`}
        />
      ))}
      {layout.walls.map((w) => (
        <polyline
          key={w.id}
          points={w.pathPoints.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ')}
          stroke="black"
          fill="none"
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
};
