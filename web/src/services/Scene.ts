export class Scene {
  public rWidth: number;
  public rHeight: number;

  constructor() {
    this.rWidth = 0;
    this.rHeight = 0;
  }

  public activate(): void {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  public deactivate(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.onEsc();
    }
    // In a real application, you would dispatch an event here.
  }

  private onKeyUp(e: KeyboardEvent): void {
    // In a real application, you would dispatch an event here.
  }

  private onEsc(): void {
    // In a web environment, you might want to show a menu or a confirmation dialog.
    console.log('Escape key pressed');
  }

  public setSize(w: number, h: number): void {
    this.rWidth = w;
    this.rHeight = h;
    this.layout();
  }

  private layout(): void {
    // This method would be implemented by subclasses to arrange their content.
  }

  public update(): void {
    // This method would be implemented by subclasses to update their state.
  }
}
