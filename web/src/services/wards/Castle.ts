import { Point } from '@/types/point';
import { Patch } from '@/types/patch';
import { Model } from '@/services/Model';
import { CurtainWall } from '@/services/CurtainWall';
import { Ward } from '@/services/Ward';

// Assuming ArrayExtender is handled as a utility function or direct methods

export class Castle extends Ward {
  public wall: CurtainWall;

  constructor(model: Model, patch: Patch) {
    super(model, patch);

    this.wall = new CurtainWall(
      true,
      model,
      [patch],
      patch.shape.vertices.filter((v: Point) =>
        model.patchByVertex(v).some((p: Patch) => !p.withinCity)
      )
    );
  }

  public createGeometry(): void {
    // Placeholder for now, as it depends on fully ported Polygon methods
    // var block = patch.shape.shrinkEq( Ward.MAIN_STREET * 2 );
    // geometry = Ward.createOrthoBuilding( block, Math.sqrt( block.square ) * 4, 0.6 );
  }

  public getLabel(): string {
    return 'Castle';
  }

  public containsPoint(point: Point): boolean {
    return this.patch.shape.contains(point);
  }
}