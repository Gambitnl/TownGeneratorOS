import { Tile, TileType } from '@/types/tile';
import * as Random from '@/utils/Random';

// -- Types --

export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export const DIRECTIONS: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];

export const OPPOSITE: Record<Direction, Direction> = {
    'NORTH': 'SOUTH',
    'EAST': 'WEST',
    'SOUTH': 'NORTH',
    'WEST': 'EAST'
};

// A "Socket" represents the connection type on a tile edge.
// e.g. 'g' for grass, 'r' for road.
// Sockets can be symmetric or asymmetric. For simplicity, we'll use string IDs.
export type Socket = string;

// A specific configuration of a tile (Type + Rotation + Variant)
export interface Module {
    id: string; // Unique ID for this module configuration
    type: TileType;
    rotation: number;
    variant?: string;
    sockets: Record<Direction, Socket>; // What socket is on each side
    weight: number; // Selection probability
}

// The state of a cell in the grid
interface Cell {
    x: number;
    y: number;
    collapsed: boolean;
    possibleModules: Module[]; // List of modules still valid for this cell
}

export class WFCGenerator {
    private width: number;
    private height: number;
    private grid: Cell[][];
    private modules: Module[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.modules = [];
    }

    // -- Setup --

    public defineModule(
        type: TileType,
        variant: string | undefined,
        sockets: { n: Socket, e: Socket, s: Socket, w: Socket },
        weight: number = 1,
        allowRotation: boolean = true
    ) {
        // Base module
        const base: Module = {
            id: `${type}${variant ? '_' + variant : ''}_0`,
            type,
            rotation: 0,
            variant,
            sockets: {
                'NORTH': sockets.n,
                'EAST': sockets.e,
                'SOUTH': sockets.s,
                'WEST': sockets.w
            },
            weight
        };
        this.modules.push(base);

        if (allowRotation) {
            // Add 90, 180, 270 degree rotations
            let current = base;
            for (let i = 1; i <= 3; i++) {
                const rot = i * 90;
                const nextSockets = {
                    'NORTH': current.sockets['WEST'],
                    'EAST': current.sockets['NORTH'],
                    'SOUTH': current.sockets['EAST'],
                    'WEST': current.sockets['SOUTH']
                };

                const rotated: Module = {
                    id: `${type}${variant ? '_' + variant : ''}_${rot}`,
                    type,
                    rotation: rot,
                    variant,
                    sockets: nextSockets,
                    weight
                };
                this.modules.push(rotated);
                current = rotated;
            }
        }
    }

    public initializeDefaultRules() {
        // Sockets: 'g' = grass, 'r' = road

        // Grass: All sides grass
        this.defineModule(TileType.Grass, undefined, { n: 'g', e: 'g', s: 'g', w: 'g' }, 10, false);

        // Road Straight: N/S road, E/W grass
        this.defineModule(TileType.Road, 'straight', { n: 'r', e: 'g', s: 'r', w: 'g' }, 2, true);

        // Road Corner: N/E road, S/W grass
        this.defineModule(TileType.Road, 'corner', { n: 'r', e: 'r', s: 'g', w: 'g' }, 2, true);

        // Road Tee: N/E/S road, W grass
        this.defineModule(TileType.Road, 'tee', { n: 'r', e: 'r', s: 'r', w: 'g' }, 1, true);

        // Road Cross: All sides road
        this.defineModule(TileType.Road, 'cross', { n: 'r', e: 'r', s: 'r', w: 'r' }, 1, true);

        // House: For now, let's say houses are just on grass. 
        // To ensure they are accessible, maybe we need a 'path' socket or just rely on probability?
        // Let's try adding a 'house_front' socket that connects to 'g' but implies facing?
        // For simplicity, let's just treat House as a Grass tile that looks different.
        // Or: House has 'g' on all sides.
        this.defineModule(TileType.House, undefined, { n: 'g', e: 'g', s: 'g', w: 'g' }, 1, false);
    }

    // -- Execution --

    public generate(): Tile[][] {
        const maxRetries = 5;

        for (let retry = 0; retry < maxRetries; retry++) {
            this.initGrid();

            let attempts = 0;
            const maxAttempts = 1000; // Per-retry attempt limit
            let failed = false;

            while (!this.isFullyCollapsed() && attempts < maxAttempts) {
                const success = this.iterate();
                if (!success) {
                    // Hit a contradiction
                    failed = true;
                    break;
                }
                attempts++;
            }

            if (!failed && attempts < maxAttempts) {
                // Success!
                console.log(`WFC succeeded on retry ${retry + 1}`);
                return this.gridToTiles();
            }

            console.warn(`WFC attempt ${retry + 1} failed, retrying...`);
        }

        // All retries failed, generate a simple fallback pattern
        console.warn("WFC failed after all retries, using fallback pattern");
        return this.generateFallbackPattern();
    }

    private generateFallbackPattern(): Tile[][] {
        // Generate a simple grid pattern with some roads
        const tiles: Tile[][] = [];
        for (let y = 0; y < this.height; y++) {
            const row: Tile[] = [];
            for (let x = 0; x < this.width; x++) {
                // Create a simple road grid every 5 tiles
                const isRoadH = y % 5 === 2;
                const isRoadV = x % 5 === 2;

                if (isRoadH && isRoadV) {
                    row.push({ x, y, type: TileType.Road, rotation: 0, variant: 'cross' });
                } else if (isRoadH) {
                    row.push({ x, y, type: TileType.Road, rotation: 0, variant: 'straight' });
                } else if (isRoadV) {
                    row.push({ x, y, type: TileType.Road, rotation: 90, variant: 'straight' });
                } else {
                    row.push({ x, y, type: TileType.Grass, rotation: 0 });
                }
            }
            tiles.push(row);
        }
        return tiles;
    }

    private initGrid() {
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push({
                    x,
                    y,
                    collapsed: false,
                    possibleModules: [...this.modules] // Start with all possibilities
                });
            }
            this.grid.push(row);
        }
    }

    private isFullyCollapsed(): boolean {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.grid[y][x].collapsed) return false;
            }
        }
        return true;
    }

    private iterate(): boolean {
        // 1. Find cell with lowest entropy
        const cell = this.findLowestEntropyCell();
        if (!cell) return false; // Contradiction or done

        // 2. Collapse it
        this.collapseCell(cell);

        // 3. Propagate constraints
        return this.propagate(cell);
    }

    private findLowestEntropyCell(): Cell | null {
        let minEntropy = Infinity;
        let candidates: Cell[] = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.grid[y][x];
                if (!cell.collapsed) {
                    const entropy = cell.possibleModules.length;
                    if (entropy === 0) {
                        // Error state: no possibilities left. 
                        // In a full implementation, we would backtrack. 
                        // Here we might just restart or leave it blank.
                        return null;
                    }

                    if (entropy < minEntropy) {
                        minEntropy = entropy;
                        candidates = [cell];
                    } else if (entropy === minEntropy) {
                        candidates.push(cell);
                    }
                }
            }
        }

        if (candidates.length === 0) return null;
        return candidates[Math.floor(Random.float() * candidates.length)];
    }

    private collapseCell(cell: Cell) {
        // Weighted random choice
        const totalWeight = cell.possibleModules.reduce((sum, mod) => sum + mod.weight, 0);
        let r = Random.float() * totalWeight;

        let selected: Module = cell.possibleModules[0];
        for (const mod of cell.possibleModules) {
            r -= mod.weight;
            if (r <= 0) {
                selected = mod;
                break;
            }
        }

        cell.collapsed = true;
        cell.possibleModules = [selected];
    }

    private propagate(startCell: Cell): boolean {
        const stack = [startCell];

        while (stack.length > 0) {
            const current = stack.pop()!;
            const curX = current.x;
            const curY = current.y;

            // Check all neighbors
            for (const dir of DIRECTIONS) {
                const { dx, dy } = this.getDelta(dir);
                const nx = curX + dx;
                const ny = curY + dy;

                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    const neighbor = this.grid[ny][nx];
                    if (neighbor.collapsed) continue; // Already fixed

                    // Constrain neighbor based on current cell's possible modules
                    // The neighbor's possible modules must have a socket compatible 
                    // with AT LEAST ONE of the current cell's possible modules' socket in that direction.

                    // Actually, standard WFC:
                    // For each module M_n in neighbor:
                    //   Is there ANY module M_c in current such that M_c connects to M_n?
                    //   If no, remove M_n.

                    // Optimization: Pre-calculate valid sockets?
                    // Let's do it simply first.

                    // Get all valid sockets from current cell in direction 'dir'
                    const validSockets = new Set<string>();
                    for (const mod of current.possibleModules) {
                        validSockets.add(mod.sockets[dir]);
                    }

                    // Filter neighbor modules
                    const originalCount = neighbor.possibleModules.length;
                    neighbor.possibleModules = neighbor.possibleModules.filter(nMod => {
                        // The neighbor's socket in the OPPOSITE direction must match one of the valid sockets
                        const neededSocket = nMod.sockets[OPPOSITE[dir]];
                        // In our simple system, sockets must match exactly (e.g. 'r' == 'r')
                        // If we had complex sockets (symmetric/asymmetric), we'd check compatibility.
                        // Here we assume 'r' connects to 'r', 'g' to 'g'.
                        return validSockets.has(neededSocket);
                    });

                    if (neighbor.possibleModules.length < originalCount) {
                        stack.push(neighbor);
                        if (neighbor.possibleModules.length === 0) {
                            // Contradiction!
                            return false;
                        }
                    }
                }
            }
        }
        return true; // No contradictions
    }

    private getDelta(dir: Direction): { dx: number, dy: number } {
        switch (dir) {
            case 'NORTH': return { dx: 0, dy: -1 };
            case 'EAST': return { dx: 1, dy: 0 };
            case 'SOUTH': return { dx: 0, dy: 1 };
            case 'WEST': return { dx: -1, dy: 0 };
        }
    }

    private gridToTiles(): Tile[][] {
        const tiles: Tile[][] = [];
        for (let y = 0; y < this.height; y++) {
            const row: Tile[] = [];
            for (let x = 0; x < this.width; x++) {
                const cell = this.grid[y][x];
                const mod = cell.possibleModules[0]; // Should be collapsed

                // If not collapsed (error/contradiction), fallback to Grass
                if (!mod) {
                    row.push({
                        x, y,
                        type: TileType.Grass,
                        rotation: 0
                    });
                } else {
                    row.push({
                        x, y,
                        type: mod.type,
                        rotation: mod.rotation,
                        variant: mod.variant
                    });
                }
            }
            tiles.push(row);
        }
        return tiles;
    }
}
