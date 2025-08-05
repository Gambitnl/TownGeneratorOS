import { Polygon } from './polygon';
import { Ward } from '@/services/Ward';
import { Point } from './point';

// Assuming a Region type from d3-delaunay or similar structure
// For now, a placeholder that matches the Haxe usage
interface VoronoiRegion {
    vertices: { c: Point }[]; // Haxe uses {c: Point} for vertices in Region
}

export class Patch {
    public shape: Polygon;
    public ward: Ward | null;
    public withinWalls: boolean;
    public withinCity: boolean;

    constructor(shape: Polygon) {
        this.shape = shape;
        this.ward = null;
        this.withinWalls = false;
        this.withinCity = false;
    }

    public get center(): Point {
        return this.shape.center;
    }

    public static fromRegion(r: VoronoiRegion): Patch {
        return new Patch(new Polygon(r.vertices.map(v => v.c)));
    }
}