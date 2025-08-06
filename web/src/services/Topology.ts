import { Point } from '@/types/point';
import { Graph } from '@/types/graph';
import { Node } from '@/types/node';
import { Model } from './Model';
import { Street } from '@/types/street';

export class Topology {
    private model: Model;
    private graph: Graph;

    public pt2node: Map<Point, Node>;
    public node2pt: Map<Node, Point>;

    private blocked: Point[];

    public inner: Node[];
    public outer: Node[];

    constructor(model: Model) {
        this.model = model;

        this.graph = new Graph();
        this.pt2node = new Map();
        this.node2pt = new Map();

        this.inner = [];
        this.outer = [];

        this.blocked = [];
        if (model.citadel) {
            this.blocked = this.blocked.concat(model.citadel.shape.vertices);
        }
        if (model.wall) {
            this.blocked = this.blocked.concat(model.wall.shape.vertices);
        }
        this.blocked = this.blocked.filter((p: Point) => !model.gates.some((g: Point) => g.x === p.x && g.y === p.y));

        const border = model.border!.shape; // border is guaranteed to be not null after buildWalls

        for (const p of model.patches) {
            const withinCity = p.withinCity;

            let v1: Point = p.shape.vertices[p.shape.vertices.length - 1];
            let n1: Node | null = this.processPoint(v1);

            for (let i = 0; i < p.shape.vertices.length; i++) {
                const v0: Point = v1; v1 = p.shape.vertices[i];
                const n0: Node | null = n1; n1 = this.processPoint(v1);

                if (n0 !== null && !border.contains(v0)) {
                    if (withinCity) {
                        this.inner.push(n0);
                    } else {
                        this.outer.push(n0);
                    }
                }
                if (n1 !== null && !border.contains(v1)) {
                    if (withinCity) {
                        this.inner.push(n1);
                    } else {
                        this.outer.push(n1);
                    }
                }

                if (n0 !== null && n1 !== null) {
                    n0.link(n1, Point.distance(v0, v1));
                }
            }
        }
    }

    private processPoint(v: Point): Node | null {
        let n: Node;

        const existingPoint = Array.from(this.pt2node.keys()).find((p: Point) => p.x === v.x && p.y === v.y);
        if (existingPoint) {
            n = this.pt2node.get(existingPoint)!;
        } else {
            n = this.graph.add(v);
            this.pt2node.set(v, n);
            this.node2pt.set(n, v);
        }

        return this.blocked.some((p: Point) => p.x === v.x && p.y === v.y) ? null : n;
    }

    private findClosestNode(point: Point): Node | null {
        let closestNode: Node | null = null;
        let minDistance = Infinity;

        for (const [node, p] of this.node2pt.entries()) {
            const distance = Point.distance(point, p);
            if (distance < minDistance) {
                minDistance = distance;
                closestNode = node;
            }
        }
        return closestNode;
    }

    public buildPath(from: Point, to: Point, exclude: Node[] = []): Street | null {
        let startNode: Node | null;
        const startNodePoint = Array.from(this.pt2node.keys()).find((p: Point) => p.x === from.x && p.y === from.y);
        const fromPointIsNode = startNodePoint !== undefined;

        if (fromPointIsNode) {
            startNode = this.pt2node.get(startNodePoint!)!;
        } else {
            startNode = this.findClosestNode(from);
        }

        if (!startNode) {
            console.warn("Pathfinding: 'from' point could not be resolved to a graph node.");
            return null;
        }

        let endNode: Node | null;
        const endNodePoint = Array.from(this.pt2node.keys()).find((p: Point) => p.x === to.x && p.y === to.y);
        const toPointIsNode = endNodePoint !== undefined;

        if (toPointIsNode) {
            endNode = this.pt2node.get(endNodePoint!)!;
        } else {
            endNode = this.findClosestNode(to);
        }

        if (!endNode) {
            console.warn("Pathfinding: 'to' point could not be resolved to a graph node.");
            return null;
        }

        const path = this.graph.aStar(startNode, endNode, exclude);
        if (path === null) {
            return null;
        }

        const streetPath = path.map((n: Node) => this.node2pt.get(n)!);

        if (!fromPointIsNode) {
            streetPath.unshift(from);
        }

        if (!toPointIsNode) {
            streetPath.push(to);
        }

        return new Street(streetPath);
    }
}