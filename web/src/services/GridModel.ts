import { Tile, TileType } from '@/types/tile';
import * as Random from '@/utils/Random';
import { WFCGenerator } from './generators/WFCGenerator';
import { ZoneAllocator } from './zoning/ZoneAllocator';
import { WaterGenerator } from './generators/WaterGenerator';
import { ZoneMap, ZoneType } from '@/types/zone';

export class GridModel {
    public width: number;
    public height: number;
    public tiles: Tile[][];
    public zoneMap: ZoneMap = {};

    constructor(width: number = 50, height: number = 50, seed: number = -1) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.generateFullTown(width, seed);
    }

    private initialize() {
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            const row: Tile[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push({
                    x,
                    y,
                    type: TileType.Grass,
                    rotation: 0
                });
            }
            this.tiles.push(row);
        }
    }

    public generateFullTown(size: number, seed: number) {
        console.log(`Starting Full Town Generation (Size: ${size}, Seed: ${seed})...`);
        if (seed > 0) Random.reset(seed);

        // 0. Initialize Grid
        this.initialize();

        // 1. Generate Water (Rivers/Lakes)
        // We do this before roads so roads can potentially bridge over or avoid (future task)
        // For now, we just place them.
        console.log("Generating Water...");
        const waterGen = new WaterGenerator(this.width, this.height, this.tiles);
        waterGen.generate(2, 3); // 2 rivers, 3 lakes

        // 2. Generate Roads using WFC
        // We need to pass the existing tiles so WFC knows about water?
        // The current WFC implementation might overwrite everything. 
        // Let's check WFCGenerator.ts later. For now, we assume it generates a grid.
        console.log("Running WFC...");
        const wfc = new WFCGenerator(this.width, this.height);
        // TODO: Configure WFC to respect existing water if possible, or we merge later.
        // For this iteration, we might overwrite water if we are not careful.
        // Let's generate roads separately and merge.
        const roadTiles = wfc.generate();

        this.mergeRoads(roadTiles);
        console.log("WFC Complete.");

        // 3. Allocate Zones
        console.log("Allocating Zones...");
        const allocator = new ZoneAllocator(this.tiles);
        this.zoneMap = allocator.allocateZones();
        console.log("Zoning Complete.");

        // 4. Place Buildings (Visuals)
        this.placeBuildingsFromZones();
    }

    private mergeRoads(roadTiles: Tile[][]) {
        // Overlay roads onto the grid, but preserve water if possible?
        // Or maybe roads take precedence?
        // Let's say roads overwrite grass, but maybe bridges for water?
        // For simplicity: Roads overwrite everything for now to ensure connectivity.
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (roadTiles[y][x].type === TileType.Road) {
                    this.tiles[y][x] = { ...roadTiles[y][x] };
                }
            }
        }
    }

    private placeBuildingsFromZones() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (tile.type === TileType.Grass) {
                    const zone = this.getZone(x, y);
                    if (zone) {
                        // 40% chance to place a building sprite
                        if (Random.bool(0.4)) {
                            if (zone === ZoneType.Residential) {
                                tile.type = TileType.House;
                            }
                            // Add other types as we have assets
                        }
                    }
                }
            }
        }
    }

    public getZone(x: number, y: number): ZoneType | undefined {
        return this.zoneMap[`${x},${y}`];
    }
}
