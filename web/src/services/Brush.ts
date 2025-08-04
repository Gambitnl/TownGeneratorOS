import { Palette } from '@/types/palette';

// A placeholder for a graphics context, which will likely be a CanvasRenderingContext2D.
// The methods will need to be adapted to the target rendering API.
export type GraphicsContext = any;

export class Brush {
  public static readonly NORMAL_STROKE = 0.3;
  public static readonly THICK_STROKE = 1.8;
  public static readonly THIN_STROKE = 0.15;

  public strokeColor = 0x000000;
  public fillColor = 0xcccccc;
  public stroke = Brush.NORMAL_STROKE;

  private palette: Palette;

  constructor(palette: Palette) {
    this.palette = palette;
  }

  public setFill(g: GraphicsContext, color: number): void {
    this.fillColor = color;
    // This is where canvas-specific logic would go, e.g.:
    // if (g instanceof CanvasRenderingContext2D) {
    //   g.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    // }
  }

  public setStroke(g: GraphicsContext, color: number, stroke: number = Brush.NORMAL_STROKE, miter = true): void {
    if (stroke === 0) {
      this.noStroke(g);
    } else {
      this.strokeColor = color;
      // This is where canvas-specific logic would go, e.g.:
      // if (g instanceof CanvasRenderingContext2D) {
      //   g.strokeStyle = color === -1 ? this.fillColor : `#${color.toString(16).padStart(6, '0')}`;
      //   g.lineWidth = stroke;
      //   g.lineJoin = miter ? 'miter' : 'round';
      // }
    }
  }

  public noStroke(g: GraphicsContext): void {
    // This is where canvas-specific logic would go, e.g.:
    // if (g instanceof CanvasRenderingContext2D) {
    //   g.lineWidth = 0;
    // }
  }

  public setColor(g: GraphicsContext, fill: number, line = -1, stroke: number = Brush.NORMAL_STROKE, miter = true): void {
    this.setFill(g, fill);
    this.setStroke(g, line, stroke, miter);
  }
}
