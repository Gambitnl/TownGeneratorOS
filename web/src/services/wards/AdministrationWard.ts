import { Ward } from '../Ward';
import { CommonWard } from './CommonWard';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class AdministrationWard extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create administrative buildings and offices
    const buildings = CommonWard.createOrthoBuilding(block, 4, 0.8);
    this.geometry.push(...buildings);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Administration prefers central, prominent locations
    let score = 0;
    
    const distanceToCenter = Point.distance(patch.shape.vertices[0], model.center);
    score += 1000 / (distanceToCenter + 1);
    
    if (patch.shape.compactness > 0.7) {
      score += 300;
    }
    
    return score;
  }
} 