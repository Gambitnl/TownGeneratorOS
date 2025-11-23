# Failure Modes & Troubleshooting

## 1. The "Black Canvas" State

### Symptoms
- The main map view remains solid black (`#111827`).
- UI controls (pan/zoom) seem to register events (console logs might show activity), but the visual state does not update.
- No specific error alert appears on the UI (unless explicitly handled).
- The "Regenerate" button may toggle the loading state, but the result remains black.

### Root Cause
This occurs when the **Render Loop** crashes *after* the canvas clear step but *before* drawing completes.

The render cycle in `TownCanvas.tsx` typically follows this order:
1.  Get Canvas Context.
2.  Fill Canvas with Background Color (Black).
3.  Instantiate `AssetPainter`.
4.  Call `painter.drawMap()`.

If `painter.drawMap()` throws an unhandled exception (e.g., geometry math error, invalid canvas API call), the JavaScript execution stops immediately. The canvas retains the result of Step 2 (Solid Black).

### Specific Incident: `roundRect` Compatibility
**Description:** The use of the native `ctx.roundRect()` API caused a crash in environments where the API was either unsupported (older browsers) or stricter about parameter validation (e.g., throwing errors on negative width/height/radius).

**The Fix:**
1.  **Robust Geometry:** Added logic to normalize negative width/height and clamp radii before drawing.
2.  **Polyfill/Fallback:** Implemented a manual path drawing method (`moveTo`, `lineTo`, `quadraticCurveTo`) that executes if the native `roundRect` fails or throws an error.
3.  **Error Boundaries:** Wrapped the main render call in `TownCanvas.tsx` within a `try-catch` block. If rendering fails, it now logs the error to the console and displays a fallback text message on the canvas (e.g., "Rendering Error").

### Prevention Checklist
- **Sanitize Inputs:** Ensure `x, y, width, height` are clean integers where possible, and `width/height` are positive before calling Canvas APIs.
- **Try-Catch Rendering:** Always wrap the primary `AssetPainter` logic in a `try-catch` block within the `useEffect`.
- **Browser Compatibility:** Do not assume newer Canvas features (like `roundRect`, `filter`, or `direction`) exist in all environments. Check for existence or wrap in try-catch.
