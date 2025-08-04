import { Model } from './Model';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Street } from '@/types/street';
import { CurtainWall } from './CurtainWall';

export interface VillageOptions {
  type: 'farming' | 'fishing' | 'fortified';
  size: 'small' | 'medium';
  includeFarmland?: boolean;
  includeMarket?: boolean;
  includeWalls?: boolean;
  includeWells?: boolean;
}

export interface Building {
  id: string;
  type: string;
  polygon: Polygon;
  entryPoint: Point;
}

export interface Road {
  id: string;
  pathPoints: Street;
}

export interface Wall {
  id: string;
  pathPoints: Polygon;
}

export interface VillageLayout {
  buildings: Building[];
  roads: Road[];
  walls: Wall[];
}

export async function generateVillageLayout(seed: string, options: VillageOptions): Promise<VillageLayout> {
  const nPatches = options.size === 'small' ? 15 : 24;

  const model = new Model(nPatches, seed.charCodeAt(0));

  const layout: VillageLayout = { buildings: [], roads: [], walls: [] };

  for (const patch of model.patches) {
    if (patch.ward && patch.ward.geometry) {
      for (const poly of patch.ward.geometry) {
        layout.buildings.push({
          id: `bldg_${patch.ward.constructor.name}_${poly.vertices[0].x}_${poly.vertices[0].y}`,
          type: patch.ward.constructor.name.toLowerCase(),
          polygon: poly,
          entryPoint: poly.vertices[0]
        });
      }
    }
  }

  for (const street of model.streets) {
    layout.roads.push({
      id: `street_${street.vertices[0].x}_${street.vertices[0].y}`,
      pathPoints: street
    });
  }

  for (const road of model.roads) {
    layout.roads.push({
      id: `road_${road.vertices[0].x}_${road.vertices[0].y}`,
      pathPoints: road
    });
  }

  if (model.wall) {
    layout.walls.push({
      id: `wall_${model.wall.shape.vertices[0].x}_${model.wall.shape.vertices[0].y}`,
      pathPoints: model.wall.shape
    });
  }

  if (options.includeFarmland === false) {
    layout.buildings = layout.buildings.filter(b => b.type !== 'farm');
  }
  if (options.includeMarket === false) {
    layout.buildings = layout.buildings.filter(b => b.type !== 'market');
  }
  if (options.includeWalls === false) {
    layout.walls = [];
  }
  if (options.includeWells === false) {
    layout.buildings = layout.buildings.filter(b => b.type !== 'well');
  }

  return layout;
}
