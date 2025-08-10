import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { FloorFootprint, StructuralFeature } from './StructuralEngine';
import { Room } from './ProceduralBuildingGenerator';

export interface Staircase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'straight' | 'spiral' | 'l-shaped';
  style: 'wooden' | 'stone' | 'grand' | 'narrow';
  servesFloors: number[];
  accessPoints: { floor: number; x: number; y: number; direction: 'up' | 'down' }[];
  materials: {
    steps: string;
    handrail: string;
    supports: string;
  };
  space: {
    clearanceWidth: number; // minimum width around staircase
    clearanceHeight: number; // minimum height around staircase
    headroom: number; // vertical clearance needed
  };
}

export interface StaircaseTemplate {
  minWidth: number;
  minHeight: number;
  preferredWidth: number;
  preferredHeight: number;
  style: Staircase['style'];
  direction: Staircase['direction'];
  materials: Staircase['materials'];
  space: Staircase['space'];
  socialClassRequirement: SocialClass[];
}

export class StaircaseSystem {
  private static templates: { [key: string]: StaircaseTemplate } = {
    // Basic wooden stairs for poor/common
    basic_straight: {
      minWidth: 2,
      minHeight: 3,
      preferredWidth: 2,
      preferredHeight: 4,
      style: 'wooden',
      direction: 'straight',
      materials: {
        steps: 'wood_pine',
        handrail: 'wood_pine', 
        supports: 'wood_pine'
      },
      space: {
        clearanceWidth: 1,
        clearanceHeight: 1,
        headroom: 3
      },
      socialClassRequirement: ['poor', 'common']
    },

    // L-shaped wooden stairs for common/wealthy
    wooden_l_shaped: {
      minWidth: 3,
      minHeight: 3,
      preferredWidth: 4,
      preferredHeight: 4,
      style: 'wooden',
      direction: 'l-shaped',
      materials: {
        steps: 'wood_oak',
        handrail: 'wood_oak',
        supports: 'wood_oak'
      },
      space: {
        clearanceWidth: 1,
        clearanceHeight: 1,
        headroom: 3
      },
      socialClassRequirement: ['common', 'wealthy']
    },

    // Grand stone stairs for wealthy/noble
    grand_stone: {
      minWidth: 4,
      minHeight: 5,
      preferredWidth: 5,
      preferredHeight: 6,
      style: 'grand',
      direction: 'straight',
      materials: {
        steps: 'stone_granite',
        handrail: 'metal_iron',
        supports: 'stone_granite'
      },
      space: {
        clearanceWidth: 2,
        clearanceHeight: 2,
        headroom: 4
      },
      socialClassRequirement: ['wealthy', 'noble']
    },

    // Spiral stairs for towers or tight spaces
    spiral_stone: {
      minWidth: 3,
      minHeight: 3,
      preferredWidth: 4,
      preferredHeight: 4,
      style: 'stone',
      direction: 'spiral',
      materials: {
        steps: 'stone_limestone',
        handrail: 'metal_iron',
        supports: 'stone_limestone'
      },
      space: {
        clearanceWidth: 1,
        clearanceHeight: 1,
        headroom: 3
      },
      socialClassRequirement: ['common', 'wealthy', 'noble']
    },

    // Narrow service stairs for servants
    narrow_wooden: {
      minWidth: 1,
      minHeight: 3,
      preferredWidth: 2,
      preferredHeight: 4,
      style: 'narrow',
      direction: 'straight',
      materials: {
        steps: 'wood_pine',
        handrail: 'wood_pine',
        supports: 'wood_pine'
      },
      space: {
        clearanceWidth: 0,
        clearanceHeight: 0,
        headroom: 2
      },
      socialClassRequirement: ['poor', 'common']
    }
  };

  static enhanceStructuralStaircases(
    footprints: FloorFootprint[],
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): Staircase[] {
    const staircases: Staircase[] = [];
    
    // Find all staircase features from StructuralEngine
    const staircaseFeatures = footprints.flatMap(fp => 
      fp.structuralFeatures.filter(sf => sf.type === 'staircase')
    );

    if (staircaseFeatures.length === 0) return staircases;

    // Select appropriate staircase template
    const template = this.selectStaircaseTemplate(buildingType, socialClass, footprints.length, seed);

    staircaseFeatures.forEach((feature, index) => {
      const staircase: Staircase = {
        id: feature.id,
        x: feature.x,
        y: feature.y,
        width: Math.max(feature.width, template.preferredWidth),
        height: Math.max(feature.height, template.preferredHeight),
        direction: template.direction,
        style: template.style,
        servesFloors: feature.servesFloors,
        accessPoints: this.generateAccessPoints(feature, footprints),
        materials: { ...template.materials },
        space: { ...template.space }
      };

      staircases.push(staircase);
    });

    return staircases;
  }

  private static selectStaircaseTemplate(
    buildingType: BuildingType,
    socialClass: SocialClass,
    totalFloors: number,
    seed: number
  ): StaircaseTemplate {
    
    // Building type preferences
    const buildingPreferences: { [key in BuildingType]: string[] } = {
      house_small: ['basic_straight', 'narrow_wooden'],
      house_large: ['wooden_l_shaped', 'basic_straight', 'grand_stone'],
      tavern: ['wooden_l_shaped', 'basic_straight'],
      blacksmith: ['basic_straight', 'narrow_wooden'],
      shop: ['wooden_l_shaped', 'basic_straight'],
      market_stall: ['basic_straight'] // Usually single story
    };

    // Filter by social class and building type
    const candidates = buildingPreferences[buildingType].filter(templateId => {
      const template = this.templates[templateId];
      return template.socialClassRequirement.includes(socialClass);
    });

    if (candidates.length === 0) {
      return this.templates.basic_straight; // Fallback
    }

    // Special case: Use spiral for 3+ floors and adequate space
    if (totalFloors >= 3 && (socialClass === 'wealthy' || socialClass === 'noble')) {
      return this.templates.spiral_stone;
    }

    // Use seed for consistent selection
    const index = this.seedRandom(seed) * candidates.length;
    const selectedId = candidates[Math.floor(index)];
    
    return this.templates[selectedId];
  }

  private static generateAccessPoints(
    feature: StructuralFeature,
    footprints: FloorFootprint[]
  ): { floor: number; x: number; y: number; direction: 'up' | 'down' }[] {
    const accessPoints: { floor: number; x: number; y: number; direction: 'up' | 'down' }[] = [];

    feature.servesFloors.forEach(floor => {
      const footprint = footprints.find(fp => fp.level === floor);
      if (!footprint) return;

      // Add access point at the bottom of the staircase for going up
      if (floor < Math.max(...feature.servesFloors)) {
        accessPoints.push({
          floor,
          x: feature.x,
          y: feature.y + feature.height - 1,
          direction: 'up'
        });
      }

      // Add access point at the top of the staircase for going down
      if (floor > Math.min(...feature.servesFloors)) {
        accessPoints.push({
          floor,
          x: feature.x,
          y: feature.y,
          direction: 'down'
        });
      }
    });

    return accessPoints;
  }

  static integrateStaircasesIntoRooms(
    rooms: Room[],
    staircases: Staircase[],
    floorLevel: number
  ): void {
    
    staircases.forEach(staircase => {
      if (!staircase.servesFloors.includes(floorLevel)) return;

      // Find which room contains this staircase
      const containingRoom = rooms.find(room =>
        staircase.x >= room.x && 
        staircase.x < room.x + room.width &&
        staircase.y >= room.y && 
        staircase.y < room.y + room.height &&
        room.floor === floorLevel
      );

      if (containingRoom) {
        // Add staircase access points to the room
        if (!containingRoom.stairs) {
          containingRoom.stairs = [];
        }

        const accessPoints = staircase.accessPoints.filter(ap => ap.floor === floorLevel);
        accessPoints.forEach(ap => {
          containingRoom.stairs!.push({
            x: ap.x,
            y: ap.y,
            direction: ap.direction,
            targetFloor: ap.direction === 'up' ? floorLevel + 1 : floorLevel - 1
          });
        });

        // Mark staircase area as occupied in room tiles
        this.markStaircaseInTiles(containingRoom, staircase);
      }
    });
  }

  private static markStaircaseInTiles(room: Room, staircase: Staircase): void {
    if (!room.tiles) return;

    // Mark tiles occupied by staircase
    for (let y = staircase.y; y < staircase.y + staircase.height; y++) {
      for (let x = staircase.x; x < staircase.x + staircase.width; x++) {
        const tile = room.tiles.find(t => t.x === x && t.y === y);
        if (tile) {
          tile.type = 'staircase';
          tile.material = staircase.materials.steps;
          tile.staircaseId = staircase.id;
          tile.staircaseStyle = staircase.style;
        }
      }
    }
  }

  static validateStaircasePlacement(
    staircases: Staircase[],
    footprints: FloorFootprint[]
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    staircases.forEach(staircase => {
      // Check if staircase fits within floor footprints
      staircase.servesFloors.forEach(floor => {
        const footprint = footprints.find(fp => fp.level === floor);
        if (!footprint) return;

        const staircaseRight = staircase.x + staircase.width;
        const staircaseBottom = staircase.y + staircase.height;
        const footprintRight = footprint.usableArea.x + footprint.usableArea.width;
        const footprintBottom = footprint.usableArea.y + footprint.usableArea.height;

        if (staircase.x < footprint.usableArea.x || 
            staircase.y < footprint.usableArea.y ||
            staircaseRight > footprintRight ||
            staircaseBottom > footprintBottom) {
          issues.push(`Staircase ${staircase.id} extends beyond floor ${floor} boundaries`);
        }
      });

      // Check clearance requirements
      const hasAdequateClearance = this.checkStaircaseClearance(staircase, footprints);
      if (!hasAdequateClearance) {
        issues.push(`Staircase ${staircase.id} lacks adequate clearance space`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private static checkStaircaseClearance(
    staircase: Staircase,
    footprints: FloorFootprint[]
  ): boolean {
    // Simple clearance check - ensure there's space around the staircase
    const clearanceX = staircase.x - staircase.space.clearanceWidth;
    const clearanceY = staircase.y - staircase.space.clearanceHeight;
    const clearanceWidth = staircase.width + (staircase.space.clearanceWidth * 2);
    const clearanceHeight = staircase.height + (staircase.space.clearanceHeight * 2);

    // Check if clearance area fits in at least one served floor
    return staircase.servesFloors.some(floor => {
      const footprint = footprints.find(fp => fp.level === floor);
      if (!footprint) return false;

      return clearanceX >= footprint.usableArea.x &&
             clearanceY >= footprint.usableArea.y &&
             clearanceX + clearanceWidth <= footprint.usableArea.x + footprint.usableArea.width &&
             clearanceY + clearanceHeight <= footprint.usableArea.y + footprint.usableArea.height;
    });
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}