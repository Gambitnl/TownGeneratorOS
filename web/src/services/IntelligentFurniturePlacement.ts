import { RoomFunction } from './FloorMaterialSystem';
import { SocialClass } from './StandaloneBuildingGenerator';

export interface TableChairGroup {
  tableId: string;
  table: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'dining' | 'work' | 'desk' | 'round' | 'rectangular';
  };
  chairs: Array<{
    id: string;
    x: number;
    y: number;
    facing: 0 | 90 | 180 | 270; // degrees - 0=north, 90=east, 180=south, 270=west
    side: 'north' | 'south' | 'east' | 'west';
  }>;
}

export interface PlacementResult {
  tableChairGroups: TableChairGroup[];
  independentFurniture: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }>;
}

export class IntelligentFurniturePlacement {
  
  static placeFurnitureIntelligently(
    roomFunction: RoomFunction,
    roomX: number,
    roomY: number,
    roomWidth: number,
    roomHeight: number,
    socialClass: SocialClass,
    obstacles: Array<{x: number, y: number, width: number, height: number}>, // doors, windows, fixtures
    seed: number
  ): PlacementResult {
    
    const result: PlacementResult = {
      tableChairGroups: [],
      independentFurniture: []
    };

    // Get usable interior space (accounting for walls)
    const interiorBounds = {
      x: roomX + 1,
      y: roomY + 1,
      width: roomWidth - 2,
      height: roomHeight - 2
    };

    // Create occupancy grid
    const occupancyGrid = this.createOccupancyGrid(interiorBounds, obstacles);

    // Determine furniture needed for this room type
    const furnitureNeeded = this.getFurnitureRequirementsForRoom(roomFunction, socialClass, interiorBounds);

    let furnitureId = 1;
    let currentSeed = seed;

    // Phase 1: Place tables first (they're the anchors)
    const tablesNeeded = furnitureNeeded.filter(f => f.category === 'table');
    
    for (const tableSpec of tablesNeeded) {
      const placement = this.findOptimalTablePlacement(
        tableSpec,
        interiorBounds,
        occupancyGrid,
        roomFunction,
        currentSeed++
      );

      if (placement) {
        // Mark table space as occupied
        this.markOccupied(occupancyGrid, placement.x, placement.y, placement.width, placement.height);

        // Create table-chair group
        const tableChairGroup: TableChairGroup = {
          tableId: `table_${furnitureId++}`,
          table: {
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height,
            type: tableSpec.tableType
          },
          chairs: []
        };

        // Phase 2: Place chairs around this table
        const chairsForTable = this.determineChairPlacementForTable(
          tableChairGroup.table,
          interiorBounds,
          occupancyGrid,
          socialClass,
          currentSeed++
        );

        // Add chairs and mark spaces as occupied
        chairsForTable.forEach((chairPlacement, index) => {
          tableChairGroup.chairs.push({
            id: `chair_${furnitureId++}`,
            x: chairPlacement.x,
            y: chairPlacement.y,
            facing: chairPlacement.facing,
            side: chairPlacement.side
          });

          // Mark chair space as occupied
          this.markOccupied(occupancyGrid, chairPlacement.x, chairPlacement.y, 1, 1);
        });

        result.tableChairGroups.push(tableChairGroup);
        currentSeed += 10;
      }
    }

    // Phase 3: Place independent furniture (beds, storage, etc.)
    const independentFurnitureSpecs = furnitureNeeded.filter(f => f.category !== 'table' && f.category !== 'seating');
    
    for (const furnitureSpec of independentFurnitureSpecs) {
      const placement = this.findOptimalFurniturePlacement(
        furnitureSpec,
        interiorBounds,
        occupancyGrid,
        currentSeed++
      );

      if (placement) {
        result.independentFurniture.push({
          id: `${furnitureSpec.category}_${furnitureId++}`,
          type: furnitureSpec.category,
          x: placement.x,
          y: placement.y,
          width: placement.width,
          height: placement.height,
          rotation: placement.rotation
        });

        this.markOccupied(occupancyGrid, placement.x, placement.y, placement.width, placement.height);
        currentSeed += 5;
      }
    }

    return result;
  }

  private static createOccupancyGrid(
    bounds: {x: number, y: number, width: number, height: number},
    obstacles: Array<{x: number, y: number, width: number, height: number}>
  ): boolean[][] {
    const grid: boolean[][] = [];
    
    // Initialize grid
    for (let y = 0; y < bounds.height; y++) {
      grid[y] = new Array(bounds.width).fill(false);
    }

    // Mark obstacles as occupied
    obstacles.forEach(obstacle => {
      for (let y = Math.max(0, obstacle.y - bounds.y); y < Math.min(bounds.height, obstacle.y + obstacle.height - bounds.y); y++) {
        for (let x = Math.max(0, obstacle.x - bounds.x); x < Math.min(bounds.width, obstacle.x + obstacle.width - bounds.x); x++) {
          if (y >= 0 && y < bounds.height && x >= 0 && x < bounds.width) {
            grid[y][x] = true;
          }
        }
      }
    });

    return grid;
  }

  private static markOccupied(grid: boolean[][], x: number, y: number, width: number, height: number): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const gridY = y + dy;
        const gridX = x + dx;
        if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
          grid[gridY][gridX] = true;
        }
      }
    }
  }

  private static getFurnitureRequirementsForRoom(
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    bounds: {width: number, height: number}
  ): Array<{
    category: 'table' | 'seating' | 'bed' | 'storage' | 'work' | 'cooking';
    tableType?: 'dining' | 'work' | 'desk' | 'round' | 'rectangular';
    width: number;
    height: number;
    priority: number;
    placement: 'center' | 'wall' | 'corner' | 'anywhere';
  }> {
    
    const roomArea = bounds.width * bounds.height;
    
    switch (roomFunction) {
      case 'living':
      case 'common':
        if (roomArea >= 16) {
          return [
            { category: 'table', tableType: 'dining', width: 2, height: 2, priority: 1, placement: 'center' },
            { category: 'storage', width: 1, height: 1, priority: 2, placement: 'wall' }
          ];
        } else {
          return [
            { category: 'table', tableType: 'round', width: 1, height: 1, priority: 1, placement: 'center' },
            { category: 'storage', width: 1, height: 1, priority: 2, placement: 'wall' }
          ];
        }

      case 'kitchen':
        return [
          { category: 'table', tableType: 'work', width: 2, height: 1, priority: 1, placement: 'wall' },
          { category: 'cooking', width: 1, height: 1, priority: 1, placement: 'wall' },
          { category: 'storage', width: 1, height: 1, priority: 2, placement: 'wall' }
        ];

      case 'office':
      case 'study':
        return [
          { category: 'table', tableType: 'desk', width: 2, height: 1, priority: 1, placement: 'wall' },
          { category: 'storage', width: 1, height: 1, priority: 2, placement: 'wall' }
        ];

      case 'bedroom':
        return [
          { category: 'bed', width: 1, height: 2, priority: 1, placement: 'wall' },
          { category: 'storage', width: 1, height: 1, priority: 2, placement: 'wall' }
        ];

      case 'tavern_hall':
        const tables: any[] = [];
        if (roomArea >= 30) {
          tables.push({ category: 'table', tableType: 'dining', width: 2, height: 2, priority: 1, placement: 'center' });
          if (roomArea >= 50) {
            tables.push({ category: 'table', tableType: 'dining', width: 2, height: 2, priority: 1, placement: 'center' });
          }
        }
        return tables;

      case 'workshop':
        return [
          { category: 'table', tableType: 'work', width: 2, height: 1, priority: 1, placement: 'center' },
          { category: 'work', width: 1, height: 1, priority: 1, placement: 'wall' },
          { category: 'storage', width: 1, height: 1, priority: 2, placement: 'wall' }
        ];

      default:
        return [
          { category: 'storage', width: 1, height: 1, priority: 2, placement: 'wall' }
        ];
    }
  }

  private static findOptimalTablePlacement(
    tableSpec: any,
    bounds: {x: number, y: number, width: number, height: number},
    occupancyGrid: boolean[][],
    roomFunction: RoomFunction,
    seed: number
  ): {x: number, y: number, width: number, height: number} | null {
    
    const validPlacements: Array<{x: number, y: number, score: number}> = [];

    // Try all possible positions
    for (let y = 0; y <= bounds.height - tableSpec.height; y++) {
      for (let x = 0; x <= bounds.width - tableSpec.width; x++) {
        if (this.canPlaceFurniture(occupancyGrid, x, y, tableSpec.width, tableSpec.height)) {
          // Check if there's enough space around table for chairs
          const chairSpaceAvailable = this.countAvailableChairSpaces(
            occupancyGrid, x, y, tableSpec.width, tableSpec.height
          );
          
          if (chairSpaceAvailable > 0) {
            let score = chairSpaceAvailable * 10; // More chair space = better

            // Placement preference scoring
            if (tableSpec.placement === 'center') {
              const centerX = bounds.width / 2;
              const centerY = bounds.height / 2;
              const distanceFromCenter = Math.abs(x + tableSpec.width/2 - centerX) + Math.abs(y + tableSpec.height/2 - centerY);
              score += Math.max(0, 20 - distanceFromCenter * 2);
            } else if (tableSpec.placement === 'wall') {
              const nearWall = (x === 0 || x + tableSpec.width === bounds.width || 
                              y === 0 || y + tableSpec.height === bounds.height);
              if (nearWall) score += 15;
            }

            validPlacements.push({ x: bounds.x + x, y: bounds.y + y, score });
          }
        }
      }
    }

    if (validPlacements.length === 0) return null;

    // Sort by score and add some randomness
    validPlacements.sort((a, b) => b.score - a.score);
    const topPlacements = validPlacements.filter(p => p.score >= validPlacements[0].score - 5);
    const randomIndex = Math.floor(this.seedRandom(seed) * topPlacements.length);
    const chosen = topPlacements[randomIndex];

    return {
      x: chosen.x,
      y: chosen.y,
      width: tableSpec.width,
      height: tableSpec.height
    };
  }

  private static determineChairPlacementForTable(
    table: {x: number, y: number, width: number, height: number, type: string},
    bounds: {x: number, y: number, width: number, height: number},
    occupancyGrid: boolean[][],
    socialClass: SocialClass,
    seed: number
  ): Array<{x: number, y: number, facing: 0 | 90 | 180 | 270, side: 'north' | 'south' | 'east' | 'west'}> {
    
    const chairs: Array<{x: number, y: number, facing: 0 | 90 | 180 | 270, side: 'north' | 'south' | 'east' | 'west'}> = [];
    
    // Convert table position to grid coordinates
    const tableGridX = table.x - bounds.x;
    const tableGridY = table.y - bounds.y;

    // Define potential chair positions around table
    const potentialChairSpots: Array<{
      x: number, y: number, facing: 0 | 90 | 180 | 270, 
      side: 'north' | 'south' | 'east' | 'west', priority: number
    }> = [];

    // North side of table
    for (let i = 0; i < table.width; i++) {
      const chairX = tableGridX + i;
      const chairY = tableGridY - 1;
      if (chairY >= 0 && this.canPlaceFurniture(occupancyGrid, chairX, chairY, 1, 1)) {
        potentialChairSpots.push({
          x: bounds.x + chairX,
          y: bounds.y + chairY,
          facing: 180, // facing south toward table
          side: 'north',
          priority: table.type === 'desk' && i === Math.floor(table.width/2) ? 1 : 2
        });
      }
    }

    // South side of table
    for (let i = 0; i < table.width; i++) {
      const chairX = tableGridX + i;
      const chairY = tableGridY + table.height;
      if (chairY < bounds.height && this.canPlaceFurniture(occupancyGrid, chairX, chairY, 1, 1)) {
        potentialChairSpots.push({
          x: bounds.x + chairX,
          y: bounds.y + chairY,
          facing: 0, // facing north toward table
          side: 'south',
          priority: 2
        });
      }
    }

    // East side of table
    for (let i = 0; i < table.height; i++) {
      const chairX = tableGridX + table.width;
      const chairY = tableGridY + i;
      if (chairX < bounds.width && this.canPlaceFurniture(occupancyGrid, chairX, chairY, 1, 1)) {
        potentialChairSpots.push({
          x: bounds.x + chairX,
          y: bounds.y + chairY,
          facing: 270, // facing west toward table
          side: 'east',
          priority: 2
        });
      }
    }

    // West side of table
    for (let i = 0; i < table.height; i++) {
      const chairX = tableGridX - 1;
      const chairY = tableGridY + i;
      if (chairX >= 0 && this.canPlaceFurniture(occupancyGrid, chairX, chairY, 1, 1)) {
        potentialChairSpots.push({
          x: bounds.x + chairX,
          y: bounds.y + chairY,
          facing: 90, // facing east toward table
          side: 'west',
          priority: 2
        });
      }
    }

    // Sort by priority (desks get priority chair first)
    potentialChairSpots.sort((a, b) => a.priority - b.priority);

    // Determine how many chairs to place
    let maxChairs: number;
    if (table.type === 'desk') {
      maxChairs = 1; // Desks get exactly 1 chair
    } else if (table.width === 1 && table.height === 1) {
      maxChairs = Math.min(4, potentialChairSpots.length); // Small round table: up to 4
    } else {
      // Larger tables: aim for 50-75% of available spots
      maxChairs = Math.max(2, Math.min(potentialChairSpots.length, Math.floor(potentialChairSpots.length * 0.65)));
    }

    // Place chairs with some randomization
    let currentSeed = seed;
    let chairsPlaced = 0;
    
    for (const spot of potentialChairSpots) {
      if (chairsPlaced >= maxChairs) break;
      
      // For desks, always place the priority chair
      if (table.type === 'desk' && spot.priority === 1) {
        chairs.push(spot);
        chairsPlaced++;
      } else if (table.type !== 'desk') {
        // For other tables, use some randomness but favor better spots
        const shouldPlace = chairsPlaced === 0 || // Always place first chair
                           (spot.priority === 1) || // Always place priority chairs
                           (this.seedRandom(currentSeed++) > 0.4); // 60% chance for others
        
        if (shouldPlace) {
          chairs.push(spot);
          chairsPlaced++;
        }
      }
    }

    return chairs;
  }

  private static countAvailableChairSpaces(
    occupancyGrid: boolean[][],
    tableX: number,
    tableY: number,
    tableWidth: number,
    tableHeight: number
  ): number {
    let count = 0;

    // Check north side
    for (let i = 0; i < tableWidth; i++) {
      if (tableY - 1 >= 0 && !occupancyGrid[tableY - 1][tableX + i]) count++;
    }

    // Check south side
    for (let i = 0; i < tableWidth; i++) {
      if (tableY + tableHeight < occupancyGrid.length && !occupancyGrid[tableY + tableHeight][tableX + i]) count++;
    }

    // Check east side
    for (let i = 0; i < tableHeight; i++) {
      if (tableX + tableWidth < occupancyGrid[0].length && !occupancyGrid[tableY + i][tableX + tableWidth]) count++;
    }

    // Check west side
    for (let i = 0; i < tableHeight; i++) {
      if (tableX - 1 >= 0 && !occupancyGrid[tableY + i][tableX - 1]) count++;
    }

    return count;
  }

  private static canPlaceFurniture(
    occupancyGrid: boolean[][],
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    if (y < 0 || y + height > occupancyGrid.length || x < 0 || x + width > occupancyGrid[0].length) {
      return false;
    }

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (occupancyGrid[y + dy][x + dx]) {
          return false;
        }
      }
    }

    return true;
  }

  private static findOptimalFurniturePlacement(
    furnitureSpec: any,
    bounds: {x: number, y: number, width: number, height: number},
    occupancyGrid: boolean[][],
    seed: number
  ): {x: number, y: number, width: number, height: number, rotation?: number} | null {
    
    const validPlacements: Array<{x: number, y: number, score: number}> = [];

    for (let y = 0; y <= bounds.height - furnitureSpec.height; y++) {
      for (let x = 0; x <= bounds.width - furnitureSpec.width; x++) {
        if (this.canPlaceFurniture(occupancyGrid, x, y, furnitureSpec.width, furnitureSpec.height)) {
          let score = 50; // Base score

          // Placement preference scoring
          if (furnitureSpec.placement === 'wall') {
            const nearWall = (x === 0 || x + furnitureSpec.width === bounds.width || 
                            y === 0 || y + furnitureSpec.height === bounds.height);
            if (nearWall) score += 30;
          } else if (furnitureSpec.placement === 'corner') {
            const nearCorner = (x <= 1 || x >= bounds.width - furnitureSpec.width - 1) &&
                              (y <= 1 || y >= bounds.height - furnitureSpec.height - 1);
            if (nearCorner) score += 35;
          }

          validPlacements.push({ x: bounds.x + x, y: bounds.y + y, score });
        }
      }
    }

    if (validPlacements.length === 0) return null;

    // Sort by score and pick a good one with some randomness
    validPlacements.sort((a, b) => b.score - a.score);
    const topPlacements = validPlacements.slice(0, Math.min(3, validPlacements.length));
    const randomIndex = Math.floor(this.seedRandom(seed) * topPlacements.length);
    const chosen = topPlacements[randomIndex];

    return {
      x: chosen.x,
      y: chosen.y,
      width: furnitureSpec.width,
      height: furnitureSpec.height
    };
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}