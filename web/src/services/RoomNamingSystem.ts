import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { RoomFunction } from './FloorMaterialSystem';

export interface RoomNamingTemplate {
  function: RoomFunction;
  baseName: string;
  floorSpecificNames?: { [floor: string]: string };
  socialClassVariants?: { [key in SocialClass]?: string };
  alternativeNames: string[];
  maxInstances: number;
}

export interface NamedRoom {
  function: RoomFunction;
  name: string;
  floor: number;
  buildingType: BuildingType;
  socialClass: SocialClass;
  instanceNumber: number;
}

export class RoomNamingSystem {
  private static namingTemplates: { [key in RoomFunction]: RoomNamingTemplate } = {
    living: {
      function: 'living',
      baseName: 'Main Hall',
      floorSpecificNames: {
        0: 'Great Hall',
        1: 'Upper Hall',
        2: 'Chamber Hall'
      },
      socialClassVariants: {
        poor: 'Common Room',
        common: 'Main Room',
        wealthy: 'Great Hall',
        noble: 'Grand Hall'
      },
      alternativeNames: ['Reception Hall', 'Family Room', 'Parlour'],
      maxInstances: 1
    },

    kitchen: {
      function: 'kitchen',
      baseName: 'Kitchen',
      floorSpecificNames: {
        0: 'Main Kitchen',
        '-1': 'Preparation Kitchen'
      },
      socialClassVariants: {
        poor: 'Cookery',
        common: 'Kitchen',
        wealthy: 'Grand Kitchen',
        noble: 'Royal Kitchen'
      },
      alternativeNames: ['Scullery', 'Cookhouse'],
      maxInstances: 2
    },

    bedroom: {
      function: 'bedroom',
      baseName: 'Bedchamber',
      floorSpecificNames: {
        0: 'Master Chamber',
        1: 'Upper Chamber',
        2: 'Garret Chamber'
      },
      socialClassVariants: {
        poor: 'Sleeping Room',
        common: 'Bedchamber',
        wealthy: 'Master Suite',
        noble: 'Royal Suite'
      },
      alternativeNames: [
        'First Chamber',
        'Second Chamber', 
        'Guest Chamber',
        'Servants\' Chamber',
        'Solar',
        'Private Chamber'
      ],
      maxInstances: 6
    },

    storage: {
      function: 'storage',
      baseName: 'Storeroom',
      floorSpecificNames: {
        0: 'Pantry',
        1: 'Upper Storage',
        2: 'Garret Storage',
        '-1': 'Root Cellar'
      },
      socialClassVariants: {
        poor: 'Storage',
        common: 'Storeroom',
        wealthy: 'Pantry',
        noble: 'Royal Stores'
      },
      alternativeNames: [
        'Larder',
        'Dry Goods Store',
        'Supply Room',
        'Provisions Room',
        'Garner'
      ],
      maxInstances: 4
    },

    workshop: {
      function: 'workshop',
      baseName: 'Workshop',
      floorSpecificNames: {
        0: 'Main Workshop',
        1: 'Upper Workshop'
      },
      socialClassVariants: {
        poor: 'Work Room',
        common: 'Workshop',
        wealthy: 'Master Workshop',
        noble: 'Guild Workshop'
      },
      alternativeNames: [
        'Forge',
        'Smithy',
        'Craftsman\'s Hall',
        'Atelier',
        'Studio'
      ],
      maxInstances: 2
    },

    common: {
      function: 'common',
      baseName: 'Common Room',
      floorSpecificNames: {
        0: 'Main Room',
        1: 'Upper Room'
      },
      socialClassVariants: {
        poor: 'Common Room',
        common: 'Main Room',
        wealthy: 'Reception Room',
        noble: 'Audience Chamber'
      },
      alternativeNames: ['Gathering Room', 'Meeting Room'],
      maxInstances: 3
    },

    tavern_hall: {
      function: 'tavern_hall',
      baseName: 'Tavern Hall',
      floorSpecificNames: {
        0: 'Main Hall',
        1: 'Upper Hall'
      },
      socialClassVariants: {
        poor: 'Ale Room',
        common: 'Tavern Hall',
        wealthy: 'Grand Tavern',
        noble: 'Royal Inn'
      },
      alternativeNames: [
        'Common Hall',
        'Drinking Hall',
        'Great Room',
        'Inn Hall'
      ],
      maxInstances: 2
    },

    guest_room: {
      function: 'guest_room',
      baseName: 'Guest Chamber',
      floorSpecificNames: {
        0: 'Ground Guest Room',
        1: 'Guest Chamber',
        2: 'Upper Guest Room'
      },
      socialClassVariants: {
        poor: 'Lodging Room',
        common: 'Guest Room',
        wealthy: 'Guest Suite',
        noble: 'Noble Quarter'
      },
      alternativeNames: [
        'Visitors\' Room',
        'Lodging',
        'Travelers\' Rest',
        'Inn Chamber'
      ],
      maxInstances: 8
    },

    shop_floor: {
      function: 'shop_floor',
      baseName: 'Shop Floor',
      floorSpecificNames: {
        0: 'Main Shop',
        1: 'Upper Shop'
      },
      socialClassVariants: {
        poor: 'Market Space',
        common: 'Shop Floor',
        wealthy: 'Merchant Hall',
        noble: 'Guild Shop'
      },
      alternativeNames: [
        'Trading Floor',
        'Merchant Space',
        'Sales Hall',
        'Commerce Room'
      ],
      maxInstances: 2
    },

    cellar: {
      function: 'cellar',
      baseName: 'Cellar',
      floorSpecificNames: {
        '-1': 'Wine Cellar',
        '-2': 'Deep Cellar'
      },
      socialClassVariants: {
        poor: 'Root Cellar',
        common: 'Storage Cellar',
        wealthy: 'Wine Cellar',
        noble: 'Royal Vault'
      },
      alternativeNames: [
        'Vault',
        'Undercroft',
        'Crypt',
        'Storage Vault',
        'Provisioning Cellar'
      ],
      maxInstances: 3
    },

    office: {
      function: 'office',
      baseName: 'Office',
      floorSpecificNames: {
        0: 'Counting Room',
        1: 'Private Office'
      },
      socialClassVariants: {
        poor: 'Work Room',
        common: 'Office',
        wealthy: 'Study',
        noble: 'Private Study'
      },
      alternativeNames: [
        'Study',
        'Scriptorium',
        'Accounting Room',
        'Business Room',
        'Private Chamber'
      ],
      maxInstances: 2
    }
  };

  private static usedNames: Map<string, number> = new Map();
  private static roomCounts: Map<string, number> = new Map();

  static generateRoomName(
    roomFunction: RoomFunction,
    floor: number,
    buildingType: BuildingType,
    socialClass: SocialClass,
    buildingId: string,
    seed?: number
  ): string {
    
    const template = this.namingTemplates[roomFunction];
    const buildingKey = `${buildingId}_${roomFunction}`;
    
    // Get current instance count for this room type in this building
    const currentCount = this.roomCounts.get(buildingKey) || 0;
    const instanceNumber = currentCount + 1;
    
    // Update count
    this.roomCounts.set(buildingKey, instanceNumber);

    // Start with base name selection
    let selectedName = template.baseName;

    // 1. Check for floor-specific name
    if (template.floorSpecificNames && template.floorSpecificNames[floor.toString()]) {
      selectedName = template.floorSpecificNames[floor.toString()];
    }

    // 2. Apply social class variant if available
    else if (template.socialClassVariants && template.socialClassVariants[socialClass]) {
      selectedName = template.socialClassVariants[socialClass];
    }

    // 3. Handle multiple instances with alternative names
    if (instanceNumber > 1 && instanceNumber <= template.alternativeNames.length + 1) {
      selectedName = template.alternativeNames[instanceNumber - 2];
    }

    // 4. Add numbering for excess instances
    else if (instanceNumber > template.alternativeNames.length + 1) {
      const baseForNumbering = template.floorSpecificNames?.[floor.toString()] || 
                              template.socialClassVariants?.[socialClass] || 
                              template.baseName;
      selectedName = `${baseForNumbering} ${instanceNumber}`;
    }

    // 5. Add contextual prefixes for specific building types
    selectedName = this.applyBuildingContext(selectedName, roomFunction, buildingType, floor);

    // 6. Ensure uniqueness within building
    const fullKey = `${buildingId}_${selectedName}`;
    const existingCount = this.usedNames.get(fullKey) || 0;
    
    if (existingCount > 0) {
      selectedName = `${selectedName} ${existingCount + 1}`;
    }
    
    this.usedNames.set(fullKey, existingCount + 1);

    return selectedName;
  }

  private static applyBuildingContext(
    roomName: string,
    roomFunction: RoomFunction,
    buildingType: BuildingType,
    floor: number
  ): string {
    
    // Add building-specific prefixes
    const buildingPrefixes: { [key in BuildingType]?: { [key in RoomFunction]?: string } } = {
      tavern: {
        bedroom: floor === 0 ? 'Innkeeper\'s' : 'Guest',
        storage: 'Tavern',
        kitchen: 'Inn'
      },
      blacksmith: {
        workshop: 'Forge',
        storage: 'Tool',
        bedroom: 'Smith\'s'
      },
      shop: {
        storage: 'Merchant',
        office: 'Trading',
        bedroom: 'Shopkeeper\'s'
      }
    };

    const prefix = buildingPrefixes[buildingType]?.[roomFunction];
    if (prefix && !roomName.includes(prefix)) {
      return `${prefix} ${roomName}`;
    }

    return roomName;
  }

  static resetNamingForBuilding(buildingId: string): void {
    // Clear all names for a specific building
    const keysToDelete = Array.from(this.usedNames.keys()).filter(key => key.startsWith(buildingId));
    keysToDelete.forEach(key => this.usedNames.delete(key));
    
    const countsToDelete = Array.from(this.roomCounts.keys()).filter(key => key.startsWith(buildingId));
    countsToDelete.forEach(key => this.roomCounts.delete(key));
  }

  static validateRoomName(
    roomName: string,
    roomFunction: RoomFunction,
    buildingType: BuildingType
  ): { valid: boolean; suggestions: string[] } {
    
    const template = this.namingTemplates[roomFunction];
    const suggestions: string[] = [];
    
    // Check if name matches function
    const validNames = [
      template.baseName,
      ...Object.values(template.floorSpecificNames || {}),
      ...Object.values(template.socialClassVariants || {}),
      ...template.alternativeNames
    ];

    const isValid = validNames.some(name => 
      roomName.toLowerCase().includes(name.toLowerCase())
    );

    if (!isValid) {
      suggestions.push(template.baseName);
      suggestions.push(...template.alternativeNames.slice(0, 3));
    }

    return {
      valid: isValid,
      suggestions
    };
  }

  static getRoomSuggestions(
    roomFunction: RoomFunction,
    floor: number,
    socialClass: SocialClass,
    buildingType: BuildingType
  ): string[] {
    
    const template = this.namingTemplates[roomFunction];
    const suggestions: string[] = [];

    // Add floor-specific name if available
    if (template.floorSpecificNames?.[floor.toString()]) {
      suggestions.push(template.floorSpecificNames[floor.toString()]);
    }

    // Add social class variant
    if (template.socialClassVariants?.[socialClass]) {
      suggestions.push(template.socialClassVariants[socialClass]);
    }

    // Add base name
    suggestions.push(template.baseName);

    // Add a few alternatives
    suggestions.push(...template.alternativeNames.slice(0, 2));

    return [...new Set(suggestions)]; // Remove duplicates
  }
}