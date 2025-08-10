// Advanced Furniture Placement System with Asset Integration
import { AssetInfo } from './AssetManager';

export interface FurnitureItem {
  id: string;
  name: string;
  category: 'seating' | 'storage' | 'lighting' | 'work' | 'decoration' | 'bed' | 'cooking' | 'religious' | 'magical';
  width: number; // in tiles (5-foot squares)
  height: number; // in tiles
  weight: number; // affects placement difficulty
  value: number; // relative value for social class
  durability: number; // 1-100
  condition: 'new' | 'good' | 'worn' | 'poor' | 'broken';
  material: string;
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  roomTypes: string[]; // Which room types can contain this furniture
  placement: {
    againstWall: boolean; // Must be placed against a wall
    cornerOnly: boolean; // Must be in corner
    centerAllowed: boolean; // Can be placed in room center
    requiresSpace: number; // Additional space needed around item
  };
  asset: {
    path: string; // Path to asset in Assets folder
    variations: string[]; // Different material/color variations
  };
  properties: string[]; // Special properties like 'heavy', 'fragile', 'valuable'
  interactions: string[]; // What NPCs/players can do with it
}

export interface FurnitureSet {
  name: string;
  theme: string; // 'medieval', 'wealthy', 'magical', 'rustic', etc.
  socialClass: 'poor' | 'common' | 'wealthy' | 'noble';
  items: FurnitureItem[];
  requiredItems: string[]; // Items that must be included
  optionalItems: string[]; // Items that may be included
  incompatibleItems: string[]; // Items that cannot be together
}

export class FurnitureLibrary {
  private static furniture: { [key: string]: FurnitureItem } = {
    // Beds - 2x2 tiles as specified for D&D
    'bed_simple': {
      id: 'bed_simple',
      name: 'Simple Bed',
      category: 'bed',
      width: 2,
      height: 2,
      weight: 50,
      value: 10,
      durability: 60,
      condition: 'good',
      material: 'wood',
      socialClass: ['poor', 'common'],
      roomTypes: ['bedroom', 'attic'],
      placement: { againstWall: true, cornerOnly: false, centerAllowed: false, requiresSpace: 1 },
      asset: { path: 'furniture/beds/bed_wood_simple', variations: ['light', 'dark', 'worn'] },
      properties: ['comfortable'],
      interactions: ['sleep', 'rest', 'hide_under']
    },

    'bed_noble': {
      id: 'bed_noble',
      name: 'Noble Canopy Bed',
      category: 'bed',
      width: 3,
      height: 2,
      weight: 150,
      value: 200,
      durability: 90,
      condition: 'good',
      material: 'fine_wood',
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['bedroom'],
      placement: { againstWall: false, cornerOnly: false, centerAllowed: true, requiresSpace: 2 },
      asset: { path: 'furniture/beds/bed_canopy', variations: ['red', 'blue', 'gold'] },
      properties: ['luxurious', 'prestigious', 'comfortable'],
      interactions: ['sleep', 'rest', 'entertain']
    },

    // Tables and Work Surfaces
    'table_dining': {
      id: 'table_dining',
      name: 'Dining Table',
      category: 'work',
      width: 2,
      height: 1,
      weight: 30,
      value: 15,
      durability: 70,
      condition: 'good',
      material: 'wood',
      socialClass: ['common', 'wealthy'],
      roomTypes: ['common', 'kitchen'],
      placement: { againstWall: false, cornerOnly: false, centerAllowed: true, requiresSpace: 1 },
      asset: { path: 'furniture/tables/table_dining', variations: ['oak', 'pine', 'mahogany'] },
      properties: ['functional'],
      interactions: ['eat', 'work', 'gather']
    },

    'workbench': {
      id: 'workbench',
      name: 'Artisan Workbench',
      category: 'work',
      width: 2,
      height: 1,
      weight: 80,
      value: 25,
      durability: 85,
      condition: 'good',
      material: 'hardwood',
      socialClass: ['common', 'wealthy'],
      roomTypes: ['workshop', 'laboratory'],
      placement: { againstWall: true, cornerOnly: false, centerAllowed: false, requiresSpace: 1 },
      asset: { path: 'furniture/workbenches/bench_artisan', variations: ['tools', 'clean', 'messy'] },
      properties: ['sturdy', 'functional'],
      interactions: ['craft', 'work', 'store_tools']
    },

    // Anvil for blacksmiths
    'anvil': {
      id: 'anvil',
      name: 'Blacksmith Anvil',
      category: 'work',
      width: 1,
      height: 1,
      weight: 200,
      value: 100,
      durability: 95,
      condition: 'good',
      material: 'iron',
      socialClass: ['common', 'wealthy'],
      roomTypes: ['workshop'],
      placement: { againstWall: false, cornerOnly: false, centerAllowed: true, requiresSpace: 2 },
      asset: { path: 'furniture/anvils/anvil_standard', variations: ['new', 'used', 'masterwork'] },
      properties: ['heavy', 'essential', 'loud'],
      interactions: ['smith', 'hammer', 'forge']
    },

    // Storage
    'chest_simple': {
      id: 'chest_simple',
      name: 'Simple Chest',
      category: 'storage',
      width: 1,
      height: 1,
      weight: 25,
      value: 8,
      durability: 65,
      condition: 'good',
      material: 'wood',
      socialClass: ['poor', 'common', 'wealthy'],
      roomTypes: ['bedroom', 'storage', 'common'],
      placement: { againstWall: true, cornerOnly: true, centerAllowed: false, requiresSpace: 0 },
      asset: { path: 'furniture/chests/chest_wood', variations: ['plain', 'iron_bound', 'carved'] },
      properties: ['lockable', 'portable'],
      interactions: ['store', 'retrieve', 'search', 'lock']
    },

    'wardrobe': {
      id: 'wardrobe',
      name: 'Wardrobe',
      category: 'storage',
      width: 1,
      height: 2,
      weight: 100,
      value: 40,
      durability: 80,
      condition: 'good',
      material: 'wood',
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['bedroom'],
      placement: { againstWall: true, cornerOnly: false, centerAllowed: false, requiresSpace: 1 },
      asset: { path: 'furniture/storage/wardrobe', variations: ['oak', 'mahogany', 'decorated'] },
      properties: ['large_storage', 'impressive'],
      interactions: ['store_clothes', 'organize', 'hide']
    },

    // Seating
    'chair_simple': {
      id: 'chair_simple',
      name: 'Simple Chair',
      category: 'seating',
      width: 1,
      height: 1,
      weight: 10,
      value: 3,
      durability: 50,
      condition: 'good',
      material: 'wood',
      socialClass: ['poor', 'common'],
      roomTypes: ['common', 'kitchen', 'study'],
      placement: { againstWall: false, cornerOnly: false, centerAllowed: true, requiresSpace: 0 },
      asset: { path: 'furniture/chairs/chair_simple', variations: ['worn', 'repaired', 'painted'] },
      properties: ['lightweight', 'basic'],
      interactions: ['sit', 'move', 'stack']
    },

    'throne': {
      id: 'throne',
      name: 'Ornate Throne',
      category: 'seating',
      width: 2,
      height: 2,
      weight: 300,
      value: 1000,
      durability: 95,
      condition: 'good',
      material: 'gold_wood',
      socialClass: ['noble'],
      roomTypes: ['common', 'study'],
      placement: { againstWall: true, cornerOnly: false, centerAllowed: false, requiresSpace: 3 },
      asset: { path: 'furniture/chairs/throne_ornate', variations: ['gold', 'silver', 'jeweled'] },
      properties: ['prestigious', 'heavy', 'intimidating'],
      interactions: ['rule', 'sit', 'display_power']
    },

    // Lighting
    'brazier': {
      id: 'brazier',
      name: 'Iron Brazier',
      category: 'lighting',
      width: 1,
      height: 1,
      weight: 50,
      value: 20,
      durability: 80,
      condition: 'good',
      material: 'iron',
      socialClass: ['common', 'wealthy', 'noble'],
      roomTypes: ['common', 'entrance', 'workshop'],
      placement: { againstWall: false, cornerOnly: true, centerAllowed: true, requiresSpace: 1 },
      asset: { path: 'furniture/lighting/brazier_iron', variations: ['lit', 'unlit', 'ornate'] },
      properties: ['fire_source', 'warm', 'smoky'],
      interactions: ['light', 'extinguish', 'warm_hands']
    },

    'chandelier': {
      id: 'chandelier',
      name: 'Crystal Chandelier',
      category: 'lighting',
      width: 2,
      height: 2,
      weight: 80,
      value: 500,
      durability: 60,
      condition: 'good',
      material: 'crystal',
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['common', 'study'],
      placement: { againstWall: false, cornerOnly: false, centerAllowed: true, requiresSpace: 0 },
      asset: { path: 'furniture/lighting/chandelier', variations: ['crystal', 'gold', 'silver'] },
      properties: ['hanging', 'fragile', 'beautiful', 'bright'],
      interactions: ['admire', 'light', 'clean']
    },

    // Religious Items
    'altar': {
      id: 'altar',
      name: 'Stone Altar',
      category: 'religious',
      width: 2,
      height: 1,
      weight: 500,
      value: 200,
      durability: 95,
      condition: 'good',
      material: 'stone',
      socialClass: ['common', 'wealthy', 'noble'],
      roomTypes: ['chapel'],
      placement: { againstWall: true, cornerOnly: false, centerAllowed: false, requiresSpace: 2 },
      asset: { path: 'furniture/altars/altar_stone', variations: ['earthy', 'marble', 'decorated'] },
      properties: ['sacred', 'heavy', 'immovable'],
      interactions: ['pray', 'worship', 'sacrifice', 'bless']
    },

    // Magical Items
    'scrying_bowl': {
      id: 'scrying_bowl',
      name: 'Scrying Bowl',
      category: 'magical',
      width: 1,
      height: 1,
      weight: 15,
      value: 300,
      durability: 70,
      condition: 'good',
      material: 'enchanted_crystal',
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['laboratory', 'study'],
      placement: { againstWall: false, cornerOnly: false, centerAllowed: true, requiresSpace: 1 },
      asset: { path: 'furniture/magical/scrying_bowl', variations: ['crystal', 'obsidian', 'silver'] },
      properties: ['magical', 'fragile', 'rare'],
      interactions: ['scry', 'divine', 'communicate']
    }
  };

  private static furnitureSets: { [key: string]: FurnitureSet } = {
    'poor_bedroom': {
      name: 'Poor Bedroom Set',
      theme: 'rustic',
      socialClass: 'poor',
      items: [],
      requiredItems: ['bed_simple', 'chest_simple'],
      optionalItems: ['chair_simple'],
      incompatibleItems: ['throne', 'chandelier', 'wardrobe']
    },
    
    'wealthy_bedroom': {
      name: 'Wealthy Bedroom Set',
      theme: 'luxurious',
      socialClass: 'wealthy',
      items: [],
      requiredItems: ['bed_noble', 'wardrobe', 'chair_simple'],
      optionalItems: ['chest_simple', 'chandelier'],
      incompatibleItems: ['bed_simple']
    },

    'blacksmith_workshop': {
      name: 'Blacksmith Workshop Set',
      theme: 'industrial',
      socialClass: 'common',
      items: [],
      requiredItems: ['anvil', 'workbench', 'brazier'],
      optionalItems: ['chest_simple', 'chair_simple'],
      incompatibleItems: ['bed_noble', 'chandelier', 'altar']
    }
  };

  static getFurniture(id: string): FurnitureItem | null {
    return this.furniture[id] || null;
  }

  static getFurnitureByCategory(category: FurnitureItem['category']): FurnitureItem[] {
    return Object.values(this.furniture).filter(item => item.category === category);
  }

  static getFurnitureForRoom(roomType: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble'): FurnitureItem[] {
    return Object.values(this.furniture).filter(item =>
      item.roomTypes.includes(roomType) &&
      item.socialClass.includes(socialClass)
    );
  }

  static getFurnitureSet(setName: string): FurnitureSet | null {
    return this.furnitureSets[setName] || null;
  }

  static canPlaceFurniture(
    item: FurnitureItem,
    x: number,
    y: number,
    roomWidth: number,
    roomHeight: number,
    existingFurniture: FurnitureItem[],
    walls: { north: boolean; south: boolean; east: boolean; west: boolean }
  ): boolean {
    // Check bounds
    if (x + item.width > roomWidth || y + item.height > roomHeight) {
      return false;
    }

    // Check wall requirements
    if (item.placement.againstWall) {
      const againstWall = (x === 0 && walls.west) ||
                         (x + item.width === roomWidth && walls.east) ||
                         (y === 0 && walls.north) ||
                         (y + item.height === roomHeight && walls.south);
      if (!againstWall) return false;
    }

    // Check corner requirements
    if (item.placement.cornerOnly) {
      const inCorner = (x === 0 || x + item.width === roomWidth) &&
                      (y === 0 || y + item.height === roomHeight);
      if (!inCorner) return false;
    }

    // Check space requirements
    const requiredSpace = item.placement.requiresSpace;
    for (let checkX = x - requiredSpace; checkX < x + item.width + requiredSpace; checkX++) {
      for (let checkY = y - requiredSpace; checkY < y + item.height + requiredSpace; checkY++) {
        if (checkX >= 0 && checkX < roomWidth && checkY >= 0 && checkY < roomHeight) {
          // Check collision with existing furniture
          // This would be implemented with the actual furniture positions
        }
      }
    }

    return true;
  }

  static generateFurnitureForRoom(
    roomType: string,
    roomWidth: number,
    roomHeight: number,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): FurnitureItem[] {
    const availableFurniture = this.getFurnitureForRoom(roomType, socialClass);
    const placedFurniture: FurnitureItem[] = [];

    // This would contain the actual placement algorithm
    // For now, return a basic set based on room type
    switch (roomType) {
      case 'bedroom':
        const bedType = socialClass === 'noble' ? 'bed_noble' : 'bed_simple';
        const bed = this.getFurniture(bedType);
        if (bed) placedFurniture.push(bed);
        break;
      case 'workshop':
        const anvil = this.getFurniture('anvil');
        if (anvil) placedFurniture.push(anvil);
        break;
    }

    return placedFurniture;
  }

  static addCustomFurniture(id: string, item: FurnitureItem): void {
    this.furniture[id] = item;
  }

  static getAllFurniture(): { [key: string]: FurnitureItem } {
    return { ...this.furniture };
  }
}