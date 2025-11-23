export enum TileType {
    Grass = 'grass',
    Road = 'road',
    House = 'house',
    Water = 'water',
    Wall = 'wall'
}

export interface Tile {
    x: number;
    y: number;
    type: TileType;
    rotation: number; // 0, 90, 180, 270
    variant?: string; // e.g., 'straight', 'corner', 'tee', 'cross' for roads
    zone?: string; // e.g., 'residential', 'commercial', 'industrial', 'park'
}
