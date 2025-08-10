// Advanced HVAC & Comfort Systems for realistic building environments
export interface ClimateZone {
  id: string;
  name: string;
  baseTemperature: number; // Fahrenheit
  humidity: number; // 0-100%
  seasonalVariation: {
    spring: { tempModifier: number; humidityModifier: number };
    summer: { tempModifier: number; humidityModifier: number };
    autumn: { tempModifier: number; humidityModifier: number };
    winter: { tempModifier: number; humidityModifier: number };
  };
  windPatterns: {
    prevailingDirection: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
    averageSpeed: number; // mph
    gustiness: number; // 0-1
  };
}

export interface VentilationSystem {
  id: string;
  name: string;
  type: 'natural' | 'passive' | 'active' | 'magical';
  efficiency: number; // 0-1, air changes per hour
  coverage: number; // Tiles radius
  energyCost: number; // Daily fuel/magic cost
  airQualityImprovement: number; // 0-1
  noiseLevel: number; // Decibels
  components: {
    intakes: { x: number; y: number; floor: number; type: 'window' | 'vent' | 'chimney' }[];
    exhausts: { x: number; y: number; floor: number; type: 'window' | 'vent' | 'chimney' }[];
    ducts?: { startX: number; startY: number; endX: number; endY: number; floor: number }[];
  };
  seasonalEfficiency: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  buildingTypes: string[];
}

export interface HeatingSystem {
  id: string;
  name: string;
  type: 'fireplace' | 'brazier' | 'underfloor' | 'magical' | 'central' | 'radiator';
  heatOutput: number; // BTUs per hour
  fuelType: 'wood' | 'coal' | 'oil' | 'magical' | 'gas' | 'solar';
  efficiency: number; // 0-1, heat conversion efficiency
  coverage: number; // Tiles radius of effective heating
  fuelConsumption: number; // Units per hour
  fuelCost: number; // Cost per unit of fuel
  installationCost: number;
  maintenanceRequired: boolean;
  fireRisk: number; // 0-1 probability of fire hazard
  smokeProduction: number; // 0-1 amount of smoke/pollution
  components: {
    heatSource: { x: number; y: number; floor: number };
    vents?: { x: number; y: number; floor: number }[];
    chimney?: { x: number; y: number; floor: number };
    fuelStorage?: { x: number; y: number; floor: number };
  };
  comfortRadius: {
    optimal: number; // Distance for optimal comfort
    adequate: number; // Distance for adequate warmth
    minimal: number; // Maximum effective range
  };
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
}

export interface CoolingSystem {
  id: string;
  name: string;
  type: 'natural' | 'evaporative' | 'magical' | 'ice_house' | 'underground';
  coolingPower: number; // BTUs per hour (cooling)
  waterRequirement: number; // Gallons per day
  coverage: number; // Effective cooling radius
  energyCost: number; // Daily operational cost
  efficiency: number; // 0-1
  components: {
    coolant: { x: number; y: number; floor: number; type: 'water' | 'ice' | 'magical' };
    circulation?: { x: number; y: number; floor: number }[];
    drains?: { x: number; y: number; floor: number }[];
  };
  seasonalEffectiveness: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
}

export interface ComfortMetrics {
  temperature: number; // Current temperature (F)
  humidity: number; // Current humidity (%)
  airQuality: number; // 0-1 (1 = pristine)
  airflow: number; // 0-1 (1 = optimal circulation)
  thermal: number; // 0-1 (1 = optimal thermal comfort)
  overall: number; // 0-1 (1 = perfect comfort)
  healthEffects: {
    respiratory: number; // 0-1 (1 = excellent air)
    temperature: number; // 0-1 (1 = ideal temp)
    humidity: number; // 0-1 (1 = ideal humidity)
    allergens: number; // 0-1 (1 = allergen-free)
  };
  productivityModifier: number; // -0.5 to +0.5 work efficiency
  restQuality: number; // 0-1 sleep/rest quality
  moodImpact: number; // -5 to +5 mood modifier
}

export interface RoomComfort {
  roomId: string;
  roomType: string;
  dimensions: { width: number; height: number; volume: number };
  systems: {
    heating: HeatingSystem | null;
    cooling: CoolingSystem | null;
    ventilation: VentilationSystem | null;
  };
  insulation: {
    walls: number; // R-value
    windows: number;
    roof: number;
    floor: number;
  };
  heatSources: {
    occupants: number; // People count * 300 BTU/hour
    lighting: number; // Light fixtures heat output
    cooking: number; // Kitchen equipment heat
    other: number; // Fireplaces, etc.
  };
  moistureSources: {
    cooking: number; // Gallons per day
    occupants: number; // People breathing/sweating
    bathing: number; // Washing activities
    other: number; // Plants, etc.
  };
  currentConditions: ComfortMetrics;
  targetConditions: ComfortMetrics;
  controlSystems: {
    thermostat?: {
      targetTemp: number;
      deadband: number; // Temperature range before activation
      schedule: { [time: string]: number };
    };
    humidistat?: {
      targetHumidity: number;
      controlRange: number;
    };
    airQualityMonitor?: {
      alertThreshold: number;
      autoResponse: boolean;
    };
  };
}

export interface BuildingComfort {
  buildingId: string;
  climateZone: ClimateZone;
  rooms: { [roomId: string]: RoomComfort };
  centralSystems: {
    heating?: HeatingSystem;
    cooling?: CoolingSystem;
    ventilation?: VentilationSystem;
  };
  energyUsage: {
    daily: number; // Total energy consumption per day
    heating: number;
    cooling: number;
    ventilation: number;
    breakdown: { [systemId: string]: number };
  };
  operationalCosts: {
    daily: number;
    seasonal: { [season: string]: number };
    annual: number;
  };
  comfortIndex: number; // 0-100 overall building comfort rating
  healthIndex: number; // 0-100 overall health rating
  sustainabilityRating: string; // 'poor' | 'fair' | 'good' | 'excellent'
  maintenanceSchedule: {
    system: string;
    nextMaintenance: string;
    frequency: string; // 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'annual'
    cost: number;
  }[];
}

export class ComfortSystem {
  private static climateZones: { [key: string]: ClimateZone } = {
    'temperate_continental': {
      id: 'temperate_continental',
      name: 'Temperate Continental',
      baseTemperature: 50,
      humidity: 60,
      seasonalVariation: {
        spring: { tempModifier: 15, humidityModifier: 10 },
        summer: { tempModifier: 25, humidityModifier: 15 },
        autumn: { tempModifier: 10, humidityModifier: 5 },
        winter: { tempModifier: -20, humidityModifier: -10 }
      },
      windPatterns: {
        prevailingDirection: 'west',
        averageSpeed: 8,
        gustiness: 0.3
      }
    },

    'temperate_oceanic': {
      id: 'temperate_oceanic',
      name: 'Temperate Oceanic',
      baseTemperature: 55,
      humidity: 75,
      seasonalVariation: {
        spring: { tempModifier: 10, humidityModifier: 5 },
        summer: { tempModifier: 15, humidityModifier: 10 },
        autumn: { tempModifier: 5, humidityModifier: 5 },
        winter: { tempModifier: -10, humidityModifier: 0 }
      },
      windPatterns: {
        prevailingDirection: 'southwest',
        averageSpeed: 12,
        gustiness: 0.4
      }
    },

    'cold_subarctic': {
      id: 'cold_subarctic',
      name: 'Cold Subarctic',
      baseTemperature: 25,
      humidity: 65,
      seasonalVariation: {
        spring: { tempModifier: 20, humidityModifier: 5 },
        summer: { tempModifier: 35, humidityModifier: 10 },
        autumn: { tempModifier: 10, humidityModifier: 0 },
        winter: { tempModifier: -30, humidityModifier: -15 }
      },
      windPatterns: {
        prevailingDirection: 'north',
        averageSpeed: 15,
        gustiness: 0.6
      }
    }
  };

  private static heatingSystemTemplates: { [key: string]: HeatingSystem } = {
    'simple_fireplace': {
      id: 'simple_fireplace',
      name: 'Stone Fireplace',
      type: 'fireplace',
      heatOutput: 15000,
      fuelType: 'wood',
      efficiency: 0.15,
      coverage: 6,
      fuelConsumption: 15, // lbs per hour
      fuelCost: 0.1, // per lb
      installationCost: 200,
      maintenanceRequired: true,
      fireRisk: 0.1,
      smokeProduction: 0.3,
      components: {
        heatSource: { x: 4, y: 1, floor: 0 },
        chimney: { x: 4, y: 1, floor: 0 }
      },
      comfortRadius: { optimal: 3, adequate: 5, minimal: 8 },
      socialClass: ['common', 'wealthy', 'noble']
    },

    'brazier_iron': {
      id: 'brazier_iron',
      name: 'Iron Brazier',
      type: 'brazier',
      heatOutput: 5000,
      fuelType: 'wood',
      efficiency: 0.25,
      coverage: 4,
      fuelConsumption: 8,
      fuelCost: 0.1,
      installationCost: 25,
      maintenanceRequired: true,
      fireRisk: 0.2,
      smokeProduction: 0.5,
      components: {
        heatSource: { x: 4, y: 4, floor: 0 }
      },
      comfortRadius: { optimal: 2, adequate: 3, minimal: 5 },
      socialClass: ['poor', 'common']
    },

    'magical_heating': {
      id: 'magical_heating',
      name: 'Magical Heating System',
      type: 'magical',
      heatOutput: 25000,
      fuelType: 'magical',
      efficiency: 0.9,
      coverage: 12,
      fuelConsumption: 1, // magical units per hour
      fuelCost: 5, // per magical unit
      installationCost: 2000,
      maintenanceRequired: false,
      fireRisk: 0.01,
      smokeProduction: 0,
      components: {
        heatSource: { x: 4, y: 4, floor: 0 },
        vents: [
          { x: 2, y: 2, floor: 0 },
          { x: 6, y: 2, floor: 0 },
          { x: 2, y: 6, floor: 0 },
          { x: 6, y: 6, floor: 0 }
        ]
      },
      comfortRadius: { optimal: 8, adequate: 10, minimal: 15 },
      socialClass: ['noble']
    }
  };

  private static coolingSystemTemplates: { [key: string]: CoolingSystem } = {
    'natural_ventilation': {
      id: 'natural_ventilation',
      name: 'Natural Cross-Ventilation',
      type: 'natural',
      coolingPower: 8000,
      waterRequirement: 0,
      coverage: 8,
      energyCost: 0,
      efficiency: 0.6,
      components: {
        coolant: { x: 0, y: 4, floor: 0, type: 'water' },
        circulation: [
          { x: 0, y: 2, floor: 0 },
          { x: 8, y: 2, floor: 0 },
          { x: 0, y: 6, floor: 0 },
          { x: 8, y: 6, floor: 0 }
        ]
      },
      seasonalEffectiveness: { spring: 0.8, summer: 1.0, autumn: 0.7, winter: 0.3 },
      socialClass: ['poor', 'common', 'wealthy', 'noble']
    },

    'evaporative_cooling': {
      id: 'evaporative_cooling',
      name: 'Evaporative Cooling',
      type: 'evaporative',
      coolingPower: 12000,
      waterRequirement: 20,
      coverage: 6,
      energyCost: 2,
      efficiency: 0.7,
      components: {
        coolant: { x: 4, y: 1, floor: 0, type: 'water' },
        circulation: [
          { x: 2, y: 4, floor: 0 },
          { x: 6, y: 4, floor: 0 }
        ],
        drains: [{ x: 4, y: 7, floor: 0 }]
      },
      seasonalEffectiveness: { spring: 0.6, summer: 0.9, autumn: 0.5, winter: 0.2 },
      socialClass: ['wealthy', 'noble']
    },

    'magical_cooling': {
      id: 'magical_cooling',
      name: 'Magical Climate Control',
      type: 'magical',
      coolingPower: 20000,
      waterRequirement: 0,
      coverage: 15,
      energyCost: 8,
      efficiency: 0.95,
      components: {
        coolant: { x: 4, y: 4, floor: 0, type: 'magical' },
        circulation: [
          { x: 1, y: 1, floor: 0 },
          { x: 7, y: 1, floor: 0 },
          { x: 1, y: 7, floor: 0 },
          { x: 7, y: 7, floor: 0 }
        ]
      },
      seasonalEffectiveness: { spring: 1.0, summer: 1.0, autumn: 1.0, winter: 1.0 },
      socialClass: ['noble']
    }
  };

  private static ventilationSystemTemplates: { [key: string]: VentilationSystem } = {
    'window_ventilation': {
      id: 'window_ventilation',
      name: 'Window Cross-Ventilation',
      type: 'natural',
      efficiency: 0.3,
      coverage: 6,
      energyCost: 0,
      airQualityImprovement: 0.4,
      noiseLevel: 25,
      components: {
        intakes: [
          { x: 0, y: 2, floor: 0, type: 'window' },
          { x: 0, y: 6, floor: 0, type: 'window' }
        ],
        exhausts: [
          { x: 8, y: 2, floor: 0, type: 'window' },
          { x: 8, y: 6, floor: 0, type: 'window' }
        ]
      },
      seasonalEfficiency: { spring: 0.8, summer: 1.0, autumn: 0.7, winter: 0.3 },
      socialClass: ['poor', 'common', 'wealthy', 'noble'],
      buildingTypes: ['house_small', 'house_large', 'shop', 'tavern']
    },

    'chimney_ventilation': {
      id: 'chimney_ventilation',
      name: 'Chimney Stack Ventilation',
      type: 'passive',
      efficiency: 0.5,
      coverage: 10,
      energyCost: 0,
      airQualityImprovement: 0.6,
      noiseLevel: 15,
      components: {
        intakes: [
          { x: 2, y: 8, floor: 0, type: 'vent' },
          { x: 6, y: 8, floor: 0, type: 'vent' }
        ],
        exhausts: [
          { x: 4, y: 4, floor: 0, type: 'chimney' }
        ]
      },
      seasonalEfficiency: { spring: 0.7, summer: 0.9, autumn: 0.8, winter: 0.6 },
      socialClass: ['common', 'wealthy', 'noble'],
      buildingTypes: ['house_large', 'blacksmith', 'shop']
    }
  };

  static generateBuildingComfort(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    materials: any,
    climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry',
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): BuildingComfort {
    const climateZone = this.selectClimateZone(climate);
    const roomComfort = this.generateRoomComfort(rooms, socialClass, materials, season, seed);
    const centralSystems = this.generateCentralSystems(buildingType, socialClass, seed);
    const energyUsage = this.calculateEnergyUsage(roomComfort, centralSystems, season);
    const operationalCosts = this.calculateOperationalCosts(energyUsage, centralSystems);
    
    const comfort = this.calculateOverallComfort(roomComfort);
    const health = this.calculateHealthIndex(roomComfort);
    const sustainability = this.calculateSustainabilityRating(energyUsage, socialClass);
    const maintenance = this.generateMaintenanceSchedule(roomComfort, centralSystems);

    return {
      buildingId,
      climateZone,
      rooms: roomComfort,
      centralSystems,
      energyUsage,
      operationalCosts,
      comfortIndex: comfort,
      healthIndex: health,
      sustainabilityRating: sustainability,
      maintenanceSchedule: maintenance
    };
  }

  private static selectClimateZone(climate: string): ClimateZone {
    const mapping = {
      'temperate': 'temperate_continental',
      'cold': 'cold_subarctic',
      'hot': 'temperate_continental', // Hot variant
      'wet': 'temperate_oceanic',
      'dry': 'temperate_continental' // Dry variant
    };

    return this.climateZones[mapping[climate]] || this.climateZones['temperate_continental'];
  }

  private static generateRoomComfort(
    rooms: any[],
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    materials: any,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    seed: number
  ): { [roomId: string]: RoomComfort } {
    const roomComfort: { [roomId: string]: RoomComfort } = {};

    rooms.forEach((room, index) => {
      const systems = this.selectRoomSystems(room.type, socialClass, seed + index);
      const insulation = this.calculateInsulation(materials, socialClass);
      const heatSources = this.calculateHeatSources(room, seed + index);
      const moistureSources = this.calculateMoistureSources(room, seed + index);
      
      const currentConditions = this.calculateCurrentConditions(
        room, systems, insulation, heatSources, moistureSources, season
      );
      
      const targetConditions = this.calculateTargetConditions(room.type, socialClass);

      roomComfort[room.id] = {
        roomId: room.id,
        roomType: room.type,
        dimensions: {
          width: room.width || 8,
          height: room.height || 8,
          volume: (room.width || 8) * (room.height || 8) * 10 // 10ft ceiling
        },
        systems,
        insulation,
        heatSources,
        moistureSources,
        currentConditions,
        targetConditions,
        controlSystems: this.generateControlSystems(room.type, socialClass, seed + index)
      };
    });

    return roomComfort;
  }

  private static selectRoomSystems(
    roomType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): RoomComfort['systems'] {
    const systems: RoomComfort['systems'] = {
      heating: null,
      cooling: null,
      ventilation: null
    };

    // Select heating system based on room type and social class
    const heatingOptions = Object.values(this.heatingSystemTemplates).filter(system =>
      system.socialClass.includes(socialClass)
    );

    if (heatingOptions.length > 0) {
      let selectedHeating: HeatingSystem;
      
      if (roomType === 'common' && socialClass !== 'poor') {
        selectedHeating = this.heatingSystemTemplates['simple_fireplace'];
      } else if (socialClass === 'noble') {
        selectedHeating = this.heatingSystemTemplates['magical_heating'];
      } else {
        selectedHeating = this.heatingSystemTemplates['brazier_iron'];
      }

      if (selectedHeating && selectedHeating.socialClass.includes(socialClass)) {
        systems.heating = selectedHeating;
      }
    }

    // Select cooling system
    const coolingOptions = Object.values(this.coolingSystemTemplates).filter(system =>
      system.socialClass.includes(socialClass)
    );

    if (coolingOptions.length > 0 && socialClass !== 'poor') {
      const selectedCooling = socialClass === 'noble' ? 
        this.coolingSystemTemplates['magical_cooling'] :
        this.coolingSystemTemplates['natural_ventilation'];
      
      systems.cooling = selectedCooling;
    }

    // Select ventilation system
    const ventilationOptions = Object.values(this.ventilationSystemTemplates).filter(system =>
      system.socialClass.includes(socialClass)
    );

    if (ventilationOptions.length > 0) {
      const selectedVentilation = socialClass === 'poor' ? 
        this.ventilationSystemTemplates['window_ventilation'] :
        this.ventilationSystemTemplates['chimney_ventilation'];
      
      systems.ventilation = selectedVentilation;
    }

    return systems;
  }

  private static calculateInsulation(materials: any, socialClass: 'poor' | 'common' | 'wealthy' | 'noble'): RoomComfort['insulation'] {
    const baseInsulation = {
      poor: { walls: 2, windows: 1, roof: 3, floor: 1 },
      common: { walls: 5, windows: 2, roof: 8, floor: 3 },
      wealthy: { walls: 10, windows: 4, roof: 15, floor: 6 },
      noble: { walls: 15, windows: 6, roof: 20, floor: 10 }
    };

    return baseInsulation[socialClass];
  }

  private static calculateHeatSources(room: any, seed: number): RoomComfort['heatSources'] {
    const occupantCount = Math.floor(this.seedRandom(seed) * 3) + 1;
    
    return {
      occupants: occupantCount * 300, // BTU per person per hour
      lighting: room.type === 'common' ? 500 : 200, // Lighting heat
      cooking: room.type === 'kitchen' ? 3000 : 0, // Cooking equipment
      other: room.type === 'workshop' ? 1500 : 0 // Other heat sources
    };
  }

  private static calculateMoistureSources(room: any, seed: number): RoomComfort['moistureSources'] {
    const occupantCount = Math.floor(this.seedRandom(seed) * 3) + 1;
    
    return {
      cooking: room.type === 'kitchen' ? 2.5 : 0, // Gallons per day
      occupants: occupantCount * 0.5, // Person breathing/sweating
      bathing: room.type === 'bedroom' ? 1.0 : 0, // Washing activities
      other: 0.2 // Plants, etc.
    };
  }

  private static calculateCurrentConditions(
    room: any,
    systems: RoomComfort['systems'],
    insulation: RoomComfort['insulation'],
    heatSources: RoomComfort['heatSources'],
    moistureSources: RoomComfort['moistureSources'],
    season: 'spring' | 'summer' | 'autumn' | 'winter'
  ): ComfortMetrics {
    // Base temperature calculation
    const outsideTemp = { spring: 65, summer: 80, autumn: 55, winter: 35 }[season];
    const totalHeat = Object.values(heatSources).reduce((sum, heat) => sum + heat, 0);
    const heatLoss = (outsideTemp - 70) * (1 / (insulation.walls + insulation.windows + insulation.roof + insulation.floor)) * 100;
    
    let temperature = outsideTemp + (totalHeat - heatLoss) / 1000;
    
    // Apply heating system
    if (systems.heating) {
      temperature += systems.heating.heatOutput / 2000; // Simplified heating effect
    }
    
    // Apply cooling system
    if (systems.cooling && temperature > 72) {
      temperature -= systems.cooling.coolingPower / 2000; // Simplified cooling effect
    }

    // Humidity calculation
    const baseMoisture = Object.values(moistureSources).reduce((sum, moisture) => sum + moisture, 0);
    let humidity = 50 + (baseMoisture * 10); // Base humidity plus moisture sources
    
    if (systems.ventilation) {
      humidity -= systems.ventilation.efficiency * 20; // Ventilation reduces humidity
    }

    // Air quality calculation
    let airQuality = 0.7; // Base air quality
    if (systems.ventilation) {
      airQuality += systems.ventilation.airQualityImprovement;
    }
    if (systems.heating && systems.heating.smokeProduction > 0) {
      airQuality -= systems.heating.smokeProduction * 0.3;
    }

    // Airflow calculation
    const airflow = systems.ventilation ? systems.ventilation.efficiency : 0.2;

    // Thermal comfort calculation
    const idealTemp = 72;
    const tempDeviation = Math.abs(temperature - idealTemp) / 20;
    const thermal = Math.max(0, 1 - tempDeviation);

    // Overall comfort
    const overall = (thermal + Math.min(1, airQuality) + airflow + (1 - Math.abs(humidity - 50) / 50)) / 4;

    return {
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.max(20, Math.min(80, Math.round(humidity))),
      airQuality: Math.max(0, Math.min(1, airQuality)),
      airflow,
      thermal,
      overall: Math.max(0, Math.min(1, overall)),
      healthEffects: {
        respiratory: airQuality,
        temperature: thermal,
        humidity: 1 - Math.abs(humidity - 50) / 50,
        allergens: airQuality * 0.8
      },
      productivityModifier: (overall - 0.5) * 0.5, // -0.25 to +0.25
      restQuality: Math.max(0.2, overall),
      moodImpact: Math.round((overall - 0.5) * 10) // -5 to +5
    };
  }

  private static calculateTargetConditions(roomType: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble'): ComfortMetrics {
    const targets = {
      'bedroom': { temp: 68, humidity: 45 },
      'common': { temp: 72, humidity: 50 },
      'kitchen': { temp: 70, humidity: 40 },
      'workshop': { temp: 65, humidity: 45 },
      'study': { temp: 70, humidity: 45 },
      'storage': { temp: 60, humidity: 50 }
    };

    const roomTarget = targets[roomType] || targets['common'];
    const classModifier = { poor: -3, common: 0, wealthy: 2, noble: 5 }[socialClass];

    return {
      temperature: roomTarget.temp + classModifier,
      humidity: roomTarget.humidity,
      airQuality: socialClass === 'poor' ? 0.6 : socialClass === 'noble' ? 0.95 : 0.8,
      airflow: 0.7,
      thermal: 0.8,
      overall: 0.85,
      healthEffects: { respiratory: 0.9, temperature: 0.9, humidity: 0.9, allergens: 0.9 },
      productivityModifier: 0.1,
      restQuality: 0.9,
      moodImpact: 2
    };
  }

  private static generateControlSystems(roomType: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble', seed: number): RoomComfort['controlSystems'] {
    const controls: RoomComfort['controlSystems'] = {};

    // Only wealthy and noble get automated controls
    if (socialClass === 'wealthy' || socialClass === 'noble') {
      controls.thermostat = {
        targetTemp: 72,
        deadband: 3,
        schedule: {
          'morning': 70,
          'midday': 72,
          'evening': 74,
          'night': 68
        }
      };
    }

    if (socialClass === 'noble') {
      controls.humidistat = {
        targetHumidity: 45,
        controlRange: 10
      };

      controls.airQualityMonitor = {
        alertThreshold: 0.7,
        autoResponse: true
      };
    }

    return controls;
  }

  private static generateCentralSystems(buildingType: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble', seed: number): BuildingComfort['centralSystems'] {
    const central: BuildingComfort['centralSystems'] = {};

    // Large buildings with wealthy/noble owners get central systems
    if ((buildingType === 'house_large' || buildingType === 'shop') && 
        (socialClass === 'wealthy' || socialClass === 'noble')) {
      
      central.heating = this.heatingSystemTemplates['magical_heating'];
      central.cooling = this.coolingSystemTemplates['magical_cooling'];
      central.ventilation = this.ventilationSystemTemplates['chimney_ventilation'];
    }

    return central;
  }

  private static calculateEnergyUsage(
    roomComfort: { [roomId: string]: RoomComfort },
    centralSystems: BuildingComfort['centralSystems'],
    season: 'spring' | 'summer' | 'autumn' | 'winter'
  ): BuildingComfort['energyUsage'] {
    let heating = 0, cooling = 0, ventilation = 0;
    const breakdown: { [systemId: string]: number } = {};

    // Room-level systems
    Object.values(roomComfort).forEach(room => {
      if (room.systems.heating) {
        const usage = room.systems.heating.fuelConsumption * 8; // 8 hours average daily use
        heating += usage;
        breakdown[room.systems.heating.id] = usage;
      }
      
      if (room.systems.cooling) {
        const usage = room.systems.cooling.energyCost * 6; // 6 hours average daily use
        cooling += usage;
        breakdown[room.systems.cooling.id] = usage;
      }
      
      if (room.systems.ventilation) {
        const usage = room.systems.ventilation.energyCost * 24; // 24 hours
        ventilation += usage;
        breakdown[room.systems.ventilation.id] = usage;
      }
    });

    // Central systems
    if (centralSystems.heating) {
      const usage = centralSystems.heating.fuelConsumption * 12;
      heating += usage;
      breakdown[`central_${centralSystems.heating.id}`] = usage;
    }

    const total = heating + cooling + ventilation;

    return {
      daily: total,
      heating,
      cooling,
      ventilation,
      breakdown
    };
  }

  private static calculateOperationalCosts(
    energyUsage: BuildingComfort['energyUsage'],
    centralSystems: BuildingComfort['centralSystems']
  ): BuildingComfort['operationalCosts'] {
    const daily = energyUsage.daily * 0.5; // Assume $0.50 per energy unit

    const seasonal = {
      spring: daily * 90 * 0.8, // 90 days, 80% usage
      summer: daily * 90 * 1.2, // Higher cooling costs
      autumn: daily * 90 * 0.9,
      winter: daily * 90 * 1.5  // Higher heating costs
    };

    const annual = Object.values(seasonal).reduce((sum, cost) => sum + cost, 0);

    return { daily, seasonal, annual };
  }

  private static calculateOverallComfort(roomComfort: { [roomId: string]: RoomComfort }): number {
    const rooms = Object.values(roomComfort);
    if (rooms.length === 0) return 50;

    const totalComfort = rooms.reduce((sum, room) => sum + room.currentConditions.overall, 0);
    return Math.round((totalComfort / rooms.length) * 100);
  }

  private static calculateHealthIndex(roomComfort: { [roomId: string]: RoomComfort }): number {
    const rooms = Object.values(roomComfort);
    if (rooms.length === 0) return 50;

    const healthScores = rooms.map(room => {
      const health = room.currentConditions.healthEffects;
      return (health.respiratory + health.temperature + health.humidity + health.allergens) / 4;
    });

    const totalHealth = healthScores.reduce((sum, score) => sum + score, 0);
    return Math.round((totalHealth / rooms.length) * 100);
  }

  private static calculateSustainabilityRating(energyUsage: BuildingComfort['energyUsage'], socialClass: 'poor' | 'common' | 'wealthy' | 'noble'): string {
    const dailyUsage = energyUsage.daily;
    const thresholds = { poor: 20, common: 50, wealthy: 100, noble: 200 };
    const threshold = thresholds[socialClass];

    if (dailyUsage < threshold * 0.5) return 'excellent';
    if (dailyUsage < threshold * 0.75) return 'good';
    if (dailyUsage < threshold) return 'fair';
    return 'poor';
  }

  private static generateMaintenanceSchedule(
    roomComfort: { [roomId: string]: RoomComfort },
    centralSystems: BuildingComfort['centralSystems']
  ): BuildingComfort['maintenanceSchedule'] {
    const schedule: BuildingComfort['maintenanceSchedule'] = [];

    // Room system maintenance
    Object.values(roomComfort).forEach(room => {
      if (room.systems.heating && room.systems.heating.maintenanceRequired) {
        schedule.push({
          system: `${room.roomType} Heating`,
          nextMaintenance: 'Monthly',
          frequency: 'monthly',
          cost: 5
        });
      }
      
      if (room.systems.ventilation) {
        schedule.push({
          system: `${room.roomType} Ventilation`,
          nextMaintenance: 'Seasonal',
          frequency: 'seasonal',
          cost: 2
        });
      }
    });

    // Central system maintenance
    if (centralSystems.heating) {
      schedule.push({
        system: 'Central Heating',
        nextMaintenance: 'Seasonal',
        frequency: 'seasonal',
        cost: 25
      });
    }

    return schedule;
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Public utility methods
  static getClimateZone(id: string): ClimateZone | null {
    return this.climateZones[id] || null;
  }

  static getHeatingSystem(id: string): HeatingSystem | null {
    return this.heatingSystemTemplates[id] || null;
  }

  static getCoolingSystem(id: string): CoolingSystem | null {
    return this.coolingSystemTemplates[id] || null;
  }

  static getVentilationSystem(id: string): VentilationSystem | null {
    return this.ventilationSystemTemplates[id] || null;
  }

  static calculateComfortAdjustment(
    currentComfort: ComfortMetrics,
    targetComfort: ComfortMetrics,
    systems: RoomComfort['systems']
  ): { adjustments: string[]; cost: number; timeRequired: number } {
    const adjustments: string[] = [];
    let cost = 0;
    let timeRequired = 0;

    // Temperature adjustments
    const tempDiff = targetComfort.temperature - currentComfort.temperature;
    if (Math.abs(tempDiff) > 3) {
      if (tempDiff > 0 && !systems.heating) {
        adjustments.push('Install heating system');
        cost += 200;
        timeRequired = Math.max(timeRequired, 7);
      } else if (tempDiff < 0 && !systems.cooling) {
        adjustments.push('Install cooling system');
        cost += 300;
        timeRequired = Math.max(timeRequired, 7);
      } else if (tempDiff > 0 && systems.heating) {
        adjustments.push('Increase heating system capacity');
        cost += 50;
        timeRequired = Math.max(timeRequired, 1);
      }
    }

    // Air quality adjustments
    if (currentComfort.airQuality < targetComfort.airQuality - 0.1) {
      if (!systems.ventilation) {
        adjustments.push('Install ventilation system');
        cost += 100;
        timeRequired = Math.max(timeRequired, 3);
      } else {
        adjustments.push('Upgrade air filtration');
        cost += 25;
        timeRequired = Math.max(timeRequired, 1);
      }
    }

    // Humidity adjustments
    if (Math.abs(currentComfort.humidity - targetComfort.humidity) > 10) {
      adjustments.push('Install humidity control system');
      cost += 75;
      timeRequired = Math.max(timeRequired, 2);
    }

    return { adjustments, cost, timeRequired };
  }

  static simulateSeasonalChange(
    buildingComfort: BuildingComfort,
    newSeason: 'spring' | 'summer' | 'autumn' | 'winter'
  ): BuildingComfort {
    const updatedRooms = { ...buildingComfort.rooms };

    Object.keys(updatedRooms).forEach(roomId => {
      const room = updatedRooms[roomId];
      
      // Recalculate current conditions based on new season
      room.currentConditions = this.calculateCurrentConditions(
        { type: room.roomType, width: room.dimensions.width, height: room.dimensions.height },
        room.systems,
        room.insulation,
        room.heatSources,
        room.moistureSources,
        newSeason
      );
    });

    // Recalculate energy usage and costs
    const newEnergyUsage = this.calculateEnergyUsage(updatedRooms, buildingComfort.centralSystems, newSeason);
    const newOperationalCosts = this.calculateOperationalCosts(newEnergyUsage, buildingComfort.centralSystems);

    return {
      ...buildingComfort,
      rooms: updatedRooms,
      energyUsage: newEnergyUsage,
      operationalCosts: newOperationalCosts,
      comfortIndex: this.calculateOverallComfort(updatedRooms),
      healthIndex: this.calculateHealthIndex(updatedRooms)
    };
  }

  static addCustomClimateZone(id: string, zone: ClimateZone): void {
    this.climateZones[id] = zone;
  }

  static addCustomHeatingSystem(id: string, system: HeatingSystem): void {
    this.heatingSystemTemplates[id] = system;
  }

  static addCustomCoolingSystem(id: string, system: CoolingSystem): void {
    this.coolingSystemTemplates[id] = system;
  }

  static addCustomVentilationSystem(id: string, system: VentilationSystem): void {
    this.ventilationSystemTemplates[id] = system;
  }
}