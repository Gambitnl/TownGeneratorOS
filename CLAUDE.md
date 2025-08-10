# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

All commands should be run from the `web/` directory:

- `npm run dev` - Start development server with debug mode (runs on http://localhost:3000)
- `npm run build` - Build for production
- `npm run test` - Run all tests with Vitest
- `npm run serve` - Serve built files from dist/ on port 8000

## High-Level Architecture

This is a medieval fantasy town/village/building generator with three distinct generation systems:

### 1. City Generation System (`/src/services/Model.ts`)
- Uses **Voronoi diagrams** and **Ward-based architecture** for large settlements
- Entry point: `Model` class creates city with patches, walls, gates, and streets
- Ward types: Castle, Cathedral, Market, Military, Patriciate, Common, Slum, etc.
- Each ward in `/src/services/wards/` contains specific building types and layouts

### 2. Village Generation System (`/src/services/VillageGenerator.ts`)
- Uses **organic road networks** and **scattered building placement** 
- Entry point: `generateVillageLayout()` in `villageGenerationService.ts`
- Village types: farming, fishing, fortified, forest, crossroads
- Sizes: tiny, small, medium

### 3. Individual Building Generation (`/src/services/StandaloneBuildingGenerator.ts`)
- **5-foot grid system** (each tile = 5 feet, D&D standard)
- Building types: house_small, house_large, tavern, blacksmith, shop, market_stall
- Generates complete lots with interior rooms, furniture, and exterior features
- Social classes affect building size and materials: poor, common, wealthy, noble

### State Management & Rendering

**Main UI Controller**: `/src/components/TownScene.tsx`
- Manages generation type state: `'city' | 'village' | 'building'`
- Handles zoom/pan controls that don't affect UI elements
- Routes to appropriate renderer based on generation type

**Renderers**:
- `CityMap.tsx` - Renders city generation (SVG-based)
- `VillagePane.tsx` / `EnhancedVillagePane.tsx` - Renders village layouts
- `BuildingPane.tsx` - Renders individual buildings with tile grid

### Key Technical Patterns

**Deterministic Generation**: All generators use seeded random (`/src/utils/Random.ts`) for consistent results with same seed.

**Asset Integration**: The `Assets/` folder contains extensive Forgotten Adventures tileset. `AssetManager.ts` handles loading and categorization.

**Procedural Building Details**: The `ProceduralBuildingGenerator.ts` creates D&D-ready building interiors with:
- Room generation with proper tile alignment
- Furniture placement (beds = 2x2 tiles)
- Exterior features (gardens, wells, sheds)
- Building materials based on social class

**TypeScript Structure**: Uses path aliases (`@/` points to `/src/`) and strict typing throughout. All geometric types in `/src/types/`.

### Ward System (City Generation)

Each ward in `/src/services/wards/` extends base `Ward.ts` class:
- Determines building density and types
- Manages road connections 
- Contains vocation-specific buildings (90+ fantasy vocations)
- Examples: `Castle.ts` (defensive structures), `Market.ts` (commercial), `Cathedral.ts` (religious)

### Building Detail System

Interactive building system with `BuildingDetailsModal.tsx`:
- Click buildings to see detailed information
- Resident personalities and backgrounds
- Building inventories and services  
- Local rumors and adventure hooks
- Time-based access restrictions

### Development Notes

- Run tests with `npm run test` (uses Vitest + jsdom)
- The project uses Vite with React and TypeScript
- Path alias `@/` resolves to `src/`
- Development server runs with `--debug` flag for detailed logging
- Assets are served from `web/public/assets/` and integrated automatically