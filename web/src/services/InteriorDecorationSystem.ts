import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { Room } from './ProceduralBuildingGenerator';
import { RoomFunction } from './FloorMaterialSystem';

export interface Decoration {
  id: string;
  name: string;
  type: 'wall_hanging' | 'floor_covering' | 'ceiling_feature' | 'lighting' | 'plants' | 'religious' | 'luxury';
  x: number;
  y: number;
  width: number;
  height: number;
  placement: 'wall' | 'floor' | 'ceiling' | 'corner' | 'center';
  wallSide?: 'north' | 'south' | 'east' | 'west';
  materials: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  functionality: string[];
  socialClassRequirement: SocialClass[];
  roomTypes: RoomFunction[];
  priority: number;
  lightLevel: number; // 0-100, how much light it provides
  comfort: number; // 0-100, how much comfort/ambiance it adds
  cost: number;
}

export interface LightingSystem {
  id: string;
  type: 'candle' | 'oil_lamp' | 'torch' | 'lantern' | 'chandelier' | 'sconce' | 'fireplace_light';
  x: number;
  y: number;
  lightRadius: number; // tiles illuminated
  lightIntensity: number; // 0-100
  fuelType: 'wax' | 'oil' | 'wood' | 'tallow';
  burnTime: number; // hours
  placement: 'table' | 'wall' | 'ceiling' | 'floor';
}

export class InteriorDecorationSystem {
  private static decorationTemplates: Decoration[] = [
    // WALL HANGINGS
    {
      id: 'tapestry_noble',
      name: 'Noble Tapestry',
      type: 'wall_hanging',
      x: 0, y: 0, width: 2, height: 1,
      placement: 'wall',
      materials: {
        primary: 'fabric_silk',
        secondary: 'thread_gold',
        accent: 'dyes_rare'
      },
      functionality: ['decoration', 'insulation', 'status_display'],
      socialClassRequirement: ['noble'],
      roomTypes: ['living', 'bedroom'],
      priority: 3,
      lightLevel: 0,
      comfort: 80,
      cost: 500
    },

    {
      id: 'simple_banner',
      name: 'Simple Banner',
      type: 'wall_hanging',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'wall',
      materials: {
        primary: 'fabric_wool',
        secondary: 'dyes_common'
      },
      functionality: ['decoration', 'family_crest'],
      socialClassRequirement: ['common', 'wealthy'],
      roomTypes: ['living', 'tavern_hall'],
      priority: 3,
      lightLevel: 0,
      comfort: 30,
      cost: 50
    },

    // FLOOR COVERINGS
    {
      id: 'persian_rug',
      name: 'Fine Persian Rug',
      type: 'floor_covering',
      x: 0, y: 0, width: 3, height: 2,
      placement: 'floor',
      materials: {
        primary: 'fabric_silk',
        secondary: 'dyes_rare'
      },
      functionality: ['decoration', 'comfort', 'warmth'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['living', 'bedroom'],
      priority: 2,
      lightLevel: 0,
      comfort: 70,
      cost: 300
    },

    {
      id: 'rushes_floor',
      name: 'Fresh Rushes',
      type: 'floor_covering',
      x: 0, y: 0, width: 2, height: 2,
      placement: 'floor',
      materials: {
        primary: 'plant_rushes',
        secondary: 'herbs_strewing'
      },
      functionality: ['sanitation', 'aroma', 'basic_comfort'],
      socialClassRequirement: ['poor', 'common'],
      roomTypes: ['living', 'tavern_hall'],
      priority: 1,
      lightLevel: 0,
      comfort: 20,
      cost: 5
    },

    // LIGHTING FIXTURES
    {
      id: 'brass_chandelier',
      name: 'Brass Chandelier',
      type: 'lighting',
      x: 0, y: 0, width: 2, height: 2,
      placement: 'ceiling',
      materials: {
        primary: 'metal_brass',
        secondary: 'wax_beeswax'
      },
      functionality: ['lighting', 'status_display'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['living', 'tavern_hall'],
      priority: 2,
      lightLevel: 85,
      comfort: 60,
      cost: 200
    },

    {
      id: 'wall_sconce',
      name: 'Iron Wall Sconce',
      type: 'lighting',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'wall',
      materials: {
        primary: 'metal_iron',
        secondary: 'wax_tallow'
      },
      functionality: ['lighting'],
      socialClassRequirement: ['common', 'wealthy'],
      roomTypes: ['living', 'bedroom', 'tavern_hall'],
      priority: 2,
      lightLevel: 40,
      comfort: 25,
      cost: 25
    },

    {
      id: 'simple_candle',
      name: 'Tallow Candle',
      type: 'lighting',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'floor', // on furniture/tables
      materials: {
        primary: 'wax_tallow'
      },
      functionality: ['basic_lighting'],
      socialClassRequirement: ['poor', 'common'],
      roomTypes: ['bedroom', 'kitchen', 'storage'],
      priority: 1,
      lightLevel: 20,
      comfort: 10,
      cost: 2
    },

    // RELIGIOUS/SPIRITUAL
    {
      id: 'holy_shrine',
      name: 'Household Shrine',
      type: 'religious',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'corner',
      materials: {
        primary: 'wood_oak',
        secondary: 'metal_bronze',
        accent: 'fabric_linen'
      },
      functionality: ['worship', 'protection', 'comfort'],
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      roomTypes: ['bedroom', 'living'],
      priority: 2,
      lightLevel: 10,
      comfort: 40,
      cost: 75
    },

    // PLANTS/HERBS
    {
      id: 'herb_bundles',
      name: 'Drying Herb Bundles',
      type: 'plants',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'ceiling',
      materials: {
        primary: 'herbs_cooking',
        secondary: 'rope_hemp'
      },
      functionality: ['cooking', 'medicine', 'aroma'],
      socialClassRequirement: ['poor', 'common', 'wealthy'],
      roomTypes: ['kitchen'],
      priority: 1,
      lightLevel: 0,
      comfort: 15,
      cost: 8
    },

    // CEILING FEATURES
    {
      id: 'decorative_beams',
      name: 'Carved Ceiling Beams',
      type: 'ceiling_feature',
      x: 0, y: 0, width: 3, height: 1,
      placement: 'ceiling',
      materials: {
        primary: 'wood_oak',
        secondary: 'stains_decorative'
      },
      functionality: ['decoration', 'structural_beauty'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['living', 'tavern_hall'],
      priority: 3,
      lightLevel: 0,
      comfort: 50,
      cost: 150
    },

    // LUXURY ITEMS
    {
      id: 'mirror_polished',
      name: 'Polished Metal Mirror',
      type: 'luxury',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'wall',
      materials: {
        primary: 'metal_bronze',
        secondary: 'polishing_compounds'
      },
      functionality: ['grooming', 'status_display', 'light_reflection'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['bedroom'],
      priority: 3,
      lightLevel: 15,
      comfort: 45,
      cost: 400
    }
  ];

  static decorateRoom(
    room: Room,
    buildingType: BuildingType,
    socialClass: SocialClass,
    floorLevel: number,
    seed: number
  ): void {
    if (!room.decorations) {
      room.decorations = [];
    }

    if (!room.lighting) {
      room.lighting = [];
    }

    // Calculate decoration budget based on social class
    const budget = this.getDecorationBudget(socialClass, room.type);
    let remainingBudget = budget;

    // Filter appropriate decorations
    const suitableDecorations = this.decorationTemplates.filter(decoration =>
      decoration.roomTypes.includes(this.mapRoomTypeToFunction(room.type)) &&
      decoration.socialClassRequirement.includes(socialClass) &&
      decoration.cost <= remainingBudget
    );

    // Sort by priority and comfort value
    suitableDecorations.sort((a, b) => {
      const aValue = (a.comfort + a.lightLevel) / a.cost;
      const bValue = (b.comfort + b.lightLevel) / b.cost;
      return bValue - aValue;
    });

    // Track occupied spaces
    const occupiedSpaces: Set<string> = new Set();

    // Add essential lighting first
    this.addEssentialLighting(room, socialClass, occupiedSpaces, seed);

    // Place decorations by priority within budget
    suitableDecorations.forEach((decorationTemplate, index) => {
      if (room.decorations!.length >= 5) return; // Limit decorations per room
      if (remainingBudget < decorationTemplate.cost) return;

      const placement = this.findDecorationPlacement(
        room,
        decorationTemplate,
        occupiedSpaces,
        seed + index
      );

      if (placement) {
        const decoration: Decoration = {
          ...decorationTemplate,
          id: `${decorationTemplate.id}_${room.id}_${index}`,
          x: placement.x,
          y: placement.y,
          wallSide: placement.wallSide
        };

        room.decorations!.push(decoration);
        remainingBudget -= decoration.cost;
        this.markOccupiedSpace(decoration, occupiedSpaces);

        // Add lighting if decoration provides it
        if (decoration.lightLevel > 0) {
          this.addDecorationLighting(room, decoration, seed + index + 100);
        }
      }
    });

    // Ensure minimum lighting levels
    this.ensureMinimumLighting(room, socialClass, occupiedSpaces, seed + 1000);
  }

  private static getDecorationBudget(socialClass: SocialClass, roomType: string): number {
    const basebudgets: Record<SocialClass, number> = {
      poor: 20,
      common: 100,
      wealthy: 500,
      noble: 1500
    };

    const roomMultipliers: Record<string, number> = {
      living: 1.5,
      bedroom: 1.2,
      kitchen: 0.8,
      tavern_hall: 2.0,
      storage: 0.3,
      workshop: 0.5
    };

    return Math.floor(basebudgets[socialClass] * (roomMultipliers[roomType] || 1.0));
  }

  private static findDecorationPlacement(
    room: Room,
    decoration: Decoration,
    occupiedSpaces: Set<string>,
    seed: number
  ): { x: number; y: number; wallSide?: 'north' | 'south' | 'east' | 'west' } | null {

    switch (decoration.placement) {
      case 'wall':
        return this.findWallPlacement(room, decoration, occupiedSpaces, seed);
      
      case 'floor':
        return this.findFloorPlacement(room, decoration, occupiedSpaces, seed);
      
      case 'ceiling':
        return this.findCeilingPlacement(room, decoration, occupiedSpaces, seed);
      
      case 'corner':
        return this.findCornerPlacement(room, decoration, occupiedSpaces, seed);
      
      case 'center':
        return this.findCenterPlacement(room, decoration, occupiedSpaces, seed);
      
      default:
        return null;
    }
  }

  private static findWallPlacement(
    room: Room,
    decoration: Decoration,
    occupiedSpaces: Set<string>,
    seed: number
  ): { x: number; y: number; wallSide: 'north' | 'south' | 'east' | 'west' } | null {
    
    const walls = ['north', 'south', 'east', 'west'];
    const shuffledWalls = this.shuffleArray([...walls], seed);

    for (const wall of shuffledWalls) {
      let wallLength: number;
      let startPos: number;

      switch (wall) {
        case 'north':
        case 'south':
          wallLength = room.width - 2;
          startPos = 1;
          break;
        case 'east':
        case 'west':
          wallLength = room.height - 2;
          startPos = 1;
          break;
        default:
          continue;
      }

      // Find available space on wall
      for (let pos = startPos; pos <= wallLength - decoration.width; pos++) {
        let canPlace = true;
        
        // Check if space is occupied
        for (let w = 0; w < decoration.width; w++) {
          const key = this.getSpaceKey(wall, pos + w);
          if (occupiedSpaces.has(key)) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          let x: number, y: number;

          switch (wall) {
            case 'north':
              x = room.x + pos;
              y = room.y + 1;
              break;
            case 'south':
              x = room.x + pos;
              y = room.y + room.height - 2;
              break;
            case 'east':
              x = room.x + room.width - 2;
              y = room.y + pos;
              break;
            case 'west':
              x = room.x + 1;
              y = room.y + pos;
              break;
            default:
              continue;
          }

          return { x, y, wallSide: wall as 'north' | 'south' | 'east' | 'west' };
        }
      }
    }

    return null;
  }

  private static findFloorPlacement(
    room: Room,
    decoration: Decoration,
    occupiedSpaces: Set<string>,
    seed: number
  ): { x: number; y: number } | null {
    
    const attempts: Array<{x: number, y: number}> = [];

    // Try different floor positions
    for (let x = room.x + 1; x < room.x + room.width - decoration.width - 1; x++) {
      for (let y = room.y + 1; y < room.y + room.height - decoration.height - 1; y++) {
        let canPlace = true;
        
        for (let dx = 0; dx < decoration.width; dx++) {
          for (let dy = 0; dy < decoration.height; dy++) {
            const key = `floor_${x + dx}_${y + dy}`;
            if (occupiedSpaces.has(key)) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) break;
        }

        if (canPlace) {
          attempts.push({ x, y });
        }
      }
    }

    if (attempts.length === 0) return null;

    // Select random position from valid attempts
    const chosen = attempts[Math.floor(this.seedRandom(seed) * attempts.length)];
    return chosen;
  }

  private static findCeilingPlacement(
    room: Room,
    decoration: Decoration,
    occupiedSpaces: Set<string>,
    seed: number
  ): { x: number; y: number } | null {
    
    // Center of room for ceiling decorations
    const centerX = room.x + Math.floor((room.width - decoration.width) / 2);
    const centerY = room.y + Math.floor((room.height - decoration.height) / 2);

    const key = `ceiling_${centerX}_${centerY}`;
    if (occupiedSpaces.has(key)) return null;

    return { x: centerX, y: centerY };
  }

  private static findCornerPlacement(
    room: Room,
    decoration: Decoration,
    occupiedSpaces: Set<string>,
    seed: number
  ): { x: number; y: number } | null {
    
    const corners = [
      { x: room.x + 1, y: room.y + 1 }, // NW
      { x: room.x + room.width - decoration.width - 1, y: room.y + 1 }, // NE
      { x: room.x + 1, y: room.y + room.height - decoration.height - 1 }, // SW
      { x: room.x + room.width - decoration.width - 1, y: room.y + room.height - decoration.height - 1 } // SE
    ];

    const shuffledCorners = this.shuffleArray([...corners], seed);

    for (const corner of shuffledCorners) {
      const key = `corner_${corner.x}_${corner.y}`;
      if (!occupiedSpaces.has(key)) {
        return corner;
      }
    }

    return null;
  }

  private static findCenterPlacement(
    room: Room,
    decoration: Decoration,
    occupiedSpaces: Set<string>,
    seed: number
  ): { x: number; y: number } | null {
    
    const centerX = room.x + Math.floor((room.width - decoration.width) / 2);
    const centerY = room.y + Math.floor((room.height - decoration.height) / 2);

    const key = `center_${centerX}_${centerY}`;
    if (occupiedSpaces.has(key)) return null;

    return { x: centerX, y: centerY };
  }

  private static addEssentialLighting(
    room: Room,
    socialClass: SocialClass,
    occupiedSpaces: Set<string>,
    seed: number
  ): void {
    
    // Every room needs basic lighting
    const lightingTemplate = socialClass === 'poor' ? 
      this.decorationTemplates.find(d => d.id === 'simple_candle') :
      socialClass === 'common' ? 
      this.decorationTemplates.find(d => d.id === 'wall_sconce') :
      this.decorationTemplates.find(d => d.id === 'brass_chandelier');

    if (lightingTemplate && room.decorations!.length === 0) {
      const placement = this.findDecorationPlacement(room, lightingTemplate, occupiedSpaces, seed);
      if (placement) {
        const lighting: Decoration = {
          ...lightingTemplate,
          id: `${lightingTemplate.id}_${room.id}_essential`,
          x: placement.x,
          y: placement.y,
          wallSide: placement.wallSide
        };
        
        room.decorations!.push(lighting);
        this.markOccupiedSpace(lighting, occupiedSpaces);
      }
    }
  }

  private static addDecorationLighting(
    room: Room,
    decoration: Decoration,
    seed: number
  ): void {
    
    const lightingSystem: LightingSystem = {
      id: `light_${decoration.id}`,
      type: decoration.type === 'lighting' ? 
        (decoration.id.includes('chandelier') ? 'chandelier' : 
         decoration.id.includes('sconce') ? 'sconce' : 'candle') : 'candle',
      x: decoration.x,
      y: decoration.y,
      lightRadius: Math.floor(decoration.lightLevel / 20) + 1,
      lightIntensity: decoration.lightLevel,
      fuelType: decoration.materials.primary.includes('wax') ? 'wax' : 
                decoration.materials.primary.includes('oil') ? 'oil' : 'tallow',
      burnTime: decoration.lightLevel / 10 + 2,
      placement: decoration.placement as 'table' | 'wall' | 'ceiling' | 'floor'
    };

    room.lighting!.push(lightingSystem);
  }

  private static ensureMinimumLighting(
    room: Room,
    socialClass: SocialClass,
    occupiedSpaces: Set<string>,
    seed: number
  ): void {
    
    const totalLighting = room.decorations!.reduce((sum, d) => sum + d.lightLevel, 0);
    const minimumRequired = room.width * room.height * 2; // 2 light per tile

    if (totalLighting < minimumRequired) {
      // Add additional simple lighting
      const candleTemplate = this.decorationTemplates.find(d => d.id === 'simple_candle');
      if (candleTemplate) {
        const placement = this.findFloorPlacement(room, candleTemplate, occupiedSpaces, seed);
        if (placement) {
          const candle: Decoration = {
            ...candleTemplate,
            id: `candle_additional_${room.id}`,
            x: placement.x,
            y: placement.y
          };
          
          room.decorations!.push(candle);
          this.addDecorationLighting(room, candle, seed + 2000);
        }
      }
    }
  }

  private static markOccupiedSpace(decoration: Decoration, occupiedSpaces: Set<string>): void {
    const key = this.getSpaceKey(decoration.placement, decoration.x, decoration.y);
    occupiedSpaces.add(key);
  }

  private static getSpaceKey(placement: string, x: number, y?: number): string {
    return y !== undefined ? `${placement}_${x}_${y}` : `${placement}_${x}`;
  }

  private static mapRoomTypeToFunction(roomType: string): RoomFunction {
    const mapping: Record<string, RoomFunction> = {
      'living': 'living',
      'bedroom': 'bedroom',
      'kitchen': 'kitchen',
      'storage': 'storage',
      'workshop': 'workshop',
      'common': 'common',
      'tavern_hall': 'tavern_hall',
      'guest_room': 'guest_room',
      'shop_floor': 'shop_floor',
      'cellar': 'cellar',
      'office': 'office'
    };
    return mapping[roomType] || 'living';
  }

  private static shuffleArray<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.seedRandom(seed + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  static getDecorationVisualStyle(decoration: Decoration): {
    color: string;
    borderColor: string;
    icon: string;
    description: string;
  } {
    switch (decoration.type) {
      case 'wall_hanging':
        return {
          color: '#8B4513',
          borderColor: '#654321',
          icon: '🏺',
          description: 'Wall decoration'
        };
      
      case 'floor_covering':
        return {
          color: '#CD853F',
          borderColor: '#A0522D',
          icon: '🏺',
          description: 'Floor covering'
        };
      
      case 'lighting':
        return {
          color: '#FFD700',
          borderColor: '#DAA520',
          icon: decoration.id.includes('chandelier') ? '💡' : 
               decoration.id.includes('sconce') ? '🕯️' : '🕯️',
          description: 'Lighting fixture'
        };
      
      case 'religious':
        return {
          color: '#8B7355',
          borderColor: '#654321',
          icon: '✝️',
          description: 'Religious shrine'
        };
      
      case 'plants':
        return {
          color: '#9ACD32',
          borderColor: '#6B8E23',
          icon: '🌿',
          description: 'Plants and herbs'
        };
      
      case 'luxury':
        return {
          color: '#C0C0C0',
          borderColor: '#A9A9A9',
          icon: '💎',
          description: 'Luxury item'
        };
      
      case 'ceiling_feature':
        return {
          color: '#8B4513',
          borderColor: '#654321',
          icon: '🏛️',
          description: 'Ceiling decoration'
        };
      
      default:
        return {
          color: '#D2B48C',
          borderColor: '#A0522D',
          icon: '🎨',
          description: 'Decoration'
        };
    }
  }
}