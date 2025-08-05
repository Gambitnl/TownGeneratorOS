import { Ward } from './Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class MerchantWard extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create merchant houses and shops
    const buildings = Ward.createOrthoBuilding(block, 5, 0.7);
    this.geometry.push(...buildings);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Merchants prefer locations near markets and gates
    let score = 0;
    
    if (model.plaza) {
      const distanceToPlaza = Point.distance(patch.shape.vertices[0], model.plaza.shape.vertices[0]);
      score += 800 / (distanceToPlaza + 1);
    }
    
    // Prefer patches near gates
    for (const gate of model.gates) {
      const distanceToGate = Point.distance(patch.shape.vertices[0], gate);
      score += 300 / (distanceToGate + 1);
    }
    
    return score;
  }
} 