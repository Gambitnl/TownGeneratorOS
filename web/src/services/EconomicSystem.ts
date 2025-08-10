// Economic Trade & Business Simulation System
export interface TradeGood {
  id: string;
  name: string;
  category: 'food' | 'materials' | 'tools' | 'luxury' | 'weapons' | 'armor' | 'services' | 'information';
  basePrice: number; // In gold pieces
  weight: number; // For transport calculations
  perishable: boolean;
  shelfLife?: number; // Days if perishable
  demandLevel: 'low' | 'moderate' | 'high' | 'critical';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  seasonalModifier: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
  qualityGrades: {
    poor: number;    // Price multiplier
    common: number;
    good: number;
    excellent: number;
    masterwork: number;
  };
  productionTime?: number; // Days to produce
  requiredSkills?: string[];
  materialCost?: number; // Cost to produce
}

export interface BusinessTransaction {
  id: string;
  timestamp: string;
  businessId: string;
  type: 'sale' | 'purchase' | 'service' | 'commission';
  goods: {
    itemId: string;
    quantity: number;
    unitPrice: number;
    quality: 'poor' | 'common' | 'good' | 'excellent' | 'masterwork';
  }[];
  totalValue: number;
  customerId?: string;
  reputation: number; // Impact on business reputation
  profitMargin: number;
  paymentMethod: 'cash' | 'barter' | 'credit' | 'service';
}

export interface MarketDemand {
  itemId: string;
  currentDemand: number; // 0-2 multiplier on base price
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  influencingFactors: string[]; // Events affecting demand
  expectedDuration: number; // Days trend will continue
  competitorCount: number; // Number of businesses offering this item
}

export interface BusinessMetrics {
  businessId: string;
  businessType: string;
  socialClass: 'poor' | 'common' | 'wealthy' | 'noble';
  financials: {
    dailyRevenue: number;
    dailyExpenses: number;
    dailyProfit: number;
    totalAssets: number;
    totalDebt: number;
    cashFlow: number[];
  };
  inventory: {
    itemId: string;
    quantity: number;
    condition: string;
    acquisitionCost: number;
    currentMarketValue: number;
  }[];
  reputation: {
    overall: number; // 0-100
    qualityRating: number;
    serviceRating: number;
    priceRating: number;
    reliabilityRating: number;
  };
  customers: {
    regular: number;
    occasional: number;
    newCustomers: number;
    lostCustomers: number;
  };
  employees: {
    id: string;
    role: string;
    wage: number;
    skill: number;
    loyalty: number;
  }[];
}

export interface EconomicEvent {
  id: string;
  name: string;
  description: string;
  type: 'market_shift' | 'supply_disruption' | 'demand_spike' | 'competition' | 'regulation' | 'disaster';
  duration: number; // Days
  effects: {
    priceModifiers: { [itemId: string]: number };
    demandModifiers: { [itemId: string]: number };
    businessImpacts: string[];
  };
  triggerConditions: string[];
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
}

export interface TradeRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number; // Miles
  difficulty: 'easy' | 'moderate' | 'dangerous' | 'extreme';
  travelTime: number; // Days
  transportCost: number; // Per unit weight
  riskFactors: {
    bandits: number; // 0-1 probability
    weather: number;
    monsters: number;
    political: number;
  };
  profitability: number; // Expected profit multiplier
  goodsTraded: string[];
  seasonalAccess: {
    spring: boolean;
    summer: boolean;
    autumn: boolean;
    winter: boolean;
  };
}

export interface BuildingEconomy {
  buildingId: string;
  businesses: BusinessMetrics[];
  tradeConnections: TradeRoute[];
  marketInfluence: {
    localMonopoly: string[]; // Goods where this building dominates
    marketShare: { [itemId: string]: number }; // 0-1 percentage
    priceInfluence: { [itemId: string]: number }; // Ability to influence prices
  };
  economicEvents: EconomicEvent[];
  totalEconomicValue: number;
  employmentProvided: number;
  taxGeneration: number;
}

export class EconomicSystem {
  private static tradeGoods: { [key: string]: TradeGood } = {
    'bread': {
      id: 'bread',
      name: 'Fresh Bread',
      category: 'food',
      basePrice: 0.2,
      weight: 2,
      perishable: true,
      shelfLife: 3,
      demandLevel: 'high',
      rarity: 'common',
      seasonalModifier: { spring: 1.0, summer: 0.9, autumn: 1.1, winter: 1.2 },
      qualityGrades: { poor: 0.5, common: 1.0, good: 1.3, excellent: 1.6, masterwork: 2.0 },
      productionTime: 1,
      requiredSkills: ['baking'],
      materialCost: 0.05
    },

    'iron_sword': {
      id: 'iron_sword',
      name: 'Iron Sword',
      category: 'weapons',
      basePrice: 15,
      weight: 3,
      perishable: false,
      demandLevel: 'moderate',
      rarity: 'common',
      seasonalModifier: { spring: 1.0, summer: 1.1, autumn: 1.0, winter: 0.9 },
      qualityGrades: { poor: 0.6, common: 1.0, good: 1.5, excellent: 2.0, masterwork: 3.0 },
      productionTime: 5,
      requiredSkills: ['blacksmithing', 'weaponsmithing'],
      materialCost: 5
    },

    'healing_potion': {
      id: 'healing_potion',
      name: 'Potion of Healing',
      category: 'services',
      basePrice: 50,
      weight: 0.5,
      perishable: true,
      shelfLife: 365,
      demandLevel: 'high',
      rarity: 'uncommon',
      seasonalModifier: { spring: 1.0, summer: 1.2, autumn: 1.1, winter: 1.3 },
      qualityGrades: { poor: 0.7, common: 1.0, good: 1.4, excellent: 1.8, masterwork: 2.5 },
      productionTime: 3,
      requiredSkills: ['alchemy', 'herbalism'],
      materialCost: 15
    },

    'fine_cloth': {
      id: 'fine_cloth',
      name: 'Fine Cloth',
      category: 'luxury',
      basePrice: 5,
      weight: 1,
      perishable: false,
      demandLevel: 'moderate',
      rarity: 'uncommon',
      seasonalModifier: { spring: 1.2, summer: 0.8, autumn: 1.3, winter: 1.4 },
      qualityGrades: { poor: 0.5, common: 1.0, good: 1.6, excellent: 2.2, masterwork: 3.5 },
      productionTime: 7,
      requiredSkills: ['weaving', 'tailoring'],
      materialCost: 1.5
    },

    'metal_tools': {
      id: 'metal_tools',
      name: 'Metal Tools',
      category: 'tools',
      basePrice: 8,
      weight: 5,
      perishable: false,
      demandLevel: 'high',
      rarity: 'common',
      seasonalModifier: { spring: 1.3, summer: 1.2, autumn: 1.0, winter: 0.8 },
      qualityGrades: { poor: 0.6, common: 1.0, good: 1.4, excellent: 1.9, masterwork: 2.8 },
      productionTime: 3,
      requiredSkills: ['blacksmithing'],
      materialCost: 3
    },

    'information': {
      id: 'information',
      name: 'Valuable Information',
      category: 'information',
      basePrice: 25,
      weight: 0,
      perishable: true,
      shelfLife: 30,
      demandLevel: 'moderate',
      rarity: 'rare',
      seasonalModifier: { spring: 1.0, summer: 1.0, autumn: 1.0, winter: 1.0 },
      qualityGrades: { poor: 0.3, common: 1.0, good: 2.0, excellent: 4.0, masterwork: 8.0 }
    }
  };

  private static economicEvents: { [key: string]: EconomicEvent } = {
    'harvest_festival': {
      id: 'harvest_festival',
      name: 'Harvest Festival',
      description: 'Annual celebration increases food and luxury demand',
      type: 'demand_spike',
      duration: 7,
      effects: {
        priceModifiers: { 'bread': 1.3, 'fine_cloth': 1.4 },
        demandModifiers: { 'bread': 1.5, 'fine_cloth': 1.6, 'healing_potion': 1.2 },
        businessImpacts: ['Increased foot traffic', 'Higher revenues', 'Need extra staff']
      },
      triggerConditions: ['autumn_season'],
      severity: 'moderate'
    },

    'trade_caravan': {
      id: 'trade_caravan',
      name: 'Trade Caravan Arrival',
      description: 'Large merchant caravan brings exotic goods and customers',
      type: 'market_shift',
      duration: 14,
      effects: {
        priceModifiers: { 'fine_cloth': 0.8, 'healing_potion': 0.9 },
        demandModifiers: { 'metal_tools': 1.4, 'iron_sword': 1.2 },
        businessImpacts: ['Increased competition', 'Access to rare materials', 'Cultural exchange']
      },
      triggerConditions: ['summer_season', 'good_roads'],
      severity: 'moderate'
    },

    'bandit_attacks': {
      id: 'bandit_attacks',
      name: 'Bandit Activity',
      description: 'Increased bandit activity disrupts trade routes',
      type: 'supply_disruption',
      duration: 21,
      effects: {
        priceModifiers: { 'iron_sword': 1.4, 'metal_tools': 1.3, 'healing_potion': 1.5 },
        demandModifiers: { 'iron_sword': 1.8, 'healing_potion': 1.6 },
        businessImpacts: ['Increased security costs', 'Supply shortages', 'Higher weapon demand']
      },
      triggerConditions: ['spring_season', 'poor_security'],
      severity: 'major'
    }
  };

  static generateBuildingEconomy(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    inhabitants: any[],
    inventoryValue: number,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): BuildingEconomy {
    const businesses = this.generateBusinessMetrics(buildingType, socialClass, inhabitants, inventoryValue, season, seed);
    const tradeRoutes = this.generateTradeRoutes(buildingType, socialClass, seed);
    const marketInfluence = this.calculateMarketInfluence(businesses, buildingType, socialClass);
    const economicEvents = this.generateEconomicEvents(season, buildingType, seed);

    const totalValue = businesses.reduce((sum, b) => sum + b.financials.totalAssets, 0);
    const employment = businesses.reduce((sum, b) => sum + b.employees.length, 0);
    const taxGen = totalValue * 0.02; // 2% tax rate

    return {
      buildingId,
      businesses,
      tradeConnections: tradeRoutes,
      marketInfluence,
      economicEvents,
      totalEconomicValue: totalValue,
      employmentProvided: employment,
      taxGeneration: taxGen
    };
  }

  private static generateBusinessMetrics(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    inhabitants: any[],
    inventoryValue: number,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): BusinessMetrics[] {
    const businesses: BusinessMetrics[] = [];

    // Only certain building types are businesses
    const businessTypes = ['tavern', 'blacksmith', 'shop', 'market_stall'];
    if (!businessTypes.includes(buildingType)) return businesses;

    const businessGoods = this.getBusinessGoods(buildingType);
    const baseRevenue = this.calculateBaseRevenue(buildingType, socialClass);
    const seasonalMultiplier = this.getSeasonalMultiplier(businessGoods, season);

    const business: BusinessMetrics = {
      businessId: `${buildingId}_business`,
      businessType,
      socialClass,
      financials: {
        dailyRevenue: baseRevenue * seasonalMultiplier,
        dailyExpenses: this.calculateDailyExpenses(buildingType, socialClass, inhabitants.length),
        dailyProfit: 0, // Will calculate
        totalAssets: inventoryValue + this.calculateFixedAssets(buildingType, socialClass),
        totalDebt: this.calculateDebt(socialClass, seed),
        cashFlow: this.generateCashFlow(baseRevenue, seed)
      },
      inventory: this.generateBusinessInventory(businessGoods, socialClass, season, seed),
      reputation: this.calculateReputation(socialClass, inhabitants, seed),
      customers: this.calculateCustomerBase(buildingType, socialClass, seed),
      employees: this.generateEmployees(inhabitants, buildingType, socialClass, seed)
    };

    business.financials.dailyProfit = business.financials.dailyRevenue - business.financials.dailyExpenses;
    businesses.push(business);

    return businesses;
  }

  private static getBusinessGoods(buildingType: string): string[] {
    const businessGoods = {
      'tavern': ['bread', 'healing_potion'],
      'blacksmith': ['iron_sword', 'metal_tools'],
      'shop': ['fine_cloth', 'metal_tools', 'bread'],
      'market_stall': ['bread', 'fine_cloth']
    };

    return businessGoods[buildingType] || [];
  }

  private static calculateBaseRevenue(buildingType: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble'): number {
    const baseRevenues = {
      'tavern': 25,
      'blacksmith': 30,
      'shop': 20,
      'market_stall': 8
    };

    const classMultipliers = {
      poor: 0.5,
      common: 1.0,
      wealthy: 1.8,
      noble: 3.0
    };

    return (baseRevenues[buildingType] || 10) * classMultipliers[socialClass];
  }

  private static getSeasonalMultiplier(goodIds: string[], season: 'spring' | 'summer' | 'autumn' | 'winter'): number {
    if (goodIds.length === 0) return 1.0;
    
    const totalMultiplier = goodIds.reduce((sum, goodId) => {
      const good = this.tradeGoods[goodId];
      return sum + (good ? good.seasonalModifier[season] : 1.0);
    }, 0);

    return totalMultiplier / goodIds.length;
  }

  private static calculateDailyExpenses(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    employeeCount: number
  ): number {
    const baseExpenses = {
      'tavern': 12,
      'blacksmith': 15,
      'shop': 10,
      'market_stall': 3
    };

    const wages = employeeCount * (socialClass === 'poor' ? 0.5 : socialClass === 'noble' ? 2.0 : 1.0);
    const materials = (baseExpenses[buildingType] || 5) * 0.4;
    const overhead = (baseExpenses[buildingType] || 5) * 0.6;

    return wages + materials + overhead;
  }

  private static calculateFixedAssets(buildingType: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble'): number {
    const baseAssets = {
      'tavern': 500,
      'blacksmith': 800,
      'shop': 300,
      'market_stall': 100
    };

    const classMultipliers = {
      poor: 0.4,
      common: 1.0,
      wealthy: 2.5,
      noble: 5.0
    };

    return (baseAssets[buildingType] || 200) * classMultipliers[socialClass];
  }

  private static calculateDebt(socialClass: 'poor' | 'common' | 'wealthy' | 'noble', seed: number): number {
    const debtLikelihood = {
      poor: 0.8,
      common: 0.4,
      wealthy: 0.2,
      noble: 0.1
    };

    if (this.seedRandom(seed) > debtLikelihood[socialClass]) return 0;

    const maxDebt = {
      poor: 50,
      common: 200,
      wealthy: 500,
      noble: 1000
    };

    return this.seedRandom(seed + 100) * maxDebt[socialClass];
  }

  private static generateCashFlow(baseRevenue: number, seed: number): number[] {
    const cashFlow: number[] = [];
    let currentFlow = baseRevenue;

    // Generate 30 days of cash flow with variation
    for (let i = 0; i < 30; i++) {
      const variation = (this.seedRandom(seed + i) - 0.5) * 0.3; // ±15% variation
      currentFlow = baseRevenue * (1 + variation);
      cashFlow.push(currentFlow);
    }

    return cashFlow;
  }

  private static generateBusinessInventory(
    goodIds: string[],
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): BusinessMetrics['inventory'] {
    const inventory: BusinessMetrics['inventory'] = [];

    goodIds.forEach((goodId, index) => {
      const good = this.tradeGoods[goodId];
      if (!good) return;

      const baseQuantity = socialClass === 'poor' ? 5 : socialClass === 'common' ? 15 : 
                          socialClass === 'wealthy' ? 30 : 50;
      const seasonalQuantity = Math.floor(baseQuantity * good.seasonalModifier[season]);
      const quantity = Math.max(1, seasonalQuantity + Math.floor(this.seedRandom(seed + index) * 10) - 5);

      inventory.push({
        itemId: goodId,
        quantity,
        condition: this.randomCondition(seed + index + 100),
        acquisitionCost: good.materialCost || good.basePrice * 0.6,
        currentMarketValue: good.basePrice * good.seasonalModifier[season]
      });
    });

    return inventory;
  }

  private static calculateReputation(
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    inhabitants: any[],
    seed: number
  ): BusinessMetrics['reputation'] {
    const basReputation = {
      poor: 40,
      common: 60,
      wealthy: 80,
      noble: 90
    }[socialClass];

    // Factor in inhabitant skills/traits
    const skillBonus = inhabitants.length > 0 ? inhabitants[0].primaryStats?.charisma || 10 : 10;
    const skillModifier = (skillBonus - 10) * 2; // ±10 points based on charisma

    const overall = Math.max(10, Math.min(100, basReputation + skillModifier + (this.seedRandom(seed) * 20 - 10)));

    return {
      overall,
      qualityRating: overall + (this.seedRandom(seed + 1) * 20 - 10),
      serviceRating: overall + (this.seedRandom(seed + 2) * 20 - 10),
      priceRating: overall + (this.seedRandom(seed + 3) * 20 - 10),
      reliabilityRating: overall + (this.seedRandom(seed + 4) * 20 - 10)
    };
  }

  private static calculateCustomerBase(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): BusinessMetrics['customers'] {
    const baseCustomers = {
      'tavern': { regular: 20, occasional: 40 },
      'blacksmith': { regular: 8, occasional: 15 },
      'shop': { regular: 15, occasional: 30 },
      'market_stall': { regular: 5, occasional: 20 }
    }[buildingType] || { regular: 10, occasional: 20 };

    const classMultiplier = {
      poor: 0.6,
      common: 1.0,
      wealthy: 1.4,
      noble: 2.0
    }[socialClass];

    return {
      regular: Math.floor(baseCustomers.regular * classMultiplier),
      occasional: Math.floor(baseCustomers.occasional * classMultiplier),
      newCustomers: Math.floor(this.seedRandom(seed) * 5) + 1,
      lostCustomers: Math.floor(this.seedRandom(seed + 50) * 3)
    };
  }

  private static generateEmployees(
    inhabitants: any[],
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): BusinessMetrics['employees'] {
    const employees: BusinessMetrics['employees'] = [];

    // Owner is usually first inhabitant
    if (inhabitants.length > 0) {
      const owner = inhabitants[0];
      employees.push({
        id: owner.id,
        role: 'Owner',
        wage: 0, // Owner takes profits
        skill: owner.primaryStats ? (owner.primaryStats.intelligence + owner.primaryStats.wisdom) / 2 : 12,
        loyalty: 100
      });
    }

    // Add additional employees based on business size
    const additionalEmployees = socialClass === 'poor' ? 0 : socialClass === 'common' ? 1 : 
                               socialClass === 'wealthy' ? 2 : 3;

    for (let i = 1; i < Math.min(inhabitants.length, additionalEmployees + 1); i++) {
      const employee = inhabitants[i];
      employees.push({
        id: employee.id,
        role: this.getEmployeeRole(buildingType, i),
        wage: this.calculateWage(socialClass, i),
        skill: employee.primaryStats ? employee.primaryStats.intelligence : 10,
        loyalty: 50 + this.seedRandom(seed + i) * 40
      });
    }

    return employees;
  }

  private static generateTradeRoutes(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): TradeRoute[] {
    const routes: TradeRoute[] = [];

    // Only businesses with sufficient capital have trade routes
    if (socialClass === 'poor') return routes;

    const routeCount = socialClass === 'common' ? 1 : socialClass === 'wealthy' ? 2 : 3;
    const destinations = ['Nearby Village', 'Regional Town', 'Capital City', 'Coastal Port', 'Mountain Settlement'];

    for (let i = 0; i < routeCount; i++) {
      const destination = destinations[Math.floor(this.seedRandom(seed + i) * destinations.length)];
      
      routes.push({
        id: `route_${buildingType}_${i}`,
        name: `Trade Route to ${destination}`,
        origin: 'Current Location',
        destination,
        distance: 20 + this.seedRandom(seed + i + 100) * 100,
        difficulty: ['easy', 'moderate', 'dangerous'][Math.floor(this.seedRandom(seed + i + 200) * 3)] as TradeRoute['difficulty'],
        travelTime: 3 + Math.floor(this.seedRandom(seed + i + 300) * 10),
        transportCost: 0.1 + this.seedRandom(seed + i + 400) * 0.5,
        riskFactors: {
          bandits: this.seedRandom(seed + i + 500) * 0.3,
          weather: this.seedRandom(seed + i + 600) * 0.4,
          monsters: this.seedRandom(seed + i + 700) * 0.2,
          political: this.seedRandom(seed + i + 800) * 0.1
        },
        profitability: 1.2 + this.seedRandom(seed + i + 900) * 0.8,
        goodsTraded: this.getBusinessGoods(buildingType),
        seasonalAccess: {
          spring: true,
          summer: true,
          autumn: true,
          winter: this.seedRandom(seed + i + 1000) > 0.3 // 30% chance winter blocks route
        }
      });
    }

    return routes;
  }

  private static calculateMarketInfluence(
    businesses: BusinessMetrics[],
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble'
  ): BuildingEconomy['marketInfluence'] {
    const influence: BuildingEconomy['marketInfluence'] = {
      localMonopoly: [],
      marketShare: {},
      priceInfluence: {}
    };

    if (businesses.length === 0) return influence;

    const business = businesses[0];
    const businessGoods = this.getBusinessGoods(buildingType);

    // Calculate market influence based on social class and reputation
    const baseInfluence = {
      poor: 0.1,
      common: 0.25,
      wealthy: 0.4,
      noble: 0.6
    }[socialClass];

    const reputationBonus = (business.reputation.overall - 50) / 500; // ±0.1 based on reputation
    const finalInfluence = Math.max(0.05, Math.min(0.8, baseInfluence + reputationBonus));

    businessGoods.forEach(goodId => {
      influence.marketShare[goodId] = finalInfluence;
      influence.priceInfluence[goodId] = finalInfluence * 0.5; // Can influence price by up to 40%
      
      if (finalInfluence > 0.5) {
        influence.localMonopoly.push(goodId);
      }
    });

    return influence;
  }

  private static generateEconomicEvents(
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    buildingType: string,
    seed: number
  ): EconomicEvent[] {
    const events: EconomicEvent[] = [];
    const availableEvents = Object.values(this.economicEvents).filter(event =>
      event.triggerConditions.includes(`${season}_season`) ||
      event.triggerConditions.length === 0
    );

    // 30% chance of an economic event occurring
    if (this.seedRandom(seed) < 0.3 && availableEvents.length > 0) {
      const event = availableEvents[Math.floor(this.seedRandom(seed + 100) * availableEvents.length)];
      events.push(event);
    }

    return events;
  }

  // Helper methods
  private static randomCondition(seed: number): string {
    const conditions = ['poor', 'fair', 'good', 'excellent'];
    const weights = [0.1, 0.3, 0.5, 0.1]; // Weighted toward fair/good
    
    let random = this.seedRandom(seed);
    let cumulativeWeight = 0;
    
    for (let i = 0; i < conditions.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return conditions[i];
      }
    }
    
    return 'good';
  }

  private static getEmployeeRole(buildingType: string, index: number): string {
    const roles = {
      'tavern': ['Server', 'Cook', 'Cleaner'],
      'blacksmith': ['Apprentice', 'Assistant', 'Bellows Operator'],
      'shop': ['Assistant', 'Guard', 'Clerk'],
      'market_stall': ['Helper', 'Guard']
    };

    const roleList = roles[buildingType] || ['Assistant'];
    return roleList[Math.min(index - 1, roleList.length - 1)];
  }

  private static calculateWage(socialClass: 'poor' | 'common' | 'wealthy' | 'noble', employeeIndex: number): number {
    const baseWages = {
      poor: 0.5,
      common: 1.0,
      wealthy: 1.5,
      noble: 2.5
    };

    const roleMultiplier = employeeIndex === 1 ? 1.0 : 0.8; // First employee gets more
    return baseWages[socialClass] * roleMultiplier;
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Public methods
  static getTradeGood(id: string): TradeGood | null {
    return this.tradeGoods[id] || null;
  }

  static addCustomTradeGood(id: string, good: TradeGood): void {
    this.tradeGoods[id] = good;
  }

  static getEconomicEvent(id: string): EconomicEvent | null {
    return this.economicEvents[id] || null;
  }

  static calculatePriceAdjustment(
    basePrice: number,
    demand: MarketDemand,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    quality: 'poor' | 'common' | 'good' | 'excellent' | 'masterwork'
  ): number {
    const good = Object.values(this.tradeGoods).find(g => g.basePrice === basePrice);
    if (!good) return basePrice;

    let adjustedPrice = basePrice;
    
    // Apply seasonal modifier
    adjustedPrice *= good.seasonalModifier[season];
    
    // Apply demand modifier
    adjustedPrice *= demand.currentDemand;
    
    // Apply quality modifier
    adjustedPrice *= good.qualityGrades[quality];
    
    return Math.round(adjustedPrice * 100) / 100; // Round to copper pieces
  }

  static simulateMarketTransaction(
    businessId: string,
    goodId: string,
    quantity: number,
    quality: 'poor' | 'common' | 'good' | 'excellent' | 'masterwork',
    season: 'spring' | 'summer' | 'autumn' | 'winter'
  ): BusinessTransaction {
    const good = this.tradeGoods[goodId];
    if (!good) throw new Error(`Unknown trade good: ${goodId}`);

    const unitPrice = this.calculatePriceAdjustment(
      good.basePrice, 
      { currentDemand: 1.0, trendDirection: 'stable', influencingFactors: [], expectedDuration: 1, competitorCount: 1 }, 
      season, 
      quality
    );

    const totalValue = unitPrice * quantity;
    const profitMargin = (unitPrice - (good.materialCost || good.basePrice * 0.6)) / unitPrice;

    return {
      id: `transaction_${Date.now()}`,
      timestamp: new Date().toISOString(),
      businessId,
      type: 'sale',
      goods: [{
        itemId: goodId,
        quantity,
        unitPrice,
        quality
      }],
      totalValue,
      reputation: profitMargin > 0.3 ? 1 : profitMargin > 0.1 ? 0 : -1,
      profitMargin,
      paymentMethod: 'cash'
    };
  }

  static getAllTradeGoods(): { [key: string]: TradeGood } {
    return { ...this.tradeGoods };
  }

  static getAllEconomicEvents(): { [key: string]: EconomicEvent } {
    return { ...this.economicEvents };
  }
}