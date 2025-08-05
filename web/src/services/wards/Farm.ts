import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class Farm extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create farmhouse and fields
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    const farmhouseSize = Math.min(block.vertices.map(v => Point.distance(v, center))) * 0.3;
    const farmhouse = new Polygon([
      center.add(new Point(-farmhouseSize, -farmhouseSize)),
      center.add(new Point(farmhouseSize, -farmhouseSize)),
      center.add(new Point(farmhouseSize, farmhouseSize)),
      center.add(new Point(-farmhouseSize, farmhouseSize))
    ]);
    this.geometry.push(farmhouse);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Farms prefer larger patches outside the city
    let score = 0;
    
    if (!patch.withinCity) {
      score += 500;
    }
    
    score += patch.shape.vertices.length * 20;
    
    return score;
  }
} 