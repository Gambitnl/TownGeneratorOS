import { Point } from '@/types/point';
import { Polygon } from '@/types/polygon';
import { Street } from '@/types/street';
import { Random } from '@/utils/Random';

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

export interface VillageLayout {
  buildings: VillageBuilding[];
  roads: VillageRoad[];
  center: Point;
  bounds: Polygon;
}

export type VillageBuildingType = 
  | 'house' | 'inn' | 'blacksmith' | 'farm' | 'mill' | 'woodworker' 
  | 'fisher' | 'market' | 'chapel' | 'stable' | 'well' | 'granary';

export interface VillageOptions {
  size: 'tiny' | 'small' | 'medium';
  setting: 'farming' | 'coastal' | 'forest' | 'crossroads';
  includeWalls?: boolean;
  seed?: number;
}

// Core vocations that most villages have
const CORE_VOCATIONS: VillageBuildingType[] = ['inn', 'blacksmith'];

// Optional vocations based on setting and chance
const VOCATION_POOLS = {
  farming: ['mill', 'granary', 'stable'] as VillageBuildingType[],
  coastal: ['fisher', 'market'] as VillageBuildingType[],  
  forest: ['woodworker', 'mill'] as VillageBuildingType[],
  crossroads: ['market', 'stable', 'inn'] as VillageBuildingType[]
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
    
    return {
      buildings,
      roads,
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
    const settingCount = Math.min(settingPool.length, Random.int(1, 3));
    
    for (let i = 0; i < settingCount; i++) {
      const vocation = Random.choose(settingPool);
      if (!types.includes(vocation)) {
        types.push(vocation);
      }
    }
    
    // Add optional vocations based on village size
    const optionalVocations: VillageBuildingType[] = ['chapel', 'mill', 'well'];
    const optionalCount = this.options.size === 'medium' ? Random.int(1, 2) : Random.int(0, 1);
    
    for (let i = 0; i < optionalCount; i++) {
      const vocation = Random.choose(optionalVocations);
      if (!types.includes(vocation)) {
        types.push(vocation);
      }
    }
    
    // Fill remaining slots with houses
    const remainingSlots = count - types.length;
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
      const building = this.placeSingleBuilding(buildingType, roads, usedPositions, i);
      
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
    buildingIndex: number
  ): VillageBuilding | null {
    
    const maxAttempts = 20;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Choose road to place building near
      const road = this.selectRoadForBuilding(type, roads);
      const roadPoint = Random.choose(road.pathPoints);
      
      // Determine building placement offset from road
      const setbackDistance = this.getBuildingSetback(type, road.roadType);
      const setbackAngle = Random.float() * Math.PI * 2;
      
      const buildingCenter = new Point(
        roadPoint.x + Math.cos(setbackAngle) * setbackDistance,
        roadPoint.y + Math.sin(setbackAngle) * setbackDistance
      );
      
      // Check if position is valid
      if (!this.bounds.contains(buildingCenter)) continue;
      
      const tooClose = usedPositions.some(pos => 
        Point.distance(pos, buildingCenter) < this.getMinBuildingDistance(type)
      );
      
      if (tooClose) continue;
      
      // Create building polygon
      const polygon = this.createBuildingPolygon(type, buildingCenter, roadPoint);
      
      return {
        id: `building_${buildingIndex}`,
        type,
        polygon,
        entryPoint: this.findClosestPointOnPolygon(polygon, roadPoint),
        vocation: type !== 'house' ? type : undefined
      };
    }
    
    return null;
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
    let baseSetback = roadType === 'main' ? 8 : 5;
    
    // Farms need more space
    if (type === 'farm') baseSetback *= 2;
    
    // Add random variation
    return baseSetback + Random.float() * 10;
  }
  
  private getMinBuildingDistance(type: VillageBuildingType): number {
    return type === 'farm' ? 25 : 12;
  }
  
  private createBuildingPolygon(type: VillageBuildingType, center: Point, roadPoint: Point): Polygon {
    const size = this.getBuildingSize(type);
    const orientation = Math.atan2(roadPoint.y - center.y, roadPoint.x - center.x);
    
    // Create rectangular building oriented toward road
    const width = size.width;
    const height = size.height;
    
    const corners = [
      new Point(-width/2, -height/2),
      new Point(width/2, -height/2),
      new Point(width/2, height/2),
      new Point(-width/2, height/2)
    ];
    
    // Rotate and translate
    return new Polygon(corners.map(corner => {
      const rotatedX = corner.x * Math.cos(orientation) - corner.y * Math.sin(orientation);
      const rotatedY = corner.x * Math.sin(orientation) + corner.y * Math.cos(orientation);
      
      return new Point(center.x + rotatedX, center.y + rotatedY);
    }));
  }
  
  private getBuildingSize(type: VillageBuildingType): { width: number, height: number } {
    const baseSize = {
      house: { width: 8, height: 6 },
      inn: { width: 12, height: 10 },
      blacksmith: { width: 10, height: 8 },
      farm: { width: 15, height: 12 },
      mill: { width: 8, height: 8 },
      woodworker: { width: 10, height: 8 },
      fisher: { width: 8, height: 6 },
      market: { width: 12, height: 8 },
      chapel: { width: 10, height: 14 },
      stable: { width: 12, height: 8 },
      well: { width: 3, height: 3 },
      granary: { width: 8, height: 8 }
    };
    
    const size = baseSize[type] || baseSize.house;
    
    // Add slight variation
    const variation = 0.8 + Random.float() * 0.4;
    
    return {
      width: size.width * variation,
      height: size.height * variation
    };
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