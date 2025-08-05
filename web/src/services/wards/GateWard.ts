import { CommonWard } from './CommonWard';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class GateWard extends CommonWard {
  constructor(model: Model, patch: Patch) {
    super(model, patch, 4, 0.3, 0.3, 0.1);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create gate houses and defensive structures
    const buildings = CommonWard.createOrthoBuilding(block, 3, 0.8);
    this.geometry.push(...buildings);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Gate wards are assigned by the model, not rated
    return 0;
  }
} 