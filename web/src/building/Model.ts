import { Patch } from './Patch';
import { Polygon } from '../geom/Polygon';
import { CurtainWall } from './CurtainWall';
import { Point } from '../geom/Point';

export class Model {
  public wall: CurtainWall | null = null;
  public plaza: { shape: Polygon } | null = null;
  public arteries: Polygon[] = [];
  public gates: Point[] = [];
  public patches: Patch[] = []; // Added patches property

  public patchByVertex(v: Point): Patch[] {
    // Placeholder
    return [];
  }

  public getNeighbour(patch: Patch, v: Point): Patch | null {
    // Placeholder
    return null;
  }

  public isEnclosed(patch: Patch): boolean {
    // Placeholder
    return false;
  }

  public static findCircumference(patches: Patch[]): Polygon {
    if (patches.length === 0) {
      return new Polygon([]);
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const patch of patches) {
      for (const vertex of patch.shape.vertices) {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
      }
    }

    // Create a rectangular polygon from the bounding box
    const circumferenceVertices = [
      new Point(minX, minY),
      new Point(maxX, minY),
      new Point(maxX, maxY),
      new Point(minX, maxY),
    ];

    return new Polygon(circumferenceVertices);
  }

  public replace(oldPatch: Patch, newPatches: Patch[]): void {
    const index = this.patches.indexOf(oldPatch);
    if (index !== -1) {
      this.patches.splice(index, 1, ...newPatches);
    }
  }
}