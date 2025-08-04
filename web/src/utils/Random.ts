class Random {
  private static g = 48271.0;
  private static n = 2147483647;

  private static seed = 1;

  public static reset(seed: number = -1) {
    Random.seed = seed !== -1 ? seed : Math.floor(Date.now() % Random.n);
  }

  public static getSeed(): number {
    return Random.seed;
  }

  private static next(): number {
    return (Random.seed = Math.floor((Random.seed * Random.g) % Random.n));
  }

  public static float(): number {
    return Random.next() / Random.n;
  }

  public static normal(): number {
    return (Random.float() + Random.float() + Random.float()) / 3;
  }

  public static int(min: number, max: number): number {
    return Math.floor(min + (Random.next() / Random.n) * (max - min));
  }

  public static bool(chance: number = 0.5): boolean {
    return Random.float() < chance;
  }

  public static fuzzy(f: number = 1.0): number {
    return f === 0 ? 0.5 : (1 - f) / 2 + f * Random.normal();
  }
}

export { Random };