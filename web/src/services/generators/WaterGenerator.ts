import { Tile, TileType } from '@/types/tile';
import * as Random from '@/utils/Random';

export class WaterGenerator {
    private width: number;
    private height: number;
    private tiles: Tile[][];

    constructor(width: number, height: number, tiles: Tile[][]) {
        this.width = width;
        this.height = height;
        this.tiles = tiles;
    }

    public generate(riverCount: number = 1, lakeCount: number = 1) {
        for (let i = 0; i < riverCount; i++) {
            this.createRiver();
        }
        for (let i = 0; i < lakeCount; i++) {
            this.createLake();
        }
    }

    private createRiver() {
        // Start at an edge
        const start = this.getRandomEdgePoint();
        let current = { ...start };

        // Target a different edge (roughly opposite)
        let target = this.getRandomEdgePoint();
        while (this.getDistance(start, target) < Math.min(this.width, this.height) / 2) {
            target = this.getRandomEdgePoint();
        }

        const path: { x: number, y: number }[] = [];
        let safety = 0;
        const maxSteps = this.width * this.height;

        while (safety < maxSteps) {
            path.push({ ...current });
            this.setWater(current.x, current.y);

            // Check if we reached an edge (but not the start edge immediately)
            if (safety > 5 && (current.x === 0 || current.x === this.width - 1 || current.y === 0 || current.y === this.height - 1)) {
                break;
            }

            // Move towards target with some randomness
            const moves = [
                { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
            ];

            // Filter valid moves
            const validMoves = moves.filter(m => {
                const nx = current.x + m.x;
                const ny = current.y + m.y;
                return nx >= 0 && nx < this.width && ny >= 0 && ny < this.height;
            });

            if (validMoves.length === 0) break;

            // Pick move that gets closer to target, or random
            // 60% chance to move towards target, 40% random
            let move;
            if (Random.bool(0.6)) {
                move = validMoves.sort((a, b) => {
                    const da = this.getDistance({ x: current.x + a.x, y: current.y + a.y }, target);
                    const db = this.getDistance({ x: current.x + b.x, y: current.y + b.y }, target);
                    return da - db;
                })[0];
            } else {
                move = Random.pick(validMoves);
            }

            current.x += move.x;
            current.y += move.y;
            safety++;
        }

        // Widen the river slightly in some places
        path.forEach(p => {
            if (Random.bool(0.3)) {
                const neighbors = [
                    { x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y },
                    { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 }
                ];
                const n = Random.pick(neighbors);
                if (this.isValid(n.x, n.y)) {
                    this.setWater(n.x, n.y);
                }
            }
        });
    }

    private createLake() {
        const centerX = Random.int(5, this.width - 5);
        const centerY = Random.int(5, this.height - 5);
        const size = Random.int(10, 30);

        for (let i = 0; i < size; i++) {
            // Simple blob growth
            const angle = Random.float(0, Math.PI * 2);
            const dist = Random.float(0, Math.sqrt(size));
            const x = Math.floor(centerX + Math.cos(angle) * dist);
            const y = Math.floor(centerY + Math.sin(angle) * dist);

            if (this.isValid(x, y)) {
                this.setWater(x, y);
                // Add neighbors to make it contiguous
                this.setWater(x + 1, y);
                this.setWater(x, y + 1);
            }
        }
    }

    private getRandomEdgePoint() {
        const side = Random.int(0, 3);
        switch (side) {
            case 0: return { x: Random.int(0, this.width - 1), y: 0 }; // Top
            case 1: return { x: this.width - 1, y: Random.int(0, this.height - 1) }; // Right
            case 2: return { x: Random.int(0, this.width - 1), y: this.height - 1 }; // Bottom
            default: return { x: 0, y: Random.int(0, this.height - 1) }; // Left
        }
    }

    private getDistance(p1: { x: number, y: number }, p2: { x: number, y: number }) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    private isValid(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    private setWater(x: number, y: number) {
        if (this.isValid(x, y)) {
            this.tiles[y][x].type = TileType.Water;
            this.tiles[y][x].variant = 'water_center'; // Default, can be refined later
        }
    }
}
