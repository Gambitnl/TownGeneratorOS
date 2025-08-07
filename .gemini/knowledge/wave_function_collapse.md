# Using Wave Function Collapse for Building Generation

Wave Function Collapse (WFC) is an algorithm for procedural generation that can create complex and detailed structures from a small set of rules. We can use WFC to generate buildings within our town.

## 1. Defining Tiles

First, we need to define a set of tiles that will be used to construct the buildings. These tiles can represent different parts of a building, such as walls, roofs, doors, and windows.

The `web/src/building` directory contains classes like `Model`, `Patch`, and `CurtainWall` that can be used to define the geometry of our tiles.

## 2. Defining Rules

Next, we need to define the rules that govern how the tiles can be placed next to each other. For example, a window tile can only be placed next to a wall tile.

These rules can be defined in a JSON file or directly in the code.

## 3. Implementing WFC

There are several WFC libraries available for TypeScript. We can use one of these libraries to implement the WFC algorithm.

The `web/src/types/simple-wfc.d.ts` and `web/src/types/simple-wfc.ts` files suggest that a WFC library may already be in use. We should investigate this further.

### Implementation

1.  **Create a Tileset:** Define the tiles and their rules.
2.  **Initialize WFC:** Create a WFC model with the tileset.
3.  **Run WFC:** Run the WFC algorithm to generate a building.

```typescript
// Example using a hypothetical WFC library
import { WFC } from 'some-wfc-library';

const tileset = { /* tiles and rules */ };
const wfc = new WFC(tileset);
const building = wfc.generate();

// Convert the generated building into a Model
const model = new Model(building.patches);
```
