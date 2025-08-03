import OriginalWFC, { WaveFunctionCollapseSettings, Tiles } from '@kobandavis/wfc';

export class WFC extends OriginalWFC {
  constructor(settings: WaveFunctionCollapseSettings, tiles: Tiles) {
    super(settings, tiles);
  }

  generate(width: number, height: number): Promise<string[][]> {
    // The generate method in OriginalWFC is solve()
    return Promise.resolve(this.solve());
  }
}

export type { WaveFunctionCollapseSettings, Tiles };