import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';

export interface StructuralConstraints {
  maxFloorReduction: number; // Percentage reduction per floor
  minFloorSize: { width: number; height: number };
  maxOverhang: number; // Tiles upper floor can extend beyond lower
  requiresSupport: boolean; // Whether large rooms need interior support
  loadBearingWallThickness: number;
  partitionWallThickness: number;
}

export interface FloorFootprint {
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
  usableArea: { x: number; y: number; width: number; height: number };
  structuralFeatures: StructuralFeature[];
}

export interface StructuralFeature {
  id: string;
  type: 'staircase' | 'chimney' | 'support_pillar' | 'load_bearing_wall';
  x: number;
  y: number;
  width: number;
  height: number;
  servesFloors: number[]; // Which floors this feature affects
  required: boolean;
}

export class StructuralEngine {
  private static constraints: { [key in BuildingType]: StructuralConstraints } = {
    house_small: {
      maxFloorReduction: 0.15, // 15% smaller per floor
      minFloorSize: { width: 6, height: 6 },
      maxOverhang: 1,
      requiresSupport: false,
      loadBearingWallThickness: 1,
      partitionWallThickness: 1
    },
    
    house_large: {
      maxFloorReduction: 0.20, // 20% smaller per floor  
      minFloorSize: { width: 8, height: 8 },
      maxOverhang: 0, // No overhang for large houses
      requiresSupport: true,
      loadBearingWallThickness: 1,
      partitionWallThickness: 1
    },
    
    tavern: {
      maxFloorReduction: 0.25, // 25% smaller per floor
      minFloorSize: { width: 10, height: 8 },
      maxOverhang: 0,
      requiresSupport: true,
      loadBearingWallThickness: 2, // Thicker walls for commercial
      partitionWallThickness: 1
    },
    
    blacksmith: {
      maxFloorReduction: 0.30, // 30% smaller per floor
      minFloorSize: { width: 8, height: 6 },
      maxOverhang: 0,
      requiresSupport: true,
      loadBearingWallThickness: 2, // Heavy equipment
      partitionWallThickness: 1
    },
    
    shop: {
      maxFloorReduction: 0.20,
      minFloorSize: { width: 6, height: 6 },
      maxOverhang: 1,
      requiresSupport: false,
      loadBearingWallThickness: 1,
      partitionWallThickness: 1
    },
    
    market_stall: {
      maxFloorReduction: 0,
      minFloorSize: { width: 4, height: 3 },
      maxOverhang: 0,
      requiresSupport: false,
      loadBearingWallThickness: 1,
      partitionWallThickness: 1
    }
  };

  static calculateFloorFootprints(
    buildingType: BuildingType,
    groundFloor: { x: number; y: number; width: number; height: number },
    totalFloors: number,
    hasBasement: boolean,
    seed: number
  ): FloorFootprint[] {
    
    const constraints = this.constraints[buildingType];
    const footprints: FloorFootprint[] = [];
    
    // Basement (if exists) - same size or slightly larger than ground floor
    if (hasBasement) {
      const basementFootprint: FloorFootprint = {
        level: -1,
        x: groundFloor.x - 1, // Slightly larger for foundations
        y: groundFloor.y - 1,
        width: groundFloor.width + 2,
        height: groundFloor.height + 2,
        usableArea: {
          x: groundFloor.x,
          y: groundFloor.y,
          width: groundFloor.width,
          height: groundFloor.height
        },
        structuralFeatures: []
      };
      
      footprints.push(basementFootprint);
    }

    // Ground floor
    const groundFootprint: FloorFootprint = {
      level: 0,
      x: groundFloor.x,
      y: groundFloor.y,
      width: groundFloor.width,
      height: groundFloor.height,
      usableArea: {
        x: groundFloor.x + 1,
        y: groundFloor.y + 1,
        width: groundFloor.width - 2,
        height: groundFloor.height - 2
      },
      structuralFeatures: []
    };
    
    footprints.push(groundFootprint);

    // Upper floors - progressively smaller
    for (let level = 1; level < totalFloors; level++) {
      const reductionFactor = Math.pow(1 - constraints.maxFloorReduction, level);
      const prevFloor = footprints[footprints.length - 1];
      
      // Calculate new dimensions
      let newWidth = Math.floor(groundFloor.width * reductionFactor);
      let newHeight = Math.floor(groundFloor.height * reductionFactor);
      
      // Ensure minimum size
      newWidth = Math.max(newWidth, constraints.minFloorSize.width);
      newHeight = Math.max(newHeight, constraints.minFloorSize.height);
      
      // Center the floor on the one below (or allow slight overhang)
      const offsetX = Math.floor((prevFloor.width - newWidth) / 2);
      const offsetY = Math.floor((prevFloor.height - newHeight) / 2);
      
      const upperFootprint: FloorFootprint = {
        level,
        x: prevFloor.x + offsetX,
        y: prevFloor.y + offsetY,
        width: newWidth,
        height: newHeight,
        usableArea: {
          x: prevFloor.x + offsetX + 1,
          y: prevFloor.y + offsetY + 1,
          width: newWidth - 2,
          height: newHeight - 2
        },
        structuralFeatures: []
      };
      
      footprints.push(upperFootprint);
    }

    // Add structural features to all floors
    this.addStructuralFeatures(footprints, buildingType, seed);
    
    return footprints;
  }

  private static addStructuralFeatures(
    footprints: FloorFootprint[],
    buildingType: BuildingType,
    seed: number
  ): void {
    
    const constraints = this.constraints[buildingType];
    const multiStory = footprints.length > 1;
    
    if (!multiStory) return;

    // Add staircase - must be present on all floors except top
    const staircaseSize = { width: 2, height: 3 };
    const groundFloor = footprints.find(f => f.level === 0);
    if (!groundFloor) return;

    // Place staircase in corner or along wall, ensuring it fits within bounds
    const staircaseX = groundFloor.usableArea.x + 1; // Leave some margin
    const staircaseY = Math.max(
      groundFloor.usableArea.y + 1, 
      groundFloor.usableArea.y + groundFloor.usableArea.height - staircaseSize.height - 1
    );

    footprints.forEach((floor, index) => {
      if (floor.level < footprints.length - 1) { // Not top floor
        // Ensure staircase fits within this floor's usable area
        const floorBounds = floor.usableArea;
        const fitsX = staircaseX + staircaseSize.width <= floorBounds.x + floorBounds.width - 1;
        const fitsY = staircaseY + staircaseSize.height <= floorBounds.y + floorBounds.height - 1;
        
        if (fitsX && fitsY) {
          const staircase: StructuralFeature = {
            id: `stairs_${floor.level}`,
            type: 'staircase',
            x: staircaseX,
            y: staircaseY,
            width: staircaseSize.width,
            height: staircaseSize.height,
            servesFloors: [floor.level, floor.level + 1],
            required: true
          };
          
          floor.structuralFeatures.push(staircase);
        }
      }
    });

    // Add chimney for heating (goes through all floors)
    if (buildingType !== 'market_stall') {
      const chimneyX = groundFloor.usableArea.x + Math.floor(groundFloor.usableArea.width / 2);
      const chimneyY = groundFloor.usableArea.y + 1;

      footprints.forEach(floor => {
        const chimney: StructuralFeature = {
          id: `chimney_${floor.level}`,
          type: 'chimney',
          x: chimneyX,
          y: chimneyY,
          width: 1,
          height: 1,
          servesFloors: footprints.map(f => f.level),
          required: true
        };
        
        floor.structuralFeatures.push(chimney);
      });
    }

    // Add support pillars for large rooms
    if (constraints.requiresSupport) {
      footprints.forEach(floor => {
        const roomArea = floor.usableArea.width * floor.usableArea.height;
        if (roomArea > 64) { // Rooms larger than 8x8 need support
          
          const pillarSpacing = 6;
          for (let x = floor.usableArea.x + pillarSpacing; x < floor.usableArea.x + floor.usableArea.width; x += pillarSpacing) {
            for (let y = floor.usableArea.y + pillarSpacing; y < floor.usableArea.y + floor.usableArea.height; y += pillarSpacing) {
              
              const pillar: StructuralFeature = {
                id: `pillar_${floor.level}_${x}_${y}`,
                type: 'support_pillar',
                x,
                y,
                width: 1,
                height: 1,
                servesFloors: [floor.level],
                required: true
              };
              
              floor.structuralFeatures.push(pillar);
            }
          }
        }
      });
    }
  }

  static validateFloorStructure(footprints: FloorFootprint[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check floor size progression
    for (let i = 1; i < footprints.length; i++) {
      const lower = footprints[i - 1];
      const upper = footprints[i];
      
      if (upper.level > lower.level) { // Going up
        if (upper.width > lower.width || upper.height > lower.height) {
          issues.push(`Floor ${upper.level} is larger than floor ${lower.level} - structurally impossible`);
        }
      }
    }

    // Check for required structural features
    const multiStory = footprints.some(f => f.level > 0);
    if (multiStory) {
      const hasStaircase = footprints.some(f => f.structuralFeatures.some(sf => sf.type === 'staircase'));
      if (!hasStaircase) {
        issues.push('Multi-story building missing staircase');
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  static getConstraints(buildingType: BuildingType): StructuralConstraints {
    return this.constraints[buildingType];
  }
}