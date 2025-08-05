import { Ward } from './Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class GateWard extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create gatehouse and guard buildings
    const buildings = Ward.createOrthoBuilding(block, 3, 0.8);
    this.geometry.push(...buildings);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Gate wards are assigned by the model, not rated
    return 0;
  }
} 