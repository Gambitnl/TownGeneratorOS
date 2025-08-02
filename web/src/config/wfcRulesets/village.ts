export interface WfcTile {
  id: string;
}

export const villageTiles: WfcTile[] = [
  { id: 'grass' },
  { id: 'dirt' },
  { id: 'road_center' },
  { id: 'road_edge' },
  { id: 'building_wall_n' },
  { id: 'building_wall_s' },
  { id: 'building_door' },
  { id: 'building_roof_edge' },
  { id: 'building_roof_center' },
  { id: 'town_wall' },
  { id: 'gate' },
  { id: 'tower_base' },
  { id: 'farmland' },
  { id: 'market_stall' },
  { id: 'well' }
];

export const adjacencyRules: Record<string, string[]> = {
  grass: ['grass', 'dirt', 'road_edge', 'farmland'],
  dirt: ['grass', 'dirt', 'road_edge'],
  road_center: ['road_center', 'road_edge', 'gate'],
  road_edge: ['road_center', 'road_edge', 'building_door', 'grass', 'dirt'],
  building_wall_n: ['building_roof_edge', 'building_wall_n', 'building_door'],
  building_wall_s: ['building_roof_edge', 'building_wall_s', 'building_door'],
  building_door: ['road_edge', 'road_center'],
  building_roof_edge: ['building_roof_center', 'building_wall_n', 'building_wall_s'],
  building_roof_center: ['building_roof_center', 'building_roof_edge'],
  town_wall: ['town_wall', 'gate', 'tower_base'],
  gate: ['road_center', 'town_wall'],
  tower_base: ['town_wall'],
  farmland: ['farmland', 'grass', 'road_edge'],
  market_stall: ['road_edge', 'road_center'],
  well: ['road_center', 'road_edge']
};
