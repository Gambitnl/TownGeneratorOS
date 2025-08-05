import { Ward } from '../Ward';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class CommonWard extends Ward {
  private minSq: number;
  private gridChaos: number;
  private sizeChaos: number;
  private emptyProb: number;

  constructor(model: Model, patch: Patch, minSq: number = 6, gridChaos: number = 0.3, sizeChaos: number = 0.3, emptyProb: number = 0.04) {
    super(model, patch);
    this.minSq = minSq;
    this.gridChaos = gridChaos;
    this.sizeChaos = sizeChaos;
    this.emptyProb = emptyProb;
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create buildings with improved layout for small towns
    try {
      // Use createAlleys for more organic building layouts
      const buildings = Ward.createAlleys(block, this.minSq, this.gridChaos, this.sizeChaos, this.emptyProb);
      
      // If createAlleys doesn't produce enough buildings, fall back to createOrthoBuilding
      if (buildings.length === 0) {
        const orthoBuildings = Ward.createOrthoBuilding(block, this.minSq, 0.6);
        this.geometry.push(...orthoBuildings);
      } else {
        this.geometry.push(...buildings);
      }
      
      // Ensure we have at least one building
      if (this.geometry.length === 0) {
        this.geometry.push(block);
      }
    } catch (error) {
      console.warn('Error creating ward geometry, using fallback:', error);
      this.geometry = [block];
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Common wards have no special preferences
    return 0;
  }

  // Expose static methods from Ward class for derived classes
  public static createOrthoBuilding(poly: Polygon, minBlockSq: number, fill: number): Polygon[] {
    return Ward.createOrthoBuilding(poly, minBlockSq, fill);
  }
  
  public static createAlleys(p: Polygon, minSq: number, gridChaos: number, sizeChaos: number, emptyProb: number = 0.04, split: boolean = true): Polygon[] {
    return Ward.createAlleys(p, minSq, gridChaos, sizeChaos, emptyProb, split);
  }
} 