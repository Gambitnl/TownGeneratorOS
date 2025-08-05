import { CommonWard } from './CommonWard';
import { Model } from '../Model';
import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Random } from '@/utils/Random';

export class PatriciateWard extends CommonWard {
  constructor(model: Model, patch: Patch) {
    super(model, patch);
  }

  public createGeometry(): void {
    this.geometry = [];
    
    const block = this.getCityBlock();
    if (block.vertices.length < 3) return;

    // Create large, luxurious buildings
    const buildings = CommonWard.createOrthoBuilding(block, 3, 0.9);
    this.geometry.push(...buildings);

    // Add gardens
    if (Random.bool(0.7)) {
      const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
        .scale(1 / block.vertices.length);
      const gardenSize = Math.min(block.vertices.map(v => Point.distance(v, center))) * 0.3;
      
      const garden = new Polygon([
        center.add(new Point(-gardenSize, -gardenSize)),
        center.add(new Point(gardenSize, -gardenSize)),
        center.add(new Point(gardenSize, gardenSize)),
        center.add(new Point(-gardenSize, gardenSize))
      ]);
      this.geometry.push(garden);
    }
  }

  public static rateLocation(model: Model, patch: Patch): number {
    // Patriciate prefers prestigious locations
    let score = 0;
    
    const distanceToCenter = Point.distance(patch.shape.vertices[0], model.center);
    score += 800 / (distanceToCenter + 1);
    
    if (patch.shape.compactness > 0.8) {
      score += 400;
    }
    
    if (patch.withinWalls) {
      score += 300;
    }
    
    return score;
  }
} 