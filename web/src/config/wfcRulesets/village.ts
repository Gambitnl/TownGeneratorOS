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

const adjacencyRules: Record<string, string[]> = {
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

// Create a deep copy to avoid modifying the original object while iterating
const symmetricalAdjacencyRules = JSON.parse(JSON.stringify(adjacencyRules));

// Make the adjacency rules symmetrical
for (const tileId in adjacencyRules) {
    const neighbors = adjacencyRules[tileId];
    for (const neighborId of neighbors) {
        if (!symmetricalAdjacencyRules[neighborId]) {
            symmetricalAdjacencyRules[neighborId] = [];
        }
        if (!symmetricalAdjacencyRules[neighborId].includes(tileId)) {
            symmetricalAdjacencyRules[neighborId].push(tileId);
        }
    }
}

// Map symmetricalAdjacencyRules to the rules property of each tile
for (const tile of villageTiles) {
  tile.rules = [
    symmetricalAdjacencyRules[tile.id] || [], // North
    symmetricalAdjacencyRules[tile.id] || [], // East
    symmetricalAdjacencyRules[tile.id] || [], // South
    symmetricalAdjacencyRules[tile.id] || []  // West
  ];
}
