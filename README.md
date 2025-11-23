# Medieval Fantasy City Generator (Grid Edition)
This is a procedural town generator inspired by the [Medieval Fantasy City Generator](https://watabou.itch.io/medieval-fantasy-city-generator/).

## Overview
This tool generates medieval towns using a **5ft Grid System** (D&D compatible) suitable for VTT battlemaps and tabletop RPGs.

## 🎮 Quick Start

```bash
cd web
npm install
npm run dev
```

Then open `http://localhost:3000/` in your browser.

## ✨ Key Features
*   **5ft Grid System**: Maps are generated on a strict grid for precise battle mapping
*   **AI-Generated Assets**: Custom tiles (roads, houses, grass, water) created with AI
*   **Modern Stack**: Built with React and TypeScript for flexibility and maintainability
*   **Wave Function Collapse**: Advanced procedural generation for organic road layouts
*   **Zone System**: Automatic allocation of residential, commercial, and other zones
*   **VTT Export**: Export maps in JSON format for Virtual Tabletop platforms

## 📚 Documentation

- **[STATUS.md](STATUS.md)** - Current project status, architecture, and troubleshooting
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick guide for users and developers
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes
- **[HAXE_CLEANUP_SUMMARY.md](HAXE_CLEANUP_SUMMARY.md)** - Details of Haxe code removal
- **[web/README.md](web/README.md)** - Web application architecture

## ✅ Current Status

**All systems operational!** The app successfully:
- ✅ Generates towns using Wave Function Collapse
- ✅ Places water features (rivers & lakes)
- ✅ Allocates zones and buildings
- ✅ Renders to HTML5 Canvas with pan/zoom
- ✅ Exports to PNG and VTT JSON formats

See [STATUS.md](STATUS.md) for detailed information.

## 🛠️ Development
1.  `cd web`
2.  `npm install`
3.  `npm run dev`
