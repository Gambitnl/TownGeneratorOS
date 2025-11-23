# Medieval Fantasy City Generator (Web Application)

This directory contains the web-based town generator with a clean, grid-based architecture.

## Architecture
*   **`GridModel.ts`**: Core generation logic orchestrating the full town generation pipeline
*   **`generators/WFCGenerator.ts`**: Wave Function Collapse algorithm for road network generation
*   **`generators/WaterGenerator.ts`**: Procedural water body placement (rivers and lakes)
*   **`zoning/ZoneAllocator.ts`**: Intelligent zone assignment for buildings
*   **`CityMap.tsx`**: Canvas-based renderer with pan/zoom support
*   **`services/realmsmith/`**: Ported RealmSmith generator logic (Perlin noise based)
*   **`components/RealmSmithCanvas.tsx`**: Renderer for RealmSmith maps
*   **Assets**: Located in `public/assets/tiles/` - 64x64 PNG tiles representing 5ft squares

## Current Features
*   ✅ Grid-based town generation
*   ✅ Wave Function Collapse for roads (with retry logic on contradictions)
*   ✅ Water feature generation (rivers & lakes)
*   ✅ Zone allocation (residential, commercial, etc.)
*   ✅ Canvas rendering with AI-generated PNG assets
*   ✅ Pan/zoom controls
*   ✅ VTT JSON export
*   ✅ **RealmSmith Integration**: Alternative Perlin-noise based generator with distinct visual style

**Note**: The WFC algorithm occasionally encounters contradictions during road generation. The system automatically retries (up to 5 times) and falls back to a simple grid pattern if needed. This ensures reliable map generation even when the algorithm struggles.

## Development
Run `npm run dev` to start the local development server.
