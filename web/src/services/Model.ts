import { Patch } from '@/types/patch';
import { Polygon } from '@/types/polygon';
import { Street } from '@/types/street';
import { Ward } from './Ward';
import { Castle } from './wards/Castle';
import { Market } from './wards/Market';
import { GateWard } from './wards/GateWard';
import { Farm } from './wards/Farm';
import { AdministrationWard } from './wards/AdministrationWard';
import { Cathedral } from './wards/Cathedral';
import { CommonWard } from './wards/CommonWard';
import { CraftsmenWard } from './wards/CraftsmenWard';
import { MerchantWard } from './wards/MerchantWard';
import { MilitaryWard } from './wards/MilitaryWard';
import { Park } from './wards/Park';
import { PatriciateWard } from './wards/PatriciateWard';
import { Slum } from './wards/Slum';
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
        this.nPatches = nPatches !== -1 ? nPatches : 5; // Reduced default patches

        // Validate input parameters
        if (this.nPatches < 2) this.nPatches = 2;
        if (this.nPatches > 10) this.nPatches = 10;

        this.plazaNeeded = false; // No plaza
        this.citadelNeeded = false; // No citadel
        this.wallsNeeded = Random.bool(0.5); // 50% chance of walls

        this.patches = [];
        this.inner = [];
        this.gates = [];
        this.arteries = [];
        this.streets = [];
        this.roads = [];

        try {
            this.build();
            Model.instance = this;
        } catch (error) {
            console.error('Error building model:', error);
            // Create a minimal fallback model
            this.createFallbackModel();
        }
    }

    private createFallbackModel(): void {
        // Create a simple circular city as fallback
        const center = new Point(0, 0);
        const radius = 100;
        
        // Create a simple circular patch
        const circlePoints = Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * 2 * Math.PI;
            return new Point(
                center.x + radius * Math.cos(angle),
                center.y + radius * Math.sin(angle)
            );
        });
        
        const fallbackPatch = new Patch(new Polygon(circlePoints));
        fallbackPatch.withinCity = true;
        fallbackPatch.withinWalls = true;
        
        this.patches = [fallbackPatch];
        this.inner = [fallbackPatch];
        this.center = center;
        this.cityRadius = radius;
        this.gates = [new Point(radius, 0), new Point(-radius, 0)];
        
        // Create simple streets
        this.streets = [
            new Street([this.gates[0], center]),
            new Street([this.gates[1], center])
        ];
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
        // Improved patch generation based on original Haxe implementation
        const sa = Random.float() * 2 * Math.PI;
        const points: Point[] = [];
        
        // Create points in a more organized pattern for small towns
        for (let i = 0; i < this.nPatches * 8; i++) {
            const a = sa + Math.sqrt(i) * 5;
            const r = (i === 0 ? 0 : 10 + i * (2 + Random.float()));
            points.push(new Point(Math.cos(a) * r, Math.sin(a) * r));
        }

        const delaunayPoints = points.map(p => [p.x, p.y] as [number, number]);
        const voronoiPolygons = generateVoronoi(delaunayPoints, [-1000, -1000, 1000, 1000]);

        // Sort points by distance from center for better ward assignment
        points.sort((p1: Point, p2: Point) => p1.length() - p2.length());

        const regions = voronoiPolygons.map(poly => ({ vertices: poly.vertices.map(v => ({ c: v })) }));

        this.patches = [];
        this.inner = [];

        let count = 0;
        for (const r of regions) {
            const patch = Patch.fromRegion(r);
            this.patches.push(patch);

            if (count === 0) {
                // Center patch - find the vertex closest to origin
                let centerVertex = patch.shape.vertices[0];
                let minDistance = centerVertex.length();
                
                for (const vertex of patch.shape.vertices) {
                    const distance = vertex.length();
                    if (distance < minDistance) {
                        minDistance = distance;
                        centerVertex = vertex;
                    }
                }
                this.center = centerVertex;
                
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

        // Calculate city radius for better scaling
        this.cityRadius = 0;
        for (const patch of this.inner) {
            for (const vertex of patch.shape.vertices) {
                const distance = Point.distance(vertex, this.center);
                this.cityRadius = Math.max(this.cityRadius, distance);
            }
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
        // Initialize topology for pathfinding
        this.topology = new Topology(this);

        // Build one main street
        if (this.gates.length > 1) {
            const gate1 = this.gates[0];
            const gate2 = this.gates[this.gates.length - 1];
            const street = this.topology.buildPath(gate1, gate2, []);
            if (street) {
                this.streets.push(street);
            }
        }

        this.tidyUpRoads();
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

        // Assign a few common wards (houses)
        for (let i = 0; i < Math.min(unassigned.length, 3); i++) {
            const patch = unassigned[i];
            if (patch) {
                patch.ward = new CommonWard(this, patch);
            }
        }
    }

    private buildGeometry(): void {
        // Build geometry for all wards
        for (const patch of this.patches) {
            if (patch.ward) {
                try {
                    patch.ward.createGeometry();
                    
                    // Ensure wards have some geometry even if generation fails
                    if (!patch.ward.geometry || patch.ward.geometry.length === 0) {
                        const block = patch.ward.getCityBlock();
                        if (block && block.vertices.length >= 3) {
                            // Create a simple building as fallback
                            patch.ward.geometry = [block];
                        }
                    }
                } catch (error) {
                    console.warn(`Error creating geometry for ward:`, error);
                    // Create fallback geometry
                    const block = patch.ward.getCityBlock();
                    if (block && block.vertices.length >= 3) {
                        patch.ward.geometry = [block];
                    }
                }
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
