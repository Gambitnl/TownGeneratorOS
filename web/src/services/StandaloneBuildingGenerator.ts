import { BuildingPlan, Room, ExteriorFeature } from './ProceduralBuildingGenerator';

export type BuildingType = 'house_small' | 'house_large' | 'tavern' | 'blacksmith' | 'shop' | 'market_stall';
export type SocialClass = 'poor' | 'common' | 'wealthy' | 'noble';

export interface BuildingOptions {
  buildingType: BuildingType;
  socialClass: SocialClass;
  seed: number;
  lotSize?: {
    width: number;
    height: number;
  };
}

export class StandaloneBuildingGenerator {
  private static MIN_ROOM_SIZE = 4; // Minimum room size in tiles
  private static MAX_BUILDING_SIZE = 40; // Maximum building size in tiles

  static generateBuilding(options: BuildingOptions): BuildingPlan {
    const { buildingType, socialClass, seed, lotSize } = options;

    // Generate or use provided lot size
    const lot = lotSize || this.generateLotSize(buildingType, socialClass, seed);
    
    // Generate building footprint within lot
    const building = this.generateBuildingSize(buildingType, lot, seed + 1);
    
    // Choose building materials
    const materials = this.chooseMaterials(buildingType, socialClass, seed + 2);
    
    // Generate rooms
    const rooms = this.generateRoomLayout(buildingType, building, seed + 3);
    
    // Add furniture to rooms
    rooms.forEach((room, index) => {
      room.furniture = this.generateFurniture(room, socialClass, seed + 100 + index);
    });

    // Generate exterior features (gardens, wells, etc.)
    const exteriorFeatures = this.generateExteriorFeatures(buildingType, lot, building, seed + 4);

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
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): { width: number; height: number } {
    const baseSizes: Record<BuildingType, { min: number; max: number }> = {
      house_small: { min: 12, max: 18 },
      house_large: { min: 18, max: 28 },
      tavern: { min: 20, max: 35 },
      blacksmith: { min: 15, max: 25 },
      shop: { min: 14, max: 22 },
      market_stall: { min: 8, max: 14 }
    };

    const classMultiplier: Record<SocialClass, number> = {
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
    buildingType: BuildingType,
    lot: { width: number; height: number },
    seed: number
  ): { width: number; height: number; x: number; y: number } {
    // Building takes up 60-80% of lot space
    const coverage = this.seedRandom(seed) * 0.2 + 0.6;
    
    const maxWidth = Math.floor(lot.width * coverage);
    const maxHeight = Math.floor(lot.height * coverage);
    
    const width = Math.max(this.MIN_ROOM_SIZE * 2, Math.min(maxWidth, this.MAX_BUILDING_SIZE));
    const height = Math.max(this.MIN_ROOM_SIZE * 2, Math.min(maxHeight, this.MAX_BUILDING_SIZE));
    
    // Center building on lot with some random offset
    const offsetX = this.randomInRange(1, lot.width - width - 1, seed + 1);
    const offsetY = this.randomInRange(1, lot.height - height - 1, seed + 2);
    
    return { width, height, x: offsetX, y: offsetY };
  }

  private static chooseMaterials(
    buildingType: BuildingType,
    socialClass: SocialClass,
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
        roof: ['slate', 'tile', 'copper'],
        foundation: ['stone', 'marble', 'marble']
      }
    };

    const materials = materialsByClass[socialClass];
    const wallMaterial = this.randomFromArray(materials.wall, seed);
    const roofMaterial = this.randomFromArray(materials.roof, seed + 1);
    const foundationMaterial = this.randomFromArray(materials.foundation, seed + 2);

    return { wall: wallMaterial, roof: roofMaterial, foundation: foundationMaterial };
  }

  private static generateRoomLayout(
    buildingType: BuildingType,
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): Room[] {
    // This method would contain the room generation logic for each building type
    // Reuse the existing room generation code from ProceduralBuildingGenerator
    // but make it standalone without town/village dependencies
    return [];
  }

  private static generateFurniture(room: Room, socialClass: SocialClass, seed: number) {
    // This method would contain the furniture generation logic
    // Reuse the existing furniture generation code from ProceduralBuildingGenerator
    return [];
  }

  private static generateExteriorFeatures(
    buildingType: BuildingType,
    lot: { width: number; height: number },
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): ExteriorFeature[] {
    // This method would contain the exterior feature generation logic
    // Reuse the existing exterior feature generation code from ProceduralBuildingGenerator
    return [];
  }

  // Utility functions
  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private static randomInRange(min: number, max: number, seed: number): number {
    return Math.floor(this.seedRandom(seed) * (max - min + 1)) + min;
  }

  private static randomFromArray<T>(array: T[], seed: number): T {
    return array[Math.floor(this.seedRandom(seed) * array.length)];
  }
}
