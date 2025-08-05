import { Ward } from './Ward';
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

    // Create barracks and training grounds
    const buildings = Ward.createOrthoBuilding(block, 4, 0.7);
    this.geometry.push(...buildings);

    // Add training ground
    if (Random.bool(0.6)) {
      const center = block.vertices.reduce((sum, v) => sum.add(v), new Point(0, 0))
        .scale(1 / block.vertices.length);
      const groundSize = Math.min(block.vertices.map(v => Point.distance(v, center))) * 0.4;
      
      const trainingGround = new Polygon([
        center.add(new Point(-groundSize, -groundSize)),
        center.add(new Point(groundSize, -groundSize)),
        center.add(new Point(groundSize, groundSize)),
        center.add(new Point(-groundSize, groundSize))
      ]);
      this.geometry.push(trainingGround);
    }
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