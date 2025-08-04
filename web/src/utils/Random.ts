export class Random {
    private static _seed: number;
    private static _a: number = 1103515245;
    private static _c: number = 12345;
    private static _m: number = Math.pow(2, 31);

    public static reset(seed: number): void {
        Random._seed = seed;
    }

    public static float(): number {
        Random._seed = (Random._a * Random._seed + Random._c) % Random._m;
        return Random._seed / Random._m;
    }

    public static bool(probability: number = 0.5): boolean {
        return Random.float() < probability;
    }

    public static int(min: number, max: number): number {
        return Math.floor(Random.float() * (max - min + 1)) + min;
    }

    // Box-Muller transform for normal distribution
    private static _nextGaussian: number | null = null;
    public static normal(): number {
        if (Random._nextGaussian !== null) {
            const result = Random._nextGaussian;
            Random._nextGaussian = null;
            return result;
        }

        let u = 0, v = 0;
        while (u === 0) u = Random.float(); // Converting [0,1) to (0,1)
        while (v === 0) v = Random.float();

        const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        Random._nextGaussian = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
        return z0;
    }

    public static fuzzy(f: number): number {
        return Random.float() * f;
    }
}
