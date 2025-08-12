import { SimpleBuilding, SimpleTile, SimpleFurniture, SimpleRoom } from './SimpleBuildingGenerator';
import { getMaterialsForClass, applyMaterialWeathering } from './BuildingUtils';

export interface RenderedTile extends SimpleTile {
  color: string;
  texture?: string;
  weathering?: string;
}

export interface RenderOptions {
  tileSize: number;
  showGrid: boolean;
  showLighting: boolean;
  age?: number;
  climate?: string;
}

export class SimpleBuildingRenderer {
  
  static renderToCanvas(
    building: SimpleBuilding, 
    canvas: HTMLCanvasElement, 
    options: RenderOptions
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render background (lot)
    this.renderLotBackground(ctx, building, options);
    
    // Render building structure
    this.renderBuildingStructure(ctx, building, options);
    
    // Render rooms
    building.rooms.forEach(room => {
      this.renderRoom(ctx, room, building, options);
    });
    
    // Render furniture
    building.rooms.forEach(room => {
      room.furniture.forEach(furniture => {
        this.renderFurniture(ctx, furniture, options);
      });
    });
    
    // Render exterior features
    building.exteriorFeatures.forEach(feature => {
      this.renderExteriorFeature(ctx, feature, options);
    });
    
    // Render grid if enabled
    if (options.showGrid) {
      this.renderGrid(ctx, building, options);
    }
  }

  private static renderLotBackground(
    ctx: CanvasRenderingContext2D, 
    building: SimpleBuilding, 
    options: RenderOptions
  ): void {
    // Calculate lot size (building + buffer)
    const lotWidth = building.width + 8; // 4 tiles on each side
    const lotHeight = building.height + 8;
    
    ctx.fillStyle = '#228B22'; // Grass green
    ctx.fillRect(
      0, 
      0, 
      lotWidth * options.tileSize, 
      lotHeight * options.tileSize
    );
  }

  private static renderBuildingStructure(
    ctx: CanvasRenderingContext2D, 
    building: SimpleBuilding, 
    options: RenderOptions
  ): void {
    const materials = getMaterialsForClass(building.socialClass);
    const wallMaterial = applyMaterialWeathering(
      materials.walls.color, 
      options.age || 0, 
      options.climate
    );

    // Render building foundation/outline
    ctx.fillStyle = wallMaterial.color;
    ctx.fillRect(
      4 * options.tileSize, // Offset from lot edge
      4 * options.tileSize,
      building.width * options.tileSize,
      building.height * options.tileSize
    );
  }

  private static renderRoom(
    ctx: CanvasRenderingContext2D, 
    room: SimpleRoom, 
    building: SimpleBuilding, 
    options: RenderOptions
  ): void {
    const materials = getMaterialsForClass(building.socialClass);
    
    room.tiles.forEach(tile => {
      const x = (tile.x + 4) * options.tileSize; // Offset for lot
      const y = (tile.y + 4) * options.tileSize;
      
      let color = '#DEB887'; // Default floor color
      
      if (tile.type === 'wall') {
        const wallMaterial = applyMaterialWeathering(
          materials.walls.color, 
          options.age || 0, 
          options.climate
        );
        color = wallMaterial.color;
      } else if (tile.type === 'floor') {
        const floorMaterial = applyMaterialWeathering(
          materials.floors.color, 
          options.age || 0, 
          options.climate
        );
        color = floorMaterial.color;
      } else if (tile.type === 'door') {
        color = materials.doors.color;
      } else if (tile.type === 'window') {
        color = materials.windows.color;
      }
      
      // Apply lighting if enabled
      if (options.showLighting && tile.lighting !== undefined) {
        color = this.applyLighting(color, tile.lighting);
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, options.tileSize, options.tileSize);
      
      // Add border for walls
      if (tile.type === 'wall') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, options.tileSize, options.tileSize);
      }
    });
    
    // Render doors and windows with special styling
    this.renderDoorsAndWindows(ctx, room, options);
  }

  private static renderDoorsAndWindows(
    ctx: CanvasRenderingContext2D,
    room: SimpleRoom,
    options: RenderOptions
  ): void {
    // Render doors
    room.doors.forEach(door => {
      const x = (room.x + door.x + 4) * options.tileSize;
      const y = (room.y + door.y + 4) * options.tileSize;
      
      ctx.fillStyle = '#8B4513'; // Brown door
      ctx.fillRect(x, y, options.tileSize, options.tileSize);
      
      // Door handle
      ctx.fillStyle = '#FFD700'; // Gold handle
      const handleSize = 3;
      ctx.fillRect(
        x + options.tileSize - handleSize - 2, 
        y + options.tileSize / 2 - handleSize / 2, 
        handleSize, 
        handleSize
      );
    });
    
    // Render windows
    room.windows.forEach(window => {
      const x = (room.x + window.x + 4) * options.tileSize;
      const y = (room.y + window.y + 4) * options.tileSize;
      
      ctx.fillStyle = '#87CEEB'; // Light blue window
      ctx.fillRect(x, y, options.tileSize, options.tileSize);
      
      // Window cross
      ctx.strokeStyle = '#654321'; // Dark brown cross
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + options.tileSize / 2);
      ctx.lineTo(x + options.tileSize, y + options.tileSize / 2);
      ctx.moveTo(x + options.tileSize / 2, y);
      ctx.lineTo(x + options.tileSize / 2, y + options.tileSize);
      ctx.stroke();
    });
  }

  private static renderFurniture(
    ctx: CanvasRenderingContext2D, 
    furniture: SimpleFurniture, 
    options: RenderOptions
  ): void {
    const x = (furniture.x + 4) * options.tileSize;
    const y = (furniture.y + 4) * options.tileSize;
    const width = furniture.width * options.tileSize;
    const height = furniture.height * options.tileSize;
    
    // Simple furniture rendering with different colors by type
    const furnitureColors: { [key: string]: string } = {
      'bed': '#8B0000',
      'table': '#D2691E',
      'chair': '#A0522D',
      'chest': '#654321',
      'stove': '#2F4F4F',
      'workbench': '#8B4513',
      'anvil': '#696969',
      'counter': '#DEB887',
      'shelf': '#CD853F',
      'barrel': '#8B4513',
      'fireplace': '#800000'
    };
    
    const color = furnitureColors[furniture.type] || '#8B4513';
    
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Add simple furniture details
    this.renderFurnitureDetails(ctx, furniture, x, y, width, height, options);
  }

  private static renderFurnitureDetails(
    ctx: CanvasRenderingContext2D,
    furniture: SimpleFurniture,
    x: number,
    y: number,
    width: number,
    height: number,
    options: RenderOptions
  ): void {
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    // Simple labels for furniture
    const label = furniture.name.split(' ')[0]; // Just first word
    ctx.fillText(label, x + width / 2, y + height / 2 + 3);
  }

  private static renderExteriorFeature(
    ctx: CanvasRenderingContext2D,
    feature: any,
    options: RenderOptions
  ): void {
    const x = (feature.x + 4) * options.tileSize;
    const y = (feature.y + 4) * options.tileSize;
    const width = feature.width * options.tileSize;
    const height = feature.height * options.tileSize;
    
    // Simple exterior feature rendering
    if (feature.name.includes('Garden')) {
      ctx.fillStyle = '#32CD32'; // Lime green for garden
    } else if (feature.name.includes('Well')) {
      ctx.fillStyle = '#708090'; // Slate gray for well
    } else {
      ctx.fillStyle = '#8B4513'; // Default brown
    }
    
    ctx.fillRect(x, y, width, height);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  private static renderGrid(
    ctx: CanvasRenderingContext2D, 
    building: SimpleBuilding, 
    options: RenderOptions
  ): void {
    const lotWidth = building.width + 8;
    const lotHeight = building.height + 8;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    // Vertical lines
    for (let x = 0; x <= lotWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * options.tileSize, 0);
      ctx.lineTo(x * options.tileSize, lotHeight * options.tileSize);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= lotHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * options.tileSize);
      ctx.lineTo(lotWidth * options.tileSize, y * options.tileSize);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
  }

  private static applyLighting(baseColor: string, lightLevel: number): string {
    // Simple lighting calculation
    const factor = Math.max(0.3, lightLevel / 100); // Minimum 30% brightness
    return this.adjustColorBrightness(baseColor, factor);
  }

  private static adjustColorBrightness(hex: string, factor: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) * factor));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) * factor));
    const b = Math.min(255, Math.floor((num & 0x0000FF) * factor));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}