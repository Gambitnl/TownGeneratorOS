import { Point } from '../../types/point';
import { GeomUtils } from '../../types/geomUtils';
import { Polygon } from '../../types/polygon';
import { Random } from '../../utils/Random';

import { Cutter } from '../Cutter';
import { Patch } from '../../types/patch';
import { Model } from '../Model';

// Assuming ArrayExtender and PointExtender are handled as utility functions or direct methods
// For now, I'll assume direct methods or that their functionality is not critical for initial compilation.

export class Ward {
  public static MAIN_STREET = 2.0;
  public static REGULAR_STREET = 1.0;
  public static ALLEY = 0.6;

  public model: Model;
  public patch: Patch;

  public geometry: Polygon[];

  constructor(model: Model, patch: Patch) {
    this.model = model;
    this.patch = patch;
    this.geometry = [];
  }

  public createGeometry(): void {
    this.geometry = [];
  }

  public getCityBlock(): Polygon {
    const insetDist: number[] = [];

    const innerPatch = this.model.wall == null || this.patch.withinWalls;
    this.patch.shape.forEdge((v0: Point, v1: Point) => {
      if (this.model.wall != null && this.model.wall.bordersBy(this.patch, v0, v1)) {
        // Not too close to the wall
        insetDist.push(Ward.MAIN_STREET / 2);
      } else {
        let onStreet = innerPatch && (this.model.plaza != null && this.model.plaza.shape.findEdge(v1, v0) !== -1);
        if (!onStreet) {
          for (const street of this.model.arteries) {
            // Assuming 'contains' method exists on Polygon for checking if points are on the street
            // This needs to be properly ported from Haxe's PointExtender or similar logic
            // For now, a placeholder check
            if (this.containsPoint(street, v0) && this.containsPoint(street, v1)) {
              onStreet = true;
              break;
            }
          }
        }
        insetDist.push((onStreet ? Ward.MAIN_STREET : (innerPatch ? Ward.REGULAR_STREET : Ward.ALLEY)) / 2);
      }
    });

    const buffered = this.patch.shape.buffer(insetDist);
    return this.patch.shape.isConvex()
      ? this.patch.shape.shrink(insetDist)
      : buffered === null ? new Polygon() : buffered;
  }

  // Placeholder for containsPoint - needs proper implementation based on Haxe's PointExtender
  private containsPoint(polygon: Polygon, point: Point): boolean {
    // This is a simplified placeholder. Actual implementation would involve checking if the point lies on an edge or within the polygon.
    return polygon.vertices.some(v => v.x === point.x && v.y === point.y);
  }

  public filterOutskirts(): void {
    const populatedEdges: any[] = []; // Using 'any' for now due to mixed types in Haxe

    const addEdge = (v1: Point, v2: Point, factor: number = 1.0) => {
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const distances = new Map<Point, number>();
      const d = this.patch.shape.max((v: Point) => {
        const dist = (v !== v1 && v !== v2 ? GeomUtils.distance2line(v1.x, v1.y, dx, dy, v.x, v.y) : 0) * factor;
        distances.set(v, dist);
        return dist;
      });

      populatedEdges.push({ x: v1.x, y: v1.y, dx: dx, dy: dy, d: distances.get(d) });
    };

    this.patch.shape.forEdge((v1: Point, v2: Point) => {
      let onRoad = false;
      for (const street of this.model.arteries) {
        if (this.containsPoint(street, v1) && this.containsPoint(street, v2)) {
          onRoad = true;
          break;
        }
      }

      if (onRoad) {
        addEdge(v1, v2, 1);
      } else {
        const n = this.model.getNeighbour(this.patch, v1);
        if (n != null) {
          if (n.withinCity) {
            addEdge(v1, v2, this.model.isEnclosed(n) ? 1 : 0.4);
          }
        }
      }
    });

    const density = this.patch.shape.vertices.map((v: Point) => {
      if (this.model.gates.some((gate: Point) => gate.x === v.x && gate.y === v.y)) return 1;
      return this.model.patchByVertex(v).every((p: Patch) => p.withinCity) ? 2 * Random.float() : 0;
    });

    this.geometry = this.geometry.filter((building: Polygon) => {
      let minDist = 1.0;
      for (const edge of populatedEdges) {
        for (const v of building.vertices) {
          const d = GeomUtils.distance2line(edge.x, edge.y, edge.dx, edge.dy, v.x, v.y);
          const dist = d / edge.d;
          if (dist < minDist) {
            minDist = dist;
          }
        }
      }

      const c = building.center;
      const i = this.patch.shape.interpolate(c);
      let p = 0.0;
      for (let j = 0; j < i.length; j++) {
        p += density[j] * i[j];
      }
      minDist /= p;

      return Random.fuzzy(1) > minDist;
    });
  }

  public getLabel(): string {
    return null as any; // Placeholder for now
  }

  public static rateLocation(model: Model, patch: Patch): number {
    return 0;
  }

  public static createAlleys(p: Polygon, minSq: number, gridChaos: number, sizeChaos: number, emptyProb: number = 0.04, split: boolean = true): Polygon[] {
    let v: Point | null = null;
    let length = -1.0;
    p.forEdge((p0, p1) => {
      const len = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2)); // Point.distance equivalent
      if (len > length) {
        length = len;
        v = p0;
      }
    });

    const spread = 0.8 * gridChaos;
    const ratio = (1 - spread) / 2 + Random.float() * spread;

    const angleSpread = Math.PI / 6 * gridChaos * (p.square < minSq * 4 ? 0.0 : 1);
    const b = (Random.float() - 0.5) * angleSpread;

    const halves = Cutter.bisect(p, v!, ratio, b, split ? Ward.ALLEY : 0.0);

    let buildings: Polygon[] = [];
    for (const half of halves) {
      if (half.square < minSq * Math.pow(2, 4 * sizeChaos * (Random.float() - 0.5))) {
        if (!Random.bool(emptyProb)) {
          buildings.push(half);
        }
      } else {
        buildings = buildings.concat(Ward.createAlleys(half, minSq, gridChaos, sizeChaos, emptyProb, half.square > minSq / (Random.float() * Random.float())));
      }
    }

    return buildings;
  }

  public static createOrthoBuilding(poly: Polygon, minBlockSq: number, fill: number): Polygon[] {
    const slice = (poly: Polygon, c1: Point, c2: Point): Polygon[] => {
      const v0 = Ward.findLongestEdge(poly);
      const v1 = poly.next(v0);
      const v = new Point(v1.x - v0.x, v1.y - v0.y); // v1.subtract(v0) equivalent

      const ratio = 0.4 + Random.float() * 0.2;
      const p1 = GeomUtils.interpolate(v0, v1, ratio);

      const c: Point = Math.abs(GeomUtils.scalar(v.x, v.y, c1.x, c1.y)) < Math.abs(GeomUtils.scalar(v.x, v.y, c2.x, c2.y)) ? c1 : c2;

      const halves = poly.cut(p1, new Point(p1.x + c.x, p1.y + c.y)); // p1.add(c) equivalent
      let buildings: Polygon[] = [];
      for (const half of halves) {
        if (half.square < minBlockSq * Math.pow(2, Random.normal() * 2 - 1)) {
          if (Random.bool(fill)) {
            buildings.push(half);
          }
        }
        else {
          buildings = buildings.concat(slice(half, c1, c2));
        }
      }
      return buildings;
    };

    if (poly.square < minBlockSq) {
      return [poly];
    } else {
      const c1 = poly.vector(Ward.findLongestEdge(poly));
      const c2 = new Point(-c1.y, c1.x); // c1.rotate90() equivalent
      while (true) {
        const blocks = slice(poly, c1, c2);
        if (blocks.length > 0)
          return blocks;
      }
    }
  }

  private static findLongestEdge(poly: Polygon): Point {
    // This needs to be properly ported from Haxe's poly.min and poly.vector
    // For now, a placeholder that returns the first vertex
    return poly.vertices[0];
  }
}