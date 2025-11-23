import * as Random from '../utils/Random';

export class StateManager {
  private static readonly SIZE = 'size';
  private static readonly SEED = 'seed';

  public static size = 15;
  public static seed = -1;

  public static pullParams(): void {
    const params = new URLSearchParams(window.location.search);
    const sizeParam = params.get(this.SIZE);
    if (sizeParam) {
      const size = parseInt(sizeParam, 10);
      this.size = Math.max(6, Math.min(size, 40));
    }

    const seedParam = params.get(this.SEED);
    if (seedParam) {
      const seed = parseInt(seedParam, 10);
      this.seed = seed > 0 ? seed : -1;
    }
  }

  public static pushParams(): void {
    if (this.seed === -1) {
      Random.reset();
      this.seed = Random.getSeed();
    }

    const params = new URLSearchParams();
    params.set(this.SIZE, this.size.toString());
    params.set(this.SEED, this.seed.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({ size: this.size, seed: this.seed }, this.getStateName(), newUrl);
  }

  private static getStateName(): string {
    if (this.size >= 6 && this.size < 10) {
      return 'Small Town';
    }
    if (this.size >= 10 && this.size < 15) {
      return 'Large Town';
    }
    if (this.size >= 15 && this.size < 24) {
      return 'Small City';
    }
    if (this.size >= 24 && this.size < 40) {
      return 'Large City';
    }
    if (this.size >= 40) {
      return 'Metropolis';
    }
    return 'Unknown state';
  }
}
