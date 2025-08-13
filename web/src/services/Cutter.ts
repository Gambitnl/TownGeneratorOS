import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { GeomUtils } from '@/types/geomUtils';
import { MathUtils } from '@/types/mathUtils';

export class Cutter {
    public static bisect(poly: Polygon, vertex: Point, ratio = 0.5, angle = 0.0, gap = 0.0): Polygon[] {
        const next = poly.next(vertex);

        const p1 = GeomUtils.interpolate(vertex, next, ratio);
        const d = next.subtract(vertex);

        const cosB = Math.cos(angle);
        const sinB = Math.sin(angle);
        const vx = d.x * cosB - d.y * sinB;
        const vy = d.y * cosB + d.x * sinB;
        const p2 = new Point(p1.x - vy, p1.y + vx);

        return poly.cut(p1, p2, gap);
    }

    public static radial(poly: Polygon, center: Point | null = null, gap = 0.0): Polygon[] {
        if (center === null) {
            center = poly.centroid;
        }

        const sectors: Polygon[] = [];
        poly.forEdge((v0: Point, v1: Point) => {
            let sector = new Polygon([center!, v0, v1]);
            if (gap > 0) {
                const shrunk = sector.shrink([gap / 2, 0, gap / 2]);
                if (shrunk) sector = shrunk;
            }

            sectors.push(sector);
        });
        return sectors;
    }

    public static semiRadial(poly: Polygon, center: Point | null = null, gap = 0.0): Polygon[] {
        if (center === null) {
            const centroid = poly.centroid;
            center = poly.vertices.reduce((min: { v: Point, d: number }, v: Point) => {
                const d = Point.distance(v, centroid);
                return d < min.d ? { v, d } : min;
            }, { v: poly.vertices[0], d: Infinity }).v;
        }

        gap /= 2;

        const sectors: Polygon[] = [];
        poly.forEdge((v0: Point, v1: Point) => {
            if (v0 !== center && v1 !== center) {
                let sector = new Polygon([center!, v0, v1]);
                if (gap > 0) {
                    const d = [poly.findEdge(center!, v0) === -1 ? gap : 0, 0, poly.findEdge(v1, center!) === -1 ? gap : 0];
                    const shrunk = sector.shrink(d);
                    if (shrunk) sector = shrunk;
                }
                sectors.push(sector);
            }
        });
        return sectors;
    }

    public static ring(poly: Polygon, thickness: number): Polygon[] {
        const slices: { p1: Point, p2: Point, len: number }[] = [];
        poly.forEdge((v1: Point, v2: Point) => {
            const v = v2.subtract(v1);
            const n = v.rotate90().normalize(thickness);
            slices.push({ p1: v1.add(n), p2: v2.add(n), len: v.length() });
        });

        slices.sort((s1, s2) => s1.len - s2.len);

        const peel: Polygon[] = [];

        let p: Polygon | null = poly;
        for (let i = 0; i < slices.length; i++) {
            if (!p) break; // If p becomes null, stop processing
            const halves = p.cut(slices[i].p1, slices[i].p2);
            p = halves[0];
            if (halves.length === 2) {
                peel.push(halves[1]);
            }
        }

        return peel;
    }
}