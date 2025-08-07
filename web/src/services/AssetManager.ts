export interface AssetInfo {
  name: string;
  path: string;
  type: 'tree' | 'bush' | 'grass' | 'flower' | 'rock' | 'decoration' | 'wall' | 'door' | 'window' | 'roof' | 'support' | 'arch' | 'fireplace' | 'floor';
  size: 'small' | 'medium' | 'large' | '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '1x3' | '3x3' | '4x1' | '1x4';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  material?: 'wood' | 'stone' | 'brick' | 'metal' | 'thatch' | 'tile';
  style?: 'earthy' | 'redrock' | 'sandstone' | 'slate' | 'volcanic' | 'ashen' | 'dark' | 'light';
  category?: 'structural' | 'decorative' | 'functional' | 'entrance';
}

export class AssetManager {
  private static assets: Map<string, AssetInfo> = new Map();
  private static vegetationAssets: Map<string, AssetInfo> = new Map();
  private static buildingAssets: Map<string, AssetInfo> = new Map();
  
  static async loadAssets(): Promise<void> {
    // Default fallback SVG assets (current system)
    this.registerDefaultAssets();
    
    // Try to load vegetation assets
    try {
      const response = await fetch('/assets/vegetation/manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        this.registerVegetationAssets(manifest);
      }
    } catch (error) {
      console.log('No vegetation manifest found, using default SVG assets');
    }

    // Try to load building assets
    try {
      const response = await fetch('/assets/buildings/manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        this.registerBuildingAssets(manifest);
      }
    } catch (error) {
      console.log('No building manifest found, continuing without building assets');
    }
  }
  
  private static registerDefaultAssets(): void {
    // Register built-in SVG assets
    const defaultAssets: AssetInfo[] = [
      { name: 'oak_tree', path: 'svg/oak.svg', type: 'tree', size: 'large' },
      { name: 'pine_tree', path: 'svg/pine.svg', type: 'tree', size: 'large' },
      { name: 'small_bush', path: 'svg/bush_small.svg', type: 'bush', size: 'small' },
      { name: 'large_bush', path: 'svg/bush_large.svg', type: 'bush', size: 'medium' },
      { name: 'flowers', path: 'svg/flowers.svg', type: 'flower', size: 'small' },
      { name: 'tall_grass', path: 'svg/grass.svg', type: 'grass', size: 'small' },
    ];
    
    defaultAssets.forEach(asset => {
      this.assets.set(asset.name, asset);
    });
  }
  
  private static registerVegetationAssets(manifest: { assets: AssetInfo[] }): void {
    console.log(`Loading ${manifest.assets.length} vegetation assets`);
    manifest.assets.forEach(asset => {
      console.log(`Registered vegetation asset: ${asset.name} -> ${asset.path}`);
      this.assets.set(asset.name, asset);
      this.vegetationAssets.set(asset.name, asset);
    });
  }

  private static registerBuildingAssets(manifest: { categories: any }): void {
    let totalAssets = 0;
    Object.entries(manifest.categories).forEach(([categoryName, category]: [string, any]) => {
      if (category.assets && Array.isArray(category.assets)) {
        category.assets.forEach((asset: AssetInfo) => {
          console.log(`Registered building asset: ${asset.name} -> ${asset.path}`);
          this.assets.set(asset.name, asset);
          this.buildingAssets.set(asset.name, asset);
          totalAssets++;
        });
      }
    });
    console.log(`Loaded ${totalAssets} building assets across ${Object.keys(manifest.categories).length} categories`);
  }
  
  static getAsset(name: string): AssetInfo | null {
    return this.assets.get(name) || null;
  }
  
  static getAssetsByType(type: AssetInfo['type']): AssetInfo[] {
    return Array.from(this.assets.values()).filter(asset => asset.type === type);
  }
  
  static getAssetsBySize(size: AssetInfo['size']): AssetInfo[] {
    return Array.from(this.assets.values()).filter(asset => asset.size === size);
  }
  
  static getRandomAsset(type?: AssetInfo['type'], size?: AssetInfo['size']): AssetInfo | null {
    let candidates = Array.from(this.assets.values());
    
    if (type) {
      candidates = candidates.filter(asset => asset.type === type);
    }
    
    if (size) {
      candidates = candidates.filter(asset => asset.size === size);
    }
    
    if (candidates.length === 0) return null;
    
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  
  static getAllAssets(): AssetInfo[] {
    return Array.from(this.assets.values());
  }

  static getBuildingAssets(): AssetInfo[] {
    return Array.from(this.buildingAssets.values());
  }

  static getBuildingAssetsByCategory(category: string): AssetInfo[] {
    return Array.from(this.buildingAssets.values()).filter(asset => 
      asset.category === category || asset.type === category
    );
  }

  static getBuildingAssetsByMaterial(material: string): AssetInfo[] {
    return Array.from(this.buildingAssets.values()).filter(asset => 
      asset.material === material
    );
  }

  static getBuildingAssetsByStyle(style: string): AssetInfo[] {
    return Array.from(this.buildingAssets.values()).filter(asset => 
      asset.style === style
    );
  }

  static getRandomBuildingAsset(filters?: {
    type?: string;
    material?: string;
    style?: string;
    category?: string;
  }): AssetInfo | null {
    let candidates = Array.from(this.buildingAssets.values());
    
    if (filters?.type) {
      candidates = candidates.filter(asset => asset.type === filters.type);
    }
    if (filters?.material) {
      candidates = candidates.filter(asset => asset.material === filters.material);
    }
    if (filters?.style) {
      candidates = candidates.filter(asset => asset.style === filters.style);
    }
    if (filters?.category) {
      candidates = candidates.filter(asset => asset.category === filters.category);
    }

    if (candidates.length === 0) return null;
    
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}