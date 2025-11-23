
import { RNG, NoiseGenerator } from '../utils/rng';
import { Tile, TileType, TownMap, Building, BuildingType, DoodadType, TownOptions, BiomeType, TownDensity, RoofStyle, WallTexture } from '../types';

const WIDTH = 80; 
const HEIGHT = 60;

interface BiomeConfig {
    ground: TileType;
    beach: TileType;
    waterDeep: TileType;
    waterShallow: TileType;
    treeDensity: number;
    rockDensity: number;
    trees: DoodadType[];
    secondaryDoodads: DoodadType[];
    elevationOffset: number;
}

// Configuration table for all 20 biomes
const BIOME_DATA: Record<BiomeType, BiomeConfig> = {
    [BiomeType.PLAINS]: { ground: TileType.GRASS, beach: TileType.SAND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.4, rockDensity: 0.01, trees: [DoodadType.TREE_OAK], secondaryDoodads: [DoodadType.BUSH], elevationOffset: 0 },
    [BiomeType.FOREST]: { ground: TileType.GRASS, beach: TileType.SAND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.3, rockDensity: 0.02, trees: [DoodadType.TREE_OAK, DoodadType.TREE_PINE], secondaryDoodads: [DoodadType.BUSH, DoodadType.STUMP], elevationOffset: 0 },
    [BiomeType.DESERT]: { ground: TileType.SAND, beach: TileType.SAND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.95, rockDensity: 0.05, trees: [DoodadType.CACTUS], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0.05 },
    [BiomeType.TUNDRA]: { ground: TileType.SNOW, beach: TileType.DIRT, waterDeep: TileType.ICE, waterShallow: TileType.ICE, treeDensity: 0.7, rockDensity: 0.03, trees: [DoodadType.TREE_PINE], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0 },
    [BiomeType.TAIGA]: { ground: TileType.SNOW, beach: TileType.DIRT, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.ICE, treeDensity: 0.25, rockDensity: 0.03, trees: [DoodadType.TREE_PINE], secondaryDoodads: [DoodadType.STUMP], elevationOffset: 0.1 },
    [BiomeType.SWAMP]: { ground: TileType.MUD, beach: TileType.MUD, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.3, rockDensity: 0.02, trees: [DoodadType.TREE_OAK], secondaryDoodads: [DoodadType.BUSH], elevationOffset: -0.15 },
    [BiomeType.JUNGLE]: { ground: TileType.GRASS, beach: TileType.MUD, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.2, rockDensity: 0.04, trees: [DoodadType.TREE_PALM, DoodadType.TREE_OAK], secondaryDoodads: [DoodadType.BUSH], elevationOffset: 0 },
    [BiomeType.SAVANNA]: { ground: TileType.GRASS, beach: TileType.DIRT, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.7, rockDensity: 0.05, trees: [DoodadType.TREE_OAK], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0.05 },
    [BiomeType.BADLANDS]: { ground: TileType.DIRT, beach: TileType.SAND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.95, rockDensity: 0.15, trees: [DoodadType.TREE_DEAD], secondaryDoodads: [DoodadType.ROCK, DoodadType.CACTUS], elevationOffset: 0.1 },
    [BiomeType.MOUNTAIN]: { ground: TileType.ROCK_GROUND, beach: TileType.DIRT, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.6, rockDensity: 0.2, trees: [DoodadType.TREE_PINE], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0.2 },
    [BiomeType.VOLCANIC]: { ground: TileType.ASH, beach: TileType.ROCK_GROUND, waterDeep: TileType.LAVA, waterShallow: TileType.LAVA, treeDensity: 0.9, rockDensity: 0.3, trees: [DoodadType.TREE_DEAD], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0.1 },
    [BiomeType.OASIS]: { ground: TileType.SAND, beach: TileType.GRASS, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.8, rockDensity: 0.02, trees: [DoodadType.TREE_PALM], secondaryDoodads: [DoodadType.BUSH], elevationOffset: -0.1 }, // Bias to water
    [BiomeType.COASTAL]: { ground: TileType.SAND, beach: TileType.SAND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.6, rockDensity: 0.05, trees: [DoodadType.TREE_PALM], secondaryDoodads: [DoodadType.ROCK], elevationOffset: -0.15 },
    [BiomeType.MUSHROOM_FOREST]: { ground: TileType.MUD, beach: TileType.DIRT, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.4, rockDensity: 0.05, trees: [DoodadType.MUSHROOM], secondaryDoodads: [DoodadType.CRYSTAL], elevationOffset: 0 },
    [BiomeType.CRYSTAL_WASTES]: { ground: TileType.CRYSTAL_FLOOR, beach: TileType.ROCK_GROUND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.ICE, treeDensity: 0.8, rockDensity: 0.3, trees: [DoodadType.CRYSTAL], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0 },
    [BiomeType.AUTUMN_FOREST]: { ground: TileType.GRASS, beach: TileType.DIRT, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.3, rockDensity: 0.02, trees: [DoodadType.TREE_OAK], secondaryDoodads: [DoodadType.STUMP], elevationOffset: 0 },
    [BiomeType.CHERRY_BLOSSOM]: { ground: TileType.GRASS, beach: TileType.SAND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.35, rockDensity: 0.02, trees: [DoodadType.TREE_OAK], secondaryDoodads: [DoodadType.BUSH], elevationOffset: 0 },
    [BiomeType.GLACIER]: { ground: TileType.SNOW, beach: TileType.ICE, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.ICE, treeDensity: 0.9, rockDensity: 0.1, trees: [DoodadType.ROCK], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0.05 },
    [BiomeType.DEAD_LANDS]: { ground: TileType.DIRT, beach: TileType.MUD, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.5, rockDensity: 0.1, trees: [DoodadType.TREE_DEAD], secondaryDoodads: [DoodadType.STUMP], elevationOffset: 0 },
    [BiomeType.HIGHLANDS]: { ground: TileType.GRASS, beach: TileType.ROCK_GROUND, waterDeep: TileType.WATER_DEEP, waterShallow: TileType.WATER_SHALLOW, treeDensity: 0.8, rockDensity: 0.15, trees: [DoodadType.TREE_PINE], secondaryDoodads: [DoodadType.ROCK], elevationOffset: 0.2 },
};

export class TownGenerator {
  private rng: RNG;
  private noise: NoiseGenerator;
  private options: TownOptions;
  private biomeConfig: BiomeConfig;

  constructor(options: TownOptions) {
    this.rng = new RNG(options.seed);
    this.noise = new NoiseGenerator(options.seed);
    this.options = options;
    this.biomeConfig = BIOME_DATA[options.biome];
  }

  public generate(): TownMap {
    // 1. Initialize Grid
    let tiles: Tile[][] = [];
    for (let x = 0; x < WIDTH; x++) {
      tiles[x] = [];
      for (let y = 0; y < HEIGHT; y++) {
        tiles[x][y] = {
          x,
          y,
          type: TileType.EMPTY,
          variation: this.rng.next(),
          elevation: 0
        };
      }
    }

    // 2. Terrain Pass
    this.generateTerrain(tiles);

    // Determine Town Center (Randomized to avoid perfect symmetry)
    const centerX = Math.floor(WIDTH / 2) + this.rng.rangeInt(-12, 12);
    const centerY = Math.floor(HEIGHT / 2) + this.rng.rangeInt(-10, 10);
    const townCenter = { x: centerX, y: centerY };

    // 3. Plaza Pass
    this.generatePlaza(tiles, townCenter);

    // 4. Road Pass
    this.generateRoads(tiles, townCenter);

    // 5. Building Pass
    const buildings = this.placeBuildings(tiles, townCenter);

    // 6. Wall Pass
    this.generateWalls(tiles, buildings);
    
    // 7. Farm Pass - Now strictly attached to farmhouses
    this.attachFieldsToFarms(tiles, buildings);

    // 8. Dead End Decoration
    this.decorateDeadEnds(tiles);

    // 9. Doodad Pass
    this.placeDoodads(tiles);

    // 10. Street Lamps Pass
    this.placeStreetLamps(tiles);

    return {
      width: WIDTH,
      height: HEIGHT,
      tiles,
      buildings,
      seed: this.options.seed,
      biome: this.options.biome
    };
  }

  private generateTerrain(tiles: Tile[][]) {
    const scale = 0.02; 
    const { ground, beach, waterDeep, waterShallow, elevationOffset } = this.biomeConfig;

    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < HEIGHT; y++) {
        // Base noise
        let val = this.noise.noise(x * scale, y * scale);
        val += this.noise.noise(x * 0.08, y * 0.08) * 0.1;
        
        const dx = (x - WIDTH / 2) / (WIDTH / 2);
        const dy = (y - HEIGHT / 2) / (HEIGHT / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Bias towards center land
        const centerBias = 0.25 * (1.0 - Math.min(1.0, dist));
        
        let elevation = val + centerBias + elevationOffset;
        elevation = Math.max(0, Math.min(1, elevation));
        tiles[x][y].elevation = elevation;

        // Thresholds
        if (elevation < 0.35) {
          tiles[x][y].type = waterDeep;
        } else if (elevation < 0.42) {
          tiles[x][y].type = waterShallow;
        } else if (elevation < 0.48) {
          tiles[x][y].type = beach;
        } else {
          tiles[x][y].type = ground;
        }
      }
    }
  }

  private generatePlaza(tiles: Tile[][], center: {x: number, y: number}) {
      const cx = center.x;
      const cy = center.y;

      // Very sparse towns shouldn't have a paved plaza, just a simple well at the crossroads
      if (this.options.density === TownDensity.VERY_SPARSE) {
           const isWater = (t: TileType) => t === TileType.WATER_DEEP || t === TileType.WATER_SHALLOW || t === TileType.LAVA || t === TileType.ICE;
           if (!isWater(tiles[cx][cy].type)) {
               tiles[cx][cy].doodad = {
                   type: DoodadType.WELL,
                   id: 'town-center',
                   offsetX: 0, offsetY: 0
               };
           }
           return;
      }

      const size = 3; 
      const isWater = (t: TileType) => t === TileType.WATER_DEEP || t === TileType.WATER_SHALLOW || t === TileType.LAVA || t === TileType.ICE;
      if (isWater(tiles[cx][cy].type)) return;

      for(let x = cx - size; x <= cx + size; x++) {
          for(let y = cy - size; y <= cy + size; y++) {
              if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                  if (!isWater(tiles[x][y].type)) {
                      // Rounded corners
                      const d = Math.sqrt((x-cx)**2 + (y-cy)**2);
                      if (d <= size) {
                          tiles[x][y].type = TileType.ROAD_MAIN;
                      }
                  }
              }
          }
      }
      // Feature in the middle
      tiles[cx][cy].doodad = {
          type: DoodadType.WELL,
          id: 'town-center',
          offsetX: 0, offsetY: 0
      };
  }

  private generateRoads(tiles: Tile[][], center: {x: number, y: number}) {
    const isWater = (t: TileType) => t === TileType.WATER_DEEP || t === TileType.WATER_SHALLOW || t === TileType.LAVA || t === TileType.ICE;

    // Check if center is water
    if (isWater(tiles[center.x][center.y].type)) return;

    // Determine main road type based on density. Very sparse towns have dirt roads.
    const mainRoadType = this.options.density === TownDensity.VERY_SPARSE ? TileType.ROAD_DIRT : TileType.ROAD_MAIN;

    // 1. Main Arteries
    const targets: {x: number, y: number}[] = [];
    
    // Randomize exits along edges to break '+' shape
    // We vary the exit point by +/- 20 tiles from the center of the edge
    const exitDev = 20;

    if (this.options.connections.north) targets.push({ x: Math.floor(WIDTH/2 + this.rng.range(-exitDev, exitDev)), y: 0 });
    if (this.options.connections.south) targets.push({ x: Math.floor(WIDTH/2 + this.rng.range(-exitDev, exitDev)), y: HEIGHT-1 });
    if (this.options.connections.east) targets.push({ x: WIDTH-1, y: Math.floor(HEIGHT/2 + this.rng.range(-exitDev, exitDev)) });
    if (this.options.connections.west) targets.push({ x: 0, y: Math.floor(HEIGHT/2 + this.rng.range(-exitDev, exitDev)) });
    
    if (targets.length === 0) targets.push({ x: Math.floor(WIDTH/2), y: HEIGHT-1 });

    const arteryPoints: {x: number, y: number}[] = []; 

    for (const target of targets) {
        let cx = center.x;
        let cy = center.y;
        
        const totalDx = target.x - cx;
        const totalDy = target.y - cy;
        const distTotal = Math.sqrt(totalDx*totalDx + totalDy*totalDy);
        const stepX = totalDx / distTotal;
        const stepY = totalDy / distTotal;
        
        let currentDist = 0;

        while (currentDist < distTotal) {
            // Organic wander
            // Apply noise perpendicular to direction of travel to make roads wind
            const noiseVal = this.noise.noise(cx * 0.05, cy * 0.05);
            const curve = (noiseVal - 0.5) * 0.8; 

            // Perpendicular vector: (-stepY, stepX)
            cx += stepX + (-stepY * curve); 
            cy += stepY + (stepX * curve);

            const ix = Math.floor(cx);
            const iy = Math.floor(cy);
            
            if (ix < 0 || ix >= WIDTH || iy < 0 || iy >= HEIGHT) break;
            
            const t = tiles[ix][iy].type;

            // Bridge Check
            if (t === TileType.WATER_SHALLOW) {
                if (this.tryBuildBridge(tiles, ix, iy, stepX, stepY)) {
                    currentDist++;
                    continue;
                }
            }

            if (t === TileType.WATER_DEEP || t === TileType.WATER_SHALLOW) {
                this.createDock(tiles, ix, iy, stepX, stepY);
                break; 
            }
            if (t === TileType.LAVA) break; 

            if (tiles[ix][iy].type !== mainRoadType && tiles[ix][iy].type !== TileType.DOCK && tiles[ix][iy].type !== TileType.BRIDGE) {
                tiles[ix][iy].type = mainRoadType;
                tiles[ix][iy].doodad = undefined; 
                arteryPoints.push({x: ix, y: iy});
            }
            currentDist++;
        }
    }

    // 2. Ring Roads
    if (this.options.density !== TownDensity.VERY_SPARSE && this.options.density !== TownDensity.SPARSE) {
        const rings = [12, 22]; 
        for (const r of rings) {
            if (this.rng.chance(0.4)) {
               this.createRingRoad(tiles, center.x, center.y, r);
            }
        }
    }

    // 3. Secondary Streets
    const allRoadPoints: {x:number, y:number}[] = [];
    for(let x=0; x<WIDTH; x++){
        for(let y=0; y<HEIGHT; y++){
            if(tiles[x][y].type === mainRoadType) allRoadPoints.push({x,y});
        }
    }
    
    allRoadPoints.sort((a, b) => {
        const da = (a.x - center.x)**2 + (a.y - center.y)**2;
        const db = (b.x - center.x)**2 + (b.y - center.y)**2;
        return da - db;
    });

    const processed = new Set<string>();
    
    let branchChance = 0.15; 
    switch (this.options.density) {
        case TownDensity.VERY_SPARSE: branchChance = 0.05; break; 
        case TownDensity.SPARSE: branchChance = 0.10; break;
        case TownDensity.MEDIUM: branchChance = 0.20; break; 
        case TownDensity.HIGH: branchChance = 0.35; break; 
        case TownDensity.EXTREME: branchChance = 0.60; break; 
    }

    for (const pt of allRoadPoints) {
        const hash = `${pt.x},${pt.y}`;
        if (processed.has(hash)) continue;
        processed.add(hash);

        if (this.rng.rangeInt(0, 100) > (branchChance * 100)) continue; 

        const dirs = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
        this.rng.pick(dirs); 
        
        for (const dir of dirs) {
            const nx = pt.x + dir.x;
            const ny = pt.y + dir.y;
            
            if (nx>=0 && nx<WIDTH && ny>=0 && ny<HEIGHT && tiles[nx][ny].type === mainRoadType) continue;

            if (this.rng.chance(0.6)) {
                // Allow Organic streets that turn
                this.createStreet(tiles, pt.x, pt.y, dir.x, dir.y, this.rng.rangeInt(4, 12));
            }
        }
    }
  }

  private tryBuildBridge(tiles: Tile[][], startX: number, startY: number, dirX: number, dirY: number): boolean {
      const dx = dirX > 0 ? 1 : (dirX < 0 ? -1 : 0);
      const dy = dirY > 0 ? 1 : (dirY < 0 ? -1 : 0);
      
      // Don't bridge diagonal
      if (dx !== 0 && dy !== 0) return false;

      const maxBridgeLen = 6;
      let foundLand = false;
      let bridgeLen = 0;

      for (let i = 1; i <= maxBridgeLen; i++) {
          const tx = startX + dx * i;
          const ty = startY + dy * i;
          if (tx < 0 || tx >= WIDTH || ty < 0 || ty >= HEIGHT) return false;
          
          const t = tiles[tx][ty].type;
          if (t !== TileType.WATER_DEEP && t !== TileType.WATER_SHALLOW) {
              foundLand = true;
              bridgeLen = i;
              break;
          }
      }

      if (foundLand && bridgeLen > 0) {
          for(let i = 0; i < bridgeLen; i++) {
              const tx = startX + dx * i;
              const ty = startY + dy * i;
              if (tiles[tx][ty].type === TileType.WATER_SHALLOW || tiles[tx][ty].type === TileType.WATER_DEEP) {
                  tiles[tx][ty].type = TileType.BRIDGE;
                  tiles[tx][ty].doodad = undefined;
              }
          }
          return true;
      }
      return false;
  }

  private createRingRoad(tiles: Tile[][], cx: number, cy: number, radius: number) {
      const steps = radius * 4; 
      for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const rx = Math.round(cx + Math.cos(angle) * radius);
          const ry = Math.round(cy + Math.sin(angle) * radius * 0.8); 

          if (rx >= 1 && rx < WIDTH-1 && ry >= 1 && ry < HEIGHT-1) {
              const t = tiles[rx][ry].type;
              if ([TileType.WATER_DEEP, TileType.WATER_SHALLOW, TileType.LAVA, TileType.ICE, TileType.DOCK, TileType.BRIDGE].includes(t)) continue;
              
              if (t !== TileType.ROAD_MAIN) {
                  tiles[rx][ry].type = TileType.ROAD_MAIN;
              }
          }
      }
  }

  private createDock(tiles: Tile[][], startX: number, startY: number, dirX: number, dirY: number) {
      let dx = 0;
      let dy = 0;
      if (Math.abs(dirX) > Math.abs(dirY)) {
          dx = dirX > 0 ? 1 : -1;
      } else {
          dy = dirY > 0 ? 1 : -1;
      }

      const length = this.rng.rangeInt(4, 7);
      let cx = startX;
      let cy = startY;

      for(let i=0; i<length; i++) {
          if (cx < 0 || cx >= WIDTH || cy < 0 || cy >= HEIGHT) break;
          tiles[cx][cy].type = TileType.DOCK;
          cx += dx;
          cy += dy;
      }
      
      if (this.rng.chance(0.5) && cx >= 1 && cx < WIDTH-1 && cy >= 1 && cy < HEIGHT-1) {
          if (dx !== 0) {
              tiles[cx][cy].type = TileType.DOCK;
              tiles[cx][cy-1].type = TileType.DOCK;
              tiles[cx][cy+1].type = TileType.DOCK;
          } else {
              tiles[cx][cy].type = TileType.DOCK;
              tiles[cx-1][cy].type = TileType.DOCK;
              tiles[cx+1][cy].type = TileType.DOCK;
          }
      }
  }

  private createStreet(tiles: Tile[][], startX: number, startY: number, dx: number, dy: number, length: number) {
      let cx = startX;
      let cy = startY;
      
      let currentDx = dx;
      let currentDy = dy;

      for(let i=0; i<length; i++) {
          cx += currentDx;
          cy += currentDy;
          
          if (cx < 1 || cx >= WIDTH-1 || cy < 1 || cy >= HEIGHT-1) break;
          
          const t = tiles[cx][cy];
          if (t.type === TileType.ROAD_MAIN) break; 
          if ([TileType.WATER_DEEP, TileType.WATER_SHALLOW, TileType.LAVA, TileType.ICE, TileType.DOCK, TileType.BRIDGE].includes(t.type)) break;
          
          tiles[cx][cy].type = TileType.ROAD_DIRT;

          // Asymmetrical/Organic Turn Chance
          if (i > 2 && i < length - 2 && this.rng.chance(0.2)) {
              if (currentDx !== 0) {
                  currentDy = this.rng.chance(0.5) ? 1 : -1;
                  currentDx = 0;
              } else {
                  currentDx = this.rng.chance(0.5) ? 1 : -1;
                  currentDy = 0;
              }
          }
      }

      // Cul-de-sac at the end (Full block 3x3)
      if (this.options.density !== TownDensity.VERY_SPARSE && this.options.density !== TownDensity.SPARSE) {
          if (this.rng.chance(0.5)) {
              this.createCulDeSac(tiles, cx, cy);
          }
      }
  }

  private createCulDeSac(tiles: Tile[][], cx: number, cy: number) {
      const neighbors = [
          {x:0, y:0}, {x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1},
          {x:1, y:1}, {x:-1, y:1}, {x:1, y:-1}, {x:-1, y:-1}
      ];
      
      for (const n of neighbors) {
          const tx = cx + n.x;
          const ty = cy + n.y;
          
          if (tx < 1 || tx >= WIDTH-1 || ty < 1 || ty >= HEIGHT-1) continue;
          if ([TileType.WATER_DEEP, TileType.WATER_SHALLOW, TileType.BRIDGE, TileType.DOCK].includes(tiles[tx][ty].type)) continue;
          
          tiles[tx][ty].type = TileType.ROAD_DIRT;
          tiles[tx][ty].doodad = undefined;
      }
  }

  private placeBuildings(tiles: Tile[][], center: {x: number, y: number}): Building[] {
    const buildings: Building[] = [];

    const roadTiles: {x: number, y: number}[] = [];
    for (let x = 1; x < WIDTH - 1; x++) {
        for (let y = 1; y < HEIGHT - 1; y++) {
            if (tiles[x][y].type === TileType.ROAD_MAIN || tiles[x][y].type === TileType.ROAD_DIRT) {
                roadTiles.push({x, y});
            }
        }
    }

    const densityNoiseOffset = this.rng.next() * 100;
    
    let densityThreshold = 0.5;
    switch (this.options.density) {
        case TownDensity.VERY_SPARSE: densityThreshold = 0.85; break; 
        case TownDensity.SPARSE: densityThreshold = 0.75; break;
        case TownDensity.MEDIUM: densityThreshold = 0.65; break; 
        case TownDensity.HIGH: densityThreshold = 0.5; break; 
        case TownDensity.EXTREME: densityThreshold = 0.3; break; 
    }

    this.rng.pick(roadTiles); 

    for (const rt of roadTiles) {
        const districtVal = this.noise.noise(rt.x * 0.1 + densityNoiseOffset, rt.y * 0.1 + densityNoiseOffset);
        const dist = Math.sqrt((rt.x - center.x)**2 + (rt.y - center.y)**2);
        
        let canSpawn = false;
        
        if (this.options.density === TownDensity.VERY_SPARSE) {
            canSpawn = this.rng.chance(0.05);
        } else {
             if ((1 - districtVal) > densityThreshold || dist < 10) {
                 canSpawn = true;
             }
        }
        
        if (!canSpawn) continue;

        const dirs = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
        for (const dir of dirs) {
            const plotX = rt.x + dir.x;
            const plotY = rt.y + dir.y;
            
            let attemptSizes = [];
            // Varied sizes and types based on distance
            if (dist < 15) {
                attemptSizes.push({w: 3, h: 4}); 
                attemptSizes.push({w: 4, h: 3}); 
                attemptSizes.push({w: 3, h: 3}); 
            } 
            attemptSizes.push({w: 2, h: 2}); 
            attemptSizes.push({w: 2, h: 3}); 
            attemptSizes.push({w: 3, h: 2}); 
            
            for (const size of attemptSizes) {
                let bx = plotX;
                let by = plotY;
                if (dir.x === -1) bx = plotX - size.w + 1;
                if (dir.y === -1) by = plotY - size.h + 1;

                if (this.canBuild(tiles, bx, by, size.w, size.h)) {
                    const b = this.createBuilding(tiles, bx, by, size.w, size.h, rt, dist);
                    buildings.push(b);
                    break; 
                }
            }
        }
    }

    return buildings;
  }

  private canBuild(tiles: Tile[][], x: number, y: number, w: number, h: number): boolean {
      if (x < 5 || x + w >= WIDTH-5 || y < 5 || y + h >= HEIGHT-5) return false;
      
      const validGround = [
          TileType.GRASS, TileType.SAND, TileType.DIRT, TileType.SNOW, 
          TileType.ASH, TileType.MUD, TileType.ROCK_GROUND, TileType.CRYSTAL_FLOOR
      ];

      for(let bx = x; bx < x + w; bx++) {
          for(let by = 0; by < h; by++) {
              const t = tiles[bx][y+by];
              if(!validGround.includes(t.type)) return false;
              if(t.buildingId) return false;
              if(t.doodad) return false;
          }
      }
      return true;
  }

  private createBuilding(tiles: Tile[][], x: number, y: number, w: number, h: number, roadTile: {x:number, y:number}, distToCenter: number): Building {
      const id = `b_${x}_${y}`;
      let type = BuildingType.HOUSE_SMALL;
      
      if (w >= 3 && h >= 3) {
          if (distToCenter < 8 && this.rng.chance(0.3)) type = BuildingType.CHURCH;
          else if (distToCenter < 12 && this.rng.chance(0.4)) type = BuildingType.TAVERN;
          else if (distToCenter < 15 && this.rng.chance(0.2)) type = BuildingType.MANOR;
          else if (this.rng.chance(0.3)) type = BuildingType.BLACKSMITH;
          else type = BuildingType.HOUSE_LARGE;
      } else if (w === 2 && h === 2) {
           if (distToCenter > 20 && this.rng.chance(0.4)) type = BuildingType.FARM_HOUSE;
           else if (distToCenter < 20 && this.rng.chance(0.05)) type = BuildingType.TOWER;
           else type = BuildingType.HOUSE_SMALL;
      } else {
           if (distToCenter < 10 && this.rng.chance(0.3)) type = BuildingType.MARKET_STALL;
           else type = BuildingType.HOUSE_SMALL;
      }

      for(let bx = 0; bx < w; bx++) {
          for(let by = 0; by < h; by++) {
              tiles[x+bx][y+by].type = TileType.BUILDING_FLOOR;
              tiles[x+bx][y+by].buildingId = id;
          }
      }

      let doorX = 0;
      let doorY = 0;
      let minD = 999;
      
      for(let bx = 0; bx < w; bx++) {
          let d = (x+bx - roadTile.x)**2 + (y - roadTile.y)**2;
          if(d < minD) { minD = d; doorX = bx; doorY = 0; }
          d = (x+bx - roadTile.x)**2 + (y+h-1 - roadTile.y)**2;
          if(d < minD) { minD = d; doorX = bx; doorY = h-1; }
      }
      for(let by = 0; by < h; by++) {
          let d = (x - roadTile.x)**2 + (y+by - roadTile.y)**2;
          if(d < minD) { minD = d; doorX = 0; doorY = by; }
          d = (x+w-1 - roadTile.x)**2 + (y+by - roadTile.y)**2;
          if(d < minD) { minD = d; doorX = w-1; doorY = by; }
      }

      let color = '#ffedd5';
      let roof = '#78350f';
      
      // Visual Variations
      let roofStyle = this.rng.pick([RoofStyle.THATCHED, RoofStyle.TILED, RoofStyle.SLATE]);
      let wallTexture = this.rng.pick([WallTexture.TIMBER_FRAME, WallTexture.STONE, WallTexture.STUCCO, WallTexture.WOOD]);

      // DENSITY OVERRIDES: Rustic look for Very Sparse
      if (this.options.density === TownDensity.VERY_SPARSE) {
          wallTexture = this.rng.pick([WallTexture.WOOD, WallTexture.TIMBER_FRAME]);
          roofStyle = this.rng.pick([RoofStyle.THATCHED, RoofStyle.SLATE]);
          
          // Downgrade fancy buildings
          if (type === BuildingType.MANOR) type = BuildingType.FARM_HOUSE;
          if (type === BuildingType.TOWER) type = BuildingType.HOUSE_SMALL;
          
          // Make church look simpler
          if (type === BuildingType.CHURCH) {
              color = '#d6d3d1'; // Stone 300
              roof = '#57534e';  // Grey roof instead of blue
          }
          // Rustic Tavern
          if (type === BuildingType.TAVERN) {
               color = '#78350f'; 
               roof = '#451a03';
          }
      }

      // Set defaults based on style to ensure good color matches
      if (roofStyle === RoofStyle.THATCHED) roof = '#d97706'; // Amber
      if (roofStyle === RoofStyle.TILED) roof = '#991b1b'; // Red clay
      if (roofStyle === RoofStyle.SLATE) roof = '#334155'; // Slate grey

      // Type-specific Overrides
      if (type === BuildingType.TAVERN) { color = '#fbbf24'; roof = '#1e3a8a'; } // Keeps blue roof
      if (type === BuildingType.BLACKSMITH) { color = '#94a3b8'; roof = '#334155'; }
      if (type === BuildingType.HOUSE_LARGE) { roof = '#7f1d1d'; }
      if (type === BuildingType.CHURCH) { color = '#e2e8f0'; roof = '#4f46e5'; }
      if (type === BuildingType.MANOR) { color = '#d1fae5'; roof = '#065f46'; }
      if (type === BuildingType.TOWER) { color = '#9ca3af'; roof = '#111827'; }
      if (type === BuildingType.FARM_HOUSE) { color = '#fef3c7'; roof = '#92400e'; }
      
      // Random flavor overrides if standard house
      if (type === BuildingType.HOUSE_SMALL && this.rng.chance(0.3)) roof = '#57534e';

      // Re-apply density override for roof color if needed (since the block above ran before the defaults)
      if (this.options.density === TownDensity.VERY_SPARSE) {
           if (roofStyle === RoofStyle.THATCHED) roof = '#d97706';
           if (type === BuildingType.CHURCH) roof = '#57534e';
      }

      return {
          id, type, x, y, width: w, height: h, doorX, doorY, color, roofColor: roof, roofStyle, wallTexture
      };
  }

  private attachFieldsToFarms(tiles: Tile[][], buildings: Building[]) {
      // Skip farms for hostile or frozen environments
      if ([BiomeType.DESERT, BiomeType.GLACIER, BiomeType.VOLCANIC, BiomeType.CRYSTAL_WASTES, BiomeType.BADLANDS].includes(this.options.biome)) return;

      const farmHouses = buildings.filter(b => b.type === BuildingType.FARM_HOUSE);
      
      for (const house of farmHouses) {
          // Assign a "Family Crop" to this house
          const familyCrop = this.rng.pick([DoodadType.CROP_WHEAT, DoodadType.CROP_CORN, DoodadType.CROP_PUMPKIN]);
          
          // Attempt to place 1-3 fields around the house
          const numFields = this.rng.rangeInt(1, 3);
          let fieldsPlaced = 0;

          // Try all 4 directions (North, South, East, West) + variations
          const directions = [
              { dx: 0, dy: -1 }, // North
              { dx: 0, dy: 1 },  // South
              { dx: 1, dy: 0 },  // East
              { dx: -1, dy: 0 }  // West
          ];
          
          // Shuffle directions
          for (let i = directions.length - 1; i > 0; i--) {
              const j = Math.floor(this.rng.next() * (i + 1));
              [directions[i], directions[j]] = [directions[j], directions[i]];
          }

          for (const dir of directions) {
              if (fieldsPlaced >= numFields) break;

              // Determine random size for this field
              const fw = this.rng.rangeInt(3, 7);
              const fh = this.rng.rangeInt(3, 7);

              // Determine start position relative to house
              // Add a 1-tile buffer so it looks like a yard
              let startX = house.x;
              let startY = house.y;

              if (dir.dx === 1) startX = house.x + house.width + 1;
              if (dir.dx === -1) startX = house.x - fw - 1;
              if (dir.dy === 1) startY = house.y + house.height + 1;
              if (dir.dy === -1) startY = house.y - fh - 1;

              // Align centers if moving vertically, or horizontally
              if (dir.dx !== 0) {
                  // Adjust Y slightly to align with house or vary
                  startY += this.rng.rangeInt(-2, 2);
              } else {
                  startX += this.rng.rangeInt(-2, 2);
              }

              if (this.canPlaceFarm(tiles, startX, startY, fw, fh)) {
                  this.createFarmField(tiles, startX, startY, fw, fh, familyCrop);
                  fieldsPlaced++;
              }
          }
      }
  }

  private canPlaceFarm(tiles: Tile[][], x: number, y: number, w: number, h: number): boolean {
      if (x < 1 || x + w >= WIDTH - 1 || y < 1 || y + h >= HEIGHT - 1) return false;

      for(let fx = x; fx < x + w; fx++) {
          for(let fy = y; fy < y + h; fy++) {
              const t = tiles[fx][fy];
              // Must be on soil
              if (t.type !== TileType.GRASS && t.type !== TileType.DIRT && t.type !== TileType.MUD) return false;
              // Cannot overwrite existing structures/roads
              if (t.buildingId || t.doodad) return false;
          }
      }
      return true;
  }

  private createFarmField(tiles: Tile[][], x: number, y: number, w: number, h: number, crop: DoodadType) {
      for(let fx = x; fx < x + w; fx++) {
          for(let fy = y; fy < y + h; fy++) {
              tiles[fx][fy].type = TileType.FARM;
              // Plant crops in rows
              if (fx % 2 === 0) {
                  tiles[fx][fy].doodad = {
                      type: crop,
                      id: `crop_${fx}_${fy}`,
                      offsetX: 0, offsetY: 0
                  };
              }
          }
      }
  }

  private generateWalls(tiles: Tile[][], buildings: Building[]) {
      if (this.options.density === TownDensity.VERY_SPARSE || this.options.density === TownDensity.SPARSE) return;
      if (buildings.length < 5) return;

      let minX = WIDTH, maxX = 0, minY = HEIGHT, maxY = 0;
      for (const b of buildings) {
          if (b.x < minX) minX = b.x;
          if (b.x + b.width > maxX) maxX = b.x + b.width;
          if (b.y < minY) minY = b.y;
          if (b.y + b.height > maxY) maxY = b.y + b.height;
      }

      const padding = 6;
      minX = Math.max(2, minX - padding);
      maxX = Math.min(WIDTH - 3, maxX + padding);
      minY = Math.max(2, minY - padding);
      maxY = Math.min(HEIGHT - 3, maxY + padding);

      const isWater = (t: TileType) => t === TileType.WATER_DEEP || t === TileType.WATER_SHALLOW || t === TileType.LAVA || t === TileType.ICE;
      
      const setWall = (x: number, y: number) => {
          if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
          const t = tiles[x][y].type;
          
          if (isWater(t)) return; 
          if (t === TileType.ROAD_MAIN) return;
          if (t === TileType.BUILDING_FLOOR) return; 

          tiles[x][y].type = TileType.WALL;
          tiles[x][y].doodad = undefined; 
      };

      for (let x = minX; x <= maxX; x++) {
          setWall(x, minY);
          setWall(x, maxY);
      }
      for (let y = minY; y <= maxY; y++) {
          setWall(minX, y);
          setWall(maxX, y);
      }
      
      tiles[minX][minY].type = TileType.EMPTY; setWall(minX+1, minY+1);
      tiles[maxX][minY].type = TileType.EMPTY; setWall(maxX-1, minY+1);
      tiles[minX][maxY].type = TileType.EMPTY; setWall(minX+1, maxY-1);
      tiles[maxX][maxY].type = TileType.EMPTY; setWall(maxX-1, maxY-1);
  }

  private placeDoodads(tiles: Tile[][]) {
    const { treeDensity, rockDensity, trees, secondaryDoodads } = this.biomeConfig;
    const treeThreshold = 1.0 - treeDensity;

    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < HEIGHT; y++) {
            const t = tiles[x][y];
            const validGround = [
              TileType.GRASS, TileType.SAND, TileType.DIRT, TileType.SNOW, 
              TileType.ASH, TileType.MUD, TileType.ROCK_GROUND, TileType.CRYSTAL_FLOOR
            ];

            if (!validGround.includes(t.type)) continue;
            if (t.buildingId) continue;
            if (t.type === TileType.WALL) continue;
            if (t.type === TileType.FARM) continue; 
            if (t.doodad) continue; // Skip if already has doodad (e.g. from decorateDeadEnds)

            const forestNoise = this.noise.noise(x * 0.15, y * 0.15);
            
            if (forestNoise > treeThreshold) {
                if (this.rng.chance(0.6)) {
                    const treeType = this.rng.pick(trees);
                    t.doodad = {
                        type: treeType,
                        id: `d_${x}_${y}`, offsetX: 0, offsetY: 0
                    };
                }
            }
            else if (this.rng.chance(rockDensity)) {
                 const doodad = this.rng.pick(secondaryDoodads);
                 t.doodad = { type: doodad, id: `d_${x}_${y}`, offsetX: 0, offsetY: 0 };
            }
        }
    }
  }

  private placeStreetLamps(tiles: Tile[][]) {
      if (this.options.density === TownDensity.VERY_SPARSE) return;

      for (let x = 2; x < WIDTH - 2; x++) {
          for (let y = 2; y < HEIGHT - 2; y++) {
              if (tiles[x][y].type === TileType.ROAD_MAIN) {
                  // Place lamps at regular intervals
                  if ((x + y) % 6 === 0) {
                      // Look for an empty adjacent spot (not road, not building)
                      const neighbors = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
                      for(const n of neighbors) {
                          const nx = x + n.x;
                          const ny = y + n.y;
                          const t = tiles[nx][ny];
                          
                          if (![TileType.ROAD_MAIN, TileType.ROAD_DIRT, TileType.BUILDING_FLOOR, TileType.WALL, TileType.WATER_DEEP, TileType.LAVA].includes(t.type) && !t.doodad && !t.buildingId) {
                              t.doodad = {
                                  type: DoodadType.STREET_LAMP,
                                  id: `lamp_${nx}_${ny}`,
                                  offsetX: 0, offsetY: 0
                              };
                              break; // Only one lamp per interval
                          }
                      }
                  }
              }
          }
      }
  }

  private decorateDeadEnds(tiles: Tile[][]) {
    const deadEnds: {x: number, y: number, neighbor: {x:number, y:number}}[] = [];
    const roadTypes = [TileType.ROAD_MAIN, TileType.ROAD_DIRT];

    for (let x = 1; x < WIDTH - 1; x++) {
        for (let y = 1; y < HEIGHT - 1; y++) {
            const t = tiles[x][y];
            if (roadTypes.includes(t.type)) {
                 const neighbors = [];
                 const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                 for(const [dx, dy] of dirs) {
                     const nx = x + dx;
                     const ny = y + dy;
                     if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
                         const nt = tiles[nx][ny].type;
                         // Include roads, bridges, and docks as valid connections
                         if (roadTypes.includes(nt) || nt === TileType.BRIDGE || nt === TileType.DOCK) {
                             neighbors.push({x: nx, y: ny});
                         }
                     }
                 }
                 
                 // A dead end has exactly 1 neighbor.
                 if (neighbors.length === 1) {
                     deadEnds.push({x, y, neighbor: neighbors[0]});
                 }
            }
        }
    }

    for (const end of deadEnds) {
        // Pick feature based on RNG
        const roll = this.rng.next();
        let feature = '';
        if (roll < 0.4) feature = 'storage';
        else if (roll < 0.7) feature = 'cemetery';
        else feature = 'shrine';

        // Convert the road tip to biome ground to place the feature "at the end"
        const groundType = this.biomeConfig.ground;
        tiles[end.x][end.y].type = groundType;
        tiles[end.x][end.y].doodad = undefined;

        if (feature === 'storage') {
             tiles[end.x][end.y].doodad = {
                 type: DoodadType.CRATE,
                 id: `end_${end.x}_${end.y}`,
                 offsetX: 0, offsetY: 0
             };
             this.scatterDoodads(tiles, end.x, end.y, 2, [DoodadType.CRATE, DoodadType.STUMP], 3);
        } else if (feature === 'cemetery') {
             // Create 3x3 clearing
             this.createClearing(tiles, end.x, end.y, 1, groundType);
             // Place tombstones
             this.scatterDoodads(tiles, end.x, end.y, 1, [DoodadType.TOMBSTONE], 4); 
        } else if (feature === 'shrine') {
             const shrineType = this.rng.pick([DoodadType.WELL, DoodadType.ROCK, DoodadType.CRYSTAL]);
             tiles[end.x][end.y].doodad = {
                 type: shrineType,
                 id: `shrine_${end.x}_${end.y}`,
                 offsetX: 0, offsetY: 0
             };
        }
    }
  }

  private scatterDoodads(tiles: Tile[][], cx: number, cy: number, radius: number, types: DoodadType[], count: number) {
    for(let i=0; i<count; i++) {
        const tx = cx + this.rng.rangeInt(-radius, radius);
        const ty = cy + this.rng.rangeInt(-radius, radius);
        if (tx>=0 && tx<WIDTH && ty>=0 && ty<HEIGHT) {
            const t = tiles[tx][ty];
            // Only place on ground
            if ([TileType.GRASS, TileType.DIRT, TileType.SAND, TileType.SNOW, TileType.MUD].includes(t.type)) {
                if (!t.doodad && !t.buildingId) {
                    t.doodad = {
                        type: this.rng.pick(types),
                        id: `scat_${tx}_${ty}_${i}`,
                        offsetX: this.rng.rangeInt(-5, 5),
                        offsetY: this.rng.rangeInt(-5, 5)
                    }
                }
            }
        }
    }
  }

  private createClearing(tiles: Tile[][], cx: number, cy: number, radius: number, type: TileType) {
    for(let x = cx - radius; x <= cx + radius; x++) {
        for(let y = cy - radius; y <= cy + radius; y++) {
             if (x>=0 && x<WIDTH && y>=0 && y<HEIGHT) {
                 if (!tiles[x][y].buildingId && tiles[x][y].type !== TileType.WATER_DEEP && tiles[x][y].type !== TileType.WATER_SHALLOW) {
                      tiles[x][y].type = type;
                      tiles[x][y].doodad = undefined; // Remove pre-existing items
                 }
             }
        }
    }
  }
}
