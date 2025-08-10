// Dynamic Building Contents & Inventory System
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'tool' | 'treasure' | 'consumable' | 'trade_good' | 'document' | 'art' | 'clothing' | 'food' | 'material';
  value: number; // In gold pieces
  weight: number; // In pounds
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  quantity: number;
  condition: 'poor' | 'fair' | 'good' | 'excellent' | 'masterwork';
  properties: string[]; // 'magical', 'cursed', 'fragile', 'valuable', 'illegal'
  containerLocation?: string; // Which container/room it's in
  hidden: boolean; // Requires search to find
  searchDC?: number; // DC to discover if hidden
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  roomTypes: string[];
  seasonalVariation?: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  }; // Quantity multipliers by season
}

export interface Container {
  id: string;
  name: string;
  type: 'chest' | 'wardrobe' | 'cabinet' | 'barrel' | 'sack' | 'safe' | 'hidden_compartment';
  x: number;
  y: number;
  capacity: number; // Maximum weight in pounds
  locked: boolean;
  lockDC?: number;
  hidden: boolean;
  searchDC?: number;
  items: InventoryItem[];
  trapType?: string;
  trapDC?: number;
}

export interface RoomInventory {
  roomId: string;
  roomType: string;
  containers: Container[];
  looseItems: InventoryItem[]; // Items not in containers
  totalValue: number;
  searchableAreas: {
    name: string;
    searchDC: number;
    items: InventoryItem[];
  }[];
}

export interface BuildingInventory {
  buildingId: string;
  buildingType: string;
  socialClass: 'poor' | 'common' | 'wealthy' | 'noble';
  rooms: { [roomId: string]: RoomInventory };
  totalValue: number;
  specialItems: InventoryItem[]; // Unique or plot-relevant items
  dailyIncome: number; // For businesses
  seasonalModifier: 'spring' | 'summer' | 'autumn' | 'winter';
}

export class InventorySystem {
  private static itemTemplates: { [key: string]: Omit<InventoryItem, 'id' | 'quantity' | 'containerLocation'> } = {
    // Weapons
    'dagger': {
      name: 'Dagger',
      description: 'A simple iron dagger with leather wrapping',
      category: 'weapon',
      value: 2,
      weight: 1,
      rarity: 'common',
      condition: 'good',
      properties: ['light', 'thrown'],
      hidden: false,
      socialClass: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['bedroom', 'kitchen', 'common']
    },

    'longsword': {
      name: 'Longsword',
      description: 'A well-balanced steel sword',
      category: 'weapon',
      value: 15,
      weight: 3,
      rarity: 'common',
      condition: 'good',
      properties: ['versatile'],
      hidden: false,
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['bedroom', 'armory', 'study']
    },

    // Armor
    'leather_armor': {
      name: 'Leather Armor',
      description: 'Boiled leather armor with metal studs',
      category: 'armor',
      value: 10,
      weight: 10,
      rarity: 'common',
      condition: 'good',
      properties: ['light_armor'],
      hidden: false,
      socialClass: ['common', 'wealthy'],
      roomTypes: ['bedroom', 'armory']
    },

    // Tools
    'smithing_hammer': {
      name: 'Smithing Hammer',
      description: 'Heavy hammer used for metalworking',
      category: 'tool',
      value: 2,
      weight: 2,
      rarity: 'common',
      condition: 'good',
      properties: ['artisan_tool'],
      hidden: false,
      socialClass: ['common'],
      roomTypes: ['workshop']
    },

    'thieves_tools': {
      name: 'Thieves\' Tools',
      description: 'Lock picks and other burglar equipment',
      category: 'tool',
      value: 25,
      weight: 1,
      rarity: 'uncommon',
      condition: 'good',
      properties: ['illegal', 'valuable'],
      hidden: true,
      searchDC: 16,
      socialClass: ['common', 'wealthy'],
      roomTypes: ['bedroom', 'storage', 'study']
    },

    // Treasure
    'gold_coins': {
      name: 'Gold Coins',
      description: 'Assorted gold coins from various kingdoms',
      category: 'treasure',
      value: 1,
      weight: 0.02,
      rarity: 'common',
      condition: 'excellent',
      properties: ['currency'],
      hidden: false,
      socialClass: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['bedroom', 'study', 'storage']
    },

    'silver_goblet': {
      name: 'Silver Goblet',
      description: 'Ornate silver drinking goblet with family crest',
      category: 'treasure',
      value: 25,
      weight: 1,
      rarity: 'uncommon',
      condition: 'good',
      properties: ['valuable', 'decorative'],
      hidden: false,
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['common', 'study']
    },

    'gem_ruby': {
      name: 'Ruby Gemstone',
      description: 'Deep red ruby, expertly cut',
      category: 'treasure',
      value: 500,
      weight: 0.1,
      rarity: 'rare',
      condition: 'excellent',
      properties: ['valuable', 'magical_component'],
      hidden: true,
      searchDC: 18,
      socialClass: ['noble'],
      roomTypes: ['bedroom', 'study', 'storage']
    },

    // Consumables
    'healing_potion': {
      name: 'Potion of Healing',
      description: 'Red liquid that glows with magical energy',
      category: 'consumable',
      value: 50,
      weight: 0.5,
      rarity: 'common',
      condition: 'good',
      properties: ['magical', 'beneficial'],
      hidden: false,
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['bedroom', 'study', 'laboratory']
    },

    'wine_bottle': {
      name: 'Bottle of Fine Wine',
      description: 'Aged wine from the noble\'s private collection',
      category: 'consumable',
      value: 10,
      weight: 2,
      rarity: 'uncommon',
      condition: 'good',
      properties: ['alcoholic', 'perishable'],
      hidden: false,
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['cellar', 'common', 'storage'],
      seasonalVariation: { spring: 0.8, summer: 0.6, autumn: 1.2, winter: 1.0 }
    },

    // Food
    'bread_loaf': {
      name: 'Loaf of Bread',
      description: 'Fresh baked bread, still warm',
      category: 'food',
      value: 0.1,
      weight: 2,
      rarity: 'common',
      condition: 'good',
      properties: ['perishable', 'nourishing'],
      hidden: false,
      socialClass: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['kitchen', 'pantry', 'storage'],
      seasonalVariation: { spring: 1.0, summer: 0.8, autumn: 1.2, winter: 1.0 }
    },

    'dried_meat': {
      name: 'Dried Meat',
      description: 'Salted and dried meat, preserved for long journeys',
      category: 'food',
      value: 2,
      weight: 1,
      rarity: 'common',
      condition: 'good',
      properties: ['preserved', 'nourishing'],
      hidden: false,
      socialClass: ['poor', 'common', 'wealthy'],
      roomTypes: ['kitchen', 'pantry', 'storage'],
      seasonalVariation: { spring: 0.6, summer: 0.4, autumn: 1.0, winter: 1.4 }
    },

    // Documents
    'deed': {
      name: 'Property Deed',
      description: 'Legal document proving ownership of this property',
      category: 'document',
      value: 100,
      weight: 0.1,
      rarity: 'uncommon',
      condition: 'good',
      properties: ['legal', 'important'],
      hidden: true,
      searchDC: 14,
      socialClass: ['common', 'wealthy', 'noble'],
      roomTypes: ['study', 'bedroom']
    },

    'love_letter': {
      name: 'Love Letter',
      description: 'Private correspondence between lovers',
      category: 'document',
      value: 0,
      weight: 0.1,
      rarity: 'common',
      condition: 'good',
      properties: ['personal', 'compromising'],
      hidden: true,
      searchDC: 12,
      socialClass: ['common', 'wealthy', 'noble'],
      roomTypes: ['bedroom', 'study']
    },

    // Clothing
    'fine_cloak': {
      name: 'Fine Cloak',
      description: 'Wool cloak with silk lining and silver clasp',
      category: 'clothing',
      value: 15,
      weight: 4,
      rarity: 'uncommon',
      condition: 'good',
      properties: ['valuable', 'warm'],
      hidden: false,
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['bedroom']
    },

    'common_clothes': {
      name: 'Common Clothes',
      description: 'Simple linen shirt and woolen breeches',
      category: 'clothing',
      value: 0.5,
      weight: 3,
      rarity: 'common',
      condition: 'fair',
      properties: ['basic'],
      hidden: false,
      socialClass: ['poor', 'common'],
      roomTypes: ['bedroom']
    }
  };

  static generateBuildingInventory(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): BuildingInventory {
    const roomInventories: { [roomId: string]: RoomInventory } = {};
    let totalValue = 0;
    
    rooms.forEach((room, index) => {
      const roomInventory = this.generateRoomInventory(
        room.id,
        room.type,
        socialClass,
        season,
        seed + index * 1000
      );
      roomInventories[room.id] = roomInventory;
      totalValue += roomInventory.totalValue;
    });

    const specialItems = this.generateSpecialItems(buildingType, socialClass, seed + 10000);
    const dailyIncome = this.calculateDailyIncome(buildingType, socialClass, totalValue);

    return {
      buildingId,
      buildingType,
      socialClass,
      rooms: roomInventories,
      totalValue,
      specialItems,
      dailyIncome,
      seasonalModifier: season
    };
  }

  private static generateRoomInventory(
    roomId: string,
    roomType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): RoomInventory {
    const containers = this.generateContainers(roomType, socialClass, seed);
    const looseItems = this.generateLooseItems(roomType, socialClass, season, seed + 500);
    const searchableAreas = this.generateSearchableAreas(roomType, socialClass, seed + 1000);
    
    // Distribute items into containers
    this.distributeItemsIntoContainers(containers, looseItems.slice(), seed);
    
    const totalValue = containers.reduce((sum, c) => sum + c.items.reduce((itemSum, i) => itemSum + (i.value * i.quantity), 0), 0) +
                      looseItems.reduce((sum, i) => sum + (i.value * i.quantity), 0) +
                      searchableAreas.reduce((sum, a) => sum + a.items.reduce((itemSum, i) => itemSum + (i.value * i.quantity), 0), 0);

    return {
      roomId,
      roomType,
      containers,
      looseItems,
      totalValue,
      searchableAreas
    };
  }

  private static generateContainers(
    roomType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): Container[] {
    const containers: Container[] = [];
    
    const containerTypes: { [key: string]: string[] } = {
      'bedroom': ['chest', 'wardrobe'],
      'kitchen': ['cabinet', 'barrel'],
      'study': ['chest', 'safe'],
      'storage': ['chest', 'barrel', 'sack'],
      'cellar': ['barrel', 'chest'],
      'shop': ['chest', 'cabinet', 'safe']
    };

    const availableTypes = containerTypes[roomType] || ['chest'];
    const containerCount = socialClass === 'poor' ? 1 : 
                          socialClass === 'common' ? 2 :
                          socialClass === 'wealthy' ? 3 : 4;

    for (let i = 0; i < containerCount; i++) {
      const type = availableTypes[Math.floor(this.seedRandom(seed + i) * availableTypes.length)] as Container['type'];
      
      containers.push({
        id: `${roomType}_container_${i}`,
        name: this.getContainerName(type),
        type,
        x: Math.floor(this.seedRandom(seed + i + 100) * 8),
        y: Math.floor(this.seedRandom(seed + i + 200) * 8),
        capacity: this.getContainerCapacity(type),
        locked: socialClass !== 'poor' && this.seedRandom(seed + i + 300) < 0.4,
        lockDC: socialClass === 'wealthy' ? 15 : socialClass === 'noble' ? 18 : 12,
        hidden: type === 'hidden_compartment' || (socialClass === 'noble' && this.seedRandom(seed + i + 400) < 0.2),
        searchDC: type === 'hidden_compartment' ? 18 : 15,
        items: [],
        trapType: socialClass === 'noble' && this.seedRandom(seed + i + 500) < 0.1 ? 'poison_needle' : undefined,
        trapDC: 14
      });
    }

    return containers;
  }

  private static generateLooseItems(
    roomType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): InventoryItem[] {
    const items: InventoryItem[] = [];
    const availableTemplates = Object.entries(this.itemTemplates).filter(([_, template]) =>
      template.roomTypes.includes(roomType) &&
      template.socialClass.includes(socialClass)
    );

    const itemCount = {
      poor: 3,
      common: 5,
      wealthy: 8,
      noble: 12
    }[socialClass];

    for (let i = 0; i < itemCount; i++) {
      if (availableTemplates.length === 0) break;
      
      const [templateId, template] = availableTemplates[Math.floor(this.seedRandom(seed + i) * availableTemplates.length)];
      const baseQuantity = template.category === 'treasure' && template.name.includes('Coins') ? 
                          Math.floor(this.seedRandom(seed + i + 100) * 100) + 10 : 1;
      
      const seasonMultiplier = template.seasonalVariation ? template.seasonalVariation[season] : 1.0;
      const quantity = Math.max(1, Math.floor(baseQuantity * seasonMultiplier));

      items.push({
        ...template,
        id: `${roomType}_${templateId}_${i}`,
        quantity,
        containerLocation: undefined
      });
    }

    return items;
  }

  private static generateSearchableAreas(
    roomType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): RoomInventory['searchableAreas'] {
    const areas: RoomInventory['searchableAreas'] = [];
    
    if (socialClass === 'poor') return areas; // Poor rooms have no hidden areas

    const searchAreas = [
      'Behind loose stone in wall',
      'Under floorboards',
      'Inside old book spine',
      'Behind painting',
      'In false bottom of drawer'
    ];

    const areaCount = socialClass === 'common' ? 1 : socialClass === 'wealthy' ? 2 : 3;
    
    for (let i = 0; i < areaCount; i++) {
      const hiddenItems = this.generateHiddenItems(socialClass, seed + i + 2000);
      if (hiddenItems.length > 0) {
        areas.push({
          name: searchAreas[Math.floor(this.seedRandom(seed + i) * searchAreas.length)],
          searchDC: socialClass === 'common' ? 13 : socialClass === 'wealthy' ? 16 : 19,
          items: hiddenItems
        });
      }
    }

    return areas;
  }

  private static generateHiddenItems(
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): InventoryItem[] {
    const hiddenTemplates = Object.entries(this.itemTemplates).filter(([_, template]) =>
      template.hidden &&
      template.socialClass.includes(socialClass) &&
      (template.properties.includes('valuable') || template.properties.includes('illegal') || template.properties.includes('compromising'))
    );

    if (hiddenTemplates.length === 0) return [];

    const [templateId, template] = hiddenTemplates[Math.floor(this.seedRandom(seed) * hiddenTemplates.length)];
    
    return [{
      ...template,
      id: `hidden_${templateId}_${seed}`,
      quantity: 1,
      containerLocation: undefined
    }];
  }

  private static distributeItemsIntoContainers(
    containers: Container[],
    items: InventoryItem[],
    seed: number
  ): void {
    items.forEach((item, index) => {
      if (containers.length === 0) return;
      
      // Find appropriate container
      let targetContainer = containers.find(c => 
        this.isAppropriateContainer(c.type, item.category) &&
        this.getContainerLoad(c) + (item.weight * item.quantity) <= c.capacity
      );

      if (!targetContainer) {
        targetContainer = containers[Math.floor(this.seedRandom(seed + index) * containers.length)];
      }

      if (targetContainer && this.getContainerLoad(targetContainer) + (item.weight * item.quantity) <= targetContainer.capacity) {
        targetContainer.items.push(item);
        item.containerLocation = targetContainer.id;
      }
    });
  }

  private static generateSpecialItems(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): InventoryItem[] {
    const specialItems: InventoryItem[] = [];

    // Generate unique items based on building type and social class
    if (buildingType === 'blacksmith') {
      specialItems.push({
        id: 'masterwork_sword',
        name: 'Masterwork Longsword',
        description: 'Exceptional quality sword crafted by the building\'s owner',
        category: 'weapon',
        value: 350,
        weight: 3,
        rarity: 'rare',
        quantity: 1,
        condition: 'masterwork',
        properties: ['masterwork', 'valuable'],
        hidden: true,
        searchDC: 16,
        socialClass: ['wealthy', 'noble'],
        roomTypes: ['workshop']
      });
    }

    if (socialClass === 'noble') {
      specialItems.push({
        id: 'family_signet',
        name: 'Family Signet Ring',
        description: 'Gold ring bearing the family coat of arms',
        category: 'treasure',
        value: 200,
        weight: 0.1,
        rarity: 'rare',
        quantity: 1,
        condition: 'excellent',
        properties: ['valuable', 'personal', 'unique'],
        hidden: true,
        searchDC: 18,
        socialClass: ['noble'],
        roomTypes: ['bedroom', 'study']
      });
    }

    return specialItems;
  }

  private static calculateDailyIncome(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    totalValue: number
  ): number {
    const businessTypes = ['tavern', 'shop', 'blacksmith'];
    if (!businessTypes.includes(buildingType)) return 0;

    const baseIncome = {
      tavern: 10,
      shop: 8,
      blacksmith: 12,
      market_stall: 3
    }[buildingType] || 0;

    const classMultiplier = {
      poor: 0.5,
      common: 1.0,
      wealthy: 1.5,
      noble: 2.0
    }[socialClass];

    return Math.floor(baseIncome * classMultiplier + (totalValue * 0.01));
  }

  // Helper methods
  private static getContainerName(type: Container['type']): string {
    const names = {
      chest: 'Wooden Chest',
      wardrobe: 'Large Wardrobe',
      cabinet: 'Kitchen Cabinet',
      barrel: 'Storage Barrel',
      sack: 'Burlap Sack',
      safe: 'Iron Safe',
      hidden_compartment: 'Hidden Compartment'
    };
    return names[type];
  }

  private static getContainerCapacity(type: Container['type']): number {
    const capacities = {
      chest: 300,
      wardrobe: 200,
      cabinet: 150,
      barrel: 400,
      sack: 30,
      safe: 100,
      hidden_compartment: 50
    };
    return capacities[type];
  }

  private static isAppropriateContainer(containerType: Container['type'], itemCategory: InventoryItem['category']): boolean {
    const suitability = {
      chest: ['weapon', 'armor', 'treasure', 'document', 'clothing'],
      wardrobe: ['clothing', 'armor'],
      cabinet: ['tool', 'consumable', 'food', 'material'],
      barrel: ['food', 'consumable', 'trade_good'],
      sack: ['material', 'trade_good', 'food'],
      safe: ['treasure', 'document'],
      hidden_compartment: ['treasure', 'document']
    };
    
    return suitability[containerType]?.includes(itemCategory) || false;
  }

  private static getContainerLoad(container: Container): number {
    return container.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Public methods
  static getItemTemplate(id: string): Omit<InventoryItem, 'id' | 'quantity' | 'containerLocation'> | null {
    return this.itemTemplates[id] || null;
  }

  static addCustomItem(id: string, template: Omit<InventoryItem, 'id' | 'quantity' | 'containerLocation'>): void {
    this.itemTemplates[id] = template;
  }

  static getAllItemTemplates(): { [key: string]: Omit<InventoryItem, 'id' | 'quantity' | 'containerLocation'> } {
    return { ...this.itemTemplates };
  }
}