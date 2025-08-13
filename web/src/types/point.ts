export class Point {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public set(p: { x: number, y: number }): void {
        this.x = p.x;
        this.y = p.y;
    }

    public setTo(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    public add(p: { x: number, y: number }): Point {
        return new Point(this.x + p.x, this.y + p.y);
    }

    public addEq(p: { x: number, y: number }): void {
        this.x += p.x;
        this.y += p.y;
    }

    public subtract(p: { x: number, y: number }): Point {
        return new Point(this.x - p.x, this.y - p.y);
    }

    public scale(s: number): Point {
        return new Point(this.x * s, this.y * s);
    }

    public scaleEq(s: number): void {
        this.x *= s;
        this.y *= s;
    }

    public offset(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    public normalize(length: number = 1): Point {
        const currentLength = Math.sqrt(this.x * this.x + this.y * this.y);
        if (currentLength === 0) return new Point(0, 0);
        const scaleFactor = length / currentLength;
        return new Point(this.x * scaleFactor, this.y * scaleFactor);
    }

    public dot(p: { x: number, y: number }): number {
        return this.x * p.x + this.y * p.y;
    }

    public rotate90(): Point {
        return new Point(-this.y, this.x);
    }

    public interpolate(p: { x: number, y: number }, ratio: number): Point {
        return new Point(this.x + (p.x - this.x) * ratio, this.y + (p.y - this.y) * ratio);
    }

    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public static distance(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
