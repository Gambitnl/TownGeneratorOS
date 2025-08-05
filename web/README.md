# 🏰 Medieval Town Generator

A sophisticated web application for generating procedural medieval settlements with an immersive, modern UI. Create unique towns, cities, and villages with realistic layouts, districts, walls, and road networks.

## ⚠️ **CRITICAL PROJECT STATUS**

**This project is in an UNSTABLE BETA state with significant known issues.** While the application now compiles and runs without immediate crashes, the core generation algorithm has fundamental problems that prevent reliable town generation.

### **🚨 Known Critical Issues**

#### **1. Generation Reliability - MAJOR PROBLEM**
- **"Unable to build a street!" errors** still occur frequently despite error handling improvements
- **"Bad citadel shape!" errors** persist when citadel generation fails compactness requirements
- **Pathfinding failures** in the topology system cause incomplete road networks
- **Fallback generation** often produces suboptimal or broken layouts

#### **2. Algorithmic Deficiencies - CORE ISSUES**
- **Voronoi generation** is incomplete and produces irregular patch shapes
- **Patch optimization** logic is flawed, creating invalid geometries
- **Ward placement** algorithms are simplistic and don't respect historical accuracy
- **Wall generation** fails to create proper defensive structures

#### **3. Rendering Problems - VISUAL ISSUES**
- **Canvas scaling** is inconsistent across different town sizes
- **Ward visualization** lacks proper building detail and architectural accuracy
- **Color schemes** are basic and don't reflect medieval aesthetics
- **Performance** degrades significantly with larger settlements

#### **4. Missing Core Features - INCOMPLETE IMPLEMENTATION**
- **Water features** (rivers, lakes, coastlines) are completely absent
- **Terrain generation** is non-existent
- **Building interiors** and detailed structures are missing
- **Historical accuracy** in ward layouts is poor

## ✨ **What Currently Works (Limited)**

### 🎨 **UI/UX Foundation**
- **Modern interface** with medieval theming
- **Responsive design** that adapts to different screen sizes
- **Loading states** and error handling (though often triggered)
- **Control panel** for basic town size selection

### 🏘️ **Basic Generation**
- **Patch creation** using Voronoi diagrams (flawed but functional)
- **Ward assignment** with basic type classification
- **Simple road networks** (when pathfinding succeeds)
- **Basic wall generation** (incomplete)

### 🛠️ **Technical Infrastructure**
- **TypeScript compilation** works without errors
- **React component structure** is sound
- **Build system** functions properly
- **Development environment** is stable

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to the web directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🎮 How to Use

1. **Launch the application** - The interface will load with an initial medieval settlement
2. **Choose settlement size** - Use the control panel to select from Village to Capital
3. **Generate new towns** - Click any size button to create a new settlement
4. **Randomize** - Use the "Random Town" button for surprise generations
5. **Custom seeds** - Expand "Advanced" to use specific seeds for reproducible results

**⚠️ WARNING**: Generation frequently fails. If you encounter errors, try smaller settlement sizes or refresh the page.

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── Header.tsx          # Elegant header with title and branding
│   ├── ControlPanel.tsx    # Main control interface
│   ├── LoadingSpinner.tsx  # Animated loading component
│   ├── Button.tsx          # Reusable button with variants
│   ├── Tooltip.tsx         # Interactive tooltip system
│   └── TownScene.tsx       # Main application container
├── services/
│   ├── Model.ts           # Core generation logic (UNSTABLE)
│   ├── CityMap.tsx        # Map rendering component (BASIC)
│   └── wards/             # Ward type implementations (INCOMPLETE)
├── styles/
│   └── global.css         # Global styles and CSS variables
└── types/
    └── ...                # TypeScript type definitions
```

### Design System

#### Color Palette
- **Primary**: Dark themes with medieval atmosphere
- **Accent**: Gold (#d4af37) and Bronze (#cd7f32)
- **Background**: Layered gradients with blur effects
- **Text**: High contrast for accessibility

#### Typography
- **Primary**: Segoe UI family for modern readability
- **Sizes**: Responsive scaling from mobile to desktop
- **Weight**: Strategic use of weight for hierarchy

#### Spacing & Layout
- **CSS Variables**: Consistent spacing and sizing
- **Grid System**: Flexible layouts for all screen sizes
- **Responsive**: Mobile-first approach with progressive enhancement

## 📱 Responsive Design

The application adapts seamlessly across devices:

- **Desktop (1200px+)**: Full sidebar layout with optimal spacing
- **Tablet (768px-1200px)**: Repositioned controls with maintained functionality
- **Mobile (< 768px)**: Stacked layout with touch-optimized controls
- **Small Mobile (< 480px)**: Compact design with scrollable controls

## 🎯 Performance Features

- **Optimized animations** with GPU acceleration
- **Efficient rendering** with proper React patterns
- **Code splitting** for faster initial loads
- **Modern build system** with Vite for optimal performance
- **Reduced motion support** for accessibility

## 🛡️ Accessibility

- **Keyboard navigation** support
- **Screen reader friendly** with proper ARIA labels
- **High contrast** ratios for text readability
- **Focus indicators** for interactive elements
- **Reduced motion** support for sensitive users

## 🔧 Customization

The application uses CSS custom properties for easy theming:

```css
:root {
  --gold: #d4af37;
  --bronze: #cd7f32;
  --primary-bg: #1a1a1a;
  /* ... other variables */
}
```

## 🐛 Troubleshooting

### Known Issues

-   **Generation Failures:** The application frequently fails to generate towns due to algorithmic problems. This is a core issue that requires significant refactoring.
-   **Rendering Problems:** Generated towns often display incorrectly or with missing elements due to incomplete rendering logic.
-   **Performance Issues:** Larger settlements cause significant performance degradation and increased failure rates.
-   **Inconsistent Results:** The same seed may produce different results due to unstable algorithms.

### Common Issues

**Generation fails**: This is expected behavior. Try smaller settlement sizes or refresh the page.
**UI not responsive**: Ensure modern browser with CSS Grid support
**Slow performance**: Check if hardware acceleration is enabled, but expect issues with larger towns

### Browser Support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🗺️ **EXTENSIVE ROADMAP & CRITICAL ASSESSMENT**

This project is a **partial port** of the original Haxe-based [Medieval Fantasy City Generator](https://watabou.itch.io/medieval-fantasy-city-generator/). The current implementation represents approximately **30-40%** of the original functionality, with significant gaps in core algorithms and features.

### **🔥 CRITICAL PRIORITIES (Immediate)**

#### **1. Algorithm Stability - CRITICAL**
- **Fix Voronoi generation** - Current implementation produces invalid geometries
- **Rewrite patch optimization** - Junction optimization logic is fundamentally flawed
- **Implement proper pathfinding** - A* algorithm needs complete overhaul
- **Fix citadel generation** - Compactness requirements are too strict and arbitrary

#### **2. Core Logic Completion - ESSENTIAL**
- **Complete ward system** - Current implementations are basic placeholders
- **Implement proper wall generation** - Defensive structures are incomplete
- **Fix street network generation** - Road layouts are unrealistic
- **Add proper gate placement** - Current system is random and non-functional

#### **3. Rendering Overhaul - HIGH PRIORITY**
- **Rewrite canvas rendering** - Current system is basic and inconsistent
- **Implement proper building visualization** - Ward buildings lack detail
- **Add architectural accuracy** - Medieval buildings need proper representation
- **Fix scaling and centering** - Canvas transformations are unreliable

### **⚡ HIGH PRIORITIES (Next Phase)**

#### **4. Feature Parity - MAJOR GAPS**
- **Water features** - Rivers, lakes, coastlines are completely missing
- **Terrain generation** - No elevation or natural features
- **Building interiors** - No detailed structure generation
- **Historical accuracy** - Ward layouts don't reflect medieval urban planning

#### **5. Advanced Generation - COMPLEX FEATURES**
- **Wave Function Collapse (WFC)** - Building texture generation is missing
- **Procedural building types** - Limited architectural variety
- **Economic simulation** - No trade routes or market dynamics
- **Population density** - No realistic settlement patterns

#### **6. Performance Optimization - TECHNICAL DEBT**
- **Algorithm efficiency** - Current implementations are slow and memory-intensive
- **Rendering optimization** - Canvas operations need optimization
- **Memory management** - Large settlements cause memory issues
- **Code splitting** - Bundle size is excessive for functionality

### **🎯 MEDIUM PRIORITIES (Future)**

#### **7. Enhanced UI/UX - USER EXPERIENCE**
- **Advanced controls** - More generation parameters needed
- **Real-time preview** - Live generation updates
- **Export functionality** - Save/load town configurations
- **Undo/redo system** - Generation history management

#### **8. Content Expansion - FEATURE RICHNESS**
- **Multiple architectural styles** - Different medieval periods
- **Cultural variations** - Regional building differences
- **Seasonal variations** - Weather and time effects
- **Event generation** - Festivals, markets, etc.

#### **9. Integration Features - ECOSYSTEM**
- **API endpoints** - Programmatic town generation
- **Plugin system** - Extensible ward and building types
- **Community content** - User-created building sets
- **Export formats** - Multiple output options (SVG, PNG, 3D)

### **🔮 LONG-TERM VISION (Ambitious)**

#### **10. Advanced Simulation - COMPLEX SYSTEMS**
- **Economic modeling** - Trade, production, wealth distribution
- **Social dynamics** - Class structures, population movement
- **Historical progression** - Town evolution over time
- **Conflict simulation** - Sieges, battles, destruction

#### **11. 3D Integration - IMMERSIVE EXPERIENCE**
- **3D rendering** - Three.js integration for immersive views
- **VR support** - Virtual reality town exploration
- **Interactive buildings** - Clickable and explorable structures
- **Animation systems** - Dynamic town life simulation

#### **12. Educational Features - LEARNING TOOLS**
- **Historical accuracy** - Educational content about medieval urban planning
- **Interactive tutorials** - Learn about medieval architecture
- **Research integration** - Academic historical data
- **Cultural education** - Different medieval cultures and styles

### **⚠️ REALISTIC ASSESSMENT**

#### **Current State: 30-40% Complete**
- **UI/UX**: 80% complete (functional but basic)
- **Core Generation**: 25% complete (unstable and incomplete)
- **Rendering**: 40% complete (basic but functional)
- **Ward System**: 35% complete (implemented but simplistic)
- **Performance**: 50% complete (works for small towns)

#### **Estimated Development Time**
- **Critical fixes**: 2-3 months of focused development
- **Feature parity**: 6-12 months of substantial work
- **Advanced features**: 1-2 years of continuous development
- **Full vision**: 3-5 years of dedicated development

#### **Resource Requirements**
- **Expert algorithm developer** - Core generation logic needs complete rewrite
- **Graphics specialist** - Rendering system requires significant expertise
- **Historical consultant** - Medieval accuracy requires research
- **Performance engineer** - Optimization requires specialized knowledge

## 🤝 Contributing

**⚠️ WARNING**: This project has significant technical debt and architectural issues. Contributors should be prepared for:

1. **Complex debugging** - Many algorithms are incomplete or broken
2. **Architectural challenges** - Core systems need fundamental redesign
3. **Performance issues** - Current codebase is not optimized
4. **Incomplete documentation** - Many systems lack proper documentation

### Contribution Guidelines

1. **Start with critical issues** - Focus on algorithm stability first
2. **Test thoroughly** - Current test coverage is minimal
3. **Document changes** - Code documentation is essential
4. **Consider performance** - All changes must maintain or improve performance
5. **Follow existing patterns** - Maintain consistency with current architecture

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test extensively** - Ensure your changes don't break existing functionality
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request with detailed description of changes and testing

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Original Haxe-based Medieval Fantasy City Generator by Watabou
- Modern web technologies and frameworks
- Open source community contributions
- Historical research on medieval urban planning

---

**⚠️ DISCLAIMER**: This project is in active development with significant known issues. Users should expect frequent failures and incomplete functionality. The development team is working to address these issues, but progress may be slow due to the complexity of the underlying algorithms.

*Forge your medieval world with patience and understanding* ⚔️
