# Medieval Fantasy City Generator (Web Port)

This directory contains the web-based port of the original Medieval Fantasy City Generator.

**Purpose:** This project is an ongoing effort to port the core city generation logic from its original Haxe / OpenFL / msignal codebase to a modern web stack using TypeScript, React, and CSS, with Node.js for potential backend services.

The goal is to eventually replace the reliance on the Haxe-compiled JavaScript output with native TypeScript implementations, allowing for easier development, maintenance, and integration with modern web technologies.

## Porting Status

This is a work in progress. The goal is to incrementally port the Haxe codebase to TypeScript.

**Current UI Status:** The UI is currently not fully functional due to ongoing porting efforts. The application is encountering runtime errors as it attempts to use unported or partially ported Haxe logic. The immediate focus is to resolve these errors to get the UI to load and display correctly.

**Currently Ported Modules (with placeholders for complex logic):**

*   `Random.ts`: Core random number generation.
*   `Point.ts`: Basic 2D point structure with essential geometric operations.
*   `Polygon.ts`: Represents a polygon, with placeholder methods for complex geometric operations. The `contains` method has been updated with a basic ray-casting algorithm.
*   `GeomUtils.ts`: Placeholder for geometric utility functions.
*   `Cutter.ts`: Placeholder for polygon cutting logic.
*   `Patch.ts`: Represents a land patch.
*   `Model.ts`: Overall city model, with placeholder methods for complex operations. The `findCircumference` method has been updated with a basic bounding-box implementation.
*   `CurtainWall.ts`: Logic for city walls, with some complex methods still as placeholders. This module has been significantly ported to resolve previous errors.
*   `Ward.ts`: Base class for different city wards, with some complex methods still as placeholders.
*   `Castle.ts`: Specific ward type, currently relying on placeholders from `Ward.ts`.

**Next Steps:**

The immediate focus is to get the application's UI to load without errors. This involves progressively porting the Haxe modules that are causing runtime errors, filling in the placeholder logic as needed. Once the UI is stable, the focus will shift to ensuring the core map generation functions correctly.
