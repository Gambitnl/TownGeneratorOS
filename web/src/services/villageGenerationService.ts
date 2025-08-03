import { WFC, WaveFunctionCollapseSettings, Tiles } from '../types/simple-wfc';
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

  const settings: WaveFunctionCollapseSettings = {
    width: size,
    height: size,
    seed: seed.length > 0 ? seed.charCodeAt(0) : undefined,
  };

  const tiles: Tiles = {};
  for (const tile of villageTiles) {
    tiles[tile.id] = {
      weight: tile.weight,
      rules: tile.rules,
    };
  }

  const wfc = new WFC(settings, tiles);
  const result = await wfc.generate(size, size);
  const wfcGrid: WfcGrid = result.map(row => row.map(tileId => {
    const tile = villageTiles.find(t => t.id === tileId);
    if (!tile) {
      throw new Error(`Tile with ID ${tileId} not found.`);
    }
    return tile;
  }));
  return wfcGrid;
}

export function transformGridToLayout(
  grid: WfcGrid,
  options: VillageOptions
): VillageLayout {
  const layout: VillageLayout = { buildings: [], roads: [], walls: [] };
  const visited: boolean[][] = Array(grid.length)
    .fill(0)
    .map(() => Array(grid[0].length).fill(false));

  const allowFarmland = options.includeFarmland !== false;
  const allowMarket = options.includeMarket !== false;
  const allowWalls = options.includeWalls !== false;
  const allowWells = options.includeWells !== false;

  const findConnectedComponent = (
    startX: number,
    startY: number,
    tileIdPrefix: string
  ): Point[] => {
    const component: Point[] = [];
    const queue: Point[] = [{ x: startX, y: startY }];
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      component.push({ x, y });

      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      ];

      for (const neighbor of neighbors) {
        const nx = neighbor.x;
        const ny = neighbor.y;

        if (
          nx >= 0 &&
          nx < grid[0].length &&
          ny >= 0 &&
          ny < grid.length &&
          !visited[ny][nx] &&
          grid[ny][nx].id.startsWith(tileIdPrefix)
        ) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
    }
    return component;
  };

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (!visited[y][x] && grid[y][x].id.startsWith('building_roof')) {
        const component = findConnectedComponent(x, y, 'building_roof');
        if (component.length > 0) {
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

          for (const p of component) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          }

          layout.buildings.push({
            id: `bldg_${minX}_${minY}`,
            type: 'house',
            polygon: [
              { x: minX, y: minY },
              { x: maxX + 1, y: minY },
              { x: maxX + 1, y: maxY + 1 },
              { x: minX, y: maxY + 1 }
            ],
            entryPoint: { x: minX, y: maxY + 1 } // Example entry point
          });
        }
      } else if (!visited[y][x] && grid[y][x].id.startsWith('road')) {
        const component = findConnectedComponent(x, y, 'road');
        if (component.length > 0) {
          layout.roads.push({
            id: `road_${component[0].x}_${component[0].y}`,
            pathPoints: component
          });
        }
      } else if (!visited[y][x] && grid[y][x].id.startsWith('town_wall') && allowWalls) {
        const component = findConnectedComponent(x, y, 'town_wall');
        if (component.length > 0) {
          layout.walls.push({
            id: `wall_${component[0].x}_${component[0].y}`,
            pathPoints: component
          });
        }
      }
      // Existing logic for other single tile types (farmland, market, well)
      if (grid[y][x].id === 'farmland' && allowFarmland) {
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
      if (grid[y][x].id === 'market_stall' && allowMarket) {
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
      if (grid[y][x].id === 'well' && allowWells) {
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
    }
  }

  if (!allowWalls) layout.walls = [];
  if (!allowFarmland)
    layout.buildings = layout.buildings.filter((b) => b.type !== 'farmland');
  if (!allowMarket)
    layout.buildings = layout.buildings.filter((b) => b.type !== 'market');
  if (!allowWells)
    layout.buildings = layout.buildings.filter((b) => b.type !== 'well');

  return layout;
}

