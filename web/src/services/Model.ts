import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Street } from '@/types/street';
import { Ward, Castle, Market, GateWard, Farm, AdministrationWard, Cathedral, CommonWard, CraftsmenWard, MerchantWard, MilitaryWard, Park, PatriciateWard, Slum } from './Ward';
import { CurtainWall } from './CurtainWall';
import { Random } from '@/utils/Random';
import { generateVoronoi } from './voronoi';
import { Point } from '@/types/point';
import { Topology } from './Topology';
import { Segment } from '@/types/segment';

export class Model {
    public static instance: Model;

    private nPatches: number;
    private plazaNeeded: boolean;
    private citadelNeeded: boolean;
    private wallsNeeded: boolean;

    public topology: Topology | null = null;

    public patches: Patch[];
    public waterbody: Patch[] = []; // Not implemented in Haxe, but good to have
    public inner: Patch[];
    public citadel: Patch | null = null;
    public plaza: Patch | null = null;
    public center: Point = new Point();

    public border: CurtainWall | null = null;
    public wall: CurtainWall | null = null;

    public cityRadius: number = 0;

    public gates: Point[];

    public arteries: Street[];
    public streets: Street[];
    public roads: Street[];

    constructor(nPatches: number = -1, seed: number = -1) {
        if (seed > 0) Random.reset(seed);
        this.nPatches = nPatches !== -1 ? nPatches : 15;

        this.plazaNeeded = Random.bool();
        this.citadelNeeded = Random.bool();
        this.wallsNeeded = Random.bool();

        this.patches = [];
        this.inner = [];
        this.gates = [];
        this.arteries = [];
        this.streets = [];
        this.roads = [];

        this.build();
        Model.instance = this;
    }

    private build(): void {
        this.streets = [];
        this.roads = [];

        this.buildPatches();
        this.optimizeJunctions();
        this.buildWalls();
        this.buildStreets();
        this.createWards();
        this.buildGeometry();
    }

    private buildPatches(): void {
        let attempts = 0;
        while (attempts < 10) {
            const sa = Random.float() * 2 * Math.PI;
            const points: Point[] = [];
            for (let i = 0; i < this.nPatches * 8; i++) {
                const a = sa + Math.sqrt(i) * 5;
                const r = (i === 0 ? 0 : 10 + i * (2 + Random.float()));
                points.push(new Point(Math.cos(a) * r, Math.sin(a) * r));
            }

            const delaunayPoints = points.map(p => [p.x, p.y] as [number, number]);
            const voronoiPolygons = generateVoronoi(delaunayPoints, [-1000, -1000, 1000, 1000]);

            const regions = voronoiPolygons.map(poly => ({ vertices: poly.vertices.map(v => ({ c: v })) }));

            points.sort((p1: Point, p2: Point) => p1.length() - p2.length());

            this.patches = [];
            this.inner = [];

            let count = 0;
            for (const r of regions) {
                const patch = Patch.fromRegion(r as any);
                this.patches.push(patch);

                if (count === 0) {
                    this.center = patch.shape.vertices.reduce((min: Point, v: Point) => {
                        return v.length() < min.length() ? v : min;
                    }, patch.shape.vertices[0]);
                    if (this.plazaNeeded) {
                        this.plaza = patch;
                    }
                } else if (count === this.nPatches && this.citadelNeeded) {
                    this.citadel = patch;
                    this.citadel.withinCity = true;
                }

                if (count < this.nPatches) {
                    patch.withinCity = true;
                    patch.withinWalls = this.wallsNeeded;
                    this.inner.push(patch);
                }

                count++;
            }

            if (this.citadel && this.citadel.shape.compactness >= 0.75) {
                break;
            }

            attempts++;
        }
    }

    private optimizeJunctions(): void {
        const patchesToOptimize = this.citadel === null ? this.inner : [...this.inner, this.citadel];

        const wards2clean: Patch[] = [];
        for (const w of patchesToOptimize) {
            let index = 0;
            while (index < w.shape.vertices.length) {
                const v0: Point = w.shape.vertices[index];
                const v1: Point = w.shape.vertices[(index + 1) % w.shape.vertices.length];

                if (v0 !== v1 && Point.distance(v0, v1) < 8) {
                    for (const w1 of this.patchByVertex(v1)) {
                        if (w1 !== w) {
                            const v1IndexInW1 = w1.shape.vertices.findIndex((v: Point) => v.x === v1.x && v.y === v1.y);
                            if (v1IndexInW1 !== -1) {
                                w1.shape.vertices[v1IndexInW1] = v0;
                                wards2clean.push(w1);
                            }
                        }
                    }

                    v0.addEq(v1);
                    v0.scaleEq(0.5);

                    w.shape.vertices.splice(w.shape.vertices.indexOf(v1), 1);
                }
                index++;
            }
        }

        for (const w of wards2clean) {
            for (let i = 0; i < w.shape.vertices.length; i++) {
                const v: Point = w.shape.vertices[i];
                let dupIdx;
                while ((dupIdx = w.shape.vertices.findIndex((val: Point, idx: number) => idx > i && val.x === v.x && val.y === v.y)) !== -1) {
                    w.shape.vertices.splice(dupIdx, 1);
                }
            }
        }
    }

    private buildWalls(): void {
        const reserved: Point[] = this.citadel ? this.citadel.shape.vertices.map((v: Point) => new Point(v.x, v.y)) : [];

        this.border = new CurtainWall(this.wallsNeeded, this, this.inner, reserved);
        if (this.wallsNeeded) {
            this.wall = this.border;
            this.wall.buildTowers();
        }

        const radius = this.border.getRadius();
        this.patches = this.patches.filter((p: Patch) => p.shape.distance(this.center) < radius * 3);

        this.gates = this.border.gates;

        if (this.citadel) {
            const castle = new Castle(this, this.citadel);
            castle.wall.buildTowers();
            this.citadel.ward = castle;

            if (this.citadel.shape.compactness < 0.75) {
                throw new Error("Bad citadel shape!");
            }

            this.gates = this.gates.concat(castle.wall.gates);
        }
    }

    public static findCircumference(patches: Patch[]): Polygon {
        if (patches.length === 0) {
            return new Polygon();
        } else if (patches.length === 1) {
            return new Polygon(patches[0].shape.vertices);
        }

        const A: Point[] = [];
        const B: Point[] = [];

        for (const w1 of patches) {
            w1.shape.forEdge((a: Point, b: Point) => {
                let outerEdge = true;
                for (const w2 of patches) {
                    if (w2.shape.findEdge(b, a) !== -1) {
                        outerEdge = false;
                        break;
                    }
                }
                if (outerEdge) {
                    A.push(a);
                    B.push(b);
                }
            });
        }

        const result = new Polygon();
        let index = 0;
        if (A.length > 0) {
            do {
                result.vertices.push(A[index]);
                const nextIndex = A.findIndex((p: Point) => p.x === B[index].x && p.y === B[index].y);
                if (nextIndex === -1) {
                    break;
                }
                index = nextIndex;
            } while (index !== 0 && result.vertices.length < A.length + 1);
        }

        return result;
    }

    public patchByVertex(v: Point): Patch[] {
        return this.patches.filter(
            (patch: Patch) => patch.shape.contains(v)
        );
    }

    private buildStreets(): void {
        const smoothStreet = (street: Street): void => {
            const smoothed = street.smoothVertexEq(3);
            for (let i = 1; i < street.vertices.length - 1; i++) {
                street.vertices[i].set(smoothed.vertices[i]);
            }
        };

        this.topology = new Topology(this);

        for (const gate of this.gates) {
            const end: Point = this.plaza ?
                this.plaza.shape.vertices.reduce((min: Point, v: Point) => {
                    return Point.distance(v, gate) < Point.distance(min, gate) ? v : min;
                }, this.plaza.shape.vertices[0]) :
                this.center;

            const street = this.topology.buildPath(gate, end, this.topology.outer);
            if (street) {
                this.streets.push(street);

                if (this.border && this.border.gates.some((g: Point) => g.x === gate.x && g.y === gate.y)) {
                    const dir = gate.norm(1000);
                    let start: Point | null = null;
                    let minDist = Infinity;
                    for (const p of this.topology.node2pt.values()) {
                        const d = Point.distance(p, dir);
                        if (d < minDist) {
                            minDist = d;
                            start = p;
                        }
                    }

                    if (start) {
                        const road = this.topology.buildPath(start, gate, this.topology.inner);
                        if (road) {
                            this.roads.push(road);
                        }
                    }
                }
            } else {
                throw new Error("Unable to build a street!");
            }
        }

        this.tidyUpRoads();

        for (const a of this.arteries) {
            smoothStreet(a);
        }
    }

    private tidyUpRoads(): void {
        const segments: Segment[] = [];

        const cut2segments = (street: Street) => {
            let v0: Point = street.vertices[0];
            let v1: Point = street.vertices[0];
            for (let i = 1; i < street.vertices.length; i++) {
                v0 = v1;
                v1 = street.vertices[i];

                if (this.plaza && this.plaza.shape.contains(v0) && this.plaza.shape.contains(v1)) {
                    continue;
                }

                let exists = false;
                for (const seg of segments) {
                    if (seg.start.x === v0.x && seg.start.y === v0.y && seg.end.x === v1.x && seg.end.y === v1.y) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    segments.push(new Segment(v0, v1));
                }
            }
        };

        for (const street of this.streets) {
            cut2segments(street);
        }
        for (const road of this.roads) {
            cut2segments(road);
        }

        this.arteries = [];
        while (segments.length > 0) {
            const seg = segments.pop()!;

            let attached = false;
            for (const a of this.arteries) {
                if (a.vertices[0].x === seg.end.x && a.vertices[0].y === seg.end.y) {
                    a.vertices.unshift(seg.start);
                    attached = true;
                    break;
                } else if (a.last()!.x === seg.start.x && a.last()!.y === seg.start.y) {
                    a.vertices.push(seg.end);
                    attached = true;
                    break;
                }
            }

            if (!attached) {
                this.arteries.push(new Street([seg.start, seg.end]));
            }
        }
    }

    private createWards(): void {
        const unassigned = [...this.inner];
        if (this.plaza) {
            this.plaza.ward = new Market(this, this.plaza);
            unassigned.splice(unassigned.indexOf(this.plaza), 1);
        }

        for (const gate of this.border!.gates) {
            for (const patch of this.patchByVertex(gate)) {
                if (patch.withinCity && patch.ward === null && Random.bool(this.wall === null ? 0.2 : 0.5)) {
                    patch.ward = new GateWard(this, patch);
                    unassigned.splice(unassigned.indexOf(patch), 1);
                }
            }
        }

        const WARDS_LIST = [
            CraftsmenWard, CraftsmenWard, MerchantWard, CraftsmenWard, CraftsmenWard, Cathedral,
            CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard,
            CraftsmenWard, CraftsmenWard, CraftsmenWard, AdministrationWard, CraftsmenWard,
            Slum, CraftsmenWard, Slum, PatriciateWard, Market,
            Slum, CraftsmenWard, CraftsmenWard, CraftsmenWard, Slum,
            CraftsmenWard, CraftsmenWard, CraftsmenWard, MilitaryWard, Slum,
            CraftsmenWard, Park, PatriciateWard, Market, MerchantWard
        ];

        const wards = [...WARDS_LIST];
        for (let i = wards.length - 1; i > 0; i--) {
            const j = Math.floor(Random.float() * (i + 1));
            [wards[i], wards[j]] = [wards[j], wards[i]];
        }

        while (unassigned.length > 0) {
            let bestPatch: Patch | null = null;

            const wardClass = wards.length > 0 ? wards.shift()! : Slum;
            const rateFunc = (wardClass as any).rateLocation;

            if (rateFunc === undefined) {
                do {
                    bestPatch = unassigned[Random.int(0, unassigned.length - 1)];
                } while (bestPatch.ward !== null);
            } else {
                bestPatch = unassigned.reduce((minPatch: Patch | null, currentPatch: Patch) => {
                    if (currentPatch.ward !== null) return minPatch;
                    const currentRate = rateFunc(this, currentPatch);
                    const minRate = minPatch ? rateFunc(this, minPatch) : Infinity;
                    return currentRate < minRate ? currentPatch : minPatch;
                }, null as Patch | null)!;
            }

            if (bestPatch) {
                bestPatch.ward = new wardClass(this, bestPatch);
                unassigned.splice(unassigned.indexOf(bestPatch), 1);
            } else {
                break;
            }
        }

        this.cityRadius = 0;
        for (const patch of this.patches) {
            if (patch.withinCity) {
                for (const v of patch.shape.vertices) {
                    this.cityRadius = Math.max(this.cityRadius, v.length());
                }
            } else if (patch.ward === null) {
                patch.ward = Random.bool(0.2) && patch.shape.compactness >= 0.7 ?
                    new Farm(this, patch) :
                    new Ward(this, patch);
            }
        }
    }

    private buildGeometry(): void {
        for (const patch of this.patches) {
            if (patch.ward) {
                patch.ward.createGeometry();
            }
        }
    }

    public getNeighbour(patch: Patch, v: Point): Patch | null {
        const next = patch.shape.next(v);
        for (const p of this.patches) {
            if (p.shape.findEdge(next, v) !== -1) {
                return p;
            }
        }
        return null;
    }

    public getNeighbours(patch: Patch): Patch[] {
        return this.patches.filter((p: Patch) => p !== patch && p.shape.borders(patch.shape));
    }

    public isEnclosed(patch: Patch): boolean {
        return patch.withinCity && (patch.withinWalls || this.getNeighbours(patch).every((p: Patch) => p.withinCity));
    }
}
