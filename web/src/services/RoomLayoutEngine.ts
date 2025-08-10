import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { BuildingTemplates, RoomTemplate } from './BuildingTemplates';
import { FloorMaterialSystem, RoomFunction } from './FloorMaterialSystem';
import { Room } from './ProceduralBuildingGenerator';

interface PlacedRoom extends Room {
  template: RoomTemplate;
}

interface LayoutGrid {
  width: number;
  height: number;
  occupied: boolean[][];
}

export class RoomLayoutEngine {
  static generateRoomLayout(
    buildingType: BuildingType,
    building: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    climate: string = 'temperate',
    seed: number
  ): Room[] {
    const template = BuildingTemplates.getTemplate(buildingType);
    const availableSpace = {
      width: building.width - 2, // Account for walls
      height: building.height - 2,
      x: building.x + 1,
      y: building.y + 1
    };

    // Create grid to track occupied space
    const grid: LayoutGrid = {
      width: availableSpace.width,
      height: availableSpace.height,
      occupied: Array(availableSpace.height).fill(null).map(() => 
        Array(availableSpace.width).fill(false)
      )
    };

    const placedRooms: PlacedRoom[] = [];
    const roomTemplates = BuildingTemplates.getRoomsByPriority(buildingType);

    // First pass: Place required rooms
    const requiredRooms = roomTemplates.filter(rt => rt.required);
    for (const roomTemplate of requiredRooms) {
      const placement = this.findBestRoomPlacement(
        roomTemplate, grid, availableSpace, socialClass, seed + placedRooms.length
      );
      
      if (placement) {
        const room = this.createRoomFromTemplate(
          roomTemplate, placement, socialClass, climate, seed + placedRooms.length
        );
        placedRooms.push({ ...room, template: roomTemplate });
        this.markGridOccupied(grid, placement);
      }
    }

    // Second pass: Place optional rooms if space allows
    const optionalRooms = roomTemplates.filter(rt => !rt.required);
    for (const roomTemplate of optionalRooms) {
      const placement = this.findBestRoomPlacement(
        roomTemplate, grid, availableSpace, socialClass, seed + placedRooms.length
      );
      
      if (placement) {
        const room = this.createRoomFromTemplate(
          roomTemplate, placement, socialClass, climate, seed + placedRooms.length
        );
        placedRooms.push({ ...room, template: roomTemplate });
        this.markGridOccupied(grid, placement);
      }
    }

    // If we couldn't place all required rooms, fall back to simple single room
    if (placedRooms.filter(r => r.template.required).length < requiredRooms.length) {
      console.warn(`Could not place all required rooms for ${buildingType}, using fallback`);
      return this.createFallbackLayout(buildingType, building, socialClass, climate, seed);
    }

    return placedRooms;
  }

  private static findBestRoomPlacement(
    roomTemplate: RoomTemplate,
    grid: LayoutGrid,
    availableSpace: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    seed: number
  ): { x: number; y: number; width: number; height: number } | null {
    
    // Determine room size based on available space and preferences
    const maxWidth = Math.min(roomTemplate.maxWidth, grid.width);
    const maxHeight = Math.min(roomTemplate.maxHeight, grid.height);
    const minWidth = Math.max(roomTemplate.minWidth, 3);
    const minHeight = Math.max(roomTemplate.minHeight, 3);

    if (maxWidth < minWidth || maxHeight < minHeight) {
      return null; // Room won't fit
    }

    // Try preferred size first, then scale down
    const preferredWidth = Math.min(roomTemplate.preferredWidth, maxWidth);
    const preferredHeight = Math.min(roomTemplate.preferredHeight, maxHeight);

    const sizesToTry = [
      { width: preferredWidth, height: preferredHeight },
      { width: Math.max(minWidth, Math.floor(preferredWidth * 0.8)), height: preferredHeight },
      { width: preferredWidth, height: Math.max(minHeight, Math.floor(preferredHeight * 0.8)) },
      { width: minWidth, height: minHeight }
    ];

    for (const size of sizesToTry) {
      const placement = this.findSpaceForRoom(grid, size.width, size.height, seed);
      if (placement) {
        return {
          x: availableSpace.x + placement.x,
          y: availableSpace.y + placement.y,
          width: size.width,
          height: size.height
        };
      }
    }

    return null;
  }

  private static findSpaceForRoom(
    grid: LayoutGrid,
    width: number,
    height: number,
    seed: number
  ): { x: number; y: number } | null {
    
    const validPositions: { x: number; y: number; score: number }[] = [];

    // Check all possible positions
    for (let y = 0; y <= grid.height - height; y++) {
      for (let x = 0; x <= grid.width - width; x++) {
        if (this.canPlaceRoom(grid, x, y, width, height)) {
          // Score based on position preferences (corner/edge bonuses)
          let score = 0;
          if (x === 0 || x + width === grid.width) score += 2; // Wall bonus
          if (y === 0 || y + height === grid.height) score += 2; // Wall bonus
          if (x === 0 && y === 0) score += 3; // Corner bonus
          
          validPositions.push({ x, y, score });
        }
      }
    }

    if (validPositions.length === 0) {
      return null;
    }

    // Sort by score and pick best positions
    validPositions.sort((a, b) => b.score - a.score);
    const bestScore = validPositions[0].score;
    const bestPositions = validPositions.filter(p => p.score === bestScore);

    // Add some randomness to position selection
    const random = this.seedRandom(seed);
    const selectedIndex = Math.floor(random * bestPositions.length);
    
    return bestPositions[selectedIndex];
  }

  private static canPlaceRoom(
    grid: LayoutGrid,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    
    // Check if area is within bounds
    if (x < 0 || y < 0 || x + width > grid.width || y + height > grid.height) {
      return false;
    }

    // Check if area is unoccupied
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (grid.occupied[y + dy][x + dx]) {
          return false;
        }
      }
    }

    return true;
  }

  private static markGridOccupied(
    grid: LayoutGrid,
    placement: { x: number; y: number; width: number; height: number }
  ): void {
    
    const localX = placement.x - 1; // Convert back to grid coordinates  
    const localY = placement.y - 1;

    for (let dy = 0; dy < placement.height; dy++) {
      for (let dx = 0; dx < placement.width; dx++) {
        const gx = localX + dx;
        const gy = localY + dy;
        if (gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height) {
          grid.occupied[gy][gx] = true;
        }
      }
    }
  }

  private static createRoomFromTemplate(
    template: RoomTemplate,
    placement: { x: number; y: number; width: number; height: number },
    socialClass: SocialClass,
    climate: string,
    seed: number
  ): Room {
    
    const roomFunction = this.mapTemplateTypeToRoomFunction(template.type);
    
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      floor: 0, // Ground floor
      tiles: this.generateRoomTiles(
        placement.x, placement.y, placement.width, placement.height,
        roomFunction, socialClass, climate, seed
      ),
      furniture: [],
      doors: this.generateDoors(placement),
      windows: this.generateWindows(placement, template.type)
    };
  }

  private static mapTemplateTypeToRoomFunction(type: string): RoomFunction {
    const mapping: { [key: string]: RoomFunction } = {
      'living': 'living',
      'kitchen': 'kitchen',
      'bedroom': 'bedroom',
      'storage': 'storage',
      'workshop': 'workshop',
      'common': 'common',
      'tavern_hall': 'tavern_hall',
      'guest_room': 'guest_room',
      'shop_floor': 'shop_floor',
      'cellar': 'cellar',
      'office': 'office'
    };
    
    return mapping[type] || 'common';
  }

  private static generateRoomTiles(
    x: number, y: number, width: number, height: number,
    roomFunction: RoomFunction, socialClass: SocialClass, 
    climate: string, seed: number
  ): any[] {
    
    const tiles: any[] = [];
    const floorMaterial = FloorMaterialSystem.selectFloorMaterial(
      roomFunction, socialClass, climate, undefined, seed
    );
    const wallMaterial = FloorMaterialSystem.getWallMaterial(
      roomFunction, socialClass, climate
    );
    
    for (let ty = y; ty < y + height; ty++) {
      for (let tx = x; tx < x + width; tx++) {
        if (tx > x && tx < x + width - 1 && ty > y && ty < y + height - 1) {
          // Interior floor tiles
          tiles.push({ 
            x: tx, y: ty, type: 'floor', 
            material: floorMaterial.material,
            color: floorMaterial.colorHex,
            reasoning: floorMaterial.reasoning
          });
        } else {
          // Wall tiles
          tiles.push({ 
            x: tx, y: ty, type: 'wall', 
            material: wallMaterial.material,
            color: wallMaterial.colorHex
          });
        }
      }
    }
    
    return tiles;
  }

  private static generateDoors(
    placement: { x: number; y: number; width: number; height: number }
  ): any[] {
    
    // Simple door placement - always on the south wall for now
    return [{
      x: placement.x + Math.floor(placement.width / 2),
      y: placement.y + placement.height - 1,
      direction: 'south'
    }];
  }

  private static generateWindows(
    placement: { x: number; y: number; width: number; height: number },
    roomType: string
  ): any[] {
    
    const windows: any[] = [];
    
    // Add window on north wall for most room types
    if (roomType !== 'storage' && roomType !== 'cellar') {
      windows.push({
        x: placement.x + 1,
        y: placement.y,
        direction: 'north'
      });
    }

    // Shops get extra windows for visibility
    if (roomType === 'shop_floor') {
      windows.push({
        x: placement.x + placement.width - 2,
        y: placement.y,
        direction: 'north'
      });
    }

    return windows;
  }

  private static createFallbackLayout(
    buildingType: BuildingType,
    building: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    climate: string,
    seed: number
  ): Room[] {
    
    // Simple single room fallback
    const roomFunction: RoomFunction = buildingType === 'tavern' ? 'tavern_hall' :
                                      buildingType === 'shop' ? 'shop_floor' :
                                      buildingType === 'blacksmith' ? 'workshop' : 'living';
    
    return [{
      id: 'main_room',
      name: this.getRoomNameForType(buildingType),
      type: 'common',
      x: building.x + 1,
      y: building.y + 1,
      width: building.width - 2,
      height: building.height - 2,
      floor: 0,
      tiles: this.generateRoomTiles(
        building.x + 1, building.y + 1, building.width - 2, building.height - 2,
        roomFunction, socialClass, climate, seed
      ),
      furniture: [],
      doors: this.generateDoors({
        x: building.x + 1,
        y: building.y + 1,
        width: building.width - 2,
        height: building.height - 2
      }),
      windows: this.generateWindows({
        x: building.x + 1,
        y: building.y + 1,
        width: building.width - 2,
        height: building.height - 2
      }, 'common')
    }];
  }

  private static getRoomNameForType(buildingType: BuildingType): string {
    const names = {
      house_small: 'Main Room',
      house_large: 'Main Hall',
      tavern: 'Common Room',
      blacksmith: 'Forge Workshop',
      shop: 'Shop Floor',
      market_stall: 'Market Stall'
    };
    
    return names[buildingType] || 'Main Room';
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}