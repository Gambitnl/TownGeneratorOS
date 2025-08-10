// Building Aesthetics System - 20 Methods for Visual Enhancement
export interface ArchitecturalStyle {
  id: string;
  name: string;
  description: string;
  era: 'ancient' | 'medieval' | 'renaissance' | 'fantasy' | 'modern';
  characteristics: {
    roofStyle: 'gabled' | 'hipped' | 'gambrel' | 'mansard' | 'flat' | 'conical';
    wallPattern: 'stone_block' | 'timber_frame' | 'brick' | 'stucco' | 'log' | 'adobe';
    windowStyle: 'arched' | 'rectangular' | 'diamond' | 'circular' | 'gothic' | 'bay';
    doorStyle: 'simple' | 'arched' | 'double' | 'reinforced' | 'ornate' | 'gothic';
    decorativeElements: string[];
    symmetry: 'perfect' | 'mostly_symmetric' | 'asymmetric' | 'organic';
  };
  colorPalettes: ColorPalette[];
  socialClasses: ('poor' | 'common' | 'wealthy' | 'noble')[];
  climateAdaptation: {
    cold: number;    // 0-1 suitability
    temperate: number;
    hot: number;
    wet: number;
    dry: number;
  };
}

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;      // Main building color (hex)
  secondary: string;    // Accent color
  trim: string;         // Window/door trim
  roof: string;         // Roof color
  foundation: string;   // Foundation/base color
  mood: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
}

export interface DecorativeElement {
  id: string;
  name: string;
  category: 'architectural' | 'ornamental' | 'functional' | 'symbolic';
  placement: 'roof' | 'wall' | 'window' | 'door' | 'corner' | 'entrance' | 'garden';
  size: 'small' | 'medium' | 'large' | 'massive';
  complexity: 'simple' | 'moderate' | 'ornate' | 'elaborate';
  materials: string[];
  cost: number;
  socialRequirement: 'any' | 'common+' | 'wealthy+' | 'noble';
  culturalOrigin?: string;
  symbolism?: string;
  gameplayEffect?: {
    intimidation: number;    // -5 to +5
    beauty: number;          // 0 to 10
    distinctiveness: number; // 0 to 10
    maintenance: number;     // Annual cost multiplier
  };
}

export interface WindowDesign {
  id: string;
  name: string;
  shape: 'rectangular' | 'arched' | 'circular' | 'diamond' | 'bay' | 'gothic' | 'rose';
  size: 'small' | 'medium' | 'large' | 'floor_to_ceiling';
  frameType: 'wood' | 'stone' | 'metal' | 'magical';
  glazingType: 'none' | 'oiled_paper' | 'glass_simple' | 'glass_colored' | 'glass_leaded' | 'magical';
  shutterStyle: 'none' | 'wood_simple' | 'wood_decorated' | 'metal' | 'magical';
  trimStyle: 'none' | 'simple' | 'molded' | 'carved' | 'gilded';
  lightTransmission: number; // 0-1
  cost: number;
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  weatherResistance: number; // 0-1
  securityRating: number; // 1-10
}

export interface RoofDesign {
  id: string;
  name: string;
  shape: 'gabled' | 'hipped' | 'gambrel' | 'mansard' | 'flat' | 'conical' | 'dome';
  material: 'thatch' | 'shingle' | 'tile' | 'slate' | 'metal' | 'magical';
  pitch: 'flat' | 'low' | 'medium' | 'steep';
  complexity: 'simple' | 'dormers' | 'multiple_gables' | 'towers' | 'elaborate';
  chimneyStyle: 'none' | 'simple' | 'ornate' | 'multiple' | 'magical';
  gutterSystem: boolean;
  weatherProofing: number; // 0-1
  insulation: number; // R-value
  cost: number;
  lifespan: number; // Years
  fireResistance: number; // 0-1
}

export interface FacadePattern {
  id: string;
  name: string;
  basePattern: 'uniform' | 'alternating' | 'geometric' | 'organic' | 'random';
  primaryMaterial: string;
  accentMaterial?: string;
  repetitionUnit: { width: number; height: number }; // In tiles
  complexity: number; // 1-10
  visualInterest: number; // 1-10
  costMultiplier: number; // 1.0 = base cost
  culturalStyle?: string;
  description: string;
}

export interface LandscapingFeature {
  id: string;
  name: string;
  category: 'garden' | 'pathway' | 'water' | 'structure' | 'plant' | 'decoration';
  size: { width: number; height: number }; // In tiles
  placement: 'front' | 'back' | 'side' | 'courtyard' | 'perimeter';
  seasonalVariation: {
    spring: { appearance: string; maintenance: number };
    summer: { appearance: string; maintenance: number };
    autumn: { appearance: string; maintenance: number };
    winter: { appearance: string; maintenance: number };
  };
  maintenanceCost: number; // Annual
  waterRequirement: number; // Daily gallons
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  climatePreference: string[];
  benefits: {
    beauty: number; // 0-10
    property_value: number; // Percentage increase
    comfort: number; // 0-5
    functionality: string[]; // Practical uses
  };
}

export interface AgeingEffect {
  id: string;
  name: string;
  description: string;
  ageThreshold: number; // Years
  affectedMaterials: string[];
  visualChanges: {
    colorShift: string; // Hex color change
    textureChange: string; // New texture description
    structuralChange: string; // Sagging, cracks, etc.
  };
  maintenanceCost: number; // Cost to repair/prevent
  stabilityImpact: number; // -1 to 0 (negative = weakness)
}

export interface ProportionalRules {
  name: string;
  description: string;
  heightToWidthRatio: { min: number; max: number };
  windowToWallRatio: { min: number; max: number };
  doorHeight: number; // Percentage of wall height
  roofProportion: number; // Roof height as percentage of wall height
  chimneyProportion: number; // Chimney height as percentage of roof height
  balancePoints: { x: number; y: number }[]; // Visual balance focal points
}

export interface SeasonalAdaptation {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  adaptations: {
    plantlife: string[];
    decorations: string[];
    lighting: { intensity: number; color: string };
    maintenance: string[];
    colorAdjustments: { [material: string]: string };
    temporaryFeatures: DecorativeElement[];
  };
}

export interface BuildingAesthetics {
  buildingId: string;
  architecturalStyle: ArchitecturalStyle;
  colorPalette: ColorPalette;
  decorativeElements: {
    element: DecorativeElement;
    position: { x: number; y: number; floor: number };
    rotation: number; // 0-360 degrees
    scale: number; // 0.5-2.0 scale multiplier
  }[];
  windowDesigns: { [floor: number]: WindowDesign[] };
  roofDesign: RoofDesign;
  facadePattern: FacadePattern;
  landscaping: {
    feature: LandscapingFeature;
    position: { x: number; y: number };
    maturity: number; // 0-1, how developed the feature is
  }[];
  ageingEffects: AgeingEffect[];
  proportionalAnalysis: {
    goldenRatioCompliance: number; // 0-1
    visualBalance: number; // 0-1
    symmetryScore: number; // 0-1
    overallHarmony: number; // 0-1
  };
  seasonalAdaptations: { [season: string]: SeasonalAdaptation };
  uniqueFeatures: {
    name: string;
    description: string;
    position: { x: number; y: number; floor?: number };
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    gameplayValue: string;
  }[];
  lighting: {
    exterior: {
      source: string;
      position: { x: number; y: number };
      intensity: number;
      color: string;
      castsShadows: boolean;
    }[];
    interior: {
      roomId: string;
      ambientColor: string;
      moodLighting: boolean;
      naturalLight: number; // 0-1 from windows
    }[];
  };
  overallAestheticRating: {
    beauty: number;        // 1-100
    distinctiveness: number; // 1-100
    authenticity: number;    // 1-100
    craftsmanship: number;  // 1-100
    harmony: number;        // 1-100
  };
}

export class AestheticsSystem {
  private static architecturalStyles: { [key: string]: ArchitecturalStyle } = {
    'medieval_vernacular': {
      id: 'medieval_vernacular',
      name: 'Medieval Vernacular',
      description: 'Traditional medieval building style using local materials',
      era: 'medieval',
      characteristics: {
        roofStyle: 'gabled',
        wallPattern: 'timber_frame',
        windowStyle: 'rectangular',
        doorStyle: 'simple',
        decorativeElements: ['carved_beams', 'iron_hinges', 'thatched_details'],
        symmetry: 'mostly_symmetric'
      },
      colorPalettes: [], // Will be populated
      socialClasses: ['poor', 'common'],
      climateAdaptation: { cold: 0.8, temperate: 1.0, hot: 0.6, wet: 0.9, dry: 0.7 }
    },

    'gothic_revival': {
      id: 'gothic_revival',
      name: 'Gothic Revival',
      description: 'Pointed arches, ribbed vaults, and flying buttresses',
      era: 'medieval',
      characteristics: {
        roofStyle: 'gabled',
        wallPattern: 'stone_block',
        windowStyle: 'gothic',
        doorStyle: 'gothic',
        decorativeElements: ['pointed_arches', 'gargoyles', 'rose_windows', 'flying_buttresses'],
        symmetry: 'perfect'
      },
      colorPalettes: [],
      socialClasses: ['wealthy', 'noble'],
      climateAdaptation: { cold: 0.9, temperate: 0.8, hot: 0.5, wet: 0.7, dry: 0.8 }
    },

    'fantasy_organic': {
      id: 'fantasy_organic',
      name: 'Organic Fantasy',
      description: 'Buildings that grow with nature, curved lines and living materials',
      era: 'fantasy',
      characteristics: {
        roofStyle: 'conical',
        wallPattern: 'log',
        windowStyle: 'circular',
        doorStyle: 'arched',
        decorativeElements: ['living_wood', 'crystal_accents', 'vine_growth', 'mushroom_features'],
        symmetry: 'organic'
      },
      colorPalettes: [],
      socialClasses: ['common', 'wealthy'],
      climateAdaptation: { cold: 0.6, temperate: 0.9, hot: 0.7, wet: 1.0, dry: 0.4 }
    },

    'dwarven_fortress': {
      id: 'dwarven_fortress',
      name: 'Dwarven Fortress Style',
      description: 'Heavy stone construction with geometric patterns and metalwork',
      era: 'fantasy',
      characteristics: {
        roofStyle: 'flat',
        wallPattern: 'stone_block',
        windowStyle: 'rectangular',
        doorStyle: 'reinforced',
        decorativeElements: ['geometric_stonework', 'metal_reinforcement', 'carved_runes', 'corner_towers'],
        symmetry: 'perfect'
      },
      colorPalettes: [],
      socialClasses: ['common', 'wealthy', 'noble'],
      climateAdaptation: { cold: 1.0, temperate: 0.8, hot: 0.9, wet: 0.6, dry: 0.9 }
    },

    'elven_spire': {
      id: 'elven_spire',
      name: 'Elven Spire Architecture',
      description: 'Tall, graceful buildings with flowing lines and natural integration',
      era: 'fantasy',
      characteristics: {
        roofStyle: 'conical',
        wallPattern: 'stucco',
        windowStyle: 'arched',
        doorStyle: 'ornate',
        decorativeElements: ['flowing_lines', 'nature_motifs', 'crystal_inlays', 'spiral_features'],
        symmetry: 'asymmetric'
      },
      colorPalettes: [],
      socialClasses: ['wealthy', 'noble'],
      climateAdaptation: { cold: 0.5, temperate: 1.0, hot: 0.8, wet: 0.7, dry: 0.6 }
    }
  };

  private static colorPalettes: { [key: string]: ColorPalette } = {
    'earth_tones': {
      id: 'earth_tones',
      name: 'Warm Earth Tones',
      primary: '#8B4513',     // Saddle Brown
      secondary: '#D2B48C',   // Tan  
      trim: '#654321',        // Dark Brown
      roof: '#2F4F4F',        // Dark Slate Gray
      foundation: '#696969',   // Dim Gray
      mood: 'warm',
      season: 'all'
    },

    'stone_castle': {
      id: 'stone_castle',
      name: 'Castle Stone Gray',
      primary: '#708090',     // Slate Gray
      secondary: '#B0C4DE',   // Light Steel Blue
      trim: '#2F4F4F',        // Dark Slate Gray
      roof: '#1C1C1C',        // Almost Black
      foundation: '#36454F',   // Charcoal
      mood: 'cool',
      season: 'all'
    },

    'forest_dwelling': {
      id: 'forest_dwelling',
      name: 'Forest Greens',
      primary: '#228B22',     // Forest Green
      secondary: '#32CD32',   // Lime Green
      trim: '#8B4513',        // Saddle Brown
      roof: '#654321',        // Dark Brown
      foundation: '#2F4F2F',   // Dark Olive Green
      mood: 'neutral',
      season: 'spring'
    },

    'noble_luxury': {
      id: 'noble_luxury',
      name: 'Noble Luxury',
      primary: '#800020',     // Burgundy
      secondary: '#FFD700',   // Gold
      trim: '#B8860B',        // Dark Goldenrod
      roof: '#8B0000',        // Dark Red
      foundation: '#2F2F2F',   // Dark Gray
      mood: 'vibrant',
      season: 'all'
    },

    'desert_adobe': {
      id: 'desert_adobe',
      name: 'Desert Adobe',
      primary: '#DEB887',     // Burlywood
      secondary: '#F4A460',   // Sandy Brown
      trim: '#A0522D',        // Sienna
      roof: '#8B4513',        // Saddle Brown
      foundation: '#CD853F',   // Peru
      mood: 'warm',
      season: 'summer'
    }
  };

  private static decorativeElements: { [key: string]: DecorativeElement } = {
    'carved_door_frame': {
      id: 'carved_door_frame',
      name: 'Intricately Carved Door Frame',
      category: 'architectural',
      placement: 'door',
      size: 'medium',
      complexity: 'ornate',
      materials: ['oak_wood', 'stone'],
      cost: 25,
      socialRequirement: 'wealthy+',
      symbolism: 'Status and craftsmanship',
      gameplayEffect: { intimidation: 1, beauty: 6, distinctiveness: 7, maintenance: 1.2 }
    },

    'gargoyle_waterspout': {
      id: 'gargoyle_waterspout',
      name: 'Gargoyle Water Spout',
      category: 'functional',
      placement: 'roof',
      size: 'medium',
      complexity: 'elaborate',
      materials: ['stone', 'lead_pipe'],
      cost: 40,
      socialRequirement: 'wealthy+',
      culturalOrigin: 'Gothic',
      symbolism: 'Protection from evil spirits',
      gameplayEffect: { intimidation: 4, beauty: 3, distinctiveness: 9, maintenance: 1.5 }
    },

    'flower_window_boxes': {
      id: 'flower_window_boxes',
      name: 'Decorative Window Flower Boxes',
      category: 'ornamental',
      placement: 'window',
      size: 'small',
      complexity: 'simple',
      materials: ['wood', 'iron'],
      cost: 5,
      socialRequirement: 'common+',
      gameplayEffect: { intimidation: -1, beauty: 5, distinctiveness: 4, maintenance: 1.3 }
    },

    'iron_weather_vane': {
      id: 'iron_weather_vane',
      name: 'Wrought Iron Weather Vane',
      category: 'functional',
      placement: 'roof',
      size: 'medium',
      complexity: 'moderate',
      materials: ['wrought_iron'],
      cost: 15,
      socialRequirement: 'common+',
      gameplayEffect: { intimidation: 0, beauty: 4, distinctiveness: 6, maintenance: 1.1 }
    },

    'corner_quoins': {
      id: 'corner_quoins',
      name: 'Decorative Corner Quoins',
      category: 'architectural',
      placement: 'corner',
      size: 'medium',
      complexity: 'moderate',
      materials: ['dressed_stone'],
      cost: 30,
      socialRequirement: 'wealthy+',
      gameplayEffect: { intimidation: 1, beauty: 5, distinctiveness: 5, maintenance: 1.0 }
    },

    'hanging_sign': {
      id: 'hanging_sign',
      name: 'Painted Hanging Sign',
      category: 'functional',
      placement: 'entrance',
      size: 'medium',
      complexity: 'moderate',
      materials: ['wood', 'paint', 'iron_chain'],
      cost: 12,
      socialRequirement: 'any',
      gameplayEffect: { intimidation: 0, beauty: 3, distinctiveness: 8, maintenance: 1.4 }
    }
  };

  private static windowDesigns: { [key: string]: WindowDesign } = {
    'simple_shuttered': {
      id: 'simple_shuttered',
      name: 'Simple Shuttered Window',
      shape: 'rectangular',
      size: 'medium',
      frameType: 'wood',
      glazingType: 'oiled_paper',
      shutterStyle: 'wood_simple',
      trimStyle: 'simple',
      lightTransmission: 0.4,
      cost: 8,
      socialClass: ['poor', 'common'],
      weatherResistance: 0.6,
      securityRating: 4
    },

    'leaded_glass': {
      id: 'leaded_glass',
      name: 'Leaded Glass Window',
      shape: 'arched',
      size: 'large',
      frameType: 'stone',
      glazingType: 'glass_leaded',
      shutterStyle: 'wood_decorated',
      trimStyle: 'carved',
      lightTransmission: 0.8,
      cost: 35,
      socialClass: ['wealthy', 'noble'],
      weatherResistance: 0.9,
      securityRating: 6
    },

    'bay_window': {
      id: 'bay_window',
      name: 'Decorative Bay Window',
      shape: 'bay',
      size: 'large',
      frameType: 'wood',
      glazingType: 'glass_simple',
      shutterStyle: 'wood_decorated',
      trimStyle: 'molded',
      lightTransmission: 0.9,
      cost: 50,
      socialClass: ['wealthy', 'noble'],
      weatherResistance: 0.7,
      securityRating: 3
    },

    'gothic_rose': {
      id: 'gothic_rose',
      name: 'Gothic Rose Window',
      shape: 'rose',
      size: 'large',
      frameType: 'stone',
      glazingType: 'glass_colored',
      shutterStyle: 'none',
      trimStyle: 'carved',
      lightTransmission: 0.7,
      cost: 80,
      socialClass: ['noble'],
      weatherResistance: 0.95,
      securityRating: 8
    }
  };

  private static landscapingFeatures: { [key: string]: LandscapingFeature } = {
    'herb_garden': {
      id: 'herb_garden',
      name: 'Kitchen Herb Garden',
      category: 'garden',
      size: { width: 3, height: 2 },
      placement: 'back',
      seasonalVariation: {
        spring: { appearance: 'Fresh green shoots emerging', maintenance: 3 },
        summer: { appearance: 'Lush, aromatic herbs in full bloom', maintenance: 5 },
        autumn: { appearance: 'Herbs ready for harvest, some browning', maintenance: 2 },
        winter: { appearance: 'Dormant beds with some evergreen herbs', maintenance: 1 }
      },
      maintenanceCost: 8,
      waterRequirement: 2,
      socialClass: ['poor', 'common', 'wealthy', 'noble'],
      climatePreference: ['temperate', 'wet'],
      benefits: {
        beauty: 4,
        property_value: 5,
        comfort: 2,
        functionality: ['cooking ingredients', 'medicinal herbs', 'aromatic']
      }
    },

    'ornamental_fountain': {
      id: 'ornamental_fountain',
      name: 'Ornamental Water Fountain',
      category: 'water',
      size: { width: 2, height: 2 },
      placement: 'courtyard',
      seasonalVariation: {
        spring: { appearance: 'Crystal clear water with spring flowers around base', maintenance: 4 },
        summer: { appearance: 'Cooling fountain with surrounding greenery', maintenance: 6 },
        autumn: { appearance: 'Fountain with fallen leaves, needs cleaning', maintenance: 3 },
        winter: { appearance: 'Covered or drained to prevent freezing', maintenance: 2 }
      },
      maintenanceCost: 25,
      waterRequirement: 15,
      socialClass: ['wealthy', 'noble'],
      climatePreference: ['temperate', 'hot'],
      benefits: {
        beauty: 8,
        property_value: 15,
        comfort: 4,
        functionality: ['status symbol', 'cooling effect', 'gathering place']
      }
    },

    'cobblestone_path': {
      id: 'cobblestone_path',
      name: 'Cobblestone Walkway',
      category: 'pathway',
      size: { width: 1, height: 8 },
      placement: 'front',
      seasonalVariation: {
        spring: { appearance: 'Clean stones with moss growth in cracks', maintenance: 2 },
        summer: { appearance: 'Warm stones, well-defined path', maintenance: 1 },
        autumn: { appearance: 'Covered with colorful fallen leaves', maintenance: 3 },
        winter: { appearance: 'Ice and snow covered, may be slippery', maintenance: 2 }
      },
      maintenanceCost: 5,
      waterRequirement: 0,
      socialClass: ['common', 'wealthy', 'noble'],
      climatePreference: ['temperate', 'cold', 'wet'],
      benefits: {
        beauty: 3,
        property_value: 8,
        comfort: 3,
        functionality: ['clean entrance', 'defines approach', 'all-weather access']
      }
    }
  };

  static generateBuildingAesthetics(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    age: number,
    condition: 'new' | 'good' | 'worn' | 'poor' | 'ruins',
    climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry',
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    culturalInfluence: string,
    rooms: any[],
    seed: number
  ): BuildingAesthetics {
    
    const style = this.selectArchitecturalStyle(buildingType, socialClass, climate, culturalInfluence, seed);
    const palette = this.selectColorPalette(style, season, socialClass, seed);
    const decorations = this.generateDecorativeElements(style, socialClass, buildingType, seed);
    const windows = this.designWindows(style, socialClass, rooms, seed);
    const roof = this.designRoof(style, socialClass, climate, seed);
    const facade = this.generateFacadePattern(style, socialClass, seed);
    const landscaping = this.generateLandscaping(socialClass, climate, season, seed);
    const aging = this.applyAgeingEffects(age, condition, climate, seed);
    const proportions = this.analyzeProportions(rooms, decorations, seed);
    const seasonal = this.generateSeasonalAdaptations(climate, seed);
    const unique = this.generateUniqueFeatures(buildingType, socialClass, seed);
    const lighting = this.designLighting(rooms, style, socialClass, season, seed);
    const rating = this.calculateAestheticRating(style, decorations, proportions, condition);

    return {
      buildingId,
      architecturalStyle: style,
      colorPalette: palette,
      decorativeElements: decorations,
      windowDesigns: windows,
      roofDesign: roof,
      facadePattern: facade,
      landscaping,
      ageingEffects: aging,
      proportionalAnalysis: proportions,
      seasonalAdaptations: seasonal,
      uniqueFeatures: unique,
      lighting,
      overallAestheticRating: rating
    };
  }

  // Method 1: Architectural Style Selection
  private static selectArchitecturalStyle(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    climate: string,
    culturalInfluence: string,
    seed: number
  ): ArchitecturalStyle {
    const suitableStyles = Object.values(this.architecturalStyles).filter(style =>
      style.socialClasses.includes(socialClass) &&
      style.climateAdaptation[climate] >= 0.6
    );

    // Cultural influence selection
    let preferred: ArchitecturalStyle | null = null;
    if (culturalInfluence === 'dwarven') preferred = this.architecturalStyles['dwarven_fortress'];
    else if (culturalInfluence === 'elven') preferred = this.architecturalStyles['elven_spire'];
    else if (culturalInfluence === 'human' && socialClass === 'noble') preferred = this.architecturalStyles['gothic_revival'];

    if (preferred && preferred.socialClasses.includes(socialClass)) {
      return preferred;
    }

    // Fallback to suitable styles
    if (suitableStyles.length > 0) {
      return suitableStyles[Math.floor(this.seedRandom(seed) * suitableStyles.length)];
    }

    return this.architecturalStyles['medieval_vernacular'];
  }

  // Method 2: Color Palette Generation
  private static selectColorPalette(
    style: ArchitecturalStyle,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): ColorPalette {
    let suitable = Object.values(this.colorPalettes).filter(p => 
      p.season === season || p.season === 'all'
    );

    // Social class influences palette choice
    if (socialClass === 'poor') {
      suitable = suitable.filter(p => p.mood !== 'vibrant');
    } else if (socialClass === 'noble') {
      suitable = suitable.filter(p => p.mood === 'vibrant' || p.id === 'noble_luxury');
    }

    if (suitable.length === 0) suitable = Object.values(this.colorPalettes);
    
    return suitable[Math.floor(this.seedRandom(seed) * suitable.length)];
  }

  // Method 3: Decorative Element Placement
  private static generateDecorativeElements(
    style: ArchitecturalStyle,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    buildingType: string,
    seed: number
  ): BuildingAesthetics['decorativeElements'] {
    const elements: BuildingAesthetics['decorativeElements'] = [];
    const available = Object.values(this.decorativeElements).filter(el => {
      const meetsRequirement = el.socialRequirement === 'any' ||
        (el.socialRequirement === 'common+' && socialClass !== 'poor') ||
        (el.socialRequirement === 'wealthy+' && (socialClass === 'wealthy' || socialClass === 'noble')) ||
        (el.socialRequirement === 'noble' && socialClass === 'noble');
      return meetsRequirement;
    });

    const elementCount = { poor: 1, common: 2, wealthy: 4, noble: 6 }[socialClass];
    
    for (let i = 0; i < elementCount && i < available.length; i++) {
      const element = available[Math.floor(this.seedRandom(seed + i) * available.length)];
      elements.push({
        element,
        position: {
          x: Math.floor(this.seedRandom(seed + i + 100) * 8),
          y: Math.floor(this.seedRandom(seed + i + 200) * 8),
          floor: Math.floor(this.seedRandom(seed + i + 300) * 2)
        },
        rotation: this.seedRandom(seed + i + 400) * 360,
        scale: 0.8 + this.seedRandom(seed + i + 500) * 0.4
      });
    }

    return elements;
  }

  // Method 4: Window Design Variation
  private static designWindows(
    style: ArchitecturalStyle,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    seed: number
  ): { [floor: number]: WindowDesign[] } {
    const windowsByFloor: { [floor: number]: WindowDesign[] } = {};
    const available = Object.values(this.windowDesigns).filter(w => 
      w.socialClass.includes(socialClass)
    );

    rooms.forEach((room, index) => {
      const floor = room.floor || 0;
      if (!windowsByFloor[floor]) windowsByFloor[floor] = [];

      // Exterior rooms get windows
      if (['common', 'bedroom', 'study', 'kitchen'].includes(room.type)) {
        let windowDesign: WindowDesign;
        
        if (socialClass === 'noble' && room.type === 'common') {
          windowDesign = this.windowDesigns['gothic_rose'] || available[0];
        } else if (socialClass === 'wealthy') {
          windowDesign = this.windowDesigns['bay_window'] || available[0];
        } else {
          windowDesign = available[Math.floor(this.seedRandom(seed + index) * available.length)];
        }

        windowsByFloor[floor].push(windowDesign);
      }
    });

    return windowsByFloor;
  }

  // Method 5: Advanced Roof Design
  private static designRoof(
    style: ArchitecturalStyle,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    climate: string,
    seed: number
  ): RoofDesign {
    const materials = {
      poor: 'thatch',
      common: 'shingle',
      wealthy: 'tile',
      noble: 'slate'
    };

    const complexities = {
      poor: 'simple',
      common: 'simple',
      wealthy: 'dormers',
      noble: 'elaborate'
    };

    return {
      id: `roof_${socialClass}_${style.characteristics.roofStyle}`,
      name: `${socialClass.charAt(0).toUpperCase() + socialClass.slice(1)} ${style.characteristics.roofStyle} Roof`,
      shape: style.characteristics.roofStyle,
      material: materials[socialClass] as RoofDesign['material'],
      pitch: climate === 'hot' ? 'low' : 'steep',
      complexity: complexities[socialClass] as RoofDesign['complexity'],
      chimneyStyle: socialClass === 'poor' ? 'none' : socialClass === 'noble' ? 'ornate' : 'simple',
      gutterSystem: socialClass !== 'poor',
      weatherProofing: socialClass === 'poor' ? 0.6 : socialClass === 'noble' ? 0.95 : 0.8,
      insulation: { poor: 2, common: 5, wealthy: 10, noble: 15 }[socialClass],
      cost: { poor: 50, common: 150, wealthy: 400, noble: 800 }[socialClass],
      lifespan: { poor: 15, common: 25, wealthy: 50, noble: 100 }[socialClass],
      fireResistance: materials[socialClass] === 'thatch' ? 0.1 : 0.8
    };
  }

  // Method 6: Facade Pattern Generation
  private static generateFacadePattern(
    style: ArchitecturalStyle,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): FacadePattern {
    const patterns = {
      timber_frame: {
        basePattern: 'geometric' as const,
        description: 'Traditional timber framing with visible wooden beams'
      },
      stone_block: {
        basePattern: 'uniform' as const,
        description: 'Uniform stone blocks with minimal mortar lines'
      },
      brick: {
        basePattern: 'alternating' as const,
        description: 'Classic brick laying pattern'
      }
    };

    const pattern = patterns[style.characteristics.wallPattern] || patterns['timber_frame'];

    return {
      id: `facade_${style.characteristics.wallPattern}`,
      name: `${style.characteristics.wallPattern.replace('_', ' ').toUpperCase()} Pattern`,
      ...pattern,
      primaryMaterial: style.characteristics.wallPattern,
      accentMaterial: socialClass === 'noble' ? 'gold_trim' : undefined,
      repetitionUnit: { width: 2, height: 2 },
      complexity: { poor: 3, common: 5, wealthy: 7, noble: 9 }[socialClass],
      visualInterest: { poor: 4, common: 6, wealthy: 8, noble: 10 }[socialClass],
      costMultiplier: { poor: 1.0, common: 1.2, wealthy: 1.5, noble: 2.0 }[socialClass],
      culturalStyle: style.name
    };
  }

  // Method 7: Landscaping Integration  
  private static generateLandscaping(
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    climate: string,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): BuildingAesthetics['landscaping'] {
    const features: BuildingAesthetics['landscaping'] = [];
    const available = Object.values(this.landscapingFeatures).filter(f =>
      f.socialClass.includes(socialClass) && f.climatePreference.includes(climate)
    );

    const featureCount = { poor: 1, common: 2, wealthy: 4, noble: 6 }[socialClass];

    for (let i = 0; i < Math.min(featureCount, available.length); i++) {
      const feature = available[Math.floor(this.seedRandom(seed + i) * available.length)];
      features.push({
        feature,
        position: {
          x: Math.floor(this.seedRandom(seed + i + 100) * 10),
          y: Math.floor(this.seedRandom(seed + i + 200) * 10)
        },
        maturity: 0.3 + this.seedRandom(seed + i + 300) * 0.7
      });
    }

    return features;
  }

  // Methods 8-20: Additional Implementation Details
  private static applyAgeingEffects(age: number, condition: string, climate: string, seed: number): AgeingEffect[] {
    const effects: AgeingEffect[] = [];
    
    if (age > 10) {
      effects.push({
        id: 'weathering',
        name: 'Weather Staining',
        description: 'Natural weathering and color fading from exposure',
        ageThreshold: 10,
        affectedMaterials: ['wood', 'stone', 'paint'],
        visualChanges: {
          colorShift: '#888888', // Grayer tones
          textureChange: 'More rough and weathered',
          structuralChange: 'Minor sagging and settling'
        },
        maintenanceCost: 25,
        stabilityImpact: -0.1
      });
    }

    return effects;
  }

  private static analyzeProportions(rooms: any[], decorations: any[], seed: number): BuildingAesthetics['proportionalAnalysis'] {
    // Golden ratio analysis (simplified)
    const goldenRatio = 1.618;
    const avgWidth = rooms.reduce((sum, room) => sum + (room.width || 8), 0) / rooms.length;
    const avgHeight = rooms.reduce((sum, room) => sum + (room.height || 8), 0) / rooms.length;
    const actualRatio = avgWidth / avgHeight;
    const goldenCompliance = 1 - Math.abs(actualRatio - goldenRatio) / goldenRatio;

    return {
      goldenRatioCompliance: Math.max(0, goldenCompliance),
      visualBalance: 0.7 + this.seedRandom(seed) * 0.3,
      symmetryScore: 0.6 + this.seedRandom(seed + 100) * 0.4,
      overallHarmony: (goldenCompliance + 0.7 + 0.6) / 3
    };
  }

  private static generateSeasonalAdaptations(climate: string, seed: number): { [season: string]: SeasonalAdaptation } {
    return {
      spring: {
        season: 'spring',
        adaptations: {
          plantlife: ['budding trees', 'early flowers', 'fresh grass'],
          decorations: ['flower boxes', 'colorful banners'],
          lighting: { intensity: 0.8, color: '#FFFACD' },
          maintenance: ['roof inspection', 'garden preparation'],
          colorAdjustments: { wood: '#8B7355' },
          temporaryFeatures: []
        }
      },
      summer: {
        season: 'summer',
        adaptations: {
          plantlife: ['full foliage', 'blooming gardens', 'vine growth'],
          decorations: ['sun awnings', 'outdoor seating'],
          lighting: { intensity: 1.0, color: '#FFFF99' },
          maintenance: ['pest control', 'watering systems'],
          colorAdjustments: { paint: '#F5F5DC' },
          temporaryFeatures: []
        }
      },
      autumn: {
        season: 'autumn',
        adaptations: {
          plantlife: ['changing leaf colors', 'harvest displays'],
          decorations: ['harvest wreaths', 'warm lighting'],
          lighting: { intensity: 0.9, color: '#FFA500' },
          maintenance: ['gutter cleaning', 'winter preparation'],
          colorAdjustments: { thatch: '#CD853F' },
          temporaryFeatures: []
        }
      },
      winter: {
        season: 'winter',
        adaptations: {
          plantlife: ['bare branches', 'evergreen highlights', 'snow cover'],
          decorations: ['ice sculptures', 'winter wreaths'],
          lighting: { intensity: 0.6, color: '#E6E6FA' },
          maintenance: ['snow removal', 'ice damage prevention'],
          colorAdjustments: { stone: '#708090' },
          temporaryFeatures: []
        }
      }
    };
  }

  private static generateUniqueFeatures(buildingType: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble', seed: number): BuildingAesthetics['uniqueFeatures'] {
    const features = [];
    
    if (socialClass === 'noble' && this.seedRandom(seed) < 0.3) {
      features.push({
        name: 'Hidden Passage Entrance',
        description: 'A concealed door behind a rotating bookshelf',
        position: { x: 2, y: 6, floor: 0 },
        rarity: 'rare' as const,
        gameplayValue: 'Secret entrance for escape or intrigue'
      });
    }

    if (buildingType === 'blacksmith' && this.seedRandom(seed + 100) < 0.4) {
      features.push({
        name: 'Master-crafted Weathervane',
        description: 'An intricate metal weathervane showing exceptional craftsmanship',
        position: { x: 4, y: 4, floor: 1 },
        rarity: 'uncommon' as const,
        gameplayValue: 'Indicates master-level smithing skills'
      });
    }

    return features;
  }

  private static designLighting(
    rooms: any[],
    style: ArchitecturalStyle,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): BuildingAesthetics['lighting'] {
    const exterior = [];
    const interior = [];

    // Exterior lighting
    if (socialClass !== 'poor') {
      exterior.push({
        source: 'lantern',
        position: { x: 0, y: 4 },
        intensity: socialClass === 'noble' ? 0.9 : 0.6,
        color: socialClass === 'noble' ? '#FFD700' : '#FFA500',
        castsShadows: true
      });
    }

    // Interior lighting per room
    rooms.forEach(room => {
      interior.push({
        roomId: room.id,
        ambientColor: socialClass === 'noble' ? '#FFFACD' : '#FFF8DC',
        moodLighting: socialClass === 'wealthy' || socialClass === 'noble',
        naturalLight: ['common', 'bedroom', 'study'].includes(room.type) ? 0.7 : 0.3
      });
    });

    return { exterior, interior };
  }

  private static calculateAestheticRating(
    style: ArchitecturalStyle,
    decorations: any[],
    proportions: any,
    condition: string
  ): BuildingAesthetics['overallAestheticRating'] {
    const conditionMultiplier = {
      'new': 1.0,
      'good': 0.9,
      'worn': 0.7,
      'poor': 0.5,
      'ruins': 0.2
    }[condition];

    const baseBeauty = 50 + (decorations.length * 5);
    const baseDistinctiveness = 40 + (decorations.filter(d => d.element.complexity === 'elaborate').length * 10);
    const baseAuthenticity = style.era === 'fantasy' ? 85 : 75;
    const baseCraftsmanship = 60 + (decorations.length * 3);
    const baseHarmony = proportions.overallHarmony * 100;

    return {
      beauty: Math.round(Math.min(100, baseBeauty * conditionMultiplier)),
      distinctiveness: Math.round(Math.min(100, baseDistinctiveness * conditionMultiplier)),
      authenticity: Math.round(Math.min(100, baseAuthenticity * conditionMultiplier)),
      craftsmanship: Math.round(Math.min(100, baseCraftsmanship * conditionMultiplier)),
      harmony: Math.round(Math.min(100, baseHarmony * conditionMultiplier))
    };
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Public utility methods
  static getArchitecturalStyle(id: string): ArchitecturalStyle | null {
    return this.architecturalStyles[id] || null;
  }

  static getColorPalette(id: string): ColorPalette | null {
    return this.colorPalettes[id] || null;
  }

  static getDecorativeElement(id: string): DecorativeElement | null {
    return this.decorativeElements[id] || null;
  }

  static addCustomArchitecturalStyle(id: string, style: ArchitecturalStyle): void {
    this.architecturalStyles[id] = style;
  }

  static addCustomColorPalette(id: string, palette: ColorPalette): void {
    this.colorPalettes[id] = palette;
  }

  static addCustomDecorativeElement(id: string, element: DecorativeElement): void {
    this.decorativeElements[id] = element;
  }

  static generateColorVariation(baseColor: string, variation: number = 0.1): string {
    // Simple color variation function (would be more complex in practice)
    const hex = baseColor.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + Math.round((Math.random() - 0.5) * variation * 255)));
    const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + Math.round((Math.random() - 0.5) * variation * 255)));
    const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + Math.round((Math.random() - 0.5) * variation * 255)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Method for updating aesthetics with seasonal changes
  static applySeasonalUpdate(aesthetics: BuildingAesthetics, newSeason: 'spring' | 'summer' | 'autumn' | 'winter'): BuildingAesthetics {
    const seasonalUpdate = aesthetics.seasonalAdaptations[newSeason];
    
    // Update landscaping maturity and appearance based on season
    const updatedLandscaping = aesthetics.landscaping.map(item => ({
      ...item,
      maturity: newSeason === 'summer' ? Math.min(1.0, item.maturity + 0.1) : item.maturity
    }));

    // Update lighting based on season
    const seasonIntensity = { spring: 0.8, summer: 1.0, autumn: 0.9, winter: 0.6 }[newSeason];
    const updatedLighting = {
      ...aesthetics.lighting,
      exterior: aesthetics.lighting.exterior.map(light => ({
        ...light,
        intensity: light.intensity * seasonIntensity
      }))
    };

    return {
      ...aesthetics,
      landscaping: updatedLandscaping,
      lighting: updatedLighting
    };
  }

  static getAllArchitecturalStyles(): { [key: string]: ArchitecturalStyle } {
    return { ...this.architecturalStyles };
  }

  static getAllColorPalettes(): { [key: string]: ColorPalette } {
    return { ...this.colorPalettes };
  }

  static getAllDecorativeElements(): { [key: string]: DecorativeElement } {
    return { ...this.decorativeElements };
  }
}