import { Polygon } from '@/types/polygon';
import { Patch } from '@/types/patch';
import { Model } from '@/services/Model';
import { Point } from '@/types/point';
import { Cutter } from '@/services/Cutter';
import { GeomUtils } from '@/types/geomUtils';
import { Random } from '@/utils/Random';
import { CurtainWall } from '@/services/CurtainWall';

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

    public createGeometry() {
        this.geometry = [];
    }

    public getCityBlock(): Polygon {
        const insetDist: number[] = [];

        const innerPatch = this.model.wall === null || this.patch.withinWalls;
        this.patch.shape.forEdge((v0: Point, v1: Point) => {
            if (this.model.wall !== null && this.model.wall.bordersBy(this.patch, v0, v1)) {
                insetDist.push(Ward.MAIN_STREET / 2);
            } else {
                let onStreet = innerPatch && (this.model.plaza !== null && this.model.plaza.shape.findEdge(v1, v0) !== -1);
                if (!onStreet) {
                    for (const street of this.model.arteries) {
                        if (street.contains(v0) && street.contains(v1)) {
                            onStreet = true;
                            break;
                        }
                    }
                }
                insetDist.push((onStreet ? Ward.MAIN_STREET : (innerPatch ? Ward.REGULAR_STREET : Ward.ALLEY)) / 2);
            }
        });

        const result = this.patch.shape.isConvex() ?
            this.patch.shape.shrink(insetDist) :
            this.patch.shape.buffer(insetDist);
        
        if (result === null) {
            return new Polygon([]);
        }
        return result;
    }

    public filterOutskirts() {
        const populatedEdges: { x: number, y: number, dx: number, dy: number, d: number }[] = [];

        const addEdge = (v1: Point, v2: Point, factor = 1.0) => {
            const dx = v2.x - v1.x;
            const dy = v2.y - v1.y;
            const distances = new Map<Point, number>();
            const d = this.patch.shape.vertices.reduce((maxD, v) => {
                if (v.x !== v1.x && v.y !== v1.y && v.x !== v2.x && v.y !== v2.y) {
                    const dist = GeomUtils.distance2line(v1.x, v1.y, dx, dy, v.x, v.y);
                    distances.set(v, dist);
                    return Math.max(maxD, dist);
                }
                return maxD;
            }, 0) * factor;

            populatedEdges.push({ x: v1.x, y: v1.y, dx: dx, dy: dy, d: d });
        };

        this.patch.shape.forEdge((v1: Point, v2: Point) => {
            let onRoad = false;
            for (const street of this.model.arteries) {
                if (street.contains(v1) && street.contains(v2)) {
                    onRoad = true;
                    break;
                }
            }

            if (onRoad) {
                addEdge(v1, v2, 1);
            } else {
                const n = this.model.getNeighbour(this.patch, v1);
                if (n !== null) {
                    if (n.withinCity) {
                        addEdge(v1, v2, this.model.isEnclosed(n) ? 1 : 0.4);
                    }
                }
            }
        });

        const density = this.patch.shape.vertices.map((v: Point) => {
            if (this.model.gates.some((g: Point) => g.x === v.x && g.y === v.y)) return 1;
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
            const i = building.interpolate(c);
            let p = 0.0;
            for (let j = 0; j < i.length; j++) {
                p += density[j] * i[j];
            }
            minDist /= p;

            return Random.fuzzy(1) > minDist;
        });
    }

    public getLabel(): string | null { return null; }

    public static rateLocation(model: Model, patch: Patch): number { return 0; }

        public static createAlleys(p: Polygon, minSq: number, gridChaos: number, sizeChaos: number, emptyProb: number = 0.04, split: boolean = true): Polygon[] {
        let v: Point | null = null;
        let length = -1.0;
        p.forEdge((p0: Point, p1: Point) => {
            const len = Point.distance(p0, p1);
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

    private static findLongestEdge(poly: Polygon): Point {
        return poly.vertices.reduce((longest: Point, v: Point) => {
            const currentLength = poly.vector(v).length();
            return currentLength > poly.vector(longest).length() ? v : longest;
        }, poly.vertices[0]);
    }

    public static createOrthoBuilding(poly: Polygon, minBlockSq: number, fill: number): Polygon[] {
        const slice = (poly: Polygon, c1: Point, c2: Point): Polygon[] => {
            const v0 = Ward.findLongestEdge(poly);
            const v1 = poly.next(v0);
            const v = v1.subtract(v0);

            const ratio = 0.4 + Random.float() * 0.2;
            const p1 = GeomUtils.interpolate(v0, v1, ratio);

            const c: Point = GeomUtils.scalar(v.x, v.y, c1.x, c1.y) < GeomUtils.scalar(v.x, v.y, c2.x, c2.y) ? c1 : c2;

            const halves = poly.cut(p1, p1.add(c));
            let buildings: Polygon[] = [];
            for (const half of halves) {
                if (half.square < minBlockSq * Math.pow(2, Random.normal() * 2 - 1)) {
                    if (Random.bool(fill)) {
                        buildings.push(half);
                    }
                } else {
                    buildings = buildings.concat(slice(half, c1, c2));
                }
            }
            return buildings;
        };

        if (poly.square < minBlockSq) {
            return [poly];
        } else {
            const c1 = poly.vector(Ward.findLongestEdge(poly));
            const c2 = c1.rotate90();
            while (true) {
                const blocks = slice(poly, c1, c2);
                if (blocks.length > 0) {
                    return blocks;
                }
            }
        }
    }
}

export class AdministrationWard extends Ward {}

export class Castle extends Ward {
    public wall: CurtainWall;

    constructor(model: Model, patch: Patch) {
        super(model, patch);

        this.wall = new CurtainWall(true, model, [patch], patch.shape.vertices.filter(
            (v: Point) => model.patchByVertex(v).some(
                (p: Patch) => !p.withinCity
            )
        ));
    }

    public createGeometry() {
        const block = this.getCityBlock();
        this.geometry = Ward.createOrthoBuilding(block, Math.sqrt(block.square) * 4, 0.6);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        return patch.shape.square > 400 && patch.shape.square < 900 ? 1 : 0;
    }
}

export class Cathedral extends Ward {
    public createGeometry() {
        const block = this.getCityBlock();
        this.geometry = Random.bool(0.4) ?
            Cutter.ring(block, 2 + Random.float() * 4) :
            Ward.createOrthoBuilding(block, 50, 0.8);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        if (model.plaza && patch.shape.borders(model.plaza.shape)) {
            return -1 / patch.shape.square;
        } else {
            return patch.shape.distance(model.plaza ? model.plaza.shape.center : model.center) * patch.shape.square;
        }
    }
}

export class CommonWard extends Ward {
    private minSq: number;
    private gridChaos: number;
    private sizeChaos: number;
    private emptyProb: number;

    constructor(model: Model, patch: Patch, minSq: number, gridChaos: number, sizeChaos: number, emptyProb: number = 0.04) {
        super(model, patch);

        this.minSq = minSq;
        this.gridChaos = gridChaos;
        this.sizeChaos = sizeChaos;
        this.emptyProb = emptyProb;
    }

    public createGeometry() {
        const block = this.getCityBlock();
        this.geometry = Ward.createAlleys(block, this.minSq, this.gridChaos, this.sizeChaos, this.emptyProb);

        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }
}

export class CraftsmenWard extends CommonWard {
    constructor(model: Model, patch: Patch) {
        super(model, patch,
            10 + 80 * Random.float() * Random.float(),
            0.5 + Random.float() * 0.2, 0.6);
    }
}

export class Farm extends Ward {
    public createGeometry() {
        const housing = Polygon.rect(4, 4);
        const pos = GeomUtils.interpolate(this.patch.shape.random(), this.patch.shape.centroid, 0.3 + Random.float() * 0.4);
        housing.rotate(Random.float() * Math.PI);
        housing.offset(pos);

        this.geometry = Ward.createOrthoBuilding(housing, 8, 0.5);
    }
}

export class GateWard extends CommonWard {
    constructor(model: Model, patch: Patch) {
        super(model, patch,
            10 + 50 * Random.float() * Random.float(),
            0.5 + Random.float() * 0.3, 0.7);
    }
}

export class Market extends Ward {
    public createGeometry() {
        const statue = Random.bool(0.6);
        const offset = statue || Random.bool(0.3);

        let v0: Point | null = null;
        let v1: Point | null = null;
        if (statue || offset) {
            let length = -1;
            this.patch.shape.forEdge((p0: Point, p1: Point) => {
                const len = Point.distance(p0, p1);
                if (len > length) {
                    length = len;
                    v0 = p0;
                    v1 = p1;
                }
            });
        }

        let object: Polygon;
        if (statue) {
            object = Polygon.rect(1 + Random.float(), 1 + Random.float());
            object.rotate(Math.atan2(v1!.y - v0!.y, v1!.x - v0!.x));
        } else {
            object = Polygon.circle(1 + Random.float());
        }

        if (offset) {
            const gravity = GeomUtils.interpolate(v0!, v1!, 0.5); // Assuming 0.5 for midpoint
            object.offset(GeomUtils.interpolate(this.patch.shape.centroid, gravity, 0.2 + Random.float() * 0.4));
        } else {
            object.offset(this.patch.shape.centroid);
        }

        this.geometry = [object];
    }

    public static rateLocation(model: Model, patch: Patch): number {
        for (const p of model.inner) {
            if (p.ward instanceof Market && p.shape.borders(patch.shape)) {
                return Infinity;
            }
        }

        return model.plaza ? patch.shape.square / model.plaza.shape.square : patch.shape.distance(model.center);
    }
}

export class MerchantWard extends CommonWard {
    constructor(model: Model, patch: Patch) {
        super(model, patch,
            50 + 60 * Random.float() * Random.float(),
            0.5 + Random.float() * 0.3, 0.7,
            0.15);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        return patch.shape.distance(model.plaza ? model.plaza.shape.center : model.center);
    }
}

export class MilitaryWard extends Ward {
    public createGeometry() {
        const block = this.getCityBlock();
        this.geometry = Ward.createAlleys(block,
            Math.sqrt(block.square) * (1 + Random.float()),
            0.1 + Random.float() * 0.3, 0.3,
            0.25);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        if (model.citadel && model.citadel.shape.borders(patch.shape)) {
            return 0;
        } else if (model.wall && model.wall.borders(patch)) {
            return 1;
        } else {
            return (model.citadel === null && model.wall === null) ? 0 : Infinity;
        }
    }
}

export class Park extends Ward {
    public createGeometry() {
        const block = this.getCityBlock();
        this.geometry = block.compactness >= 0.7 ?
            Cutter.radial(block, null, Ward.ALLEY) :
            Cutter.semiRadial(block, null, Ward.ALLEY);
    }
}

export class PatriciateWard extends CommonWard {
    constructor(model: Model, patch: Patch) {
        super(model, patch,
            80 + 30 * Random.float() * Random.float(),
            0.5 + Random.float() * 0.3, 0.8,
            0.2);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        let rate = 0;
        for (const p of model.patches) {
            if (p.ward && p.shape.borders(patch.shape)) {
                if (p.ward instanceof Park) {
                    rate--;
                } else if (p.ward instanceof Slum) {
                    rate++;
                }
            }
        }
        return rate;
    }
}

export class Slum extends CommonWard {
    constructor(model: Model, patch: Patch) {
        super(model, patch,
            10 + 30 * Random.float() * Random.float(),
            0.6 + Random.float() * 0.4, 0.8,
            0.03);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        return -patch.shape.distance(model.plaza ? model.plaza.shape.center : model.center);
    }
}
