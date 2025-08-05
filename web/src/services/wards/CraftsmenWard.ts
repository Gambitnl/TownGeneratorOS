import { Ward } from './Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class CraftsmenWard extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create workshops and small buildings
    const buildings = Ward.createOrthoBuilding(block, 6, 0.6);
    this.geometry.push(...buildings);

    // Add some specialized workshop areas
    if (Random.bool(0.4)) {
      const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
        .scale(1 / block.vertices.length);
      const workshopSize = Math.min(block.vertices.map(v => Point.distance(v, center))) * 0.2;
      
      const workshop = new Polygon([
        center.add(new Point(-workshopSize, -workshopSize)),
        center.add(new Point(workshopSize, -workshopSize)),
        center.add(new Point(workshopSize, workshopSize)),
        center.add(new Point(-workshopSize, workshopSize))
      ]);
      this.geometry.push(workshop);
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Craftsmen prefer locations near markets and with good access
    let score = 0;
    
    if (model.plaza) {
      const distanceToPlaza = Point.distance(patch.shape.vertices[0], model.plaza.shape.vertices[0]);
      score += 500 / (distanceToPlaza + 1);
    }
    
    // Prefer patches with street access
    const streetCount = model.arteries.filter(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 5
      ))
    ).length;
    
    score += streetCount * 50;
    
    return score;
  }
} 