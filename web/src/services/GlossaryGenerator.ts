import buildingTemplates from '../data/buildingTemplates.json';
import furnitureTemplates from '../data/furnitureTemplates.json';
import materials from '../data/materials.json';
import { BuildingType, SocialClass, RoomFunction } from './SimpleBuildingGenerator';

export interface GlossaryItem {
  id: string;
  name: string;
  type: 'furniture' | 'material' | 'structural' | 'room';
  symbol: string;
  color: string;
  description: string;
  size: string;
  usage: string[];
  buildingTypes?: BuildingType[];
  socialClasses?: SocialClass[];
}

export interface GlossaryCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: GlossaryItem[];
}

export class GlossaryGenerator {
  
  static generateDynamicGlossary(): GlossaryCategory[] {
    const categories: GlossaryCategory[] = [];
    
    // Generate furniture category from actual data
    categories.push(this.generateFurnitureCategory());
    
    // Generate materials category from actual data
    categories.push(this.generateMaterialsCategory());
    
    // Generate building types category
    categories.push(this.generateBuildingTypesCategory());
    
    // Generate room types category
    categories.push(this.generateRoomTypesCategory());
    
    return categories;
  }

  private static generateFurnitureCategory(): GlossaryCategory {
    const items: GlossaryItem[] = [];
    
    // Extract all unique furniture from JSON data
    const furnitureMap = new Map<string, GlossaryItem>();
    
    for (const [roomType, categories] of Object.entries(furnitureTemplates.furnitureByRoom)) {
      for (const [categoryName, furnitureList] of Object.entries(categories)) {
        for (const furniture of furnitureList as any[]) {
          if (!furnitureMap.has(furniture.type)) {
            furnitureMap.set(furniture.type, {
              id: furniture.type,
              name: furniture.name,
              type: 'furniture',
              symbol: this.getFurnitureSymbol(furniture.type),
              color: this.getFurnitureColor(furniture.type),
              description: this.generateFurnitureDescription(furniture.type),
              size: `${furniture.width}×${furniture.height} tiles (${furniture.width * 5}×${furniture.height * 5} feet)`,
              usage: [roomType, `${categoryName} furniture`],
              buildingTypes: this.getBuildingTypesForFurniture(furniture.type),
              socialClasses: this.getSocialClassesForFurniture(furniture.type, categoryName)
            });
          } else {
            // Add additional usage contexts
            const existing = furnitureMap.get(furniture.type)!;
            if (!existing.usage.includes(roomType)) {
              existing.usage.push(roomType);
            }
          }
        }
      }
    }
    
    return {
      id: 'furniture',
      name: 'Furniture & Objects',
      icon: '🪑',
      description: 'Movable furnishings derived from actual building generation data',
      items: Array.from(furnitureMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  private static generateMaterialsCategory(): GlossaryCategory {
    const items: GlossaryItem[] = [];
    
    for (const [socialClass, materialSet] of Object.entries(materials.materialsByClass)) {
      for (const [materialType, materialData] of Object.entries(materialSet)) {
        const material = materialData as any;
        items.push({
          id: `${socialClass}_${materialType}`,
          name: `${material.primary} (${socialClass})`,
          type: 'material',
          symbol: this.getMaterialSymbol(materialType),
          color: material.color,
          description: `${material.primary} used for ${materialType} in ${socialClass} class buildings`,
          size: '1×1 tile (5×5 feet)',
          usage: [`${socialClass} buildings`, materialType],
          socialClasses: [socialClass as SocialClass]
        });
      }
    }
    
    return {
      id: 'materials',
      name: 'Building Materials',
      icon: '🧱',
      description: 'Construction materials organized by social class and usage',
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  private static generateBuildingTypesCategory(): GlossaryCategory {
    const items: GlossaryItem[] = [];
    
    for (const [buildingType, defaultSize] of Object.entries(buildingTemplates.defaultSizes)) {
      const roomPlan = buildingTemplates.roomPlans[buildingType as BuildingType];
      
      items.push({
        id: buildingType,
        name: buildingType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'structural',
        symbol: this.getBuildingSymbol(buildingType as BuildingType),
        color: '#8B4513',
        description: `${roomPlan ? roomPlan.length : 0} room building type`,
        size: `${defaultSize.width}×${defaultSize.height} tiles base size`,
        usage: roomPlan ? roomPlan.map(room => room.function) : [],
        buildingTypes: [buildingType as BuildingType]
      });
    }
    
    return {
      id: 'buildings',
      name: 'Building Types',
      icon: '🏠',
      description: 'Available building types with their default configurations',
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  private static generateRoomTypesCategory(): GlossaryCategory {
    const items: GlossaryItem[] = [];
    const roomTypes = new Set<string>();
    
    // Collect all room types from building templates
    for (const roomPlan of Object.values(buildingTemplates.roomPlans)) {
      for (const room of roomPlan) {
        roomTypes.add(room.function);
      }
    }
    
    for (const roomType of roomTypes) {
      const furnitureList = furnitureTemplates.furnitureByRoom[roomType] || {};
      const furnitureCount = Object.values(furnitureList).flat().length;
      
      items.push({
        id: roomType,
        name: roomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'room',
        symbol: this.getRoomSymbol(roomType as RoomFunction),
        color: '#4682B4',
        description: `Room type with ${furnitureCount} possible furniture items`,
        size: 'Variable size based on building layout',
        usage: this.getBuildingTypesWithRoom(roomType as RoomFunction),
        buildingTypes: this.getBuildingTypesWithRoom(roomType as RoomFunction) as BuildingType[]
      });
    }
    
    return {
      id: 'rooms',
      name: 'Room Types',
      icon: '🏴',
      description: 'Room functions and their typical contents',
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  // Helper methods for symbols and colors
  private static getFurnitureSymbol(type: string): string {
    const symbols: { [key: string]: string } = {
      'bed': '🛏️', 'chair': '🪑', 'table': '🍽️', 'chest': '📦',
      'stove': '🔥', 'workbench': '🔨', 'anvil': '⚒️', 'counter': '📊',
      'shelf': '📚', 'barrel': '🛢️', 'fireplace': '🔥', 'wardrobe': '👗',
      'mirror': '🪞', 'bookshelf': '📚', 'cabinet': '🗄️', 'pantry': '🥫',
      'tool_rack': '🔧', 'grindstone': '⚪', 'display_case': '💎',
      'crate': '📦', 'sack': '🧺', 'strongbox': '🔒', 'coat_rack': '🧥',
      'bench': '🪑', 'carpet': '🔲'
    };
    return symbols[type] || '📦';
  }

  private static getFurnitureColor(type: string): string {
    const colors: { [key: string]: string } = {
      'bed': '#8B0000', 'chair': '#D2691E', 'table': '#CD853F',
      'chest': '#8B4513', 'stove': '#2F4F4F', 'workbench': '#8B4513',
      'anvil': '#696969', 'counter': '#DEB887', 'shelf': '#CD853F',
      'barrel': '#8B4513', 'fireplace': '#B22222'
    };
    return colors[type] || '#8B4513';
  }

  private static getMaterialSymbol(type: string): string {
    const symbols: { [key: string]: string } = {
      'walls': '🧱', 'roof': '🏠', 'floors': '▫️', 'doors': '🚪', 'windows': '🪟'
    };
    return symbols[type] || '🧱';
  }

  private static getBuildingSymbol(type: BuildingType): string {
    const symbols: { [key in BuildingType]: string } = {
      'house_small': '🏘️', 'house_large': '🏠', 'tavern': '🍺',
      'blacksmith': '⚒️', 'shop': '🏪', 'market_stall': '🛒'
    };
    return symbols[type];
  }

  private static getRoomSymbol(type: RoomFunction): string {
    const symbols: { [key in RoomFunction]: string } = {
      'bedroom': '🛏️', 'kitchen': '🍳', 'common': '🪑',
      'shop': '🛒', 'workshop': '🔨', 'storage': '📦', 'entrance': '🚪'
    };
    return symbols[type];
  }

  private static generateFurnitureDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'bed': 'Sleeping furniture for rest and recovery',
      'chair': 'Single-person seating, positioned adjacent to tables',
      'table': 'Flat surface for dining, work, or display - chairs auto-place nearby',
      'chest': 'Storage container for personal belongings',
      'stove': 'Cooking appliance for food preparation',
      'workbench': 'Sturdy work surface for crafting',
      'anvil': 'Heavy iron block for metalworking',
      'counter': 'Service counter for shops and taverns',
      'shelf': 'Storage shelving for displaying goods',
      'barrel': 'Large container for liquids or bulk storage',
      'fireplace': 'Central heating and cooking facility'
    };
    return descriptions[type] || `Functional ${type} for medieval buildings`;
  }

  private static getBuildingTypesForFurniture(furnitureType: string): BuildingType[] {
    // Logic to determine which building types commonly use this furniture
    const commonFurniture = ['chair', 'table', 'chest'];
    if (commonFurniture.includes(furnitureType)) {
      return ['house_small', 'house_large', 'tavern'];
    }
    
    const workshopFurniture = ['workbench', 'anvil', 'tool_rack'];
    if (workshopFurniture.includes(furnitureType)) {
      return ['blacksmith', 'house_large'];
    }
    
    const shopFurniture = ['counter', 'shelf', 'display_case'];
    if (shopFurniture.includes(furnitureType)) {
      return ['shop', 'market_stall', 'tavern'];
    }
    
    return [];
  }

  private static getSocialClassesForFurniture(furnitureType: string, category: string): SocialClass[] {
    if (category === 'essential') {
      return ['poor', 'common', 'wealthy', 'noble'];
    } else if (category === 'common') {
      return ['common', 'wealthy', 'noble'];
    } else if (category === 'luxury') {
      return ['wealthy', 'noble'];
    }
    return ['common'];
  }

  private static getBuildingTypesWithRoom(roomType: RoomFunction): string[] {
    const buildingTypes: string[] = [];
    
    for (const [buildingType, roomPlan] of Object.entries(buildingTemplates.roomPlans)) {
      if (roomPlan.some(room => room.function === roomType)) {
        buildingTypes.push(buildingType.replace('_', ' '));
      }
    }
    
    return buildingTypes;
  }

  // Filter glossary for specific context
  static filterGlossaryForBuilding(
    categories: GlossaryCategory[], 
    buildingType?: BuildingType, 
    socialClass?: SocialClass
  ): GlossaryCategory[] {
    if (!buildingType && !socialClass) return categories;
    
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        if (buildingType && item.buildingTypes && !item.buildingTypes.includes(buildingType)) {
          return false;
        }
        if (socialClass && item.socialClasses && !item.socialClasses.includes(socialClass)) {
          return false;
        }
        return true;
      })
    })).filter(category => category.items.length > 0);
  }
}