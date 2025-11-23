import { GridModel } from '@/services/GridModel';
import { TileType } from '@/types/tile';
import { TownMap, TileType as RSTileType, BuildingType as RSBuildingType, DoodadType as RSDoodadType } from '@/services/realmsmith/types';

// Universal VTT Format (simplified for our use case)
// Based on the Universal VTT specification v1.0
interface UVTTFormat {
    format: string;
    version: string;
    resolution: {
        map_origin: { x: number; y: number };
        map_size: { x: number; y: number };
        pixels_per_grid: number;
    };
    line_of_sight: Array<{
        x: number;
        y: number;
        w: number;
        h: number;
    }>;
    portals: Array<{
        position: [number, number];
        bounds: [number, number, number, number];
    }>;
    environment: {
        baked_lighting: boolean;
        ambient_light: string;
    };
    image: string; // Base64 encoded or URL
}

// Simplified custom format for easier integration
export interface SimplifiedVTTExport {
    metadata: {
        format: 'TownGeneratorOS-VTT';
        version: '1.0';
        gridSize: { width: number; height: number };
        tileSize: number; // In pixels
        timestamp: string;
    };
    tiles: Array<{
        x: number;
        y: number;
        type: string;
        variant?: string;
        rotation: number;
        blocking?: boolean; // Blocks movement
        blocksVision?: boolean; // Blocks line of sight
    }>;
    walls: Array<{
        start: { x: number; y: number };
        end: { x: number; y: number };
        blocksMovement: boolean;
        blocksLight: boolean;
    }>;
    lights: Array<{
        position: { x: number; y: number };
        radius: number;
        color: string;
        intensity: number;
    }>;
}

export class VTTExporter {
    private tileSize: number = 70; // 70 pixels = 5ft in D&D (standard VTT size)

    /**
     * Export GridModel to a simplified VTT JSON format
     */
    public exportToJSON(model: GridModel): string {
        const vttData = this.generateVTTData(model);
        return JSON.stringify(vttData, null, 2);
    }

    /**
     * Export GridModel to Universal VTT format
     */
    public exportToUVTT(model: GridModel, imageUrl?: string): string {
        const uvttData = this.generateUVTTData(model, imageUrl);
        return JSON.stringify(uvttData, null, 2);
    }

    /**
     * Download the VTT export as a JSON file
     */
    public downloadJSON(model: GridModel, filename: string = 'town-map.vtt.json') {
        const json = this.exportToJSON(model);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Export RealmSmith TownMap to a simplified VTT JSON format
     */
    public exportRealmSmithToJSON(map: TownMap): string {
        const vttData = this.generateVTTDataFromRealmSmith(map);
        return JSON.stringify(vttData, null, 2);
    }

    /**
     * Download the RealmSmith VTT export as a JSON file
     */
    public downloadRealmSmithJSON(map: TownMap, filename: string = 'realmsmith-town.vtt.json') {
        const json = this.exportRealmSmithToJSON(map);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }

    private generateVTTData(model: GridModel): SimplifiedVTTExport {
        const tiles = [];
        const walls = [];
        const lights = [];

        // Process each tile
        for (let y = 0; y < model.height; y++) {
            for (let x = 0; x < model.width; x++) {
                const tile = model.tiles[y][x];

                tiles.push({
                    x,
                    y,
                    type: tile.type,
                    variant: tile.variant,
                    rotation: tile.rotation,
                    blocking: this.isTileBlocking(tile.type),
                    blocksVision: this.isTileBlockingVision(tile.type)
                });

                // Generate walls around blocking tiles
                if (this.isTileBlocking(tile.type)) {
                    walls.push(...this.generateWallsForTile(x, y));
                }

                // Add lights to certain buildings
                if (tile.type === TileType.House) {
                    lights.push({
                        position: { x: x + 0.5, y: y + 0.5 },
                        radius: 3,
                        color: '#ffcc66',
                        intensity: 0.7
                    });
                }
            }
        }

        return {
            metadata: {
                format: 'TownGeneratorOS-VTT',
                version: '1.0',
                gridSize: { width: model.width, height: model.height },
                tileSize: this.tileSize,
                timestamp: new Date().toISOString()
            },
            tiles,
            walls,
            lights
        };
    }

    private generateVTTDataFromRealmSmith(map: TownMap): SimplifiedVTTExport {
        const tiles = [];
        const walls = [];
        const lights = [];

        // Process Tiles
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[x][y]; // RealmSmith uses [x][y]

                // Map RealmSmith types to generic types for VTT
                let type = 'ground';
                let blocking = false;
                let blocksVision = false;

                switch (tile.type) {
                    case RSTileType.WATER_DEEP:
                    case RSTileType.WATER_SHALLOW:
                    case RSTileType.LAVA:
                        type = 'water';
                        blocking = true;
                        break;
                    case RSTileType.WALL:
                        type = 'wall';
                        blocking = true;
                        blocksVision = true;
                        break;
                    case RSTileType.BUILDING_FLOOR:
                        type = 'floor';
                        break;
                    case RSTileType.ROAD_MAIN:
                    case RSTileType.ROAD_DIRT:
                    case RSTileType.BRIDGE:
                        type = 'road';
                        break;
                    default:
                        type = 'ground';
                }

                // Check for Doodads that might block
                if (tile.doodad) {
                    if (tile.doodad.type === RSDoodadType.TREE_OAK || tile.doodad.type === RSDoodadType.TREE_PINE) {
                        blocking = true;
                        blocksVision = true;
                    }
                    if (tile.doodad.type === RSDoodadType.STREET_LAMP) {
                        lights.push({
                            position: { x: x + 0.5, y: y + 0.5 },
                            radius: 4,
                            color: '#ffcc66',
                            intensity: 0.6
                        });
                    }
                }

                tiles.push({
                    x,
                    y,
                    type,
                    variant: tile.type, // Store original type as variant
                    rotation: 0,
                    blocking,
                    blocksVision
                });
            }
        }

        // Process Buildings for Walls and Lights
        for (const b of map.buildings) {
            // Walls around the building perimeter
            const bWalls = this.generateWallsForRect(b.x, b.y, b.width, b.height);

            // Remove wall segments where the door is
            // Door is relative to x,y. 
            // We need to find which wall segment corresponds to the door and remove/split it.
            // For simplicity in this VTT export, we'll just add walls. 
            // Advanced: Filter out walls at (b.x + b.doorX, b.y + b.doorY)

            // Filter walls that overlap with the door
            const doorWorldX = b.x + b.doorX;
            const doorWorldY = b.y + b.doorY;

            for (const wall of bWalls) {
                // Check if this wall segment is the door
                // A door at (dx, dy) usually means the tile is accessible. 
                // Walls are usually between tiles. 
                // RealmSmith buildings take up tiles. The perimeter is the wall.
                // If door is at (0, 1) of a 3x3 building, it's on the left side.

                // Let's just add all walls for now, VTT users can open doors.
                walls.push(wall);
            }

            // Add Light for specific buildings
            if (b.type === RSBuildingType.TAVERN || b.type === RSBuildingType.CHURCH || b.type === RSBuildingType.TOWER) {
                lights.push({
                    position: { x: b.x + b.width / 2, y: b.y + b.height / 2 },
                    radius: Math.max(b.width, b.height) + 2,
                    color: b.type === RSBuildingType.TAVERN ? '#ffaa00' : '#aaccff',
                    intensity: 0.5
                });
            }
        }

        return {
            metadata: {
                format: 'TownGeneratorOS-VTT',
                version: '1.0',
                gridSize: { width: map.width, height: map.height },
                tileSize: this.tileSize,
                timestamp: new Date().toISOString()
            },
            tiles,
            walls,
            lights
        };
    }

    private generateUVTTData(model: GridModel, imageUrl?: string): UVTTFormat {
        const los: UVTTFormat['line_of_sight'] = [];

        // Find all blocking tiles and create LOS barriers
        for (let y = 0; y < model.height; y++) {
            for (let x = 0; x < model.width; x++) {
                const tile = model.tiles[y][x];
                if (this.isTileBlockingVision(tile.type)) {
                    los.push({
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        w: this.tileSize,
                        h: this.tileSize
                    });
                }
            }
        }

        return {
            format: 'fvtt-universal',
            version: '1.0.0',
            resolution: {
                map_origin: { x: 0, y: 0 },
                map_size: {
                    x: model.width * this.tileSize,
                    y: model.height * this.tileSize
                },
                pixels_per_grid: this.tileSize
            },
            line_of_sight: los,
            portals: [], // Could be added for doors/gates later
            environment: {
                baked_lighting: false,
                ambient_light: '#888888'
            },
            image: imageUrl || ''
        };
    }

    private isTileBlocking(type: TileType): boolean {
        return type === TileType.Wall || type === TileType.House || type === TileType.Water;
    }

    private isTileBlockingVision(type: TileType): boolean {
        return type === TileType.Wall || type === TileType.House;
    }

    private generateWallsForTile(x: number, y: number): SimplifiedVTTExport['walls'] {
        const walls: SimplifiedVTTExport['walls'] = [];
        const tileCenter = { x: x + 0.5, y: y + 0.5 };

        // Create walls on all four sides of the blocking tile
        const sides = [
            { start: { x, y }, end: { x: x + 1, y } },           // Top
            { start: { x: x + 1, y }, end: { x: x + 1, y: y + 1 } }, // Right
            { start: { x: x + 1, y: y + 1 }, end: { x, y: y + 1 } }, // Bottom
            { start: { x, y: y + 1 }, end: { x, y } }            // Left
        ];

        for (const side of sides) {
            walls.push({
                start: side.start,
                end: side.end,
                blocksMovement: true,
                blocksLight: true
            });
        }

        return walls;
    }

    private generateWallsForRect(x: number, y: number, w: number, h: number): SimplifiedVTTExport['walls'] {
        const walls: SimplifiedVTTExport['walls'] = [];

        // Top
        walls.push({ start: { x, y }, end: { x: x + w, y }, blocksMovement: true, blocksLight: true });
        // Right
        walls.push({ start: { x: x + w, y }, end: { x: x + w, y: y + h }, blocksMovement: true, blocksLight: true });
        // Bottom
        walls.push({ start: { x: x + w, y: y + h }, end: { x, y: y + h }, blocksMovement: true, blocksLight: true });
        // Left
        walls.push({ start: { x, y: y + h }, end: { x, y }, blocksMovement: true, blocksLight: true });

        return walls;
    }
}

// Export singleton instance
export const vttExporter = new VTTExporter();
