import React, { useRef, useEffect, useState } from 'react';
import { GridModel } from './GridModel';
import { TileType } from '@/types/tile';

interface CityMapProps {
  model: GridModel;
  showGrid: boolean;
  showZones: boolean;
  showWater: boolean;
}

const TILE_SIZE = 64;
const TILE_IMAGES: Record<string, HTMLImageElement> = {};
const IMAGE_NAMES = ['grass', 'road_straight', 'road_corner', 'road_tee', 'road_cross', 'house', 'water'];

export const CityMap: React.FC<CityMapProps> = ({ model, showGrid, showZones, showWater }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load images on mount
  useEffect(() => {
    let loadedCount = 0;
    IMAGE_NAMES.forEach(name => {
      const img = new Image();
      // Use PNGs for generated assets, fallback to SVG if needed (but we are replacing them now)
      // Actually, let's stick to one format. I will copy the PNGs to the assets folder.
      // For the road variants, I'll reuse the straight road for now or generate more.
      // Let's assume we have PNGs for everything or fallback.
      // For now, let's switch to .png and I will duplicate the road texture for other variants temporarily.
      img.src = `/assets/tiles/${name}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === IMAGE_NAMES.length) {
          setImagesLoaded(true);
        }
      };
      TILE_IMAGES[name] = img;
    });
  }, []);

  // Pan and zoom state
  const [scale, setScale] = useState(0.5);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle export event
  useEffect(() => {
    const handleExport = () => {
      if (canvasRef.current) {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `medieval-town-${timestamp}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
      }
    };

    window.addEventListener('exportCanvas', handleExport);
    return () => window.removeEventListener('exportCanvas', handleExport);
  }, []);

  // Pan/Zoom event handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => Math.min(Math.max(prevScale * delta, 0.1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale / 1.2, 0.1));
  };

  const handleZoomReset = () => {
    setScale(0.5);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match model size * tile size (or fixed size)
    // For now fixed size canvas, but we draw the whole map
    canvas.width = 1200;
    canvas.height = 800;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply transformations
    ctx.translate(offset.x + canvas.width / 2, offset.y + canvas.height / 2);
    ctx.scale(scale, scale);

    // Center the map
    const mapWidth = model.width * TILE_SIZE;
    const mapHeight = model.height * TILE_SIZE;
    ctx.translate(-mapWidth / 2, -mapHeight / 2);

    // Layer 0: Ground (Grass)
    for (let y = 0; y < model.height; y++) {
      for (let x = 0; x < model.width; x++) {
        const posX = x * TILE_SIZE;
        const posY = y * TILE_SIZE;
        if (TILE_IMAGES['grass'] && TILE_IMAGES['grass'].complete) {
          ctx.drawImage(TILE_IMAGES['grass'], posX, posY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Layer 1: Water
    for (let y = 0; y < model.height; y++) {
      for (let x = 0; x < model.width; x++) {
        const tile = model.tiles[y][x];
        if (tile.type === TileType.Water) {
          const posX = x * TILE_SIZE;
          const posY = y * TILE_SIZE;
          // TODO: Add water variants logic here if needed
          if (showWater && TILE_IMAGES['water'] && TILE_IMAGES['water'].complete) {
            ctx.drawImage(TILE_IMAGES['water'], posX, posY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // Layer 2: Roads
    for (let y = 0; y < model.height; y++) {
      for (let x = 0; x < model.width; x++) {
        const tile = model.tiles[y][x];
        if (tile.type === TileType.Road) {
          const posX = x * TILE_SIZE;
          const posY = y * TILE_SIZE;
          const imgName = tile.variant ? `road_${tile.variant}` : 'road_straight';

          if (TILE_IMAGES[imgName] && TILE_IMAGES[imgName].complete) {
            ctx.save();
            ctx.translate(posX + TILE_SIZE / 2, posY + TILE_SIZE / 2);
            ctx.rotate((tile.rotation * Math.PI) / 180);
            ctx.drawImage(TILE_IMAGES[imgName], -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
            ctx.restore();
          }
        }
      }
    }

    // Layer 3: Buildings & Zones
    for (let y = 0; y < model.height; y++) {
      for (let x = 0; x < model.width; x++) {
        const tile = model.tiles[y][x];
        const posX = x * TILE_SIZE;
        const posY = y * TILE_SIZE;

        // Draw Zone Overlay
        if (showZones && tile.zone) {
          ctx.save();
          switch (tile.zone) {
            case 'residential':
              ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Green
              break;
            case 'commercial':
              ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; // Blue
              break;
            case 'industrial':
              ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow
              break;
            case 'park':
              ctx.fillStyle = 'rgba(0, 128, 0, 0.3)'; // Dark Green
              break;
            default:
              ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'; // Gray
          }
          ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
          ctx.restore();
        }

        // Draw Building
        if (tile.type === TileType.House) {
          // Only draw house if we have the image. 
          // If showZones is ON, we might still want to see the house on top? 
          // Task says: "Buildings/Zones are drawn in the correct locations relative to the roads."
          // Usually buildings sit on top of zones.
          if (TILE_IMAGES['house'] && TILE_IMAGES['house'].complete) {
            ctx.drawImage(TILE_IMAGES['house'], posX, posY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // Draw Grid Overlay
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= model.width; x++) {
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, mapHeight);
      }
      for (let y = 0; y <= model.height; y++) {
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(mapWidth, y * TILE_SIZE);
      }
      ctx.stroke();
    }

    ctx.restore();

    // Request animation frame to handle image loading if not ready?
    // For now, we rely on re-renders or images being fast enough. 
    // A simple timeout to force redraw once images load would be better but let's stick to this.

  }, [model, scale, offset, imagesLoaded, showGrid, showZones, showWater]);

  return (
    <div
      ref={containerRef}
      className="canvas-wrapper"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} />

      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
        <input
          type="range"
          className="zoom-slider"
          min="0.1"
          max="5"
          step="0.1"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          title={`Zoom: ${Math.round(scale * 100)}%`}
        />
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
        <button className="zoom-btn zoom-reset" onClick={handleZoomReset} title="Reset Zoom">⟲</button>
      </div>
    </div>
  );
};