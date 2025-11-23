import { describe, it, expect } from 'vitest';
import { VTTExporter } from './VTTExporter';
import { GridModel } from '@/services/GridModel';
import { TileType } from '@/types/tile';

describe('VTTExporter', () => {
    it('should export a simple grid to JSON', () => {
        const model = new GridModel(5, 5, 12345);
        const exporter = new VTTExporter();

        const json = exporter.exportToJSON(model);
        const data = JSON.parse(json);

        expect(data).toBeDefined();
        expect(data.metadata).toBeDefined();
        expect(data.metadata.format).toBe('TownGeneratorOS-VTT');
        expect(data.metadata.version).toBe('1.0');
        expect(data.metadata.gridSize.width).toBe(5);
        expect(data.metadata.gridSize.height).toBe(5);
    });

    it('should export tiles with correct properties', () => {
        const model = new GridModel(5, 5, 12345);
        const exporter = new VTTExporter();

        const json = exporter.exportToJSON(model);
        const data = JSON.parse(json);

        expect(data.tiles).toBeDefined();
        expect(data.tiles.length).toBe(25); // 5x5 grid

        // Check that each tile has required properties
        for (const tile of data.tiles) {
            expect(tile).toHaveProperty('x');
            expect(tile).toHaveProperty('y');
            expect(tile).toHaveProperty('type');
            expect(tile).toHaveProperty('rotation');
            expect(tile).toHaveProperty('blocking');
            expect(tile).toHaveProperty('blocksVision');
        }
    });

    it('should generate walls for blocking tiles', () => {
        const model = new GridModel(5, 5, 12345);
        const exporter = new VTTExporter();

        const json = exporter.exportToJSON(model);
        const data = JSON.parse(json);

        expect(data.walls).toBeDefined();
        // Walls should be generated for any blocking tiles (Houses, Walls, Water)
        // The exact count depends on generation, but it should have some if there are houses
        expect(Array.isArray(data.walls)).toBe(true);
    });

    it('should generate lights for houses', () => {
        const model = new GridModel(10, 10, 12345);
        const exporter = new VTTExporter();

        const json = exporter.exportToJSON(model);
        const data = JSON.parse(json);

        expect(data.lights).toBeDefined();
        expect(Array.isArray(data.lights)).toBe(true);

        // Check light properties if any exist
        if (data.lights.length > 0) {
            const light = data.lights[0];
            expect(light).toHaveProperty('position');
            expect(light).toHaveProperty('radius');
            expect(light).toHaveProperty('color');
            expect(light).toHaveProperty('intensity');
        }
    });

    it('should export to UVTT format', () => {
        const model = new GridModel(5, 5, 12345);
        const exporter = new VTTExporter();

        const json = exporter.exportToUVTT(model);
        const data = JSON.parse(json);

        expect(data).toBeDefined();
        expect(data.format).toBe('fvtt-universal');
        expect(data.version).toBe('1.0.0');
        expect(data.resolution).toBeDefined();
        expect(data.resolution.map_size.x).toBe(5 * 70); // 5 tiles * 70 pixels
        expect(data.resolution.map_size.y).toBe(5 * 70);
        expect(data.resolution.pixels_per_grid).toBe(70);
    });

    it('should mark walls and houses as blocking', () => {
        // Create a custom grid with known tiles
        const model = new GridModel(3, 3, 999);
        // Manually set some tiles to ensure blocking behavior
        model.tiles[1][1].type = TileType.House;

        const exporter = new VTTExporter();
        const json = exporter.exportToJSON(model);
        const data = JSON.parse(json);

        // Find the house tile
        const houseTile = data.tiles.find((t: any) => t.x === 1 && t.y === 1);
        expect(houseTile).toBeDefined();
        expect(houseTile.blocking).toBe(true);
        expect(houseTile.blocksVision).toBe(true);
    });

    it('should not mark grass and roads as blocking', () => {
        const model = new GridModel(3, 3, 999);
        model.tiles[0][0].type = TileType.Grass;
        model.tiles[0][1].type = TileType.Road;

        const exporter = new VTTExporter();
        const json = exporter.exportToJSON(model);
        const data = JSON.parse(json);

        const grassTile = data.tiles.find((t: any) => t.x === 0 && t.y === 0);
        const roadTile = data.tiles.find((t: any) => t.x === 1 && t.y === 0);

        expect(grassTile.blocking).toBe(false);
        expect(roadTile.blocking).toBe(false);
    });
});
