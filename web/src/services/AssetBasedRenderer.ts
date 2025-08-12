import { FloorTileAsset, FloorTileVariation, EnhancedFloorTileSystem } from './EnhancedFloorTileSystem';
import { FurnitureAsset, PlacedFurniture, EnhancedFurnitureSystem } from './EnhancedFurnitureSystem';

export interface RenderedTile {
  x: number;
  y: number;
  baseAsset: FloorTileAsset | null;
  variation: FloorTileVariation | null;
  furniture: PlacedFurniture | null;
  lighting: number; // 0-100
  temperature: number; // 0-100, for visual heat effects
}

export interface RenderContext {
  tileSize: number; // pixels per tile
  scale: number; // zoom scale
  showAssets: boolean; // use actual assets vs fallback
  showCondition: boolean; // show wear/damage effects
  showLighting: boolean; // render lighting effects
  showMaterials: boolean; // show material textures
}

export class AssetBasedRenderer {
  private static assetCache: Map<string, HTMLImageElement> = new Map();
  private static loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  static async initialize() {
    await EnhancedFloorTileSystem.initialize();
    await EnhancedFurnitureSystem.initialize();
  }

  static async renderTileToCanvas(
    tile: RenderedTile,
    context: RenderContext,
    canvas: HTMLCanvasElement,
    canvasX: number,
    canvasY: number
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaledSize = context.tileSize * context.scale;

    // Clear tile area
    ctx.clearRect(canvasX, canvasY, scaledSize, scaledSize);

    // Render base floor
    if (tile.baseAsset && context.showAssets) {
      await this.renderFloorAsset(ctx, tile.baseAsset, tile.variation, canvasX, canvasY, scaledSize, context);
    } else {
      // Fallback to solid color
      this.renderFallbackFloor(ctx, tile.baseAsset, canvasX, canvasY, scaledSize);
    }

    // Apply lighting effects
    if (context.showLighting && tile.lighting < 100) {
      this.renderLightingOverlay(ctx, tile.lighting, canvasX, canvasY, scaledSize);
    }

    // Render furniture
    if (tile.furniture && context.showAssets) {
      await this.renderFurnitureAsset(ctx, tile.furniture, canvasX, canvasY, scaledSize, context);
    } else if (tile.furniture) {
      this.renderFallbackFurniture(ctx, tile.furniture, canvasX, canvasY, scaledSize);
    }

    // Apply temperature effects (heat shimmer, frost, etc.)
    if (context.showCondition) {
      this.renderTemperatureEffects(ctx, tile.temperature, canvasX, canvasY, scaledSize);
    }
  }

  private static async renderFloorAsset(
    ctx: CanvasRenderingContext2D,
    asset: FloorTileAsset,
    variation: FloorTileVariation | null,
    x: number, y: number, size: number,
    context: RenderContext
  ): Promise<void> {
    try {
      // Load base texture
      const baseImage = await this.loadImage(asset.assetPath);
      
      // Draw base texture
      ctx.drawImage(baseImage, x, y, size, size);

      // Apply variation overlays
      if (variation && context.showCondition) {
        for (const overlay of variation.overlays) {
          const overlayPath = this.getOverlayPath(asset, overlay);
          if (overlayPath) {
            const overlayImage = await this.loadImage(overlayPath);
            ctx.globalAlpha = this.getOverlayAlpha(overlay);
            ctx.drawImage(overlayImage, x, y, size, size);
            ctx.globalAlpha = 1.0;
          }
        }

        // Apply condition effects
        if (variation.condition !== 'pristine') {
          this.renderConditionEffect(ctx, variation.condition, x, y, size);
        }
      }

    } catch (error) {
      console.warn(`Failed to render floor asset ${asset.id}:`, error);
      this.renderFallbackFloor(ctx, asset, x, y, size);
    }
  }

  private static async renderFurnitureAsset(
    ctx: CanvasRenderingContext2D,
    furniture: PlacedFurniture,
    x: number, y: number, tileSize: number,
    context: RenderContext
  ): Promise<void> {
    try {
      const image = await this.loadImage(furniture.asset.assetPath);
      
      const width = furniture.asset.width * tileSize;
      const height = furniture.asset.height * tileSize;

      // Save context for rotation
      ctx.save();
      
      // Apply rotation if needed
      if (furniture.rotation !== 0) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((furniture.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Draw furniture
      ctx.drawImage(image, x, y, width, height);

      // Apply condition effects
      if (context.showCondition && furniture.condition !== 'pristine') {
        this.renderFurnitureCondition(ctx, furniture.condition, x, y, width, height);
      }

      // Apply lighting glow if furniture provides light
      if (furniture.asset.lightLevel && furniture.asset.lightLevel > 0 && context.showLighting) {
        this.renderLightSource(ctx, x + width/2, y + height/2, furniture.asset.lightLevel, tileSize);
      }

      ctx.restore();

    } catch (error) {
      console.warn(`Failed to render furniture asset ${furniture.asset.id}:`, error);
      this.renderFallbackFurniture(ctx, furniture, x, y, tileSize);
    }
  }

  private static renderFallbackFloor(
    ctx: CanvasRenderingContext2D,
    asset: FloorTileAsset | null,
    x: number, y: number, size: number
  ): void {
    let color = '#F5F5DC'; // default beige
    
    if (asset) {
      if (asset.material.includes('wood')) {
        if (asset.material.includes('dark')) color = '#8B4513';
        else if (asset.material.includes('walnut')) color = '#734A12';
        else if (asset.material.includes('red')) color = '#A0522D';
        else color = '#DEB887'; // light wood default
      } else if (asset.material.includes('stone')) {
        if (asset.material.includes('marble')) color = '#B0C4DE';
        else color = '#696969'; // stone gray
      } else if (asset.material.includes('brick')) {
        color = '#CD853F'; // brick color
      }
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    
    // Add subtle border
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  private static renderFallbackFurniture(
    ctx: CanvasRenderingContext2D,
    furniture: PlacedFurniture,
    x: number, y: number, tileSize: number
  ): void {
    const width = furniture.asset.width * tileSize;
    const height = furniture.asset.height * tileSize;

    // Color based on furniture type
    let color = '#A0522D';
    let icon = '📦';

    switch (furniture.asset.category) {
      case 'bed':
        color = '#8B4513';
        icon = '🛏️';
        break;
      case 'seating':
        color = '#CD853F';
        icon = '🪑';
        break;
      case 'table':
        color = '#A0522D';
        icon = '🍽️';
        break;
      case 'storage':
        color = '#654321';
        icon = '🗃️';
        break;
      case 'cooking':
        color = '#B22222';
        icon = '🔥';
        break;
      case 'lighting':
        color = '#FFD700';
        icon = '💡';
        break;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Draw icon
    ctx.font = `${Math.max(12, tileSize * 0.6)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF';
    ctx.fillText(icon, x + width/2, y + height/2);
  }

  private static renderLightingOverlay(
    ctx: CanvasRenderingContext2D,
    lightLevel: number,
    x: number, y: number, size: number
  ): void {
    const darkness = (100 - lightLevel) / 100;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${darkness * 0.7})`;
    ctx.fillRect(x, y, size, size);
  }

  private static renderLightSource(
    ctx: CanvasRenderingContext2D,
    centerX: number, centerY: number,
    lightLevel: number, tileSize: number
  ): void {
    const radius = (lightLevel / 100) * tileSize * 2;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  }

  private static renderConditionEffect(
    ctx: CanvasRenderingContext2D,
    condition: FloorTileVariation['condition'],
    x: number, y: number, size: number
  ): void {
    let overlayColor = '';
    let alpha = 0;

    switch (condition) {
      case 'worn':
        overlayColor = '139, 69, 19'; // saddle brown
        alpha = 0.15;
        break;
      case 'damaged':
        overlayColor = '101, 67, 33'; // darker brown
        alpha = 0.25;
        break;
      case 'broken':
        overlayColor = '85, 85, 85'; // dark gray
        alpha = 0.4;
        break;
    }

    if (alpha > 0) {
      ctx.fillStyle = `rgba(${overlayColor}, ${alpha})`;
      ctx.fillRect(x, y, size, size);

      // Add some texture for damaged/broken
      if (condition === 'damaged' || condition === 'broken') {
        ctx.strokeStyle = `rgba(${overlayColor}, ${alpha + 0.2})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const lineX = x + (i + 1) * (size / 4);
          ctx.beginPath();
          ctx.moveTo(lineX, y);
          ctx.lineTo(lineX - 5, y + size);
          ctx.stroke();
        }
      }
    }
  }

  private static renderFurnitureCondition(
    ctx: CanvasRenderingContext2D,
    condition: PlacedFurniture['condition'],
    x: number, y: number, width: number, height: number
  ): void {
    let alpha = 0;
    
    switch (condition) {
      case 'worn':
        alpha = 0.1;
        break;
      case 'damaged':
        alpha = 0.2;
        break;
      case 'broken':
        alpha = 0.4;
        break;
    }

    if (alpha > 0) {
      ctx.fillStyle = `rgba(101, 67, 33, ${alpha})`;
      ctx.fillRect(x, y, width, height);
    }
  }

  private static renderTemperatureEffects(
    ctx: CanvasRenderingContext2D,
    temperature: number,
    x: number, y: number, size: number
  ): void {
    if (temperature > 80) {
      // Heat shimmer effect
      ctx.fillStyle = 'rgba(255, 100, 0, 0.05)';
      ctx.fillRect(x, y, size, size);
    } else if (temperature < 20) {
      // Frost effect
      ctx.fillStyle = 'rgba(200, 230, 255, 0.1)';
      ctx.fillRect(x, y, size, size);
    }
  }

  private static async loadImage(path: string): Promise<HTMLImageElement> {
    // Check cache first
    if (this.assetCache.has(path)) {
      return this.assetCache.get(path)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    // Start loading
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.assetCache.set(path, img);
        this.loadingPromises.delete(path);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(path);
        reject(new Error(`Failed to load image: ${path}`));
      };
      
      img.src = path;
    });

    this.loadingPromises.set(path, loadPromise);
    return loadPromise;
  }

  private static getOverlayPath(asset: FloorTileAsset, overlayType: string): string | null {
    // Map overlay types to actual paths
    const basePath = asset.assetPath.substring(0, asset.assetPath.lastIndexOf('/'));
    
    switch (overlayType) {
      case 'light_wear':
      case 'heavy_wear':
      case 'scratch_overlay':
        if (asset.material.includes('wood')) {
          return `${basePath}/Overlays/Wooden_Scratch_Overlay.png`;
        }
        break;
      case 'dirt_overlay':
        if (asset.material.includes('cobblestone')) {
          return `${basePath}/Overlays/Cobblestone_Dirt_Overlay.png`;
        }
        break;
      case 'damage_overlay':
        return `${basePath}/Overlays/Damage_General.png`;
    }
    
    return null;
  }

  private static getOverlayAlpha(overlayType: string): number {
    switch (overlayType) {
      case 'light_wear':
        return 0.3;
      case 'heavy_wear':
        return 0.6;
      case 'scratch_overlay':
        return 0.4;
      case 'dirt_overlay':
        return 0.5;
      case 'damage_overlay':
        return 0.8;
      default:
        return 0.5;
    }
  }

  // Utility methods for creating rendered tiles
  static createRenderedTile(
    x: number, y: number,
    floorAsset: FloorTileAsset | null = null,
    variation: FloorTileVariation | null = null,
    furniture: PlacedFurniture | null = null,
    lighting: number = 100,
    temperature: number = 50
  ): RenderedTile {
    return {
      x, y,
      baseAsset: floorAsset,
      variation,
      furniture,
      lighting,
      temperature
    };
  }

  static createDefaultRenderContext(
    tileSize: number = 20,
    scale: number = 1,
    showAssets: boolean = true
  ): RenderContext {
    return {
      tileSize,
      scale,
      showAssets,
      showCondition: true,
      showLighting: true,
      showMaterials: true
    };
  }

  // Clear cache method for memory management
  static clearAssetCache(): void {
    this.assetCache.clear();
    this.loadingPromises.clear();
  }

  // Get cache statistics
  static getCacheStats(): {cached: number, loading: number} {
    return {
      cached: this.assetCache.size,
      loading: this.loadingPromises.size
    };
  }
}