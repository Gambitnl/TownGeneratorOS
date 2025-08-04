import { Point } from '../geom/Point';
import { Polygon } from '../geom/Polygon';
import { Random } from '../utils/Random';
import { Model } from './Model';
import { Patch } from './Patch';
import { arrayContains, arrayCount } from '../utils/ArrayUtils'; // Import the new utility functions

export class CurtainWall {
  public shape: Polygon;
  public segments: boolean[];
  public gates: Point[];
  public towers: Point[];

  private real: boolean;
  private patches: Patch[];

  constructor(real: boolean, model: Model, patches: Patch[], reserved: Point[]) {
    this.real = true; // Haxe code sets this to true regardless of input 'real'
    this.patches = patches;

    if (patches.length === 1) {
      this.shape = patches[0].shape;
    } else {
      this.shape = Model.findCircumference(patches);

      if (this.real) {
        const smoothFactor = Math.min(1, 40 / patches.length);
        this.shape.set(
          this.shape.vertices.map((v: Point) =>
            arrayContains(reserved, v) ? v : this.shape.smoothVertex(v, smoothFactor)
          )
        );
      }
    }

    this.segments = this.shape.vertices.map((v) => true);

    this.gates = []; // Initialize gates before calling buildGates
    this.buildGates(this.real, model, reserved);
  }

  private buildGates(real: boolean, model: Model, reserved: Point[]): void {
    this.gates = [];

    const entrances: Point[] =
      this.patches.length > 1
        ? this.shape.filter(
            (v) =>
              !arrayContains(reserved, v) &&
              arrayCount(this.patches, (p: Patch) => p.shape.contains(v)) > 1
          )
        : this.shape.filter((v) => !arrayContains(reserved, v));

    if (entrances.length === 0) {
      throw new Error('Bad walled area shape!');
    }

    do {
      const index = Random.int(0, entrances.length);
      const gate = entrances[index];
      this.gates.push(gate);

      if (real) {
        const outerWards = model.patchByVertex(gate).filter((w: Patch) => !arrayContains(this.patches, w));
        if (outerWards.length === 1) {
          const outer: Patch = outerWards[0];
          if (outer.shape.length > 3) {
            const wall = this.shape.next(gate).subtract(this.shape.prev(gate));
            const out = new Point(wall.y, -wall.x);

            const farthest = outer.shape.max((v: Point) => {
              if (this.shape.contains(v) || arrayContains(reserved, v)) {
                return Number.NEGATIVE_INFINITY;
              } else {
                const dir = v.subtract(gate);
                return dir.dot(out) / dir.length;
              }
            });

            const newPatches = outer.shape.split(gate, farthest).map((half) => new Patch(half));
            model.replace(outer, newPatches);
          }
        }
      }

      // Removing neighbouring entrances to ensure
      // that no gates are too close
      if (index === 0) {
        entrances.splice(0, 2);
        entrances.pop();
      } else if (index === entrances.length - 1) {
        entrances.splice(index - 1, 2);
        entrances.shift();
      } else {
        entrances.splice(index - 1, 3);
      }
    } while (entrances.length >= 3);

    if (this.gates.length === 0) {
      throw new Error('Bad walled area shape!');
    }

    // Smooth further sections of the wall with gates
    if (real) {
      for (const gate of this.gates) {
        gate.set(this.shape.smoothVertex(gate));
      }
    }
  }

  public buildTowers(): void {
    this.towers = [];
    if (this.real) {
      const len = this.shape.length;
      for (let i = 0; i < len; i++) {
        const t = this.shape.vertices[i];
        if (!arrayContains(this.gates, t) && (this.segments[(i + len - 1) % len] || this.segments[i])) {
          this.towers.push(t);
        }
      }
    }
  }

  public getRadius(): number {
    let radius = 0.0;
    for (const v of this.shape.vertices) {
      radius = Math.max(radius, v.length);
    }
    return radius;
  }

  public bordersBy(p: Patch, v0: Point, v1: Point): boolean {
    const index = arrayContains(this.patches, p)
      ? this.shape.findEdge(v0, v1)
      : this.shape.findEdge(v1, v0);
    if (index !== -1 && this.segments[index]) {
      return true;
    }

    return false;
  }

  public borders(p: Patch): boolean {
    const withinWalls = arrayContains(this.patches, p);
    const length = this.shape.length;

    for (let i = 0; i < length; i++) {
      if (this.segments[i]) {
        const v0 = this.shape.vertices[i];
        const v1 = this.shape.vertices[(i + 1) % length];
        const index = withinWalls ? p.shape.findEdge(v0, v1) : p.shape.findEdge(v1, v0);
        if (index !== -1) {
          return true;
        }
      }
    }
    return false;
  }
}