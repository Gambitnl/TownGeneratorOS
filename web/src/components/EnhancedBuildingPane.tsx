import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BuildingPlan } from '../services/StandaloneBuildingGenerator';
import { FloorNavigation } from './FloorNavigation';
import { EnhancedFloorTileSystem, FloorTileAsset, FloorTileVariation } from '../services/EnhancedFloorTileSystem';
import { EnhancedFurnitureSystem, PlacedFurniture } from '../services/EnhancedFurnitureSystem';
import { AssetBasedRenderer, RenderedTile, RenderContext } from '../services/AssetBasedRenderer';
import { RoomFunction } from '../services/FloorMaterialSystem';

interface EnhancedBuildingPaneProps {
  building: BuildingPlan;
  scale?: number;
  showGrid?: boolean;
  showRoomLabels?: boolean;
  showAssets?: boolean;
  showCondition?: boolean;
  showLighting?: boolean;
}

interface GeneratedFloorData {
  tiles: Map<string, RenderedTile>;
  furniture: Map<string, PlacedFurniture>;
  lighting: Map<string, number>;
}

export const EnhancedBuildingPane: React.FC<EnhancedBuildingPaneProps> = ({
  building,
  scale = 1,
  showGrid = true,
  showRoomLabels = true,
  showAssets = true,
  showCondition = true,
  showLighting = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [floorData, setFloorData] = useState<Map<number, GeneratedFloorData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [systemsInitialized, setSystemsInitialized] = useState(false);

  const TILE_SIZE = 20;
  const scaledTileSize = TILE_SIZE * scale;

  // Initialize asset systems
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        await AssetBasedRenderer.initialize();
        setSystemsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize asset systems:', error);
        setSystemsInitialized(false);
      }
    };

    initializeSystems();
  }, []);

  const generateRoomContent = async (
    room: any,
    tiles: Map<string, RenderedTile>,
    furniture: Map<string, PlacedFurniture>,
    lighting: Map<string, number>
  ) => {
    const roomFunction = room.name.toLowerCase().includes('bedroom') ? 'bedroom' as RoomFunction :
                        room.name.toLowerCase().includes('kitchen') ? 'kitchen' as RoomFunction :
                        room.name.toLowerCase().includes('living') ? 'living' as RoomFunction :
                        room.name.toLowerCase().includes('office') ? 'office' as RoomFunction :
                        room.name.toLowerCase().includes('study') ? 'study' as RoomFunction :
                        room.name.toLowerCase().includes('workshop') ? 'workshop' as RoomFunction :
                        room.name.toLowerCase().includes('storage') ? 'storage' as RoomFunction :
                        'common' as RoomFunction;

    // Generate optimal floor material for room
    const floorAsset = EnhancedFloorTileSystem.selectOptimalFloorTile(
      roomFunction,
      building.socialClass,
      'temperate', // could be derived from building location
      100, // budget - could be calculated
      room.id || 0
    );

    // Generate furniture layout
    const roomArea = (room.width - 2) * (room.height - 2);
    const roomBudget = calculateRoomBudget(roomFunction, building.socialClass, roomArea);
    
    const placedFurniture = EnhancedFurnitureSystem.selectOptimalFurniture(
      roomFunction,
      building.socialClass,
      room.width,
      room.height,
      roomBudget,
      true, // prefer furniture sets
      (room.id || 0) + 1000
    );

    // Create floor tiles for room
    for (const tile of room.tiles) {
      const tileKey = `${tile.x},${tile.y}`;
      
      if (tile.type === 'floor') {
        // Create floor variation based on room conditions
        const variation = floorAsset ? EnhancedFloorTileSystem.createFloorVariation(
          floorAsset,
          getBuildingAge(building), // 0-100
          getTrafficLevel(roomFunction), // 0-100
          getMaintenanceLevel(building.socialClass), // 0-100
          tile.x * 100 + tile.y // seed
        ) : null;

        const renderedTile = AssetBasedRenderer.createRenderedTile(
          tile.x,
          tile.y,
          floorAsset,
          variation,
          null, // furniture added separately
          100, // base lighting
          50 // room temperature
        );

        tiles.set(tileKey, renderedTile);
        lighting.set(tileKey, calculateBaseLighting(roomFunction));
      }
    }

    // Add furniture to tiles
    placedFurniture.forEach((furnitureItem, index) => {
      const furnitureKey = `furniture_${room.id}_${index}`;
      furniture.set(furnitureKey, furnitureItem);

      // Update lighting if furniture provides light
      if (furnitureItem.asset.lightLevel && furnitureItem.asset.lightLevel > 0) {
        propagateLight(furnitureItem, lighting, tiles);
      }

      // Associate furniture with its floor tiles
      for (let dy = 0; dy < furnitureItem.asset.height; dy++) {
        for (let dx = 0; dx < furnitureItem.asset.width; dx++) {
          const tileX = furnitureItem.x + dx;
          const tileY = furnitureItem.y + dy;
          const tileKey = `${tileX},${tileY}`;
          
          const existingTile = tiles.get(tileKey);
          if (existingTile) {
            existingTile.furniture = furnitureItem;
            tiles.set(tileKey, existingTile);
          }
        }
      }
    });
  };

  const generateHallwayContent = async (
    hallway: any,
    tiles: Map<string, RenderedTile>,
    lighting: Map<string, number>
  ) => {
    // Hallways typically use simple stone or wood flooring
    const hallwayAsset = EnhancedFloorTileSystem.selectOptimalFloorTile(
      'common' as RoomFunction,
      building.socialClass,
      'temperate',
      50, // lower budget for hallways
      hallway.x * 1000 + hallway.y
    );

    // Generate hallway floor tiles
    for (let y = hallway.y; y < hallway.y + hallway.height; y++) {
      for (let x = hallway.x; x < hallway.x + hallway.width; x++) {
        const tileKey = `${x},${y}`;
        
        const isWall = x === hallway.x || x === hallway.x + hallway.width - 1 ||
                      y === hallway.y || y === hallway.y + hallway.height - 1;

        if (!isWall) {
          const variation = hallwayAsset ? EnhancedFloorTileSystem.createFloorVariation(
            hallwayAsset,
            getBuildingAge(building),
            80, // hallways see high traffic
            getMaintenanceLevel(building.socialClass),
            x * 100 + y
          ) : null;

          const renderedTile = AssetBasedRenderer.createRenderedTile(
            x, y, hallwayAsset, variation, null, 80, 50
          );

          tiles.set(tileKey, renderedTile);
          lighting.set(tileKey, 80); // hallways are typically dimmer
        }
      }
    }
  };

  // Render to canvas
  const renderToCanvas = useCallback(async () => {
    if (!canvasRef.current || !systemsInitialized || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentData = floorData.get(currentFloor);
    if (!currentData) return;

    const renderContext: RenderContext = {
      tileSize: TILE_SIZE,
      scale: scale,
      showAssets: showAssets,
      showCondition: showCondition,
      showLighting: showLighting,
      showMaterials: true
    };

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background (exterior tiles)
    renderExteriorTiles(ctx, renderContext);

    // Render all tiles for current floor
    for (const [tileKey, tile] of currentData.tiles) {
      const canvasX = tile.x * scaledTileSize;
      const canvasY = tile.y * scaledTileSize;

      await AssetBasedRenderer.renderTileToCanvas(
        tile, renderContext, canvas, canvasX, canvasY
      );
    }

    // Render grid if enabled
    if (showGrid) {
      renderGrid(ctx, renderContext);
    }

  }, [currentFloor, floorData, scale, showAssets, showCondition, showLighting, showGrid, systemsInitialized, isLoading]);

  // Generate enhanced floor and furniture data
  useEffect(() => {
    if (!systemsInitialized) return;

    const generateEnhancedData = async () => {
      setIsLoading(true);
      const newFloorData = new Map<number, GeneratedFloorData>();

      const floors = building.floors && building.floors.length > 0 
        ? building.floors 
        : [{ level: 0, rooms: building.rooms.filter(room => room.floor === 0) }];

      for (const floor of floors) {
        const floorTiles = new Map<string, RenderedTile>();
        const floorFurniture = new Map<string, PlacedFurniture>();
        const floorLighting = new Map<string, number>();

        // Process each room on this floor
        for (const room of floor.rooms) {
          await generateRoomContent(room, floorTiles, floorFurniture, floorLighting);
        }

        // Process hallways if any
        if ('hallways' in floor && floor.hallways) {
          for (const hallway of floor.hallways) {
            await generateHallwayContent(hallway, floorTiles, floorLighting);
          }
        }

        newFloorData.set(floor.level, {
          tiles: floorTiles,
          furniture: floorFurniture,
          lighting: floorLighting
        });
      }

      setFloorData(newFloorData);
      setIsLoading(false);
    };

    generateEnhancedData();
  }, [building, systemsInitialized]);

  // Re-render when dependencies change
  useEffect(() => {
    renderToCanvas();
  }, [renderToCanvas]);

  const renderExteriorTiles = (ctx: CanvasRenderingContext2D, renderContext: RenderContext) => {
    // Simple grass/dirt background for exterior
    ctx.fillStyle = '#228B22'; // forest green
    ctx.fillRect(0, 0, building.lotWidth * scaledTileSize, building.lotHeight * scaledTileSize);
    
    // Building outline
    ctx.fillStyle = '#F5F5DC'; // beige for building area
    ctx.fillRect(
      building.buildingX * scaledTileSize,
      building.buildingY * scaledTileSize,
      building.buildingWidth * scaledTileSize,
      building.buildingHeight * scaledTileSize
    );
  };

  const renderGrid = (ctx: CanvasRenderingContext2D, renderContext: RenderContext) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= building.lotWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scaledTileSize, 0);
      ctx.lineTo(x * scaledTileSize, building.lotHeight * scaledTileSize);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= building.lotHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scaledTileSize);
      ctx.lineTo(building.lotWidth * scaledTileSize, y * scaledTileSize);
      ctx.stroke();
    }
  };

  // Utility methods
  const getBuildingAge = (building: BuildingPlan): number => {
    // Could be derived from building metadata or randomly generated
    return Math.max(0, Math.min(100, 
      (building.socialClass === 'poor' ? 60 : 
       building.socialClass === 'common' ? 40 : 
       building.socialClass === 'wealthy' ? 20 : 10) +
      (Math.random() * 30 - 15) // ±15 variation
    ));
  }

  const getTrafficLevel = (roomFunction: RoomFunction): number => {
    switch (roomFunction) {
      case 'kitchen':
      case 'living':
      case 'common':
        return 80; // high traffic
      case 'tavern_hall':
        return 90; // very high traffic
      case 'bedroom':
      case 'study':
        return 40; // medium traffic
      case 'storage':
        return 20; // low traffic
      case 'office':
        return 60; // medium-high traffic
      case 'workshop':
        return 70; // high traffic
      default:
        return 50;
    }
  }

  const getMaintenanceLevel = (socialClass: string): number => {
    switch (socialClass) {
      case 'poor': return 30; // poor maintenance
      case 'common': return 60; // fair maintenance
      case 'wealthy': return 80; // good maintenance
      case 'noble': return 95; // excellent maintenance
      default: return 50;
    }
  }

  const calculateRoomBudget = (roomFunction: RoomFunction, socialClass: string, roomArea: number): number => {
    const baseBudget = roomArea * 20; // 20 gold per square tile base
    
    const socialMultiplier = socialClass === 'poor' ? 0.5 :
                            socialClass === 'common' ? 1.0 :
                            socialClass === 'wealthy' ? 2.0 : 4.0;

    const roomMultiplier = roomFunction === 'bedroom' ? 1.5 :
                          roomFunction === 'kitchen' ? 1.3 :
                          roomFunction === 'office' ? 1.8 :
                          roomFunction === 'study' ? 1.6 :
                          roomFunction === 'workshop' ? 1.4 :
                          roomFunction === 'tavern_hall' ? 2.0 : 1.0;

    return Math.round(baseBudget * socialMultiplier * roomMultiplier);
  }

  const calculateBaseLighting = (roomFunction: RoomFunction): number => {
    switch (roomFunction) {
      case 'kitchen': return 95; // needs good light for cooking
      case 'office':
      case 'study': return 90; // needs good light for reading/writing
      case 'workshop': return 90; // needs good light for detailed work
      case 'living':
      case 'common': return 85; // comfortable lighting
      case 'tavern_hall': return 80; // atmospheric but functional
      case 'bedroom': return 70; // softer lighting
      case 'storage': return 60; // basic lighting sufficient
      default: return 75;
    }
  }

  const propagateLight = (
    lightSource: PlacedFurniture,
    lighting: Map<string, number>,
    tiles: Map<string, RenderedTile>
  ) => {
    if (!lightSource.asset.lightLevel) return;

    const lightRadius = Math.floor(lightSource.asset.lightLevel / 20) + 1;
    const sourceX = lightSource.x + lightSource.asset.width / 2;
    const sourceY = lightSource.y + lightSource.asset.height / 2;

    for (let y = Math.floor(sourceY - lightRadius); y <= Math.ceil(sourceY + lightRadius); y++) {
      for (let x = Math.floor(sourceX - lightRadius); x <= Math.ceil(sourceX + lightRadius); x++) {
        const distance = Math.sqrt((x - sourceX) ** 2 + (y - sourceY) ** 2);
        
        if (distance <= lightRadius) {
          const tileKey = `${x},${y}`;
          const existingLight = lighting.get(tileKey) || 0;
          const lightContribution = lightSource.asset.lightLevel * (1 - distance / lightRadius);
          const newLight = Math.min(100, existingLight + lightContribution);
          
          lighting.set(tileKey, newLight);
          
          // Update tile lighting
          const tile = tiles.get(tileKey);
          if (tile) {
            tile.lighting = newLight;
            tiles.set(tileKey, tile);
          }
        }
      }
    }
  }

  const renderRoomLabels = () => {
    if (!showRoomLabels) return null;

    const currentRooms = building.floors && building.floors.length > 0
      ? building.floors.find(f => f.level === currentFloor)?.rooms || []
      : building.rooms.filter(room => room.floor === currentFloor);
    
    return currentRooms.map(room => (
      <div
        key={`label-${room.id}`}
        style={{
          position: 'absolute',
          left: (room.x + room.width / 2) * scaledTileSize,
          top: (room.y + 2) * scaledTileSize,
          transform: 'translate(-50%, -50%)',
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
    ));
  };

  const totalWidth = building.lotWidth * scaledTileSize;
  const totalHeight = building.lotHeight * scaledTileSize;

  if (!systemsInitialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Initializing asset systems...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          right: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          Generating enhanced building layout...
        </div>
      )}

      <div
        style={{
          position: 'relative',
          border: `3px solid ${building.aesthetics?.colorPalette?.foundation || '#333'}`,
          backgroundColor: building.aesthetics?.colorPalette?.roof || '#F5F5DC',
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
          {building.buildingType.replace('_', ' ')} ({building.socialClass} class)
          {building.aesthetics?.architecturalStyle && (
            <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
              Style: {building.aesthetics.architecturalStyle.name} | Enhanced Asset System
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
          Each square = 5 feet | {showAssets ? 'Asset Mode' : 'Fallback Mode'}
        </div>

        <canvas
          ref={canvasRef}
          width={totalWidth}
          height={totalHeight}
          style={{
            display: 'block',
            imageRendering: 'pixelated'
          }}
        />

        {renderRoomLabels()}
      </div>
      
      {/* Floor Navigation */}
      {(building.floors && building.floors.length > 1) && (
        <FloorNavigation
          currentFloor={currentFloor}
          totalFloors={building.floors.length}
          hasBasement={building.floors.some(f => f.level < 0)}
          onFloorChange={setCurrentFloor}
        />
      )}

      {/* Asset System Status */}
      <div style={{
        position: 'absolute',
        bottom: -50,
        left: 0,
        fontSize: '9px',
        color: '#888',
        zIndex: 20
      }}>
        Assets: {AssetBasedRenderer.getCacheStats().cached} cached, {AssetBasedRenderer.getCacheStats().loading} loading
      </div>
    </div>
  );
};

export default EnhancedBuildingPane;