export class Palette {
  public paper: number;
  public light: number;
  public medium: number;
  public dark: number;

  constructor(paper: number, light: number, medium: number, dark: number) {
    this.paper = paper;
    this.light = light;
    this.medium = medium;
    this.dark = dark;
  }

  public static DEFAULT = new Palette(0xccc5b8, 0x99948a, 0x67635c, 0x1a1917);
  public static BLUEPRINT = new Palette(0x455b8d, 0x7383aa, 0xa1abc6, 0xfcfbff);
  public static BW = new Palette(0xffffff, 0xcccccc, 0x888888, 0x000000);
  public static INK = new Palette(0xcccac2, 0x9a979b, 0x6c6974, 0x130f26);
  public static NIGHT = new Palette(0x000000, 0x402306, 0x674b14, 0x99913d);
  public static ANCIENT = new Palette(0xccc5a3, 0xa69974, 0x806f4d, 0x342414);
  public static COLOUR = new Palette(0xfff2c8, 0xd6a36e, 0x869a81, 0x4c5950);
  public static SIMPLE = new Palette(0xffffff, 0x000000, 0x000000, 0x000000);
}
