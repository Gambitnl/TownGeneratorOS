import { describe, it, expect } from 'vitest';
import { GridModel } from './GridModel';
import { TileType } from '@/types/tile';

describe('GridModel', () => {
    it('should generate a town with roads and zones', () => {
        const model = new GridModel(20, 20, 12345);

        // Check dimensions
        expect(model.width).toBe(20);
        expect(model.height).toBe(20);
        expect(model.tiles.length).toBe(20);
        expect(model.tiles[0].length).toBe(20);

        // Check for roads (WFC output)
        let roadCount = 0;
        for (let y = 0; y < model.height; y++) {
            for (let x = 0; x < model.width; x++) {
                if (model.tiles[y][x].type === TileType.Road) {
                    roadCount++;
                }
            }
        }
        expect(roadCount).toBeGreaterThan(0);

        // Check for zones (ZoneAllocator output)
        const zoneKeys = Object.keys(model.zoneMap);
        expect(zoneKeys.length).toBeGreaterThan(0);

        // Check getZone
        const firstZoneKey = zoneKeys[0];
        const [zx, zy] = firstZoneKey.split(',').map(Number);
        const zone = model.getZone(zx, zy);
        expect(zone).toBeDefined();
    });
});
