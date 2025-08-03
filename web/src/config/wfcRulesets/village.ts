export interface WfcTile {
  id: string;
  weight: number;
  rules: [string[], string[], string[], string[]];
}

export const villageTiles: WfcTile[] = [
  { id: 'grass', weight: 1, rules: [[], [], [], []] },
  { id: 'dirt', weight: 1, rules: [[], [], [], []] },
  { id: 'road_center', weight: 1, rules: [[], [], [], []] },
  { id: 'road_edge', weight: 1, rules: [[], [], [], []] },
  { id: 'building_wall_n', weight: 1, rules: [[], [], [], []] },
  { id: 'building_wall_s', weight: 1, rules: [[], [], [], []] },
  { id: 'building_door', weight: 1, rules: [[], [], [], []] },
  { id: 'building_roof_edge', weight: 1, rules: [[], [], [], []] },
  { id: 'building_roof_center', weight: 1, rules: [[], [], [], []] },
  { id: 'town_wall', weight: 1, rules: [[], [], [], []] },
  { id: 'gate', weight: 1, rules: [[], [], [], []] },
  { id: 'tower_base', weight: 1, rules: [[], [], [], []] },
  { id: 'farmland', weight: 1, rules: [[], [], [], []] },
  { id: 'market_stall', weight: 1, rules: [[], [], [], []] },
  { id: 'well', weight: 1, rules: [[], [], [], []] }
];

// Directional adjacency rules
const directionalRules: Record<string, { north: string[], east: string[], south: string[], west: string[] }> = {
  grass: {
    north: ['grass', 'dirt', 'road_edge', 'farmland'],
    east: ['grass', 'dirt', 'road_edge', 'farmland'],
    south: ['grass', 'dirt', 'road_edge', 'farmland'],
    west: ['grass', 'dirt', 'road_edge', 'farmland']
  },
  dirt: {
    north: ['grass', 'dirt', 'road_edge'],
    east: ['grass', 'dirt', 'road_edge'],
    south: ['grass', 'dirt', 'road_edge'],
    west: ['grass', 'dirt', 'road_edge']
  },
  road_center: {
    north: ['road_center', 'road_edge', 'gate'],
    east: ['road_center', 'road_edge', 'gate'],
    south: ['road_center', 'road_edge', 'gate'],
    west: ['road_center', 'road_edge', 'gate']
  },
  road_edge: {
    north: ['road_center', 'road_edge', 'building_door', 'grass', 'dirt'],
    east: ['road_center', 'road_edge', 'building_door', 'grass', 'dirt'],
    south: ['road_center', 'road_edge', 'building_door', 'grass', 'dirt'],
    west: ['road_center', 'road_edge', 'building_door', 'grass', 'dirt']
  },
  building_wall_n: {
    north: ['building_roof_edge'],
    east: ['building_wall_n', 'building_door'],
    south: ['building_wall_n'],
    west: ['building_wall_n', 'building_door']
  },
  building_wall_s: {
    north: ['building_wall_s'],
    east: ['building_wall_s', 'building_door'],
    south: ['building_roof_edge'],
    west: ['building_wall_s', 'building_door']
  },
  building_door: {
    north: ['building_wall_n', 'building_wall_s'],
    east: ['building_wall_n', 'building_wall_s'],
    south: ['road_edge', 'road_center'],
    west: ['building_wall_n', 'building_wall_s']
  },
  building_roof_edge: {
    north: ['building_roof_center'],
    east: ['building_roof_edge'],
    south: ['building_wall_n', 'building_wall_s'],
    west: ['building_roof_edge']
  },
  building_roof_center: {
    north: ['building_roof_center'],
    east: ['building_roof_edge'],
    south: ['building_roof_center'],
    west: ['building_roof_edge']
  },
  town_wall: {
    north: ['town_wall', 'gate', 'tower_base'],
    east: ['town_wall', 'gate', 'tower_base'],
    south: ['town_wall', 'gate', 'tower_base'],
    west: ['town_wall', 'gate', 'tower_base']
  },
  gate: {
    north: ['town_wall'],
    east: ['road_center'],
    south: ['town_wall'],
    west: ['road_center']
  },
  tower_base: {
    north: ['town_wall'],
    east: ['town_wall'],
    south: ['town_wall'],
    west: ['town_wall']
  },
  farmland: {
    north: ['farmland', 'grass', 'road_edge'],
    east: ['farmland', 'grass', 'road_edge'],
    south: ['farmland', 'grass', 'road_edge'],
    west: ['farmland', 'grass', 'road_edge']
  },
  market_stall: {
    north: ['road_edge', 'road_center'],
    east: ['road_edge', 'road_center'],
    south: ['road_edge', 'road_center'],
    west: ['road_edge', 'road_center']
  },
  well: {
    north: ['road_center', 'road_edge'],
    east: ['road_center', 'road_edge'],
    south: ['road_center', 'road_edge'],
    west: ['road_center', 'road_edge']
  }
};

// Initialize a new rules object with all tiles
const symmetricalRules: Record<string, { north: string[], east: string[], south: string[], west: string[] }> = {};
for (const tile of villageTiles) {
  symmetricalRules[tile.id] = { north: [], east: [], south: [], west: [] };
}

// Populate the symmetrical rules
for (const tileId in directionalRules) {
  // North
  for (const neighborId of directionalRules[tileId].north) {
    if (!symmetricalRules[tileId].north.includes(neighborId)) {
      symmetricalRules[tileId].north.push(neighborId);
    }
    if (!symmetricalRules[neighborId].south.includes(tileId)) {
      symmetricalRules[neighborId].south.push(tileId);
    }
  }
  // East
  for (const neighborId of directionalRules[tileId].east) {
    if (!symmetricalRules[tileId].east.includes(neighborId)) {
      symmetricalRules[tileId].east.push(neighborId);
    }
    if (!symmetricalRules[neighborId].west.includes(tileId)) {
      symmetricalRules[neighborId].west.push(tileId);
    }
  }
  // South
  for (const neighborId of directionalRules[tileId].south) {
    if (!symmetricalRules[tileId].south.includes(neighborId)) {
      symmetricalRules[tileId].south.push(neighborId);
    }
    if (!symmetricalRules[neighborId].north.includes(tileId)) {
      symmetricalRules[neighborId].north.push(tileId);
    }
  }
  // West
  for (const neighborId of directionalRules[tileId].west) {
    if (!symmetricalRules[tileId].west.includes(neighborId)) {
      symmetricalRules[tileId].west.push(neighborId);
    }
    if (!symmetricalRules[neighborId].east.includes(tileId)) {
      symmetricalRules[neighborId].east.push(tileId);
    }
  }
}

// Map symmetricalRules to the rules property of each tile
for (const tile of villageTiles) {
  tile.rules = [
    symmetricalRules[tile.id].north,
    symmetricalRules[tile.id].east,
    symmetricalRules[tile.id].south,
    symmetricalRules[tile.id].west
  ];
}