import { Point } from '@/types/point';
import { Polygon } from '@/types/polygon';
import { Street } from '@/types/street';
import { Random } from '@/utils/Random';
import { BuildingLibrary } from './BuildingLibrary';
import { ProceduralBuildingGenerator, BuildingPlan } from './ProceduralBuildingGenerator';

export interface VillageBuilding {
  id: string;
  type: VillageBuildingType;
  polygon: Polygon;
  entryPoint: Point;
  vocation?: string;
  proceduralPlan?: BuildingPlan; // New: detailed building layout for D&D maps
}

export interface VillageRoad {
  id: string;
  pathPoints: Point[];
  roadType: 'main' | 'side' | 'path';
  width: number;
}

export interface VillageWall {
  id: string;
  segments: Point[];
  gates: VillageGate[];
}

export interface VillageGate {
  id: string;
  position: Point;
  direction: number; // angle of the gate opening
  width: number;
}

export interface VillageLayout {
  buildings: VillageBuilding[];
  roads: VillageRoad[];
  walls: VillageWall[];
  center: Point;
  bounds: Polygon;
}

export type VillageBuildingType = 
  // Basic Buildings
  | 'house' | 'inn' | 'blacksmith' | 'farm' | 'mill' | 'woodworker' 
  | 'fisher' | 'market' | 'chapel' | 'stable' | 'well' | 'granary'
  
  // Magical Practitioners
  | 'alchemist' | 'herbalist' | 'magic_shop' | 'enchanter' | 'fortune_teller'
  | 'wizard_tower' | 'sorcerer_den' | 'warlock_sanctum' | 'druid_grove' | 'shaman_hut'
  | 'necromancer_lair' | 'artificer_workshop' | 'sage_library' | 'oracle_shrine'
  | 'witch_cottage' | 'crystal_gazer' | 'rune_carver' | 'spell_components_shop'
  
  // Religious & Divine
  | 'temple' | 'monastery' | 'shrine' | 'cathedral' | 'abbey'
  | 'pilgrimage_stop' | 'holy_spring' | 'cleric_sanctuary' | 'paladin_hall'
  | 'divine_oracle' | 'sacred_grove' | 'ancestor_shrine' | 'prayer_circle'
  
  // Combat & Military
  | 'monster_hunter' | 'mercenary_hall' | 'weapon_master' | 'armor_smith'
  | 'ranger_station' | 'guard_house' | 'training_grounds' | 'veterans_hall'
  | 'battle_academy' | 'siege_engineer' | 'castle_ruins' | 'watchtower'
  
  // Exotic Traders & Specialists
  | 'exotic_trader' | 'gem_cutter' | 'rare_books' | 'cartographer' | 'beast_tamer'
  | 'exotic_animals' | 'curiosity_shop' | 'antique_dealer' | 'relic_hunter'
  | 'treasure_appraiser' | 'map_maker' | 'compass_maker' | 'astrolabe_crafter'
  
  // Artisans & Crafters
  | 'master_jeweler' | 'instrument_maker' | 'clockwork_tinker' | 'glass_blower'
  | 'scroll_scribe' | 'ink_maker' | 'parchment_maker' | 'bookbinder'
  | 'portrait_artist' | 'sculptor' | 'tapestry_weaver' | 'dye_maker'
  
  // Entertainment & Culture
  | 'bards_college' | 'theater_troupe' | 'storyteller_circle' | 'minstrel_hall'
  | 'dance_instructor' | 'puppet_theater' | 'gaming_house' | 'riddle_master'
  | 'gladiator_arena' | 'fighting_pit' | 'race_track' | 'festival_grounds'
  
  // Mystical Services
  | 'dream_interpreter' | 'curse_breaker' | 'ghost_whisperer' | 'spirit_medium'
  | 'exorcist' | 'blessing_giver' | 'ward_crafter' | 'protective_charms'
  | 'luck_changer' | 'fate_reader' | 'time_keeper' | 'memory_keeper'
  
  // Guilds & Organizations
  | 'thieves_guild' | 'assassins_guild' | 'merchants_guild' | 'crafters_guild'
  | 'mages_guild' | 'adventurers_guild' | 'scholars_society' | 'secret_society'
  | 'underground_network' | 'information_broker' | 'spy_network' | 'code_breaker'
  
  // Unique Establishments
  | 'dragons_roost' | 'griffon_stable' | 'pegasus_aerie' | 'unicorn_sanctuary'
  | 'phoenix_nest' | 'magical_menagerie' | 'planar_gateway' | 'time_rift'
  | 'dimensional_shop' | 'void_touched' | 'fey_crossing' | 'shadowfell_portal'
  
  // Alchemical & Magical Industries
  | 'potion_brewery' | 'magical_forge' | 'elemental_workshop' | 'crystal_mine'
  | 'mana_well' | 'ley_line_nexus' | 'arcane_laboratory' | 'transmutation_circle'
  | 'summoning_chamber' | 'scrying_pool' | 'divination_center' | 'illusion_parlor';

export interface VillageOptions {
  size: 'tiny' | 'small' | 'medium';
  setting: 'farming' | 'coastal' | 'forest' | 'crossroads';
  includeWalls?: boolean;
  seed?: number;
  proceduralBuildings?: boolean; // Generate detailed D&D building layouts
}

// Core vocations that most villages have
const CORE_VOCATIONS: VillageBuildingType[] = ['inn', 'blacksmith'];

// Vastly expanded fantasy/magical vocations for rich D&D flavor
const FANTASY_VOCATIONS: VillageBuildingType[] = [
  // Magical Practitioners
  'alchemist', 'herbalist', 'magic_shop', 'enchanter', 'fortune_teller',
  'wizard_tower', 'sorcerer_den', 'warlock_sanctum', 'druid_grove', 'shaman_hut',
  'necromancer_lair', 'artificer_workshop', 'sage_library', 'oracle_shrine',
  'witch_cottage', 'crystal_gazer', 'rune_carver', 'spell_components_shop',
  
  // Religious & Divine
  'temple', 'chapel', 'monastery', 'shrine', 'cathedral', 'abbey',
  'pilgrimage_stop', 'holy_spring', 'cleric_sanctuary', 'paladin_hall',
  'divine_oracle', 'sacred_grove', 'ancestor_shrine', 'prayer_circle',
  
  // Combat & Military
  'monster_hunter', 'mercenary_hall', 'weapon_master', 'armor_smith',
  'ranger_station', 'guard_house', 'training_grounds', 'veterans_hall',
  'battle_academy', 'siege_engineer', 'castle_ruins', 'watchtower',
  
  // Exotic Traders & Specialists
  'exotic_trader', 'gem_cutter', 'rare_books', 'cartographer', 'beast_tamer',
  'exotic_animals', 'curiosity_shop', 'antique_dealer', 'relic_hunter',
  'treasure_appraiser', 'map_maker', 'compass_maker', 'astrolabe_crafter',
  
  // Artisans & Crafters
  'master_jeweler', 'instrument_maker', 'clockwork_tinker', 'glass_blower',
  'scroll_scribe', 'ink_maker', 'parchment_maker', 'bookbinder',
  'portrait_artist', 'sculptor', 'tapestry_weaver', 'dye_maker',
  
  // Entertainment & Culture
  'bards_college', 'theater_troupe', 'storyteller_circle', 'minstrel_hall',
  'dance_instructor', 'puppet_theater', 'gaming_house', 'riddle_master',
  'gladiator_arena', 'fighting_pit', 'race_track', 'festival_grounds',
  
  // Mystical Services
  'dream_interpreter', 'curse_breaker', 'ghost_whisperer', 'spirit_medium',
  'exorcist', 'blessing_giver', 'ward_crafter', 'protective_charms',
  'luck_changer', 'fate_reader', 'time_keeper', 'memory_keeper',
  
  // Guilds & Organizations
  'thieves_guild', 'assassins_guild', 'merchants_guild', 'crafters_guild',
  'mages_guild', 'adventurers_guild', 'scholars_society', 'secret_society',
  'underground_network', 'information_broker', 'spy_network', 'code_breaker',
  
  // Unique Establishments
  'dragons_roost', 'griffon_stable', 'pegasus_aerie', 'unicorn_sanctuary',
  'phoenix_nest', 'magical_menagerie', 'planar_gateway', 'time_rift',
  'dimensional_shop', 'void_touched', 'fey_crossing', 'shadowfell_portal',
  
  // Alchemical & Magical Industries
  'potion_brewery', 'magical_forge', 'elemental_workshop', 'crystal_mine',
  'mana_well', 'ley_line_nexus', 'arcane_laboratory', 'transmutation_circle',
  'summoning_chamber', 'scrying_pool', 'divination_center', 'illusion_parlor'
];

// Optional vocations based on setting and chance
const VOCATION_POOLS = {
  farming: ['mill', 'granary', 'stable', 'herbalist', 'temple'] as VillageBuildingType[],
  coastal: ['fisher', 'market', 'fortune_teller', 'temple'] as VillageBuildingType[],  
  forest: ['woodworker', 'mill', 'monster_hunter', 'herbalist'] as VillageBuildingType[],
  crossroads: ['market', 'stable', 'inn', 'magic_shop', 'enchanter'] as VillageBuildingType[]
};

export class VillageGenerator {
  private options: VillageOptions;
  private center: Point;
  private bounds: Polygon;
  
  constructor(options: VillageOptions) {
    this.options = options;
    if (options.seed) {
      Random.reset(options.seed);
    }
    
    // Create village bounds (roughly circular area)
    this.center = new Point(0, 0);
    const radius = this.getVillageRadius();
    this.bounds = this.createVillageBounds(radius);
  }
  
  public generateVillage(): VillageLayout {
    // 1. Determine village center and anchor buildings
    const { centerBuildings, centerPoint } = this.generateTownCenter();
    
    // 2. Generate road network from center outward
    const roads = this.generateRoadNetworkFromCenter(centerPoint);
    
    // 3. Determine remaining building count and types
    const remainingBuildingCount = this.getBuildingCount() - centerBuildings.length;
    const remainingBuildingTypes = this.selectRemainingBuildingTypes(remainingBuildingCount, centerBuildings);
    
    // 4. Place buildings along roads (expanding outward from center)
    const remainingBuildings = this.placeBuildingsAlongRoads(roads, remainingBuildingTypes, centerBuildings);
    const allBuildings = [...centerBuildings, ...remainingBuildings];
    
    // 5. Generate walls if needed
    const walls = this.generateWalls(roads, allBuildings);
    
    // 6. Extend main roads outside walls with rural areas
    const { extendedRoads, ruralBuildings } = this.generateRuralExtensions(roads, walls);
    
    return {
      buildings: [...allBuildings, ...ruralBuildings],
      roads: [...roads, ...extendedRoads],
      walls,
      center: centerPoint,
      bounds: this.bounds
    };
  }
  
  private getVillageRadius(): number {
    switch (this.options.size) {
      case 'tiny': return 60;
      case 'small': return 80;
      case 'medium': return 100;
    }
  }
  
  private getBuildingCount(): number {
    switch (this.options.size) {
      case 'tiny': return Random.int(12, 18);
      case 'small': return Random.int(20, 30); 
      case 'medium': return Random.int(35, 45);
    }
  }
  
  private createVillageBounds(radius: number): Polygon {
    // Create irregular circular boundary
    const points: Point[] = [];
    const segments = 12;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variation = 0.7 + Random.float() * 0.6; // Irregular shape
      const r = radius * variation;
      
      points.push(new Point(
        this.center.x + Math.cos(angle) * r,
        this.center.y + Math.sin(angle) * r
      ));
    }
    
    return new Polygon(points);
  }

  private generateTownCenter(): { centerBuildings: VillageBuilding[]; centerPoint: Point } {
    // Determine what type of central building this village has
    const centralBuildingType = this.getCentralBuildingType();
    const centerPoint = new Point(this.center.x, this.center.y);
    
    // Create the central building
    const centralBuilding = this.createCentralBuilding(centralBuildingType, centerPoint);
    const centerBuildings = [centralBuilding];
    
    // Add complementary buildings around the center based on village size and type
    const complementaryBuildings = this.addComplementaryBuildingsToCenter(centerPoint, centralBuildingType);
    centerBuildings.push(...complementaryBuildings);
    
    return { centerBuildings, centerPoint };
  }

  private getCentralBuildingType(): VillageBuildingType {
    // Determine central building based on village setting and size
    const centralOptions: VillageBuildingType[] = [];
    
    switch (this.options.setting) {
      case 'farming':
        centralOptions.push('market', 'chapel', 'well');
        break;
      case 'coastal':
        centralOptions.push('market', 'inn', 'chapel');
        break;
      case 'forest':
        centralOptions.push('chapel', 'woodworker', 'well');
        break;
      case 'crossroads':
        centralOptions.push('inn', 'market', 'stable');
        break;
    }

    // Larger villages are more likely to have markets/inns as centers
    if (this.options.size === 'medium') {
      centralOptions.push('market', 'inn'); // Double chance
    }

    return Random.choose(centralOptions);
  }

  private createCentralBuilding(type: VillageBuildingType, centerPoint: Point): VillageBuilding {
    // Central buildings are typically larger
    const baseSize = this.getBuildingSize(type);
    const enhancedSize = {
      width: baseSize.width * 1.3,
      height: baseSize.height * 1.3
    };

    // Create building at exact center with random orientation
    const buildingOrientation = Random.float() * Math.PI * 2;
    const polygon = this.createBuildingPolygonWithSize(type, centerPoint, buildingOrientation, enhancedSize);

    const building: VillageBuilding = {
      id: 'central_building',
      type,
      polygon,
      entryPoint: this.findClosestPointOnPolygon(polygon, centerPoint),
      vocation: type !== 'house' ? type : undefined
    };

    // Generate procedural building plan if enabled
    if (this.options.proceduralBuildings) {
      building.proceduralPlan = this.generateProceduralBuildingPlan(type, enhancedSize, 'central_building');
    }

    return building;
  }

  private addComplementaryBuildingsToCenter(centerPoint: Point, centralType: VillageBuildingType): VillageBuilding[] {
    const complementaryBuildings: VillageBuilding[] = [];
    
    // Add 1-2 complementary buildings around the center based on village size
    const numComplementary = this.options.size === 'tiny' ? 1 : Random.int(1, 3);
    
    for (let i = 0; i < numComplementary; i++) {
      const complementaryType = this.getComplementaryBuildingType(centralType, i);
      if (!complementaryType) continue;

      // Position around the central building
      const angle = (i / numComplementary) * Math.PI * 2 + Random.float() * Math.PI / 4;
      const distance = 25 + Random.float() * 15; // 25-40 units from center
      
      const buildingCenter = new Point(
        centerPoint.x + Math.cos(angle) * distance,
        centerPoint.y + Math.sin(angle) * distance
      );

      const buildingOrientation = Random.float() * Math.PI * 2;
      const polygon = this.createBuildingPolygon(complementaryType, buildingCenter, buildingOrientation);

      const building: VillageBuilding = {
        id: `center_complementary_${i}`,
        type: complementaryType,
        polygon,
        entryPoint: this.findClosestPointOnPolygon(polygon, centerPoint),
        vocation: complementaryType !== 'house' ? complementaryType : undefined
      };

      // Generate procedural building plan if enabled
      if (this.options.proceduralBuildings) {
        const buildingSize = this.getBuildingSize(complementaryType);
        building.proceduralPlan = this.generateProceduralBuildingPlan(complementaryType, buildingSize, `center_complementary_${i}`);
      }

      complementaryBuildings.push(building);
    }

    return complementaryBuildings;
  }

  private getComplementaryBuildingType(centralType: VillageBuildingType, index: number): VillageBuildingType | null {
    // Select buildings that complement the central building
    const complementaryOptions: VillageBuildingType[] = [];

    switch (centralType) {
      case 'market':
        complementaryOptions.push('inn', 'stable', 'blacksmith', 'well');
        break;
      case 'inn':
        complementaryOptions.push('stable', 'blacksmith', 'market');
        break;
      case 'chapel':
      case 'temple':
        complementaryOptions.push('well', 'market', 'house');
        break;
      case 'well':
        complementaryOptions.push('market', 'inn', 'house');
        break;
      default:
        complementaryOptions.push('house', 'well', 'stable');
    }

    return complementaryOptions.length > 0 ? Random.choose(complementaryOptions) : null;
  }

  private createBuildingPolygonWithSize(type: VillageBuildingType, center: Point, orientation: number, size: { width: number, height: number }): Polygon {
    // Create building rectangle with specified size
    const corners = [
      new Point(-size.width/2, -size.height/2), // back left
      new Point(size.width/2, -size.height/2),  // back right  
      new Point(size.width/2, size.height/2),   // front right
      new Point(-size.width/2, size.height/2)   // front left
    ];
    
    // Rotate building and translate to position
    return new Polygon(corners.map(corner => {
      const rotatedX = corner.x * Math.cos(orientation) - corner.y * Math.sin(orientation);
      const rotatedY = corner.x * Math.sin(orientation) + corner.y * Math.cos(orientation);
      
      return new Point(center.x + rotatedX, center.y + rotatedY);
    }));
  }
  
  private generateRoadNetworkFromCenter(centerPoint: Point): VillageRoad[] {
    const roads: VillageRoad[] = [];
    
    // 1. Create main roads radiating from center
    const mainRoads = this.generateMainRoadsFromCenter(centerPoint);
    roads.push(...mainRoads);
    
    // 2. Secondary roads connecting the main roads
    const sideRoads = this.generateConnectingRoads(mainRoads);
    roads.push(...sideRoads);
    
    // 3. Small paths to outlying areas
    const paths = this.generatePaths(roads);
    roads.push(...paths);
    
    return roads;
  }

  private generateMainRoadsFromCenter(centerPoint: Point): VillageRoad[] {
    const roads: VillageRoad[] = [];
    
    // Number of main roads based on village size
    const numMainRoads = this.options.size === 'tiny' ? 2 : this.options.size === 'small' ? 3 : 4;
    
    for (let i = 0; i < numMainRoads; i++) {
      // Evenly space roads around the center with some variation
      const baseAngle = (i / numMainRoads) * Math.PI * 2;
      const angleVariation = (Random.float() - 0.5) * Math.PI / 6; // ±30 degrees variation
      const roadAngle = baseAngle + angleVariation;
      
      const roadLength = this.getVillageRadius() * 0.8 + Random.float() * 20;
      
      // Create road extending from center
      const pathPoints: Point[] = [centerPoint];
      const segments = 4;
      
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const distance = roadLength * t;
        
        // Add slight curves to make roads more organic
        const curvature = Math.sin(t * Math.PI) * (Random.float() * 10 - 5);
        const curveAngle = roadAngle + Math.PI/2;
        
        const roadPoint = new Point(
          centerPoint.x + Math.cos(roadAngle) * distance + Math.cos(curveAngle) * curvature,
          centerPoint.y + Math.sin(roadAngle) * distance + Math.sin(curveAngle) * curvature
        );
        
        pathPoints.push(roadPoint);
      }
      
      roads.push({
        id: `main_road_${i}`,
        pathPoints,
        roadType: 'main',
        width: 6
      });
    }
    
    return roads;
  }

  private generateConnectingRoads(mainRoads: VillageRoad[]): VillageRoad[] {
    const connectingRoads: VillageRoad[] = [];
    
    // Create some connecting roads between main roads
    const numConnections = Random.int(1, Math.min(3, mainRoads.length - 1));
    
    for (let i = 0; i < numConnections; i++) {
      // Pick two main roads to connect
      const road1 = Random.choose(mainRoads);
      const road2 = Random.choose(mainRoads.filter(r => r !== road1));
      
      // Pick connection points (not at the ends)
      const point1Index = Random.int(1, road1.pathPoints.length - 1);
      const point2Index = Random.int(1, road2.pathPoints.length - 1);
      
      const point1 = road1.pathPoints[point1Index];
      const point2 = road2.pathPoints[point2Index];
      
      // Calculate the direct angle between points
      const directAngle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
      
      // Get the road directions at connection points
      const road1Direction = this.getRoadDirection(road1, point1);
      const road2Direction = this.getRoadDirection(road2, point2);
      
      // Ensure connecting road has reasonable angles (at least 30 degrees difference)
      const minAngleDiff = Math.PI / 6; // 30 degrees
      
      let connectionAngle1 = this.getConnectionAngle(road1Direction, directAngle, minAngleDiff);
      let connectionAngle2 = this.getConnectionAngle(road2Direction, directAngle + Math.PI, minAngleDiff);
      
      // Create connecting road with proper angles and curve
      const distance = Point.distance(point1, point2);
      const curveStrength = Math.min(distance * 0.3, 25);
      
      const midPoint = new Point(
        (point1.x + point2.x) / 2 + Math.cos(directAngle + Math.PI/2) * curveStrength * (Random.float() * 0.6 - 0.3),
        (point1.y + point2.y) / 2 + Math.sin(directAngle + Math.PI/2) * curveStrength * (Random.float() * 0.6 - 0.3)
      );
      
      connectingRoads.push({
        id: `connecting_road_${i}`,
        pathPoints: [point1, midPoint, point2],
        roadType: 'side',
        width: 4
      });
    }
    
    return connectingRoads;
  }

  private getConnectionAngle(roadDirection: number, desiredDirection: number, minAngleDiff: number): number {
    // Calculate angle difference
    let angleDiff = Math.abs(roadDirection - desiredDirection);
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);
    
    // If angle is too shallow, adjust it
    if (angleDiff < minAngleDiff) {
      const adjustment = minAngleDiff - angleDiff;
      return desiredDirection + (Random.bool() ? adjustment : -adjustment);
    }
    
    return desiredDirection;
  }

  private generateRoadNetwork(): VillageRoad[] {
    const roads: VillageRoad[] = [];
    
    // 1. Main road through village center
    const mainRoad = this.generateMainRoad();
    roads.push(mainRoad);
    
    // 2. Secondary roads branching off
    const sideRoads = this.generateSideRoads(mainRoad);
    roads.push(...sideRoads);
    
    // 3. Small paths to outlying buildings
    const paths = this.generatePaths(roads);
    roads.push(...paths);
    
    return roads;
  }
  
  private generateMainRoad(): VillageRoad {
    // Main road curves through village center
    const startAngle = Random.float() * Math.PI * 2;
    const roadLength = this.getVillageRadius() * 1.6;
    
    const startPoint = new Point(
      this.center.x + Math.cos(startAngle) * roadLength/2,
      this.center.y + Math.sin(startAngle) * roadLength/2
    );
    
    const endPoint = new Point(
      this.center.x - Math.cos(startAngle) * roadLength/2,
      this.center.y - Math.sin(startAngle) * roadLength/2
    );
    
    // Add curve to the road
    const pathPoints: Point[] = [startPoint];
    const segments = 5;
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const basePoint = new Point(
        startPoint.x + (endPoint.x - startPoint.x) * t,
        startPoint.y + (endPoint.y - startPoint.y) * t
      );
      
      // Add perpendicular curve variation
      const perpAngle = startAngle + Math.PI/2;
      const curvature = Math.sin(t * Math.PI) * (Random.float() * 15 - 7.5);
      
      pathPoints.push(new Point(
        basePoint.x + Math.cos(perpAngle) * curvature,
        basePoint.y + Math.sin(perpAngle) * curvature
      ));
    }
    
    pathPoints.push(endPoint);
    
    return {
      id: 'main_road',
      pathPoints,
      roadType: 'main',
      width: 6
    };
  }
  
  private generateSideRoads(mainRoad: VillageRoad): VillageRoad[] {
    const sideRoads: VillageRoad[] = [];
    const branchCount = Random.int(2, 4);
    
    for (let i = 0; i < branchCount; i++) {
      // Pick a branching point along main road
      const mainSegment = Random.int(1, mainRoad.pathPoints.length - 1);
      const branchPoint = mainRoad.pathPoints[mainSegment];
      
      // Branch at an angle
      const branchAngle = Random.float() * Math.PI/3 - Math.PI/6; // ±30 degrees
      const branchLength = Random.float() * 40 + 20;
      
      const direction = this.getMainRoadDirection(mainRoad, mainSegment);
      const actualAngle = direction + branchAngle + (Random.bool() ? Math.PI/2 : -Math.PI/2);
      
      const pathPoints: Point[] = [branchPoint];
      const segments = Random.int(2, 4);
      
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const distance = branchLength * t;
        
        pathPoints.push(new Point(
          branchPoint.x + Math.cos(actualAngle) * distance,
          branchPoint.y + Math.sin(actualAngle) * distance
        ));
      }
      
      sideRoads.push({
        id: `side_road_${i}`,
        pathPoints,
        roadType: 'side',
        width: 4
      });
    }
    
    return sideRoads;
  }
  
  private generatePaths(existingRoads: VillageRoad[]): VillageRoad[] {
    const paths: VillageRoad[] = [];
    const pathCount = Random.int(1, 3);
    
    for (let i = 0; i < pathCount; i++) {
      // Create short dead-end paths
      const sourceRoad = Random.choose(existingRoads);
      const branchPoint = Random.choose(sourceRoad.pathPoints);
      
      const pathLength = Random.float() * 20 + 10;
      const pathAngle = Random.float() * Math.PI * 2;
      
      const endPoint = new Point(
        branchPoint.x + Math.cos(pathAngle) * pathLength,
        branchPoint.y + Math.sin(pathAngle) * pathLength
      );
      
      paths.push({
        id: `path_${i}`,
        pathPoints: [branchPoint, endPoint],
        roadType: 'path',
        width: 2
      });
    }
    
    return paths;
  }
  
  private getMainRoadDirection(road: VillageRoad, segmentIndex: number): number {
    const current = road.pathPoints[segmentIndex];
    const next = road.pathPoints[segmentIndex + 1] || road.pathPoints[segmentIndex - 1];
    
    return Math.atan2(next.y - current.y, next.x - current.x);
  }
  
  private selectRemainingBuildingTypes(count: number, centerBuildings: VillageBuilding[]): VillageBuildingType[] {
    if (count <= 0) return [];
    
    const types: VillageBuildingType[] = [];
    const existingTypes = centerBuildings.map(b => b.type);
    
    // Add core vocations that aren't already in center
    const remainingCoreVocations = CORE_VOCATIONS.filter(vocation => !existingTypes.includes(vocation));
    types.push(...remainingCoreVocations);
    
    // Add setting-specific vocations
    const settingPool = VOCATION_POOLS[this.options.setting];
    const settingCount = Math.min(settingPool.length, Random.int(1, 3));
    
    for (let i = 0; i < settingCount; i++) {
      const vocation = Random.choose(settingPool);
      if (!types.includes(vocation) && !existingTypes.includes(vocation)) {
        types.push(vocation);
      }
    }
    
    // Add fantasy vocations for D&D flavor (30-60% chance based on village size)
    const fantasyChance = this.options.size === 'tiny' ? 0.3 : this.options.size === 'small' ? 0.5 : 0.7;
    const fantasyCount = this.options.size === 'tiny' ? Random.int(0, 2) : this.options.size === 'small' ? Random.int(1, 3) : Random.int(2, 4);
    
    for (let i = 0; i < fantasyCount; i++) {
      if (Random.bool(fantasyChance)) {
        const fantasyVocation = Random.choose(FANTASY_VOCATIONS);
        if (!types.includes(fantasyVocation) && !existingTypes.includes(fantasyVocation)) {
          types.push(fantasyVocation);
        }
      }
    }
    
    // Fill remaining slots with houses (ensure at least 60% are houses for believability)
    const remainingSlots = count - types.length;
    
    for (let i = 0; i < remainingSlots; i++) {
      types.push('house');
    }
    
    return Random.shuffle(types.slice(0, count));
  }

  private selectBuildingTypes(count: number): VillageBuildingType[] {
    const types: VillageBuildingType[] = [];
    
    // Add core vocations
    types.push(...CORE_VOCATIONS);
    
    // Add setting-specific vocations
    const settingPool = VOCATION_POOLS[this.options.setting];
    const settingCount = Math.min(settingPool.length, Random.int(2, 4));
    
    for (let i = 0; i < settingCount; i++) {
      const vocation = Random.choose(settingPool);
      if (!types.includes(vocation)) {
        types.push(vocation);
      }
    }
    
    // Add fantasy vocations for D&D flavor (30-60% chance based on village size)
    const fantasyChance = this.options.size === 'tiny' ? 0.3 : this.options.size === 'small' ? 0.5 : 0.7;
    const fantasyCount = this.options.size === 'tiny' ? Random.int(0, 2) : this.options.size === 'small' ? Random.int(1, 3) : Random.int(2, 4);
    
    for (let i = 0; i < fantasyCount; i++) {
      if (Random.bool(fantasyChance)) {
        const fantasyVocation = Random.choose(FANTASY_VOCATIONS);
        if (!types.includes(fantasyVocation)) {
          types.push(fantasyVocation);
        }
      }
    }
    
    // Add optional mundane vocations based on village size
    const optionalVocations: VillageBuildingType[] = ['chapel', 'mill', 'well', 'market'];
    const optionalCount = this.options.size === 'medium' ? Random.int(1, 3) : Random.int(0, 2);
    
    for (let i = 0; i < optionalCount; i++) {
      const vocation = Random.choose(optionalVocations);
      if (!types.includes(vocation)) {
        types.push(vocation);
      }
    }
    
    // Fill remaining slots with houses (ensure at least 60% are houses for believability)
    const remainingSlots = count - types.length;
    const minHouses = Math.max(remainingSlots, Math.floor(count * 0.6) - (types.length - types.filter(t => t === 'house').length));
    
    for (let i = 0; i < remainingSlots; i++) {
      types.push('house');
    }
    
    return Random.shuffle(types);
  }
  
  private placeBuildingsAlongRoads(roads: VillageRoad[], buildingTypes: VillageBuildingType[], existingBuildings: VillageBuilding[] = []): VillageBuilding[] {
    const buildings: VillageBuilding[] = [];
    const usedPositions: Point[] = existingBuildings.map(b => b.entryPoint);
    
    for (let i = 0; i < buildingTypes.length; i++) {
      const buildingType = buildingTypes[i];
      const building = this.placeSingleBuilding(buildingType, roads, usedPositions, i + existingBuildings.length, [...existingBuildings, ...buildings]);
      
      if (building) {
        buildings.push(building);
        usedPositions.push(building.entryPoint);
      }
    }
    
    return buildings;
  }
  
  private placeSingleBuilding(
    type: VillageBuildingType, 
    roads: VillageRoad[], 
    usedPositions: Point[],
    buildingIndex: number,
    existingBuildings: VillageBuilding[] = []
  ): VillageBuilding | null {
    
    const maxAttempts = 30;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Choose road to place building near
      const road = this.selectRoadForBuilding(type, roads);
      const roadPoint = Random.choose(road.pathPoints);
      
      // Determine building placement offset from road
      const setbackDistance = this.getBuildingSetback(type, road.roadType);
      
      // Instead of random angle, pick perpendicular directions from road
      const roadDirection = this.getRoadDirection(road, roadPoint);
      const perpendicularAngle1 = roadDirection + Math.PI/2;
      const perpendicularAngle2 = roadDirection - Math.PI/2;
      
      // Try both sides of the road
      const angles = [perpendicularAngle1, perpendicularAngle2];
      
      for (const angle of angles) {
        const buildingCenter = new Point(
          roadPoint.x + Math.cos(angle) * setbackDistance,
          roadPoint.y + Math.sin(angle) * setbackDistance
        );
        
        // Check if position is valid
        if (!this.bounds.contains(buildingCenter)) continue;
        
        // Check distance to other buildings
        const tooClose = usedPositions.some(pos => 
          Point.distance(pos, buildingCenter) < this.getMinBuildingDistance(type)
        );
        
        if (tooClose) continue;
        
        // Create building polygon aligned with road
        const roadDirection = this.getRoadDirection(road, roadPoint);
        const polygon = this.createBuildingPolygon(type, buildingCenter, roadDirection);
        
        // Check for overlaps with existing buildings
        const overlaps = existingBuildings.some(existing => 
          this.doPolygonsOverlap(polygon, existing.polygon)
        );
        
        if (overlaps) continue;
        
        // Check if building intersects with any road
        const intersectsRoad = roads.some(roadToCheck => 
          this.doesBuildingIntersectRoad(polygon, roadToCheck)
        );
        
        if (intersectsRoad) continue;
        
        const building: VillageBuilding = {
          id: `building_${buildingIndex}`,
          type,
          polygon,
          entryPoint: this.findClosestPointOnPolygon(polygon, roadPoint),
          vocation: type !== 'house' ? type : undefined
        };

        // Generate procedural building plan if enabled
        if (this.options.proceduralBuildings) {
          const buildingSize = this.getBuildingSize(type);
          building.proceduralPlan = this.generateProceduralBuildingPlan(type, buildingSize, `building_${buildingIndex}`);
        }

        return building;
      }
    }
    
    return null;
  }
  
  private getRoadDirection(road: VillageRoad, point: Point): number {
    // Find the closest segment of the road to get direction
    let closestDistance = Infinity;
    let direction = 0;
    
    for (let i = 0; i < road.pathPoints.length - 1; i++) {
      const p1 = road.pathPoints[i];
      const p2 = road.pathPoints[i + 1];
      const distance = Point.distance(point, p1);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        direction = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      }
    }
    
    return direction;
  }
  
  private doPolygonsOverlap(poly1: Polygon, poly2: Polygon): boolean {
    // Simple overlap check - if any vertex of one polygon is inside the other
    for (const vertex of poly1.vertices) {
      if (poly2.contains(vertex)) return true;
    }
    for (const vertex of poly2.vertices) {
      if (poly1.contains(vertex)) return true;
    }
    return false;
  }
  
  private doesBuildingIntersectRoad(buildingPolygon: Polygon, road: VillageRoad): boolean {
    const roadWidth = road.width || 4;
    
    // Check if any road point is too close to the building
    for (let i = 0; i < road.pathPoints.length - 1; i++) {
      const p1 = road.pathPoints[i];
      const p2 = road.pathPoints[i + 1];
      
      // Check if any building vertex is too close to the road segment
      for (const vertex of buildingPolygon.vertices) {
        const distanceToRoad = this.distancePointToLineSegment(vertex, p1, p2);
        if (distanceToRoad < roadWidth / 2 + 2) { // +2 for buffer
          return true;
        }
      }
      
      // Also check if road points are inside building
      if (buildingPolygon.contains(p1) || buildingPolygon.contains(p2)) {
        return true;
      }
    }
    
    return false;
  }
  
  private distancePointToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }
    
    const param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private selectRoadForBuilding(type: VillageBuildingType, roads: VillageRoad[]): VillageRoad {
    // Some buildings prefer main roads
    const prefersMainRoad = ['inn', 'market', 'blacksmith'].includes(type);
    
    if (prefersMainRoad && Random.bool(0.7)) {
      return roads.find(r => r.roadType === 'main') || Random.choose(roads);
    }
    
    // Farms prefer paths/outskirts
    if (type === 'farm' && Random.bool(0.6)) {
      const pathRoads = roads.filter(r => r.roadType === 'path');
      if (pathRoads.length > 0) {
        return Random.choose(pathRoads);
      }
    }
    
    return Random.choose(roads);
  }
  
  private getBuildingSetback(type: VillageBuildingType, roadType: string): number {
    let baseSetback = roadType === 'main' ? 12 : 8;
    
    // Farms need more space
    if (type === 'farm') baseSetback *= 1.5;
    
    // Reduce random variation for more organized placement
    return baseSetback + Random.float() * 5;
  }
  
  private getMinBuildingDistance(type: VillageBuildingType): number {
    return type === 'farm' ? 30 : 18;
  }
  
  private createBuildingPolygon(type: VillageBuildingType, center: Point, roadDirection: number): Polygon {
    const size = this.getBuildingSize(type);
    
    // Align building parallel to road, with the longer side facing the road
    // If road is horizontal (angle ~0), building should also be horizontal
    let buildingOrientation = roadDirection;
    
    // Ensure building's longer dimension faces the road for better aesthetics
    const width = size.width;
    const height = size.height;
    
    // Create building rectangle aligned with road
    const corners = [
      new Point(-width/2, -height/2), // back left
      new Point(width/2, -height/2),  // back right  
      new Point(width/2, height/2),   // front right
      new Point(-width/2, height/2)   // front left
    ];
    
    // Rotate building to align with road and translate to position
    return new Polygon(corners.map(corner => {
      const rotatedX = corner.x * Math.cos(buildingOrientation) - corner.y * Math.sin(buildingOrientation);
      const rotatedY = corner.x * Math.sin(buildingOrientation) + corner.y * Math.cos(buildingOrientation);
      
      return new Point(center.x + rotatedX, center.y + rotatedY);
    }));
  }
  
  private getBuildingSize(type: VillageBuildingType): { width: number, height: number } {
    const baseSize = {
      house: { width: 12, height: 9 },
      inn: { width: 16, height: 12 },
      blacksmith: { width: 14, height: 11 },
      farm: { width: 18, height: 15 },
      mill: { width: 11, height: 11 },
      woodworker: { width: 13, height: 10 },
      fisher: { width: 10, height: 8 },
      market: { width: 15, height: 10 },
      chapel: { width: 12, height: 16 },
      stable: { width: 15, height: 10 },
      well: { width: 4, height: 4 },
      granary: { width: 10, height: 10 },
      alchemist: { width: 11, height: 9 },
      herbalist: { width: 10, height: 8 },
      magic_shop: { width: 12, height: 10 },
      temple: { width: 14, height: 18 },
      monster_hunter: { width: 13, height: 10 },
      enchanter: { width: 12, height: 10 },
      fortune_teller: { width: 9, height: 9 }
    };
    
    const size = baseSize[type] || baseSize.house;
    
    // Reduce variation for more consistent sizing
    const variation = 0.9 + Random.float() * 0.2;
    
    return {
      width: size.width * variation,
      height: size.height * variation
    };
  }
  
  private generateWalls(roads: VillageRoad[], buildings: VillageBuilding[]): VillageWall[] {
    // Determine if this settlement should have walls
    const wallChance = this.getWallChance();
    
    if (!Random.bool(wallChance)) {
      return [];
    }
    
    // Calculate wall perimeter that encompasses all buildings
    const wallPoints = this.generateWallPointsAroundBuildings(buildings, roads);
    
    // Find where roads exit the village to place gates
    const gates = this.generateGates(roads, wallPoints);
    
    return [{
      id: 'main_wall',
      segments: wallPoints,
      gates
    }];
  }
  
  private getWallChance(): number {
    switch (this.options.size) {
      case 'tiny': return 0.1;   // 10% chance for hamlets
      case 'small': return 0.3;  // 30% chance for villages
      case 'medium': return 0.6; // 60% chance for medium villages
      default: return 0.1;
    }
  }
  
  private generateWallPointsAroundBuildings(buildings: VillageBuilding[], roads: VillageRoad[]): Point[] {
    if (buildings.length === 0) {
      // Fallback to simple circular wall
      return this.generateWallPoints(this.getVillageRadius() * 0.8);
    }
    
    // Find the bounding box of all buildings
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    buildings.forEach(building => {
      building.polygon.vertices.forEach(vertex => {
        minX = Math.min(minX, vertex.x);
        maxX = Math.max(maxX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxY = Math.max(maxY, vertex.y);
      });
    });
    
    // Also consider road extents for gates
    roads.forEach(road => {
      road.pathPoints.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    // Add buffer around the settlement
    const buffer = 15 + Random.float() * 10; // 15-25 unit buffer
    minX -= buffer;
    maxX += buffer;
    minY -= buffer;
    maxY += buffer;
    
    // Calculate center and dimensions
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Create wall points in a rounded rectangle or oval shape
    const points: Point[] = [];
    const segments = 20; // More points for smoother walls
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Create an oval that encompasses the settlement
      const baseRadiusX = width / 2;
      const baseRadiusY = height / 2;
      
      // Add some irregularity to make it look more organic
      const variation = 0.9 + Random.float() * 0.2; // Less variation for more predictable encompassing
      
      const x = centerX + Math.cos(angle) * baseRadiusX * variation;
      const y = centerY + Math.sin(angle) * baseRadiusY * variation;
      
      points.push(new Point(x, y));
    }
    
    return points;
  }
  
  private generateWallPoints(radius: number): Point[] {
    const points: Point[] = [];
    const segments = 16; // More segments for smoother walls
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Add some variation to make walls less perfectly circular
      const variation = 0.85 + Random.float() * 0.3;
      const r = radius * variation;
      
      points.push(new Point(
        this.center.x + Math.cos(angle) * r,
        this.center.y + Math.sin(angle) * r
      ));
    }
    
    return points;
  }
  
  private generateGates(roads: VillageRoad[], wallPoints: Point[]): VillageGate[] {
    const gates: VillageGate[] = [];
    
    if (wallPoints.length === 0) return gates;
    
    // Find where roads extend beyond the settlement and would need gates
    const roadExtensions = this.findRoadWallIntersections(roads, wallPoints);
    
    // Create gates for each road intersection
    for (const intersection of roadExtensions) {
      gates.push({
        id: `gate_${gates.length}`,
        position: intersection.wallPoint,
        direction: intersection.roadDirection,
        width: intersection.roadType === 'main' ? 10 : 8
      });
    }
    
    // Ensure at least one gate if there are walls but no road intersections
    if (gates.length === 0) {
      // Place a gate at a reasonable location (e.g., facing the main road direction)
      const mainRoad = roads.find(r => r.roadType === 'main');
      if (mainRoad) {
        const roadCenter = mainRoad.pathPoints[Math.floor(mainRoad.pathPoints.length / 2)];
        const gatePosition = this.findClosestWallPoint(roadCenter, wallPoints);
        if (gatePosition) {
          gates.push({
            id: 'main_gate',
            position: gatePosition,
            direction: this.getRoadDirection(mainRoad, roadCenter),
            width: 10
          });
        }
      }
      
      // Fallback to random wall point
      if (gates.length === 0) {
        const randomWallPoint = Random.choose(wallPoints);
        gates.push({
          id: 'main_gate',
          position: randomWallPoint,
          direction: 0,
          width: 10
        });
      }
    }
    
    return gates;
  }
  
  private findRoadWallIntersections(roads: VillageRoad[], wallPoints: Point[]): Array<{
    wallPoint: Point;
    roadDirection: number;
    roadType: string;
  }> {
    const rawIntersections: Array<{
      wallPoint: Point;
      roadDirection: number;
      roadType: string;
      road: VillageRoad;
      endpoint: Point;
    }> = [];
    
    // Check each road to see where it would intersect the wall
    for (const road of roads) {
      // Only consider main and side roads for gates (not small paths)
      if (road.roadType === 'path') continue;
      
      // Check both endpoints of each road
      const endpoints = [road.pathPoints[0], road.pathPoints[road.pathPoints.length - 1]];
      
      for (const endpoint of endpoints) {
        // Find the closest wall point to this road endpoint
        const closestWallPoint = this.findClosestWallPoint(endpoint, wallPoints);
        
        if (closestWallPoint) {
          // Check if this road actually extends beyond the wall (i.e., needs a gate)
          const distanceToWall = Point.distance(endpoint, closestWallPoint);
          
          // Tighter distance requirement - road must be close to wall
          if (distanceToWall < 25) {
            const roadDirection = this.getRoadDirection(road, endpoint);
            
            rawIntersections.push({
              wallPoint: closestWallPoint,
              roadDirection: roadDirection,
              roadType: road.roadType,
              road: road,
              endpoint: endpoint
            });
          }
        }
      }
    }
    
    // Consolidate nearby intersections and prioritize main roads
    return this.consolidateGateIntersections(rawIntersections);
  }

  private consolidateGateIntersections(rawIntersections: Array<{
    wallPoint: Point;
    roadDirection: number;
    roadType: string;
    road: VillageRoad;
    endpoint: Point;
  }>): Array<{
    wallPoint: Point;
    roadDirection: number;
    roadType: string;
  }> {
    const consolidatedIntersections: Array<{
      wallPoint: Point;
      roadDirection: number;
      roadType: string;
    }> = [];
    
    // Sort by road priority (main roads first)
    const sortedIntersections = rawIntersections.sort((a, b) => {
      if (a.roadType === 'main' && b.roadType !== 'main') return -1;
      if (b.roadType === 'main' && a.roadType !== 'main') return 1;
      return 0;
    });
    
    const minGateDistance = 50; // Minimum distance between gates
    
    for (const intersection of sortedIntersections) {
      // Check if this intersection is too close to existing gates
      const tooCloseToExisting = consolidatedIntersections.some(existing => 
        Point.distance(existing.wallPoint, intersection.wallPoint) < minGateDistance
      );
      
      if (!tooCloseToExisting) {
        // For main roads, always create a gate
        // For side roads, only create if we don't have too many gates already
        const shouldCreateGate = intersection.roadType === 'main' || 
          (consolidatedIntersections.length < 3 && intersection.roadType === 'side');
        
        if (shouldCreateGate) {
          consolidatedIntersections.push({
            wallPoint: intersection.wallPoint,
            roadDirection: intersection.roadDirection,
            roadType: intersection.roadType
          });
        }
      }
    }
    
    // Limit total number of gates based on village size
    const maxGates = this.getMaxGates();
    return consolidatedIntersections.slice(0, maxGates);
  }

  private getMaxGates(): number {
    switch (this.options.size) {
      case 'tiny': return 1;   // Small hamlets have one gate
      case 'small': return 2;  // Villages can have up to 2 gates 
      case 'medium': return 3; // Medium villages can have up to 3 gates
      default: return 1;
    }
  }
  
  private findClosestWallPoint(roadPoint: Point, wallPoints: Point[]): Point | null {
    if (wallPoints.length === 0) return null;
    
    let closestPoint = wallPoints[0];
    let closestDistance = Point.distance(roadPoint, closestPoint);
    
    for (const wallPoint of wallPoints) {
      const distance = Point.distance(roadPoint, wallPoint);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = wallPoint;
      }
    }
    
    return closestPoint;
  }
  
  private findClosestPointOnPolygon(polygon: Polygon, targetPoint: Point): Point {
    let closestPoint = polygon.vertices[0];
    let closestDistance = Point.distance(closestPoint, targetPoint);
    
    for (const vertex of polygon.vertices) {
      const distance = Point.distance(vertex, targetPoint);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = vertex;
      }
    }
    
    return closestPoint;
  }

  private generateRuralExtensions(roads: VillageRoad[], walls: VillageWall[]): {
    extendedRoads: VillageRoad[];
    ruralBuildings: VillageBuilding[];
  } {
    const extendedRoads: VillageRoad[] = [];
    const ruralBuildings: VillageBuilding[] = [];
    let ruralBuildingCounter = 0; // Global counter for unique IDs
    let roadExtensionCounter = 0; // Global counter for unique road extension IDs

    // Only extend roads if there are walls (otherwise roads already extend naturally)
    if (walls.length === 0) {
      return { extendedRoads, ruralBuildings };
    }

    const mainRoads = roads.filter(road => road.roadType === 'main');
    
    for (const mainRoad of mainRoads) {
      // Extend from both ends of the main road
      const extensions = this.createRoadExtensions(mainRoad, walls[0], roadExtensionCounter);
      
      extendedRoads.push(...extensions.roads);
      roadExtensionCounter += extensions.roads.length; // Update counter
      
      // Place farms and rural buildings along extended roads
      for (const extendedRoad of extensions.roads) {
        const ruralStructures = this.placeRuralBuildingsAlongRoad(extendedRoad, extensions.gatePosition, ruralBuildingCounter);
        ruralBuildings.push(...ruralStructures);
        ruralBuildingCounter += ruralStructures.length; // Update counter
      }
    }

    return { extendedRoads, ruralBuildings };
  }

  private createRoadExtensions(mainRoad: VillageRoad, wall: VillageWall, startingIndex: number): {
    roads: VillageRoad[];
    gatePosition: Point | null;
  } {
    const extendedRoads: VillageRoad[] = [];
    let gatePosition: Point | null = null;
    let roadCounter = startingIndex;

    // Find where this main road intersects with the wall (gate location)
    const roadEndpoints = [mainRoad.pathPoints[0], mainRoad.pathPoints[mainRoad.pathPoints.length - 1]];
    
    for (let i = 0; i < roadEndpoints.length; i++) {
      const endpoint = roadEndpoints[i];
      const isStartPoint = i === 0;
      
      // Check if this endpoint is near a gate
      const nearGate = wall.gates?.find(gate => 
        Point.distance(gate.position, endpoint) < 30
      );

      if (nearGate) {
        gatePosition = nearGate.position;
        
        // Get road direction for extension
        const roadDirection = this.getRoadDirection(mainRoad, endpoint);
        const extensionLength = 60 + Random.float() * 40; // 60-100 units
        
        // Create extension that continues from the internal road through the gate
        const extensionPoints = this.createCurvedRoadExtension(
          nearGate.position,
          roadDirection,
          extensionLength
        );

        // Create a connecting road segment from the internal road endpoint to the gate
        const connectingPoints = [endpoint, nearGate.position];
        
        // Add connecting segment if there's distance between endpoint and gate
        if (Point.distance(endpoint, nearGate.position) > 5) {
          extendedRoads.push({
            id: `gate_connector_${roadCounter}`,
            pathPoints: connectingPoints,
            roadType: 'main',
            width: mainRoad.width
          });
          roadCounter++;
        }

        // Add the external extension
        extendedRoads.push({
          id: `extension_rural_${roadCounter}`,
          pathPoints: extensionPoints,
          roadType: 'main',
          width: mainRoad.width * 0.8 // Slightly narrower outside walls
        });
        roadCounter++;
      }
    }

    return { roads: extendedRoads, gatePosition };
  }

  private createCurvedRoadExtension(startPoint: Point, initialDirection: number, length: number): Point[] {
    const points: Point[] = [startPoint];
    const segments = 4;
    let currentDirection = initialDirection;
    
    for (let i = 1; i <= segments; i++) {
      const segmentProgress = i / segments;
      const segmentLength = length / segments;
      
      // Add slight random curve to make road more organic
      const curvature = (Random.float() - 0.5) * Math.PI / 8; // ±22.5 degrees max
      currentDirection += curvature * 0.3; // Gradual direction change
      
      const distance = segmentLength * i;
      const newPoint = new Point(
        startPoint.x + Math.cos(currentDirection) * distance,
        startPoint.y + Math.sin(currentDirection) * distance
      );
      
      points.push(newPoint);
    }
    
    return points;
  }

  private placeRuralBuildingsAlongRoad(road: VillageRoad, gatePosition: Point | null, startingIndex: number): VillageBuilding[] {
    const ruralBuildings: VillageBuilding[] = [];
    
    // Number of rural buildings depends on village size and road length
    const roadLength = this.calculateRoadLength(road);
    const maxRuralBuildings = Math.floor(roadLength / 30); // One building per 30 units roughly
    const numBuildings = Random.int(1, Math.min(maxRuralBuildings + 1, 4)); // Max 4 rural buildings per road
    
    for (let i = 0; i < numBuildings; i++) {
      const building = this.placeRuralBuilding(road, i, startingIndex + i);
      if (building) {
        ruralBuildings.push(building);
      }
    }
    
    return ruralBuildings;
  }

  private calculateRoadLength(road: VillageRoad): number {
    let length = 0;
    for (let i = 0; i < road.pathPoints.length - 1; i++) {
      length += Point.distance(road.pathPoints[i], road.pathPoints[i + 1]);
    }
    return length;
  }

  private placeRuralBuilding(road: VillageRoad, buildingIndex: number, globalBuildingIndex: number): VillageBuilding | null {
    // Choose a point along the road (avoid very close to start/end)
    const roadPointIndex = Random.int(1, road.pathPoints.length - 1);
    const roadPoint = road.pathPoints[roadPointIndex];
    
    // Place building to one side of the road
    const roadDirection = this.getRoadDirection(road, roadPoint);
    const sideAngle = roadDirection + (Random.bool() ? Math.PI/2 : -Math.PI/2);
    const setbackDistance = 15 + Random.float() * 10; // 15-25 units from road
    
    const buildingCenter = new Point(
      roadPoint.x + Math.cos(sideAngle) * setbackDistance,
      roadPoint.y + Math.sin(sideAngle) * setbackDistance
    );
    
    // Rural buildings are primarily farms, mills, or woodworker cabins
    const ruralBuildingTypes: VillageBuildingType[] = ['farm', 'mill', 'woodworker', 'house'];
    const buildingType = Random.choose(ruralBuildingTypes);
    
    // Create building polygon
    const polygon = this.createBuildingPolygon(buildingType, buildingCenter, roadDirection);
    
    const building: VillageBuilding = {
      id: `rural_${globalBuildingIndex}`,
      type: buildingType,
      polygon,
      entryPoint: this.findClosestPointOnPolygon(polygon, roadPoint),
      vocation: buildingType !== 'house' ? buildingType : undefined
    };

    // Generate procedural building plan if enabled
    if (this.options.proceduralBuildings) {
      const polygonSize = this.getBuildingSize(buildingType);
      building.proceduralPlan = this.generateProceduralBuildingPlan(buildingType, polygonSize, `rural_${globalBuildingIndex}`);
    }

    return building;
  }

  private generateProceduralBuildingPlan(
    villageType: VillageBuildingType, 
    polygonSize: { width: number; height: number },
    buildingId: string
  ): BuildingPlan {
    // Map village building types to procedural building types
    const buildingTypeMapping: Record<VillageBuildingType, BuildingPlan['buildingType']> = {
      // Basic Buildings
      'house': 'house_small',
      'inn': 'tavern',
      'blacksmith': 'blacksmith',
      'farm': 'house_small',
      'mill': 'house_small',
      'woodworker': 'house_small',
      'fisher': 'house_small',
      'market': 'shop',
      'chapel': 'house_small',
      'stable': 'house_small',
      'well': 'market_stall',
      'granary': 'house_small',

      // Magical Practitioners - mapped to appropriate building types
      'alchemist': 'shop',
      'herbalist': 'shop',
      'magic_shop': 'shop',
      'enchanter': 'shop',
      'fortune_teller': 'shop',
      'wizard_tower': 'house_large',
      'sorcerer_den': 'house_small',
      'warlock_sanctum': 'house_small',
      'druid_grove': 'house_small',
      'shaman_hut': 'house_small',

      // Religious & Divine
      'priest': 'house_small',
      'cleric': 'house_small',
      'paladin_order': 'house_large',
      'monk_monastery': 'house_large',
      'templar_hall': 'house_large',
      'shrine_keeper': 'house_small',
      'oracle': 'house_small',
      'blessed_healer': 'house_small',
      'divine_scribe': 'house_small',
      'relic_guardian': 'house_small',

      // Combat & Military (default mappings for remaining types)
      'guard_captain': 'house_small',
      'weapon_master': 'blacksmith',
      'armor_smith': 'blacksmith',
      'siege_engineer': 'blacksmith',
      'mercenary_leader': 'house_small',
      'knight_commander': 'house_large',
      'archer_trainer': 'house_small',
      'battle_tactician': 'house_small',
      'fortress_warden': 'house_large',
      'royal_guard': 'house_small',

      // Crafting & Production
      'master_jeweler': 'shop',
      'clockwork_engineer': 'shop',
      'instrument_maker': 'shop',
      'cartographer': 'shop',
      'scribe': 'shop',
      'bookbinder': 'shop',
      'ink_maker': 'shop',
      'parchment_maker': 'shop',
      'seal_engraver': 'shop',
      'guild_master': 'house_large',

      // Food & Hospitality
      'master_chef': 'tavern',
      'wine_merchant': 'shop',
      'spice_trader': 'shop',
      'feast_coordinator': 'shop',
      'tavern_keeper': 'tavern',
      'innkeeper': 'tavern',
      'stable_master': 'house_small',
      'caravan_guide': 'house_small',
      'provisions_supplier': 'shop',
      'cook': 'house_small',

      // Merchants & Traders
      'silk_merchant': 'shop',
      'exotic_trader': 'shop',
      'gem_dealer': 'shop',
      'rare_book_dealer': 'shop',
      'artifact_collector': 'shop',
      'curiosity_vendor': 'shop',
      'foreign_diplomat': 'house_large',
      'trade_negotiator': 'house_small',
      'caravan_master': 'house_small',
      'market_coordinator': 'shop',

      // Alchemical & Magical Industries
      'potion_brewery': 'shop',
      'magical_forge': 'blacksmith',
      'elemental_workshop': 'blacksmith',
      'crystal_mine': 'house_small',
      'mana_well': 'market_stall',
      'ley_line_nexus': 'house_large',
      'arcane_laboratory': 'shop',
      'transmutation_circle': 'house_small',
      'summoning_chamber': 'house_small',
      'scrying_pool': 'house_small',
      'divination_center': 'shop',
      'illusion_parlor': 'shop'
    };

    const proceduralType = buildingTypeMapping[villageType] || 'house_small';
    
    // Determine social class based on building type and village setting
    const socialClass = this.getSocialClassForBuilding(villageType);
    
    // Calculate lot size based on polygon size (convert from village units to building grid)
    // Village units are roughly 10 feet, building grid is 5 feet per tile
    const lotWidth = Math.max(6, Math.ceil(polygonSize.width / 5));
    const lotHeight = Math.max(6, Math.ceil(polygonSize.height / 5));
    
    // Generate seed based on building ID for consistency
    const seed = this.hashString(buildingId);
    
    return ProceduralBuildingGenerator.generateBuilding(
      proceduralType,
      socialClass,
      seed,
      { width: lotWidth, height: lotHeight }
    );
  }

  private getSocialClassForBuilding(buildingType: VillageBuildingType): BuildingPlan['socialClass'] {
    const wealthyTypes = [
      'wizard_tower', 'knight_commander', 'fortress_warden', 'guild_master', 
      'foreign_diplomat', 'ley_line_nexus', 'paladin_order', 'monk_monastery', 'templar_hall'
    ];
    
    const commonTypes = [
      'inn', 'blacksmith', 'market', 'alchemist', 'herbalist', 'magic_shop', 
      'master_chef', 'master_jeweler', 'tavern_keeper', 'silk_merchant'
    ];
    
    if (wealthyTypes.includes(buildingType)) return 'wealthy';
    if (commonTypes.includes(buildingType)) return 'common';
    return 'poor';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}