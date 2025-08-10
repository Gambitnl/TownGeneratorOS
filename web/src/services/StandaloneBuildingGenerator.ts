import { BuildingPlan, Room, ExteriorFeature, RoomTile, RoomFurniture, Floor } from './ProceduralBuildingGenerator';
import { MaterialLibrary, Material } from './MaterialLibrary';
import { FurnitureLibrary, FurnitureItem } from './FurnitureLibrary';
import { AestheticsSystem, BuildingAesthetics } from './AestheticsSystem';
import { BuildingTemplates, BuildingTemplate, RoomTemplate } from './BuildingTemplates';
import { FloorMaterialSystem, RoomFunction } from './FloorMaterialSystem';
import { RoomLayoutEngine } from './RoomLayoutEngine';
import { StructuralEngine, FloorFootprint } from './StructuralEngine';
import { RoomNamingSystem } from './RoomNamingSystem';
import { StaircaseSystem, Staircase } from './StaircaseSystem';
import { HallwaySystem, Hallway } from './HallwaySystem';
import { MedievalFixturesSystem } from './MedievalFixturesSystem';
import { LoadBearingWallSystem } from './LoadBearingWallSystem';
import { ExteriorArchitecturalSystem } from './ExteriorArchitecturalSystem';
import { InteriorDecorationSystem } from './InteriorDecorationSystem';
import { MedievalBuildingCodes } from './MedievalBuildingCodes';
import { RealisticFurnitureLibrary, PlacedFurniture } from './RealisticFurnitureLibrary';

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
  climate?: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry';
  age?: number; // Years since construction
  condition?: 'new' | 'good' | 'worn' | 'poor' | 'ruins';
  stories?: number; // Number of floors above ground
  basement?: boolean; // Include basement level
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  culturalInfluence?: string;
}

export class StandaloneBuildingGenerator {
  private static MIN_ROOM_SIZE = 4; // Minimum room size in tiles
  private static MAX_BUILDING_SIZE = 40; // Maximum building size in tiles

  static generateBuilding(options: BuildingOptions): BuildingPlan {
    const { 
      buildingType, 
      socialClass, 
      seed, 
      lotSize,
      climate = 'temperate',
      age = this.randomInRange(0, 50, seed + 10),
      condition = 'good',
      stories = this.determineStories(buildingType, socialClass, seed + 11),
      basement = this.shouldHaveBasement(buildingType, socialClass, seed + 12),
      season = 'summer',
      culturalInfluence = 'human'
    } = options;

    // Generate or use provided lot size
    const lot = lotSize || this.generateLotSize(buildingType, socialClass, seed);
    
    // Generate building footprint within lot
    const building = this.generateBuildingSize(buildingType, lot, seed + 1);
    
    // Choose building materials using the new material system
    const materials = this.chooseMaterialsAdvanced(buildingType, socialClass, climate, seed + 2);
    
    // Reset room naming for this building
    RoomNamingSystem.resetNamingForBuilding(`building_${seed}`);
    
    // Calculate proper floor footprints using structural engineering
    const floorFootprints = StructuralEngine.calculateFloorFootprints(
      buildingType,
      building,
      stories,
      basement,
      seed + 3
    );
    
    // Validate structural integrity
    const validation = StructuralEngine.validateFloorStructure(floorFootprints);
    if (!validation.valid) {
      console.warn('Structural validation issues:', validation.issues);
    }
    
    // Generate enhanced staircases from structural features (only for multi-story buildings)
    let staircases: Staircase[] = [];
    if (floorFootprints.length > 1) {
      staircases = StaircaseSystem.enhanceStructuralStaircases(
        floorFootprints,
        buildingType,
        socialClass,
        seed + 2
      );
      
      // Validate staircase placement
      const staircaseValidation = StaircaseSystem.validateStaircasePlacement(staircases, floorFootprints);
      if (!staircaseValidation.valid) {
        console.warn('Staircase placement issues:', staircaseValidation.issues);
      }
    }
    
    // Generate load-bearing wall system for structural integrity
    const loadBearingWalls = LoadBearingWallSystem.generateLoadBearingWalls(
      floorFootprints,
      buildingType,
      socialClass,
      seed + 4
    );
    
    // Validate structural integrity
    const structuralValidation = LoadBearingWallSystem.validateStructuralIntegrity(loadBearingWalls, floorFootprints);
    if (!structuralValidation.valid) {
      console.warn('Structural integrity issues:', structuralValidation.issues);
      console.info('Recommendations:', structuralValidation.recommendations);
    }
    
    // Generate multi-story floors with proper sizing
    const floors = this.generateFloorsWithFootprints(
      buildingType, 
      floorFootprints, 
      socialClass, 
      climate, 
      seed + 3,
      staircases,
      loadBearingWalls
    );
    
    // Generate rooms for backward compatibility
    const allRooms = floors.flatMap(floor => floor.rooms);
    
    // Add realistic furniture to all rooms with proper orientation
    floors.forEach(floor => {
      floor.rooms.forEach((room, index) => {
        room.furniture = this.generateRealisticFurniture(room, socialClass, seed + 100 + index);
        
        // Add medieval fixtures to rooms
        MedievalFixturesSystem.addFixturesToRoom(
          room,
          buildingType,
          socialClass,
          floor.level,
          seed + 200 + index
        );

        // Add interior decorations and lighting
        InteriorDecorationSystem.decorateRoom(
          room,
          buildingType,
          socialClass,
          floor.level,
          seed + 300 + index
        );
      });
    });

    // Generate exterior architectural elements
    const exteriorElements = ExteriorArchitecturalSystem.generateExteriorElements(
      floorFootprints,
      allRooms,
      buildingType,
      socialClass,
      seed + 5
    );

    // Integrate exterior elements with rooms
    ExteriorArchitecturalSystem.integrateExteriorElements(allRooms, exteriorElements);

    // Generate roof structures
    const roofStructures = ExteriorArchitecturalSystem.generateRoofStructures(
      floorFootprints,
      buildingType,
      socialClass,
      seed + 6
    );

    // Generate exterior features
    const exteriorFeatures = this.generateExteriorFeatures(buildingType, lot, building, seed + 4);

    // Calculate total building height
    const totalBuildingHeight = floors.reduce((sum, floor) => sum + floor.height, 0);

    // Generate comprehensive building aesthetics
    const aesthetics = AestheticsSystem.generateBuildingAesthetics(
      `building_${seed}`,
      buildingType,
      socialClass,
      age,
      condition,
      climate,
      season,
      culturalInfluence,
      allRooms,
      seed + 1000
    );

    // Validate building against medieval building codes
    const buildingPlan = {
      id: `building_${seed}`,
      buildingType,
      socialClass,
      lotWidth: lot.width,
      lotHeight: lot.height,
      buildingWidth: building.width,
      buildingHeight: building.height,
      buildingX: building.x,
      buildingY: building.y,
      floors,
      totalBuildingHeight,
      rooms: allRooms,
      exteriorFeatures,
      exteriorElements: exteriorElements.map(el => ({
        id: el.id,
        type: el.type,
        name: el.name,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        floorLevel: el.floorLevel
      })),
      roofStructures: roofStructures.map(rs => ({
        id: rs.id,
        type: rs.type,
        material: rs.material,
        pitch: rs.pitch
      })),
      wallMaterial: materials.wall.name,
      roofMaterial: materials.roof.name,
      foundationMaterial: materials.foundation.name,
      condition,
      age,
      climate,
      aesthetics
    };

    // Validate against medieval building codes
    const codeValidation = MedievalBuildingCodes.validateBuilding(
      allRooms,
      buildingPlan,
      buildingType,
      socialClass
    );

    // Log code validation results
    if (codeValidation.violations.length > 0) {
      console.warn(`Building code violations found (${codeValidation.compliance.overall}% compliance):`);
      codeValidation.violations.forEach(violation => {
        console.warn(`- ${violation.description}: ${violation.recommendation}`);
      });
      
      // Generate compliance report
      const report = MedievalBuildingCodes.generateComplianceReport(
        codeValidation.violations,
        codeValidation.compliance
      );
      console.info('Building Code Compliance Report:\n', report);

      // Attempt automatic fixes for critical violations
      const fixes = MedievalBuildingCodes.automaticallyFixViolations(allRooms, codeValidation.violations);
      if (fixes.fixed > 0) {
        console.info(`Automatically fixed ${fixes.fixed} code violations:`, fixes.recommendations);
      }
    } else {
      console.info(`✅ Building meets all medieval building codes (${codeValidation.compliance.overall}% compliance)`);
    }

    return buildingPlan;
  }

  private static generateLotSize(
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): { width: number; height: number } {
    const template = BuildingTemplates.getTemplate(buildingType);
    
    const classMultiplier: Record<SocialClass, number> = {
      poor: 0.85,
      common: 1.0,
      wealthy: 1.2,
      noble: 1.4
    };

    const multiplier = classMultiplier[socialClass];
    
    const minWidth = Math.ceil(template.minLotWidth * multiplier);
    const maxWidth = Math.ceil(template.maxLotWidth * multiplier);
    const minHeight = Math.ceil(template.minLotHeight * multiplier);
    const maxHeight = Math.ceil(template.maxLotHeight * multiplier);
    
    const width = this.randomInRange(minWidth, maxWidth, seed);
    const height = this.randomInRange(minHeight, maxHeight, seed + 1);

    return { 
      width: Math.min(width, this.MAX_BUILDING_SIZE), 
      height: Math.min(height, this.MAX_BUILDING_SIZE) 
    };
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

  private static determineStories(buildingType: BuildingType, socialClass: SocialClass, seed: number): number {
    const baseStories = {
      house_small: 1,
      house_large: 2,
      tavern: 2,
      blacksmith: 1,
      shop: 2,
      market_stall: 1
    };

    const classModifier = {
      poor: 0,
      common: 0,
      wealthy: 1,
      noble: 1
    };

    const maxStories = Math.min(4, baseStories[buildingType] + classModifier[socialClass]);
    return this.randomInRange(baseStories[buildingType], maxStories, seed);
  }

  private static shouldHaveBasement(buildingType: BuildingType, socialClass: SocialClass, seed: number): boolean {
    const basementChance = {
      house_small: 0.2,
      house_large: 0.6,
      tavern: 0.8,
      blacksmith: 0.4,
      shop: 0.5,
      market_stall: 0.1
    };

    const classMultiplier = {
      poor: 0.5,
      common: 1.0,
      wealthy: 1.5,
      noble: 2.0
    };

    return this.seedRandom(seed) < (basementChance[buildingType] * classMultiplier[socialClass]);
  }

  private static chooseMaterialsAdvanced(
    buildingType: BuildingType,
    socialClass: SocialClass,
    climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry',
    seed: number
  ): { wall: Material; roof: Material; foundation: Material } {
    const budget = { poor: 1.0, common: 2.0, wealthy: 4.0, noble: 8.0 }[socialClass];

    const wallMaterial = MaterialLibrary.getBestMaterialForConditions('wall', socialClass, climate, budget);
    const roofMaterial = MaterialLibrary.getBestMaterialForConditions('roof', socialClass, climate, budget);
    const foundationMaterial = MaterialLibrary.getBestMaterialForConditions('foundation', socialClass, climate, budget);

    // Fallback to basic materials if none found
    return {
      wall: wallMaterial || MaterialLibrary.getMaterial('wood_pine')!,
      roof: roofMaterial || MaterialLibrary.getMaterial('thatch')!,
      foundation: foundationMaterial || MaterialLibrary.getMaterial('stone_limestone')!
    };
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

  private static generateFloorsWithFootprints(
    buildingType: BuildingType,
    floorFootprints: FloorFootprint[],
    socialClass: SocialClass,
    climate: string,
    seed: number,
    staircases?: Staircase[],
    loadBearingWalls?: any[]
  ): Floor[] {
    const floors: Floor[] = [];

    floorFootprints.forEach((footprint, index) => {
      const floorRooms = this.generateRoomsForFootprint(
        buildingType,
        footprint,
        socialClass,
        climate,
        seed + footprint.level * 1000
      );

      // Generate hallways for better room connections
      const hallways = HallwaySystem.generateHallways(
        floorRooms,
        footprint,
        buildingType,
        socialClass,
        seed + footprint.level * 2000
      );

      // Integrate hallways into room connections
      if (hallways.length > 0) {
        HallwaySystem.integrateHallwaysIntoRooms(floorRooms, hallways);
      }

      // Integrate staircases into rooms if provided
      if (staircases) {
        StaircaseSystem.integrateStaircasesIntoRooms(floorRooms, staircases, footprint.level);
      }

      // Integrate load-bearing walls with rooms
      if (loadBearingWalls) {
        LoadBearingWallSystem.integrateWallsWithRooms(floorRooms, loadBearingWalls, footprint.level);
      }

      floors.push({
        level: footprint.level,
        rooms: floorRooms,
        height: footprint.level === 0 ? 3 : footprint.level === -1 ? 3 : 2.5,
        hallways: hallways.map(hallway => ({
          id: hallway.id,
          x: hallway.x,
          y: hallway.y,
          width: hallway.width,
          height: hallway.height,
          type: hallway.type
        }))
      });
    });

    return floors;
  }

  private static generateRoomsForFootprint(
    buildingType: BuildingType,
    footprint: FloorFootprint,
    socialClass: SocialClass,
    climate: string,
    seed: number
  ): Room[] {
    const buildingId = `building_${seed}`;
    
    if (footprint.level === -1) {
      // Basement level - use existing basement generation but with footprint dimensions
      return this.generateBasementRoomsWithFootprint(footprint, socialClass, climate, buildingId, seed);
    } else if (footprint.level === 0) {
      // Ground floor - use existing room layout but constrained to footprint
      const building = {
        x: footprint.usableArea.x,
        y: footprint.usableArea.y,
        width: footprint.usableArea.width,
        height: footprint.usableArea.height
      };
      const rooms = this.generateRoomLayout(buildingType, building, socialClass, climate, seed);
      rooms.forEach(room => {
        room.floor = 0;
        // Apply intelligent room naming
        const roomFunction = this.mapRoomTypeToFunction(room.type);
        room.name = RoomNamingSystem.generateRoomName(
          roomFunction,
          footprint.level,
          buildingType,
          socialClass,
          buildingId,
          seed
        );
      });
      return rooms;
    } else {
      // Upper floors - generate rooms within footprint constraints
      return this.generateUpperFloorRoomsWithFootprint(footprint, socialClass, climate, buildingType, buildingId, seed);
    }
  }

  private static generateBasementRoomsWithFootprint(
    footprint: FloorFootprint,
    socialClass: SocialClass,
    climate: string,
    buildingId: string,
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    const usable = footprint.usableArea;
    
    if (usable.width >= 6 && usable.height >= 6) {
      // Split basement into storage and cellar
      const storageWidth = Math.floor(usable.width / 2);
      
      // Storage room
      const storageRoom: Room = {
        id: 'basement_storage',
        name: RoomNamingSystem.generateRoomName('storage', -1, 'house_large', socialClass, buildingId, seed),
        type: 'storage',
        x: usable.x,
        y: usable.y,
        width: storageWidth,
        height: usable.height,
        floor: -1,
        tiles: this.generateRoomTiles(usable.x, usable.y, storageWidth, usable.height, 'storage', socialClass, climate, seed),
        furniture: [],
        doors: [{ x: usable.x + storageWidth, y: usable.y + Math.floor(usable.height/2), direction: 'east' }],
        windows: []
      };
      rooms.push(storageRoom);

      // Cellar room
      const cellarRoom: Room = {
        id: 'basement_cellar',
        name: RoomNamingSystem.generateRoomName('cellar', -1, 'house_large', socialClass, buildingId, seed + 1),
        type: 'cellar',
        x: usable.x + storageWidth,
        y: usable.y,
        width: usable.width - storageWidth,
        height: usable.height,
        floor: -1,
        tiles: this.generateRoomTiles(usable.x + storageWidth, usable.y, usable.width - storageWidth, usable.height, 'cellar', socialClass, climate, seed + 1),
        furniture: [],
        doors: [{ x: usable.x + storageWidth, y: usable.y + Math.floor(usable.height/2), direction: 'west' }],
        windows: []
      };
      rooms.push(cellarRoom);
    } else {
      // Single basement room
      const mainRoom: Room = {
        id: 'basement_main',
        name: RoomNamingSystem.generateRoomName('cellar', -1, 'house_large', socialClass, buildingId, seed),
        type: 'storage',
        x: usable.x,
        y: usable.y,
        width: usable.width,
        height: usable.height,
        floor: -1,
        tiles: this.generateRoomTiles(usable.x, usable.y, usable.width, usable.height, 'cellar', socialClass, climate, seed),
        furniture: [],
        doors: [{ x: usable.x + Math.floor(usable.width/2), y: usable.y + usable.height - 1, direction: 'south' }],
        windows: []
      };
      rooms.push(mainRoom);
    }

    return rooms;
  }

  private static generateUpperFloorRoomsWithFootprint(
    footprint: FloorFootprint,
    socialClass: SocialClass,
    climate: string,
    buildingType: BuildingType,
    buildingId: string,
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    const usable = footprint.usableArea;
    
    // Reserve space for structural features
    const reservedSpaces = footprint.structuralFeatures.map(feature => ({
      x: feature.x,
      y: feature.y,
      width: feature.width,
      height: feature.height
    }));

    // Upper floors are typically divided into bedrooms and studies
    const roomWidth = Math.max(4, Math.floor(usable.width / 2));
    const roomHeight = Math.max(4, usable.height - 2); // Leave space for walls

    // Generate 1-2 rooms per upper floor based on size
    if (usable.width >= 10) {
      // Two rooms side by side
      const room1: Room = {
        id: `floor${footprint.level}_room1`,
        name: RoomNamingSystem.generateRoomName('bedroom', footprint.level, buildingType, socialClass, buildingId, seed),
        type: 'bedroom',
        x: usable.x,
        y: usable.y,
        width: roomWidth,
        height: roomHeight,
        floor: footprint.level,
        tiles: this.generateRoomTiles(usable.x, usable.y, roomWidth, roomHeight, 'bedroom', socialClass, climate, seed),
        furniture: [],
        doors: [{ x: usable.x + roomWidth, y: usable.y + Math.floor(roomHeight/2), direction: 'east' }],
        windows: [{ x: usable.x, y: usable.y - 1, direction: 'north' }]
      };
      rooms.push(room1);

      const room2Type = (socialClass === 'noble' || socialClass === 'wealthy') ? 'office' : 'bedroom';
      const room2: Room = {
        id: `floor${footprint.level}_room2`,
        name: RoomNamingSystem.generateRoomName(room2Type, footprint.level, buildingType, socialClass, buildingId, seed + 1),
        type: room2Type === 'office' ? 'study' : 'bedroom',
        x: usable.x + roomWidth,
        y: usable.y,
        width: usable.width - roomWidth,
        height: roomHeight,
        floor: footprint.level,
        tiles: this.generateRoomTiles(usable.x + roomWidth, usable.y, usable.width - roomWidth, roomHeight, room2Type, socialClass, climate, seed + 1),
        furniture: [],
        doors: [{ x: usable.x + roomWidth, y: usable.y + Math.floor(roomHeight/2), direction: 'west' }],
        windows: [{ x: usable.x + usable.width - 1, y: usable.y + 2, direction: 'east' }]
      };
      rooms.push(room2);
    } else {
      // Single room
      const singleRoom: Room = {
        id: `floor${footprint.level}_main`,
        name: RoomNamingSystem.generateRoomName('bedroom', footprint.level, buildingType, socialClass, buildingId, seed),
        type: 'bedroom',
        x: usable.x,
        y: usable.y,
        width: usable.width,
        height: usable.height,
        floor: footprint.level,
        tiles: this.generateRoomTiles(usable.x, usable.y, usable.width, usable.height, 'bedroom', socialClass, climate, seed),
        furniture: [],
        doors: [{ x: usable.x + Math.floor(usable.width/2), y: usable.y + usable.height - 1, direction: 'south' }],
        windows: [{ x: usable.x, y: usable.y - 1, direction: 'north' }]
      };
      rooms.push(singleRoom);
    }

    return rooms;
  }

  private static mapRoomTypeToFunction(roomType: string): RoomFunction {
    const mapping: { [key: string]: RoomFunction } = {
      'bedroom': 'bedroom',
      'kitchen': 'kitchen',
      'common': 'common',
      'storage': 'storage',
      'workshop': 'workshop',
      'shop': 'shop_floor',
      'tavern': 'tavern_hall',
      'cellar': 'cellar',
      'study': 'office'
    };
    return mapping[roomType] || 'common';
  }

  private static generateFloors(
    buildingType: BuildingType,
    building: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    stories: number,
    hasBasement: boolean,
    seed: number
  ): Floor[] {
    const floors: Floor[] = [];

    // Generate basement if needed
    if (hasBasement) {
      const basementRooms = this.generateBasementRooms(building, socialClass, seed + 1000);
      floors.push({
        level: -1,
        rooms: basementRooms,
        height: 3 // 15 feet ceiling height
      });
    }

    // Generate ground floor and upper floors
    for (let floor = 0; floor < stories; floor++) {
      const floorRooms = this.generateFloorRooms(buildingType, building, socialClass, floor, seed + floor * 1000);
      floors.push({
        level: floor,
        rooms: floorRooms,
        height: floor === 0 ? 3 : 2.5 // Ground floor has higher ceilings
      });
    }

    // Add stairs connecting floors if multi-story
    if (floors.length > 1) {
      this.addStairsToFloors(floors, building, seed + 5000);
    }

    return floors;
  }

  private static generateBasementRooms(
    building: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    
    // Simple basement layout - usually one or two rooms
    const basementWidth = building.width - 2; // Account for walls
    const basementHeight = building.height - 2;
    
    if (basementWidth >= 6 && basementHeight >= 6) {
      // Split basement into storage and cellar
      const storageWidth = Math.floor(basementWidth / 2);
      
      rooms.push({
        id: 'basement_storage',
        name: 'Storage Room',
        type: 'storage',
        x: building.x + 1,
        y: building.y + 1,
        width: storageWidth,
        height: basementHeight,
        floor: -1,
        tiles: this.generateRoomTiles(building.x + 1, building.y + 1, storageWidth, basementHeight, 'storage', 'common', 'temperate', seed),
        furniture: [],
        doors: [{ x: building.x + storageWidth, y: building.y + Math.floor(basementHeight/2), direction: 'east' }],
        windows: []
      });

      rooms.push({
        id: 'basement_cellar',
        name: 'Wine Cellar',
        type: 'cellar',
        x: building.x + 1 + storageWidth,
        y: building.y + 1,
        width: basementWidth - storageWidth,
        height: basementHeight,
        floor: -1,
        tiles: this.generateRoomTiles(building.x + 1 + storageWidth, building.y + 1, basementWidth - storageWidth, basementHeight, 'cellar', 'common', 'temperate', seed + 1),
        furniture: [],
        doors: [{ x: building.x + storageWidth, y: building.y + Math.floor(basementHeight/2), direction: 'west' }],
        windows: []
      });
    } else {
      // Single basement room
      rooms.push({
        id: 'basement_main',
        name: 'Basement',
        type: 'storage',
        x: building.x + 1,
        y: building.y + 1,
        width: basementWidth,
        height: basementHeight,
        floor: -1,
        tiles: this.generateRoomTiles(building.x + 1, building.y + 1, basementWidth, basementHeight, 'cellar', 'common', 'temperate', seed),
        furniture: [],
        doors: [{ x: building.x + Math.floor(building.width/2), y: building.y + building.height - 1, direction: 'south' }],
        windows: []
      });
    }

    return rooms;
  }

  private static generateFloorRooms(
    buildingType: BuildingType,
    building: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    floor: number,
    seed: number
  ): Room[] {
    if (floor === 0) {
      // Ground floor - use existing logic but mark as floor 0
      const rooms = this.generateRoomLayout(buildingType, building, socialClass, 'temperate', seed);
      rooms.forEach(room => room.floor = 0);
      return rooms;
    } else {
      // Upper floors - mainly bedrooms, studies, storage
      return this.generateUpperFloorRooms(building, socialClass, floor, seed);
    }
  }

  private static generateUpperFloorRooms(
    building: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    floor: number,
    seed: number
  ): Room[] {
    const rooms: Room[] = [];
    const { width, height, x, y } = building;
    
    // Upper floors are typically divided into bedrooms and studies
    const roomWidth = Math.max(4, Math.floor((width - 2) / 2));
    const roomHeight = Math.max(4, height - 2);

    // Generate 1-2 rooms per upper floor based on size
    if (width >= 10) {
      // Two rooms side by side
      rooms.push({
        id: `floor${floor}_room1`,
        name: floor === 1 ? 'Master Bedroom' : 'Guest Room',
        type: 'bedroom',
        x: x + 1,
        y: y + 1,
        width: roomWidth,
        height: roomHeight,
        floor,
        tiles: this.generateRoomTiles(x + 1, y + 1, roomWidth, roomHeight, 'bedroom', socialClass, 'temperate', seed),
        furniture: [],
        doors: [{ x: x + roomWidth, y: y + Math.floor(roomHeight/2), direction: 'east' }],
        windows: [{ x: x + 1, y: y, direction: 'north' }]
      });

      const room2Type = socialClass === 'noble' || socialClass === 'wealthy' ? 'study' : 'bedroom';
      rooms.push({
        id: `floor${floor}_room2`,
        name: room2Type === 'study' ? 'Private Study' : 'Bedroom',
        type: room2Type as any,
        x: x + 1 + roomWidth,
        y: y + 1,
        width: width - 2 - roomWidth,
        height: roomHeight,
        floor,
        tiles: this.generateRoomTiles(x + 1 + roomWidth, y + 1, width - 2 - roomWidth, roomHeight, 'office', socialClass, 'temperate', seed + 1),
        furniture: [],
        doors: [{ x: x + roomWidth, y: y + Math.floor(roomHeight/2), direction: 'west' }],
        windows: [{ x: x + width - 1, y: y + 2, direction: 'east' }]
      });
    } else {
      // Single room
      rooms.push({
        id: `floor${floor}_main`,
        name: 'Upper Room',
        type: 'bedroom',
        x: x + 1,
        y: y + 1,
        width: width - 2,
        height: height - 2,
        floor,
        tiles: this.generateRoomTiles(x + 1, y + 1, width - 2, height - 2, 'bedroom', socialClass, 'temperate', seed),
        furniture: [],
        doors: [{ x: x + Math.floor(width/2), y: y + height - 1, direction: 'south' }],
        windows: [{ x: x + 1, y: y, direction: 'north' }]
      });
    }

    return rooms;
  }

  private static addStairsToFloors(
    floors: Floor[],
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): void {
    // Place stairs in a consistent location across all floors
    const stairX = building.x + Math.floor(building.width / 2);
    const stairY = building.y + building.height - 3;

    floors.forEach((floor, index) => {
      const targetFloor = index < floors.length - 1 ? floors[index + 1] : null;
      const belowFloor = index > 0 ? floors[index - 1] : null;

      // Add stairs going up (if there's a floor above)
      if (targetFloor) {
        floor.rooms.forEach(room => {
          if (!room.stairs) room.stairs = [];
          if (this.isPointInRoom(stairX, stairY, room)) {
            room.stairs.push({
              x: stairX,
              y: stairY,
              direction: 'up',
              targetFloor: targetFloor.level
            });
          }
        });
      }

      // Add stairs going down (if there's a floor below)
      if (belowFloor) {
        floor.rooms.forEach(room => {
          if (!room.stairs) room.stairs = [];
          if (this.isPointInRoom(stairX, stairY, room)) {
            room.stairs.push({
              x: stairX,
              y: stairY,
              direction: 'down',
              targetFloor: belowFloor.level
            });
          }
        });
      }
    });
  }

  private static isPointInRoom(x: number, y: number, room: Room): boolean {
    return x >= room.x && x < room.x + room.width && 
           y >= room.y && y < room.y + room.height;
  }

  private static generateRoomLayout(
    buildingType: BuildingType,
    building: { width: number; height: number; x: number; y: number },
    socialClass: SocialClass,
    climate: string,
    seed: number
  ): Room[] {
    return RoomLayoutEngine.generateRoomLayout(
      buildingType, building, socialClass, climate, seed
    );
  }

  private static generateRoomTiles(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    climate: string = 'temperate',
    seed: number = 0
  ): any[] {
    const tiles: any[] = [];
    
    // Select appropriate floor and wall materials
    const floorMaterial = FloorMaterialSystem.selectFloorMaterial(
      roomFunction, socialClass, climate, undefined, seed
    );
    const wallMaterial = FloorMaterialSystem.getWallMaterial(
      roomFunction, socialClass, climate
    );
    
    for (let ty = y; ty < y + height; ty++) {
      for (let tx = x; tx < x + width; tx++) {
        // Interior tiles are floor
        if (tx > x && tx < x + width - 1 && ty > y && ty < y + height - 1) {
          tiles.push({ 
            x: tx, 
            y: ty, 
            type: 'floor', 
            material: floorMaterial.material,
            color: floorMaterial.colorHex,
            reasoning: floorMaterial.reasoning
          });
        }
        // Perimeter tiles are walls
        else {
          tiles.push({ 
            x: tx, 
            y: ty, 
            type: 'wall', 
            material: wallMaterial.material,
            color: wallMaterial.colorHex
          });
        }
      }
    }
    return tiles;
  }

  private static generateRealisticFurniture(room: Room, socialClass: SocialClass, seed: number): any[] {
    const roomFunction = this.mapRoomTypeToFunction(room.type);
    
    // Use the new realistic furniture system
    const placedFurniture = RealisticFurnitureLibrary.getFurnitureForRoom(
      roomFunction,
      room.width,
      room.height,
      socialClass,
      seed
    );

    // Convert PlacedFurniture to RoomFurniture format for compatibility
    return placedFurniture.map((placed, index) => ({
      id: `${room.id}_${placed.furniture.id}_${index}`,
      asset: { 
        path: placed.furniture.assetPath, 
        width: placed.furniture.width, 
        height: placed.furniture.height 
      },
      x: room.x + placed.x, // Convert relative to absolute coordinates
      y: room.y + placed.y,
      width: placed.furniture.width,
      height: placed.furniture.height,
      rotation: placed.orientation, // Use intelligent orientation
      purpose: placed.furniture.category,
      furnitureType: placed.furniture.name,
      interactionPoints: placed.furniture.interactionPoints || []
    }));
  }

  private static generateAdvancedFurniture(room: Room, socialClass: SocialClass, seed: number): any[] {
    // Fallback method - use generateRealisticFurniture
    return this.generateRealisticFurniture(room, socialClass, seed);
  }

  private static generateFurniture(room: Room, socialClass: SocialClass, seed: number) {
    const furniture: any[] = [];
    const { type, width, height, x, y } = room;
    
    // Basic furniture based on room type
    switch (type) {
      case 'bedroom':
        // Add bed (2x2 tiles, like specified for D&D)
        if (width >= 3 && height >= 3) {
          furniture.push({
            id: `bed_${seed}`,
            asset: { path: 'furniture/bed', width: 2, height: 2 },
            x: x + 1,
            y: y + 1,
            width: 2,
            height: 2,
            rotation: 0,
            purpose: 'seating'
          });
        }
        break;
        
      case 'common':
        // Add table and chairs
        if (width >= 4 && height >= 4) {
          furniture.push({
            id: `table_${seed}`,
            asset: { path: 'furniture/table', width: 2, height: 1 },
            x: x + Math.floor(width/2),
            y: y + Math.floor(height/2),
            width: 2,
            height: 1,
            rotation: 0,
            purpose: 'work'
          });
        }
        break;
        
      case 'shop':
        // Add counter
        if (width >= 3 && height >= 3) {
          furniture.push({
            id: `counter_${seed}`,
            asset: { path: 'furniture/counter', width: 3, height: 1 },
            x: x + 1,
            y: y + 1,
            width: 3,
            height: 1,
            rotation: 0,
            purpose: 'work'
          });
        }
        break;
        
      case 'workshop':
        // Add anvil for blacksmith
        if (width >= 2 && height >= 2) {
          furniture.push({
            id: `anvil_${seed}`,
            asset: { path: 'furniture/anvil', width: 1, height: 1 },
            x: x + 1,
            y: y + 1,
            width: 1,
            height: 1,
            rotation: 0,
            purpose: 'work'
          });
        }
        break;
    }
    
    return furniture;
  }

  private static generateExteriorFeatures(
    buildingType: BuildingType,
    lot: { width: number; height: number },
    building: { width: number; height: number; x: number; y: number },
    seed: number
  ): ExteriorFeature[] {
    const features: ExteriorFeature[] = [];
    
    // Generate garden areas around the building
    const availableSpaces = this.findAvailableSpaces(lot, building);
    
    // Add various exterior features based on available space and building type
    availableSpaces.forEach((space, index) => {
      const featureSeed = seed + index * 100;
      const featureType = this.chooseExteriorFeature(buildingType, space, featureSeed);
      
      if (featureType) {
        features.push({
          id: `feature_${index}`,
          type: featureType,
          asset: { path: `exterior/${featureType}`, width: 1, height: 1 },
          x: space.x,
          y: space.y,
          width: Math.min(space.width, 3),
          height: Math.min(space.height, 3)
        });
      }
    });
    
    // Add a well if there's space
    if (lot.width >= 8 && lot.height >= 8 && availableSpaces.length > 0) {
      const space = availableSpaces[0];
      if (space.width >= 2 && space.height >= 2) {
        features.push({
          id: 'well',
          type: 'well',
          asset: { path: 'exterior/well', width: 2, height: 2 },
          x: space.x,
          y: space.y,
          width: 2,
          height: 2
        });
      }
    }
    
    return features;
  }

  private static findAvailableSpaces(
    lot: { width: number; height: number }, 
    building: { width: number; height: number; x: number; y: number }
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const spaces: Array<{ x: number; y: number; width: number; height: number }> = [];
    
    // Front yard (south of building)
    if (building.y + building.height < lot.height - 1) {
      spaces.push({
        x: 0,
        y: building.y + building.height,
        width: lot.width,
        height: lot.height - (building.y + building.height)
      });
    }
    
    // Back yard (north of building)  
    if (building.y > 1) {
      spaces.push({
        x: 0,
        y: 0,
        width: lot.width,
        height: building.y
      });
    }
    
    // Left side
    if (building.x > 1) {
      spaces.push({
        x: 0,
        y: building.y,
        width: building.x,
        height: building.height
      });
    }
    
    // Right side
    if (building.x + building.width < lot.width - 1) {
      spaces.push({
        x: building.x + building.width,
        y: building.y,
        width: lot.width - (building.x + building.width),
        height: building.height
      });
    }
    
    return spaces.filter(space => space.width >= 2 && space.height >= 2);
  }

  private static chooseExteriorFeature(
    buildingType: BuildingType, 
    space: { x: number; y: number; width: number; height: number }, 
    seed: number
  ): ExteriorFeature['type'] | null {
    const random = this.seedRandom(seed);
    
    // Different features based on building type
    const featureProbabilities: Record<BuildingType, ExteriorFeature['type'][]> = {
      house_small: ['garden', 'fence', 'tree'],
      house_large: ['garden', 'well', 'fence', 'tree'],
      tavern: ['cart', 'fence', 'decoration'],
      blacksmith: ['storage', 'cart', 'fence'],
      shop: ['decoration', 'fence', 'cart'],
      market_stall: ['cart', 'storage', 'fence']
    };
    
    const availableFeatures = featureProbabilities[buildingType] || ['garden', 'tree'];
    
    if (random < 0.7 && space.width >= 2 && space.height >= 2) {
      return availableFeatures[Math.floor(this.seedRandom(seed + 1) * availableFeatures.length)];
    }
    
    return null;
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
