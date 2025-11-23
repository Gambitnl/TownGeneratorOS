
import { Building, BuildingType, DoodadType, Tile, TileType, BiomeType, RoofStyle, WallTexture } from './types';

const TILE_SIZE = 32;

export interface DrawOptions {
    isNight: boolean;
    showGrid: boolean;
}

export class AssetPainter {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    // Robust rounded rect implementation
    private roundedRect(x: number, y: number, w: number, h: number, r: number) {
        if (w < 0) { x += w; w = Math.abs(w); }
        if (h < 0) { y += h; h = Math.abs(h); }
        if (r < 0) r = 0;
        // Clamp radius
        r = Math.min(r, w / 2, h / 2);

        // Try native first if available, but catch errors (Safari 16 bug etc)
        if (typeof this.ctx.roundRect === 'function') {
            try {
                this.ctx.roundRect(x, y, w, h, r);
                return;
            } catch (e) {
                // fall through to manual
            }
        }

        // Manual path fallback
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
    }

    public drawMap(tiles: Tile[][], buildings: Building[], biome: BiomeType, options: DrawOptions) {
        if (!tiles || tiles.length === 0) return;

        const width = tiles.length;
        const height = tiles[0].length;

        // 1. Ground Pass
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                this.drawTileBase(tiles[x][y], x, y, tiles, biome);
            }
        }

        // 2. Shadow Pass
        this.ctx.globalAlpha = 0.25;
        this.ctx.fillStyle = '#000000';
        buildings.forEach(b => {
            this.ctx.beginPath();
            this.roundedRect(
                b.x * TILE_SIZE + 4,
                b.y * TILE_SIZE + 8,
                b.width * TILE_SIZE + 2,
                b.height * TILE_SIZE,
                4
            );
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // 3. Structure Pass
        buildings.forEach(b => this.drawBuildingStructure(b, biome));

        // 4. Walls Pass (drawn after ground, before doodads/roofs)
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (tiles[x][y].type === TileType.WALL) {
                    this.drawWall(x * TILE_SIZE, y * TILE_SIZE, tiles, x, y);
                }
            }
        }

        // 5. Doodad Pass
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (tiles[x][y].doodad) {
                    this.drawDoodad(tiles[x][y], x, y, biome);
                }
            }
        }

        // 6. Roof Pass
        const sortedBuildings = [...buildings].sort((a, b) => (a.y + a.height) - (b.y + b.height));
        sortedBuildings.forEach(b => this.drawBuildingRoof(b, biome));

        // 7. Night Mode / Lighting Pass
        if (options.isNight) {
            this.drawNightOverlay(width, height, tiles, buildings);
        }

        // 8. Grid Pass
        if (options.showGrid) {
            this.drawGrid(width, height);
        }
    }

    private drawNightOverlay(width: number, height: number, tiles: Tile[][], buildings: Building[]) {
        // 1. Dark Ambient
        this.ctx.fillStyle = 'rgba(11, 15, 25, 0.75)';
        this.ctx.fillRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);

        // 2. Additive Lighting
        this.ctx.globalCompositeOperation = 'screen'; // Makes lights glow

        // Helper for light glow - Optimized to avoid excessive gradients if possible
        const drawLight = (cx: number, cy: number, r: number, color: string, intensity = 0.6) => {
            // Optimization: Skip small lights or off-screen? (Not easily checked here)
            const grad = this.ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = grad;
            this.ctx.globalAlpha = intensity;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.fill();
        };

        // Window Lights
        buildings.forEach(b => {
            if (b.type === BuildingType.CHURCH) {
                // Blue magical windows
                const cx = (b.x + b.width / 2) * TILE_SIZE;
                const cy = (b.y + b.height / 2) * TILE_SIZE;
                drawLight(cx, cy, TILE_SIZE * 3, '#3b82f6', 0.4);
            } else if (b.type !== BuildingType.MARKET_STALL && b.type !== BuildingType.FARM_HOUSE) {
                // Warm windows
                const cx = (b.x + b.width / 2) * TILE_SIZE;
                const cy = (b.y + b.height / 2) * TILE_SIZE;
                drawLight(cx, cy, TILE_SIZE * 1.5, '#f59e0b', 0.5);
            }
        });

        // Environmental Lights - Optimized loop
        // Only draw lights for specific tiles, and maybe skip some for performance
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const t = tiles[x][y];

                // Optimization: Only calculate coordinates if we actually need to draw
                if (t.type !== TileType.LAVA && t.type !== TileType.CRYSTAL_FLOOR && !t.doodad) continue;

                const cx = x * TILE_SIZE + TILE_SIZE / 2;
                const cy = y * TILE_SIZE + TILE_SIZE / 2;

                if (t.type === TileType.LAVA) {
                    // Optimization: Only draw light for every other lava tile to reduce load
                    if ((x + y) % 2 === 0) drawLight(cx, cy, TILE_SIZE * 2, '#ef4444', 0.4);
                }
                else if (t.type === TileType.CRYSTAL_FLOOR) {
                    if ((x + y) % 2 === 0) drawLight(cx, cy, TILE_SIZE, '#06b6d4', 0.2);
                }

                if (t.doodad) {
                    if (t.doodad.type === DoodadType.STREET_LAMP) {
                        drawLight(cx, cy - 10, TILE_SIZE * 2.5, '#fbbf24', 0.7); // Strong warm light
                    } else if (t.doodad.type === DoodadType.CRYSTAL) {
                        drawLight(cx, cy, TILE_SIZE * 1.5, '#22d3ee', 0.5);
                    }
                }
            }
        }

        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    private drawGrid(width: number, height: number) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        for (let x = 0; x <= width; x++) {
            this.ctx.moveTo(x * TILE_SIZE, 0);
            this.ctx.lineTo(x * TILE_SIZE, height * TILE_SIZE);
        }
        for (let y = 0; y <= height; y++) {
            this.ctx.moveTo(0, y * TILE_SIZE);
            this.ctx.lineTo(width * TILE_SIZE, y * TILE_SIZE);
        }
        this.ctx.stroke();
    }

    private getBiomeColors(biome: BiomeType) {
        // Default palette
        let grassHue = 100; // Green
        let waterColor = '#3b82f6';
        let waterDeepColor = '#1e3a8a';
        let roofOverride: string | null = null;
        let wallOverride: string | null = null;

        switch (biome) {
            case BiomeType.SWAMP: grassHue = 60; waterColor = '#4d7c0f'; waterDeepColor = '#3f6212'; roofOverride = '#365314'; break; // Yellow-green, murky
            case BiomeType.SAVANNA: grassHue = 45; break; // Gold/Yellow
            case BiomeType.AUTUMN_FOREST: grassHue = 30; break; // Orange
            case BiomeType.JUNGLE: grassHue = 130; waterColor = '#06b6d4'; break; // Deep Green, Cyan water
            case BiomeType.MUSHROOM_FOREST: grassHue = 260; waterColor = '#8b5cf6'; waterDeepColor = '#5b21b6'; break; // Purple
            case BiomeType.BADLANDS: grassHue = 20; break; // Reddish
            case BiomeType.CHERRY_BLOSSOM: grassHue = 90; break; // Fresh green
            case BiomeType.HIGHLANDS: grassHue = 110; break;
            case BiomeType.VOLCANIC: waterColor = '#ef4444'; waterDeepColor = '#7f1d1d'; break; // Lava colors handled in renderer usually, but fallback
            case BiomeType.CRYSTAL_WASTES: waterColor = '#67e8f9'; waterDeepColor = '#0e7490'; break;
            case BiomeType.DEAD_LANDS: grassHue = 30; waterColor = '#57534e'; waterDeepColor = '#292524'; break; // Desaturated brown
        }
        return { grassHue, waterColor, waterDeepColor, roofOverride, wallOverride };
    }

    private drawTileBase(tile: Tile, x: number, y: number, grid: Tile[][], biome: BiomeType) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const colors = this.getBiomeColors(biome);

        this.ctx.save();

        switch (tile.type) {
            case TileType.WATER_DEEP:
            case TileType.WATER_SHALLOW:
                this.drawWater(px, py, tile, x, y, grid, colors.waterColor, colors.waterDeepColor);
                break;
            case TileType.LAVA:
                this.drawLava(px, py, tile);
                break;
            case TileType.GRASS:
                this.drawGrass(px, py, tile, colors.grassHue, biome === BiomeType.SAVANNA || biome === BiomeType.AUTUMN_FOREST ? 25 : 40); // Lower saturation for some
                break;
            case TileType.SAND:
                this.drawSand(px, py, tile);
                break;
            case TileType.DIRT:
                this.drawDirt(px, py, tile);
                break;
            case TileType.MUD:
                this.drawMud(px, py, tile);
                break;
            case TileType.SNOW:
                this.drawSnow(px, py, tile);
                break;
            case TileType.ICE:
                this.drawIce(px, py, tile);
                break;
            case TileType.ASH:
                this.drawAsh(px, py, tile);
                break;
            case TileType.ROCK_GROUND:
                this.drawRockGround(px, py, tile);
                break;
            case TileType.CRYSTAL_FLOOR:
                this.drawCrystalFloor(px, py, tile);
                break;
            case TileType.ROAD_MAIN:
                this.drawCobblestone(px, py, tile);
                break;
            case TileType.ROAD_DIRT:
                this.drawDirtRoad(px, py, tile);
                break;
            case TileType.DOCK:
                this.drawWater(px, py, tile, x, y, grid, colors.waterColor, colors.waterDeepColor);
                this.drawDock(px, py, tile);
                break;
            case TileType.BRIDGE:
                this.drawWater(px, py, tile, x, y, grid, colors.waterColor, colors.waterDeepColor);
                this.drawBridge(px, py, tile, x, y, grid);
                break;
            case TileType.FARM:
                this.drawFarm(px, py, tile);
                break;
            case TileType.BUILDING_FLOOR:
                this.ctx.fillStyle = '#292524'; // Dark floor
                this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                break;
            case TileType.WALL:
                // Draw base ground first so we don't see void
                this.drawDirt(px, py, tile);
                break;
            default:
                this.ctx.fillStyle = '#0f172a';
                this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        this.ctx.restore();
    }

    private drawFarm(x: number, y: number, tile: Tile) {
        // Rich soil color
        this.ctx.fillStyle = '#3f2e21';
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Furrows
        this.ctx.fillStyle = '#291d16';
        // Slight texture variation
        for (let i = 4; i < TILE_SIZE; i += 8) {
            this.ctx.fillRect(x, y + i, TILE_SIZE, 2);
        }
    }

    private drawWall(x: number, y: number, grid: Tile[][], gx: number, gy: number) {
        // Simple "Stone" texture
        const h = TILE_SIZE;
        const w = TILE_SIZE;

        // Check if wall below to decide if we draw the "face" or just "top"
        let hasWallBelow = false;
        if (gy < grid[0].length - 1 && grid[gx][gy + 1].type === TileType.WALL) {
            hasWallBelow = true;
        }

        // Top
        this.ctx.fillStyle = '#57534e'; // Stone 600
        this.ctx.fillRect(x, y, w, h);

        // 3D Effect - Light top edge
        this.ctx.fillStyle = '#78716c'; // Stone 500
        this.ctx.fillRect(x, y, w, 4);

        // Stones pattern
        this.ctx.fillStyle = '#44403c';
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(x + 4, y + 4, 6, 6);
        this.ctx.fillRect(x + 16, y + 12, 8, 6);
        this.ctx.globalAlpha = 1.0;

        // Crenelations (if no wall above)
        let hasWallAbove = false;
        if (gy > 0 && grid[gx][gy - 1].type === TileType.WALL) {
            hasWallAbove = true;
        }
        if (!hasWallAbove) {
            this.ctx.fillStyle = '#292524'; // Darker
            this.ctx.fillRect(x + 4, y + 4, 8, 8); // Merlon shadow

            this.ctx.fillStyle = '#78716c';
            this.ctx.fillRect(x, y - 4, 10, 4); // Merlon 1
            this.ctx.fillRect(x + 20, y - 4, 10, 4); // Merlon 2
        }
    }

    private drawWater(x: number, y: number, tile: Tile, gx: number, gy: number, grid: Tile[][], shallowColor: string, deepColor: string) {
        const isDeep = tile.type === TileType.WATER_DEEP;

        this.ctx.fillStyle = isDeep ? deepColor : shallowColor;
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);

        // Texture
        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        if (tile.variation > 0.5) {
            this.ctx.fillRect(x + 2, y + 8, 12, 2);
        } else {
            this.ctx.fillRect(x + 10, y + 20, 14, 2);
        }
    }

    private drawLava(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#b91c1c'; // Red 700
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);

        // Glow
        this.ctx.fillStyle = '#ef4444'; // Red 500
        if (tile.variation > 0.5) {
            this.ctx.beginPath();
            this.ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(x + 20, y + 20, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Crust
        this.ctx.fillStyle = '#450a0a'; // Red 950
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(x + 2, y + 2, 4, 4);
        this.ctx.fillRect(x + 18, y + 12, 6, 4);
        this.ctx.globalAlpha = 1.0;
    }

    private drawGrass(x: number, y: number, tile: Tile, hue: number, sat: number) {
        const light = 35 + (tile.elevation * 10);
        this.ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);

        if (tile.variation > 0.6) {
            this.ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${light - 10}%)`;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 8, y + 12);
            this.ctx.lineTo(x + 8, y + 8);
            this.ctx.stroke();
        }
    }

    private drawSand(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#fde68a';
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.fillStyle = '#d97706';
        this.ctx.globalAlpha = 0.2;
        if (tile.variation > 0.5) this.ctx.fillRect(x + 5, y + 5, 2, 2);
        this.ctx.globalAlpha = 1.0;
    }

    private drawDirt(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#92400e'; // Amber 800
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.fillStyle = '#78350f';
        this.ctx.globalAlpha = 0.3;
        if (tile.variation > 0.5) this.ctx.fillRect(x + 10, y + 10, 4, 4);
        this.ctx.globalAlpha = 1.0;
    }

    private drawMud(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#451a03'; // Amber 950
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.fillStyle = '#78350f';
        this.ctx.globalAlpha = 0.5;
        if (tile.variation > 0.5) this.ctx.fillRect(x + 5, y + 15, 6, 6);
        this.ctx.globalAlpha = 1.0;
    }

    private drawSnow(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#f1f5f9'; // Slate 100
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.fillStyle = '#cbd5e1';
        if (tile.variation > 0.7) this.ctx.fillRect(x + 5, y + 5, 2, 2);
    }

    private drawIce(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#cffafe'; // Cyan 100
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.strokeStyle = '#22d3ee'; // Cyan 400
        this.ctx.globalAlpha = 0.4;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + TILE_SIZE);
        this.ctx.lineTo(x + TILE_SIZE, y);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }

    private drawAsh(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#4b5563'; // Gray 600
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.fillStyle = '#1f2937'; // Gray 800
        if (tile.variation > 0.5) this.ctx.fillRect(x + 8, y + 12, 3, 3);
    }

    private drawRockGround(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#57534e'; // Stone 600
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.fillStyle = '#292524'; // Stone 800
        if (tile.variation > 0.4) this.ctx.fillRect(x + 4, y + 20, 5, 5);
    }

    private drawCrystalFloor(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#ecfeff'; // Cyan 50
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
        this.ctx.fillStyle = '#a5f3fc';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 10);
        this.ctx.lineTo(x + 10, y);
        this.ctx.lineTo(x + 20, y + 10);
        this.ctx.fill();
    }

    private drawCobblestone(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#57534e';
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);

        // Optimization: Use simple rects instead of rounded rects and fewer of them
        for (let cy = 2; cy < TILE_SIZE; cy += 8) {
            const offset = (cy % 16) === 2 ? 0 : 4;
            for (let cx = -2; cx < TILE_SIZE; cx += 10) {
                this.ctx.fillStyle = (tile.variation + cx + cy) % 2 > 0.5 ? '#a8a29e' : '#78716c';
                // Simple rect is much faster than roundedRect path
                this.ctx.fillRect(x + cx + offset, y + cy, 8, 6);
            }
        }
    }

    private drawDirtRoad(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#78350f';
        this.ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);

        this.ctx.fillStyle = '#451a03';
        this.ctx.globalAlpha = 0.2;
        if ((x + y) % 3 === 0) this.ctx.fillRect(x + 4, y + 4, 4, 4);
        if ((x * y) % 5 === 0) this.ctx.fillRect(x + 20, y + 20, 3, 3);
        if ((x + y * 2) % 7 === 0) this.ctx.fillRect(x + 15, y + 5, 2, 2);
        if ((x * 3 + y) % 4 === 0) this.ctx.fillRect(x + 5, y + 20, 4, 4);
        this.ctx.globalAlpha = 1.0;
    }

    private drawDock(x: number, y: number, tile: Tile) {
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        this.ctx.fillStyle = '#3E2723';
        for (let i = 4; i < TILE_SIZE; i += 8) {
            this.ctx.fillRect(x, y + i, TILE_SIZE, 1);
        }
        this.ctx.fillStyle = '#2d1b15';
        const posts = [[2, 2], [26, 2], [2, 26], [26, 26]];
        posts.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(x + p[0], y + p[1], 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
    }

    private drawBridge(x: number, y: number, tile: Tile, gx: number, gy: number, grid: Tile[][]) {
        const hasWaterY = (gy > 0 && (grid[gx][gy - 1].type === TileType.WATER_DEEP || grid[gx][gy - 1].type === TileType.WATER_SHALLOW)) ||
            (gy < grid[0].length - 1 && (grid[gx][gy + 1].type === TileType.WATER_DEEP || grid[gx][gy + 1].type === TileType.WATER_SHALLOW));

        const isVertical = !hasWaterY;

        this.ctx.fillStyle = '#7c2d12'; // Wood dark
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        this.ctx.fillStyle = '#9a3412'; // Wood light
        if (isVertical) {
            // Vertical planks
            for (let i = 2; i < TILE_SIZE; i += 6) {
                this.ctx.fillRect(x + i, y, 4, TILE_SIZE);
            }
            // Rails
            this.ctx.fillStyle = '#431407';
            this.ctx.fillRect(x, y, 4, TILE_SIZE);
            this.ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
        } else {
            // Horizontal planks
            for (let i = 2; i < TILE_SIZE; i += 6) {
                this.ctx.fillRect(x, y + i, TILE_SIZE, 4);
            }
            // Rails
            this.ctx.fillStyle = '#431407';
            this.ctx.fillRect(x, y, TILE_SIZE, 4);
            this.ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
        }
    }

    // --- BUILDING ASSETS ---

    private drawBuildingStructure(b: Building, biome: BiomeType) {
        const bx = b.x * TILE_SIZE;
        const by = b.y * TILE_SIZE;
        const bw = b.width * TILE_SIZE;
        const bh = b.height * TILE_SIZE;

        // Biome specific overrides for default colors
        let foundationColor = '#334155'; // Slate
        let woodColor = '#3f2e21';

        if (biome === BiomeType.DESERT || biome === BiomeType.OASIS || biome === BiomeType.BADLANDS) {
            foundationColor = '#78350f';
            woodColor = '#92400e';
        }
        if (biome === BiomeType.TUNDRA || biome === BiomeType.GLACIER) {
            foundationColor = '#475569'; // Cold grey
        }

        if (b.type === BuildingType.CHURCH || b.type === BuildingType.TOWER) {
            foundationColor = '#57534e';
            woodColor = '#292524';
        }

        // Foundation
        this.ctx.fillStyle = foundationColor;
        this.ctx.fillRect(bx, by + bh - 6, bw, 6);

        // Main Body
        const wallInset = 2;
        this.ctx.fillStyle = b.color;
        this.ctx.fillRect(bx + wallInset, by + wallInset, bw - wallInset * 2, bh - wallInset * 2 - 4);

        // Wall Texture Overlay
        if (b.wallTexture === WallTexture.TIMBER_FRAME) {
            this.ctx.strokeStyle = woodColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(bx + wallInset, by + wallInset, bw - wallInset * 2, bh - wallInset * 2 - 4);

            if (b.type !== BuildingType.CHURCH && b.type !== BuildingType.TOWER) {
                this.ctx.beginPath();
                for (let i = 1; i < b.width; i++) {
                    this.ctx.moveTo(bx + i * TILE_SIZE, by + wallInset);
                    this.ctx.lineTo(bx + i * TILE_SIZE, by + bh - 6);
                }
                this.ctx.moveTo(bx + wallInset, by + bh / 2);
                this.ctx.lineTo(bx + bw - wallInset, by + bh / 2);
                this.ctx.stroke();
            }
        } else if (b.wallTexture === WallTexture.STONE) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let i = 0; i < 20; i++) {
                const rx = bx + wallInset + Math.random() * (bw - wallInset * 2 - 8);
                const ry = by + wallInset + Math.random() * (bh - wallInset * 2 - 8);
                this.ctx.beginPath();
                this.roundedRect(rx, ry, 6, 4, 2);
                this.ctx.fill();
            }
        } else if (b.wallTexture === WallTexture.WOOD) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = by + wallInset; i < by + bh - 6; i += 5) {
                this.ctx.fillRect(bx + wallInset, i, bw - wallInset * 2, 1);
            }
        } else if (b.wallTexture === WallTexture.STUCCO) {
            // Subtle noise
            this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
            for (let i = 0; i < 30; i++) {
                const rx = bx + wallInset + Math.random() * (bw - wallInset * 2);
                const ry = by + wallInset + Math.random() * (bh - wallInset * 2);
                this.ctx.fillRect(rx, ry, 1, 1);
            }
        }

        // Church Windows
        if (b.type === BuildingType.CHURCH) {
            this.ctx.fillStyle = '#93c5fd'; // Blue glass
            const winW = 12; const winH = 24;
            const wx = bx + bw / 2 - winW / 2;
            const wy = by + bh / 2 - winH / 2;
            this.ctx.beginPath();
            this.roundedRect(wx, wy, winW, winH, 6);
            this.ctx.fill();
        }

        // Door
        const dx = bx + b.doorX * TILE_SIZE + 8;
        const dy = by + b.doorY * TILE_SIZE + 8;

        if (dy < by + bh - 2) {
            this.ctx.fillStyle = '#451a03';
            this.ctx.fillRect(dx - 2, dy - 2, 18, 22);
            this.ctx.fillStyle = '#78350f';
            this.ctx.fillRect(dx, dy, 14, 18);
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            this.ctx.arc(dx + 11, dy + 9, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    private drawBuildingRoof(b: Building, biome: BiomeType) {
        const bx = b.x * TILE_SIZE;
        const by = b.y * TILE_SIZE;
        const bw = b.width * TILE_SIZE;
        const bh = b.height * TILE_SIZE;
        const overhang = 4;

        const rx = bx - overhang;
        const ry = by - overhang;
        const rw = bw + overhang * 2;
        const rh = bh + overhang * 2;

        let roofColor = b.roofColor;
        const colors = this.getBiomeColors(biome);
        if (colors.roofOverride) roofColor = colors.roofOverride;

        const isSnowy = [BiomeType.TUNDRA, BiomeType.TAIGA, BiomeType.GLACIER, BiomeType.MOUNTAIN].includes(biome);

        this.ctx.save();

        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 3;

        if (b.type === BuildingType.TOWER) {
            this.drawTowerRoof(rx, ry, rw, rh, roofColor, b.roofStyle);
        }
        else if (b.type === BuildingType.TAVERN || b.type === BuildingType.MANOR || b.width > 2 || b.height > 2) {
            this.drawHipRoof(rx, ry, rw, rh, roofColor, b.roofStyle);
            if (b.type === BuildingType.TAVERN) {
                // Chimney
                this.ctx.shadowColor = 'transparent';
                this.ctx.fillStyle = '#57534e';
                const cx = rx + rw - 16;
                const cy = ry + 8;
                this.ctx.fillRect(cx, cy, 8, 12);
                this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
                this.ctx.beginPath();
                this.ctx.arc(cx + 4, cy - 6, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            const isVertical = (b.doorX === 0 || b.doorX === b.width - 1);
            this.drawGableRoof(rx, ry, rw, rh, roofColor, isVertical, b.roofStyle);
        }

        if (isSnowy) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
            this.ctx.beginPath();
            if (b.type === BuildingType.TAVERN || b.width > 2) {
                this.ctx.rect(rx + 4, ry, rw - 8, 4);
            } else {
                this.ctx.rect(rx, ry, rw, 4);
            }
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private drawRoofTexture(x: number, y: number, w: number, h: number, style: RoofStyle) {
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';

        if (style === RoofStyle.SLATE) {
            // Bricks/Rectangles - Optimized step size
            for (let py = y; py < y + h; py += 10) {
                for (let px = x; px < x + w; px += 12) {
                    if (Math.random() > 0.5) this.ctx.fillRect(px, py, 6, 4);
                }
            }
        } else if (style === RoofStyle.TILED) {
            // Scalloped/Curved - Optimized step size
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath(); // Batch path
            for (let py = y; py < y + h; py += 8) {
                for (let px = x; px < x + w; px += 10) {
                    this.ctx.moveTo(px, py);
                    this.ctx.quadraticCurveTo(px + 5, py + 6, px + 10, py);
                }
            }
            this.ctx.stroke();
        } else if (style === RoofStyle.THATCHED) {
            // Messy lines - Reduced count
            this.ctx.strokeStyle = 'rgba(50,30,0,0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath(); // Batch path
            const count = Math.min(20, (w * h) / 100); // Scale with size but cap
            for (let i = 0; i < count; i++) {
                const rx = x + Math.random() * w;
                const ry = y + Math.random() * h;
                this.ctx.moveTo(rx, ry);
                this.ctx.lineTo(rx, ry + 6);
            }
            this.ctx.stroke();
        }

        this.ctx.globalCompositeOperation = 'source-over';
    }

    private drawGableRoof(x: number, y: number, w: number, h: number, color: string, isVertical: boolean, style: RoofStyle) {
        const grad = isVertical
            ? this.ctx.createLinearGradient(x, y, x + w, y)
            : this.ctx.createLinearGradient(x, y, x, y + h);

        grad.addColorStop(0, '#111');
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, '#000');

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(x, y, w, h);

        this.drawRoofTexture(x, y, w, h, style);

        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        if (isVertical) {
            this.ctx.moveTo(x + w / 2, y);
            this.ctx.lineTo(x + w / 2, y + h);
        } else {
            this.ctx.moveTo(x, y + h / 2);
            this.ctx.lineTo(x + w, y + h / 2);
        }
        this.ctx.stroke();
    }

    private drawHipRoof(x: number, y: number, w: number, h: number, color: string, style: RoofStyle) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);

        this.drawRoofTexture(x, y, w, h, style);

        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + w, y);
        this.ctx.lineTo(x + w / 2, y + h / 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + h);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x + w / 2, y + h / 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y + h);
        this.ctx.lineTo(x + w / 2, y + h / 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w, y);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x + w / 2, y + h / 2);
        this.ctx.fill();
    }

    private drawTowerRoof(x: number, y: number, w: number, h: number, color: string, style: RoofStyle) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + h);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x + w / 2, y);
        this.ctx.fill();

        // Texture?
        this.drawRoofTexture(x, y, w, h, style);
    }

    private drawDoodad(tile: Tile, x: number, y: number, biome: BiomeType) {
        if (!tile.doodad) return;
        const px = x * TILE_SIZE + TILE_SIZE / 2 + tile.doodad.offsetX * TILE_SIZE;
        const py = y * TILE_SIZE + TILE_SIZE / 2 + tile.doodad.offsetY * TILE_SIZE;

        const type = tile.doodad.type;

        if (type === DoodadType.TREE_OAK) {
            this.drawTree(px, py, '#166534', '#14532d');
        } else if (type === DoodadType.TREE_PINE) {
            this.drawPineTree(px, py, '#064e3b');
        } else if (type === DoodadType.TREE_PALM) {
            this.drawPalmTree(px, py);
        } else if (type === DoodadType.TREE_DEAD) {
            this.drawDeadTree(px, py);
        } else if (type === DoodadType.BUSH) {
            this.ctx.fillStyle = '#15803d';
            this.ctx.beginPath();
            this.ctx.arc(px, py + 4, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#166534';
            this.ctx.beginPath();
            this.ctx.arc(px - 4, py - 2, 5, 0, Math.PI * 2);
            this.ctx.arc(px + 4, py - 2, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (type === DoodadType.ROCK) {
            this.ctx.fillStyle = '#57534e';
            this.ctx.beginPath();
            this.roundedRect(px - 6, py - 4, 12, 8, 3);
            this.ctx.fill();
            this.ctx.fillStyle = '#78716c';
            this.ctx.fillRect(px - 4, py - 4, 6, 3);
        } else if (type === DoodadType.WELL) {
            this.ctx.fillStyle = '#57534e';
            this.ctx.beginPath();
            this.ctx.arc(px, py, 10, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#0ea5e9';
            this.ctx.beginPath();
            this.ctx.arc(px, py, 6, 0, Math.PI * 2);
            this.ctx.fill();
            // Roof
            this.ctx.fillStyle = '#78350f';
            this.ctx.fillRect(px - 12, py - 12, 2, 12);
            this.ctx.fillRect(px + 10, py - 12, 2, 12);
            this.ctx.fillRect(px - 14, py - 16, 28, 6);
        } else if (type === DoodadType.CACTUS) {
            this.ctx.fillStyle = '#15803d';
            this.roundedRect(px - 4, py - 12, 8, 24, 4);
            this.ctx.fill();
            this.roundedRect(px - 10, py - 4, 8, 4, 2);
            this.ctx.fill();
            this.roundedRect(px - 10, py - 10, 4, 10, 2);
            this.ctx.fill();
        } else if (type === DoodadType.MUSHROOM) {
            this.ctx.fillStyle = '#f5f5f4';
            this.ctx.fillRect(px - 2, py, 4, 8);
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(px, py - 2, 8, Math.PI, 0);
            this.ctx.fill();
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(px - 3, py - 4, 1.5, 0, Math.PI * 2);
            this.ctx.arc(px + 3, py - 5, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (type === DoodadType.CRYSTAL) {
            this.ctx.fillStyle = '#06b6d4';
            this.ctx.beginPath();
            this.ctx.moveTo(px, py - 12);
            this.ctx.lineTo(px + 6, py);
            this.ctx.lineTo(px, py + 12);
            this.ctx.lineTo(px - 6, py);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
            this.ctx.beginPath();
            this.ctx.moveTo(px, py - 12);
            this.ctx.lineTo(px + 3, py);
            this.ctx.lineTo(px, py + 12);
            this.ctx.fill();
        } else if (type === DoodadType.STUMP) {
            this.ctx.fillStyle = '#57534e';
            this.ctx.beginPath();
            this.ctx.arc(px, py + 4, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#78350f'; // Wood
            this.ctx.fillRect(px - 4, py - 4, 8, 8);
            this.ctx.fillStyle = '#92400e'; // Top
            this.ctx.beginPath();
            this.ctx.arc(px, py - 4, 4, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (type === DoodadType.CROP_WHEAT) {
            this.ctx.fillStyle = '#eab308'; // Yellow
            this.ctx.fillRect(px - 2, py - 6, 4, 12);
        } else if (type === DoodadType.CROP_CORN) {
            this.ctx.fillStyle = '#16a34a'; // Green stalk
            this.ctx.fillRect(px - 2, py - 8, 4, 16);
            this.ctx.fillStyle = '#facc15'; // Corn
            this.ctx.beginPath();
            this.ctx.arc(px, py - 4, 2, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (type === DoodadType.CROP_PUMPKIN) {
            this.ctx.fillStyle = '#f97316'; // Orange
            this.ctx.beginPath();
            this.ctx.arc(px, py, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#166534'; // Stem
            this.ctx.fillRect(px - 1, py - 6, 2, 3);
        } else if (type === DoodadType.STREET_LAMP) {
            this.ctx.fillStyle = '#1f2937'; // Pole
            this.ctx.fillRect(px - 1, py - 10, 2, 20);
            this.ctx.fillStyle = '#fbbf24'; // Light
            this.ctx.beginPath();
            this.ctx.arc(px, py - 10, 3, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (type === DoodadType.CRATE) {
            this.ctx.fillStyle = '#78350f';
            this.ctx.fillRect(px - 6, py - 6, 12, 12);
            this.ctx.strokeStyle = '#451a03';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(px - 6, py - 6, 12, 12);
            this.ctx.beginPath();
            this.ctx.moveTo(px - 6, py - 6);
            this.ctx.lineTo(px + 6, py + 6);
            this.ctx.moveTo(px + 6, py - 6);
            this.ctx.lineTo(px - 6, py + 6);
            this.ctx.stroke();
        }
    }

    private drawTree(x: number, y: number, color1: string, color2: string) {
        // Trunk
        this.ctx.fillStyle = '#451a03';
        this.ctx.fillRect(x - 3, y, 6, 10);

        // Leaves
        this.ctx.fillStyle = color2;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 8, 14, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = color1;
        this.ctx.beginPath();
        this.ctx.arc(x - 6, y - 10, 10, 0, Math.PI * 2);
        this.ctx.arc(x + 6, y - 10, 10, 0, Math.PI * 2);
        this.ctx.arc(x, y - 16, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawPineTree(x: number, y: number, color: string) {
        // Trunk
        this.ctx.fillStyle = '#451a03';
        this.ctx.fillRect(x - 2, y, 4, 10);

        // Needles
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 12, y + 4);
        this.ctx.lineTo(x + 12, y + 4);
        this.ctx.lineTo(x, y - 24);
        this.ctx.fill();
    }

    private drawPalmTree(x: number, y: number) {
        // Trunk (curved)
        this.ctx.strokeStyle = '#d97706';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 8);
        this.ctx.quadraticCurveTo(x + 4, y, x + 8, y - 12);
        this.ctx.stroke();

        // Fronds
        this.ctx.strokeStyle = '#16a34a';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 8, y - 12);
            this.ctx.lineTo(x + 8 + Math.cos(angle) * 12, y - 12 + Math.sin(angle) * 12);
            this.ctx.stroke();
        }
    }

    private drawDeadTree(x: number, y: number) {
        this.ctx.strokeStyle = '#57534e';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 8);
        this.ctx.lineTo(x, y - 8);
        this.ctx.lineTo(x - 6, y - 14);
        this.ctx.moveTo(x, y - 4);
        this.ctx.lineTo(x + 6, y - 10);
        this.ctx.stroke();
    }
}
