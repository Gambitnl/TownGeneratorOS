import { Scene } from './Scene';

export class Game {
  private static instance: Game;

  public static scene: Scene | null = null;

  private constructor(initScene: new () => Scene) {
    Game.instance = this;

    // In a browser environment, the main loop is typically handled by requestAnimationFrame.
    // The Updater.useRenderer(stage.window) call from the original code
    // suggests a similar continuous update mechanism.

    this.switchScene(initScene);
    this.gameLoop();
  }

  public static getInstance(initScene: new () => Scene): Game {
    if (!Game.instance) {
      Game.instance = new Game(initScene);
    }
    return Game.instance;
  }

  private gameLoop(): void {
    if (Game.scene) {
      Game.scene.update();
    }
    requestAnimationFrame(() => this.gameLoop());
  }

  public switchScene(scClass: (new () => Scene) | null): void {
    if (Game.scene) {
      Game.scene.deactivate();
      // In a React app, you wouldn't directly manipulate the DOM like this.
      // Instead, you would use state to conditionally render different components.
      Game.scene = null;
    }

    if (scClass) {
      Game.scene = new scClass();
      // Again, in React, you would use state to render the new scene component.
      Game.scene.activate();
    }
  }

  public static quit(): void {
    // This is not a standard operation in a web browser.
    // You might want to display a message or redirect the user.
    console.log('Quitting the game...');
  }
}
