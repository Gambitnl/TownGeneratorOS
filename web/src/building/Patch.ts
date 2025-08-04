import { Polygon } from '../geom/Polygon';
import { Point } from '../geom/Point';

export class Patch {
  public shape: Polygon;
  public withinCity: boolean;
  public withinWalls: boolean;

  constructor(shape: Polygon) {
    this.shape = shape;
    this.withinCity = false;
    this.withinWalls = false;
  }

  public some(callback: (p: Patch) => boolean): boolean {
    // Placeholder
    return false;
  }

  public every(callback: (p: Patch) => boolean): boolean {
    // Placeholder
    return false;
  }
}