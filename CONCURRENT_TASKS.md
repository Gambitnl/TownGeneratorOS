# Concurrent Tasks for Grid System Expansion

This document outlines tasks that can be executed concurrently by multiple agents.
**CRITICAL RULE**: To avoid merge conflicts, every new feature MUST be implemented in its own dedicated file. Do not modify existing core files (`GridModel.ts`, `CityMap.tsx`) unless absolutely necessary for integration.

## 1. Asset Generation (Visuals)
*   **Task 1.1**: Generate "Water" tiles.
    *   *Output*: `web/public/assets/tiles/water_*.png` (multiple files).
*   **Task 1.2**: Generate "Building" tiles (Residential, Commercial, Industrial).
    *   *Output*: `web/public/assets/tiles/building_res_*.png`, `building_com_*.png`, etc.
    *   *Goal*: Create distinct visual assets for different zone types so the map isn't just empty squares.
*   **Task 1.3**: Generate "Zone Overlay" assets (Optional).
    *   *Output*: Semi-transparent colored overlays or borders to denote zone types if specific building tiles aren't used.

## 2. Core Logic Expansion (Code Isolation)
*   **Task 2.1**: Implement Wave Function Collapse Generator. [Completed by: Antigravity]
    *   *File*: `web/src/services/generators/WFCGenerator.ts`
    *   *Status*: **DONE**. Logic exists but is NOT integrated into the main display.
*   **Task 2.2**: Implement Zone Allocation Logic. [Completed by: Antigravity]
    *   *File*: `web/src/services/zoning/ZoneAllocator.ts`
    *   *Status*: **DONE**. Logic exists but is NOT integrated into the main display.

## 3. UI/UX & Tools (Code Isolation)
*   **Task 3.1**: Implement VTT Exporter. [Completed by: Antigravity]
    *   *File*: `web/src/utils/exporters/VTTExporter.ts`
    *   *Status*: **DONE**.
*   **Task 3.2**: Implement Tile Inspector Component. [Assigned to: Antigravity]
    *   *File*: `web/src/components/tools/TileInspector.tsx` (New File)
    *   *Goal*: A standalone React component that takes a `Tile` object and displays its properties (Type, Variant, Rotation) in a floating div.

## 4. Integration & Rendering (The Missing Link)
*   **Task 4.1**: **CRITICAL** - Integrate WFC and Zone Allocator into `GridModel`.
    *   *File*: `web/src/services/GridModel.ts`
    *   *Goal*: Replace the current simple generation loop with the `WFCGenerator` for roads and `ZoneAllocator` for the empty spaces.
    *   *Action*: Update `generateGrid` to call these new services.
*   **Task 4.2**: Implement Layered Rendering in `CityMap`.
    *   *File*: `web/src/services/CityMap.tsx`
    *   *Goal*: Update the rendering loop to draw:
        1.  Ground/Grass (Base)
        2.  Water (River/Lakes)
        3.  Roads (Existing)
        4.  Zones/Buildings (New Layer - currently missing!)
*   **Task 4.3**: Integrate Water Generation.
    *   *File*: `web/src/services/generators/WaterGenerator.ts` (or similar)
    *   *Goal*: Ensure water generation logic is actually called and produces `TileType.Water` tiles in the grid.

## 5. RealmSmith Enhancements
*   **Task 5.1**: Enable AI Tools.
    *   *Action*: Install `@google/genai` and uncomment `AiTools` in `RealmSmithCanvas.tsx`. Ensure API key handling is secure.
*   **Task 5.2**: UI Polish.
    *   *Action*: Refine the toggle between Classic and RealmSmith modes, perhaps moving it to a proper settings menu or landing page.
    *   *Status*: **DONE**. Tailwind CSS integrated, dark mode default, responsive layout.
*   **Task 5.3**: Unified Data Model.
    *   *Action*: Investigate if `RealmSmith`'s `TownMap` can be converted to `GridModel` for interoperability (e.g. export to VTT).
    *   *Status*: **PARTIALLY DONE**. VTT Export implemented for RealmSmith maps via `VTTExporter` adapter.
