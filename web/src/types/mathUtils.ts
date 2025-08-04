export class MathUtils {
    public static sign(n: number): number {
        return n > 0 ? 1 : n < 0 ? -1 : 0;
    }
}
