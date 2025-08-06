import { VillageGenerator, VillageOptions as VGenOptions } from './VillageGenerator';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Street } from '@/types/street';

export interface VillageOptions {
  type: 'farming' | 'fishing' | 'fortified' | 'forest' | 'crossroads';
  size: 'tiny' | 'small' | 'medium';
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
  vocation?: string;
}

export interface Road {
  id: string;
  pathPoints: Point[] | Street;
  roadType?: 'main' | 'side' | 'path';
  width?: number;
}

export interface Wall {
  id: string;
  pathPoints: Polygon;
}

export interface VillageLayout {
  buildings: Building[];
  roads: Road[];
  walls: Wall[];
  center?: Point;
  bounds?: Polygon;
}

export async function generateVillageLayout(seed: string, options: VillageOptions): Promise<VillageLayout> {
  // Convert village options to generator options
  const generatorOptions: VGenOptions = {
    size: options.size === 'tiny' ? 'tiny' : options.size, // Handle tiny size
    setting: mapVillageTypeToSetting(options.type),
    includeWalls: options.includeWalls,
    seed: seed.charCodeAt(0)
  };

  // Generate village using new system
  const generator = new VillageGenerator(generatorOptions);
  const villageData = generator.generateVillage();

  // Convert to existing interface format
  const layout: VillageLayout = {
    buildings: villageData.buildings.map(building => ({
      id: building.id,
      type: building.type,
      polygon: building.polygon,
      entryPoint: building.entryPoint,
      vocation: building.vocation
    })),
    roads: villageData.roads.map(road => ({
      id: road.id,
      pathPoints: road.pathPoints,
      roadType: road.roadType,
      width: road.width
    })),
    walls: [], // Initialize empty walls array
    center: villageData.center,
    bounds: villageData.bounds
  };

  // Apply filtering based on options
  if (options.includeFarmland === false) {
    layout.buildings = layout.buildings.filter(b => b.type !== 'farm');
  }
  if (options.includeMarket === false) {
    layout.buildings = layout.buildings.filter(b => b.type !== 'market');
  }
  if (options.includeWells === false) {
    layout.buildings = layout.buildings.filter(b => b.type !== 'well');
  }

  // Add basic walls if requested (simple circular wall around village bounds)
  if (options.includeWalls && villageData.bounds) {
    layout.walls.push({
      id: 'village_wall',
      pathPoints: villageData.bounds
    });
  }

  return layout;
}

// Helper function to map old village types to new settings
function mapVillageTypeToSetting(type: VillageOptions['type']): VGenOptions['setting'] {
  switch (type) {
    case 'farming': return 'farming';
    case 'fishing': return 'coastal';
    case 'fortified': return 'crossroads';
    case 'forest': return 'forest';
    case 'crossroads': return 'crossroads';
    default: return 'farming';
  }
}
