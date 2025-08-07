import React from 'react';
import { BuildingPlan, Room, ExteriorFeature, RoomFurniture } from '../services/ProceduralBuildingGenerator';
import { AssetManager } from '../services/AssetManager';

interface ProceduralBuildingRendererProps {
  building: BuildingPlan;
  scale: number;
  showGrid?: boolean;
  showRoomLabels?: boolean;
  showFurniture?: boolean;
}

const ProceduralBuildingRenderer: React.FC<ProceduralBuildingRendererProps> = ({
  building,
  scale,
  showGrid = true,
  showRoomLabels = true,
  showFurniture = true
}) => {
  const GRID_SIZE = 25 * scale; // Each tile is 25px * scale (representing 5 feet)
  const svgWidth = building.lotWidth * GRID_SIZE;
  const svgHeight = building.lotHeight * GRID_SIZE;

  const renderGrid = () => {
    if (!showGrid) return null;
    
    const lines = [];
    
    // Vertical lines
    for (let x = 0; x <= building.lotWidth; x++) {
      const isMajor = x % 5 === 0; // Every 5th line is major (25 feet)
      lines.push(
        <line
          key={`v-${x}`}
          x1={x * GRID_SIZE}
          y1={0}
          x2={x * GRID_SIZE}
          y2={svgHeight}
          stroke={isMajor ? "#666" : "#999"}
          strokeWidth={isMajor ? "2" : "1"}
          opacity={isMajor ? "0.9" : "0.6"}
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= building.lotHeight; y++) {
      const isMajor = y % 5 === 0; // Every 5th line is major (25 feet)
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y * GRID_SIZE}
          x2={svgWidth}
          y2={y * GRID_SIZE}
          stroke={isMajor ? "#666" : "#999"}
          strokeWidth={isMajor ? "2" : "1"}
          opacity={isMajor ? "0.9" : "0.6"}
        />
      );
    }
    
    return <g className="grid">{lines}</g>;
  };

  const renderExteriorFeatures = () => {
    return building.exteriorFeatures.map((feature) => renderExteriorFeature(feature));
  };

  const renderExteriorFeature = (feature: ExteriorFeature) => {
    const x = feature.x * GRID_SIZE;
    const y = feature.y * GRID_SIZE;
    const width = feature.width * GRID_SIZE;
    const height = feature.height * GRID_SIZE;

    const colors = {
      garden: '#90EE90',
      well: '#8B4513',
      cart: '#8B4513',
      fence: '#654321',
      path: '#D2B48C',
      tree: '#228B22',
      decoration: '#DDA0DD',
      storage: '#696969'
    };

    const color = colors[feature.type] || '#999';

    return (
      <g key={feature.id} className={`exterior-feature ${feature.type}`}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          stroke="#333"
          strokeWidth="1"
          opacity="0.7"
        />
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(8, GRID_SIZE * 0.3)}
          fill="#333"
          fontWeight="bold"
        >
          {feature.type.charAt(0).toUpperCase()}
        </text>
      </g>
    );
  };

  const renderBuilding = () => {
    const buildingX = building.buildingX * GRID_SIZE;
    const buildingY = building.buildingY * GRID_SIZE;
    const buildingWidth = building.buildingWidth * GRID_SIZE;
    const buildingHeight = building.buildingHeight * GRID_SIZE;

    return (
      <g className="building">
        {/* Building foundation */}
        <rect
          x={buildingX}
          y={buildingY}
          width={buildingWidth}
          height={buildingHeight}
          fill="#F5F5DC"
          stroke="#8B4513"
          strokeWidth="2"
        />
        
        {/* Render each room */}
        {building.rooms.map(room => renderRoom(room))}
      </g>
    );
  };

  const renderRoom = (room: Room) => {
    const roomX = (building.buildingX + room.x) * GRID_SIZE;
    const roomY = (building.buildingY + room.y) * GRID_SIZE;
    const roomWidth = room.width * GRID_SIZE;
    const roomHeight = room.height * GRID_SIZE;

    const roomColors = {
      bedroom: '#FFF8DC',
      kitchen: '#FFE4E1',
      common: '#F0F8FF',
      shop: '#E6E6FA',
      workshop: '#FFDAB9',
      storage: '#F5F5F5',
      entrance: '#FFFACD'
    };

    const roomColor = roomColors[room.type] || '#FFFFFF';

    return (
      <g key={room.id} className={`room ${room.type}`}>
        {/* Room floor */}
        <rect
          x={roomX}
          y={roomY}
          width={roomWidth}
          height={roomHeight}
          fill={roomColor}
          stroke="none"
        />
        
        {/* Room walls */}
        {renderRoomWalls(room)}
        
        {/* Room doors */}
        {room.doors.map((door, index) => renderDoor(room, door, index))}
        
        {/* Room windows */}
        {room.windows.map((window, index) => renderWindow(room, window, index))}
        
        {/* Room furniture */}
        {showFurniture && room.furniture.map(furniture => renderFurniture(room, furniture))}
        
        {/* Room label */}
        {showRoomLabels && (
          <text
            x={roomX + roomWidth / 2}
            y={roomY + roomHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(10, GRID_SIZE * 0.4)}
            fill="#666"
            fontWeight="bold"
            opacity="0.7"
          >
            {room.name}
          </text>
        )}
      </g>
    );
  };

  const renderRoomWalls = (room: Room) => {
    const walls = [];
    const roomX = (building.buildingX + room.x) * GRID_SIZE;
    const roomY = (building.buildingY + room.y) * GRID_SIZE;
    const roomWidth = room.width * GRID_SIZE;
    const roomHeight = room.height * GRID_SIZE;

    const wallThickness = 3;
    
    // Top wall
    walls.push(
      <rect
        key={`${room.id}-wall-top`}
        x={roomX}
        y={roomY}
        width={roomWidth}
        height={wallThickness}
        fill="#8B4513"
      />
    );
    
    // Bottom wall
    walls.push(
      <rect
        key={`${room.id}-wall-bottom`}
        x={roomX}
        y={roomY + roomHeight - wallThickness}
        width={roomWidth}
        height={wallThickness}
        fill="#8B4513"
      />
    );
    
    // Left wall
    walls.push(
      <rect
        key={`${room.id}-wall-left`}
        x={roomX}
        y={roomY}
        width={wallThickness}
        height={roomHeight}
        fill="#8B4513"
      />
    );
    
    // Right wall
    walls.push(
      <rect
        key={`${room.id}-wall-right`}
        x={roomX + roomWidth - wallThickness}
        y={roomY}
        width={wallThickness}
        height={roomHeight}
        fill="#8B4513"
      />
    );

    return walls;
  };

  const renderDoor = (room: Room, door: { x: number; y: number; direction: string }, index: number) => {
    const roomX = (building.buildingX + room.x) * GRID_SIZE;
    const roomY = (building.buildingY + room.y) * GRID_SIZE;
    const doorX = roomX + door.x * GRID_SIZE;
    const doorY = roomY + door.y * GRID_SIZE;
    const doorSize = GRID_SIZE * 0.8;
    const doorThickness = 8;

    let x, y, width, height;

    switch (door.direction) {
      case 'north':
        x = doorX + (GRID_SIZE - doorSize) / 2;
        y = roomY;
        width = doorSize;
        height = doorThickness;
        break;
      case 'south':
        x = doorX + (GRID_SIZE - doorSize) / 2;
        y = roomY + room.height * GRID_SIZE - doorThickness;
        width = doorSize;
        height = doorThickness;
        break;
      case 'east':
        x = roomX + room.width * GRID_SIZE - doorThickness;
        y = doorY + (GRID_SIZE - doorSize) / 2;
        width = doorThickness;
        height = doorSize;
        break;
      case 'west':
        x = roomX;
        y = doorY + (GRID_SIZE - doorSize) / 2;
        width = doorThickness;
        height = doorSize;
        break;
      default:
        return null;
    }

    return (
      <rect
        key={`${room.id}-door-${index}`}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#654321"
        stroke="#8B4513"
        strokeWidth="1"
      />
    );
  };

  const renderWindow = (room: Room, window: { x: number; y: number; direction: string }, index: number) => {
    const roomX = (building.buildingX + room.x) * GRID_SIZE;
    const roomY = (building.buildingY + room.y) * GRID_SIZE;
    const windowX = roomX + window.x * GRID_SIZE;
    const windowY = roomY + window.y * GRID_SIZE;
    const windowSize = GRID_SIZE * 0.6;
    const windowThickness = 6;

    let x, y, width, height;

    switch (window.direction) {
      case 'north':
        x = windowX + (GRID_SIZE - windowSize) / 2;
        y = roomY;
        width = windowSize;
        height = windowThickness;
        break;
      case 'south':
        x = windowX + (GRID_SIZE - windowSize) / 2;
        y = roomY + room.height * GRID_SIZE - windowThickness;
        width = windowSize;
        height = windowThickness;
        break;
      case 'east':
        x = roomX + room.width * GRID_SIZE - windowThickness;
        y = windowY + (GRID_SIZE - windowSize) / 2;
        width = windowThickness;
        height = windowSize;
        break;
      case 'west':
        x = roomX;
        y = windowY + (GRID_SIZE - windowSize) / 2;
        width = windowThickness;
        height = windowSize;
        break;
      default:
        return null;
    }

    return (
      <rect
        key={`${room.id}-window-${index}`}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#ADD8E6"
        stroke="#4682B4"
        strokeWidth="1"
        opacity="0.8"
      />
    );
  };

  const renderFurniture = (room: Room, furniture: RoomFurniture) => {
    const roomX = (building.buildingX + room.x) * GRID_SIZE;
    const roomY = (building.buildingY + room.y) * GRID_SIZE;
    const furnitureX = roomX + furniture.x * GRID_SIZE + (GRID_SIZE * 0.1);
    const furnitureY = roomY + furniture.y * GRID_SIZE + (GRID_SIZE * 0.1);
    const furnitureWidth = (furniture.width * GRID_SIZE) * 0.8;
    const furnitureHeight = (furniture.height * GRID_SIZE) * 0.8;

    const furnitureColors = {
      seating: '#8B4513',
      storage: '#A0522D',
      lighting: '#FFD700',
      work: '#696969',
      decoration: '#DDA0DD',
      sleeping: '#4169E1',
      cooking: '#B22222',
      display: '#DEB887'
    };

    const color = furnitureColors[furniture.purpose as keyof typeof furnitureColors] || '#999';

    // Check if we have the actual asset
    if (furniture.asset && furniture.asset.path !== `/assets/furniture/${furniture.asset.name}.png`) {
      // Render as an image if we have a real asset
      return (
        <g key={furniture.id} className={`furniture ${furniture.purpose}`}>
          <image
            x={furnitureX}
            y={furnitureY}
            width={furnitureWidth}
            height={furnitureHeight}
            href={furniture.asset.path}
            transform={furniture.rotation ? `rotate(${furniture.rotation} ${furnitureX + furnitureWidth/2} ${furnitureY + furnitureHeight/2})` : undefined}
            onError={(e) => {
              // Fallback to colored rectangle if image fails to load
              const target = e.target as SVGImageElement;
              target.style.display = 'none';
            }}
          />
          {/* Fallback rectangle */}
          <rect
            x={furnitureX}
            y={furnitureY}
            width={furnitureWidth}
            height={furnitureHeight}
            fill={color}
            stroke="#333"
            strokeWidth="1"
            opacity="0.8"
            rx="2"
          />
        </g>
      );
    }

    // Render as a colored rectangle with label
    return (
      <g key={furniture.id} className={`furniture ${furniture.purpose}`}>
        <rect
          x={furnitureX}
          y={furnitureY}
          width={furnitureWidth}
          height={furnitureHeight}
          fill={color}
          stroke="#333"
          strokeWidth="1"
          opacity="0.8"
          rx="2"
        />
        <text
          x={furnitureX + furnitureWidth / 2}
          y={furnitureY + furnitureHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(6, GRID_SIZE * 0.2)}
          fill="#FFF"
          fontWeight="bold"
        >
          {furniture.purpose.charAt(0).toUpperCase()}
        </text>
      </g>
    );
  };

  return (
    <div className="procedural-building-renderer">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          border: '2px solid #666',
          backgroundColor: '#f9f9f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        {/* Render lot background */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="#90EE90"
          opacity="0.3"
        />
        
        {/* Render grid */}
        {renderGrid()}
        
        {/* Render exterior features */}
        {renderExteriorFeatures()}
        
        {/* Render building */}
        {renderBuilding()}
        
        {/* Grid scale legend */}
        {showGrid && (
          <g className="grid-legend">
            <rect
              x={10}
              y={10}
              width={GRID_SIZE * 2 + 10}
              height={30}
              fill="rgba(255,255,255,0.9)"
              stroke="#666"
              strokeWidth="1"
              rx="3"
            />
            <line
              x1={15}
              y1={25}
              x2={15 + GRID_SIZE}
              y2={25}
              stroke="#666"
              strokeWidth="2"
            />
            <text
              x={15 + GRID_SIZE/2}
              y={38}
              textAnchor="middle"
              fontSize={Math.max(8, GRID_SIZE * 0.3)}
              fill="#333"
              fontWeight="bold"
            >
              5 ft
            </text>
            {GRID_SIZE >= 20 && (
              <text
                x={15 + GRID_SIZE * 1.5}
                y={22}
                fontSize={Math.max(6, GRID_SIZE * 0.2)}
                fill="#666"
              >
                = 1 tile
              </text>
            )}
          </g>
        )}
      </svg>
      
      {/* Building info panel */}
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <strong>{building.buildingType.replace('_', ' ').toUpperCase()}</strong> - 
        {building.socialClass.toUpperCase()} Class
        <br />
        <strong>Building:</strong> {building.buildingWidth * 5}×{building.buildingHeight * 5} feet ({building.buildingWidth}×{building.buildingHeight} tiles)
        <br />
        <strong>Lot:</strong> {building.lotWidth * 5}×{building.lotHeight * 5} feet ({building.lotWidth}×{building.lotHeight} tiles)
        <br />
        <strong>Scale:</strong> {scale}x, Grid Size: {GRID_SIZE}px per 5-foot square
        <br />
        <strong>Rooms:</strong> {building.rooms.map(r => r.name).join(', ')}
        <br />
        <strong>Materials:</strong> {building.wallMaterial} walls, {building.roofMaterial} roof
      </div>
    </div>
  );
};

export default ProceduralBuildingRenderer;