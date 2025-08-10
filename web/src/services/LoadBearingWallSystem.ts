import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { FloorFootprint } from './StructuralEngine';
import { Room } from './ProceduralBuildingGenerator';

export interface LoadBearingWall {
  id: string;
  type: 'exterior' | 'interior_load_bearing' | 'interior_partition' | 'foundation';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number; // in tiles
  material: string;
  supportCapacity: number; // how much load it can bear (floors above)
  structural: boolean; // true if removing this wall would compromise building integrity
  openings?: Array<{
    x: number;
    y: number;
    width: number;
    type: 'door' | 'window' | 'arch';
    reinforcement?: string; // material for lintels/headers
  }>;
  floorLevel: number;
  supportedFloors: number[]; // which floors this wall helps support
}

export interface WallTemplate {
  material: string;
  thickness: number;
  supportCapacity: number;
  cost: number;
  socialClassRequirement: SocialClass[];
  buildingTypes: BuildingType[];
}

export class LoadBearingWallSystem {
  private static wallTemplates: { [key: string]: WallTemplate } = {
    // Foundation walls - essential for all buildings
    stone_foundation: {
      material: 'stone_granite',
      thickness: 2,
      supportCapacity: 4,
      cost: 100,
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      buildingTypes: ['house_small', 'house_large', 'tavern', 'blacksmith', 'shop', 'market_stall']
    },

    // Timber frame with stone - common construction
    timber_stone: {
      material: 'wood_oak',
      thickness: 1,
      supportCapacity: 2,
      cost: 50,
      socialClassRequirement: ['poor', 'common', 'wealthy'],
      buildingTypes: ['house_small', 'house_large', 'tavern', 'shop']
    },

    // Full stone construction - wealthy/noble
    stone_ashlar: {
      material: 'stone_limestone',
      thickness: 2,
      supportCapacity: 3,
      cost: 150,
      socialClassRequirement: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'tavern']
    },

    // Heavy stone - for large buildings
    stone_massive: {
      material: 'stone_granite',
      thickness: 3,
      supportCapacity: 5,
      cost: 200,
      socialClassRequirement: ['noble'],
      buildingTypes: ['house_large', 'tavern']
    },

    // Workshop walls - specialized for heat/heavy use
    workshop_brick: {
      material: 'brick_fired',
      thickness: 2,
      supportCapacity: 2,
      cost: 80,
      socialClassRequirement: ['common', 'wealthy'],
      buildingTypes: ['blacksmith', 'shop']
    }
  };

  static generateLoadBearingWalls(
    floorFootprints: FloorFootprint[],
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): LoadBearingWall[] {
    const walls: LoadBearingWall[] = [];
    
    // Generate foundation walls first
    if (floorFootprints.length > 0) {
      const foundationWalls = this.generateFoundationWalls(floorFootprints[0], buildingType, socialClass, seed);
      walls.push(...foundationWalls);
    }

    // Generate load-bearing walls for each floor
    floorFootprints.forEach((footprint, index) => {
      const floorWalls = this.generateFloorLoadBearingWalls(
        footprint,
        buildingType,
        socialClass,
        index,
        seed + index * 1000
      );
      walls.push(...floorWalls);
    });

    // Calculate structural dependencies
    this.calculateStructuralDependencies(walls, floorFootprints);

    return walls;
  }

  private static generateFoundationWalls(
    groundFootprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): LoadBearingWall[] {
    const walls: LoadBearingWall[] = [];
    const template = this.selectWallTemplate(buildingType, socialClass, 'foundation');
    const usable = groundFootprint.usableArea;

    // Foundation perimeter
    const foundationWalls = [
      // North wall
      {
        id: `foundation_north_${seed}`,
        type: 'foundation' as const,
        x1: usable.x - 1,
        y1: usable.y - 1,
        x2: usable.x + usable.width,
        y2: usable.y - 1,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: -1,
        supportedFloors: [0, 1, 2, 3, 4] // Can support up to 4 floors above
      },
      // South wall
      {
        id: `foundation_south_${seed}`,
        type: 'foundation' as const,
        x1: usable.x - 1,
        y1: usable.y + usable.height,
        x2: usable.x + usable.width,
        y2: usable.y + usable.height,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: -1,
        supportedFloors: [0, 1, 2, 3, 4]
      },
      // East wall
      {
        id: `foundation_east_${seed}`,
        type: 'foundation' as const,
        x1: usable.x + usable.width,
        y1: usable.y - 1,
        x2: usable.x + usable.width,
        y2: usable.y + usable.height,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: -1,
        supportedFloors: [0, 1, 2, 3, 4]
      },
      // West wall
      {
        id: `foundation_west_${seed}`,
        type: 'foundation' as const,
        x1: usable.x - 1,
        y1: usable.y - 1,
        x2: usable.x - 1,
        y2: usable.y + usable.height,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: -1,
        supportedFloors: [0, 1, 2, 3, 4]
      }
    ];

    walls.push(...foundationWalls);
    return walls;
  }

  private static generateFloorLoadBearingWalls(
    footprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    floorIndex: number,
    seed: number
  ): LoadBearingWall[] {
    const walls: LoadBearingWall[] = [];
    const usable = footprint.usableArea;
    const template = this.selectWallTemplate(buildingType, socialClass, 'exterior');

    // Exterior walls
    const exteriorWalls = this.generateExteriorWalls(footprint, template, floorIndex, seed);
    walls.push(...exteriorWalls);

    // Interior load-bearing walls for large buildings
    if (usable.width > 12 || usable.height > 12) {
      const interiorWalls = this.generateInteriorLoadBearingWalls(
        footprint,
        buildingType,
        socialClass,
        floorIndex,
        seed + 500
      );
      walls.push(...interiorWalls);
    }

    return walls;
  }

  private static generateExteriorWalls(
    footprint: FloorFootprint,
    template: WallTemplate,
    floorIndex: number,
    seed: number
  ): LoadBearingWall[] {
    const walls: LoadBearingWall[] = [];
    const usable = footprint.usableArea;

    const exteriorWalls = [
      // North exterior wall
      {
        id: `exterior_north_f${floorIndex}_${seed}`,
        type: 'exterior' as const,
        x1: usable.x,
        y1: usable.y,
        x2: usable.x + usable.width - 1,
        y2: usable.y,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: floorIndex,
        supportedFloors: [floorIndex + 1, floorIndex + 2, floorIndex + 3],
        openings: []
      },
      // South exterior wall
      {
        id: `exterior_south_f${floorIndex}_${seed}`,
        type: 'exterior' as const,
        x1: usable.x,
        y1: usable.y + usable.height - 1,
        x2: usable.x + usable.width - 1,
        y2: usable.y + usable.height - 1,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: floorIndex,
        supportedFloors: [floorIndex + 1, floorIndex + 2, floorIndex + 3],
        openings: []
      },
      // East exterior wall
      {
        id: `exterior_east_f${floorIndex}_${seed}`,
        type: 'exterior' as const,
        x1: usable.x + usable.width - 1,
        y1: usable.y,
        x2: usable.x + usable.width - 1,
        y2: usable.y + usable.height - 1,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: floorIndex,
        supportedFloors: [floorIndex + 1, floorIndex + 2, floorIndex + 3],
        openings: []
      },
      // West exterior wall
      {
        id: `exterior_west_f${floorIndex}_${seed}`,
        type: 'exterior' as const,
        x1: usable.x,
        y1: usable.y,
        x2: usable.x,
        y2: usable.y + usable.height - 1,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: floorIndex,
        supportedFloors: [floorIndex + 1, floorIndex + 2, floorIndex + 3],
        openings: []
      }
    ];

    walls.push(...exteriorWalls);
    return walls;
  }

  private static generateInteriorLoadBearingWalls(
    footprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    floorIndex: number,
    seed: number
  ): LoadBearingWall[] {
    const walls: LoadBearingWall[] = [];
    const usable = footprint.usableArea;
    const template = this.selectWallTemplate(buildingType, socialClass, 'interior');

    // Central load-bearing wall for wide buildings
    if (usable.width > 15) {
      const centralX = usable.x + Math.floor(usable.width / 2);
      
      walls.push({
        id: `interior_central_vertical_f${floorIndex}_${seed}`,
        type: 'interior_load_bearing',
        x1: centralX,
        y1: usable.y + 2,
        x2: centralX,
        y2: usable.y + usable.height - 3,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: floorIndex,
        supportedFloors: [floorIndex + 1, floorIndex + 2],
        openings: [
          // Doorway in middle of wall
          {
            x: centralX,
            y: usable.y + Math.floor(usable.height / 2),
            width: 1,
            type: 'door',
            reinforcement: 'wood_oak'
          }
        ]
      });
    }

    // Horizontal load-bearing wall for tall buildings
    if (usable.height > 15) {
      const centralY = usable.y + Math.floor(usable.height / 2);
      
      walls.push({
        id: `interior_central_horizontal_f${floorIndex}_${seed}`,
        type: 'interior_load_bearing',
        x1: usable.x + 2,
        y1: centralY,
        x2: usable.x + usable.width - 3,
        y2: centralY,
        thickness: template.thickness,
        material: template.material,
        supportCapacity: template.supportCapacity,
        structural: true,
        floorLevel: floorIndex,
        supportedFloors: [floorIndex + 1, floorIndex + 2],
        openings: [
          // Doorway in middle of wall
          {
            x: usable.x + Math.floor(usable.width / 2),
            y: centralY,
            width: 1,
            type: 'door',
            reinforcement: 'wood_oak'
          }
        ]
      });
    }

    return walls;
  }

  private static selectWallTemplate(
    buildingType: BuildingType,
    socialClass: SocialClass,
    wallType: 'foundation' | 'exterior' | 'interior'
  ): WallTemplate {
    
    let preferredTemplates: string[] = [];

    if (wallType === 'foundation') {
      preferredTemplates = ['stone_foundation'];
    } else if (buildingType === 'blacksmith') {
      preferredTemplates = ['workshop_brick', 'timber_stone'];
    } else {
      switch (socialClass) {
        case 'poor':
          preferredTemplates = ['timber_stone'];
          break;
        case 'common':
          preferredTemplates = ['timber_stone', 'stone_ashlar'];
          break;
        case 'wealthy':
          preferredTemplates = ['stone_ashlar', 'stone_massive'];
          break;
        case 'noble':
          preferredTemplates = ['stone_massive', 'stone_ashlar'];
          break;
      }
    }

    // Filter by social class and building type compatibility
    const candidates = preferredTemplates.filter(templateId => {
      const template = this.wallTemplates[templateId];
      return template.socialClassRequirement.includes(socialClass) &&
             template.buildingTypes.includes(buildingType);
    });

    const selectedId = candidates[0] || 'timber_stone';
    return this.wallTemplates[selectedId];
  }

  private static calculateStructuralDependencies(
    walls: LoadBearingWall[],
    footprints: FloorFootprint[]
  ): void {
    
    // Calculate which walls are critical for structural integrity
    const loadBearingWalls = walls.filter(w => w.structural);
    
    loadBearingWalls.forEach(wall => {
      // Calculate actual load this wall bears
      const floorsAbove = footprints.filter(fp => fp.level > wall.floorLevel);
      const loadFactor = floorsAbove.length;
      
      // Ensure wall can support the load
      if (loadFactor > wall.supportCapacity) {
        console.warn(`Wall ${wall.id} may be overloaded: supporting ${loadFactor} floors, capacity ${wall.supportCapacity}`);
      }

      // Update supported floors based on actual capacity
      wall.supportedFloors = wall.supportedFloors.slice(0, wall.supportCapacity);
    });
  }

  static integrateWallsWithRooms(rooms: Room[], walls: LoadBearingWall[], floorLevel: number): void {
    const floorWalls = walls.filter(w => w.floorLevel === floorLevel);
    
    floorWalls.forEach(wall => {
      // Add wall openings to room doors/windows where they intersect
      rooms.forEach(room => {
        if (!wall.openings) return;
        
        wall.openings.forEach(opening => {
          if (opening.x >= room.x && opening.x < room.x + room.width &&
              opening.y >= room.y && opening.y < room.y + room.height) {
            
            if (opening.type === 'door' && !room.doors.some(d => d.x === opening.x && d.y === opening.y)) {
              room.doors.push({
                x: opening.x,
                y: opening.y,
                direction: this.determineOpeningDirection(wall, opening)
              });
            } else if (opening.type === 'window' && !room.windows.some(w => w.x === opening.x && w.y === opening.y)) {
              room.windows.push({
                x: opening.x,
                y: opening.y,
                direction: this.determineOpeningDirection(wall, opening)
              });
            }
          }
        });
      });
    });
  }

  private static determineOpeningDirection(
    wall: LoadBearingWall,
    opening: { x: number; y: number; width: number; type: string }
  ): 'north' | 'south' | 'east' | 'west' {
    
    // Determine wall orientation
    if (wall.x1 === wall.x2) {
      // Vertical wall
      return wall.x1 < opening.x ? 'east' : 'west';
    } else {
      // Horizontal wall
      return wall.y1 < opening.y ? 'south' : 'north';
    }
  }

  static validateStructuralIntegrity(walls: LoadBearingWall[], floorFootprints: FloorFootprint[]): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check foundation support
    const foundationWalls = walls.filter(w => w.type === 'foundation');
    if (foundationWalls.length === 0) {
      issues.push('No foundation walls found - building lacks structural foundation');
      recommendations.push('Add stone foundation walls around building perimeter');
    }

    // Check load distribution
    const loadBearingWalls = walls.filter(w => w.structural);
    floorFootprints.forEach(footprint => {
      if (footprint.level > 0) {
        const supportingWalls = loadBearingWalls.filter(w => 
          w.supportedFloors.includes(footprint.level)
        );
        
        if (supportingWalls.length === 0) {
          issues.push(`Floor ${footprint.level} has no load-bearing wall support`);
          recommendations.push(`Add load-bearing walls or columns to support floor ${footprint.level}`);
        }
      }
    });

    // Check wall material appropriateness
    walls.forEach(wall => {
      const floorsSupported = wall.supportedFloors.length;
      if (floorsSupported > wall.supportCapacity) {
        issues.push(`Wall ${wall.id} is overloaded: supporting ${floorsSupported} floors, capacity ${wall.supportCapacity}`);
        recommendations.push(`Upgrade wall ${wall.id} to stronger material or add additional support`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  static getWallMaterialCost(walls: LoadBearingWall[]): number {
    return walls.reduce((total, wall) => {
      const template = Object.values(this.wallTemplates).find(t => t.material === wall.material);
      const length = Math.abs(wall.x2 - wall.x1) + Math.abs(wall.y2 - wall.y1);
      return total + (template?.cost || 50) * length * wall.thickness;
    }, 0);
  }
}