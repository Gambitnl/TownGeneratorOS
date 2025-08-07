# Town Generation Pipeline

This document outlines a step-by-step pipeline for generating a medieval town using the techniques described in the other knowledge base documents.

## 1. Terrain Generation

First, we need to generate the terrain for the town. We can use a noise function like Perlin noise to create a heightmap.

*   **Input:** Map dimensions.
*   **Output:** A 2D array representing the heightmap.

## 2. District Generation

Next, we use a Voronoi diagram to divide the map into districts.

*   **Input:** A set of seed points.
*   **Output:** A set of polygons representing the districts.
*   **Relevant Files:** `web/src/services/voronoi.ts`, `web/src/services/wards/*`

## 3. Road Network Generation

We can use the edges of the Voronoi diagram or an L-System to generate the road network.

*   **Input:** The Voronoi diagram or an L-System grammar.
*   **Output:** A set of road segments.
*   **Relevant Files:** `web/src/services/voronoi.ts`

## 4. Building Generation

For each district, we can use Wave Function Collapse to generate the buildings.

*   **Input:** A tileset and rules for each district.
*   **Output:** A set of building models.
*   **Relevant Files:** `web/src/building/*`, `web/src/types/simple-wfc.ts`

## 5. Detail Placement

Finally, we can add details like props, vegetation, and other features to the town.

*   **Input:** The generated town map.
*   **Output:** A complete town map with details.

## Example Pipeline

```typescript
// Example of a high-level generation pipeline
import { generateTerrain } from './terrain';
import { generateDistricts } from './districts';
import { generateRoads } from './roads';
import { generateBuildings } from './buildings';
import { placeDetails } from './details';

function generateTown(width: number, height: number) {
  const terrain = generateTerrain(width, height);
  const districts = generateDistricts(terrain);
  const roads = generateRoads(districts);
  const buildings = generateBuildings(districts);
  const town = placeDetails(terrain, districts, roads, buildings);
  return town;
}
```
