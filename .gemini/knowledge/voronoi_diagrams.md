# Using Voronoi Diagrams for Town Generation

Voronoi diagrams are a powerful tool for dividing a space into regions. In the context of our town generator, they can be used to create organic-looking districts and road networks.

## 1. Generating Districts

We can use Voronoi diagrams to partition the map into different wards or districts. The `web/src/services/wards` directory already contains different ward types. We can use Voronoi cells to define the boundaries of these wards.

### Implementation

1.  **Generate Seed Points:** Create a set of random points within the map boundaries. The number of points will correspond to the number of districts.
2.  **Create Voronoi Diagram:** Use a library like `d3-voronoi` to generate the Voronoi diagram from the seed points.
3.  **Assign Wards:** Assign a ward type from the `web/src/services/wards` directory to each Voronoi cell.

```typescript
// Example using a hypothetical Voronoi library
import { Voronoi } from 'some-voronoi-library';
import { CommonWard } from './services/wards/CommonWard';

const points = [/* array of seed points */];
const voronoi = new Voronoi(points, {width: 1000, height: 1000});
const diagram = voronoi.diagram();

const wards = diagram.cells.map(cell => {
  // Assign a ward type to each cell
  return new CommonWard(cell.polygon);
});
```

## 2. Generating Road Networks

The edges of the Voronoi cells can be used to generate a basic road network. The Delaunay triangulation of the seed points can also be used to create a more connected network.

### Implementation

1.  **Extract Edges:** Get the edges from the Voronoi diagram.
2.  **Filter Edges:** Remove short or unnecessary edges.
3.  **Create Roads:** Create road segments from the filtered edges.

```typescript
// Example using a hypothetical Voronoi library
const edges = diagram.edges;
const roads = edges.map(edge => {
  // Create a road segment from the edge
  return new Road(edge.start, edge.end);
});
```

## Existing Code

The file `web/src/services/voronoi.ts` already exists. This file can be extended to include the logic for generating districts and road networks.
