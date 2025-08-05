import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class Cathedral extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create cathedral building
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    // Main cathedral building
    const cathedralSize = Math.min(block.vertices.map(v => Point.distance(v, center))) * 0.6;
    const cathedral = new Polygon([
      center.add(new Point(-cathedralSize, -cathedralSize * 1.5)),
      center.add(new Point(cathedralSize, -cathedralSize * 1.5)),
      center.add(new Point(cathedralSize, cathedralSize * 0.5)),
      center.add(new Point(-cathedralSize, cathedralSize * 0.5))
    ]);
    this.geometry.push(cathedral);

    // Bell tower
    if (Random.bool(0.7)) {
      const towerSize = cathedralSize * 0.3;
      const tower = new Polygon([
        center.add(new Point(-towerSize, -cathedralSize * 1.5 - towerSize)),
        center.add(new Point(towerSize, -cathedralSize * 1.5 - towerSize)),
        center.add(new Point(towerSize, -cathedralSize * 1.5)),
        center.add(new Point(-towerSize, -cathedralSize * 1.5))
      ]);
      this.geometry.push(tower);
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Cathedrals prefer prominent, central locations
    let score = 0;
    
    // Prefer patches near the center
    const distanceToCenter = Point.distance(patch.shape.vertices[0], model.center);
    score += 1000 / (distanceToCenter + 1);
    
    // Prefer larger patches
    score += patch.shape.vertices.length * 50;
    
    // Prefer patches with good visibility
    if (patch.shape.compactness > 0.7) {
      score += 200;
    }
    
    return score;
  }
} 