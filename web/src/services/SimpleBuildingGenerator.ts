import { Random } from '../utils/Random';
import { getFurnitureForRoom, getFurnitureQuality } from './BuildingUtils';

// Simplified, unified types
export type BuildingType = 'house_small' | 'house_large' | 'tavern' | 'blacksmith' | 'shop' | 'market_stall';
export type SocialClass = 'poor' | 'common' | 'wealthy' | 'noble';
export type RoomFunction = 'bedroom' | 'kitchen' | 'common' | 'shop' | 'workshop' | 'storage' | 'entrance';

export interface SimpleTile {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door' | 'window' | 'empty';
  material: string;
  lighting?: number; // 0-100
}

export interface SimpleFurniture {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  rotation: number; // 0, 90, 180, 270
}

export interface SimpleRoom {
  id: string;
  name: string;
  function: RoomFunction;
  x: number;
  y: number;
  width: number;
  height: number;
  tiles: SimpleTile[];
  furniture: SimpleFurniture[];
  doors: Array<{ x: number; y: number; direction: string }>;
  windows: Array<{ x: number; y: number; direction: string }>;
}

export interface SimpleBuilding {
  id: string;
  type: BuildingType;
  socialClass: SocialClass;
  width: number;
  height: number;
  rooms: SimpleRoom[];
  exteriorFeatures: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  materials: {
    walls: string;
    roof: string;
    floors: string;
  };
}

export interface GenerationOptions {
  buildingType: BuildingType;
  socialClass: SocialClass;
  seed: number;
  lotSize?: { width: number; height: number };
}

export class SimpleBuildingGenerator {
  private random: Random;

  constructor(seed: number) {
    this.random = new Random(seed);
  }

  // Main generation pipeline - clear phases
  generate(options: GenerationOptions): SimpleBuilding {
    // Phase 1: Structure
    const structure = this.generateStructure(options);
    
    // Phase 2: Layout  
    const rooms = this.generateRooms(structure, options);
    
    // Phase 3: Furnishing
    const furnishedRooms = this.furnishRooms(rooms, options.socialClass);
    
    // Phase 4: Details
    const materials = this.selectMaterials(options.socialClass);
    const exteriorFeatures = this.generateExteriorFeatures(structure, options.socialClass);

    return {
      id: `building_${options.seed}`,
      type: options.buildingType,
      socialClass: options.socialClass,
      width: structure.width,
      height: structure.height,
      rooms: furnishedRooms,
      exteriorFeatures,
      materials
    };
  }

  // Phase 1: Generate building structure
  private generateStructure(options: GenerationOptions) {
    const lotSize = options.lotSize || this.getDefaultLotSize(options.buildingType, options.socialClass);
    
    const buildingSize = this.calculateBuildingSize(options.buildingType, options.socialClass, lotSize);
    
    return {
      width: buildingSize.width,
      height: buildingSize.height,
      lotWidth: lotSize.width,
      lotHeight: lotSize.height
    };
  }

  // Phase 2: Generate room layout
  private generateRooms(structure: any, options: GenerationOptions): SimpleRoom[] {
    const roomPlan = this.getRoomPlan(options.buildingType);
    const rooms: SimpleRoom[] = [];

    let currentY = 1; // Leave 1 tile border
    
    for (const roomDef of roomPlan) {
      const roomWidth = Math.floor(structure.width * roomDef.widthRatio) - 2;
      const roomHeight = Math.floor(structure.height * roomDef.heightRatio) - 2;
      
      const room = this.createRoom(
        roomDef.function,
        1, // x
        currentY,
        Math.max(4, roomWidth), // Minimum 4 tiles wide
        Math.max(3, roomHeight), // Minimum 3 tiles high
        rooms.length
      );
      
      rooms.push(room);
      currentY += room.height + 1; // Space between rooms
    }

    // Add connecting doors
    this.addDoorsBetweenRooms(rooms);

    return rooms;
  }

  // Phase 3: Add furniture to rooms
  private furnishRooms(rooms: SimpleRoom[], socialClass: SocialClass): SimpleRoom[] {
    return rooms.map(room => {
      const furniture = this.generateFurnitureForRoom(room.function, socialClass, room);
      return { ...room, furniture };
    });
  }

  // Utility methods - simple and focused
  private getDefaultLotSize(type: BuildingType, socialClass: SocialClass) {
    const baseSizes = {
      'house_small': { width: 12, height: 12 },
      'house_large': { width: 20, height: 16 },
      'tavern': { width: 24, height: 20 },
      'blacksmith': { width: 16, height: 14 },
      'shop': { width: 14, height: 12 },
      'market_stall': { width: 8, height: 6 }
    };

    const multiplier = socialClass === 'noble' ? 1.5 : socialClass === 'wealthy' ? 1.3 : 1;
    const base = baseSizes[type];
    
    return {
      width: Math.floor(base.width * multiplier),
      height: Math.floor(base.height * multiplier)
    };
  }

  private calculateBuildingSize(type: BuildingType, socialClass: SocialClass, lotSize: any) {
    return {
      width: lotSize.width - 4, // Leave space around building
      height: lotSize.height - 4
    };
  }

  private getRoomPlan(type: BuildingType) {
    const plans = {
      'house_small': [
        { function: 'entrance' as RoomFunction, widthRatio: 1, heightRatio: 0.3 },
        { function: 'common' as RoomFunction, widthRatio: 1, heightRatio: 0.4 },
        { function: 'bedroom' as RoomFunction, widthRatio: 1, heightRatio: 0.3 }
      ],
      'house_large': [
        { function: 'entrance' as RoomFunction, widthRatio: 1, heightRatio: 0.2 },
        { function: 'common' as RoomFunction, widthRatio: 1, heightRatio: 0.3 },
        { function: 'kitchen' as RoomFunction, widthRatio: 1, heightRatio: 0.25 },
        { function: 'bedroom' as RoomFunction, widthRatio: 1, heightRatio: 0.25 }
      ],
      'tavern': [
        { function: 'entrance' as RoomFunction, widthRatio: 1, heightRatio: 0.15 },
        { function: 'common' as RoomFunction, widthRatio: 1, heightRatio: 0.5 },
        { function: 'kitchen' as RoomFunction, widthRatio: 1, heightRatio: 0.2 },
        { function: 'storage' as RoomFunction, widthRatio: 1, heightRatio: 0.15 }
      ],
      'blacksmith': [
        { function: 'entrance' as RoomFunction, widthRatio: 1, heightRatio: 0.2 },
        { function: 'workshop' as RoomFunction, widthRatio: 1, heightRatio: 0.6 },
        { function: 'storage' as RoomFunction, widthRatio: 1, heightRatio: 0.2 }
      ],
      'shop': [
        { function: 'entrance' as RoomFunction, widthRatio: 1, heightRatio: 0.1 },
        { function: 'shop' as RoomFunction, widthRatio: 1, heightRatio: 0.6 },
        { function: 'storage' as RoomFunction, widthRatio: 1, heightRatio: 0.3 }
      ],
      'market_stall': [
        { function: 'shop' as RoomFunction, widthRatio: 1, heightRatio: 1 }
      ]
    };

    return plans[type] || plans['house_small'];
  }

  private createRoom(
    roomFunction: RoomFunction,
    x: number,
    y: number,
    width: number,
    height: number,
    index: number
  ): SimpleRoom {
    const tiles: SimpleTile[] = [];
    
    // Generate room tiles
    for (let ry = 0; ry < height; ry++) {
      for (let rx = 0; rx < width; rx++) {
        const isWall = rx === 0 || rx === width - 1 || ry === 0 || ry === height - 1;
        
        tiles.push({
          x: x + rx,
          y: y + ry,
          type: isWall ? 'wall' : 'floor',
          material: isWall ? 'stone' : 'wood',
          lighting: 70
        });
      }
    }

    return {
      id: `room_${index}`,
      name: this.getRoomName(roomFunction, index),
      function: roomFunction,
      x,
      y,
      width,
      height,
      tiles,
      furniture: [],
      doors: [],
      windows: []
    };
  }

  private getRoomName(roomFunction: RoomFunction, index: number): string {
    const names = {
      'entrance': 'Entrance Hall',
      'common': 'Common Room',
      'bedroom': 'Bedroom',
      'kitchen': 'Kitchen',
      'workshop': 'Workshop',
      'shop': 'Shop Floor',
      'storage': 'Storage Room'
    };
    return names[roomFunction] || `Room ${index + 1}`;
  }

  private addDoorsBetweenRooms(rooms: SimpleRoom[]) {
    for (let i = 0; i < rooms.length - 1; i++) {
      const currentRoom = rooms[i];
      const nextRoom = rooms[i + 1];
      
      // Add door at bottom of current room
      const doorX = Math.floor(currentRoom.width / 2);
      const doorY = currentRoom.height - 1;
      
      // Update tile to door
      const doorTile = currentRoom.tiles.find(t => t.x === currentRoom.x + doorX && t.y === currentRoom.y + doorY);
      if (doorTile) {
        doorTile.type = 'door';
      }
      
      currentRoom.doors.push({
        x: doorX,
        y: doorY,
        direction: 'south'
      });
    }
  }

  private generateFurnitureForRoom(roomFunction: RoomFunction, socialClass: SocialClass, room: SimpleRoom): SimpleFurniture[] {
    const furnitureTemplates = getFurnitureForRoom(roomFunction, socialClass);
    const furnitureQuality = getFurnitureQuality(socialClass);
    const furniture: SimpleFurniture[] = [];
    
    // Place furniture in order of priority, with special handling for relationships
    for (const template of furnitureTemplates) {
      let placement = null;
      
      // Special handling for chairs - try to place them adjacent to tables
      if (template.type === 'chair') {
        placement = this.findChairPlacementNearTable(room, furniture);
      }
      
      // Fallback to general placement if no special placement found
      if (!placement) {
        placement = this.findFurniturePlacement(room, template.width, template.height);
      }
      
      if (placement) {
        const qualityName = `${furnitureQuality.prefix} ${template.name}`.trim();
        furniture.push({
          id: `${template.type}_${furniture.length}`,
          name: qualityName,
          x: placement.x,
          y: placement.y,
          width: template.width,
          height: template.height,
          type: template.type,
          rotation: 0
        });
      }
    }
    
    return furniture;
  }


  private findFurniturePlacement(room: SimpleRoom, width: number, height: number) {
    // Simple placement - find first available space
    for (let y = 1; y < room.height - height - 1; y++) {
      for (let x = 1; x < room.width - width - 1; x++) {
        if (this.isSpaceAvailable(room, x, y, width, height)) {
          return { x: room.x + x, y: room.y + y };
        }
      }
    }
    return null;
  }

  private findChairPlacementNearTable(room: SimpleRoom, existingFurniture: SimpleFurniture[]): { x: number; y: number } | null {
    // Find the first table in the room
    const table = existingFurniture.find(f => f.type === 'table');
    if (!table) return null;

    // Try to place chair adjacent to table (prioritize short sides, then long sides)
    const chairPositions = [
      // Short sides first (more natural seating)
      // West side of table
      { x: table.x - 1, y: table.y, priority: 1 },
      { x: table.x - 1, y: table.y + 1, priority: 2 },
      
      // East side of table
      { x: table.x + table.width, y: table.y, priority: 1 },
      { x: table.x + table.width, y: table.y + 1, priority: 2 },
      
      // Long sides second
      // North side of table
      { x: table.x, y: table.y - 1, priority: 3 },
      { x: table.x + 1, y: table.y - 1, priority: 3 },
      { x: table.x + 2, y: table.y - 1, priority: 3 },
      
      // South side of table  
      { x: table.x, y: table.y + table.height, priority: 3 },
      { x: table.x + 1, y: table.y + table.height, priority: 3 },
      { x: table.x + 2, y: table.y + table.height, priority: 3 }
    ];
    
    // Sort by priority (lower numbers first)
    chairPositions.sort((a, b) => a.priority - b.priority);

    // Check each position to see if it's available
    for (const pos of chairPositions) {
      // Convert to room-relative coordinates for checking
      const roomRelativeX = pos.x - room.x;
      const roomRelativeY = pos.y - room.y;
      
      // Check if position is within room bounds
      if (roomRelativeX >= 1 && roomRelativeX < room.width - 1 && 
          roomRelativeY >= 1 && roomRelativeY < room.height - 1) {
        
        // Check if space is available (1x1 for chair)
        if (this.isSpaceAvailable(room, roomRelativeX, roomRelativeY, 1, 1)) {
          return pos;
        }
      }
    }

    return null;
  }

  private isSpaceAvailable(room: SimpleRoom, x: number, y: number, width: number, height: number): boolean {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const tile = room.tiles.find(t => 
          t.x === room.x + x + dx && t.y === room.y + y + dy
        );
        if (!tile || tile.type !== 'floor') {
          return false;
        }
      }
    }
    
    // Check no furniture already placed
    return !room.furniture.some(f => 
      f.x < room.x + x + width && 
      f.x + f.width > room.x + x &&
      f.y < room.y + y + height && 
      f.y + f.height > room.y + y
    );
  }

  private selectMaterials(socialClass: SocialClass) {
    const materialSets = {
      'poor': {
        walls: 'mud_brick',
        roof: 'thatch',
        floors: 'dirt'
      },
      'common': {
        walls: 'stone',
        roof: 'wood_shingles', 
        floors: 'wood_planks'
      },
      'wealthy': {
        walls: 'cut_stone',
        roof: 'slate',
        floors: 'oak_planks'
      },
      'noble': {
        walls: 'marble',
        roof: 'slate',
        floors: 'marble_tiles'
      }
    };

    return materialSets[socialClass];
  }

  private generateExteriorFeatures(structure: any, socialClass: SocialClass) {
    const features = [];
    
    if (socialClass !== 'poor') {
      features.push({
        id: 'garden',
        name: 'Small Garden',
        x: structure.width + 2,
        y: 2,
        width: 4,
        height: 4
      });
    }

    if (socialClass === 'wealthy' || socialClass === 'noble') {
      features.push({
        id: 'well',
        name: 'Well',
        x: structure.width + 7,
        y: 2,
        width: 2,
        height: 2
      });
    }

    return features;
  }
}