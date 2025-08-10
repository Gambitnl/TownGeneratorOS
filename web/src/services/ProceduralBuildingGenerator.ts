import { AssetManager, AssetInfo } from './AssetManager';
import { IntelligentFurniturePlacement, PlacementResult } from './IntelligentFurniturePlacement';

// Grid system - each tile is 5 feet in D&D terms
const TILE_SIZE = 5; // 5 feet per tile
const MIN_ROOM_SIZE = 2; // 10 feet minimum
const MAX_BUILDING_SIZE = 20; // 100 feet maximum - increased for larger D&D maps

export interface RoomTile {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door' | 'window' | 'empty';
  material?: string;
  style?: string;
}

export interface RoomFurniture {
  id: string;
  asset: AssetInfo;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  purpose: string; // "seating", "storage", "lighting", "work", "decoration"
  furnitureType?: string; // "Chair", "Table", "Bed", etc.
}

export interface Room {
  id: string;
  name: string;
  type: 'bedroom' | 'kitchen' | 'common' | 'shop' | 'workshop' | 'storage' | 'entrance' | 'library' | 'laboratory' | 'armory' | 'chapel' | 'nursery' | 'study' | 'pantry' | 'cellar' | 'attic' | 'balcony';
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number; // Floor level: -1 = basement, 0 = ground, 1+ = upper floors
  tiles: RoomTile[];
  furniture: RoomFurniture[];
  doors: { x: number; y: number; direction: 'north' | 'south' | 'east' | 'west' }[];
  windows: { x: number; y: number; direction: 'north' | 'south' | 'east' | 'west' }[];
  stairs?: { x: number; y: number; direction: 'up' | 'down'; targetFloor: number }[];
  fixtures?: Array<{
    id: string;
    name: string;
    type: 'hearth' | 'privy' | 'built_in_storage' | 'well' | 'bread_oven' | 'washbasin' | 'garderobe' | 'alcove';
    x: number;
    y: number;
    width: number;
    height: number;
    wallSide?: 'north' | 'south' | 'east' | 'west';
    functionality: string[];
  }>;
  chimneys?: Array<{ x: number; y: number; material: string }>;
  decorations?: Array<{
    id: string;
    name: string;
    type: 'wall_hanging' | 'floor_covering' | 'ceiling_feature' | 'lighting' | 'plants' | 'religious' | 'luxury';
    x: number;
    y: number;
    width: number;
    height: number;
    placement: 'wall' | 'floor' | 'ceiling' | 'corner' | 'center';
    wallSide?: 'north' | 'south' | 'east' | 'west';
    lightLevel: number;
    comfort: number;
  }>;
  lighting?: Array<{
    id: string;
    type: 'candle' | 'oil_lamp' | 'torch' | 'lantern' | 'chandelier' | 'sconce' | 'fireplace_light';
    x: number;
    y: number;
    lightRadius: number;
    lightIntensity: number;
    placement: 'table' | 'wall' | 'ceiling' | 'floor';
  }>;
}

export interface ExteriorFeature {
  id: string;
  type: 'garden' | 'well' | 'cart' | 'fence' | 'path' | 'tree' | 'decoration' | 'storage';
  asset?: AssetInfo;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Floor {
  level: number; // -1 = basement, 0 = ground, 1+ = upper floors
  rooms: Room[];
  height: number; // Floor height in tiles (usually 3 for 15 feet ceiling)
  hallways?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'corridor' | 'entrance_hall' | 'landing' | 'gallery';
  }>;
}

export interface BuildingPlan {
  id: string;
  buildingType: 'house_small' | 'house_large' | 'tavern' | 'blacksmith' | 'shop' | 'market_stall';
  socialClass: 'poor' | 'common' | 'wealthy' | 'noble';
  lotWidth: number;
  lotHeight: number;
  buildingWidth: number;
  buildingHeight: number;
  buildingX: number; // position on lot
  buildingY: number; // position on lot
  floors: Floor[]; // Multi-story support
  totalBuildingHeight: number; // Total height including all floors
  rooms: Room[]; // Kept for backward compatibility
  exteriorFeatures: ExteriorFeature[];
  exteriorElements?: Array<{
    id: string;
    type: 'chimney' | 'entrance' | 'roof_structure' | 'buttress' | 'tower' | 'bay_window' | 'balcony' | 'dormer';
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    floorLevel: number;
  }>;
  roofStructures?: Array<{
    id: string;
    type: 'gable' | 'hip' | 'shed' | 'gambrel' | 'mansard' | 'tower_cone';
    material: string;
    pitch: number;
  }>;
  wallMaterial: string;
  roofMaterial: string;
  foundationMaterial: string;
  condition: 'new' | 'good' | 'worn' | 'poor' | 'ruins';
  age: number; // Years since construction
  climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry';
  aesthetics?: any; // BuildingAesthetics - using any to avoid circular dependency
}

export class ProceduralBuildingGenerator {
  private static seedRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  private static randomInRange(min: number, max: number, seed: number): number {
    return Math.floor(this.seedRandom(seed) * (max - min + 1)) + min;
  }

  private static chooseWeightedRandom<T>(options: { item: T; weight: number }[], seed: number): T {
    const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
    let random = this.seedRandom(seed) * totalWeight;
    
    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.item;
      }
    }
    return options[options.length - 1].item;
  }

  static generateBuilding(
    buildingType: BuildingPlan['buildingType'],
    socialClass: BuildingPlan['socialClass'],
    seed: number,
    lotSize?: { width: number; height: number }
  ): BuildingPlan {
    // Determine lot size based on building type and social class
    const lot = lotSize || this.generateLotSize(buildingType, socialClass, seed);
    
    // Generate building size and position on lot
    const building = this.generateBuildingSize(buildingType, socialClass, lot, seed + 1);
    
    // Choose materials based on social class and building type
    const materials = this.chooseMaterials(buildingType, socialClass, seed + 2);
    
    // Generate room layout
    const rooms = this.generateRoomLayout(buildingType, building, seed + 3);
    
    // Furnish each room
    rooms.forEach((room, index) => {
      room.furniture = this.furnishRoom(room, socialClass, seed + 100 + index);
    });
    
    // Generate exterior features
    const exteriorFeatures = this.generateExteriorFeatures(
      buildingType, 
      socialClass, 
      lot, 
      building, 
      seed + 4
    );

    return {
      id: `building_${seed}`,
      buildingType,
      socialClass,
      lotWidth: lot.width,
      lotHeight: lot.height,
      buildingWidth: building.width,
      buildingHeight: building.height,
      buildingX: building.x,
      buildingY: building.y,
      rooms,
      exteriorFeatures,
      wallMaterial: materials.wall,
      roofMaterial: materials.roof,
      foundationMaterial: materials.foundation
    };
  }

  private static generateLotSize(
    buildingType: BuildingPlan['buildingType'],
    socialClass: BuildingPlan['socialClass'],
    seed: number
  ): { width: number; height: number } {
    // Increased lot sizes for better D&D map visibility
    const baseSizes: Record<BuildingPlan['buildingType'], { min: number; max: number }> = {
      house_small: { min: 12, max: 18 },
      house_large: { min: 18, max: 28 },
      tavern: { min: 20, max: 35 },
      blacksmith: { min: 15, max: 25 },
      shop: { min: 14, max: 22 },
      market_stall: { min: 8, max: 14 }
    };

    const classMultiplier = {
      poor: 0.8,
      common: 1.0,
      wealthy: 1.3,
      noble: 1.6
    };

    const base = baseSizes[buildingType];
    const multiplier = classMultiplier[socialClass];
    
    const width = Math.round(
      this.randomInRange(
        Math.max(4, Math.round(base.min * multiplier)),
        Math.round(base.max * multiplier),
        seed
      )
    );
    
    const height = Math.round(
      this.randomInRange(
        Math.max(4, Math.round(base.min * multiplier)),
        Math.round(base.max * multiplier),
        seed + 1
      )
    );

    return { width, height };
  }

  private static generateBuildingSize(
    buildingType: BuildingPlan['buildingType'],
    socialClass: BuildingPlan['socialClass'],
    lot: { width: number; height: number },
    seed: number
  ): { width: number; height: number; x: number; y: number } {
    // Building takes up 60-80% of lot space
    const coverage = this.seedRandom(seed) * 0.2 + 0.6; // 0.6 to 0.8
    
    const maxWidth = Math.floor(lot.width * coverage);
    const maxHeight = Math.floor(lot.height * coverage);
    
    const width = Math.max(MIN_ROOM_SIZE * 2, Math.min(maxWidth, MAX_BUILDING_SIZE));
    const height = Math.max(MIN_ROOM_SIZE * 2, Math.min(maxHeight, MAX_BUILDING_SIZE));
    
    // Center building on lot with some random offset
    const offsetX = this.randomInRange(1, lot.width - width - 1, seed + 1);
    const offsetY = this.randomInRange(1, lot.height - height - 1, seed + 2);
    
    return { width, height, x: offsetX, y: offsetY };
  }

  private static chooseMaterials(
    buildingType: BuildingPlan['buildingType'],
    socialClass: BuildingPlan['socialClass'],
    seed: number
  ): { wall: string; roof: string; foundation: string } {
    const materialsByClass = {
      poor: {
        wall: ['wood', 'wood', 'wood', 'brick'],
        roof: ['wood', 'thatch', 'thatch'],
        foundation: ['stone', 'wood']
      },
      common: {
        wall: ['wood', 'brick', 'brick', 'stone'],
        roof: ['wood', 'tile', 'slate'],
        foundation: ['stone', 'stone', 'brick']
      },
      wealthy: {
        wall: ['brick', 'stone', 'stone'],
        roof: ['tile', 'slate', 'slate'],
        foundation: ['stone', 'stone', 'marble']
      },
      noble: {
        wall: ['stone', 'marble', 'stone'],
        roof: ['slate', 'tile', 'metal'],
        foundation: ['marble', 'stone', 'stone']
      }
    };

    const materials = materialsByClass[socialClass];
    
    return {
      wall: materials.wall[Math.floor(this.seedRandom(seed) * materials.wall.length)],
      roof: materials.roof[Math.floor(this.seedRandom(seed + 1) * materials.roof.length)],
      foundation: materials.foundation[Math.floor(this.seedRandom(seed + 2) * materials.foundation.length)]
    };
  }

  private static generateRoomLayout(
    buildingType: BuildingPlan['buildingType'],
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    
    // Define room templates based on building type
    const roomTemplates = this.getRoomTemplates(buildingType);
    
    // Simple rectangular subdivision for now
    // TODO: Implement more sophisticated room generation
    switch (buildingType) {
      case 'house_small':
        return this.generateSmallHouseLayout(building, seed);
      case 'house_large':
        return this.generateLargeHouseLayout(building, seed);
      case 'tavern':
        return this.generateTavernLayout(building, seed);
      case 'blacksmith':
        return this.generateBlacksmithLayout(building, seed);
      case 'shop':
        return this.generateShopLayout(building, seed);
      case 'market_stall':
        return this.generateMarketStallLayout(building, seed);
      default:
        return this.generateSmallHouseLayout(building, seed);
    }
  }

  private static generateSmallHouseLayout(
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    
    if (building.width <= 4 || building.height <= 4) {
      // Single room
      rooms.push({
        id: 'main',
        name: 'Main Room',
        type: 'common',
        x: 0,
        y: 0,
        width: building.width,
        height: building.height,
        tiles: this.generateRoomTiles(0, 0, building.width, building.height),
        furniture: [],
        doors: [{ x: Math.floor(building.width / 2), y: building.height - 1, direction: 'south' }],
        windows: [{ x: 1, y: 0, direction: 'north' }]
      });
    } else {
      // Two rooms: main + bedroom
      const splitVertical = building.width > building.height;
      
      if (splitVertical) {
        const split = Math.floor(building.width * 0.6);
        rooms.push({
          id: 'main',
          name: 'Main Room',
          type: 'common',
          x: 0,
          y: 0,
          width: split,
          height: building.height,
          tiles: this.generateRoomTiles(0, 0, split, building.height),
          furniture: [],
          doors: [{ x: Math.floor(split / 2), y: building.height - 1, direction: 'south' }],
          windows: [{ x: 1, y: 0, direction: 'north' }]
        });
        
        rooms.push({
          id: 'bedroom',
          name: 'Bedroom',
          type: 'bedroom',
          x: split,
          y: 0,
          width: building.width - split,
          height: building.height,
          tiles: this.generateRoomTiles(split, 0, building.width - split, building.height),
          furniture: [],
          doors: [{ x: split, y: Math.floor(building.height / 2), direction: 'west' }],
          windows: [{ x: building.width - 1, y: 1, direction: 'east' }]
        });
      } else {
        const split = Math.floor(building.height * 0.6);
        rooms.push({
          id: 'main',
          name: 'Main Room',
          type: 'common',
          x: 0,
          y: 0,
          width: building.width,
          height: split,
          tiles: this.generateRoomTiles(0, 0, building.width, split),
          furniture: [],
          doors: [{ x: Math.floor(building.width / 2), y: split - 1, direction: 'south' }],
          windows: [{ x: 1, y: 0, direction: 'north' }]
        });
        
        rooms.push({
          id: 'bedroom',
          name: 'Bedroom',
          type: 'bedroom',
          x: 0,
          y: split,
          width: building.width,
          height: building.height - split,
          tiles: this.generateRoomTiles(0, split, building.width, building.height - split),
          furniture: [],
          doors: [{ x: Math.floor(building.width / 2), y: split, direction: 'north' }],
          windows: [{ x: building.width - 2, y: building.height - 1, direction: 'south' }]
        });
      }
    }
    
    return rooms;
  }

  private static generateLargeHouseLayout(
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    
    // Create a more complex layout with entrance, kitchen, common room, bedrooms
    const entranceHeight = Math.max(2, Math.floor(building.height * 0.2));
    const mainHeight = building.height - entranceHeight;
    const kitchenWidth = Math.max(3, Math.floor(building.width * 0.4));
    
    // Entrance hall
    rooms.push({
      id: 'entrance',
      name: 'Entrance',
      type: 'entrance',
      x: 0,
      y: building.height - entranceHeight,
      width: building.width,
      height: entranceHeight,
      tiles: this.generateRoomTiles(0, building.height - entranceHeight, building.width, entranceHeight),
      furniture: [],
      doors: [{ x: Math.floor(building.width / 2), y: building.height - 1, direction: 'south' }],
      windows: []
    });
    
    // Kitchen
    rooms.push({
      id: 'kitchen',
      name: 'Kitchen',
      type: 'kitchen',
      x: 0,
      y: 0,
      width: kitchenWidth,
      height: mainHeight,
      tiles: this.generateRoomTiles(0, 0, kitchenWidth, mainHeight),
      furniture: [],
      doors: [{ x: kitchenWidth, y: Math.floor(mainHeight / 2), direction: 'east' }],
      windows: [{ x: 1, y: 0, direction: 'north' }]
    });
    
    // Common room
    const commonWidth = building.width - kitchenWidth;
    const commonHeight = Math.floor(mainHeight * 0.6);
    rooms.push({
      id: 'common',
      name: 'Common Room',
      type: 'common',
      x: kitchenWidth,
      y: 0,
      width: commonWidth,
      height: commonHeight,
      tiles: this.generateRoomTiles(kitchenWidth, 0, commonWidth, commonHeight),
      furniture: [],
      doors: [
        { x: kitchenWidth, y: Math.floor(commonHeight / 2), direction: 'west' },
        { x: kitchenWidth + Math.floor(commonWidth / 2), y: commonHeight, direction: 'south' }
      ],
      windows: [{ x: building.width - 1, y: 1, direction: 'east' }]
    });
    
    // Bedroom
    const bedroomHeight = mainHeight - commonHeight;
    rooms.push({
      id: 'bedroom',
      name: 'Bedroom',
      type: 'bedroom',
      x: kitchenWidth,
      y: commonHeight,
      width: commonWidth,
      height: bedroomHeight,
      tiles: this.generateRoomTiles(kitchenWidth, commonHeight, commonWidth, bedroomHeight),
      furniture: [],
      doors: [{ x: kitchenWidth + Math.floor(commonWidth / 2), y: commonHeight, direction: 'north' }],
      windows: [{ x: building.width - 1, y: commonHeight + 1, direction: 'east' }]
    });
    
    return rooms;
  }

  private static generateTavernLayout(
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    // Main common room with bar area, kitchen, storage
    const rooms: Room[] = [];
    
    const barHeight = Math.max(2, Math.floor(building.height * 0.3));
    const mainHeight = building.height - barHeight;
    const kitchenWidth = Math.floor(building.width * 0.3);
    
    // Main tavern room
    rooms.push({
      id: 'tavern_main',
      name: 'Tavern Hall',
      type: 'common',
      x: 0,
      y: 0,
      width: building.width - kitchenWidth,
      height: mainHeight,
      tiles: this.generateRoomTiles(0, 0, building.width - kitchenWidth, mainHeight),
      furniture: [],
      doors: [{ x: Math.floor((building.width - kitchenWidth) / 2), y: mainHeight - 1, direction: 'south' }],
      windows: [
        { x: 1, y: 0, direction: 'north' },
        { x: building.width - kitchenWidth - 1, y: 1, direction: 'east' }
      ]
    });
    
    // Kitchen
    rooms.push({
      id: 'kitchen',
      name: 'Kitchen',
      type: 'kitchen',
      x: building.width - kitchenWidth,
      y: 0,
      width: kitchenWidth,
      height: mainHeight,
      tiles: this.generateRoomTiles(building.width - kitchenWidth, 0, kitchenWidth, mainHeight),
      furniture: [],
      doors: [{ x: building.width - kitchenWidth, y: Math.floor(mainHeight / 2), direction: 'west' }],
      windows: [{ x: building.width - 1, y: 1, direction: 'east' }]
    });
    
    // Storage/Bar area
    rooms.push({
      id: 'storage',
      name: 'Storage & Bar',
      type: 'storage',
      x: 0,
      y: mainHeight,
      width: building.width,
      height: barHeight,
      tiles: this.generateRoomTiles(0, mainHeight, building.width, barHeight),
      furniture: [],
      doors: [{ x: Math.floor(building.width / 2), y: building.height - 1, direction: 'south' }],
      windows: []
    });
    
    return rooms;
  }

  private static generateBlacksmithLayout(
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    
    // Main workshop takes most of the space
    const workshopHeight = Math.floor(building.height * 0.8);
    const storageHeight = building.height - workshopHeight;
    
    rooms.push({
      id: 'workshop',
      name: 'Smithy',
      type: 'workshop',
      x: 0,
      y: 0,
      width: building.width,
      height: workshopHeight,
      tiles: this.generateRoomTiles(0, 0, building.width, workshopHeight),
      furniture: [],
      doors: [{ x: Math.floor(building.width / 2), y: workshopHeight - 1, direction: 'south' }],
      windows: [
        { x: 1, y: 0, direction: 'north' },
        { x: building.width - 2, y: 0, direction: 'north' }
      ]
    });
    
    if (storageHeight > 1) {
      rooms.push({
        id: 'storage',
        name: 'Storage',
        type: 'storage',
        x: 0,
        y: workshopHeight,
        width: building.width,
        height: storageHeight,
        tiles: this.generateRoomTiles(0, workshopHeight, building.width, storageHeight),
        furniture: [],
        doors: [{ x: Math.floor(building.width / 2), y: building.height - 1, direction: 'south' }],
        windows: []
      });
    }
    
    return rooms;
  }

  private static generateShopLayout(
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    
    const shopHeight = Math.floor(building.height * 0.7);
    const storageHeight = building.height - shopHeight;
    
    rooms.push({
      id: 'shop',
      name: 'Shop Floor',
      type: 'shop',
      x: 0,
      y: 0,
      width: building.width,
      height: shopHeight,
      tiles: this.generateRoomTiles(0, 0, building.width, shopHeight),
      furniture: [],
      doors: [{ x: Math.floor(building.width / 2), y: shopHeight - 1, direction: 'south' }],
      windows: [
        { x: 1, y: 0, direction: 'north' },
        { x: building.width - 2, y: 0, direction: 'north' }
      ]
    });
    
    if (storageHeight > 1) {
      rooms.push({
        id: 'storage',
        name: 'Storage',
        type: 'storage',
        x: 0,
        y: shopHeight,
        width: building.width,
        height: storageHeight,
        tiles: this.generateRoomTiles(0, shopHeight, building.width, storageHeight),
        furniture: [],
        doors: [{ x: Math.floor(building.width / 2), y: building.height - 1, direction: 'south' }],
        windows: []
      });
    }
    
    return rooms;
  }

  private static generateMarketStallLayout(
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    // Market stalls are typically open-air or simple covered areas
    return [{
      id: 'stall',
      name: 'Market Stall',
      type: 'shop',
      x: 0,
      y: 0,
      width: building.width,
      height: building.height,
      tiles: this.generateRoomTiles(0, 0, building.width, building.height),
      furniture: [],
      doors: [{ x: Math.floor(building.width / 2), y: building.height - 1, direction: 'south' }],
      windows: []
    }];
  }

  private static generateRoomTiles(x: number, y: number, width: number, height: number): RoomTile[] {
    const tiles: RoomTile[] = [];
    
    for (let ty = y; ty < y + height; ty++) {
      for (let tx = x; tx < x + width; tx++) {
        const isEdge = tx === x || tx === x + width - 1 || ty === y || ty === y + height - 1;
        tiles.push({
          x: tx,
          y: ty,
          type: isEdge ? 'wall' : 'floor'
        });
      }
    }
    
    return tiles;
  }

  private static getRoomTemplates(buildingType: BuildingPlan['buildingType']) {
    // Define what rooms are appropriate for each building type
    const templates = {
      house_small: ['common', 'bedroom'],
      house_large: ['entrance', 'common', 'kitchen', 'bedroom', 'storage'],
      tavern: ['common', 'kitchen', 'storage', 'bedroom'],
      blacksmith: ['workshop', 'storage'],
      shop: ['shop', 'storage'],
      market_stall: ['shop']
    };
    
    return templates[buildingType] || ['common'];
  }

  private static furnishRoom(
    room: Room,
    socialClass: BuildingPlan['socialClass'],
    seed: number
  ): RoomFurniture[] {
    const furniture: RoomFurniture[] = [];
    
    // Convert room type to RoomFunction for the new placement system
    const roomFunction = this.mapRoomTypeToFunction(room.type);
    
    // Collect obstacles (doors, windows, fixtures)
    const obstacles: Array<{x: number, y: number, width: number, height: number}> = [];
    
    // Add doors as obstacles
    room.doors?.forEach(door => {
      obstacles.push({ x: door.x, y: door.y, width: 1, height: 1 });
    });
    
    // Add windows as obstacles
    room.windows?.forEach(window => {
      obstacles.push({ x: window.x, y: window.y, width: 1, height: 1 });
    });
    
    // Add fixtures as obstacles
    room.fixtures?.forEach(fixture => {
      obstacles.push({ x: fixture.x, y: fixture.y, width: fixture.width || 1, height: fixture.height || 1 });
    });

    // Use intelligent furniture placement system
    const placementResult = IntelligentFurniturePlacement.placeFurnitureIntelligently(
      roomFunction,
      room.x,
      room.y,
      room.width,
      room.height,
      socialClass,
      obstacles,
      seed
    );

    // Convert table-chair groups to furniture items
    placementResult.tableChairGroups.forEach(group => {
      // Add table
      const tableAsset = this.getFurnitureAsset('table', 'wood', seed);
      if (tableAsset) {
        furniture.push({
          id: group.tableId,
          asset: tableAsset,
          x: group.table.x,
          y: group.table.y,
          width: group.table.width,
          height: group.table.height,
          rotation: 0,
          purpose: group.table.type === 'dining' ? 'table' : 'work',
          furnitureType: `${group.table.type.charAt(0).toUpperCase() + group.table.type.slice(1)} Table`
        });
      }

      // Add chairs
      group.chairs.forEach(chair => {
        const chairAsset = this.getFurnitureAsset('seating', 'wood', seed + parseInt(chair.id.split('_')[1] || '0'));
        if (chairAsset) {
          furniture.push({
            id: chair.id,
            asset: chairAsset,
            x: chair.x,
            y: chair.y,
            width: 1,
            height: 1,
            rotation: chair.facing,
            purpose: 'seating',
            furnitureType: 'Chair'
          });
        }
      });
    });

    // Convert independent furniture to furniture items
    placementResult.independentFurniture.forEach(item => {
      const asset = this.getFurnitureAsset(item.type, 'wood', seed + parseInt(item.id.split('_')[1] || '0'));
      if (asset) {
        furniture.push({
          id: item.id,
          asset,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          rotation: item.rotation || 0,
          purpose: item.type,
          furnitureType: this.getFurnitureTypeName(item.type)
        });
      }
    });
    
    return furniture;
  }

  private static mapRoomTypeToFunction(roomType: string): any {
    const mapping: {[key: string]: string} = {
      'main': 'living',
      'bedroom': 'bedroom',
      'kitchen': 'kitchen',
      'common': 'common',
      'living': 'living',
      'dining': 'common',
      'entrance': 'common',
      'storage': 'storage',
      'workshop': 'workshop',
      'shop': 'shop_floor',
      'office': 'office'
    };
    
    return mapping[roomType] || 'common';
  }

  private static getFurnitureTypeName(category: string): string {
    const names: {[key: string]: string} = {
      'bed': 'Bed',
      'table': 'Table', 
      'seating': 'Chair',
      'storage': 'Chest',
      'work': 'Workbench',
      'cooking': 'Stove',
      'lighting': 'Candle'
    };
    
    return names[category] || 'Furniture';
  }

  private static getFurnitureSpecsForRoom(
    roomType: Room['type'],
    socialClass: BuildingPlan['socialClass']
  ) {
    const specs = {
      bedroom: [
        { category: 'bed', minWidth: 1, minHeight: 2, purpose: 'sleeping', material: 'wood' },
        { category: 'storage', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' },
        { category: 'lighting', minWidth: 1, minHeight: 1, purpose: 'lighting', material: 'any' }
      ],
      kitchen: [
        { category: 'cooking', minWidth: 1, minHeight: 1, purpose: 'cooking', material: 'any' },
        { category: 'table', minWidth: 2, minHeight: 1, purpose: 'work', material: 'wood' },
        { category: 'storage', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' },
        { category: 'lighting', minWidth: 1, minHeight: 1, purpose: 'lighting', material: 'any' }
      ],
      common: [
        { category: 'table', minWidth: 2, minHeight: 2, purpose: 'dining', material: 'wood' },
        { category: 'seating', minWidth: 1, minHeight: 1, purpose: 'seating', material: 'wood' },
        { category: 'seating', minWidth: 1, minHeight: 1, purpose: 'seating', material: 'wood' },
        { category: 'lighting', minWidth: 1, minHeight: 1, purpose: 'lighting', material: 'any' },
        { category: 'storage', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' }
      ],
      workshop: [
        { category: 'anvil', minWidth: 1, minHeight: 1, purpose: 'work', material: 'metal' },
        { category: 'forge', minWidth: 1, minHeight: 1, purpose: 'work', material: 'stone' },
        { category: 'workbench', minWidth: 2, minHeight: 1, purpose: 'work', material: 'wood' },
        { category: 'storage', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' },
        { category: 'lighting', minWidth: 1, minHeight: 1, purpose: 'lighting', material: 'any' }
      ],
      shop: [
        { category: 'counter', minWidth: 3, minHeight: 1, purpose: 'display', material: 'wood' },
        { category: 'display', minWidth: 1, minHeight: 1, purpose: 'display', material: 'wood' },
        { category: 'storage', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' },
        { category: 'lighting', minWidth: 1, minHeight: 1, purpose: 'lighting', material: 'any' }
      ],
      storage: [
        { category: 'storage', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' },
        { category: 'storage', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' },
        { category: 'barrel', minWidth: 1, minHeight: 1, purpose: 'storage', material: 'wood' }
      ],
      entrance: [
        { category: 'seating', minWidth: 2, minHeight: 1, purpose: 'seating', material: 'wood' },
        { category: 'lighting', minWidth: 1, minHeight: 1, purpose: 'lighting', material: 'any' }
      ]
    };
    
    return specs[roomType] || [];
  }

  private static getAvailableFurnitureSpaces(room: Room): Array<{ x: number; y: number; width: number; height: number }> {
    // Find rectangular spaces in the room that can hold furniture
    // For now, simple implementation - divide room into potential furniture zones
    const spaces: Array<{ x: number; y: number; width: number; height: number }> = [];
    
    // Get interior area (excluding walls)
    const interiorX = room.x + 1;
    const interiorY = room.y + 1;
    const interiorWidth = room.width - 2;
    const interiorHeight = room.height - 2;
    
    if (interiorWidth > 0 && interiorHeight > 0) {
      // Create potential furniture placement zones
      const zoneSize = 2; // 2x2 zones
      
      for (let y = interiorY; y < interiorY + interiorHeight; y += zoneSize) {
        for (let x = interiorX; x < interiorX + interiorWidth; x += zoneSize) {
          const zoneWidth = Math.min(zoneSize, interiorX + interiorWidth - x);
          const zoneHeight = Math.min(zoneSize, interiorY + interiorHeight - y);
          
          if (zoneWidth > 0 && zoneHeight > 0) {
            spaces.push({ x, y, width: zoneWidth, height: zoneHeight });
          }
        }
      }
    }
    
    return spaces;
  }

  private static getFurnitureAsset(category: string, material: string, seed: number): AssetInfo | null {
    // Map furniture categories to asset types
    const categoryMapping: Record<string, string> = {
      'bed': 'bed',
      'table': 'table',
      'seating': 'chair',
      'storage': 'chest',
      'lighting': 'candle',
      'cooking': 'stove',
      'workbench': 'table',
      'anvil': 'anvil',
      'forge': 'forge',
      'counter': 'table',
      'display': 'shelf',
      'barrel': 'barrel'
    };
    
    const assetType = categoryMapping[category] || 'decoration';
    
    // For now, return a placeholder asset
    // In full implementation, this would query AssetManager for appropriate furniture assets
    return {
      name: `${category}_placeholder`,
      path: `/assets/furniture/${category}.png`,
      type: 'decoration' as any,
      size: '1x1' as any,
      material: material as any,
      style: 'common' as any,
      category: 'functional' as any
    };
  }

  private static generateExteriorFeatures(
    buildingType: BuildingPlan['buildingType'],
    socialClass: BuildingPlan['socialClass'],
    lot: { width: number; height: number },
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): ExteriorFeature[] {
    const features: ExteriorFeature[] = [];
    
    // Define exterior areas around the building
    const exteriorAreas = [
      // Front area (south of building)
      { x: 0, y: building.y + building.height, width: lot.width, height: lot.height - (building.y + building.height) },
      // Back area (north of building)
      { x: 0, y: 0, width: lot.width, height: building.y },
      // Left side
      { x: 0, y: building.y, width: building.x, height: building.height },
      // Right side
      { x: building.x + building.width, y: building.y, width: lot.width - (building.x + building.width), height: building.height }
    ].filter(area => area.width > 0 && area.height > 0);
    
    let featureId = 0;
    let currentSeed = seed;
    
    // Add path to front door
    if (exteriorAreas[0] && exteriorAreas[0].height > 0) {
      features.push({
        id: `path_${featureId++}`,
        type: 'path',
        x: Math.floor(lot.width / 2) - 1,
        y: building.y + building.height,
        width: 2,
        height: exteriorAreas[0].height
      });
    }
    
    // Add features based on building type and social class
    const featureChances = this.getExteriorFeatureChances(buildingType, socialClass);
    
    for (const [featureType, chance] of Object.entries(featureChances)) {
      if (this.seedRandom(currentSeed) < chance) {
        const suitableArea = this.findSuitableExteriorArea(exteriorAreas, featureType);
        if (suitableArea) {
          const feature = this.createExteriorFeature(featureType, suitableArea, featureId++, currentSeed + 1);
          if (feature) {
            features.push(feature);
          }
        }
      }
      currentSeed += 5;
    }
    
    return features;
  }

  private static getExteriorFeatureChances(
    buildingType: BuildingPlan['buildingType'],
    socialClass: BuildingPlan['socialClass']
  ): Record<string, number> {
    const base = {
      garden: 0.3,
      well: 0.1,
      cart: 0.2,
      fence: 0.4,
      tree: 0.6,
      decoration: 0.3,
      storage: 0.2
    };
    
    const classMultiplier = {
      poor: 0.5,
      common: 1.0,
      wealthy: 1.5,
      noble: 2.0
    };
    
    const typeModifiers = {
      house_small: { garden: 1.0, well: 0.5, cart: 0.5 },
      house_large: { garden: 1.5, well: 1.0, decoration: 1.5 },
      tavern: { cart: 1.5, storage: 1.5, fence: 0.5 },
      blacksmith: { storage: 2.0, cart: 1.5, well: 1.5 },
      shop: { decoration: 1.5, storage: 1.0 },
      market_stall: { cart: 2.0, storage: 1.5, fence: 0.2 }
    };
    
    const multiplier = classMultiplier[socialClass];
    const modifiers = typeModifiers[buildingType] || {};
    
    const result: Record<string, number> = {};
    for (const [feature, chance] of Object.entries(base)) {
      const modifier = modifiers[feature as keyof typeof modifiers] || 1.0;
      result[feature] = Math.min(1.0, chance * multiplier * modifier);
    }
    
    return result;
  }

  private static findSuitableExteriorArea(
    areas: Array<{ x: number; y: number; width: number; height: number }>,
    featureType: string
  ): { x: number; y: number; width: number; height: number } | null {
    const minSizes: Record<string, { width: number; height: number }> = {
      garden: { width: 2, height: 2 },
      well: { width: 1, height: 1 },
      cart: { width: 2, height: 1 },
      fence: { width: 1, height: 1 },
      tree: { width: 1, height: 1 },
      decoration: { width: 1, height: 1 },
      storage: { width: 1, height: 1 }
    };
    
    const minSize = minSizes[featureType] || { width: 1, height: 1 };
    
    return areas.find(area => area.width >= minSize.width && area.height >= minSize.height) || null;
  }

  private static createExteriorFeature(
    featureType: string,
    area: { x: number; y: number; width: number; height: number },
    id: number,
    seed: number
  ): ExteriorFeature | null {
    const maxWidth = Math.min(area.width, 3);
    const maxHeight = Math.min(area.height, 3);
    
    const width = this.randomInRange(1, maxWidth, seed);
    const height = this.randomInRange(1, maxHeight, seed + 1);
    
    const x = area.x + this.randomInRange(0, area.width - width, seed + 2);
    const y = area.y + this.randomInRange(0, area.height - height, seed + 3);
    
    return {
      id: `exterior_${id}`,
      type: featureType as any,
      x,
      y,
      width,
      height
    };
  }
}