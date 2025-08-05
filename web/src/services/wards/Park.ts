import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class Park extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create park features
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    const parkSize = Math.min(block.vertices.map(v => Point.distance(v, center))) * 0.7;
    const park = new Polygon([
      center.add(new Point(-parkSize, -parkSize)),
      center.add(new Point(parkSize, -parkSize)),
      center.add(new Point(parkSize, parkSize)),
      center.add(new Point(-parkSize, parkSize))
    ]);
    this.geometry.push(park);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Parks prefer larger patches with good access
    let score = 0;
    
    score += patch.shape.vertices.length * 30;
    
    if (patch.shape.compactness > 0.6) {
      score += 200;
    }
    
    return score;
  }
} 