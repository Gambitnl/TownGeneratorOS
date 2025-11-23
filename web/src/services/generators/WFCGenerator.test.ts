import { describe, it, expect } from 'vitest';
import { WFCGenerator, DIRECTIONS, OPPOSITE, Socket } from './WFCGenerator';
import { TileType } from '@/types/tile';

describe('WFCGenerator', () => {
    it('should initialize with default rules', () => {
        const wfc = new WFCGenerator(10, 10);
        wfc.initializeDefaultRules();
        // We can't easily access private members, but we can try to generate
        const tiles = wfc.generate();
        expect(tiles.length).toBe(10);
        expect(tiles[0].length).toBe(10);
    });

    it('should generate a valid grid (connectivity check)', () => {
        const width = 10;
        const height = 10;
        const wfc = new WFCGenerator(width, height);
        wfc.initializeDefaultRules();

        const tiles = wfc.generate();

        // Helper to get socket for a tile
        // We need to reconstruct the socket logic or expose it.
        // Since we can't access the internal modules easily, we'll just check basic properties.
        // Or we can manually verify the output tiles against the expected rules.

        // Let's define the rules map again for verification
        const getSockets = (type: TileType, variant: string | undefined, rotation: number) => {
            // Simplified reconstruction of the rules used in WFCGenerator
            // This is a bit redundant but verifies the output matches expectations.

            // Base sockets (rotation 0)
            let base: Record<string, string> = { n: 'g', e: 'g', s: 'g', w: 'g' };
            if (type === TileType.Road) {
                if (variant === 'straight') base = { n: 'r', e: 'g', s: 'r', w: 'g' };
                else if (variant === 'corner') base = { n: 'r', e: 'r', s: 'g', w: 'g' };
                else if (variant === 'tee') base = { n: 'r', e: 'r', s: 'r', w: 'g' };
                else if (variant === 'cross') base = { n: 'r', e: 'r', s: 'r', w: 'r' };
            }

            // Rotate
            // 0: n, e, s, w
            // 90: w, n, e, s
            // 180: s, w, n, e
            // 270: e, s, w, n

            const rotSteps = (rotation / 90) % 4;
            const sockets = { ...base };

            // Helper to rotate once
            const rotate = (s: any) => ({ n: s.w, e: s.n, s: s.e, w: s.s });

            let current = { n: base.n, e: base.e, s: base.s, w: base.w };
            for (let i = 0; i < rotSteps; i++) {
                current = rotate(current);
            }

            return current;
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = tiles[y][x];
                const sockets = getSockets(tile.type, tile.variant, tile.rotation);

                // Check East neighbor
                if (x < width - 1) {
                    const eastTile = tiles[y][x + 1];
                    const eastSockets = getSockets(eastTile.type, eastTile.variant, eastTile.rotation);
                    // My East must match their West
                    if (sockets.e !== eastSockets.w) {
                        console.error(`Mismatch at (${x},${y}) East: ${sockets.e} vs (${x + 1},${y}) West: ${eastSockets.w}`);
                        console.error('Tile:', tile);
                        console.error('East Tile:', eastTile);
                    }
                    expect(sockets.e).toBe(eastSockets.w);
                }

                // Check South neighbor
                if (y < height - 1) {
                    const southTile = tiles[y + 1][x];
                    const southSockets = getSockets(southTile.type, southTile.variant, southTile.rotation);
                    // My South must match their North
                    if (sockets.s !== southSockets.n) {
                        console.error(`Mismatch at (${x},${y}) South: ${sockets.s} vs (${x},${y + 1}) North: ${southSockets.n}`);
                    }
                    expect(sockets.s).toBe(southSockets.n);
                }
            }
        }
    });
});
