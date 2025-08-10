// Enhanced building material system with detailed properties
export interface Material {
  name: string;
  type: 'wall' | 'roof' | 'foundation' | 'floor' | 'door' | 'window';
  durability: number; // 1-100, affects building condition over time
  cost: number; // Relative cost multiplier
  availability: {
    temperate: number; // 0-1, availability in different climates
    cold: number;
    hot: number;
    wet: number;
    dry: number;
  };
  weatherResistance: {
    rain: number; // 0-1, resistance to weather damage
    snow: number;
    heat: number;
    wind: number;
  };
  socialClassAccess: {
    poor: boolean;
    common: boolean;
    wealthy: boolean;
    noble: boolean;
  };
  color: string; // Hex color for rendering
  texture?: string; // Path to texture asset
  properties: string[]; // Special properties like 'insulating', 'fireproof', 'magical'
}

export class MaterialLibrary {
  private static materials: { [key: string]: Material } = {
    // Wall Materials
    'wood_pine': {
      name: 'Pine Wood',
      type: 'wall',
      durability: 60,
      cost: 1.0,
      availability: { temperate: 0.9, cold: 0.8, hot: 0.3, wet: 0.7, dry: 0.4 },
      weatherResistance: { rain: 0.4, snow: 0.6, heat: 0.5, wind: 0.7 },
      socialClassAccess: { poor: true, common: true, wealthy: true, noble: false },
      color: '#DEB887',
      texture: 'textures/wood_light.jpg',
      properties: ['lightweight', 'combustible']
    },
    
    'wood_oak': {
      name: 'Oak Wood',
      type: 'wall',
      durability: 80,
      cost: 1.5,
      availability: { temperate: 0.8, cold: 0.6, hot: 0.2, wet: 0.6, dry: 0.3 },
      weatherResistance: { rain: 0.6, snow: 0.7, heat: 0.6, wind: 0.8 },
      socialClassAccess: { poor: false, common: true, wealthy: true, noble: true },
      color: '#8B4513',
      texture: 'textures/wood_dark.jpg',
      properties: ['sturdy', 'prestigious']
    },

    'stone_limestone': {
      name: 'Limestone',
      type: 'wall',
      durability: 90,
      cost: 2.0,
      availability: { temperate: 0.7, cold: 0.5, hot: 0.8, wet: 0.6, dry: 0.9 },
      weatherResistance: { rain: 0.8, snow: 0.9, heat: 0.7, wind: 0.9 },
      socialClassAccess: { poor: false, common: true, wealthy: true, noble: true },
      color: '#F5F5DC',
      texture: 'textures/stone_earthy.jpg',
      properties: ['fireproof', 'insulating']
    },

    'brick_fired': {
      name: 'Fired Brick',
      type: 'wall',
      durability: 85,
      cost: 1.8,
      availability: { temperate: 0.8, cold: 0.7, hot: 0.9, wet: 0.8, dry: 0.6 },
      weatherResistance: { rain: 0.9, snow: 0.8, heat: 0.9, wind: 0.8 },
      socialClassAccess: { poor: false, common: true, wealthy: true, noble: true },
      color: '#B22222',
      texture: 'textures/brick_floor.jpg',
      properties: ['fireproof', 'uniform']
    },

    'stone_marble': {
      name: 'Marble',
      type: 'wall',
      durability: 95,
      cost: 5.0,
      availability: { temperate: 0.3, cold: 0.2, hot: 0.4, wet: 0.3, dry: 0.5 },
      weatherResistance: { rain: 0.9, snow: 0.9, heat: 0.8, wind: 0.9 },
      socialClassAccess: { poor: false, common: false, wealthy: true, noble: true },
      color: '#F8F8FF',
      texture: 'textures/marble_white.jpg',
      properties: ['prestigious', 'expensive', 'beautiful']
    },

    // Roof Materials
    'thatch': {
      name: 'Thatch',
      type: 'roof',
      durability: 40,
      cost: 0.5,
      availability: { temperate: 0.9, cold: 0.7, hot: 0.6, wet: 0.8, dry: 0.5 },
      weatherResistance: { rain: 0.3, snow: 0.4, heat: 0.6, wind: 0.3 },
      socialClassAccess: { poor: true, common: true, wealthy: false, noble: false },
      color: '#DAA520',
      texture: 'textures/roof_hay.png',
      properties: ['insulating', 'combustible', 'renewable']
    },

    'wood_shingles': {
      name: 'Wood Shingles',
      type: 'roof',
      durability: 65,
      cost: 1.2,
      availability: { temperate: 0.8, cold: 0.9, hot: 0.4, wet: 0.7, dry: 0.5 },
      weatherResistance: { rain: 0.6, snow: 0.7, heat: 0.5, wind: 0.7 },
      socialClassAccess: { poor: false, common: true, wealthy: true, noble: false },
      color: '#8B4513',
      texture: 'textures/roof_wood_shingle.png',
      properties: ['traditional', 'combustible']
    },

    'slate_tiles': {
      name: 'Slate Tiles',
      type: 'roof',
      durability: 90,
      cost: 3.0,
      availability: { temperate: 0.6, cold: 0.8, hot: 0.4, wet: 0.5, dry: 0.3 },
      weatherResistance: { rain: 0.9, snow: 0.9, heat: 0.8, wind: 0.9 },
      socialClassAccess: { poor: false, common: false, wealthy: true, noble: true },
      color: '#2F4F4F',
      texture: 'textures/roof_slate.png',
      properties: ['fireproof', 'prestigious', 'heavy']
    },

    'clay_tiles': {
      name: 'Clay Tiles',
      type: 'roof',
      durability: 80,
      cost: 2.5,
      availability: { temperate: 0.7, cold: 0.4, hot: 0.9, wet: 0.8, dry: 0.8 },
      weatherResistance: { rain: 0.8, snow: 0.6, heat: 0.9, wind: 0.7 },
      socialClassAccess: { poor: false, common: true, wealthy: true, noble: true },
      color: '#CD853F',
      texture: 'textures/roof_tile_brown.png',
      properties: ['fireproof', 'heat_resistant']
    }
  };

  static getMaterial(name: string): Material | null {
    return this.materials[name] || null;
  }

  static getMaterialsByType(type: Material['type']): Material[] {
    return Object.values(this.materials).filter(m => m.type === type);
  }

  static getMaterialsForClass(socialClass: 'poor' | 'common' | 'wealthy' | 'noble'): Material[] {
    return Object.values(this.materials).filter(m => m.socialClassAccess[socialClass]);
  }

  static getMaterialsForClimate(climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry'): Material[] {
    return Object.values(this.materials).filter(m => m.availability[climate] > 0.5);
  }

  static getBestMaterialForConditions(
    type: Material['type'],
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry',
    budget: number = 1.0
  ): Material | null {
    const candidates = this.getMaterialsByType(type)
      .filter(m => m.socialClassAccess[socialClass])
      .filter(m => m.availability[climate] > 0.3)
      .filter(m => m.cost <= budget)
      .sort((a, b) => {
        // Score based on durability, weather resistance, and availability
        const scoreA = a.durability * a.availability[climate] * (1 / a.cost);
        const scoreB = b.durability * b.availability[climate] * (1 / b.cost);
        return scoreB - scoreA;
      });

    return candidates[0] || null;
  }

  static calculateBuildingDeteriorationRate(materials: { [key: string]: Material }, climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry'): number {
    const materialValues = Object.values(materials);
    if (materialValues.length === 0) return 0.1;

    const avgDurability = materialValues.reduce((sum, m) => sum + m.durability, 0) / materialValues.length;
    const avgWeatherResistance = materialValues.reduce((sum, m) => {
      switch (climate) {
        case 'cold': return sum + m.weatherResistance.snow;
        case 'hot': return sum + m.weatherResistance.heat;
        case 'wet': return sum + m.weatherResistance.rain;
        default: return sum + (m.weatherResistance.rain + m.weatherResistance.wind) / 2;
      }
    }, 0) / materialValues.length;

    // Lower rate = slower deterioration
    return Math.max(0.01, (100 - avgDurability) / 1000 * (1 - avgWeatherResistance));
  }

  static addCustomMaterial(name: string, material: Material): void {
    this.materials[name] = material;
  }

  static getAllMaterials(): { [key: string]: Material } {
    return { ...this.materials };
  }
}