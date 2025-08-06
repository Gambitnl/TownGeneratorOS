import { Point } from '@/types/point';
import { Polygon } from '@/types/polygon';
import { Street } from '@/types/street';
import { Random } from '@/utils/Random';
import { BuildingLibrary } from './BuildingLibrary';

export interface VillageBuilding {
  id: string;
  type: VillageBuildingType;
  polygon: Polygon;
  entryPoint: Point;
  vocation?: string;
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
  | 'house' | 'inn' | 'blacksmith' | 'farm' | 'mill' | 'woodworker' 
  | 'fisher' | 'market' | 'chapel' | 'stable' | 'well' | 'granary'
  | 'alchemist' | 'herbalist' | 'magic_shop' | 'temple' | 'monster_hunter' 
  | 'enchanter' | 'fortune_teller';

export interface VillageOptions {
  size: 'tiny' | 'small' | 'medium';
  setting: 'farming' | 'coastal' | 'forest' | 'crossroads';
  includeWalls?: boolean;
  seed?: number;
}

// Core vocations that most villages have
const CORE_VOCATIONS: VillageBuildingType[] = ['inn', 'blacksmith'];

// Fantasy/magical vocations that add D&D flavor
const FANTASY_VOCATIONS: VillageBuildingType[] = [
  'alchemist', 'herbalist', 'magic_shop', 'temple', 'monster_hunter', 
  'enchanter', 'fortune_teller'
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
    // 1. Generate road network
    const roads = this.generateRoadNetwork();
    
    // 2. Determine building count and types
    const buildingCount = this.getBuildingCount();
    const buildingTypes = this.selectBuildingTypes(buildingCount);
    
    // 3. Place buildings along roads
    const buildings = this.placeBuildingsAlongRoads(roads, buildingTypes);
    
    // 4. Generate walls if needed
    const walls = this.generateWalls(roads, buildings);
    
    return {
      buildings,
      roads,
      walls,
      center: this.center,
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
  
  private placeBuildingsAlongRoads(roads: VillageRoad[], buildingTypes: VillageBuildingType[]): VillageBuilding[] {
    const buildings: VillageBuilding[] = [];
    const usedPositions: Point[] = [];
    
    for (let i = 0; i < buildingTypes.length; i++) {
      const buildingType = buildingTypes[i];
      const building = this.placeSingleBuilding(buildingType, roads, usedPositions, i, buildings);
      
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
        
        return {
          id: `building_${buildingIndex}`,
          type,
          polygon,
          entryPoint: this.findClosestPointOnPolygon(polygon, roadPoint),
          vocation: type !== 'house' ? type : undefined
        };
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
    const intersections: Array<{
      wallPoint: Point;
      roadDirection: number;
      roadType: string;
    }> = [];
    
    // Check each road to see where it would intersect the wall
    for (const road of roads) {
      // Check both endpoints of each road
      const endpoints = [road.pathPoints[0], road.pathPoints[road.pathPoints.length - 1]];
      
      for (const endpoint of endpoints) {
        // Find the closest wall point to this road endpoint
        const closestWallPoint = this.findClosestWallPoint(endpoint, wallPoints);
        
        if (closestWallPoint) {
          // Check if this road actually extends beyond the wall (i.e., needs a gate)
          const distanceToWall = Point.distance(endpoint, closestWallPoint);
          
          // If the road endpoint is reasonably close to the wall, create a gate
          if (distanceToWall < 40) {
            const roadDirection = this.getRoadDirection(road, endpoint);
            
            // Don't create duplicate gates in the same area
            const existingNearby = intersections.some(existing => 
              Point.distance(existing.wallPoint, closestWallPoint) < 20
            );
            
            if (!existingNearby) {
              intersections.push({
                wallPoint: closestWallPoint,
                roadDirection: roadDirection,
                roadType: road.roadType
              });
            }
          }
        }
      }
    }
    
    return intersections;
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
}