import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class VillageInn extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create main inn building - larger than typical houses
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    const innWidth = Math.min(block.width * 0.7, 15);
    const innHeight = Math.min(block.height * 0.6, 12);
    
    const inn = new Polygon([
      new Point(center.x - innWidth/2, center.y - innHeight/2),
      new Point(center.x + innWidth/2, center.y - innHeight/2),
      new Point(center.x + innWidth/2, center.y + innHeight/2),
      new Point(center.x - innWidth/2, center.y + innHeight/2)
    ]);
    this.geometry.push(inn);

    // Add stable if there's space
    if (Random.bool(0.8) && block.width > innWidth + 8) {
      const stableWidth = innWidth * 0.6;
      const stableHeight = innHeight * 0.4;
      const stableX = center.x + (Random.bool() ? innWidth/2 + stableWidth/2 + 3 : -(innWidth/2 + stableWidth/2 + 3));
      
      const stable = new Polygon([
        new Point(stableX - stableWidth/2, center.y - stableHeight/2),
        new Point(stableX + stableWidth/2, center.y - stableHeight/2),
        new Point(stableX + stableWidth/2, center.y + stableHeight/2),
        new Point(stableX - stableWidth/2, center.y + stableHeight/2)
      ]);
      this.geometry.push(stable);
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Inns prefer main roads and central locations
    let score = 100; // Base preference for inns
    
    // Strongly prefer main road access
    const mainStreetCount = model.arteries.filter(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 5
      ))
    ).length;
    
    score += mainStreetCount * 200;
    
    // Prefer being near village center
    const distanceToCenter = Point.distance(patch.shape.vertices[0], model.center);
    score += 300 / (distanceToCenter + 1);
    
    return score;
  }
}