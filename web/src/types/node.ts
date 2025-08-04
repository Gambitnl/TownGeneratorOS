export class Node {
    public id: number;
    public links: Map<Node, number>;

    constructor(id: number) {
        this.id = id;
        this.links = new Map();
    }

    public link(other: Node, weight: number): void {
        this.links.set(other, weight);
        other.links.set(this, weight); // Assuming undirected graph
    }
}