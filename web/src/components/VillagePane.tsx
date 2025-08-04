import React, { FC } from 'react';
import { VillageLayout } from '../services/villageGenerationService';
import { Point } from '../types/point';

interface Props {
  layout: VillageLayout;
  onEnterBuilding?: (id: string, type: string) => void;
}

export const VillagePane: FC<Props> = ({ layout, onEnterBuilding }) => {
  const fillForType: Record<string, string> = {
    house: '#cfa',
    farmland: '#deb887',
    market: '#f5a',
    well: '#ccc',
  };
  return (
    <svg width="400" height="400" viewBox="0 0 40 40" style={{ border: '1px solid #ccc' }}>
      {layout.roads.map((road) => (
        <polyline
          key={road.id}
          points={road.pathPoints.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ')}
          stroke="sienna"
          fill="none"
          strokeWidth={0.2}
        />
      ))}
      {layout.buildings.map((b) => (
        <polygon
          key={b.id}
          points={b.polygon.vertices.map((p: Point) => `${p.x},${p.y}`).join(' ')}
          fill={fillForType[b.type] || '#cfa'}
          stroke="#333"
          onClick={() => onEnterBuilding?.(b.id, b.type)}
          style={{ cursor: 'pointer' }}
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
