// Interior Lighting & Atmosphere System
export interface LightSource {
  id: string;
  name: string;
  type: 'candle' | 'brazier' | 'fireplace' | 'window' | 'magical' | 'torch' | 'chandelier' | 'lamp';
  x: number;
  y: number;
  radius: number; // Light radius in tiles
  intensity: number; // 0.1 to 1.0
  color: string; // Light color (hex)
  fuel?: {
    type: 'wax' | 'oil' | 'wood' | 'magical' | 'natural';
    duration: number; // Hours of light
    cost: number; // Cost per refuel
  };
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  roomTypes: string[];
  asset: {
    path: string;
    variations: string[];
  };
  properties: string[]; // 'smoky', 'bright', 'flickering', 'steady', 'warm'
}

export interface RoomLighting {
  roomId: string;
  lightSources: LightSource[];
  ambientLight: number; // Base lighting level 0-1
  atmosphere: 'bright' | 'cozy' | 'dim' | 'dark' | 'eerie' | 'mysterious' | 'welcoming';
  timeOfDay: {
    dawn: number;    // 0-1 lighting level
    morning: number;
    noon: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export interface BuildingLighting {
  buildingId: string;
  rooms: { [roomId: string]: RoomLighting };
  exteriorLights: LightSource[];
  totalLightingCost: number; // Daily fuel/maintenance cost
}

export class LightingSystem {
  private static lightSources: { [key: string]: LightSource } = {
    'candle_simple': {
      id: 'candle_simple',
      name: 'Simple Candle',
      type: 'candle',
      x: 0, y: 0,
      radius: 2,
      intensity: 0.3,
      color: '#FFA500',
      fuel: { type: 'wax', duration: 8, cost: 1 },
      socialClass: ['poor', 'common'],
      roomTypes: ['bedroom', 'common', 'study'],
      asset: { path: 'furniture/lighting/candle_simple', variations: ['lit', 'unlit'] },
      properties: ['flickering', 'warm', 'smoky']
    },

    'candle_quality': {
      id: 'candle_quality',
      name: 'Quality Candle',
      type: 'candle',
      x: 0, y: 0,
      radius: 3,
      intensity: 0.5,
      color: '#FFD700',
      fuel: { type: 'wax', duration: 12, cost: 3 },
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['bedroom', 'common', 'study'],
      asset: { path: 'furniture/lighting/candle_quality', variations: ['lit', 'unlit'] },
      properties: ['steady', 'bright', 'clean']
    },

    'brazier_iron': {
      id: 'brazier_iron',
      name: 'Iron Brazier',
      type: 'brazier',
      x: 0, y: 0,
      radius: 4,
      intensity: 0.8,
      color: '#FF4500',
      fuel: { type: 'wood', duration: 6, cost: 2 },
      socialClass: ['common', 'wealthy', 'noble'],
      roomTypes: ['common', 'entrance', 'workshop'],
      asset: { path: 'furniture/lighting/brazier_iron', variations: ['lit', 'unlit', 'ornate'] },
      properties: ['bright', 'smoky', 'warm', 'crackling']
    },

    'fireplace': {
      id: 'fireplace',
      name: 'Stone Fireplace',
      type: 'fireplace',
      x: 0, y: 0,
      radius: 6,
      intensity: 1.0,
      color: '#FF6600',
      fuel: { type: 'wood', duration: 8, cost: 5 },
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['common', 'bedroom', 'study'],
      asset: { path: 'furniture/lighting/fireplace', variations: ['stone', 'brick', 'ornate'] },
      properties: ['bright', 'warm', 'cozy', 'crackling']
    },

    'chandelier_crystal': {
      id: 'chandelier_crystal',
      name: 'Crystal Chandelier',
      type: 'chandelier',
      x: 0, y: 0,
      radius: 8,
      intensity: 0.9,
      color: '#FFFACD',
      fuel: { type: 'oil', duration: 10, cost: 10 },
      socialClass: ['noble'],
      roomTypes: ['common', 'study'],
      asset: { path: 'furniture/lighting/chandelier', variations: ['crystal', 'gold', 'silver'] },
      properties: ['brilliant', 'elegant', 'steady', 'expensive']
    },

    'window_large': {
      id: 'window_large',
      name: 'Large Window',
      type: 'window',
      x: 0, y: 0,
      radius: 4,
      intensity: 0.8,
      color: '#FFFFFF',
      socialClass: ['common', 'wealthy', 'noble'],
      roomTypes: ['common', 'bedroom', 'study', 'shop'],
      asset: { path: 'furniture/windows/window_large', variations: ['clear', 'stained', 'shuttered'] },
      properties: ['natural', 'variable', 'bright']
    },

    'torch_wall': {
      id: 'torch_wall',
      name: 'Wall Torch',
      type: 'torch',
      x: 0, y: 0,
      radius: 3,
      intensity: 0.6,
      color: '#FF8C00',
      fuel: { type: 'oil', duration: 4, cost: 2 },
      socialClass: ['poor', 'common'],
      roomTypes: ['entrance', 'storage', 'workshop'],
      asset: { path: 'furniture/lighting/torch_wall', variations: ['lit', 'unlit', 'smoky'] },
      properties: ['flickering', 'smoky', 'medieval']
    },

    'magical_orb': {
      id: 'magical_orb',
      name: 'Magical Light Orb',
      type: 'magical',
      x: 0, y: 0,
      radius: 6,
      intensity: 0.9,
      color: '#9370DB',
      fuel: { type: 'magical', duration: 24, cost: 50 },
      socialClass: ['wealthy', 'noble'],
      roomTypes: ['study', 'laboratory', 'library'],
      asset: { path: 'furniture/lighting/orb_magical', variations: ['blue', 'purple', 'white'] },
      properties: ['steady', 'magical', 'silent', 'expensive']
    }
  };

  static generateRoomLighting(
    roomId: string,
    roomType: string,
    roomWidth: number,
    roomHeight: number,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night',
    seed: number
  ): RoomLighting {
    const availableLights = Object.values(this.lightSources).filter(light =>
      light.roomTypes.includes(roomType) &&
      light.socialClass.includes(socialClass)
    );

    const selectedLights: LightSource[] = [];
    
    // Always add windows if it's a daytime-accessible room
    if (['common', 'bedroom', 'study', 'shop'].includes(roomType)) {
      const window = this.lightSources['window_large'];
      if (window && socialClass !== 'poor') {
        selectedLights.push({
          ...window,
          id: `${roomId}_window_1`,
          x: 1,
          y: 0
        });
      }
    }

    // Add primary light source based on room type and social class
    let primaryLight: LightSource | null = null;
    
    if (socialClass === 'noble' && roomType === 'common') {
      primaryLight = this.lightSources['chandelier_crystal'];
    } else if (socialClass === 'wealthy' && ['common', 'bedroom'].includes(roomType)) {
      primaryLight = this.lightSources['fireplace'];
    } else if (['common', 'entrance'].includes(roomType)) {
      primaryLight = this.lightSources['brazier_iron'];
    } else {
      primaryLight = socialClass === 'poor' ? this.lightSources['candle_simple'] : this.lightSources['candle_quality'];
    }

    if (primaryLight) {
      selectedLights.push({
        ...primaryLight,
        id: `${roomId}_primary_light`,
        x: Math.floor(roomWidth / 2),
        y: Math.floor(roomHeight / 2)
      });
    }

    // Add secondary lights for larger rooms
    if (roomWidth * roomHeight > 16 && socialClass !== 'poor') {
      const secondaryLight = socialClass === 'wealthy' || socialClass === 'noble' 
        ? this.lightSources['candle_quality'] 
        : this.lightSources['torch_wall'];
      
      if (secondaryLight) {
        selectedLights.push({
          ...secondaryLight,
          id: `${roomId}_secondary_light`,
          x: roomWidth - 2,
          y: roomHeight - 2
        });
      }
    }

    // Calculate ambient light and atmosphere
    const ambientLight = this.calculateAmbientLight(selectedLights, timeOfDay);
    const atmosphere = this.determineAtmosphere(roomType, socialClass, selectedLights);

    return {
      roomId,
      lightSources: selectedLights,
      ambientLight,
      atmosphere,
      timeOfDay: {
        dawn: 0.3,
        morning: 0.8,
        noon: 1.0,
        afternoon: 0.8,
        evening: 0.4,
        night: 0.1
      }
    };
  }

  static calculateAmbientLight(lightSources: LightSource[], timeOfDay: string): number {
    let totalLight = 0;
    
    lightSources.forEach(light => {
      if (light.type === 'window') {
        // Windows contribute based on time of day
        const dayMultiplier = timeOfDay === 'noon' ? 1.0 : 
                             timeOfDay === 'morning' || timeOfDay === 'afternoon' ? 0.8 :
                             timeOfDay === 'dawn' || timeOfDay === 'evening' ? 0.3 : 0.0;
        totalLight += light.intensity * dayMultiplier;
      } else {
        totalLight += light.intensity;
      }
    });

    return Math.min(1.0, totalLight);
  }

  static determineAtmosphere(
    roomType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    lightSources: LightSource[]
  ): RoomLighting['atmosphere'] {
    const lightLevel = lightSources.reduce((sum, light) => sum + light.intensity, 0);
    const hasWarmLight = lightSources.some(light => light.properties.includes('warm'));
    const hasMagicalLight = lightSources.some(light => light.type === 'magical');

    if (hasMagicalLight) return 'mysterious';
    if (lightLevel > 1.5 && socialClass === 'noble') return 'bright';
    if (hasWarmLight && roomType === 'bedroom') return 'cozy';
    if (hasWarmLight && roomType === 'common') return 'welcoming';
    if (lightLevel < 0.3) return 'dark';
    if (lightLevel < 0.6) return 'dim';
    if (roomType === 'storage' || roomType === 'cellar') return 'eerie';
    
    return 'bright';
  }

  static generateBuildingLighting(
    buildingId: string,
    rooms: any[],
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    timeOfDay: string,
    seed: number
  ): BuildingLighting {
    const roomLighting: { [roomId: string]: RoomLighting } = {};
    let totalCost = 0;

    rooms.forEach(room => {
      const lighting = this.generateRoomLighting(
        room.id,
        room.type,
        room.width,
        room.height,
        socialClass,
        timeOfDay as any,
        seed + room.id.charCodeAt(0)
      );
      roomLighting[room.id] = lighting;
      
      // Calculate daily fuel costs
      lighting.lightSources.forEach(light => {
        if (light.fuel) {
          totalCost += light.fuel.cost / light.fuel.duration; // Daily cost
        }
      });
    });

    return {
      buildingId,
      rooms: roomLighting,
      exteriorLights: [], // Could add exterior lighting
      totalLightingCost: totalCost
    };
  }

  static getLightSource(id: string): LightSource | null {
    return this.lightSources[id] || null;
  }

  static addCustomLightSource(id: string, lightSource: LightSource): void {
    this.lightSources[id] = lightSource;
  }

  static getAllLightSources(): { [key: string]: LightSource } {
    return { ...this.lightSources };
  }

  // Calculate light coverage for a room (for gameplay purposes)
  static calculateLightCoverage(
    roomWidth: number,
    roomHeight: number,
    lightSources: LightSource[]
  ): number[][] {
    const coverage: number[][] = Array(roomHeight).fill(null).map(() => Array(roomWidth).fill(0));
    
    lightSources.forEach(light => {
      for (let y = 0; y < roomHeight; y++) {
        for (let x = 0; x < roomWidth; x++) {
          const distance = Math.sqrt((x - light.x) ** 2 + (y - light.y) ** 2);
          if (distance <= light.radius) {
            const lightContribution = light.intensity * (1 - distance / light.radius);
            coverage[y][x] = Math.min(1.0, coverage[y][x] + lightContribution);
          }
        }
      }
    });

    return coverage;
  }
}