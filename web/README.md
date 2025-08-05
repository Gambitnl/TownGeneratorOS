# 🏰 Medieval Town Generator

A sophisticated web application for generating procedural medieval settlements with an immersive, modern UI. Create unique towns, cities, and villages with realistic layouts, districts, walls, and road networks.

## ✨ Features

### 🎨 **Modern UI Design**
- **Medieval-themed interface** with gold and bronze accents
- **Glassmorphism effects** with backdrop blur and transparency
- **Smooth animations** and transitions throughout
- **Responsive design** that works on desktop, tablet, and mobile
- **Accessibility features** including proper focus states and reduced motion support

### 🏘️ **Settlement Generation**
- **Multiple settlement sizes**: Village (4-8 districts), Town (8-15), City (15-25), Capital (25-40)
- **Procedural generation** with customizable seeds for reproducible results
- **Realistic layouts** including walls, gates, districts, and road networks
- **Advanced options** for custom seeds and fine-tuned generation

### 🛠️ **User Experience**
- **Intuitive control panel** with organized sections
- **Real-time loading indicators** with contextual messages
- **Error handling** with graceful fallbacks
- **Tooltip system** for interactive guidance
- **Progressive enhancement** with smooth state transitions

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
│   ├── Model.ts           # Core generation logic
│   ├── CityMap.tsx        # Map rendering component
│   └── ...                # Other services
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

-   **Map Generation Failures:** The application currently fails to render the generated town. Instead, it displays a blank area where the map should be. This is often accompanied by errors in the developer console.
-   **Generation Errors:** The procedural generation frequently fails with errors like `Error: Unable to build a street!` and `Error: Bad citadel shape!`. These errors originate in the core `Model.ts` logic and indicate that the port of the generation algorithm is incomplete and unstable. Debugging these issues is a top priority.

### Common Issues

**Generation fails**: Try a smaller settlement size or refresh the page
**UI not responsive**: Ensure modern browser with CSS Grid support
**Slow performance**: Check if hardware acceleration is enabled

### Browser Support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🗺️ Roadmap & Future Work

This project is an active port of the original Haxe-based [Medieval Fantasy City Generator](https://watabou.itch.io/medieval-fantasy-city-generator/). While the new web application provides a modern UI and a solid foundation, there is still work to be done to achieve full feature parity and realize the complete vision.

### Core Logic Porting
The highest priority is to complete the port of the core generation logic from the original Haxe codebase. Key missing components include:
-   **Wards:** Porting the remaining district types (e.g., `Cathedral`, `Market`, `Slums`, `CraftsmenWard`) to create more diverse cities.
-   **Geometry & Mapping:** Implementing missing geometry algorithms like `Voronoi`, `Graph`, and `Spline` which are crucial for city layout.
-   **Utilities:** Migrating the remaining helper functions from the original `utils` library.

### Feature Parity
The original generator has features not yet implemented in this version. The following are key goals:
-   **Waterbodies:** Adding procedurally generated rivers, lakes, and coastlines.
-   **Expanded Options UI:** Creating a more detailed control panel to expose more generation parameters to the user.

### Potential Enhancements
-   **Wave Function Collapse (WFC):** The project is set up to use WFC. Integrating this for building and texture generation would dramatically increase the detail and realism of the output.
-   **UI/UX Polish:** Continue to refine the user interface to fully match the ambitious design goals, focusing on animations, interactivity, and visual feedback.
-   **Performance Optimization:** Continuously profile and optimize the generation algorithms to ensure a smooth experience, especially for larger cities.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Medieval town generation algorithms
- Modern web technologies and frameworks
- Open source community contributions

---

*Forge your medieval world with style and precision* ⚔️
