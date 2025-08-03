import { Polygon } from './polygon';

export class Cutter {
    public static bisect(poly: Polygon, vertex: { x: number, y: number }, ratio = 0.5, angle = 0, gap = 0): Polygon[] {
        const next = poly.next(vertex);

        const p1 = { x: vertex.x + (next.x - vertex.x) * ratio, y: vertex.y + (next.y - vertex.y) * ratio };
        const d = { x: next.x - vertex.x, y: next.y - vertex.y };

        const cosB = Math.cos(angle);
        const sinB = Math.sin(angle);
        const vx = d.x * cosB - d.y * sinB;
        const vy = d.y * cosB + d.x * sinB;
        const p2 = { x: p1.x - vy, y: p1.y + vx };

        return poly.cut(p1, p2, gap);
    }

    public static radial(poly: Polygon, center: { x: number, y: number } | null = null, gap = 0): Polygon[] {
        if (center === null) {
            center = poly.centroid;
        }

        const sectors: Polygon[] = [];
        poly.forEdge((v0, v1) => {
            let sector = new Polygon([center, v0, v1]);
            if (gap > 0) {
                sector = sector.shrink([gap / 2, 0, gap / 2]);
            }

            sectors.push(sector);
        });
        return sectors;
    }

    public static semiRadial(poly: Polygon, center: { x: number, y: number } | null = null, gap = 0): Polygon[] {
        if (center === null) {
            const centroid = poly.centroid;
            center = poly.vertices.reduce((min, v) => {
                const d = Math.sqrt(Math.pow(v.x - centroid.x, 2) + Math.pow(v.y - centroid.y, 2));
                return d < min.d ? { v, d } : min;
            }, { v: null, d: Infinity }).v;
        }

        gap /= 2;

        const sectors: Polygon[] = [];
        poly.forEdge((v0, v1) => {
            if (v0 !== center && v1 !== center) {
                let sector = new Polygon([center, v0, v1]);
                if (gap > 0) {
                    const d = [poly.findEdge(center, v0) === -1 ? gap : 0, 0, poly.findEdge(v1, center) === -1 ? gap : 0];
                    sector = sector.shrink(d);
                }
                sectors.push(sector);
            }
        });
        return sectors;
    }

    public static ring(poly: Polygon, thickness: number): Polygon[] {
        const slices: { p1: { x: number, y: number }, p2: { x: number, y: number }, len: number }[] = [];
        poly.forEdge((v1, v2) => {
            const v = { x: v2.x - v1.x, y: v2.y - v1.y };
            const n = { x: -v.y, y: v.x };
            const len = Math.sqrt(n.x * n.x + n.y * n.y);
            n.x /= len;
            n.y /= len;
            n.x *= thickness;
            n.y *= thickness;
            slices.push({ p1: { x: v1.x + n.x, y: v1.y + n.y }, p2: { x: v2.x + n.x, y: v2.y + n.y }, len: Math.sqrt(v.x * v.x + v.y * v.y) });
        });

        slices.sort((s1, s2) => s1.len - s2.len);

        const peel: Polygon[] = [];

        let p = poly;
        for (let i = 0; i < slices.length; i++) {
            const halves = p.cut(slices[i].p1, slices[i].p2);
            p = halves[0];
            if (halves.length === 2) {
                peel.push(halves[1]);
            }
        }

        return peel;
    }
}
