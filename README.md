# Medieval Fantasy Town Generator OS

An enhanced TypeScript/React version of the medieval fantasy settlement generator, featuring both city and village generation with comprehensive fantasy vocations, interactive building details, and improved UI/UX.

## Features

- **Dual Generation Systems**: Both city and village generation with distinct algorithms
- **90+ Fantasy Vocations**: Expanded from ~7 to 90+ fantasy building types organized by categories:
  - Magical Practitioners (Alchemists, Enchanters, Wizards, etc.)
  - Religious & Divine Services (Temples, Shrines, Clerics, etc.)
  - Combat & Military (Weapon Smiths, Armor Crafters, Guards, etc.)
  - Exotic Traders (Rare Goods, Magical Components, etc.)
  - Artisans & Crafters (Specialized workshops and services)
  - Entertainment & Culture (Inns, Theaters, Bards, etc.)
  - And many more...

- **Interactive Building System**: Click any building to view detailed information including:
  - Detailed descriptions and purposes
  - Resident information with personalities and backgrounds
  - Building inventories and services
  - Local rumors and adventure hooks
  - Interior access system with time-based restrictions

- **Enhanced UI/UX**:
  - Collapsible control panel with hide/show functionality
  - Smooth zoom and pan controls that don't affect UI elements
  - Fixed building modal positioning that respects zoom levels
  - Stable vegetation positioning (no more "jostling" during interaction)

- **Technical Improvements**:
  - Deterministic seeded random generation for consistent results
  - Improved road connection angles (minimum 30-degree differences)
  - Color-coded building types with comprehensive theming
  - Transform isolation preventing UI elements from moving with map

## Requirements

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with ES6+ support

## Installation

1. Clone the repository
2. Navigate to the `web` directory
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## Versioning

Current version: **2.0.0** (Major UI/UX overhaul and feature expansion)

### Version History
- **2.0.0**: Major overhaul with 90+ fantasy vocations, UI improvements, building interaction system, and technical fixes
- **1.0.0**: Initial TypeScript/React port
- **0.1.0**: Original baseline version

## Asset Integration

The project is designed to support custom tree and vegetation assets. Place asset files in `web/public/assets/` and they will be automatically integrated into the map generation.
