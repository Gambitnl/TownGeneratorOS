import { Ward } from './Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class Slum extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create small, cramped buildings
    const buildings = Ward.createOrthoBuilding(block, 8, 0.4);
    this.geometry.push(...buildings);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Slums prefer less desirable locations
    let score = 0;
    
    // Prefer patches away from the center
    const distanceToCenter = Point.distance(patch.shape.vertices[0], model.center);
    score += distanceToCenter * 0.1;
    
    // Prefer smaller patches
    score += (10 - patch.shape.vertices.length) * 10;
    
    // Prefer patches with poor street access
    const streetCount = model.arteries.filter(street => 
      street.vertices.some(v => patch.shape.vertices.some(pv => 
        Point.distance(v, pv) < 5
      ))
    ).length;
    
    score += (5 - streetCount) * 20;
    
    return score;
  }
} 