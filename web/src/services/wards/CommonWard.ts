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

    const housesToBuild = Random.int(2, 4);

    for (let i = 0; i < housesToBuild; i++) {
        const house = this.createHouse(block);
        if (house) {
            this.geometry.push(house);
        }
    }
  }

  private createHouse(block: Polygon): Polygon | null {
    const houseSize = 10 + Random.float() * 5;
    const aspectRatio = 0.7 + Random.float() * 0.6;

    for (let i = 0; i < 10; i++) { // Try 10 times to place a house
        const x = block.minX + Random.float() * (block.width - houseSize);
        const y = block.minY + Random.float() * (block.height - houseSize * aspectRatio);
        const center = new Point(x + houseSize / 2, y + houseSize * aspectRatio / 2);

        if (block.contains(center)) {
            const house = new Polygon([
                new Point(x, y),
                new Point(x + houseSize, y),
                new Point(x + houseSize, y + houseSize * aspectRatio),
                new Point(x, y + houseSize * aspectRatio),
            ]);

            // Check for overlaps with existing houses
            let overlaps = false;
            for (const existing of this.geometry) {
                if (existing.overlaps(house)) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                return house;
            }
        }
    }

    return null;
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