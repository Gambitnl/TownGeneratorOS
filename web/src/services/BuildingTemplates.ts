import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';

export interface RoomTemplate {
  id: string;
  name: string;
  type: 'living' | 'kitchen' | 'bedroom' | 'storage' | 'workshop' | 'common' | 'tavern_hall' | 'guest_room' | 'shop_floor' | 'cellar' | 'office';
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  preferredWidth: number;
  preferredHeight: number;
  required: boolean;
  priority: number; // Higher = placed first
  floorMaterial: 'wood_pine' | 'wood_oak' | 'stone_limestone' | 'brick_fired' | 'stone_marble';
  socialClassModifiers?: {
    poor?: { floorMaterial?: string };
    common?: { floorMaterial?: string };
    wealthy?: { floorMaterial?: string };
    noble?: { floorMaterial?: string };
  };
}

export interface BuildingTemplate {
  buildingType: BuildingType;
  minLotWidth: number;
  minLotHeight: number;
  maxLotWidth: number;
  maxLotHeight: number;
  preferredLotWidth: number;
  preferredLotHeight: number;
  minBuildingWidth: number;
  minBuildingHeight: number;
  rooms: RoomTemplate[];
}

export class BuildingTemplates {
  private static templates: { [key in BuildingType]: BuildingTemplate } = {
    house_small: {
      buildingType: 'house_small',
      minLotWidth: 16,
      minLotHeight: 14,
      maxLotWidth: 24,
      maxLotHeight: 20,
      preferredLotWidth: 20,
      preferredLotHeight: 16,
      minBuildingWidth: 8,
      minBuildingHeight: 6,
      rooms: [
        {
          id: 'main_room',
          name: 'Main Room',
          type: 'living',
          minWidth: 7,
          minHeight: 8,
          maxWidth: 10,
          maxHeight: 11,
          preferredWidth: 8,
          preferredHeight: 9, // Increased to fit table (2x2) + 4 chairs + circulation
          required: true,
          priority: 1,
          floorMaterial: 'wood_pine',
          socialClassModifiers: {
            wealthy: { floorMaterial: 'wood_oak' },
            noble: { floorMaterial: 'stone_marble' }
          }
        },
        {
          id: 'bedroom',
          name: 'Bedroom',
          type: 'bedroom',
          minWidth: 5,
          minHeight: 6,
          maxWidth: 7,
          maxHeight: 8,
          preferredWidth: 6,
          preferredHeight: 7, // Increased to fit bed (2x2) + chest + circulation
          required: true,
          priority: 2,
          floorMaterial: 'wood_pine',
          socialClassModifiers: {
            wealthy: { floorMaterial: 'wood_oak' },
            noble: { floorMaterial: 'wood_oak' }
          }
        },
        {
          id: 'storage',
          name: 'Storage',
          type: 'storage',
          minWidth: 3,
          minHeight: 3,
          maxWidth: 5,
          maxHeight: 4,
          preferredWidth: 4,
          preferredHeight: 3, // Increased to fit chest + shelves + access space
          required: false,
          priority: 3,
          floorMaterial: 'stone_limestone'
        }
      ]
    },

    house_large: {
      buildingType: 'house_large',
      minLotWidth: 24,
      minLotHeight: 20,
      maxLotWidth: 36,
      maxLotHeight: 30,
      preferredLotWidth: 28,
      preferredLotHeight: 24,
      minBuildingWidth: 12,
      minBuildingHeight: 10,
      rooms: [
        {
          id: 'main_hall',
          name: 'Main Hall',
          type: 'living',
          minWidth: 6,
          minHeight: 7,
          maxWidth: 10,
          maxHeight: 10,
          preferredWidth: 8,
          preferredHeight: 8,
          required: true,
          priority: 1,
          floorMaterial: 'wood_oak',
          socialClassModifiers: {
            poor: { floorMaterial: 'wood_pine' },
            noble: { floorMaterial: 'stone_marble' }
          }
        },
        {
          id: 'kitchen',
          name: 'Kitchen',
          type: 'kitchen',
          minWidth: 6,
          minHeight: 7,
          maxWidth: 8,
          maxHeight: 9,
          preferredWidth: 7,
          preferredHeight: 8, // Increased to fit oven (2x2) + work table + shelves + circulation
          required: true,
          priority: 2,
          floorMaterial: 'stone_limestone',
          socialClassModifiers: {
            wealthy: { floorMaterial: 'brick_fired' },
            noble: { floorMaterial: 'brick_fired' }
          }
        },
        {
          id: 'master_bedroom',
          name: 'Master Bedroom',
          type: 'bedroom',
          minWidth: 6,
          minHeight: 7,
          maxWidth: 9,
          maxHeight: 9,
          preferredWidth: 8,
          preferredHeight: 8, // Increased to fit double bed (2x2) + chest + additional storage + circulation
          required: true,
          priority: 3,
          floorMaterial: 'wood_oak',
          socialClassModifiers: {
            poor: { floorMaterial: 'wood_pine' },
            noble: { floorMaterial: 'wood_oak' }
          }
        },
        {
          id: 'secondary_bedroom',
          name: 'Guest Room',
          type: 'bedroom',
          minWidth: 5,
          minHeight: 5,
          maxWidth: 6,
          maxHeight: 6,
          preferredWidth: 5,
          preferredHeight: 6, // Increased to fit single bed (1x2) + basic storage + circulation
          required: false,
          priority: 4,
          floorMaterial: 'wood_pine',
          socialClassModifiers: {
            wealthy: { floorMaterial: 'wood_oak' }
          }
        },
        {
          id: 'storage',
          name: 'Storage Room',
          type: 'storage',
          minWidth: 2,
          minHeight: 3,
          maxWidth: 4,
          maxHeight: 4,
          preferredWidth: 3,
          preferredHeight: 3,
          required: false,
          priority: 5,
          floorMaterial: 'stone_limestone'
        }
      ]
    },

    tavern: {
      buildingType: 'tavern',
      minLotWidth: 26,
      minLotHeight: 22,
      maxLotWidth: 40,
      maxLotHeight: 34,
      preferredLotWidth: 30,
      preferredLotHeight: 26,
      minBuildingWidth: 16,
      minBuildingHeight: 14,
      rooms: [
        {
          id: 'common_room',
          name: 'Common Room',
          type: 'tavern_hall',
          minWidth: 10,
          minHeight: 10,
          maxWidth: 15,
          maxHeight: 15,
          preferredWidth: 12,
          preferredHeight: 12, // Increased to fit multiple large tables (2x2) + benches + circulation
          required: true,
          priority: 1,
          floorMaterial: 'wood_oak', // Heavy foot traffic
          socialClassModifiers: {
            poor: { floorMaterial: 'wood_pine' }
          }
        },
        {
          id: 'kitchen',
          name: 'Kitchen',
          type: 'kitchen',
          minWidth: 6,
          minHeight: 6,
          maxWidth: 8,
          maxHeight: 8,
          preferredWidth: 7,
          preferredHeight: 7, // Increased to fit commercial oven (2x2) + work tables + shelves
          required: true,
          priority: 2,
          floorMaterial: 'brick_fired', // Fire safety
          socialClassModifiers: {
            poor: { floorMaterial: 'stone_limestone' }
          }
        },
        {
          id: 'guest_room',
          name: 'Guest Room',
          type: 'guest_room',
          minWidth: 5,
          minHeight: 5,
          maxWidth: 6,
          maxHeight: 6,
          preferredWidth: 5,
          preferredHeight: 6, // Increased to fit single bed + basic storage + circulation
          required: false,
          priority: 3,
          floorMaterial: 'wood_pine'
        },
        {
          id: 'private_quarters',
          name: 'Innkeeper\'s Quarters',
          type: 'bedroom',
          minWidth: 3,
          minHeight: 4,
          maxWidth: 5,
          maxHeight: 5,
          preferredWidth: 4,
          preferredHeight: 4,
          required: true,
          priority: 4,
          floorMaterial: 'wood_pine',
          socialClassModifiers: {
            wealthy: { floorMaterial: 'wood_oak' }
          }
        },
        {
          id: 'cellar',
          name: 'Cellar',
          type: 'cellar',
          minWidth: 3,
          minHeight: 3,
          maxWidth: 5,
          maxHeight: 5,
          preferredWidth: 4,
          preferredHeight: 4,
          required: false,
          priority: 5,
          floorMaterial: 'stone_limestone' // Beer storage
        }
      ]
    },

    blacksmith: {
      buildingType: 'blacksmith',
      minLotWidth: 20,
      minLotHeight: 16,
      maxLotWidth: 30,
      maxLotHeight: 24,
      preferredLotWidth: 24,
      preferredLotHeight: 20,
      minBuildingWidth: 10,
      minBuildingHeight: 8,
      rooms: [
        {
          id: 'workshop',
          name: 'Forge Workshop',
          type: 'workshop',
          minWidth: 8,
          minHeight: 8,
          maxWidth: 12,
          maxHeight: 10,
          preferredWidth: 10,
          preferredHeight: 9, // Increased to fit forge + anvil + work tables + tool storage + circulation
          required: true,
          priority: 1,
          floorMaterial: 'brick_fired', // Heat resistant
          socialClassModifiers: {
            poor: { floorMaterial: 'stone_limestone' }
          }
        },
        {
          id: 'storage',
          name: 'Tool Storage',
          type: 'storage',
          minWidth: 3,
          minHeight: 3,
          maxWidth: 4,
          maxHeight: 4,
          preferredWidth: 3,
          preferredHeight: 3,
          required: true,
          priority: 2,
          floorMaterial: 'stone_limestone'
        },
        {
          id: 'living_quarters',
          name: 'Living Quarters',
          type: 'bedroom',
          minWidth: 3,
          minHeight: 4,
          maxWidth: 5,
          maxHeight: 5,
          preferredWidth: 4,
          preferredHeight: 4,
          required: false,
          priority: 3,
          floorMaterial: 'wood_pine',
          socialClassModifiers: {
            wealthy: { floorMaterial: 'wood_oak' }
          }
        }
      ]
    },

    shop: {
      buildingType: 'shop',
      minLotWidth: 18,
      minLotHeight: 16,
      maxLotWidth: 28,
      maxLotHeight: 22,
      preferredLotWidth: 22,
      preferredLotHeight: 18,
      minBuildingWidth: 8,
      minBuildingHeight: 6,
      rooms: [
        {
          id: 'shop_floor',
          name: 'Shop Floor',
          type: 'shop_floor',
          minWidth: 8,
          minHeight: 7,
          maxWidth: 12,
          maxHeight: 10,
          preferredWidth: 10,
          preferredHeight: 8, // Increased to fit display tables + shelves + customer circulation
          required: true,
          priority: 1,
          floorMaterial: 'wood_oak', // Presentable for customers
          socialClassModifiers: {
            poor: { floorMaterial: 'wood_pine' },
            noble: { floorMaterial: 'stone_marble' }
          }
        },
        {
          id: 'storage',
          name: 'Storage',
          type: 'storage',
          minWidth: 3,
          minHeight: 3,
          maxWidth: 4,
          maxHeight: 4,
          preferredWidth: 3,
          preferredHeight: 3,
          required: true,
          priority: 2,
          floorMaterial: 'wood_pine'
        },
        {
          id: 'office',
          name: 'Office',
          type: 'office',
          minWidth: 2,
          minHeight: 3,
          maxWidth: 4,
          maxHeight: 4,
          preferredWidth: 3,
          preferredHeight: 3,
          required: false,
          priority: 3,
          floorMaterial: 'wood_pine',
          socialClassModifiers: {
            wealthy: { floorMaterial: 'wood_oak' }
          }
        }
      ]
    },

    market_stall: {
      buildingType: 'market_stall',
      minLotWidth: 10,
      minLotHeight: 8,
      maxLotWidth: 16,
      maxLotHeight: 12,
      preferredLotWidth: 12,
      preferredLotHeight: 10,
      minBuildingWidth: 4,
      minBuildingHeight: 4,
      rooms: [
        {
          id: 'stall',
          name: 'Market Stall',
          type: 'shop_floor',
          minWidth: 4,
          minHeight: 3,
          maxWidth: 6,
          maxHeight: 5,
          preferredWidth: 5,
          preferredHeight: 4,
          required: true,
          priority: 1,
          floorMaterial: 'wood_pine', // Simple stall
          socialClassModifiers: {
            wealthy: { floorMaterial: 'wood_oak' }
          }
        }
      ]
    }
  };

  static getTemplate(buildingType: BuildingType): BuildingTemplate {
    return this.templates[buildingType];
  }

  static getAllTemplates(): { [key in BuildingType]: BuildingTemplate } {
    return this.templates;
  }

  static getFloorMaterial(room: RoomTemplate, socialClass: SocialClass): string {
    const modifier = room.socialClassModifiers?.[socialClass];
    return modifier?.floorMaterial || room.floorMaterial;
  }

  static getRoomsByPriority(buildingType: BuildingType): RoomTemplate[] {
    const template = this.getTemplate(buildingType);
    return [...template.rooms].sort((a, b) => a.priority - b.priority);
  }

  static getRequiredRooms(buildingType: BuildingType): RoomTemplate[] {
    const template = this.getTemplate(buildingType);
    return template.rooms.filter(room => room.required);
  }

  static getOptionalRooms(buildingType: BuildingType): RoomTemplate[] {
    const template = this.getTemplate(buildingType);
    return template.rooms.filter(room => !room.required);
  }

  static calculateMinimumBuildingSize(buildingType: BuildingType): { width: number; height: number } {
    const template = this.getTemplate(buildingType);
    const requiredRooms = this.getRequiredRooms(buildingType);
    
    // Simple estimation - sum of minimum room areas + walls and corridors
    let totalMinArea = requiredRooms.reduce((sum, room) => 
      sum + (room.minWidth * room.minHeight), 0
    );
    
    // Add 30% overhead for walls and corridors
    totalMinArea *= 1.3;
    
    // Convert to rectangular approximation
    const aspectRatio = template.preferredLotWidth / template.preferredLotHeight;
    const width = Math.ceil(Math.sqrt(totalMinArea * aspectRatio));
    const height = Math.ceil(totalMinArea / width);
    
    return {
      width: Math.max(width, template.minBuildingWidth),
      height: Math.max(height, template.minBuildingHeight)
    };
  }
}