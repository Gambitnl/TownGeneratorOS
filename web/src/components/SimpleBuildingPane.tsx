import React, { useRef, useEffect, useState } from 'react';
import { SimpleBuilding } from '../services/SimpleBuildingGenerator';
import { SimpleBuildingRenderer, RenderOptions } from '../services/SimpleBuildingRenderer';
import { GlossarySidebar } from './GlossarySidebar';
import { GlossaryItem } from '../services/GlossaryGenerator';

interface SimpleBuildingPaneProps {
  building: SimpleBuilding;
  scale?: number;
  showGrid?: boolean;
  showLighting?: boolean;
  age?: number;
  climate?: string;
}

export const SimpleBuildingPane: React.FC<SimpleBuildingPaneProps> = ({
  building,
  scale = 1,
  showGrid = true,
  showLighting = true,
  age = 10,
  climate = 'temperate'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredItem, setHoveredItem] = useState<GlossaryItem | null>(null);
  const TILE_SIZE = 20;
  const scaledTileSize = TILE_SIZE * scale;
  
  // Calculate canvas dimensions
  const lotWidth = building.width + 8; // Building + buffer
  const lotHeight = building.height + 8;
  const canvasWidth = lotWidth * scaledTileSize;
  const canvasHeight = lotHeight * scaledTileSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas actual size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const renderOptions: RenderOptions = {
      tileSize: scaledTileSize,
      showGrid,
      showLighting,
      age,
      climate
    };

    SimpleBuildingRenderer.renderToCanvas(building, canvas, renderOptions);
    
    // Highlight hovered items if any
    if (hoveredItem) {
      highlightItemOnCanvas(canvas, hoveredItem);
    }
  }, [building, scaledTileSize, canvasWidth, canvasHeight, showGrid, showLighting, age, climate, hoveredItem]);

  const highlightItemOnCanvas = (canvas: HTMLCanvasElement, item: GlossaryItem) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find matching elements in the building
    if (item.type === 'furniture') {
      building.rooms.forEach(room => {
        room.furniture.forEach(furniture => {
          if (furniture.type === item.id || furniture.name.toLowerCase().includes(item.name.toLowerCase())) {
            // Highlight furniture with a glowing border
            const x = (furniture.x + 4) * scaledTileSize;
            const y = (furniture.y + 4) * scaledTileSize;
            const width = furniture.width * scaledTileSize;
            const height = furniture.height * scaledTileSize;
            
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
            ctx.setLineDash([]);
            
            // Add a subtle glow effect
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
            ctx.shadowBlur = 0;
          }
        });
      });
    }
  };

  const handleItemHover = (item: GlossaryItem | null) => {
    setHoveredItem(item);
  };

  return (
    <div className="simple-building-pane">
      <div className="building-info">
        <h3>{building.type.replace('_', ' ')} - {building.socialClass} class</h3>
        <div className="building-stats">
          <span>Size: {building.width}×{building.height} tiles</span>
          <span>Rooms: {building.rooms.length}</span>
        </div>
      </div>
      
      <div className="building-canvas-container" style={{ 
        border: '2px solid #8B4513',
        borderRadius: '4px',
        padding: '10px',
        backgroundColor: '#f5f5dc',
        display: 'inline-block'
      }}>
        <canvas 
          ref={canvasRef}
          style={{
            border: '1px solid #654321',
            backgroundColor: '#228B22'
          }}
        />
      </div>
      
      <div className="room-list" style={{ 
        marginTop: '10px', 
        fontSize: '14px' 
      }}>
        <h4>Rooms:</h4>
        <ul>
          {building.rooms.map(room => (
            <li key={room.id}>
              {room.name} ({room.width}×{room.height}) - {room.furniture.length} furniture items
            </li>
          ))}
        </ul>
      </div>
      
      {building.exteriorFeatures.length > 0 && (
        <div className="exterior-features" style={{ 
          marginTop: '10px', 
          fontSize: '14px' 
        }}>
          <h4>Exterior Features:</h4>
          <ul>
            {building.exteriorFeatures.map(feature => (
              <li key={feature.id}>
                {feature.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Glossary Sidebar */}
      <GlossarySidebar
        buildingType={building.type}
        socialClass={building.socialClass}
        onItemHover={handleItemHover}
        show={true}
      />
    </div>
  );
};