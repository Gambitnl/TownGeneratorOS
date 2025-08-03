import { Polygon } from '@/types/polygon';
import { Patch } from '@/types/patch';
import { Model } from '@/types/model';

export class Ward {
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

    public static rateLocation(model: Model, patch: Patch): number {
        return 0;
    }
}

export class AdministrationWard extends Ward {}

import { CurtainWall } from './CurtainWall';

export class Castle extends Ward {
    public wall: CurtainWall;

    constructor(model: Model, patch: Patch) {
        super(model, patch);

        this.wall = new CurtainWall(true, model, [patch], patch.shape.vertices.filter(
            (v) => this.model.patchByVertex(v).some(
                (p) => !p.withinCity
            )
        ));
    }

    public createGeometry() {
        const block = this.patch.shape.shrinkEq(Ward.MAIN_STREET * 2);
        this.geometry = Ward.createOrthoBuilding(block, Math.sqrt(block.square) * 4, 0.6);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        return patch.shape.square > 400 && patch.shape.square < 900 ? 1 : 0;
    }
}

export class Cathedral extends Ward {
    public createGeometry() {
        this.geometry = Math.random() < 0.4 ?
            Cutter.ring(this.getCityBlock(), 2 + Math.random() * 4) :
            Ward.createOrthoBuilding(this.getCityBlock(), 50, 0.8);
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
            10 + 80 * Math.random() * Math.random(),
            0.5 + Math.random() * 0.2, 0.6);
    }
}

export class Farm extends Ward {
    public createGeometry() {
        const housing = Polygon.rect(4, 4);
        const pos = this.patch.shape.random().interpolate(this.patch.shape.centroid, 0.3 + Math.random() * 0.4);
        housing.rotate(Math.random() * Math.PI);
        housing.offset(pos);

        this.geometry = Ward.createOrthoBuilding(housing, 8, 0.5);
    }
}

export class GateWard extends CommonWard {
    constructor(model: Model, patch: Patch) {
        super(model, patch,
            10 + 50 * Math.random() * Math.random(),
            0.5 + Math.random() * 0.3, 0.7);
    }
}

export class Market extends Ward {
    public createGeometry() {
        const statue = Math.random() < 0.6;
        const offset = statue || Math.random() < 0.3;

        let v0: { x: number, y: number } | null = null;
        let v1: { x: number, y: number } | null = null;
        if (statue || offset) {
            let length = -1;
            this.patch.shape.forEdge((p0, p1) => {
                const len = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
                if (len > length) {
                    length = len;
                    v0 = p0;
                    v1 = p1;
                }
            });
        }

        let object: Polygon;
        if (statue) {
            object = Polygon.rect(1 + Math.random(), 1 + Math.random());
            object.rotate(Math.atan2(v1.y - v0.y, v1.x - v0.x));
        } else {
            object = Polygon.circle(1 + Math.random());
        }

        if (offset) {
            const gravity = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
            object.offset(this.patch.shape.centroid.interpolate(gravity, 0.2 + Math.random() * 0.4));
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
            50 + 60 * Math.random() * Math.random(),
            0.5 + Math.random() * 0.3, 0.7,
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
            Math.sqrt(block.square) * (1 + Math.random()),
            0.1 + Math.random() * 0.3, 0.3,
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
            80 + 30 * Math.random() * Math.random(),
            0.5 + Math.random() * 0.3, 0.8,
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
            10 + 30 * Math.random() * Math.random(),
            0.6 + Math.random() * 0.4, 0.8,
            0.03);
    }

    public static rateLocation(model: Model, patch: Patch): number {
        return -patch.shape.distance(model.plaza ? model.plaza.shape.center : model.center);
    }
}