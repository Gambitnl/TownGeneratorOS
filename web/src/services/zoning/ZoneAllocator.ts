import { Tile, TileType } from '@/types/tile';
import { ZoneType, ZoneMap } from '@/types/zone';
import * as Random from '@/utils/Random';

export { ZoneType };

interface Region {
    id: number;
    tiles: { x: number, y: number }[];
    center: { x: number, y: number };
    size: number;
}

export class ZoneAllocator {
    private width: number;
    private height: number;
    private grid: Tile[][];
    private zoneMap: ZoneMap = {};

    constructor(grid: Tile[][]) {
        this.grid = grid;
        this.height = grid.length;
        this.width = grid[0].length;
    }

    public allocateZones(): ZoneMap {
        this.zoneMap = {};
        const regions = this.findRegions();

        // Calculate town center (approximate)
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        for (const region of regions) {
            const zone = this.determineZone(region, centerX, centerY);
            this.applyZoneToRegion(region, zone);
        }

        return this.zoneMap;
    }

    private findRegions(): Region[] {
        const visited = new Set<string>();
        const regions: Region[] = [];
        let regionIdCounter = 0;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const key = `${x},${y}`;
                if (visited.has(key)) continue;

                const tile = this.grid[y][x];

                // We only zone "empty" areas (Grass). 
                // Roads, Water, etc. are boundaries or pre-occupied.
                // Actually, we might want to re-zone Houses if they were pre-placed, 
                // but usually zoning happens before building placement or concurrently.
                // For now, let's assume we are zoning the 'Grass' areas bounded by Roads.
                if (tile.type === TileType.Road || tile.type === TileType.Water || tile.type === TileType.Wall) {
                    visited.add(key);
                    continue;
                }

                // Start Flood Fill
                const regionTiles = this.floodFill(x, y, visited);
                if (regionTiles.length > 0) {
                    regions.push(this.createRegion(regionIdCounter++, regionTiles));
                }
            }
        }

        return regions;
    }

    private floodFill(startX: number, startY: number, visited: Set<string>): { x: number, y: number }[] {
        const tiles: { x: number, y: number }[] = [];
        const stack = [{ x: startX, y: startY }];

        visited.add(`${startX},${startY}`);

        while (stack.length > 0) {
            const { x, y } = stack.pop()!;
            tiles.push({ x, y });

            const neighbors = [
                { x: x + 1, y: y },
                { x: x - 1, y: y },
                { x: x, y: y + 1 },
                { x: x, y: y - 1 }
            ];

            for (const n of neighbors) {
                if (n.x < 0 || n.x >= this.width || n.y < 0 || n.y >= this.height) continue;

                const key = `${n.x},${n.y}`;
                if (visited.has(key)) continue;

                const tile = this.grid[n.y][n.x];
                // Stop at boundaries
                if (tile.type === TileType.Road || tile.type === TileType.Water || tile.type === TileType.Wall) {
                    continue;
                }

                visited.add(key);
                stack.push(n);
            }
        }

        return tiles;
    }

    private createRegion(id: number, tiles: { x: number, y: number }[]): Region {
        let sumX = 0;
        let sumY = 0;
        for (const t of tiles) {
            sumX += t.x;
            sumY += t.y;
        }
        return {
            id,
            tiles,
            center: { x: sumX / tiles.length, y: sumY / tiles.length },
            size: tiles.length
        };
    }

    private determineZone(region: Region, centerX: number, centerY: number): ZoneType {
        // Heuristics
        const dist = Math.sqrt(Math.pow(region.center.x - centerX, 2) + Math.pow(region.center.y - centerY, 2));
        const maxDist = Math.sqrt(Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2));
        const normalizedDist = dist / maxDist; // 0 to 1 (approx)

        // Logic:
        // Center -> Commercial
        // Mid -> Residential
        // Outskirts -> Industrial / Park / Farm (Residential for now)

        // Small regions might be parks
        if (region.size < 5) {
            return Random.bool(0.3) ? ZoneType.Park : ZoneType.Residential;
        }

        if (normalizedDist < 0.3) {
            // Core
            return Random.bool(0.7) ? ZoneType.Commercial : ZoneType.Residential;
        } else if (normalizedDist < 0.7) {
            // Suburbs
            return Random.bool(0.9) ? ZoneType.Residential : ZoneType.Park;
        } else {
            // Outskirts
            return Random.bool(0.2) ? ZoneType.Industrial : ZoneType.Residential;
        }
    }

    private applyZoneToRegion(region: Region, zone: ZoneType) {
        for (const t of region.tiles) {
            this.zoneMap[`${t.x},${t.y}`] = zone;
        }
    }
}
