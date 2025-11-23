# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-11-21 - Haxe Removal & Modernization

### 🎯 Major Changes
- **Complete removal of Haxe engine** - Removed 50,000+ lines of legacy code
- **Pure TypeScript/React architecture** - Modern, maintainable codebase
- **Working Wave Function Collapse** - Functional road generation with retry logic
- **Robust error handling** - App never crashes, always produces a map

### ✨ Added
- WFC retry mechanism (up to 5 attempts on contradiction)
- Fallback grid pattern generator when WFC fails
- Missing water.png tile asset (AI-generated)
- Comprehensive documentation:
  - STATUS.md - Current project status and architecture
  - HAXE_CLEANUP_SUMMARY.md - Details of code removal
  - QUICK_REFERENCE.md - User and developer guide
- Better console logging for WFC debugging
- Type-safe return values for iterate() and propagate()

### 🗑️ Removed
- **Haxe Core**: Source/, Assets/, project.xml
- **Legacy Services** (23 files):
  - Model.ts (551 lines - Voronoi generation)
  - Ward.ts, CurtainWall.ts, Topology.ts
  - voronoi.ts, PatchView.ts, Cutter.ts, Brush.ts
  - Scene.ts, Game.ts (Haxe-style patterns)
  - OrganicVillageGenerationStrategy.ts
  - villageGenerationService.ts
  - StandaloneBuildingGenerator.ts
  - services/wards/ directory
- **Legacy Types** (10 files):
  - polygon.ts (19,904 bytes!)
  - patch.ts, street.ts, segment.ts
  - graph.ts, node.ts, point.ts
  - palette.ts, geomUtils.ts
- **Legacy Components**:
  - InfoPanel.tsx (old Model dependency)
  - VillagePane.tsx (SVG village renderer)
- **Documentation**: 6 old markdown files about Haxe issues

### 🔧 Fixed
- **Missing water.png** - Generated AI tile, preventing 404 error
- **WFC contradictions** - Added retry logic and fallback pattern
- **Type safety** - Made iterate() and propagate() return booleans
- **App crashes** - Proper error handling throughout generation pipeline
- **Black screen on load** - All assets now present and loading correctly

### 📝 Changed
- README.md - Updated with modern features and quick start
- web/README.md - Documented current architecture
- Build process now completes without errors
- Test suite updated for new architecture

### 🎨 Architecture
Current clean structure:
- 4 core services (GridModel, CityMap, StateManager, generators)
- 4 simple type files (tile, zone, mathUtils, simple-wfc)
- 7 AI-generated PNG assets (grass, roads, house, water)

### 📊 Statistics
- Total lines removed: ~50,000+
- Total files removed: 42
- Build time: ~388ms
- Bundle size: Significantly reduced
- Test coverage: All passing

### ✅ Testing
Verified through browser testing:
- Initial page load generates map
- "Small Town" button generates new maps
- Maps display all tile types correctly
- Pan and zoom controls work
- WFC retry logic handles contradictions
- Fallback pattern activates when needed
- Export functions work (PNG, VTT JSON)

---

## [1.x.x] - Pre-2025-11-21 - Mixed Haxe/TypeScript

### Features
- Dual Voronoi and Grid-based generation
- Haxe source with TypeScript port in progress
- Complex polygon utilities
- Ward/patch-based architecture

### Issues
- Large, complex codebase (~50,000+ lines legacy code)
- Haxe dependencies (lime, openfl, msignal)
- Incomplete TypeScript migration
- Missing assets causing runtime errors
- WFC not handling contradictions properly

---

## Version numbering

Following semantic versioning (SEMVER):
- **Major**: Breaking changes, architecture overhauls
- **Minor**: New features, non-breaking changes
- **Patch**: Bug fixes, documentation updates

Current version: **2.0.0** (complete rewrite from Haxe to TypeScript)
