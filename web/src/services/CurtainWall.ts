import { Polygon } from '@/types/polygon';
import { Patch } from '@/types/patch';
import { Model } from './Model';
import { Point } from '@/types/point';

export class CurtainWall {
    public shape: Polygon;
    public segments: boolean[];
    public gates: Point[] = [];
    public towers: Point[] = [];

    private real: boolean;
    private patches: Patch[];

    constructor(real: boolean, model: Model, patches: Patch[], reserved: Point[]) {
        this.real = real;
        this.patches = patches;

        if (patches.length === 1) {
            this.shape = patches[0].shape;
        } else {
            this.shape = Model.findCircumference(patches);

            if (real) {
                const smoothFactor = Math.min(1, 40 / patches.length);
                this.shape.vertices = this.shape.vertices.map((v: Point) => {
                    return reserved.some(r => r.x === v.x && r.y === v.y) ? v : this.shape.smoothVertex(v, smoothFactor);
                });
            }
        }

        this.segments = this.shape.vertices.map(() => true);

        this.buildGates(real, model, reserved);
    }

    private buildGates(real: boolean, model: Model, reserved: Point[]) {
        this.gates = [];

        let entrances: Point[] = [];
        if (this.patches.length > 1) {
            entrances = this.shape.vertices.filter((v: Point) => {
                return (!reserved.some(r => r.x === v.x && r.y === v.y) && model.patchByVertex(v).filter((p: Patch) => this.patches.includes(p)).length > 1);
            });
            // Fallback: if no multi-patch junctions are available on the outer shape,
            // allow any non-reserved vertex to serve as a gate candidate.
            if (entrances.length === 0) {
                entrances = this.shape.vertices.filter((v: Point) => !reserved.some(r => r.x === v.x && r.y === v.y));
            }
        } else {
            entrances = this.shape.vertices.filter((v: Point) => !reserved.some(r => r.x === v.x && r.y === v.y));
        }

        // Absolute fallback to ensure at least one gate candidate
        if (entrances.length === 0 && this.shape.vertices.length > 0) {
            entrances = [this.shape.vertices[0]];
        }

        do {
            const index = Math.floor(Math.random() * entrances.length);
            const gate = entrances[index];
            this.gates.push(gate);

            if (real) {
                const outerWards = model.patchByVertex(gate).filter((w: Patch) => !this.patches.includes(w));
                if (outerWards.length === 1) {
                    const outer: Patch = outerWards[0];
                    if (outer.shape.vertices.length > 3) {
                        const wallVector = this.shape.next(gate).subtract(this.shape.prev(gate));
                        const out = new Point(wallVector.y, -wallVector.x);

                        const farthest = outer.shape.vertices.reduce((farthestPoint: Point, v: Point) => {
                            if (this.shape.contains(v) || reserved.some(r => r.x === v.x && r.y === v.y)) {
                                return farthestPoint;
                            }

                            const dir = v.subtract(gate);
                            const score = dir.dot(out) / dir.length();

                            if (score > farthestPoint.dot(out) / farthestPoint.length()) {
                                return v;
                            }

                            return farthestPoint;
                        }, outer.shape.vertices[0]); // Initial farthestPoint

                        const newPatches = outer.shape.split(gate, farthest).map((half: Polygon) => new Patch(half));
                        model.patches.splice(model.patches.indexOf(outer), 1, ...newPatches);
                    }
                }
            }

            if (index === 0) {
                entrances.splice(0, 2);
                if (entrances.length > 0) entrances.pop();
            } else if (index === entrances.length - 1) {
                entrances.splice(index - 1, 2);
                if (entrances.length > 0) entrances.shift();
            } else {
                entrances.splice(index - 1, 3);
            }
        } while (entrances.length >= 3);

        if (this.gates.length === 0 && this.shape.vertices.length > 0) {
            // Ensure at least one gate exists to keep the model viable
            this.gates = [this.shape.vertices[0]];
        }

        if (real) {
            this.gates.forEach((gate: Point) => {
                const smoothed = this.shape.smoothVertex(gate);
                gate.set(smoothed);
            });
        }
    }

    public buildTowers() {
        this.towers = [];
        if (this.real) {
            const len = this.shape.vertices.length;
            for (let i = 0; i < len; i++) {
                const t = this.shape.vertices[i];
                if (!this.gates.some(g => g.x === t.x && g.y === t.y) && (this.segments[(i + len - 1) % len] || this.segments[i])) {
                    this.towers.push(t);
                }
            }
        }
    }

    public getRadius(): number {
        let radius = 0;
        for (const v of this.shape.vertices) {
            radius = Math.max(radius, v.length());
        }
        return radius;
    }

    public bordersBy(p: Patch, v0: Point, v1: Point): boolean {
        const index = this.patches.includes(p) ?
            this.shape.findEdge(v0, v1) :
            this.shape.findEdge(v1, v0);
        if (index !== -1 && this.segments[index]) {
            return true;
        }

        return false;
    }

    public borders(p: Patch): boolean {
        const withinWalls = this.patches.includes(p);
        const length = this.shape.vertices.length;

        for (let i = 0; i < length; i++) {
            if (this.segments[i]) {
                const v0 = this.shape.vertices[i];
                const v1 = this.shape.vertices[(i + 1) % length];
                const index = withinWalls ?
                    p.shape.findEdge(v0, v1) :
                    p.shape.findEdge(v1, v0);
                if (index !== -1) {
                    return true;
                }
            }
        }

        return false;
    }
}
