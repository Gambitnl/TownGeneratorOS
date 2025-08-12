import React, { useState } from 'react';
import { BuildingPlan } from '../services/StandaloneBuildingGenerator';
import { SimpleBuilding } from '../services/SimpleBuildingGenerator';
import { FloorNavigation } from './FloorNavigation';
import { MedievalFixturesSystem } from '../services/MedievalFixturesSystem';
import { ExteriorArchitecturalSystem } from '../services/ExteriorArchitecturalSystem';
import { InteriorDecorationSystem } from '../services/InteriorDecorationSystem';
import { EnhancedBuildingPane } from './EnhancedBuildingPane';
import { SimpleBuildingPane } from './SimpleBuildingPane';

interface BuildingPaneProps {
  building: BuildingPlan | SimpleBuilding;
  scale?: number;
  showGrid?: boolean;
  showRoomLabels?: boolean;
  showFurniture?: boolean;
  useEnhancedRenderer?: boolean;
  useSimpleRenderer?: boolean;
}

export const BuildingPane: React.FC<BuildingPaneProps> = ({
  building,
  scale = 1,
  showGrid = true,
  showRoomLabels = true,
  showFurniture = true,
  useEnhancedRenderer = false,
  useSimpleRenderer = false
}) => {
  // Check for simple building type first
  if (useSimpleRenderer && 'rooms' in building && !('floors' in building)) {
    return (
      <SimpleBuildingPane
        building={building as SimpleBuilding}
        scale={scale}
        showGrid={showGrid}
        showLighting={true}
      />
    );
  }

  // If enhanced renderer is requested, use the new EnhancedBuildingPane
  if (useEnhancedRenderer) {
    return (
      <EnhancedBuildingPane
        building={building as BuildingPlan}
        scale={scale}
        showGrid={showGrid}
        showRoomLabels={showRoomLabels}
        showAssets={true}
        showCondition={true}
        showLighting={true}
      />
    );
  }
  // Cast to BuildingPlan for legacy renderer
  const buildingPlan = building as BuildingPlan;
  
  const TILE_SIZE = 20; // pixels per 5-foot tile
  const scaledTileSize = TILE_SIZE * scale;
  const [currentFloor, setCurrentFloor] = useState(0); // Current floor being viewed

  // Calculate total dimensions
  const totalWidth = buildingPlan.lotWidth * scaledTileSize;
  const totalHeight = buildingPlan.lotHeight * scaledTileSize;

  const renderStaircaseAccess = (x: number, y: number, direction: 'up' | 'down', targetFloor: number, key: string) => {
    const palette = buildingPlan.aesthetics?.colorPalette;
    const symbol = direction === 'up' ? '🔺' : '🔻'; // Triangle symbols are clearer
    const color = direction === 'up' ? '#4CAF50' : '#FF6B35'; // green for up, orange for down
    const borderColor = direction === 'up' ? '#2E7D32' : '#CC5528';
    const textColor = '#FFF';
    
    return (
      <div
        key={key}
        style={{
          position: 'absolute',
          left: x * scaledTileSize,
          top: y * scaledTileSize,
          width: scaledTileSize,
          height: scaledTileSize,
          backgroundColor: color,
          border: `3px solid ${borderColor}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(12, scaledTileSize * 0.7),
          fontWeight: 'bold',
          color: textColor,
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          cursor: 'pointer',
          zIndex: 10
        }}
        onClick={() => {
          if (targetFloor >= -1 && targetFloor <= Math.max(...(buildingPlan.floors?.map(f => f.level) || [0]))) {
            setCurrentFloor(targetFloor);
          }
        }}
        title={`${direction === 'up' ? 'Go up' : 'Go down'} to floor ${targetFloor}`}
      >
        {symbol}
      </div>
    );
  };

  const renderTile = (x: number, y: number, type: string, material?: string, keyPrefix?: string) => {
    let color = '#8B4513'; // brown for default
    let border = '1px solid #654321';

    // Use aesthetic color palette if available
    const palette = buildingPlan.aesthetics?.colorPalette;

    switch (type) {
      case 'floor':
        if (material?.includes('wood') || material?.includes('oak')) {
          color = '#DEB887'; // Consistent burlywood for wood floors
          border = '1px solid #D2B48C';
        } else if (material?.includes('stone') || material?.includes('granite')) {
          color = '#B0C4DE'; // Light steel blue for stone floors
          border = '1px solid #9999CC';
        } else if (material?.includes('brick')) {
          color = '#CD853F'; // Peru for brick floors
          border = '1px solid #A0522D';
        } else {
          color = '#F5F5DC'; // Consistent beige default
          border = '1px solid #E6E6E6';
        }
        break;
      case 'wall':
        color = palette?.primary || (material === 'stone' ? '#696969' : '#8B4513');
        border = `2px solid ${palette?.trim || '#333'}`;
        break;
      case 'door':
        color = palette?.trim || '#8B4513';
        border = `2px solid ${palette?.foundation || '#654321'}`;
        break;
      case 'window':
        color = '#87CEEB';
        border = `1px solid ${palette?.trim || '#4682B4'}`;
        break;
      case 'staircase':
        color = material === 'stone_granite' ? '#555555' : 
               material === 'stone_limestone' ? '#778899' : 
               '#CD853F'; // saddle brown for wooden stairs
        border = '2px solid #333';
        break;
      default:
        // Debug: log unrecognized tile types
        console.warn(`Unknown tile type: ${type}, material: ${material}`);
        color = '#90EE90'; // light green for exterior
        border = '1px solid #228B22';
    }

    return (
      <div
        key={`${keyPrefix || type}-${x}-${y}`}
        style={{
          position: 'absolute',
          left: x * scaledTileSize,
          top: y * scaledTileSize,
          width: scaledTileSize,
          height: scaledTileSize,
          backgroundColor: color,
          border: border,
          boxSizing: 'border-box'
        }}
      />
    );
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = [];
    
    // Vertical lines
    for (let x = 0; x <= buildingPlan.lotWidth; x++) {
      gridLines.push(
        <div
          key={`vline-${x}`}
          style={{
            position: 'absolute',
            left: x * scaledTileSize,
            top: 0,
            width: 1,
            height: totalHeight,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            pointerEvents: 'none'
          }}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= buildingPlan.lotHeight; y++) {
      gridLines.push(
        <div
          key={`hline-${y}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y * scaledTileSize,
            width: totalWidth,
            height: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            pointerEvents: 'none'
          }}
        />
      );
    }

    return gridLines;
  };

  const renderExteriorTiles = () => {
    const tiles = [];
    
    // Fill lot with exterior/garden tiles
    for (let y = 0; y < buildingPlan.lotHeight; y++) {
      for (let x = 0; x < buildingPlan.lotWidth; x++) {
        // Skip building area
        const isBuilding = x >= buildingPlan.buildingX && 
                          x < buildingPlan.buildingX + buildingPlan.buildingWidth &&
                          y >= buildingPlan.buildingY && 
                          y < buildingPlan.buildingY + buildingPlan.buildingHeight;
        
        if (!isBuilding) {
          tiles.push(renderTile(x, y, 'exterior', undefined, 'ext'));
        }
      }
    }

    return tiles;
  };

  const getCurrentFloorRooms = () => {
    if (buildingPlan.floors && buildingPlan.floors.length > 0) {
      const floor = buildingPlan.floors.find(f => f.level === currentFloor);
      return floor ? floor.rooms : [];
    }
    // Fallback to old rooms array for compatibility
    return buildingPlan.rooms.filter(room => room.floor === currentFloor);
  };

  // Helper function to check if a tile position is a wall
  const isWallTile = (x: number, y: number): boolean => {
    const currentRooms = getCurrentFloorRooms();
    
    // Check room tiles
    for (const room of currentRooms) {
      const tile = room.tiles.find(t => t.x === x && t.y === y);
      if (tile && tile.type === 'wall') {
        return true;
      }
    }
    
    // Check hallway walls if any
    if (buildingPlan.floors && buildingPlan.floors.length > 0) {
      const floor = buildingPlan.floors.find(f => f.level === currentFloor);
      if (floor?.hallways) {
        for (const hallway of floor.hallways) {
          const isHallwayEdge = (x >= hallway.x && x < hallway.x + hallway.width &&
                                y >= hallway.y && y < hallway.y + hallway.height) &&
                               (x === hallway.x || x === hallway.x + hallway.width - 1 ||
                                y === hallway.y || y === hallway.y + hallway.height - 1);
          if (isHallwayEdge) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  // Helper function to check if a position is inside a room (not a wall)
  const isInsideRoom = (x: number, y: number): boolean => {
    const currentRooms = getCurrentFloorRooms();
    
    for (const room of currentRooms) {
      // Check if position is within room bounds
      if (x >= room.x && x < room.x + room.width &&
          y >= room.y && y < room.y + room.height) {
        // Check if it's a floor tile (not a wall)
        const tile = room.tiles.find(t => t.x === x && t.y === y);
        if (tile && tile.type === 'floor') {
          return true;
        }
      }
    }
    
    return false;
  };

  // Light occlusion calculation using simple raycasting
  const calculateLightOcclusion = (sourceX: number, sourceY: number, radius: number): Array<{x: number, y: number, intensity: number}> => {
    const lightTiles: Array<{x: number, y: number, intensity: number}> = [];
    const maxDistance = radius;
    
    // Cast rays in a circular pattern
    for (let y = sourceY - radius; y <= sourceY + radius; y++) {
      for (let x = sourceX - radius; x <= sourceX + radius; x++) {
        const distance = Math.sqrt((x - sourceX) ** 2 + (y - sourceY) ** 2);
        
        // Skip tiles outside the radius
        if (distance > maxDistance) continue;
        
        // Skip the source tile itself
        if (x === sourceX && y === sourceY) continue;
        
        // Only light tiles that are inside rooms
        if (!isInsideRoom(x, y)) continue;
        
        // Check if light can reach this tile (simple line-of-sight)
        if (hasLineOfSight(sourceX, sourceY, x, y)) {
          const intensity = Math.max(0, 1 - (distance / maxDistance));
          lightTiles.push({ x, y, intensity });
        }
      }
    }
    
    return lightTiles;
  };

  // Simple line-of-sight check using Bresenham's line algorithm
  const hasLineOfSight = (x0: number, y0: number, x1: number, y1: number): boolean => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    let x = x0;
    let y = y0;
    
    while (true) {
      // If we hit a wall before reaching the target, line of sight is blocked
      if (isWallTile(x, y)) {
        return false;
      }
      
      // If we reached the target, line of sight is clear
      if (x === x1 && y === y1) {
        return true;
      }
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  };

  const renderHallwayTiles = () => {
    if (!buildingPlan.floors || buildingPlan.floors.length === 0) return [];
    
    const floor = buildingPlan.floors.find(f => f.level === currentFloor);
    if (!floor?.hallways) return [];

    const tiles = [];
    
    floor.hallways.forEach((hallway, hallwayIndex) => {
      // Render hallway floor
      for (let y = hallway.y; y < hallway.y + hallway.height; y++) {
        for (let x = hallway.x; x < hallway.x + hallway.width; x++) {
          // Hallway floor
          tiles.push(renderTile(x, y, 'floor', 'wood_oak', `hallway${hallwayIndex}-floor-${x}-${y}`));
        }
      }
      
      // Render hallway walls (perimeter)
      for (let y = hallway.y; y < hallway.y + hallway.height; y++) {
        for (let x = hallway.x; x < hallway.x + hallway.width; x++) {
          const isEdge = x === hallway.x || x === hallway.x + hallway.width - 1 ||
                        y === hallway.y || y === hallway.y + hallway.height - 1;
          
          if (isEdge) {
            tiles.push(renderTile(x, y, 'wall', 'stone', `hallway${hallwayIndex}-wall-${x}-${y}`));
          }
        }
      }
    });

    return tiles;
  };

  const renderRoomTiles = () => {
    const tiles = [];
    const currentRooms = getCurrentFloorRooms();
    
    currentRooms.forEach((room, roomIndex) => {
      room.tiles.forEach((tile, tileIndex) => {
        tiles.push(renderTile(tile.x, tile.y, tile.type, tile.material, `room${roomIndex}-tile${tileIndex}`));
      });
      
      // Render doors
      room.doors.forEach((door, doorIndex) => {
        tiles.push(renderTile(door.x, door.y, 'door', undefined, `room${roomIndex}-door${doorIndex}`));
      });
      
      // Render windows
      room.windows.forEach((window, windowIndex) => {
        tiles.push(renderTile(window.x, window.y, 'window', undefined, `room${roomIndex}-win${windowIndex}`));
      });
      
      // Render staircase access points
      if (room.stairs) {
        room.stairs.forEach((stair, stairIndex) => {
          tiles.push(renderStaircaseAccess(stair.x, stair.y, stair.direction, stair.targetFloor, `room${roomIndex}-stair${stairIndex}`));
        });
      }
    });

    return tiles;
  };

  const renderFixtures = () => {
    const fixtures = [];
    const currentRooms = getCurrentFloorRooms();
    
    currentRooms.forEach(room => {
      if (!room.fixtures) return;
      
      room.fixtures.forEach(fixture => {
        const fixtureStyle = MedievalFixturesSystem.getFixtureVisualStyle(fixture);
        
        fixtures.push(
          <div
            key={fixture.id}
            style={{
              position: 'absolute',
              left: fixture.x * scaledTileSize + 1,
              top: fixture.y * scaledTileSize + 1,
              width: fixture.width * scaledTileSize - 2,
              height: fixture.height * scaledTileSize - 2,
              backgroundColor: fixtureStyle.color,
              border: `2px solid ${fixtureStyle.borderColor}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${Math.max(10, scaledTileSize * 0.5)}px`,
              fontWeight: 'bold',
              pointerEvents: 'none',
              boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
              zIndex: 6
            }}
            title={`${fixture.name} - ${fixtureStyle.description}`}
          >
            {fixtureStyle.icon}
          </div>
        );
        
        // Render chimney if fixture has one
        if (fixture.type === 'hearth' || fixture.type === 'bread_oven') {
          fixtures.push(
            <div
              key={`${fixture.id}_chimney`}
              style={{
                position: 'absolute',
                left: fixture.x * scaledTileSize + fixture.width * scaledTileSize / 2 - 3,
                top: fixture.y * scaledTileSize - 6,
                width: 6,
                height: 12,
                backgroundColor: '#696969',
                border: '1px solid #333',
                borderRadius: '2px 2px 0 0',
                zIndex: 7,
                pointerEvents: 'none'
              }}
              title="Chimney"
            />
          );
        }
      });
    });

    return fixtures;
  };

  const renderDecorations = () => {
    const decorations = [];
    const currentRooms = getCurrentFloorRooms();
    
    currentRooms.forEach(room => {
      if (!room.decorations) return;
      
      room.decorations.forEach(decoration => {
        const decorationStyle = InteriorDecorationSystem.getDecorationVisualStyle(decoration);
        
        decorations.push(
          <div
            key={decoration.id}
            style={{
              position: 'absolute',
              left: decoration.x * scaledTileSize + 2,
              top: decoration.y * scaledTileSize + 2,
              width: decoration.width * scaledTileSize - 4,
              height: decoration.height * scaledTileSize - 4,
              backgroundColor: decorationStyle.color,
              border: `1px solid ${decorationStyle.borderColor}`,
              borderRadius: decoration.type === 'lighting' ? '50%' : '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${Math.max(8, scaledTileSize * 0.4)}px`,
              fontWeight: 'normal',
              pointerEvents: 'none',
              boxShadow: decoration.lightLevel > 0 ? '0 0 8px rgba(255,215,0,0.6)' : '0 1px 3px rgba(0,0,0,0.3)',
              zIndex: 4,
              opacity: decoration.placement === 'ceiling' ? 0.7 : 1
            }}
            title={`${decoration.name} - ${decorationStyle.description} (Light: ${decoration.lightLevel}, Comfort: ${decoration.comfort})`}
          >
            {decorationStyle.icon}
          </div>
        );

        // Render light radius for lighting decorations with wall occlusion
        if (decoration.lightLevel > 20) {
          const lightRadius = Math.floor(decoration.lightLevel / 20) + 1;
          const lightTiles = calculateLightOcclusion(decoration.x, decoration.y, lightRadius);
          
          // Render individual lit tiles instead of a simple circle
          lightTiles.forEach((tile, index) => {
            decorations.push(
              <div
                key={`${decoration.id}_light_tile_${index}`}
                style={{
                  position: 'absolute',
                  left: tile.x * scaledTileSize,
                  top: tile.y * scaledTileSize,
                  width: scaledTileSize,
                  height: scaledTileSize,
                  backgroundColor: `rgba(255, 215, 0, ${Math.max(0.05, tile.intensity * 0.15)})`,
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 2,
                  boxSizing: 'border-box'
                }}
              />
            );
          });
          
          // Also render the source indicator
          decorations.push(
            <div
              key={`${decoration.id}_light_source`}
              style={{
                position: 'absolute',
                left: decoration.x * scaledTileSize + scaledTileSize * 0.1,
                top: decoration.y * scaledTileSize + scaledTileSize * 0.1,
                width: scaledTileSize * 0.8,
                height: scaledTileSize * 0.8,
                backgroundColor: 'rgba(255, 215, 0, 0.3)',
                border: '2px solid rgba(255, 215, 0, 0.6)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 3
              }}
              title={`Light source: ${lightRadius} tiles radius`}
            />
          );
        }
      });
    });

    return decorations;
  };

  const renderFurniture = () => {
    if (!showFurniture) return null;

    const furniture = [];
    
    const currentRooms = getCurrentFloorRooms();
    
    currentRooms.forEach(room => {
      room.furniture.forEach(item => {
        // Enhanced color coding and furniture icons
        const furnitureInfo = getFurnitureStyle(item.purpose, item.furnitureType || item.purpose);
        
        furniture.push(
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: item.x * scaledTileSize + 1,
              top: item.y * scaledTileSize + 1,
              width: item.width * scaledTileSize - 2,
              height: item.height * scaledTileSize - 2,
              backgroundColor: furnitureInfo.color,
              border: `3px solid ${furnitureInfo.borderColor}`,
              borderRadius: furnitureInfo.borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${Math.max(12, scaledTileSize * 0.6)}px`, // Larger icons
              color: furnitureInfo.textColor,
              fontWeight: 'bold',
              pointerEvents: 'none',
              transform: `rotate(${item.rotation || 0}deg)`,
              transformOrigin: 'center',
              boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
              zIndex: 5,
              // Add text shadow for better visibility
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}
            title={`${item.furnitureType || item.purpose} (${item.rotation || 0}°) at (${item.x},${item.y})`}
          >
            {furnitureInfo.icon}
          </div>
        );

        // Render orientation indicators for chairs
        if (item.purpose === 'seating' && item.furnitureType?.includes('Chair')) {
          furniture.push(renderOrientationIndicator(item, furnitureInfo.color));
        }
      });
    });

    return furniture;
  };

  const getFurnitureStyle = (purpose: string, furnitureType?: string) => {
    const palette = buildingPlan.aesthetics?.colorPalette;
    
    switch (purpose) {
      case 'bed':
        return {
          color: palette?.secondary || '#8B4513',
          borderColor: palette?.foundation || '#654321',
          textColor: '#FFF',
          borderRadius: '8px',
          icon: '🛏️'
        };
      case 'seating':
        return {
          color: '#CD853F', // Distinct chair color
          borderColor: '#8B4513',
          textColor: '#FFF',
          borderRadius: '4px',
          icon: '🪑' // Simplified consistent chair icon
        };
      case 'table':
      case 'work':
        const tableType = furnitureType?.toLowerCase() || '';
        let tableIcon = '◼️'; // Solid block for visibility
        let tableColor = '#A0522D'; // Dark brown for tables
        
        if (tableType.includes('dining')) {
          tableIcon = '🍽️';
          tableColor = '#D2691E'; // Orange-brown for dining tables
        } else if (tableType.includes('desk')) {
          tableIcon = '📝';
          tableColor = '#8B4513'; // Medium brown for desks
        } else if (tableType.includes('work')) {
          tableIcon = '🔨';
          tableColor = '#B8860B'; // Dark goldenrod for work tables
        } else if (tableType.includes('round')) {
          tableIcon = '⭕'; // Circle for round tables
          tableColor = '#CD853F';
        } else {
          tableIcon = '◼️'; // Default solid block
          tableColor = '#A0522D';
        }
        
        return {
          color: tableColor,
          borderColor: '#654321',
          textColor: '#FFF',
          borderRadius: '6px',
          icon: tableIcon
        };
      case 'cooking':
        return {
          color: '#B22222',
          borderColor: '#8B0000',
          textColor: '#FFF',
          borderRadius: '8px',
          icon: furnitureType?.includes('Oven') ? '🔥' : '🍳'
        };
      case 'storage':
        return {
          color: palette?.foundation || '#8B4513',
          borderColor: palette?.trim || '#654321',
          textColor: '#FFF',
          borderRadius: '4px',
          icon: furnitureType?.includes('Bookshelf') ? '📚' : 
               furnitureType?.includes('Shelf') ? '📦' : '🗃️'
        };
      default:
        return {
          color: '#D2B48C',
          borderColor: '#A0522D',
          textColor: '#333',
          borderRadius: '4px',
          icon: '📦'
        };
    }
  };

  const renderOrientationIndicator = (item: any, baseColor: string) => {
    const rotation = item.rotation || 0;
    const indicatorSize = Math.max(6, scaledTileSize * 0.2);
    
    // Calculate indicator position based on furniture center and rotation
    const centerX = item.x * scaledTileSize + (item.width * scaledTileSize) / 2;
    const centerY = item.y * scaledTileSize + (item.height * scaledTileSize) / 2;
    
    // Offset for "front" of chair based on rotation
    let offsetX = 0, offsetY = -scaledTileSize * 0.3; // Default: front is north
    
    switch (rotation) {
      case 90:  // Facing east
        offsetX = scaledTileSize * 0.3;
        offsetY = 0;
        break;
      case 180: // Facing south
        offsetX = 0;
        offsetY = scaledTileSize * 0.3;
        break;
      case 270: // Facing west
        offsetX = -scaledTileSize * 0.3;
        offsetY = 0;
        break;
    }

    return (
      <div
        key={`${item.id}_indicator`}
        style={{
          position: 'absolute',
          left: centerX + offsetX - indicatorSize/2,
          top: centerY + offsetY - indicatorSize/2,
          width: indicatorSize,
          height: indicatorSize,
          backgroundColor: '#FFD700',
          border: '1px solid #333',
          borderRadius: '50%',
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0.8
        }}
        title={`Facing: ${rotation}°`}
      />
    );
  };

  const renderExteriorElements = () => {
    const elements = [];
    
    if (buildingPlan.exteriorElements) {
      buildingPlan.exteriorElements.forEach(element => {
        const elementStyle = ExteriorArchitecturalSystem.getExteriorElementVisualStyle(element);
        
        elements.push(
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.x * scaledTileSize + 1,
              top: element.y * scaledTileSize + 1,
              width: element.width * scaledTileSize - 2,
              height: element.height * scaledTileSize - 2,
              backgroundColor: elementStyle.color,
              border: `3px solid ${elementStyle.borderColor}`,
              borderRadius: element.type === 'chimney' ? '2px' : '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${Math.max(12, scaledTileSize * 0.6)}px`,
              fontWeight: 'bold',
              pointerEvents: 'none',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
              zIndex: 8
            }}
            title={`${element.name} - ${elementStyle.description}`}
          >
            {elementStyle.icon}
          </div>
        );
      });
    }

    return elements;
  };

  const renderExteriorFeatures = () => {
    const features = [];
    
    buildingPlan.exteriorFeatures.forEach(feature => {
      let featureColor = '#228B22'; // green for garden
      let symbol = '🌿';
      
      switch (feature.type) {
        case 'well':
          featureColor = '#4682B4';
          symbol = '🪣';
          break;
        case 'cart':
          featureColor = '#8B4513';
          symbol = '🛒';
          break;
        case 'fence':
          featureColor = '#654321';
          symbol = '🚧';
          break;
        case 'tree':
          featureColor = '#228B22';
          symbol = '🌳';
          break;
        case 'storage':
          featureColor = '#A0522D';
          symbol = '📦';
          break;
        case 'decoration':
          featureColor = '#FFD700';
          symbol = '⭐';
          break;
      }
      
      features.push(
        <div
          key={feature.id}
          style={{
            position: 'absolute',
            left: feature.x * scaledTileSize + 2,
            top: feature.y * scaledTileSize + 2,
            width: feature.width * scaledTileSize - 4,
            height: feature.height * scaledTileSize - 4,
            backgroundColor: featureColor,
            border: '1px solid #333',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${12 * scale}px`,
            pointerEvents: 'none'
          }}
          title={feature.type}
        >
          {symbol}
        </div>
      );
    });

    return features;
  };

  const renderRoomLabels = () => {
    if (!showRoomLabels) return null;

    const currentRooms = getCurrentFloorRooms();
    
    return currentRooms.map(room => {
      // Find optimal label position avoiding furniture
      const roomFurniture = room.furniture || [];
      let labelX = room.x + room.width / 2;
      let labelY = room.y + 2; // Start near top of room
      
      // Try to find a clear area for the label
      const labelWidth = room.name.length * 6 * scale; // Approximate text width
      const labelHeight = 12 * scale; // Approximate text height
      
      // Check if center area is clear of furniture
      const centerHasFurniture = roomFurniture.some(furniture => {
        const furnitureRight = furniture.x + furniture.width;
        const furnitureBottom = furniture.y + furniture.height;
        const labelRight = labelX + labelWidth / 2;
        const labelBottom = labelY + labelHeight;
        
        return !(furniture.x > labelRight || furnitureRight < labelX - labelWidth/2 || 
                furniture.y > labelBottom || furnitureBottom < labelY);
      });
      
      // If center has furniture, try top-left or bottom-right corners
      if (centerHasFurniture) {
        // Try top-left corner
        labelX = room.x + 2;
        labelY = room.y + 1;
        
        const topLeftHasFurniture = roomFurniture.some(furniture => {
          return furniture.x <= room.x + 3 && furniture.y <= room.y + 2;
        });
        
        if (topLeftHasFurniture) {
          // Try bottom-right area
          labelX = room.x + room.width - 3;
          labelY = room.y + room.height - 1;
        }
      }
      
      return (
        <div
          key={`label-${room.id}`}
          style={{
            position: 'absolute',
            left: labelX * scaledTileSize,
            top: labelY * scaledTileSize,
            transform: centerHasFurniture ? 'translate(0, 0)' : 'translate(-50%, -50%)',
            fontSize: `${Math.max(8, 10 * scale)}px`,
            fontWeight: '700',
            color: '#FFFFFF',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)',
            background: 'rgba(0,0,0,0.6)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.3)',
            pointerEvents: 'none',
            textAlign: 'center',
            zIndex: 15,
            letterSpacing: '0.5px',
            backdropFilter: 'blur(2px)'
          }}
        >
          {room.name}
        </div>
      );
    });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          position: 'relative',
          width: totalWidth,
          height: totalHeight,
          border: `3px solid ${buildingPlan.aesthetics?.colorPalette?.foundation || '#333'}`,
          backgroundColor: buildingPlan.aesthetics?.colorPalette?.roof || '#F5F5DC',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Building Info */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: 0,
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
            zIndex: 20
          }}
        >
          {buildingPlan.buildingType.replace('_', ' ')} ({buildingPlan.socialClass} class)
          {buildingPlan.aesthetics?.architecturalStyle && (
            <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
              Style: {buildingPlan.aesthetics.architecturalStyle.name}
            </div>
          )}
        </div>
        
        {/* Scale indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            right: 0,
            fontSize: '10px',
            color: '#666',
            zIndex: 20
          }}
        >
          Each square = 5 feet
        </div>

        {renderGrid()}
        {renderExteriorTiles()}
        {renderHallwayTiles()}
        {renderRoomTiles()}
        {renderFixtures()}
        {renderDecorations()}
        {renderExteriorElements()}
        {renderExteriorFeatures()}
        {renderFurniture()}
        {renderRoomLabels()}
      </div>
      
      {/* Floor Navigation - only show if building has multiple floors */}
      {(buildingPlan.floors && buildingPlan.floors.length > 1) && (
        <FloorNavigation
          currentFloor={currentFloor}
          totalFloors={buildingPlan.floors.length}
          hasBasement={buildingPlan.floors.some(f => f.level < 0)}
          onFloorChange={setCurrentFloor}
        />
      )}
      
    </div>
  );
};