let seed = 1;
const g = 48271.0;
const n = 2147483647;

export function reset(newSeed: number = -1) {
  seed = newSeed !== -1 ? newSeed : Math.floor(Date.now() % n);
}

export function getSeed(): number {
  return seed;
}

function next(): number {
  return (seed = Math.floor((seed * g) % n));
}

export function float(min: number = 0, max: number = 1): number {
  return min + (next() / n) * (max - min);
}

export function normal(): number {
  return (float() + float() + float()) / 3;
}

export function int(min: number, max: number): number {
  return Math.floor(min + (next() / n) * (max - min));
}

export function bool(chance: number = 0.5): boolean {
  return float() < chance;
}

export function pick<T>(array: T[]): T {
  return array[int(0, array.length)];
}

export function fuzzy(f: number = 1.0): number {
  return f === 0 ? 0.5 : (1 - f) / 2 + f * normal();
}