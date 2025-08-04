import { Patch } from './Patch';
import { Tooltip } from './Tooltip';

// A placeholder for a display object, which will likely be a PIXI.Graphics or similar.
// The methods will need to be adapted to the target rendering library.
export type DisplayObject = any;

export class PatchView {
  private static lastPatch: Patch | null = null;

  public patch: Patch;
  public hotArea: DisplayObject; // This would be a clickable area for the patch

  constructor(patch: Patch) {
    this.patch = patch;

    // In a real implementation, this would create a clickable area corresponding to the patch's shape.
    // For now, it's a placeholder.
    this.hotArea = {};

    // In a real implementation, you would add an event listener to the hotArea.
    // this.hotArea.addEventListener('mouseover', this.onRollOver.bind(this));
  }

  private onRollOver(e: MouseEvent): void {
    if (this.patch !== PatchView.lastPatch) {
      PatchView.lastPatch = this.patch;
      // Assuming a Tooltip singleton or similar mechanism exists.
      // Tooltip.instance.set(this.patch.ward.getLabel());
    }
  }
}
