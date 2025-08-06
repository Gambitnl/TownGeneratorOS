import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class VillageBlacksmith extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create main smithy building
    const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
      .scale(1 / block.vertices.length);
    
    const smithySize = Math.min(block.width, block.height) * 0.6;
    const smithy = new Polygon([
      new Point(center.x - smithySize/2, center.y - smithySize/2),
      new Point(center.x + smithySize/2, center.y - smithySize/2),
      new Point(center.x + smithySize/2, center.y + smithySize/2),
      new Point(center.x - smithySize/2, center.y + smithySize/2)
    ]);
    this.geometry.push(smithy);

    // Add small outbuildings (storage, coal shed)
    if (Random.bool(0.7) && block.width > smithySize * 1.5) {
      const shedSize = smithySize * 0.3;
      const shedX = center.x + (Random.bool() ? smithySize/2 + shedSize/2 + 2 : -(smithySize/2 + shedSize/2 + 2));
      const shed = new Polygon([
        new Point(shedX - shedSize/2, center.y - shedSize/2),
        new Point(shedX + shedSize/2, center.y - shedSize/2),
        new Point(shedX + shedSize/2, center.y + shedSize/2),
        new Point(shedX - shedSize/2, center.y + shedSize/2)
      ]);
      this.geometry.push(shed);
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Blacksmiths prefer central locations with road access
    let score = 0;
    
    // Prefer patches near main roads
    const streetCount = model.arteries.filter(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 8
      ))
    ).length;
    
    score += streetCount * 100;
    
    return score;
  }
}