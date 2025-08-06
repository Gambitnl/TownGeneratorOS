import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class VillageHouse extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create main house
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    const houseWidth = Math.min(block.width * 0.6, 8 + Random.float() * 4);
    const houseHeight = Math.min(block.height * 0.6, 6 + Random.float() * 3);
    
    const house = new Polygon([
      new Point(center.x - houseWidth/2, center.y - houseHeight/2),
      new Point(center.x + houseWidth/2, center.y - houseHeight/2),
      new Point(center.x + houseWidth/2, center.y + houseHeight/2),
      new Point(center.x - houseWidth/2, center.y + houseHeight/2)
    ]);
    this.geometry.push(house);

    // Sometimes add small outbuilding (shed, privy, etc.)
    if (Random.bool(0.3) && block.width > houseWidth + 4) {
      const shedSize = Math.min(houseWidth * 0.4, 3);
      const shedX = center.x + (Random.bool() ? houseWidth/2 + shedSize/2 + 2 : -(houseWidth/2 + shedSize/2 + 2));
      
      if (Math.abs(shedX) + shedSize/2 < block.width/2) {
        const shed = new Polygon([
          new Point(shedX - shedSize/2, center.y - shedSize/2),
          new Point(shedX + shedSize/2, center.y - shedSize/2),
          new Point(shedX + shedSize/2, center.y + shedSize/2),
          new Point(shedX - shedSize/2, center.y + shedSize/2)
        ]);
        this.geometry.push(shed);
      }
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Houses have no special location preferences
    let score = 10; // Slight base preference
    
    // Slight preference for road access but not mandatory
    const nearRoad = model.arteries.some(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 10
      ))
    );
    
    if (nearRoad) score += 20;
    
    return score;
  }
}