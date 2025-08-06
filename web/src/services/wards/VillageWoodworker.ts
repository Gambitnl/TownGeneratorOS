import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class VillageWoodworker extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create workshop building
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    const workshopSize = Math.min(block.width, block.height) * 0.5;
    const workshop = new Polygon([
      new Point(center.x - workshopSize/2, center.y - workshopSize/2),
      new Point(center.x + workshopSize/2, center.y - workshopSize/2),
      new Point(center.x + workshopSize/2, center.y + workshopSize/2),
      new Point(center.x - workshopSize/2, center.y + workshopSize/2)
    ]);
    this.geometry.push(workshop);

    // Add lumber storage area
    if (Random.bool(0.6) && block.width > workshopSize * 1.4) {
      const storageSize = workshopSize * 0.4;
      const storageY = center.y + workshopSize/2 + storageSize/2 + 2;
      
      if (storageY + storageSize/2 < block.maxY) {
        const storage = new Polygon([
          new Point(center.x - storageSize/2, storageY - storageSize/2),
          new Point(center.x + storageSize/2, storageY - storageSize/2),
          new Point(center.x + storageSize/2, storageY + storageSize/2),
          new Point(center.x - storageSize/2, storageY + storageSize/2)
        ]);
        this.geometry.push(storage);
      }
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Woodworkers prefer edge locations with some road access
    let score = 0;
    
    // Prefer patches near but not on main roads
    const nearStreet = model.arteries.some(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 12 && Point.distance(v, pv) > 3
      ))
    );
    
    if (nearStreet) score += 150;
    
    // Slightly prefer outer areas (less noise complaints)
    const distanceToCenter = Point.distance(patch.shape.vertices[0], model.center);
    score += distanceToCenter * 2;
    
    return score;
  }
}