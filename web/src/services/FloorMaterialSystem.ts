import { MaterialLibrary, Material } from './MaterialLibrary';
import { SocialClass, BuildingType } from './StandaloneBuildingGenerator';

export type RoomFunction = 
  | 'living'      // Main living spaces
  | 'kitchen'     // Food preparation - fire resistant needed
  | 'bedroom'     // Sleeping quarters
  | 'storage'     // Storage/pantry - cool and dry
  | 'workshop'    // Work areas - durable and heat resistant
  | 'common'      // General purpose
  | 'tavern_hall' // High traffic areas
  | 'guest_room'  // Basic lodging
  | 'shop_floor'  // Customer areas - presentable
  | 'cellar'      // Underground storage - stone preferred
  | 'office';     // Administrative spaces

export interface FloorMaterialRecommendation {
  primary: string;    // Best material for this function
  secondary: string;  // Fallback option
  avoid: string[];    // Materials to avoid
  reasoning: string;  // Why this material is recommended
}

export class FloorMaterialSystem {
  private static materialRecommendations: { [key in RoomFunction]: FloorMaterialRecommendation } = {
    living: {
      primary: 'wood_oak',
      secondary: 'wood_pine',
      avoid: ['brick_fired'], // Too cold for living
      reasoning: 'Wood provides warmth and comfort for daily living'
    },
    
    kitchen: {
      primary: 'brick_fired',
      secondary: 'stone_limestone',
      avoid: ['wood_pine', 'wood_oak'], // Fire hazard near cooking fires
      reasoning: 'Fire-resistant materials essential near cooking fires'
    },
    
    bedroom: {
      primary: 'wood_oak',
      secondary: 'wood_pine',
      avoid: ['brick_fired', 'stone_limestone'], // Too cold for sleeping
      reasoning: 'Warm wood floors for comfort and insulation'
    },
    
    storage: {
      primary: 'stone_limestone',
      secondary: 'brick_fired',
      avoid: [], // Stone keeps cool and dry for food storage
      reasoning: 'Stone keeps storage areas cool and dry, prevents spoilage'
    },
    
    workshop: {
      primary: 'brick_fired',
      secondary: 'stone_limestone',
      avoid: ['wood_pine', 'wood_oak'], // Fire hazard near forges/tools
      reasoning: 'Heat and impact resistant for heavy work and potential fire hazards'
    },
    
    common: {
      primary: 'wood_oak',
      secondary: 'wood_pine',
      avoid: [],
      reasoning: 'Durable wood for general use and foot traffic'
    },
    
    tavern_hall: {
      primary: 'wood_oak',
      secondary: 'stone_limestone',
      avoid: ['wood_pine'], // Not durable enough for heavy foot traffic
      reasoning: 'Durable materials to withstand heavy foot traffic and spills'
    },
    
    guest_room: {
      primary: 'wood_pine',
      secondary: 'wood_oak',
      avoid: ['brick_fired', 'stone_limestone'], // Too cold and unwelcoming
      reasoning: 'Basic but comfortable wooden floors for temporary lodging'
    },
    
    shop_floor: {
      primary: 'wood_oak',
      secondary: 'stone_marble',
      avoid: ['wood_pine'], // Not presentable enough for customers
      reasoning: 'Presentable materials that impress customers and withstand traffic'
    },
    
    cellar: {
      primary: 'stone_limestone',
      secondary: 'brick_fired',
      avoid: ['wood_pine', 'wood_oak'], // Moisture issues underground
      reasoning: 'Stone resists moisture and maintains cool temperatures for storage'
    },
    
    office: {
      primary: 'wood_oak',
      secondary: 'wood_pine',
      avoid: [],
      reasoning: 'Professional appearance with comfortable wooden floors'
    }
  };

  private static socialClassMaterialUpgrades: { [key in SocialClass]: { [key: string]: string } } = {
    poor: {
      // Poor downgrade expensive materials to cheaper alternatives
      'wood_oak': 'wood_pine',
      'stone_marble': 'stone_limestone',
      'brick_fired': 'stone_limestone'
    },
    
    common: {
      // Common class uses standard materials (no changes)
    },
    
    wealthy: {
      // Wealthy upgrade basic materials
      'wood_pine': 'wood_oak',
      'stone_limestone': 'brick_fired'
    },
    
    noble: {
      // Noble class gets the best materials
      'wood_pine': 'wood_oak',
      'stone_limestone': 'stone_marble',
      'brick_fired': 'stone_marble'
    }
  };

  private static climateConsiderations: { 
    [climate: string]: { 
      preferred: string[], 
      avoid: string[], 
      reasoning: string 
    } 
  } = {
    cold: {
      preferred: ['wood_oak', 'wood_pine'], // Insulating properties
      avoid: ['stone_marble', 'brick_fired'], // Too cold in winter
      reasoning: 'Wood provides better insulation in cold climates'
    },
    
    hot: {
      preferred: ['stone_limestone', 'stone_marble', 'brick_fired'], // Cooling properties
      avoid: [], // Wood still acceptable but stone is cooler
      reasoning: 'Stone and brick stay cooler in hot weather'
    },
    
    wet: {
      preferred: ['stone_limestone', 'brick_fired'], // Moisture resistant
      avoid: ['wood_pine'], // More susceptible to rot
      reasoning: 'Stone materials resist moisture damage'
    },
    
    dry: {
      preferred: ['wood_oak', 'wood_pine', 'stone_limestone'],
      avoid: [], // Most materials work well in dry climates
      reasoning: 'Dry conditions are ideal for most materials'
    },
    
    temperate: {
      preferred: ['wood_oak', 'stone_limestone'], // Balanced choice
      avoid: [],
      reasoning: 'Moderate climate allows for balanced material choices'
    }
  };

  static selectFloorMaterial(
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    climate: string = 'temperate',
    buildingType?: BuildingType,
    seed?: number
  ): { material: string; colorHex: string; reasoning: string } {
    
    // Start with room function recommendation
    const recommendation = this.materialRecommendations[roomFunction];
    if (!recommendation) {
      console.warn(`No material recommendation found for room function: ${roomFunction}, defaulting to 'common'`);
      return this.selectFloorMaterial('common', socialClass, climate, buildingType, seed);
    }
    let selectedMaterial = recommendation.primary;
    
    // Apply social class modifications
    const classUpgrades = this.socialClassMaterialUpgrades[socialClass];
    if (classUpgrades && classUpgrades[selectedMaterial]) {
      selectedMaterial = classUpgrades[selectedMaterial];
    }
    
    // Consider climate preferences
    const climateData = this.climateConsiderations[climate];
    if (climateData) {
      // If selected material is in avoid list, use secondary
      if (climateData.avoid.includes(selectedMaterial)) {
        let fallback = recommendation.secondary;
        if (classUpgrades && classUpgrades[fallback]) {
          fallback = classUpgrades[fallback];
        }
        selectedMaterial = fallback;
      }
      
      // If climate has strong preferences, consider using them
      if (climateData.preferred.length > 0 && seed) {
        const random = this.seedRandom(seed);
        if (random < 0.3) { // 30% chance to use climate-preferred material
          const preferredOptions = climateData.preferred.filter(mat => 
            !recommendation.avoid.includes(mat)
          );
          if (preferredOptions.length > 0) {
            selectedMaterial = preferredOptions[Math.floor(random * preferredOptions.length)];
          }
        }
      }
    }
    
    // Get material properties from MaterialLibrary
    const material = MaterialLibrary.getMaterial(selectedMaterial);
    const colorHex = material?.color || '#DEB887'; // Default wood color
    
    // Create comprehensive reasoning
    let reasoning = recommendation.reasoning;
    if (classUpgrades && classUpgrades[recommendation.primary]) {
      reasoning += `. Upgraded for ${socialClass} class.`;
    }
    if (climateData && (climateData.avoid.includes(recommendation.primary) || 
        climateData.preferred.includes(selectedMaterial))) {
      reasoning += ` Climate consideration: ${climateData.reasoning}.`;
    }
    
    return {
      material: selectedMaterial,
      colorHex,
      reasoning
    };
  }

  static getWallMaterial(
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    climate: string = 'temperate'
  ): { material: string; colorHex: string } {
    // Walls are typically one tier above floors in material quality
    const floorMaterial = this.selectFloorMaterial(roomFunction, socialClass, climate);
    
    let wallMaterial: string;
    switch (floorMaterial.material) {
      case 'wood_pine':
        wallMaterial = socialClass === 'poor' ? 'wood_pine' : 'wood_oak';
        break;
      case 'wood_oak':
        wallMaterial = socialClass === 'noble' ? 'stone_limestone' : 'wood_oak';
        break;
      case 'stone_limestone':
        wallMaterial = socialClass === 'noble' ? 'stone_marble' : 'stone_limestone';
        break;
      case 'brick_fired':
        wallMaterial = 'brick_fired';
        break;
      case 'stone_marble':
        wallMaterial = 'stone_marble';
        break;
      default:
        wallMaterial = 'wood_oak';
    }
    
    const material = MaterialLibrary.getMaterial(wallMaterial);
    return {
      material: wallMaterial,
      colorHex: material?.color || '#8B4513'
    };
  }

  static getMaterialProperties(materialName: string): Material | null {
    return MaterialLibrary.getMaterial(materialName);
  }

  static validateMaterialChoice(
    material: string,
    roomFunction: RoomFunction,
    socialClass: SocialClass
  ): { valid: boolean; warnings: string[] } {
    const recommendation = this.materialRecommendations[roomFunction];
    const warnings: string[] = [];
    
    // Check if material is in avoid list
    if (recommendation.avoid.includes(material)) {
      warnings.push(`${material} not recommended for ${roomFunction}: ${recommendation.reasoning}`);
    }
    
    // Check social class appropriateness
    const materialData = MaterialLibrary.getMaterial(material);
    if (materialData && !materialData.socialClassAccess[socialClass]) {
      warnings.push(`${material} not accessible to ${socialClass} social class`);
    }
    
    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}