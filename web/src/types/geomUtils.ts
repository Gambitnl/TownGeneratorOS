import { Point } from './point';

export class GeomUtils {
    public static cross(x1: number, y1: number, x2: number, y2: number): number {
        return x1 * y2 - x2 * y1;
    }

    public static intersectLines(x1: number, y1: number, dx1: number, dy1: number, x2: number, y2: number, dx2: number, dy2: number): { x: number, y: number } | null {
        const den = dx1 * dy2 - dy1 * dx2;
        if (den === 0) return null; // Lines are parallel or collinear

        const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / den;
        const u = -((x1 - x2) * dy1 - (y1 - y2) * dx1) / den;

        return { x: t, y: u };
    }

    public static distance2line(x1: number, y1: number, dx: number, dy: number, x0: number, y0: number): number {
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) return Point.distance({ x: x1, y: y1 }, { x: x0, y: y0 });
        const t = ((x0 - x1) * dx + (y0 - y1) * dy) / l2;
        const projection = { x: x1 + t * dx, y: y1 + t * dy };
        return Point.distance(projection, { x: x0, y: y0 });
    }

    public static interpolate(p1: { x: number, y: number }, p2: { x: number, y: number }, ratio: number = 0.5): Point {
        return new Point(p1.x + (p2.x - p1.x) * ratio, p1.y + (p2.y - p1.y) * ratio);
    }

    public static scalar(x1: number, y1: number, x2: number, y2: number): number {
        return x1 * x2 + y1 * y2;
    }
}