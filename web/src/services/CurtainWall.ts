import { Polygon } from './polygon';
import { Patch } from './patch';
import { Model } from './model';

export class CurtainWall {
    public shape: Polygon;
    public segments: boolean[];
    public gates: { x: number, y: number }[];
    public towers: { x: number, y: number }[];

    private real: boolean;
    private patches: Patch[];

    constructor(real: boolean, model: Model, patches: Patch[], reserved: { x: number, y: number }[]) {
        this.real = real;
        this.patches = patches;

        if (patches.length === 1) {
            this.shape = patches[0].shape;
        } else {
            this.shape = Model.findCircumference(patches);

            if (real) {
                const smoothFactor = Math.min(1, 40 / patches.length);
                this.shape.vertices = this.shape.vertices.map((v) => {
                    return reserved.includes(v) ? v : this.shape.smoothVertex(v, smoothFactor);
                });
            }
        }

        this.segments = this.shape.vertices.map(() => true);

        this.buildGates(real, model, reserved);
    }

    private buildGates(real: boolean, model: Model, reserved: { x: number, y: number }[]) {
        this.gates = [];

        let entrances: { x: number, y: number }[] = [];
        if (this.patches.length > 1) {
            entrances = this.shape.vertices.filter((v) => {
                return !reserved.includes(v) && this.patches.filter((p) => p.shape.contains(v)).length > 1;
            });
        } else {
            entrances = this.shape.vertices.filter((v) => !reserved.includes(v));
        }

        if (entrances.length === 0) {
            throw new Error("Bad walled area shape!");
        }

        do {
            const index = Math.floor(Math.random() * entrances.length);
            const gate = entrances[index];
            this.gates.push(gate);

            if (real) {
                const outerWards = model.patchByVertex(gate).filter((w) => !this.patches.includes(w));
                if (outerWards.length === 1) {
                    const outer = outerWards[0];
                    if (outer.shape.vertices.length > 3) {
                        const wall = this.shape.next(gate).subtract(this.shape.prev(gate));
                        const out = { x: wall.y, y: -wall.x };

                        const farthest = outer.shape.vertices.reduce((farthest, v) => {
                            if (this.shape.contains(v) || reserved.includes(v)) {
                                return farthest;
                            }

                            const dir = { x: v.x - gate.x, y: v.y - gate.y };
                            const dot = dir.x * out.x + dir.y * out.y;
                            const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                            const score = dot / len;

                            if (score > farthest.score) {
                                return { v, score };
                            }

                            return farthest;
                        }, { v: null, score: -Infinity });

                        const newPatches = outer.shape.split(gate, farthest.v).map((half) => new Patch(half));
                        model.patches.splice(model.patches.indexOf(outer), 1, ...newPatches);
                    }
                }
            }

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
            throw new Error("Bad walled area shape!");
        }

        if (real) {
            this.gates.forEach((gate) => {
                const smoothed = this.shape.smoothVertex(gate);
                gate.x = smoothed.x;
                gate.y = smoothed.y;
            });
        }
    }

    public buildTowers() {
        this.towers = [];
        if (this.real) {
            const len = this.shape.vertices.length;
            for (let i = 0; i < len; i++) {
                const t = this.shape.vertices[i];
                if (!this.gates.includes(t) && (this.segments[(i + len - 1) % len] || this.segments[i])) {
                    this.towers.push(t);
                }
            }
        }
    }

    public getRadius(): number {
        let radius = 0;
        for (const v of this.shape.vertices) {
            radius = Math.max(radius, Math.sqrt(v.x * v.x + v.y * v.y));
        }
        return radius;
    }

    public bordersBy(p: Patch, v0: { x: number, y: number }, v1: { x: number, y: number }): boolean {
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
