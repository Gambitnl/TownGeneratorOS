import { Ward } from './Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class CommonWard extends Ward {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create common residential buildings
    const buildings = Ward.createOrthoBuilding(block, 6, 0.6);
    this.geometry.push(...buildings);
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Common wards have no special preferences
    return 0;
  }
} 