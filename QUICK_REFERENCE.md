# Quick Reference Guide

## For Users

### Running the App
```bash
cd web
npm install    # First time only
npm run dev    # Start development server
```
Open http://localhost:3000/

### Using the Interface
- **Generate Towns**: Click "Small Town", "Large Town", or "Huge City"
- **Regenerate**: Click "Regenerate" for a new random map
- **Custom Seed**: Enter a number in the seed field and click "Apply"
- **Layers**: Toggle Grid, Zones, and Water visibility
- **Pan**: Click and drag on the map
- **Zoom**: Use mouse wheel or the zoom slider
- **Export PNG**: Click "Export PNG"
- **Export VTT**: Click "Export VTT (JSON)"
- **Share**: Click "Share" to copy reproducible URL

### Troubleshooting
**Q: Black screen or no map?**
A: Check browser console. Refresh the page. Ensure water.png exists.

**Q: Seeing "WFC max attempts" warnings?**
A: This is normal. The app will retry or use a fallback pattern.

**Q: Map looks like a regular grid?**
A: The fallback pattern activated. This is working as intended when WFC can't find a solution.

---

## For Developers

### Project Structure
```
web/
├── src/
│   ├── components/       # React UI components
│   ├── services/         # Core logic
│   │   ├── GridModel.ts        # Main orchestrator
│   │   ├── CityMap.tsx         # Canvas renderer
│   │   ├── generators/         # WFC, Water
│   │   └── zoning/             # Zone allocation
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities (Random, exporters)
│   └── styles/           # CSS
└── public/assets/tiles/  # 64x64 PNG tiles
```

### Key Files
- **GridModel.ts** - Entry point for generation
- **WFCGenerator.ts** - Road network using Wave Function Collapse  
- **WaterGenerator.ts** - River and lake placement
- **ZoneAllocator.ts** - Zone assignment via flood fill
- **CityMap.tsx** - Canvas rendering with tiles

### Building
```bash
npm run build    # Production build → web/dist/
npm test         # Run test suite
```

### Making Changes

**Add a new tile type:**
1. Add to `TileType` enum in `types/tile.ts`
2. Create 64x64 PNG in `public/assets/tiles/`
3. Add to `IMAGE_NAMES` in `CityMap.tsx`
4. Define module in `WFCGenerator.initializeDefaultRules()`

**Modify WFC rules:**
- Edit `WFCGenerator.initializeDefaultRules()`
- Change socket definitions (what connects to what)
- Adjust weights to affect tile frequency

**Change water generation:**
- Edit `WaterGenerator.ts`
- Modify `generateRiver()` or `generateLake()` parameters
- Adjust probabilities in `generate()`

**Adjust zone placement:**
- Edit `ZoneAllocator.ts`
- Modify `MIN_ZONE_SIZE` constant
- Change zone type selection logic

### Common Tasks

**Reduce WFC failures:**
- Simplify tile constraints in `initializeDefaultRules()`
- Increase module weights for flexible tiles (grass)
- Review socket compatibility

**Change map sizes:**
- Edit size mapping in `TownScene.tsx` line 37:
  ```typescript
  const mapSize = newSize === 0 ? 20 : (newSize === 1 ? 50 : 100);
  ```

**Modify fallback pattern:**
- Edit `WFCGenerator.generateFallbackPattern()`
- Change grid spacing (currently every 5 tiles)

### Testing Changes
1. Make your changes
2. Save file (Vite auto-reloads)
3. Check browser for errors
4. Click "Regenerate" to test generation
5. Review console for WFC messages

### Performance Tips
- Reduce `maxRetries` in `WFCGenerator.generate()` for faster failures
- Lower `maxAttempts` per retry (currently 1000)
- Simplify tile rules to reduce contradictions
- Cache generated patterns (future improvement)

---

## Architecture Notes

### Data Flow
```
User Action → TownScene
    ↓
GridModel.generateFullTown()
    ↓
1. Initialize grid (all grass)
2. WaterGenerator.generate()     → Places water tiles
3. WFCGenerator.generate()        → Places road tiles (with retry)
4. ZoneAllocator.allocateZones()  → Assigns zones to grass areas
5. placeBuildingsFromZones()      → Places houses in zones
    ↓
CityMap renders tiles to canvas
```

### WFC Process
```
1. Initialize cells (all possibilities)
2. Loop until done:
   a. Find lowest entropy cell
   b. Collapse to one module (weighted random)
   c. Propagate constraints to neighbors
   d. If contradiction → return false
3. If failed → retry (up to 5 times)
4. If all retries fail → fallback pattern
```

### Tile System
- Each tile is 64x64 pixels
- Images loaded once on mount
- Canvas draws tiles with rotation
- Socket system defines connections

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm test                # Run tests
npm run build           # Build for production

# Debugging
# Open browser DevTools (F12)
# Check Console for WFC messages
# Check Network for 404s on tiles

# Git
git status              # Check changes
git add .               # Stage all
git commit -m "msg"     # Commit
git push                # Push to remote
```

---

## Links
- **Main README**: [../README.md](../README.md)
- **Status**: [../STATUS.md](../STATUS.md)
- **Cleanup Summary**: [../HAXE_CLEANUP_SUMMARY.md](../HAXE_CLEANUP_SUMMARY.md)
- **Original Project**: https://watabou.itch.io/medieval-fantasy-city-generator/
