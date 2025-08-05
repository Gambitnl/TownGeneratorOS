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
        this.nPatches = nPatches !== -1 ? nPatches : 15;

        // Validate input parameters
        if (this.nPatches < 5) this.nPatches = 5;
        if (this.nPatches > 50) this.nPatches = 50;

        this.plazaNeeded = Random.bool();
        this.citadelNeeded = Random.bool();
        this.wallsNeeded = Random.bool();

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
        
        const smoothStreet = (street: Street): void => {
            if (street.vertices.length < 3) return;

            const smoothed = [street.vertices[0]];
            for (let i = 1; i < street.vertices.length - 1; i++) {
                const prev = street.vertices[i - 1];
                const curr = street.vertices[i];
                const next = street.vertices[i + 1];

                // Simple smoothing: average of three points
                const smoothedPoint = new Point(
                    (prev.x + curr.x + next.x) / 3,
                    (prev.y + curr.y + next.y) / 3
                );
                smoothed.push(smoothedPoint);
            }
            smoothed.push(street.vertices[street.vertices.length - 1]);
            street.vertices = smoothed;
        };

        // Build main streets from gates to center/plaza
        for (const gate of this.gates) {
            const target = this.plaza ? this.plaza.center : this.center;
            
            // Try to build a proper street using topology
            let street: Street | null = null;
            
            if (this.topology) {
                street = this.topology.buildPath(gate, target, []);
            }
            
            if (street && street.vertices.length > 1) {
                this.streets.push(street);
            } else {
                // Fallback: create a direct street with some randomization
                console.warn(`Unable to build street from gate to ${this.plaza ? 'plaza' : 'center'}, creating fallback path...`);
                
                // Create a slightly randomized direct path instead of a straight line
                const midPoint = new Point(
                    (gate.x + target.x) / 2 + (Random.float() - 0.5) * 20,
                    (gate.y + target.y) / 2 + (Random.float() - 0.5) * 20
                );
                
                const fallbackStreet = new Street([gate, midPoint, target]);
                this.streets.push(fallbackStreet);
            }
        }

        // Build secondary streets between gates
        for (let i = 0; i < this.gates.length; i++) {
            for (let j = i + 1; j < this.gates.length; j++) {
                const gate1 = this.gates[i];
                const gate2 = this.gates[j];
                
                // Only connect gates that are reasonably close to each other
                const distance = Point.distance(gate1, gate2);
                if (distance > this.cityRadius * 0.8) continue;
                
                let street: Street | null = null;
                
                if (this.topology) {
                    street = this.topology.buildPath(gate1, gate2, []);
                }
                
                if (street && street.vertices.length > 1) {
                    this.streets.push(street);
                }
            }
        }

        // Build roads (smaller streets) within wards
        for (const patch of this.inner) {
            if (patch.ward && Random.bool(0.3)) { // 30% chance for each ward to have internal roads
                const wardCenter = patch.center;
                const wardVertices = patch.shape.vertices;
                
                // Create roads to some vertices of the ward
                for (let i = 0; i < wardVertices.length; i += 2) { // Skip every other vertex to avoid too many roads
                    const vertex = wardVertices[i];
                    const distance = Point.distance(wardCenter, vertex);
                    
                    if (distance > 10) { // Only create roads to distant vertices
                        const road = new Street([wardCenter, vertex]);
                        this.roads.push(road);
                    }
                }
            }
        }

        this.tidyUpRoads();

        // Smooth all streets and roads
        for (const artery of this.arteries) {
            smoothStreet(artery);
        }
        for (const street of this.streets) {
            smoothStreet(street);
        }
        for (const road of this.roads) {
            smoothStreet(road);
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
        
        // Assign plaza ward first
        if (this.plaza) {
            this.plaza.ward = new Market(this, this.plaza);
            unassigned.splice(unassigned.indexOf(this.plaza), 1);
        }

        // Assign gate wards for inner city gates
        for (const gate of this.border!.gates) {
            for (const patch of this.patchByVertex(gate)) {
                if (patch.withinCity && patch.ward === null && Random.bool(this.wall === null ? 0.2 : 0.5)) {
                    patch.ward = new GateWard(this, patch);
                    const index = unassigned.indexOf(patch);
                    if (index !== -1) {
                        unassigned.splice(index, 1);
                    }
                }
            }
        }

        // Define ward types with better distribution for small towns
        const wardTypes = [
            CraftsmenWard, CraftsmenWard, MerchantWard, CraftsmenWard, CraftsmenWard, Cathedral,
            CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard,
            CraftsmenWard, CraftsmenWard, CraftsmenWard, AdministrationWard, CraftsmenWard,
            Slum, CraftsmenWard, Slum, PatriciateWard, Market,
            Slum, CraftsmenWard, CraftsmenWard, CraftsmenWard, Slum,
            CraftsmenWard, CraftsmenWard, CraftsmenWard, MilitaryWard, Slum,
            CraftsmenWard, Park, PatriciateWard, Market, MerchantWard
        ];

        // Shuffle ward types slightly for variety
        for (let i = 0; i < Math.floor(wardTypes.length / 10); i++) {
            const index = Random.int(0, wardTypes.length - 1);
            const tmp = wardTypes[index];
            wardTypes[index] = wardTypes[index + 1];
            wardTypes[index + 1] = tmp;
        }

        // Assign remaining wards based on rating
        while (unassigned.length > 0) {
            let bestPatch: Patch | null = null;
            const wardClass = wardTypes.length > 0 ? wardTypes.shift()! : Slum;
            
            // Find the best patch for this ward type
            if (wardClass.rateLocation) {
                let bestScore = -Infinity;
                for (const patch of unassigned) {
                    if (patch.ward === null) {
                        const score = wardClass.rateLocation(this, patch);
                        if (score > bestScore) {
                            bestScore = score;
                            bestPatch = patch;
                        }
                    }
                }
            } else {
                // Random assignment if no rating function
                const availablePatches = unassigned.filter(p => p.ward === null);
                if (availablePatches.length > 0) {
                    bestPatch = availablePatches[Random.int(0, availablePatches.length - 1)];
                }
            }

            if (bestPatch) {
                bestPatch.ward = new wardClass(this, bestPatch);
                const index = unassigned.indexOf(bestPatch);
                if (index !== -1) {
                    unassigned.splice(index, 1);
                }
            } else {
                break; // No more patches available
            }
        }

        // Assign outskirts wards if walls exist
        if (this.wall) {
            for (const gate of this.wall.gates) {
                if (!Random.bool(1 / (this.nPatches - 5))) {
                    for (const patch of this.patchByVertex(gate)) {
                        if (patch.ward === null) {
                            patch.withinCity = true;
                            patch.ward = new GateWard(this, patch);
                        }
                    }
                }
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
