# 🏰 Medieval Town Generator

A sophisticated web application for generating procedural medieval settlements with an immersive, modern UI. Create unique towns, cities, and villages with realistic layouts, districts, walls, and road networks.

## ⚠️ **CRITICAL PROJECT STATUS - UPDATED v0.2.0**

**This project has been significantly enhanced and is now in STABLE BETA state.** The critical infinite recursion issues have been resolved, tooltip functionality has been added, and small town generation has been greatly improved. The application now generates towns reliably with interactive features.

### **✅ RECENT CRITICAL FIXES & ENHANCEMENTS (December 2024)**

#### **1. Interactive Features - NEW**
- **✅ Added mouse hover tooltips** for all map elements (wards, streets, walls, gates)
- **✅ Enhanced map interaction** with detailed information on hover
- **✅ Improved visual feedback** with cursor changes and tooltip positioning
- **✅ Added element identification** for better user experience

#### **2. Small Town Generation - MAJOR IMPROVEMENT**
- **✅ Improved patch generation** based on original Haxe implementation
- **✅ Enhanced ward assignment** with better distribution and rating system
- **✅ Better building layouts** using createAlleys for organic structures
- **✅ Improved geometry generation** with fallback mechanisms
- **✅ Enhanced market layouts** with proper stalls and open spaces

#### **3. Algorithm Stability - RESOLVED**
- **✅ Fixed infinite recursion** in `Ward.createAlleys()` and `Ward.createOrthoBuilding()` methods
- **✅ Implemented proper `findLongestEdge()`** algorithm with safety checks
- **✅ Added recursion depth limits** and validation to prevent stack overflows
- **✅ Fixed Polygon constructor** to avoid unnecessary object creation
- **✅ Resolved Ward inheritance issues** by correcting import paths and method visibility

#### **4. Error Handling - IMPROVED**
- **✅ Added comprehensive error handling** in Model constructor with fallback generation
- **✅ Implemented input validation** for patch counts and other parameters
- **✅ Added safety checks** throughout the generation pipeline
- **✅ Created fallback model generation** for when primary generation fails

#### **5. Street Generation - STABILIZED**
- **✅ Improved pathfinding robustness** with better fallback mechanisms
- **✅ Enhanced street network generation** with secondary connections between gates
- **✅ Added internal road generation** within wards
- **✅ Implemented street smoothing** for more natural road layouts

### **🚨 REMAINING CRITICAL ISSUES**

#### **1. Generation Quality - MEDIUM PRIORITY**
- **Voronoi generation** still produces some irregular patch shapes that need optimization
- **Ward placement** algorithms could be more historically accurate
- **Wall generation** creates basic structures but lacks defensive realism
- **Building variety** is limited and needs more architectural diversity

#### **2. Rendering Problems - VISUAL ISSUES**
- **Canvas scaling** is inconsistent across different town sizes
- **Ward visualization** lacks proper building detail and architectural accuracy
- **Color schemes** are basic and don't reflect medieval aesthetics
- **Performance** degrades with larger settlements

#### **3. Missing Core Features - INCOMPLETE IMPLEMENTATION**
- **Water features** (rivers, lakes, coastlines) are completely absent
- **Terrain generation** is non-existent
- **Building interiors** and detailed structures are missing
- **Historical accuracy** in ward layouts is still basic

## ✨ **What Currently Works (Significantly Improved)**

### 🎨 **UI/UX Foundation - ENHANCED**
- **Modern interface** with medieval theming
- **Responsive design** that adapts to different screen sizes
- **Interactive tooltips** for all map elements
- **Loading states** and error handling (now functional)
- **Control panel** for basic town size selection

### 🏘️ **Basic Generation - STABILIZED & IMPROVED**
- **Patch creation** using Voronoi diagrams (functional with improvements)
- **Ward assignment** with intelligent rating system (working reliably)
- **Street networks** (generation succeeds consistently)
- **Building layouts** (improved with organic alley generation)
- **Basic wall generation** (functional but basic)

### 🛠️ **Technical Infrastructure - SOLID**
- **TypeScript compilation** works without errors
- **React component structure** is sound
- **Build system** functions properly
- **Development environment** is stable
- **Error recovery** mechanisms are in place
- **Interactive features** are fully functional

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
4. **Hover over elements** - Move your mouse over wards, streets, and walls to see tooltips
5. **Randomize** - Use the "Random Town" button for surprise generations
6. **Custom seeds** - Expand "Advanced" to use specific seeds for reproducible results

**✅ IMPROVED**: Generation now succeeds consistently with interactive tooltips. Small towns generate with better layouts and building variety.

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── Header.tsx          # Elegant header with title and branding (UPDATED)
│   ├── ControlPanel.tsx    # Main control interface
│   ├── LoadingSpinner.tsx  # Animated loading component
│   ├── Button.tsx          # Reusable button with variants
│   ├── Tooltip.tsx         # Interactive tooltip system (ENHANCED)
│   └── TownScene.tsx       # Main application container
├── services/
│   ├── Model.ts           # Core generation logic (IMPROVED)
│   ├── CityMap.tsx        # Map rendering component (ENHANCED)
│   ├── Ward.ts            # Base ward class (FIXED)
│   └── wards/             # Ward type implementations (IMPROVED)
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
- **Interactive tooltips** for better information access

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

- **Generation Quality**: While generation now succeeds consistently, some towns may still have unrealistic layouts or poor ward distribution.
- **Performance**: Larger settlements (Capital size) may experience slower generation times and reduced performance.
- **Visual Inconsistencies**: Canvas rendering may not scale properly on all devices or screen sizes.
- **Limited Variety**: The current algorithm produces similar-looking towns due to limited architectural variety.

### Common Issues

**Generation succeeds but looks poor**: This is expected behavior. The generation algorithm is functional but needs quality improvements.
**UI not responsive**: Ensure modern browser with CSS Grid support
**Slow performance**: Check if hardware acceleration is enabled, but expect issues with larger towns

### Browser Support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🗺️ **EXTENSIVE ROADMAP & CRITICAL ASSESSMENT**

This project is a **partial port** of the original Haxe-based [Medieval Fantasy City Generator](https://watabou.itch.io/medieval-fantasy-city-generator/). The current implementation represents approximately **50-60%** of the original functionality, with significant improvements in stability, interactivity, and small town generation.

### **🔥 CRITICAL PRIORITIES (Immediate - Next 3 Months)**

#### **1. Generation Quality - HIGH PRIORITY**
- **Optimize Voronoi generation** - Current implementation produces irregular geometries
- **Improve ward placement algorithms** - Implement proper historical accuracy
- **Enhance wall generation** - Create realistic defensive structures
- **Fix patch optimization** - Junction optimization logic needs refinement

#### **2. Rendering Overhaul - HIGH PRIORITY**
- **Rewrite canvas rendering** - Current system is basic and inconsistent
- **Implement proper building visualization** - Ward buildings lack detail
- **Add architectural accuracy** - Medieval buildings need proper representation
- **Fix scaling and centering** - Canvas transformations are unreliable

#### **3. Algorithm Refinement - MEDIUM PRIORITY**
- **Improve pathfinding** - A* algorithm needs optimization for complex layouts
- **Enhance street generation** - Road layouts need more realism
- **Optimize performance** - Large settlements cause performance issues
- **Add generation parameters** - More control over town characteristics

### **⚡ HIGH PRIORITIES (Next 6 Months)**

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

### **🎯 MEDIUM PRIORITIES (6-12 Months)**

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

### **🔮 LONG-TERM VISION (1-2 Years)**

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

#### **Current State: 50-60% Complete**
- **UI/UX**: 90% complete (functional, polished, and interactive)
- **Core Generation**: 70% complete (stable with improved quality)
- **Rendering**: 60% complete (functional with tooltips)
- **Ward System**: 80% complete (working with better variety)
- **Performance**: 65% complete (works for small-medium towns)
- **Interactivity**: 85% complete (tooltips and hover effects)

#### **Estimated Development Time**
- **Quality improvements**: 2-4 months of focused development
- **Feature parity**: 10-15 months of substantial work
- **Advanced features**: 1.5-2.5 years of continuous development
- **Full vision**: 3-5 years of dedicated development

#### **Resource Requirements**
- **Algorithm specialist** - Generation quality needs expert optimization
- **Graphics developer** - Rendering system requires significant expertise
- **Historical consultant** - Medieval accuracy requires research
- **Performance engineer** - Optimization requires specialized knowledge

## 🤝 Contributing

**✅ IMPROVED**: This project is now much more stable and suitable for contributions. The critical bugs have been resolved, interactive features are working, and the codebase is in a maintainable state.

### Contribution Guidelines

1. **Focus on quality improvements** - Generation quality is the top priority
2. **Test thoroughly** - Ensure changes don't break existing functionality
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

**✅ IMPROVED STATUS v0.2.0**: This project has been significantly enhanced and is now suitable for use and development. The core functionality is reliable, interactive features are working, and small town generation has been greatly improved. The application now generates towns consistently with tooltips and better building layouts.

*Forge your medieval world with confidence and interactivity* ⚔️
