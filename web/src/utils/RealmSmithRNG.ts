/**
 * Mulberry32 seeded random number generator.
 * Fast and sufficient for procedural generation visual consistency.
 */
export class RNG {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    next(): number {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Range [min, max)
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    // Range [min, max] integers
    rangeInt(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }

    // True/False based on probability 0-1
    chance(probability: number): boolean {
        return this.next() < probability;
    }

    pick<T>(array: T[]): T {
        return array[this.rangeInt(0, array.length - 1)];
    }
}

/**
 * Perlin Noise Generator
 * Uses a seeded permutation table to generate smooth 2D noise.
 */
export class NoiseGenerator {
    private perm: number[] = new Array(512);
    private p: number[] = new Array(256);

    constructor(seed: number) {
        const rng = new RNG(seed);

        // Initialize permutation table
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }

        // Shuffle
        for (let i = 255; i > 0; i--) {
            const n = rng.rangeInt(0, i);
            const temp = this.p[i];
            this.p[i] = this.p[n];
            this.p[n] = temp;
        }

        // Duplicate to avoid overflow checks
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number): number {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    public noise(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.perm[X] + Y;
        const B = this.perm[X + 1] + Y;

        // Calculate dot products of gradients
        const aa = this.grad(this.perm[A], x, y);
        const ab = this.grad(this.perm[A + 1], x - 1, y);
        const ba = this.grad(this.perm[B], x, y - 1);
        const bb = this.grad(this.perm[B + 1], x - 1, y - 1);

        // Interpolate
        const val = this.lerp(v, this.lerp(u, aa, ab), this.lerp(u, ba, bb));

        // Normalize to approx [0, 1] (Perlin returns approx [-1, 1])
        return (val + 1) / 2;
    }
}
