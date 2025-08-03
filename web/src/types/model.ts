import { Patch } from './patch';

export class Model {
    public patches: Patch[];

    constructor(patches: Patch[]) {
        this.patches = patches;
    }
}
