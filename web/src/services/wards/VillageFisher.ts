import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class VillageFisher extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create fishing hut/house
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    const hutSize = Math.min(block.width, block.height) * 0.4;
    const hut = new Polygon([
      new Point(center.x - hutSize/2, center.y - hutSize/2),
      new Point(center.x + hutSize/2, center.y - hutSize/2),
      new Point(center.x + hutSize/2, center.y + hutSize/2),
      new Point(center.x - hutSize/2, center.y + hutSize/2)
    ]);
    this.geometry.push(hut);

    // Add boat storage/drying rack area
    if (Random.bool(0.7)) {
      const rackWidth = hutSize * 0.8;
      const rackHeight = hutSize * 0.3;
      const rackY = center.y + hutSize/2 + rackHeight/2 + 1;
      
      if (rackY + rackHeight/2 < block.maxY) {
        const rack = new Polygon([
          new Point(center.x - rackWidth/2, rackY - rackHeight/2),
          new Point(center.x + rackWidth/2, rackY - rackHeight/2),
          new Point(center.x + rackWidth/2, rackY + rackHeight/2),
          new Point(center.x - rackWidth/2, rackY + rackHeight/2)
        ]);
        this.geometry.push(rack);
      }
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Fishers prefer edge/water access locations
    let score = 50;
    
    // Prefer patches away from center (near water/edge)
    const distanceToCenter = Point.distance(patch.shape.vertices[0], model.center);
    score += distanceToCenter * 3;
    
    // Don't need main road access
    const onMainRoad = model.arteries.some(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 5
      ))
    );
    
    if (!onMainRoad) score += 100; // Prefer quieter locations
    
    return score;
  }
}