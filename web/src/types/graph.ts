import { Node } from './node';
import { Point } from './point';

export class Graph {
    private nextNodeId: number = 0;
    private nodes: Map<number, Node>;
    private nodeToPointMap: Map<Node, Point>;

    constructor() {
        this.nodes = new Map();
        this.nodeToPointMap = new Map();
    }

    public add(point?: Point): Node {
        const node = new Node(this.nextNodeId++);
        this.nodes.set(node.id, node);
        if (point) {
            this.nodeToPointMap.set(node, point);
        }
        return node;
    }

    public aStar(startNode: Node, endNode: Node, exclude: Node[] = []): Node[] | null {
        const openSet = new Set<Node>();
        openSet.add(startNode);

        const cameFrom = new Map<Node, Node>();

        const gScore = new Map<Node, number>();
        this.nodes.forEach(node => gScore.set(node, Infinity));
        gScore.set(startNode, 0);

        const fScore = new Map<Node, number>();
        this.nodes.forEach(node => fScore.set(node, Infinity));
        fScore.set(startNode, this.heuristic(startNode, endNode));

        while (openSet.size > 0) {
            let current: Node | null = null;
            let minFScore = Infinity;
            for (const node of openSet) {
                if (fScore.get(node)! < minFScore) {
                    minFScore = fScore.get(node)!;
                    current = node;
                }
            }

            if (current === endNode) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.delete(current!);

            for (const [neighbor, weight] of current!.links.entries()) {
                if (exclude.includes(neighbor)) continue;

                const tentativeGScore = gScore.get(current!)! + weight;
                if (tentativeGScore < gScore.get(neighbor)!) {
                    cameFrom.set(neighbor, current!);
                    gScore.set(neighbor, tentativeGScore);
                    fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, endNode));
                    if (!openSet.has(neighbor)) {
                        openSet.add(neighbor);
                    }
                }
            }
        }

        return null;
    }

    private heuristic(nodeA: Node, nodeB: Node): number {
        const pointA = this.nodeToPointMap.get(nodeA);
        const pointB = this.nodeToPointMap.get(nodeB);

        if (pointA && pointB) {
            return Point.distance(pointA, pointB);
        }
        return 0;
    }

    private reconstructPath(cameFrom: Map<Node, Node>, current: Node): Node[] {
        const totalPath: Node[] = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current)!;
            totalPath.unshift(current);
        }
        return totalPath;
    }

    public setNodePoint(node: Node, point: Point): void {
        this.nodeToPointMap.set(node, point);
    }
}