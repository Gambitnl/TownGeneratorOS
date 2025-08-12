import { SocialClass } from './StandaloneBuildingGenerator';
import { RoomFunction } from './FloorMaterialSystem';

export interface FloorTileAsset {
  id: string;
  name: string;
  assetPath: string;
  material: FloorMaterial;
  pattern: string;
  socialClass: SocialClass[];
  roomTypes: RoomFunction[];
  cost: number;
  durability: number;
  weatherResistance: number;
  maintenance: 'low' | 'medium' | 'high';
  tileSize: number; // pixels, usually 70x70 for FA assets
}

export type FloorMaterial = 
  | 'wood_ashen' | 'wood_dark' | 'wood_light' | 'wood_red' | 'wood_walnut'
  | 'stone_cobblestone' | 'stone_square_cobblestone' | 'stone_diagonal'
  | 'brick_red' | 'brick_brown' | 'brick_weathered'
  | 'marble_black' | 'marble_white' | 'marble_green'
  | 'metal_grate' | 'cultivated_soil' | 'hay' | 'glass';

export interface FloorTileVariation {
  base: FloorTileAsset;
  overlays: string[]; // scratch marks, dirt, age effects
  condition: 'pristine' | 'good' | 'worn' | 'damaged' | 'broken';
}

export class EnhancedFloorTileSystem {
  private static floorAssetCatalog: Map<string, FloorTileAsset> = new Map();
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    await this.loadFloorAssets();
    this.initialized = true;
  }

  private static async loadFloorAssets() {
    // Wooden floors - 120 combinations (24 patterns × 5 wood types)
    const woodTypes: Array<{type: FloorMaterial, path: string}> = [
      { type: 'wood_ashen', path: 'Ashen' },
      { type: 'wood_dark', path: 'Dark' },
      { type: 'wood_light', path: 'Light' },
      { type: 'wood_red', path: 'Red' },
      { type: 'wood_walnut', path: 'Walnut' }
    ];

    const woodPatterns = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

    woodTypes.forEach(wood => {
      woodPatterns.forEach(pattern => {
        const asset: FloorTileAsset = {
          id: `wood_${wood.type}_${pattern}`,
          name: `${wood.path} Wood Planks (Pattern ${pattern})`,
          assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Wooden_Floors/Wooden_Flooring_${pattern}_${wood.path}.jpg`,
          material: wood.type,
          pattern: pattern,
          socialClass: this.getWoodSocialClasses(wood.type),
          roomTypes: ['bedroom', 'living', 'common', 'office', 'study', 'tavern_hall'],
          cost: this.getWoodCost(wood.type),
          durability: 75,
          weatherResistance: 40,
          maintenance: 'medium',
          tileSize: 70
        };
        
        this.floorAssetCatalog.set(asset.id, asset);
      });
    });

    // Stone floors
    const stoneAssets: FloorTileAsset[] = [
      // Cobblestone variations
      ...Array.from({length: 7}, (_, i) => ({
        id: `cobblestone_A_${String(i + 1).padStart(2, '0')}`,
        name: `Cobblestone (Variant A${i + 1})`,
        assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Stone_Floors/Cobblestone_A_${String(i + 1).padStart(2, '0')}.jpg`,
        material: 'stone_cobblestone' as FloorMaterial,
        pattern: `A${i + 1}`,
        socialClass: ['poor', 'common'],
        roomTypes: ['kitchen', 'storage', 'workshop', 'tavern_hall'],
        cost: 15,
        durability: 95,
        weatherResistance: 90,
        maintenance: 'low',
        tileSize: 70
      })),
      
      // Square cobblestone
      ...Array.from({length: 7}, (_, i) => ({
        id: `square_cobblestone_A_${String(i + 1).padStart(2, '0')}`,
        name: `Square Cobblestone (Variant A${i + 1})`,
        assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Stone_Floors/Square_Cobblestone_A_${String(i + 1).padStart(2, '0')}.jpg`,
        material: 'stone_square_cobblestone' as FloorMaterial,
        pattern: `A${i + 1}`,
        socialClass: ['common', 'wealthy'],
        roomTypes: ['kitchen', 'storage', 'office', 'workshop'],
        cost: 25,
        durability: 95,
        weatherResistance: 90,
        maintenance: 'low',
        tileSize: 70
      })),

      // Marble floors - premium
      {
        id: 'marble_black_tiles',
        name: 'Black Marble Tiles',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Stone_Floors/Marble_Tiles_A_Black.jpg',
        material: 'marble_black',
        pattern: 'A',
        socialClass: ['wealthy', 'noble'],
        roomTypes: ['bedroom', 'living', 'office', 'study'],
        cost: 120,
        durability: 98,
        weatherResistance: 95,
        maintenance: 'high',
        tileSize: 70
      },

      {
        id: 'marble_white_tiles',
        name: 'White Marble Tiles',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Stone_Floors/Marble_Tiles_A_White.jpg',
        material: 'marble_white',
        pattern: 'A',
        socialClass: ['wealthy', 'noble'],
        roomTypes: ['bedroom', 'living', 'office', 'study'],
        cost: 150,
        durability: 98,
        weatherResistance: 95,
        maintenance: 'high',
        tileSize: 70
      }
    ];

    stoneAssets.forEach(asset => {
      this.floorAssetCatalog.set(asset.id, asset);
    });

    // Brick floors
    Array.from({length: 5}, (_, i) => {
      const asset: FloorTileAsset = {
        id: `brick_floor_${String(i + 1).padStart(2, '0')}`,
        name: `Brick Floor (Pattern ${i + 1})`,
        assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Brick/Brick_Floor_${String(i + 1).padStart(2, '0')}.jpg`,
        material: 'brick_red',
        pattern: `${i + 1}`,
        socialClass: ['poor', 'common'],
        roomTypes: ['kitchen', 'workshop', 'storage'],
        cost: 20,
        durability: 85,
        weatherResistance: 80,
        maintenance: 'low',
        tileSize: 70
      };
      
      this.floorAssetCatalog.set(asset.id, asset);
    });

    // Specialty floors
    const specialtyAssets: FloorTileAsset[] = [
      {
        id: 'cultivated_soil',
        name: 'Cultivated Soil',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Stone_Floors/Cultivated_Soil.jpg',
        material: 'cultivated_soil',
        pattern: 'A',
        socialClass: ['poor'],
        roomTypes: ['storage'], // root cellars, etc.
        cost: 5,
        durability: 30,
        weatherResistance: 20,
        maintenance: 'high',
        tileSize: 70
      },
      
      {
        id: 'hay_floor',
        name: 'Hay Floor',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Textures/Stone_Floors/Hay.jpg',
        material: 'hay',
        pattern: 'A',
        socialClass: ['poor'],
        roomTypes: ['storage'], // stables, barns
        cost: 3,
        durability: 20,
        weatherResistance: 10,
        maintenance: 'high',
        tileSize: 70
      }
    ];

    specialtyAssets.forEach(asset => {
      this.floorAssetCatalog.set(asset.id, asset);
    });
  }

  static selectOptimalFloorTile(
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    climate: 'temperate' | 'hot' | 'cold' | 'wet' | 'dry',
    budget: number,
    seed: number
  ): FloorTileAsset | null {
    
    const availableAssets = Array.from(this.floorAssetCatalog.values()).filter(asset => {
      // Social class compatibility
      if (!asset.socialClass.includes(socialClass)) return false;
      
      // Room type compatibility
      if (!asset.roomTypes.includes(roomFunction)) return false;
      
      // Budget compatibility
      if (asset.cost > budget) return false;
      
      // Climate considerations
      if (climate === 'wet' && asset.weatherResistance < 70) return false;
      if (roomFunction === 'kitchen' && asset.material.includes('wood') && climate === 'hot') return false;
      
      return true;
    });

    if (availableAssets.length === 0) return null;

    // Score-based selection
    const scoredAssets = availableAssets.map(asset => ({
      asset,
      score: this.calculateFloorScore(asset, roomFunction, socialClass, climate, budget)
    }));

    scoredAssets.sort((a, b) => b.score - a.score);

    // Add some randomness among top choices
    const topAssets = scoredAssets.filter(scored => scored.score >= scoredAssets[0].score - 10);
    const randomIndex = Math.floor(this.seedRandom(seed) * topAssets.length);
    
    return topAssets[randomIndex].asset;
  }

  static createFloorVariation(
    baseAsset: FloorTileAsset,
    buildingAge: number, // 0-100
    trafficLevel: number, // 0-100
    maintenanceLevel: number, // 0-100
    seed: number
  ): FloorTileVariation {
    
    const overlays: string[] = [];
    let condition: FloorTileVariation['condition'] = 'pristine';

    // Determine condition based on factors
    const wearScore = (buildingAge * 0.4) + (trafficLevel * 0.4) + ((100 - maintenanceLevel) * 0.2);
    
    if (wearScore < 20) {
      condition = 'pristine';
    } else if (wearScore < 40) {
      condition = 'good';
    } else if (wearScore < 60) {
      condition = 'worn';
      overlays.push('light_wear');
    } else if (wearScore < 80) {
      condition = 'damaged';
      overlays.push('heavy_wear');
      if (baseAsset.material.includes('wood')) {
        overlays.push('scratch_overlay');
      }
    } else {
      condition = 'broken';
      overlays.push('heavy_wear', 'damage_overlay');
    }

    // Add dirt overlay based on maintenance and room type
    if (maintenanceLevel < 50 && this.seedRandom(seed) > 0.6) {
      overlays.push('dirt_overlay');
    }

    return {
      base: baseAsset,
      overlays,
      condition
    };
  }

  private static calculateFloorScore(
    asset: FloorTileAsset,
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    climate: string,
    budget: number
  ): number {
    let score = 50; // base score

    // Material appropriateness for room function
    if (roomFunction === 'kitchen') {
      if (asset.material.includes('stone') || asset.material.includes('brick')) score += 20;
      if (asset.material.includes('wood')) score -= 10; // wood not ideal for kitchens
    }
    
    if (roomFunction === 'bedroom' || roomFunction === 'living') {
      if (asset.material.includes('wood')) score += 15;
      if (asset.material.includes('marble')) score += 10;
    }

    if (roomFunction === 'workshop' || roomFunction === 'storage') {
      if (asset.material.includes('stone') || asset.material.includes('brick')) score += 15;
    }

    // Social class preference
    const socialClassIndex = ['poor', 'common', 'wealthy', 'noble'].indexOf(socialClass);
    if (asset.material.includes('marble') && socialClassIndex >= 2) score += 25;
    if (asset.material.includes('wood_walnut') && socialClassIndex >= 2) score += 15;
    if (asset.material.includes('wood_dark') && socialClassIndex >= 1) score += 10;

    // Climate considerations
    if (climate === 'wet' && asset.weatherResistance > 80) score += 15;
    if (climate === 'cold' && asset.material.includes('wood')) score += 10; // warmer feeling
    if (climate === 'hot' && asset.material.includes('stone')) score += 10; // cooler feeling

    // Budget efficiency
    const costEfficiency = budget > 0 ? Math.min(100, (budget / asset.cost) * 20) : 0;
    score += costEfficiency * 0.3;

    // Durability consideration
    score += asset.durability * 0.2;

    return score;
  }

  private static getWoodSocialClasses(woodType: FloorMaterial): SocialClass[] {
    switch (woodType) {
      case 'wood_ashen':
      case 'wood_light':
        return ['poor', 'common'];
      case 'wood_dark':
      case 'wood_red':
        return ['common', 'wealthy'];
      case 'wood_walnut':
        return ['wealthy', 'noble'];
      default:
        return ['common'];
    }
  }

  private static getWoodCost(woodType: FloorMaterial): number {
    switch (woodType) {
      case 'wood_ashen':
      case 'wood_light':
        return 25;
      case 'wood_dark':
      case 'wood_red':
        return 35;
      case 'wood_walnut':
        return 55;
      default:
        return 30;
    }
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  static getAllAvailableAssets(): FloorTileAsset[] {
    return Array.from(this.floorAssetCatalog.values());
  }

  static getAssetById(id: string): FloorTileAsset | null {
    return this.floorAssetCatalog.get(id) || null;
  }

  static getAssetsByMaterial(material: FloorMaterial): FloorTileAsset[] {
    return Array.from(this.floorAssetCatalog.values()).filter(asset => asset.material === material);
  }

  static getAssetsBySocialClass(socialClass: SocialClass): FloorTileAsset[] {
    return Array.from(this.floorAssetCatalog.values()).filter(asset => 
      asset.socialClass.includes(socialClass)
    );
  }

  static getAssetsForRoom(roomFunction: RoomFunction): FloorTileAsset[] {
    return Array.from(this.floorAssetCatalog.values()).filter(asset => 
      asset.roomTypes.includes(roomFunction)
    );
  }
}