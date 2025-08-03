import { Polygon } from './polygon';

export class Patch {
    public shape: Polygon;

    constructor(shape: Polygon) {
        this.shape = shape;
    }
}
