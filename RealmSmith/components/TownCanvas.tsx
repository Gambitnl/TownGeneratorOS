
import React, { useEffect, useRef, useState } from 'react';
import { TownGenerator } from '../services/townGenerator';
import { AssetPainter } from '../services/assetPainter';
import { TownMap, TownOptions, BiomeType, TownDensity } from '../types';
import { RefreshCw, Download, Map as MapIcon, Compass, TreeDeciduous, Home, Sparkles, BookOpen, ZoomIn, ZoomOut, Maximize, Move, Moon, Sun, Grid } from 'lucide-react';
import { AiTools } from './AiTools';
import { Glossary } from './Glossary';

const TownCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for Generation Options
  const [seed, setSeed] = useState<number>(Date.now());
  const [biome, setBiome] = useState<BiomeType>(BiomeType.PLAINS);
  const [density, setDensity] = useState<TownDensity>(TownDensity.MEDIUM);
  const [connections, setConnections] = useState({
    north: true,
    east: true,
    south: true,
    west: true
  });

  // View Options
  const [isNight, setIsNight] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [mapData, setMapData] = useState<TownMap | null>(null);
  const [showAiTools, setShowAiTools] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  // Viewport State (Zoom/Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number}>({ x: 0, y: 0 });

  // Generate function
  const generateMap = () => {
    setLoading(true);
    // Yield to UI thread so loading spinner shows
    setTimeout(() => {
        try {
            const options: TownOptions = {
                seed,
                biome,
                density,
                connections
            };
            const generator = new TownGenerator(options);
            const map = generator.generate();
            setMapData(map);
        } catch (error) {
            console.error("Failed to generate map:", error);
        } finally {
            setLoading(false);
            // Reset view on regenerate
            setZoom(1);
            setPan({ x: 0, y: 0 });
        }
    }, 50);
  };

  // Effect to generate on any param change
  useEffect(() => {
    generateMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, biome, density, connections]);

  // Painting Effect
  useEffect(() => {
    if (!canvasRef.current || !mapData) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Canvas sizing
    const TILE_SIZE = 32;
    canvasRef.current.width = mapData.width * TILE_SIZE;
    canvasRef.current.height = mapData.height * TILE_SIZE;

    // Clear
    ctx.fillStyle = '#111827'; // Tailwind gray-900
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    try {
        const painter = new AssetPainter(ctx);
        painter.drawMap(mapData.tiles, mapData.buildings, mapData.biome, { isNight, showGrid });
    } catch (err) {
        console.error("AssetPainter failed:", err);
        ctx.fillStyle = '#ef4444'; // Red error
        ctx.font = '16px sans-serif';
        ctx.fillText("Rendering Error. Check console.", 20, 30);
    }

  }, [mapData, isNight, showGrid]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `town-${biome.toLowerCase()}-${seed}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleRandomize = () => {
    setSeed(Math.floor(Math.random() * 100000));
  };

  const toggleConnection = (dir: keyof typeof connections) => {
      setConnections(prev => ({...prev, [dir]: !prev[dir]}));
  };

  // --- Zoom & Pan Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); // Prevent browser zoom
    }
    // Zoom logic
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(0.1, zoom + scaleAmount * zoom), 5);
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center w-full h-full min-h-screen bg-gray-900 text-gray-100 p-6">
      
      <AiTools isOpen={showAiTools} onClose={() => setShowAiTools(false)} />
      <Glossary isOpen={showGlossary} onClose={() => setShowGlossary(false)} />

      {/* Header & Controls */}
      <header className="w-full flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MapIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-wider text-white">Realmsmith</h1>
            <p className="text-gray-400 text-sm">Procedural D&D Town Generator</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-700 w-full xl:w-auto">
           
           {/* Seed Control */}
           <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-mono uppercase mb-1">Seed</label>
             <div className="flex gap-2">
                 <input 
                    type="number" 
                    value={seed} 
                    onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                    className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-2 py-1 w-24 focus:outline-none focus:border-blue-500 font-mono"
                 />
                 <button onClick={handleRandomize} title="Randomize" className="bg-gray-700 hover:bg-gray-600 p-1 rounded text-white">
                    <RefreshCw size={16} />
                 </button>
             </div>
           </div>

           <div className="h-8 w-px bg-gray-600 mx-1 hidden md:block"></div>

           {/* Biome Control */}
           <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-mono uppercase mb-1 flex items-center gap-1"><TreeDeciduous size={10}/> Biome</label>
             <select 
                value={biome} 
                onChange={(e) => setBiome(e.target.value as BiomeType)}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500 max-w-[150px]"
             >
                 {Object.values(BiomeType).map((b) => (
                    <option key={b} value={b}>{b.replace('_', ' ')}</option>
                 ))}
             </select>
           </div>

           {/* Density Control */}
           <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-mono uppercase mb-1 flex items-center gap-1"><Home size={10}/> Density</label>
             <select 
                value={density} 
                onChange={(e) => setDensity(e.target.value as TownDensity)}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
             >
                 <option value={TownDensity.VERY_SPARSE}>Very Sparse</option>
                 <option value={TownDensity.SPARSE}>Sparse</option>
                 <option value={TownDensity.MEDIUM}>Medium</option>
                 <option value={TownDensity.HIGH}>High</option>
                 <option value={TownDensity.EXTREME}>Extreme</option>
             </select>
           </div>

           <div className="h-8 w-px bg-gray-600 mx-1 hidden md:block"></div>

           {/* Connections Control */}
           <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-mono uppercase mb-1 flex items-center gap-1"><Compass size={10}/> Exits</label>
             <div className="flex gap-1">
                {['north', 'south', 'east', 'west'].map((dir) => (
                    <button
                        key={dir}
                        onClick={() => toggleConnection(dir as keyof typeof connections)}
                        className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold border ${
                            connections[dir as keyof typeof connections] 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
                        }`}
                        title={`Toggle ${dir} exit`}
                    >
                        {dir[0].toUpperCase()}
                    </button>
                ))}
             </div>
           </div>

           <div className="h-8 w-px bg-gray-600 mx-1 hidden md:block"></div>

           {/* Actions */}
           <button 
            onClick={() => generateMap()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-bold shadow-lg ml-auto md:ml-0"
            disabled={loading}
           >
             <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             <span className="hidden md:inline">Regenerate</span>
           </button>
           
           <button 
            onClick={() => setShowGlossary(true)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors font-bold"
            title="Open Codex"
           >
             <BookOpen size={18} />
           </button>

           <button 
            onClick={() => setShowAiTools(true)}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors font-bold"
            title="AI Studio"
           >
             <Sparkles size={18} />
             <span className="hidden lg:inline">AI Studio</span>
           </button>

           <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg transition-colors font-bold"
            title="Download PNG"
           >
             <Download size={18} />
           </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main 
        className="relative w-full flex-1 bg-gray-950 rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30 bg-opacity-90">
             <RefreshCw size={48} className="animate-spin text-blue-500 mb-4" />
             <h2 className="text-xl font-serif animate-pulse">Forging World...</h2>
          </div>
        )}
        
        {/* Map Toggles (Top Right) */}
        <div className="absolute top-6 right-6 flex gap-2 z-20">
            <button 
                onClick={() => setIsNight(!isNight)} 
                className={`p-3 rounded-lg transition-colors shadow-lg flex items-center gap-2 font-bold ${isNight ? 'bg-indigo-900 text-indigo-200 border border-indigo-500' : 'bg-yellow-100 text-orange-600 border border-yellow-300'}`}
                title="Toggle Day/Night"
            >
                {isNight ? <Moon size={20} /> : <Sun size={20} />}
                <span>{isNight ? 'Night' : 'Day'}</span>
            </button>
            <button 
                onClick={() => setShowGrid(!showGrid)} 
                className={`p-3 rounded-lg transition-colors shadow-lg border ${showGrid ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}`}
                title="Toggle Grid"
            >
                <Grid size={20} />
            </button>
        </div>

        {/* Zoom Controls (Bottom Right) */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20 bg-gray-800/80 backdrop-blur p-2 rounded-lg border border-gray-700">
            <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="p-2 hover:bg-gray-700 rounded text-white transition-colors" title="Zoom In">
                <ZoomIn size={20} />
            </button>
            <button onClick={resetView} className="p-2 hover:bg-gray-700 rounded text-white transition-colors" title="Reset View">
                <Maximize size={20} />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.1))} className="p-2 hover:bg-gray-700 rounded text-white transition-colors" title="Zoom Out">
                <ZoomOut size={20} />
            </button>
        </div>

        {/* Drag Indicator */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none opacity-50 flex items-center gap-2 bg-black/40 p-2 rounded text-xs">
            <Move size={14} />
            <span>Drag to Pan • Scroll to Zoom</span>
        </div>

        <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden">
             <div 
                style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
             >
                <canvas 
                    ref={canvasRef} 
                    className="max-w-none shadow-2xl rounded-sm"
                    style={{ imageRendering: 'pixelated' }}
                />
             </div>
        </div>
      </main>
      
      <footer className="mt-6 text-gray-500 text-xs flex gap-6">
        <span>Left-Click: View Details (N/A)</span>
        <span>Scroll: Zoom ({Math.round(zoom * 100)}%)</span>
        <span>Generated with &lt;Canvas /&gt;</span>
      </footer>
    </div>
  );
};

export default TownCanvas;
