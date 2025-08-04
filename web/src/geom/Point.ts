export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public subtract(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }

  public dot(other: Point): number {
    return this.x * other.x + this.y * other.y;
  }

  public get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public rotate90(): Point {
    return new Point(-this.y, this.x);
  }

  public set(other: Point): void {
    this.x = other.x;
    this.y = other.y;
  }
}