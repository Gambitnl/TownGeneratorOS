import { Ward } from './Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class Market extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create market stalls and buildings
    const buildings = Ward.createOrthoBuilding(block, 4, 0.7);
    this.geometry.push(...buildings);

    // Add some open space for the market square
    if (Random.bool(0.3)) {
      const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
        .scale(1 / block.vertices.length);
      const radius = Math.min(block.vertices.map(v => Point.distance(v, center))) * 0.3;
      
      if (radius > 2) {
        const marketSquare = new Polygon([
          center.add(new Point(radius, 0)),
          center.add(new Point(0, radius)),
          center.add(new Point(-radius, 0)),
          center.add(new Point(0, -radius))
        ]);
        this.geometry.push(marketSquare);
      }
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Markets prefer central locations near plazas
    let score = 0;
    
    if (model.plaza) {
      const distanceToPlaza = Point.distance(patch.shape.vertices[0], model.plaza.shape.vertices[0]);
      score += 1000 / (distanceToPlaza + 1);
    }
    
    // Prefer patches with good street access
    const streetCount = model.arteries.filter(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 5
      ))
    ).length;
    
    score += streetCount * 100;
    
    return score;
  }
} 