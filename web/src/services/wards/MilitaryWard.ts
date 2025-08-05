import { Ward } from '../Ward';
import { CommonWard } from './CommonWard';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class MilitaryWard extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create military barracks and training grounds
    const buildings = CommonWard.createOrthoBuilding(block, 4, 0.7);
    this.geometry.push(...buildings);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Military prefers locations near walls and gates
    let score = 0;
    
    for (const gate of model.gates) {
      const distanceToGate = Point.distance(patch.shape.vertices[0], gate);
      score += 400 / (distanceToGate + 1);
    }
    
    if (patch.withinWalls) {
      score += 200;
    }
    
    return score;
  }
} 