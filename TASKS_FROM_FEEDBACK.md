# Tasks Derived from Brutally Honest Feedback

## 🎯 Goal
Create a **visually rich town generator** that goes beyond a plain road grid. The output should include:
- Roads (already working)
- Water bodies (rivers, lakes)
- Zones with distinct building tiles (Residential, Commercial, Industrial, Parks)
- Optional decorative assets (lights, walls, landmarks)
- A clear UI that layers these elements in the correct order.

---

## 📋 High‑Priority Tasks (Immediate Integration)
| # | Task | Owner | File(s) | Status | Notes |
|---|------|-------|---------|--------|-------|
| **4.1** | **Integrate WFCGenerator & ZoneAllocator into GridModel** | Antigravity | `web/src/services/GridModel.ts` | ❌ Not started | Replace the current simple generation loop with calls to `WFCGenerator.generate()` and `ZoneAllocator.allocate()`.
| **4.2** | **Layered Rendering in CityMap** | Antigravity | `web/src/services/CityMap.tsx` | ❌ Not started | Render order: Ground → Water → Roads → Zones/Buildings. Add conditional rendering for each layer.
| **4.3** | **Integrate Water Generation** | Antigravity | `web/src/services/generators/WaterGenerator.ts` (new) | ❌ Not started | Ensure water tiles are created and returned by the generator pipeline.
| **4.4** | **Update UI Controls** | Antigravity | `web/src/components/Controls.tsx` (new) | ❌ Not started | Add UI to toggle layer visibility and display current seed/size.

---

## 📦 Asset Generation (Visual Enhancements)
| # | Asset | Owner | Output Path | Status |
|---|-------|-------|-------------|--------|
| **1.1** | Water tiles | TBD (artist or AI) | `web/public/assets/tiles/water_*.png` | ⏳ Pending |
| **1.2** | Building tiles (Res, Com, Ind, Park) | TBD | `web/public/assets/tiles/building_*.png` | ⏳ Pending |
| **1.3** | Zone overlay (optional) | TBD | `web/public/assets/tiles/zone_overlay_*.png` | ⏳ Pending |

---

## 🛠️ Supporting Tasks
- **3.1** VTT Exporter – already DONE.
- **3.2** Tile Inspector – already DONE.
- **2.1** WFC Generator – DONE (logic present, needs integration).
- **2.2** Zone Allocator – DONE (logic present, needs integration).

---

## 🗓️ Suggested Timeline (2‑week sprint)
1. **Day 1‑2**: Implement Task 4.1 – integrate generators into `GridModel` and expose a new `generateFullTown()` method.
2. **Day 3‑4**: Implement Task 4.2 – layered rendering in `CityMap`. Verify visual ordering with placeholder colors.
3. **Day 5**: Implement Task 4.3 – stub `WaterGenerator` and plug it into the pipeline.
4. **Day 6‑7**: Add UI controls (Task 4.4) and test end‑to‑end generation.
5. **Day 8‑10**: Asset generation (Tasks 1.1‑1.3). Use placeholder colored squares if assets are not ready, then replace with final graphics.
6. **Day 11‑12**: Polish, bug‑fix, and run full test suite.
7. **Day 13‑14**: Write documentation and update README with screenshots of a full town (roads + water + zones).

---

## ✅ Acceptance Criteria
- **Visual**: A generated town shows at least three distinct layers (ground, water, zones/buildings) with appropriate assets.
- **Functional**: Changing the `size` or `seed` updates all layers consistently.
- **Performance**: Generation completes within 2 seconds for sizes up to 30.
- **Export**: VTT export includes zone and water metadata.
- **Testing**: New integration tests verify that `GridModel.generateFullTown()` returns a grid containing road, water, and zone tiles.

---

*Prepared by Antigravity – your AI coding partner. Feel free to adjust owners, priorities, or add new subtasks as needed.*
