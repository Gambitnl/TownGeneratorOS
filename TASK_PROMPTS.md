# Detailed Task Prompts

Use these prompts to execute the tasks defined in `TASKS_FROM_FEEDBACK.md`.

---

## 🧩 Task 4.1: Integrate WFCGenerator & ZoneAllocator into GridModel

**Prompt:**
> "Your goal is to update the `GridModel` service to orchestrate the full town generation process using the newly created `WFCGenerator` and `ZoneAllocator` classes.
>
> **Requirements:**
> 1.  Modify `web/src/services/GridModel.ts`.
> 2.  Replace or augment the existing simple generation logic with a new method (e.g., `generateFullTown(size, seed)`).
> 3.  **Step 1 - Roads:** Call `WFCGenerator` to generate the road network.
> 4.  **Step 2 - Zones:** Pass the generated road grid to `ZoneAllocator` to identify and assign zones (Residential, Commercial, etc.) to the empty areas between roads.
> 5.  **State Management:** Ensure the `GridModel` stores the complete state: the grid of tiles (including their types, variants, and rotation) and the zoning information.
> 6.  **Output:** The final grid state must be accessible so the UI can render it.
>
> **Definition of Done:**
> - Running the generation produces a grid that contains both valid road connections (from WFC) and zoning data (from ZoneAllocator).
> - Existing tests for GridModel should pass or be updated to reflect the new logic."

---

## 🎨 Task 4.2: Layered Rendering in CityMap

**Prompt:**
> "Your goal is to update the `CityMap` component to visually render the town in distinct layers, ensuring that ground, water, roads, and buildings appear in the correct order.
>
> **Requirements:**
> 1.  Modify `web/src/services/CityMap.tsx`.
> 2.  Implement a layered rendering approach. The draw order should be:
>     *   **Layer 0 (Bottom):** Ground/Grass base tiles.
>     *   **Layer 1:** Water tiles (Rivers/Lakes).
>     *   **Layer 2:** Road network.
>     *   **Layer 3 (Top):** Buildings and Zone Overlays.
> 3.  **Assets:** Use placeholder colors or temporary assets if final PNGs are missing, but ensure the code attempts to load the correct asset paths (e.g., `assets/tiles/building_res_01.png`).
> 4.  **Zoning Visualization:** If a tile has a zone assigned but no specific building, render a semi-transparent colored overlay (e.g., Green for Residential, Blue for Commercial) so the user can see the zones.
>
> **Definition of Done:**
> - The map renders with clear visual separation between elements.
> - Roads are drawn on top of the ground.
> - Buildings/Zones are drawn in the correct locations relative to the roads.
> - No visual z-fighting or overlapping artifacts."

---

## 💧 Task 4.3: Integrate Water Generation

**Prompt:**
> "Your goal is to implement and integrate a `WaterGenerator` that adds natural-looking water features (rivers or lakes) to the town grid.
>
> **Requirements:**
> 1.  Create or update `web/src/services/generators/WaterGenerator.ts`.
> 2.  **Logic:** Implement an algorithm to place water tiles. This could be a random walk for rivers or cellular automata for lakes.
> 3.  **Integration:** Ensure this generator runs *before* or *during* the road generation phase in `GridModel`, so that roads can build bridges or avoid water as needed.
> 4.  **Constraints:** Water should not completely block off sections of the map (unless bridges are implemented).
>
> **Definition of Done:**
> - The generated grid contains `TileType.Water` tiles.
> - Water features look somewhat organic (not just scattered single tiles).
> - The `GridModel` successfully includes these water tiles in its final state."

---

## 🎛️ Task 4.4: Update UI Controls

**Prompt:**
> "Your goal is to update the user interface to give the user control over the new generation features and visibility settings.
>
> **Requirements:**
> 1.  Create or update `web/src/components/Controls.tsx` (or the relevant sidebar component).
> 2.  **Layer Toggles:** Add checkboxes to toggle the visibility of specific layers (e.g., 'Show Zones', 'Show Grid', 'Show Water').
> 3.  **Info Display:** clearly display the current `Seed` and `Town Size`.
> 4.  **Regenerate:** Ensure the 'Regenerate' button triggers the new `generateFullTown` method from Task 4.1.
>
> **Definition of Done:**
> - User can hide/show zones to inspect the road network.
> - User can see exactly which seed generated the current map.
> - The UI looks clean and fits the application's aesthetic."

---

## 🖌️ Task 1.1 - 1.3: Asset Generation (Visuals)

**Prompt:**
> "Your goal is to generate or create the visual assets required to make the town look like a town, not a schematic.
>
> **Requirements:**
> 1.  **Water Tiles (Task 1.1):** Create seamless tiles for water (`water_center`, `water_edge`, etc.) or a simple set of variations. Save to `web/public/assets/tiles/`.
> 2.  **Building Tiles (Task 1.2):** Create top-down building sprites for different zones:
>     *   Residential (Houses)
>     *   Commercial (Shops/Markets)
>     *   Industrial (Factories/Warehouses)
>     *   Parks (Trees/Fountains)
> 3.  **Zone Overlays (Task 1.3):** Create simple semi-transparent 64x64 PNGs for zone debugging (Green, Blue, Yellow, Red).
>
> **Definition of Done:**
> - All referenced asset paths in the code exist on the filesystem.
> - The assets match the pixel-art or vector style of the existing road tiles.
> - Tiles align correctly on the grid."
