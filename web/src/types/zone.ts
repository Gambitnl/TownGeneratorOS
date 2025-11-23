export enum ZoneType {
    Residential = 'residential',
    Commercial = 'commercial',
    Industrial = 'industrial',
    Park = 'park',
    None = 'none'
}

export interface Zone {
    type: ZoneType;
    color: string; // For debug/visualization
    density: number; // 0-1
}

export interface ZoneMap {
    [key: string]: ZoneType; // key is "x,y"
}
