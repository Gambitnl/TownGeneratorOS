import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { Room } from './ProceduralBuildingGenerator';
import { RoomFunction } from './FloorMaterialSystem';

export interface MedievalFixture {
  id: string;
  name: string;
  type: 'hearth' | 'privy' | 'built_in_storage' | 'well' | 'bread_oven' | 'washbasin' | 'garderobe' | 'alcove';
  x: number;
  y: number;
  width: number;
  height: number;
  placement: 'wall' | 'corner' | 'center' | 'external';
  wallSide?: 'north' | 'south' | 'east' | 'west';
  materials: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  functionality: string[];
  socialClassRequirement: SocialClass[];
  roomTypes: RoomFunction[];
  priority: number; // 1 = essential, 2 = important, 3 = luxury
  spacingRequirements: {
    front: number;
    back: number;
    left: number;
    right: number;
  };
  ventilation?: {
    required: boolean;
    type: 'chimney' | 'window' | 'door';
  };
}

export interface FixtureTemplate {
  fixtures: MedievalFixture[];
}

export class MedievalFixturesSystem {
  private static fixtureTemplates: MedievalFixture[] = [
    // HEARTHS - Essential for cooking and heating
    {
      id: 'hearth_large',
      name: 'Large Stone Hearth',
      type: 'hearth',
      x: 0, y: 0, width: 2, height: 1,
      placement: 'wall',
      materials: {
        primary: 'stone_granite',
        secondary: 'brick_fired',
        accent: 'metal_iron'
      },
      functionality: ['heating', 'cooking', 'light'],
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      roomTypes: ['living', 'kitchen', 'common', 'tavern_hall'],
      priority: 1,
      spacingRequirements: { front: 2, back: 0, left: 1, right: 1 },
      ventilation: { required: true, type: 'chimney' }
    },
    
    {
      id: 'hearth_small',
      name: 'Simple Hearth',
      type: 'hearth',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'wall',
      materials: {
        primary: 'stone_limestone',
        secondary: 'brick_fired'
      },
      functionality: ['heating', 'basic_cooking'],
      socialClassRequirement: ['poor', 'common'],
      roomTypes: ['living', 'kitchen'],
      priority: 1,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 },
      ventilation: { required: true, type: 'chimney' }
    },

    // PRIVIES - Essential sanitation
    {
      id: 'privy_indoor',
      name: 'Indoor Privy',
      type: 'privy',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'corner',
      materials: {
        primary: 'wood_oak',
        secondary: 'stone_limestone'
      },
      functionality: ['sanitation'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['bedroom', 'living'],
      priority: 2,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 },
      ventilation: { required: true, type: 'window' }
    },

    {
      id: 'garderobe',
      name: 'Garderobe',
      type: 'garderobe',
      x: 0, y: 0, width: 1, height: 2,
      placement: 'wall',
      wallSide: 'north', // Typically on exterior wall
      materials: {
        primary: 'stone_limestone',
        secondary: 'wood_oak'
      },
      functionality: ['sanitation', 'waste_disposal'],
      socialClassRequirement: ['noble'],
      roomTypes: ['bedroom'],
      priority: 2,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 },
      ventilation: { required: true, type: 'window' }
    },

    // BUILT-IN STORAGE
    {
      id: 'wall_niche',
      name: 'Wall Niche',
      type: 'built_in_storage',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'wall',
      materials: {
        primary: 'stone_limestone',
        secondary: 'wood_oak'
      },
      functionality: ['storage', 'display'],
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['bedroom', 'living', 'kitchen', 'storage'],
      priority: 3,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    {
      id: 'built_in_cupboard',
      name: 'Built-in Cupboard',
      type: 'built_in_storage',
      x: 0, y: 0, width: 2, height: 1,
      placement: 'wall',
      materials: {
        primary: 'wood_oak',
        secondary: 'metal_iron'
      },
      functionality: ['storage', 'food_storage'],
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      roomTypes: ['kitchen', 'storage', 'living'],
      priority: 2,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    {
      id: 'cellar_alcove',
      name: 'Storage Alcove',
      type: 'alcove',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'wall',
      materials: {
        primary: 'stone_limestone'
      },
      functionality: ['storage', 'wine_storage'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['cellar', 'storage'],
      priority: 3,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    // KITCHEN FIXTURES
    {
      id: 'bread_oven',
      name: 'Brick Bread Oven',
      type: 'bread_oven',
      x: 0, y: 0, width: 2, height: 2,
      placement: 'wall',
      materials: {
        primary: 'brick_fired',
        secondary: 'stone_limestone',
        accent: 'metal_iron'
      },
      functionality: ['baking', 'heating'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['kitchen'],
      priority: 2,
      spacingRequirements: { front: 2, back: 0, left: 1, right: 1 },
      ventilation: { required: true, type: 'chimney' }
    },

    {
      id: 'washbasin',
      name: 'Stone Washbasin',
      type: 'washbasin',
      x: 0, y: 0, width: 1, height: 1,
      placement: 'wall',
      materials: {
        primary: 'stone_limestone',
        secondary: 'metal_bronze'
      },
      functionality: ['washing', 'cleaning'],
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      roomTypes: ['kitchen', 'bedroom'],
      priority: 2,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    // WELL (for courtyards/kitchens)
    {
      id: 'indoor_well',
      name: 'Indoor Well',
      type: 'well',
      x: 0, y: 0, width: 2, height: 2,
      placement: 'center',
      materials: {
        primary: 'stone_granite',
        secondary: 'wood_oak',
        accent: 'metal_iron'
      },
      functionality: ['water_source', 'storage'],
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['kitchen'],
      priority: 3,
      spacingRequirements: { front: 1, back: 1, left: 1, right: 1 }
    }
  ];

  static addFixturesToRoom(
    room: Room,
    buildingType: BuildingType,
    socialClass: SocialClass,
    floorLevel: number,
    seed: number
  ): void {
    if (!room.fixtures) {
      room.fixtures = [];
    }

    // Filter appropriate fixtures for this room
    const suitableFixtures = this.fixtureTemplates.filter(fixture =>
      fixture.roomTypes.includes(this.mapRoomTypeToFunction(room.type)) &&
      fixture.socialClassRequirement.includes(socialClass)
    );

    // Sort by priority (essential first)
    suitableFixtures.sort((a, b) => a.priority - b.priority);

    // Track occupied wall space
    const occupiedWallSpace: Map<string, Set<number>> = new Map();
    ['north', 'south', 'east', 'west'].forEach(wall => {
      occupiedWallSpace.set(wall, new Set());
    });

    // Place fixtures by priority
    suitableFixtures.forEach((fixtureTemplate, index) => {
      if (room.fixtures!.length >= 3) return; // Limit fixtures per room

      const placement = this.findFixturePlacement(
        room,
        fixtureTemplate,
        occupiedWallSpace,
        seed + index
      );

      if (placement) {
        const fixture: MedievalFixture = {
          ...fixtureTemplate,
          id: `${fixtureTemplate.id}_${room.id}_${index}`,
          x: placement.x,
          y: placement.y,
          wallSide: placement.wallSide
        };

        room.fixtures.push(fixture);
        this.markOccupiedWallSpace(fixture, occupiedWallSpace);

        // Add chimney requirement if fixture needs ventilation
        if (fixture.ventilation?.required && fixture.ventilation.type === 'chimney') {
          if (!room.chimneys) room.chimneys = [];
          room.chimneys.push({
            x: fixture.x,
            y: fixture.y,
            material: 'brick_fired'
          });
        }
      }
    });

    // Ensure essential fixtures are present
    this.ensureEssentialFixtures(room, buildingType, socialClass, occupiedWallSpace, seed + 1000);
  }

  private static findFixturePlacement(
    room: Room,
    fixture: MedievalFixture,
    occupiedWallSpace: Map<string, Set<number>>,
    seed: number
  ): { x: number; y: number; wallSide?: 'north' | 'south' | 'east' | 'west' } | null {
    
    switch (fixture.placement) {
      case 'wall':
        return this.findWallPlacement(room, fixture, occupiedWallSpace, seed);
      
      case 'corner':
        return this.findCornerPlacement(room, fixture, occupiedWallSpace, seed);
      
      case 'center':
        return this.findCenterPlacement(room, fixture, seed);
      
      default:
        return null;
    }
  }

  private static findWallPlacement(
    room: Room,
    fixture: MedievalFixture,
    occupiedWallSpace: Map<string, Set<number>>,
    seed: number
  ): { x: number; y: number; wallSide: 'north' | 'south' | 'east' | 'west' } | null {
    
    const walls = ['north', 'south', 'east', 'west'];
    const shuffledWalls = this.shuffleArray([...walls], seed);

    for (const wall of shuffledWalls) {
      const occupied = occupiedWallSpace.get(wall)!;
      
      let wallLength: number;
      let startPos: number;

      switch (wall) {
        case 'north':
        case 'south':
          wallLength = room.width - 2; // Account for corners
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
      for (let pos = startPos; pos <= wallLength - fixture.width; pos++) {
        let canPlace = true;
        for (let w = 0; w < fixture.width; w++) {
          if (occupied.has(pos + w)) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          let x: number, y: number;

          switch (wall) {
            case 'north':
              x = room.x + pos;
              y = room.y;
              break;
            case 'south':
              x = room.x + pos;
              y = room.y + room.height - 1;
              break;
            case 'east':
              x = room.x + room.width - 1;
              y = room.y + pos;
              break;
            case 'west':
              x = room.x;
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

  private static findCornerPlacement(
    room: Room,
    fixture: MedievalFixture,
    occupiedWallSpace: Map<string, Set<number>>,
    seed: number
  ): { x: number; y: number } | null {
    
    const corners = [
      { x: room.x + 1, y: room.y + 1 }, // NW
      { x: room.x + room.width - 2, y: room.y + 1 }, // NE
      { x: room.x + 1, y: room.y + room.height - 2 }, // SW
      { x: room.x + room.width - 2, y: room.y + room.height - 2 } // SE
    ];

    const shuffledCorners = this.shuffleArray([...corners], seed);

    for (const corner of shuffledCorners) {
      // Check if corner has enough space
      if (corner.x + fixture.width <= room.x + room.width - 1 &&
          corner.y + fixture.height <= room.y + room.height - 1) {
        return corner;
      }
    }

    return null;
  }

  private static findCenterPlacement(
    room: Room,
    fixture: MedievalFixture,
    seed: number
  ): { x: number; y: number } | null {
    
    const centerX = room.x + Math.floor((room.width - fixture.width) / 2);
    const centerY = room.y + Math.floor((room.height - fixture.height) / 2);

    // Ensure fixture fits within room bounds
    if (centerX + fixture.width <= room.x + room.width - 1 &&
        centerY + fixture.height <= room.y + room.height - 1 &&
        centerX >= room.x + 1 && centerY >= room.y + 1) {
      return { x: centerX, y: centerY };
    }

    return null;
  }

  private static markOccupiedWallSpace(
    fixture: MedievalFixture,
    occupiedWallSpace: Map<string, Set<number>>
  ): void {
    if (!fixture.wallSide) return;

    const occupied = occupiedWallSpace.get(fixture.wallSide)!;
    for (let i = 0; i < fixture.width; i++) {
      occupied.add(fixture.x + i);
    }
  }

  private static ensureEssentialFixtures(
    room: Room,
    buildingType: BuildingType,
    socialClass: SocialClass,
    occupiedWallSpace: Map<string, Set<number>>,
    seed: number
  ): void {
    
    // Every main living room needs a hearth
    if ((room.type === 'living' || room.type === 'common') && 
        !room.fixtures?.some(f => f.type === 'hearth')) {
      
      const hearthTemplate = socialClass === 'poor' ? 
        this.fixtureTemplates.find(f => f.id === 'hearth_small') :
        this.fixtureTemplates.find(f => f.id === 'hearth_large');

      if (hearthTemplate) {
        const placement = this.findWallPlacement(room, hearthTemplate, occupiedWallSpace, seed);
        if (placement) {
          const hearth: MedievalFixture = {
            ...hearthTemplate,
            id: `${hearthTemplate.id}_${room.id}_essential`,
            x: placement.x,
            y: placement.y,
            wallSide: placement.wallSide
          };
          room.fixtures!.push(hearth);

          // Add chimney
          if (!room.chimneys) room.chimneys = [];
          room.chimneys.push({
            x: hearth.x,
            y: hearth.y,
            material: 'brick_fired'
          });
        }
      }
    }

    // Wealthy/noble bedrooms should have washbasins
    if (room.type === 'bedroom' && (socialClass === 'wealthy' || socialClass === 'noble') &&
        !room.fixtures?.some(f => f.type === 'washbasin')) {
      
      const washbasinTemplate = this.fixtureTemplates.find(f => f.id === 'washbasin');
      if (washbasinTemplate) {
        const placement = this.findWallPlacement(room, washbasinTemplate, occupiedWallSpace, seed + 1);
        if (placement) {
          const washbasin: MedievalFixture = {
            ...washbasinTemplate,
            id: `${washbasinTemplate.id}_${room.id}_essential`,
            x: placement.x,
            y: placement.y,
            wallSide: placement.wallSide
          };
          room.fixtures!.push(washbasin);
        }
      }
    }
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

  static getFixtureVisualStyle(fixture: MedievalFixture): {
    color: string;
    borderColor: string;
    icon: string;
    description: string;
  } {
    switch (fixture.type) {
      case 'hearth':
        return {
          color: '#CD853F', // Sandy brown
          borderColor: '#8B4513',
          icon: '🔥',
          description: 'Stone hearth with fire'
        };
      
      case 'privy':
      case 'garderobe':
        return {
          color: '#8B7355', // Dark khaki
          borderColor: '#654321',
          icon: '🚽',
          description: 'Medieval toilet facility'
        };
      
      case 'built_in_storage':
      case 'alcove':
        return {
          color: '#A0522D', // Sienna
          borderColor: '#654321',
          icon: '📦',
          description: 'Built-in storage space'
        };
      
      case 'bread_oven':
        return {
          color: '#B22222', // Fire brick
          borderColor: '#8B0000',
          icon: '🍞',
          description: 'Brick bread oven'
        };
      
      case 'washbasin':
        return {
          color: '#708090', // Slate gray
          borderColor: '#2F4F4F',
          icon: '🫧',
          description: 'Stone washbasin'
        };
      
      case 'well':
        return {
          color: '#4682B4', // Steel blue
          borderColor: '#2F4F4F',
          icon: '🪣',
          description: 'Indoor well'
        };
      
      default:
        return {
          color: '#D2B48C',
          borderColor: '#A0522D',
          icon: '🔨',
          description: 'Medieval fixture'
        };
    }
  }
}