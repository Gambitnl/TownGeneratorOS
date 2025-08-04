import { Delaunay } from 'd3-delaunay';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';

export function generateVoronoi(points: [number, number][], bounds: [number, number, number, number]): Polygon[] {
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi(bounds);

    const polygons: Polygon[] = [];
    for (const cell of voronoi.cellPolygons()) {
        const vertices = Array.from(cell).map((p: number[]) => new Point(p[0], p[1]));
        polygons.push(new Polygon(vertices));
    }

    return polygons;
}