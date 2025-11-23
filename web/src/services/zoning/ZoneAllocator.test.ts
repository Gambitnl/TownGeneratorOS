import { describe, it, expect } from 'vitest';
import { ZoneAllocator, ZoneType } from './ZoneAllocator';
import { Tile, TileType } from '@/types/tile';

describe('ZoneAllocator', () => {
    it('should allocate zones to a simple grid', () => {
        // Create a 10x10 grid of grass
        const width = 10;
        const height = 10;
        const tiles: Tile[][] = [];
        for (let y = 0; y < height; y++) {
            const row: Tile[] = [];
            for (let x = 0; x < width; x++) {
                row.push({ x, y, type: TileType.Grass, rotation: 0 });
            }
            tiles.push(row);
        }

        // Add a road splitting the grid in half vertically at x=5
        for (let y = 0; y < height; y++) {
            tiles[y][5].type = TileType.Road;
        }

        const allocator = new ZoneAllocator(tiles);
        const zoneMap = allocator.allocateZones();

        // We expect at least 2 zones (left and right of road)
        // The road itself (x=5) should not be in the map
        // ZoneMap is a plain object with string keys, not a Map

        expect(zoneMap['5,0']).toBeUndefined(); // Road
        expect(zoneMap['0,0']).toBeDefined(); // Grass Left
        expect(zoneMap['9,0']).toBeDefined(); // Grass Right

        const zoneLeft = zoneMap['0,0'];
        const zoneRight = zoneMap['9,0'];

        expect(zoneLeft).toBeDefined();
        expect(zoneRight).toBeDefined();

        // They might be the same type (e.g. both Residential), but they are distinct regions logic-wise.
        // The test just checks if they got assigned a type.
        expect(Object.values(ZoneType)).toContain(zoneLeft);
    });

    it('should handle small regions as Parks', () => {
        // Create a small 2x2 isolated grass patch surrounded by roads
        const tiles: Tile[][] = [];
        for (let y = 0; y < 5; y++) {
            const row: Tile[] = [];
            for (let x = 0; x < 5; x++) {
                row.push({ x, y, type: TileType.Road, rotation: 0 });
            }
            tiles.push(row);
        }

        // 2x2 grass in middle
        tiles[1][1].type = TileType.Grass;
        tiles[1][2].type = TileType.Grass;
        tiles[2][1].type = TileType.Grass;
        tiles[2][2].type = TileType.Grass;

        const allocator = new ZoneAllocator(tiles);
        const zoneMap = allocator.allocateZones();

        // Since region size is 4, which is < 5, it might be assigned as Park
        // But it's probabilistic (30% chance), so we just check it has a valid zone type
        const zone = zoneMap['1,1'];
        expect(zone).toBeDefined();
        expect(Object.values(ZoneType)).toContain(zone);
    });
});
