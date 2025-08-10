// Dynamic Weather & Seasonal Systems
export interface WeatherCondition {
  id: string;
  name: string;
  type: 'clear' | 'overcast' | 'rain' | 'storm' | 'snow' | 'fog' | 'wind' | 'hail';
  intensity: 'light' | 'moderate' | 'heavy' | 'severe';
  temperature: number; // In Fahrenheit
  humidity: number; // 0-100%
  windSpeed: number; // mph
  visibility: number; // miles
  duration: number; // hours
  effects: {
    buildingDamage: number; // 0-1 damage rate per hour
    comfortReduction: number; // 0-1 comfort loss
    lightingReduction: number; // 0-1 natural light reduction
    soundMuffling: number; // 0-1 sound reduction
    movementHindrance: number; // 0-1 movement penalty
  };
  buildingEffects: {
    leakage: boolean; // Water damage to interiors
    drafts: boolean; // Cold air infiltration
    structuralStress: boolean; // Building integrity concerns
    fireRisk: boolean; // Increased fire danger
  };
}

export interface SeasonalModifier {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  temperatureRange: { min: number; max: number };
  commonWeather: WeatherCondition['type'][];
  buildingEffects: {
    heatingNeeds: number; // 0-1 heating requirement
    coolingNeeds: number; // 0-1 cooling requirement
    maintenanceMultiplier: number; // Maintenance cost modifier
    comfortBaseline: number; // Base comfort level
  };
  activityModifiers: {
    outdoorWork: number; // 0-1 efficiency modifier
    travel: number; // 0-1 travel speed modifier
    trade: number; // 0-1 business modifier
    construction: number; // 0-1 building work modifier
  };
  resourceAvailability: {
    wood: number;
    stone: number;
    food: number;
    water: number;
  };
}

export interface BuildingWeatherEffects {
  buildingId: string;
  currentWeather: WeatherCondition;
  weatherDamage: {
    roofDamage: number; // 0-1
    wallDamage: number; // 0-1
    foundationDamage: number; // 0-1
    windowDamage: number; // 0-1
  };
  interiorEffects: {
    temperature: number;
    humidity: number;
    comfort: number; // 0-1
    airQuality: number; // 0-1
  };
  roomSpecificEffects: {
    roomId: string;
    leakage: boolean;
    drafts: boolean;
    temperatureVariation: number;
  }[];
  emergencyNeeds: string[]; // List of urgent weather-related issues
}

export class WeatherSystem {
  private static weatherConditions: { [key: string]: WeatherCondition } = {
    'clear_mild': {
      id: 'clear_mild',
      name: 'Clear Skies',
      type: 'clear',
      intensity: 'light',
      temperature: 65,
      humidity: 45,
      windSpeed: 5,
      visibility: 10,
      duration: 8,
      effects: {
        buildingDamage: 0,
        comfortReduction: 0,
        lightingReduction: 0,
        soundMuffling: 0,
        movementHindrance: 0
      },
      buildingEffects: {
        leakage: false,
        drafts: false,
        structuralStress: false,
        fireRisk: false
      }
    },

    'rain_moderate': {
      id: 'rain_moderate',
      name: 'Steady Rain',
      type: 'rain',
      intensity: 'moderate',
      temperature: 55,
      humidity: 85,
      windSpeed: 12,
      visibility: 2,
      duration: 6,
      effects: {
        buildingDamage: 0.02,
        comfortReduction: 0.2,
        lightingReduction: 0.3,
        soundMuffling: 0.4,
        movementHindrance: 0.2
      },
      buildingEffects: {
        leakage: true,
        drafts: true,
        structuralStress: false,
        fireRisk: false
      }
    },

    'snow_heavy': {
      id: 'snow_heavy',
      name: 'Heavy Snowfall',
      type: 'snow',
      intensity: 'heavy',
      temperature: 25,
      humidity: 75,
      windSpeed: 15,
      visibility: 0.5,
      duration: 12,
      effects: {
        buildingDamage: 0.05,
        comfortReduction: 0.4,
        lightingReduction: 0.5,
        soundMuffling: 0.7,
        movementHindrance: 0.6
      },
      buildingEffects: {
        leakage: false,
        drafts: true,
        structuralStress: true,
        fireRisk: false
      }
    },

    'storm_severe': {
      id: 'storm_severe',
      name: 'Severe Thunderstorm',
      type: 'storm',
      intensity: 'severe',
      temperature: 62,
      humidity: 90,
      windSpeed: 45,
      visibility: 1,
      duration: 3,
      effects: {
        buildingDamage: 0.15,
        comfortReduction: 0.6,
        lightingReduction: 0.7,
        soundMuffling: 0.2,
        movementHindrance: 0.8
      },
      buildingEffects: {
        leakage: true,
        drafts: true,
        structuralStress: true,
        fireRisk: true
      }
    },

    'fog_dense': {
      id: 'fog_dense',
      name: 'Dense Fog',
      type: 'fog',
      intensity: 'heavy',
      temperature: 50,
      humidity: 95,
      windSpeed: 2,
      visibility: 0.1,
      duration: 10,
      effects: {
        buildingDamage: 0,
        comfortReduction: 0.1,
        lightingReduction: 0.6,
        soundMuffling: 0.3,
        movementHindrance: 0.4
      },
      buildingEffects: {
        leakage: false,
        drafts: false,
        structuralStress: false,
        fireRisk: false
      }
    }
  };

  private static seasonalModifiers: { [key: string]: SeasonalModifier } = {
    'spring': {
      season: 'spring',
      temperatureRange: { min: 45, max: 70 },
      commonWeather: ['rain', 'clear', 'overcast'],
      buildingEffects: {
        heatingNeeds: 0.3,
        coolingNeeds: 0,
        maintenanceMultiplier: 1.2,
        comfortBaseline: 0.7
      },
      activityModifiers: {
        outdoorWork: 0.8,
        travel: 0.9,
        trade: 1.0,
        construction: 0.9
      },
      resourceAvailability: {
        wood: 1.0,
        stone: 1.0,
        food: 0.8,
        water: 1.2
      }
    },

    'summer': {
      season: 'summer',
      temperatureRange: { min: 65, max: 85 },
      commonWeather: ['clear', 'storm', 'overcast'],
      buildingEffects: {
        heatingNeeds: 0,
        coolingNeeds: 0.4,
        maintenanceMultiplier: 1.0,
        comfortBaseline: 0.8
      },
      activityModifiers: {
        outdoorWork: 1.0,
        travel: 1.1,
        trade: 1.2,
        construction: 1.1
      },
      resourceAvailability: {
        wood: 1.1,
        stone: 1.0,
        food: 1.3,
        water: 0.9
      }
    },

    'autumn': {
      season: 'autumn',
      temperatureRange: { min: 40, max: 65 },
      commonWeather: ['clear', 'rain', 'wind'],
      buildingEffects: {
        heatingNeeds: 0.5,
        coolingNeeds: 0,
        maintenanceMultiplier: 1.1,
        comfortBaseline: 0.7
      },
      activityModifiers: {
        outdoorWork: 0.9,
        travel: 0.9,
        trade: 1.1,
        construction: 0.8
      },
      resourceAvailability: {
        wood: 1.2,
        stone: 1.0,
        food: 1.4,
        water: 1.0
      }
    },

    'winter': {
      season: 'winter',
      temperatureRange: { min: 20, max: 45 },
      commonWeather: ['snow', 'overcast', 'clear'],
      buildingEffects: {
        heatingNeeds: 0.8,
        coolingNeeds: 0,
        maintenanceMultiplier: 1.5,
        comfortBaseline: 0.5
      },
      activityModifiers: {
        outdoorWork: 0.6,
        travel: 0.7,
        trade: 0.8,
        construction: 0.5
      },
      resourceAvailability: {
        wood: 0.8,
        stone: 0.9,
        food: 0.6,
        water: 0.8
      }
    }
  };

  static generateWeatherForBuilding(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry',
    materials: { wall: string; roof: string; foundation: string },
    seed: number
  ): BuildingWeatherEffects {
    const currentWeather = this.generateCurrentWeather(season, climate, seed);
    const weatherDamage = this.calculateWeatherDamage(currentWeather, materials, socialClass);
    const interiorEffects = this.calculateInteriorEffects(currentWeather, buildingType, materials);
    const roomEffects = this.generateRoomSpecificEffects(currentWeather, buildingType, seed);
    const emergencyNeeds = this.assessEmergencyNeeds(currentWeather, weatherDamage, interiorEffects);

    return {
      buildingId,
      currentWeather,
      weatherDamage,
      interiorEffects,
      roomSpecificEffects: roomEffects,
      emergencyNeeds
    };
  }

  private static generateCurrentWeather(
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    climate: 'temperate' | 'cold' | 'hot' | 'wet' | 'dry',
    seed: number
  ): WeatherCondition {
    const seasonalMod = this.seasonalModifiers[season];
    const commonWeatherTypes = seasonalMod.commonWeather;
    
    // Climate modifications
    const climateWeatherMod = {
      'cold': ['snow', 'overcast', 'wind'],
      'hot': ['clear', 'storm'],
      'wet': ['rain', 'storm', 'fog'],
      'dry': ['clear', 'wind'],
      'temperate': commonWeatherTypes
    };

    const availableWeather = climateWeatherMod[climate] || commonWeatherTypes;
    const weatherType = availableWeather[Math.floor(this.seedRandom(seed) * availableWeather.length)];

    // Find matching weather condition
    const weatherId = Object.keys(this.weatherConditions).find(key => 
      this.weatherConditions[key].type === weatherType
    ) || 'clear_mild';

    const baseWeather = this.weatherConditions[weatherId];
    
    // Apply seasonal temperature adjustments
    const tempAdjustment = this.seedRandom(seed + 100) * 
      (seasonalMod.temperatureRange.max - seasonalMod.temperatureRange.min) + 
      seasonalMod.temperatureRange.min - baseWeather.temperature;

    return {
      ...baseWeather,
      temperature: baseWeather.temperature + tempAdjustment
    };
  }

  private static calculateWeatherDamage(
    weather: WeatherCondition,
    materials: { wall: string; roof: string; foundation: string },
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble'
  ): BuildingWeatherEffects['weatherDamage'] {
    const baseDamage = weather.effects.buildingDamage;
    
    // Material resistance (poor materials = more damage)
    const materialResistance = {
      poor: 0.5,
      common: 0.7,
      wealthy: 0.85,
      noble: 0.95
    }[socialClass];

    const effectiveDamage = baseDamage * (1 - materialResistance);

    return {
      roofDamage: weather.buildingEffects.structuralStress ? effectiveDamage * 1.5 : effectiveDamage,
      wallDamage: weather.buildingEffects.leakage ? effectiveDamage * 1.2 : effectiveDamage * 0.8,
      foundationDamage: effectiveDamage * 0.3,
      windowDamage: weather.type === 'storm' ? effectiveDamage * 2 : effectiveDamage * 0.5
    };
  }

  private static calculateInteriorEffects(
    weather: WeatherCondition,
    buildingType: string,
    materials: { wall: string; roof: string; foundation: string }
  ): BuildingWeatherEffects['interiorEffects'] {
    const baseComfort = 0.7;
    const temperatureVariation = weather.buildingEffects.drafts ? 10 : 5;
    const humidityIncrease = weather.buildingEffects.leakage ? 20 : 0;

    return {
      temperature: weather.temperature + (weather.buildingEffects.drafts ? -temperatureVariation : 0),
      humidity: Math.min(100, weather.humidity + humidityIncrease),
      comfort: Math.max(0, baseComfort - weather.effects.comfortReduction),
      airQuality: weather.type === 'fog' ? 0.6 : weather.buildingEffects.drafts ? 0.8 : 0.9
    };
  }

  private static generateRoomSpecificEffects(
    weather: WeatherCondition,
    buildingType: string,
    seed: number
  ): BuildingWeatherEffects['roomSpecificEffects'] {
    const roomEffects: BuildingWeatherEffects['roomSpecificEffects'] = [];
    
    // Different rooms affected differently by weather
    const vulnerableRooms = ['attic', 'cellar', 'storage', 'entrance'];
    const protectedRooms = ['bedroom', 'study', 'common'];

    vulnerableRooms.forEach((roomType, index) => {
      const isAffected = this.seedRandom(seed + index) < weather.effects.buildingDamage + 0.3;
      
      if (isAffected) {
        roomEffects.push({
          roomId: `${buildingType}_${roomType}`,
          leakage: weather.buildingEffects.leakage && roomType !== 'cellar',
          drafts: weather.buildingEffects.drafts,
          temperatureVariation: weather.buildingEffects.drafts ? 15 : 5
        });
      }
    });

    return roomEffects;
  }

  private static assessEmergencyNeeds(
    weather: WeatherCondition,
    damage: BuildingWeatherEffects['weatherDamage'],
    interior: BuildingWeatherEffects['interiorEffects']
  ): string[] {
    const needs: string[] = [];

    if (damage.roofDamage > 0.1) needs.push('Roof repair needed - water damage imminent');
    if (damage.windowDamage > 0.2) needs.push('Window reinforcement required');
    if (weather.buildingEffects.structuralStress) needs.push('Structural inspection recommended');
    if (interior.temperature < 40) needs.push('Emergency heating required');
    if (interior.humidity > 80) needs.push('Moisture control needed - mold risk');
    if (weather.effects.buildingDamage > 0.1) needs.push('Weather shelter preparations needed');

    return needs;
  }

  static getSeasonalModifier(season: 'spring' | 'summer' | 'autumn' | 'winter'): SeasonalModifier {
    return this.seasonalModifiers[season];
  }

  static simulateWeatherProgression(
    currentWeather: WeatherCondition,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    hoursElapsed: number,
    seed: number
  ): WeatherCondition {
    // Simple weather progression - can be made more complex
    if (hoursElapsed >= currentWeather.duration) {
      // Generate new weather
      return this.generateCurrentWeather(season, 'temperate', seed + hoursElapsed);
    }
    return currentWeather;
  }

  static calculateSeasonalBuildingChanges(
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    buildingType: string,
    rooms: any[]
  ): { roomId: string; changes: string[] }[] {
    const seasonalChanges: { roomId: string; changes: string[] }[] = [];
    
    rooms.forEach(room => {
      const changes: string[] = [];
      
      switch (season) {
        case 'winter':
          if (room.type === 'common') changes.push('Fireplace in active use', 'Heavy curtains drawn');
          if (room.type === 'bedroom') changes.push('Extra blankets on bed', 'Draft stoppers at doors');
          if (room.type === 'storage') changes.push('Increased firewood storage', 'Food preservation supplies');
          break;
          
        case 'summer':
          if (room.type === 'common') changes.push('Windows opened for airflow', 'Lighter furnishings');
          if (room.type === 'bedroom') changes.push('Lighter bedding', 'Cooling implements');
          if (room.type === 'kitchen') changes.push('Outdoor cooking area active', 'Fresh food storage');
          break;
          
        case 'spring':
          if (room.type === 'common') changes.push('Spring cleaning in progress', 'Fresh flowers');
          if (room.type === 'storage') changes.push('Garden tools accessible', 'Seed storage');
          break;
          
        case 'autumn':
          if (room.type === 'storage') changes.push('Harvest goods stored', 'Winter preparation supplies');
          if (room.type === 'kitchen') changes.push('Food preservation active', 'Increased food stores');
          break;
      }
      
      if (changes.length > 0) {
        seasonalChanges.push({ roomId: room.id, changes });
      }
    });
    
    return seasonalChanges;
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  static getWeatherCondition(id: string): WeatherCondition | null {
    return this.weatherConditions[id] || null;
  }

  static addCustomWeather(id: string, condition: WeatherCondition): void {
    this.weatherConditions[id] = condition;
  }

  static getAllWeatherConditions(): { [key: string]: WeatherCondition } {
    return { ...this.weatherConditions };
  }
}