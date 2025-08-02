import WFC from '../types/simple-wfc';
import { adjacencyRules, villageTiles, WfcTile } from '../config/wfcRulesets/village';

export interface VillageOptions {
  type: 'farming' | 'fishing' | 'fortified';
  size: 'small' | 'medium';
  includeFarmland?: boolean;
  includeMarket?: boolean;
  includeWalls?: boolean;
  includeWells?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Building {
  id: string;
  type: string;
  polygon: Point[];
  entryPoint: Point;
}

export interface Road {
  id: string;
  pathPoints: Point[];
}

export interface Wall {
  id: string;
  pathPoints: Point[];
}

export interface VillageLayout {
  buildings: Building[];
  roads: Road[];
  walls: Wall[];
}

export type WfcGrid = WfcTile[][];

export async function generateWfcGrid(seed: string, options: VillageOptions): Promise<WfcGrid> {
  const size = options.size === 'small' ? 20 : 32;
  const wfc = new WFC({ tiles: villageTiles, neighbors: adjacencyRules, seed });
  const result = await wfc.generate(size, size);
  return result as WfcGrid;
}

export function transformGridToLayout(
  grid: WfcGrid,
  options: VillageOptions
): VillageLayout {
  // High level placeholder implementation.
  // In a real implementation this would scan contiguous regions and
  // construct buildings, roads and walls.
  const layout: VillageLayout = { buildings: [], roads: [], walls: [] };

  const allowFarmland = options.includeFarmland !== false;
  const allowMarket = options.includeMarket !== false;
  const allowWalls = options.includeWalls !== false;
  const allowWells = options.includeWells !== false;

  // Example of identifying a single building from roof tiles
  grid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile.id.startsWith('building_roof')) {
        layout.buildings.push({
          id: `bldg_${x}_${y}`,
          type: 'house',
          polygon: [
            { x, y },
            { x: x + 1, y },
            { x: x + 1, y: y + 1 },
            { x, y: y + 1 }
          ],
          entryPoint: { x, y: y + 1 }
        });
      }
      if (tile.id.startsWith('road')) {
        layout.roads.push({
          id: `road_${x}_${y}`,
          pathPoints: [{ x, y }, { x: x + 1, y }]
        });
      }
      if (tile.id === 'farmland' && allowFarmland) {
        layout.buildings.push({
          id: `farm_${x}_${y}`,
          type: 'farmland',
          polygon: [
            { x, y },
            { x: x + 1, y },
            { x: x + 1, y: y + 1 },
            { x, y: y + 1 }
          ],
          entryPoint: { x, y }
        });
      }
      if (tile.id === 'market_stall' && allowMarket) {
        layout.buildings.push({
          id: `market_${x}_${y}`,
          type: 'market',
          polygon: [
            { x, y },
            { x: x + 1, y },
            { x: x + 1, y: y + 1 },
            { x, y: y + 1 }
          ],
          entryPoint: { x, y }
        });
      }
      if (tile.id === 'well' && allowWells) {
        layout.buildings.push({
          id: `well_${x}_${y}`,
          type: 'well',
          polygon: [
            { x, y },
            { x: x + 1, y },
            { x: x + 1, y: y + 1 },
            { x, y: y + 1 }
          ],
          entryPoint: { x, y }
        });
      }
      if (tile.id.startsWith('town_wall') && allowWalls) {
        layout.walls.push({
          id: `wall_${x}_${y}`,
          pathPoints: [{ x, y }, { x: x + 1, y }]
        });
      }
    });
  });

  if (!allowWalls) layout.walls = [];
  if (!allowFarmland)
    layout.buildings = layout.buildings.filter((b) => b.type !== 'farmland');
  if (!allowMarket)
    layout.buildings = layout.buildings.filter((b) => b.type !== 'market');
  if (!allowWells)
    layout.buildings = layout.buildings.filter((b) => b.type !== 'well');

  return layout;
}
