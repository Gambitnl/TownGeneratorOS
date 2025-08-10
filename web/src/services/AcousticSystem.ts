// Acoustic & Sound Design System for immersive D&D gameplay
export interface SoundSource {
  id: string;
  name: string;
  type: 'ambient' | 'activity' | 'mechanical' | 'creature' | 'weather' | 'magical' | 'structural';
  x: number;
  y: number;
  floor: number;
  volume: number; // 0-100 decibel level
  frequency: 'low' | 'mid' | 'high' | 'ultrasonic'; // Affects perception by different races
  range: number; // Tiles, how far the sound travels
  attenuation: number; // How quickly sound fades with distance (0-1)
  properties: string[]; // 'continuous', 'intermittent', 'rhythmic', 'harmonic', 'discordant'
  triggerConditions?: {
    timeOfDay?: string[];
    activity?: string[];
    weather?: string[];
    inhabitantPresent?: boolean;
  };
  perceptionDC: {
    human: number;
    elf: number;   // Keen Senses
    dwarf: number;
    halfling: number;
    gnome: number;
    tiefling: number;
    dragonborn: number;
  };
  emotionalImpact: {
    comfort: number;    // -5 to +5
    anxiety: number;    // -5 to +5 
    alertness: number;  // -5 to +5
    concentration: number; // -5 to +5
  };
  masksOtherSounds: boolean; // Can hide other sounds
  echoProperties: {
    hasEcho: boolean;
    echoDelay: number; // milliseconds
    echoStrength: number; // 0-1
  };
}

export interface AcousticMaterial {
  id: string;
  name: string;
  absorption: number; // 0-1, how much sound it absorbs
  reflection: number; // 0-1, how much sound it reflects
  transmission: number; // 0-1, how much sound passes through
  resonantFrequency?: 'low' | 'mid' | 'high'; // What frequency it amplifies
  density: number; // Affects sound transmission
  thickness: number; // Feet, affects attenuation
}

export interface RoomAcoustics {
  roomId: string;
  roomType: string;
  dimensions: { width: number; height: number; length: number };
  materials: {
    walls: AcousticMaterial;
    floor: AcousticMaterial;
    ceiling: AcousticMaterial;
    furnishing: AcousticMaterial; // Average of furniture/contents
  };
  acousticProperties: {
    reverberationTime: number; // Seconds
    soundClarity: number; // 0-1, how clear sounds are
    backgroundNoise: number; // Ambient sound level
    soundIsolation: number; // 0-1, how well isolated from other rooms
  };
  soundSources: SoundSource[];
  soundPathways: {
    connectedRoomId: string;
    soundTransmission: number; // 0-1, how much sound passes through
    pathway: 'door' | 'window' | 'wall' | 'floor' | 'ceiling' | 'ventilation';
  }[];
}

export interface SoundscapeProfile {
  name: string;
  description: string;
  buildingTypes: string[];
  timeProfiles: {
    dawn: SoundSource[];
    morning: SoundSource[];
    midday: SoundSource[];
    afternoon: SoundSource[];
    evening: SoundSource[];
    night: SoundSource[];
  };
  weatherVariations: {
    clear: { volumeMultiplier: number; additionalSounds: SoundSource[] };
    rain: { volumeMultiplier: number; additionalSounds: SoundSource[] };
    storm: { volumeMultiplier: number; additionalSounds: SoundSource[] };
    snow: { volumeMultiplier: number; additionalSounds: SoundSource[] };
  };
  inhabitantActivities: {
    [activityName: string]: SoundSource[];
  };
}

export interface BuildingAcoustics {
  buildingId: string;
  rooms: { [roomId: string]: RoomAcoustics };
  soundscapeProfile: SoundscapeProfile;
  masterVolumeByTime: {
    dawn: number;
    morning: number;
    midday: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  acousticEvents: {
    id: string;
    name: string;
    description: string;
    triggerCondition: string;
    soundChanges: {
      roomId: string;
      newSounds: SoundSource[];
      modifiedSounds: { soundId: string; volumeChange: number }[];
    }[];
    duration: number; // Minutes
  }[];
  listeningPosts: {
    id: string;
    name: string;
    x: number;
    y: number;
    floor: number;
    roomId: string;
    advantageForPerception: number; // Bonus to Perception checks
    hearableRooms: string[]; // Rooms that can be heard from this position
  }[];
}

export class AcousticSystem {
  private static acousticMaterials: { [key: string]: AcousticMaterial } = {
    'stone_thick': {
      id: 'stone_thick',
      name: 'Thick Stone Wall',
      absorption: 0.15,
      reflection: 0.70,
      transmission: 0.05,
      density: 2.7,
      thickness: 2
    },

    'wood_planks': {
      id: 'wood_planks',
      name: 'Wooden Planks',
      absorption: 0.25,
      reflection: 0.45,
      transmission: 0.30,
      resonantFrequency: 'mid',
      density: 0.6,
      thickness: 1
    },

    'cloth_heavy': {
      id: 'cloth_heavy',
      name: 'Heavy Cloth/Tapestries',
      absorption: 0.65,
      reflection: 0.10,
      transmission: 0.25,
      density: 0.2,
      thickness: 0.1
    },

    'straw_thatch': {
      id: 'straw_thatch',
      name: 'Straw Thatch Roof',
      absorption: 0.45,
      reflection: 0.20,
      transmission: 0.35,
      density: 0.1,
      thickness: 1.5
    },

    'brick_mortar': {
      id: 'brick_mortar',
      name: 'Brick with Mortar',
      absorption: 0.20,
      reflection: 0.65,
      transmission: 0.15,
      density: 2.0,
      thickness: 1.5
    },

    'dirt_floor': {
      id: 'dirt_floor',
      name: 'Packed Earth Floor',
      absorption: 0.35,
      reflection: 0.30,
      transmission: 0.35,
      density: 1.5,
      thickness: 6
    },

    'wooden_floor': {
      id: 'wooden_floor',
      name: 'Wooden Floorboards',
      absorption: 0.20,
      reflection: 0.40,
      transmission: 0.40,
      resonantFrequency: 'low',
      density: 0.6,
      thickness: 0.75
    }
  };

  private static soundSources: { [key: string]: Omit<SoundSource, 'id' | 'x' | 'y' | 'floor'> } = {
    'fireplace_crackling': {
      name: 'Crackling Fireplace',
      type: 'activity',
      volume: 25,
      frequency: 'mid',
      range: 4,
      attenuation: 0.3,
      properties: ['continuous', 'rhythmic'],
      triggerConditions: { timeOfDay: ['dawn', 'evening', 'night'] },
      perceptionDC: { human: 5, elf: 3, dwarf: 6, halfling: 4, gnome: 4, tiefling: 5, dragonborn: 5 },
      emotionalImpact: { comfort: 3, anxiety: -2, alertness: 0, concentration: -1 },
      masksOtherSounds: false,
      echoProperties: { hasEcho: false, echoDelay: 0, echoStrength: 0 }
    },

    'footsteps_wood': {
      name: 'Footsteps on Wood',
      type: 'activity',
      volume: 15,
      frequency: 'low',
      range: 3,
      attenuation: 0.5,
      properties: ['intermittent', 'rhythmic'],
      triggerConditions: { inhabitantPresent: true },
      perceptionDC: { human: 8, elf: 6, dwarf: 9, halfling: 7, gnome: 7, tiefling: 8, dragonborn: 8 },
      emotionalImpact: { comfort: 0, anxiety: 1, alertness: 2, concentration: -1 },
      masksOtherSounds: false,
      echoProperties: { hasEcho: true, echoDelay: 200, echoStrength: 0.3 }
    },

    'cooking_sounds': {
      name: 'Cooking Activity',
      type: 'activity',
      volume: 20,
      frequency: 'mid',
      range: 2,
      attenuation: 0.4,
      properties: ['intermittent'],
      triggerConditions: { timeOfDay: ['morning', 'evening'], activity: ['cooking'] },
      perceptionDC: { human: 10, elf: 8, dwarf: 11, halfling: 9, gnome: 9, tiefling: 10, dragonborn: 10 },
      emotionalImpact: { comfort: 2, anxiety: 0, alertness: 0, concentration: 0 },
      masksOtherSounds: false,
      echoProperties: { hasEcho: false, echoDelay: 0, echoStrength: 0 }
    },

    'rain_light': {
      name: 'Light Rain',
      type: 'weather',
      volume: 30,
      frequency: 'high',
      range: 8,
      attenuation: 0.2,
      properties: ['continuous'],
      triggerConditions: { weather: ['rain'] },
      perceptionDC: { human: 3, elf: 2, dwarf: 4, halfling: 2, gnome: 2, tiefling: 3, dragonborn: 3 },
      emotionalImpact: { comfort: 1, anxiety: 0, alertness: -1, concentration: 1 },
      masksOtherSounds: true,
      echoProperties: { hasEcho: false, echoDelay: 0, echoStrength: 0 }
    },

    'wind_howling': {
      name: 'Howling Wind',
      type: 'weather',
      volume: 45,
      frequency: 'low',
      range: 12,
      attenuation: 0.1,
      properties: ['continuous'],
      triggerConditions: { weather: ['storm', 'snow'] },
      perceptionDC: { human: 5, elf: 4, dwarf: 6, halfling: 4, gnome: 4, tiefling: 5, dragonborn: 5 },
      emotionalImpact: { comfort: -2, anxiety: 3, alertness: 2, concentration: -3 },
      masksOtherSounds: true,
      echoProperties: { hasEcho: true, echoDelay: 1000, echoStrength: 0.6 }
    },

    'smithing_hammer': {
      name: 'Blacksmith Hammer',
      type: 'activity',
      volume: 60,
      frequency: 'mid',
      range: 6,
      attenuation: 0.4,
      properties: ['rhythmic', 'intermittent'],
      triggerConditions: { timeOfDay: ['morning', 'midday', 'afternoon'], activity: ['smithing'] },
      perceptionDC: { human: 2, elf: 1, dwarf: 3, halfling: 1, gnome: 1, tiefling: 2, dragonborn: 2 },
      emotionalImpact: { comfort: -1, anxiety: 1, alertness: 3, concentration: -4 },
      masksOtherSounds: true,
      echoProperties: { hasEcho: true, echoDelay: 400, echoStrength: 0.7 }
    },

    'conversation_quiet': {
      name: 'Quiet Conversation',
      type: 'activity',
      volume: 12,
      frequency: 'mid',
      range: 2,
      attenuation: 0.7,
      properties: ['intermittent'],
      triggerConditions: { inhabitantPresent: true },
      perceptionDC: { human: 15, elf: 13, dwarf: 16, halfling: 14, gnome: 14, tiefling: 15, dragonborn: 15 },
      emotionalImpact: { comfort: 1, anxiety: 0, alertness: 1, concentration: -2 },
      masksOtherSounds: false,
      echoProperties: { hasEcho: false, echoDelay: 0, echoStrength: 0 }
    },

    'door_creak': {
      name: 'Creaking Door',
      type: 'structural',
      volume: 18,
      frequency: 'high',
      range: 3,
      attenuation: 0.5,
      properties: ['intermittent'],
      triggerConditions: { inhabitantPresent: true },
      perceptionDC: { human: 12, elf: 10, dwarf: 13, halfling: 11, gnome: 11, tiefling: 12, dragonborn: 12 },
      emotionalImpact: { comfort: -1, anxiety: 2, alertness: 4, concentration: -1 },
      masksOtherSounds: false,
      echoProperties: { hasEcho: true, echoDelay: 300, echoStrength: 0.4 }
    },

    'magical_hum': {
      name: 'Magical Energy Hum',
      type: 'magical',
      volume: 8,
      frequency: 'ultrasonic',
      range: 5,
      attenuation: 0.2,
      properties: ['continuous', 'harmonic'],
      perceptionDC: { human: 18, elf: 14, dwarf: 20, halfling: 16, gnome: 12, tiefling: 15, dragonborn: 17 },
      emotionalImpact: { comfort: -1, anxiety: 1, alertness: 3, concentration: 2 },
      masksOtherSounds: false,
      echoProperties: { hasEcho: false, echoDelay: 0, echoStrength: 0 }
    }
  };

  private static soundscapeProfiles: { [key: string]: SoundscapeProfile } = {
    'cozy_home': {
      name: 'Cozy Home Soundscape',
      description: 'Comfortable domestic sounds of daily life',
      buildingTypes: ['house_small', 'house_large'],
      timeProfiles: {
        dawn: [
          { ...this.soundSources['conversation_quiet'], id: 'dawn_conversation', x: 4, y: 4, floor: 0 }
        ],
        morning: [
          { ...this.soundSources['cooking_sounds'], id: 'morning_cooking', x: 2, y: 3, floor: 0 },
          { ...this.soundSources['footsteps_wood'], id: 'morning_steps', x: 5, y: 5, floor: 0 }
        ],
        midday: [
          { ...this.soundSources['conversation_quiet'], id: 'midday_conversation', x: 4, y: 4, floor: 0 }
        ],
        afternoon: [
          { ...this.soundSources['footsteps_wood'], id: 'afternoon_steps', x: 3, y: 2, floor: 0 }
        ],
        evening: [
          { ...this.soundSources['fireplace_crackling'], id: 'evening_fire', x: 4, y: 2, floor: 0 },
          { ...this.soundSources['cooking_sounds'], id: 'evening_cooking', x: 2, y: 3, floor: 0 }
        ],
        night: [
          { ...this.soundSources['fireplace_crackling'], id: 'night_fire', x: 4, y: 2, floor: 0 }
        ]
      },
      weatherVariations: {
        clear: { volumeMultiplier: 1.0, additionalSounds: [] },
        rain: { 
          volumeMultiplier: 0.8, 
          additionalSounds: [{ ...this.soundSources['rain_light'], id: 'weather_rain', x: 0, y: 0, floor: 0 }] 
        },
        storm: { 
          volumeMultiplier: 0.6, 
          additionalSounds: [{ ...this.soundSources['wind_howling'], id: 'weather_wind', x: 0, y: 0, floor: 0 }] 
        },
        snow: { volumeMultiplier: 0.9, additionalSounds: [] }
      },
      inhabitantActivities: {
        'cooking': [{ ...this.soundSources['cooking_sounds'], id: 'activity_cooking', x: 2, y: 3, floor: 0 }],
        'conversation': [{ ...this.soundSources['conversation_quiet'], id: 'activity_conversation', x: 4, y: 4, floor: 0 }]
      }
    },

    'busy_workshop': {
      name: 'Busy Workshop Soundscape',
      description: 'Active crafting and work sounds',
      buildingTypes: ['blacksmith', 'shop'],
      timeProfiles: {
        dawn: [],
        morning: [
          { ...this.soundSources['smithing_hammer'], id: 'morning_smithing', x: 3, y: 3, floor: 0 },
          { ...this.soundSources['footsteps_wood'], id: 'morning_work_steps', x: 2, y: 2, floor: 0 }
        ],
        midday: [
          { ...this.soundSources['smithing_hammer'], id: 'midday_smithing', x: 3, y: 3, floor: 0 },
          { ...this.soundSources['conversation_quiet'], id: 'customer_talk', x: 5, y: 2, floor: 0 }
        ],
        afternoon: [
          { ...this.soundSources['smithing_hammer'], id: 'afternoon_smithing', x: 3, y: 3, floor: 0 }
        ],
        evening: [
          { ...this.soundSources['conversation_quiet'], id: 'evening_discussion', x: 4, y: 4, floor: 0 }
        ],
        night: []
      },
      weatherVariations: {
        clear: { volumeMultiplier: 1.0, additionalSounds: [] },
        rain: { 
          volumeMultiplier: 0.9, 
          additionalSounds: [{ ...this.soundSources['rain_light'], id: 'workshop_rain', x: 0, y: 0, floor: 0 }] 
        },
        storm: { 
          volumeMultiplier: 0.7, 
          additionalSounds: [{ ...this.soundSources['wind_howling'], id: 'workshop_storm', x: 0, y: 0, floor: 0 }] 
        },
        snow: { volumeMultiplier: 1.1, additionalSounds: [] }
      },
      inhabitantActivities: {
        'smithing': [{ ...this.soundSources['smithing_hammer'], id: 'work_smithing', x: 3, y: 3, floor: 0 }],
        'customer_service': [{ ...this.soundSources['conversation_quiet'], id: 'customer_interaction', x: 5, y: 2, floor: 0 }]
      }
    }
  };

  static generateBuildingAcoustics(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    materials: any,
    inhabitants: any[],
    weather: string,
    timeOfDay: string,
    seed: number
  ): BuildingAcoustics {
    const roomAcoustics = this.generateRoomAcoustics(rooms, materials, socialClass, seed);
    const soundscapeProfile = this.selectSoundscapeProfile(buildingType);
    const masterVolume = this.calculateMasterVolume(socialClass, weather);
    const acousticEvents = this.generateAcousticEvents(buildingType, inhabitants, seed);
    const listeningPosts = this.generateListeningPosts(rooms, seed);

    return {
      buildingId,
      rooms: roomAcoustics,
      soundscapeProfile,
      masterVolumeByTime: masterVolume,
      acousticEvents,
      listeningPosts
    };
  }

  private static generateRoomAcoustics(
    rooms: any[],
    buildingMaterials: any,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    seed: number
  ): { [roomId: string]: RoomAcoustics } {
    const roomAcoustics: { [roomId: string]: RoomAcoustics } = {};

    rooms.forEach((room, index) => {
      const materials = this.selectRoomMaterials(room.type, socialClass, buildingMaterials);
      const acousticProps = this.calculateAcousticProperties(room, materials);
      const soundSources = this.generateRoomSounds(room, seed + index);
      const soundPathways = this.calculateSoundPathways(room, rooms);

      roomAcoustics[room.id] = {
        roomId: room.id,
        roomType: room.type,
        dimensions: {
          width: room.width || 8,
          height: room.height || 8,
          length: room.length || 8
        },
        materials,
        acousticProperties: acousticProps,
        soundSources,
        soundPathways
      };
    });

    return roomAcoustics;
  }

  private static selectRoomMaterials(
    roomType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    buildingMaterials: any
  ): RoomAcoustics['materials'] {
    // Default materials based on social class
    const defaultMaterials = {
      poor: {
        walls: this.acousticMaterials['wood_planks'],
        floor: this.acousticMaterials['dirt_floor'],
        ceiling: this.acousticMaterials['straw_thatch'],
        furnishing: this.acousticMaterials['wood_planks']
      },
      common: {
        walls: this.acousticMaterials['wood_planks'],
        floor: this.acousticMaterials['wooden_floor'],
        ceiling: this.acousticMaterials['wood_planks'],
        furnishing: this.acousticMaterials['cloth_heavy']
      },
      wealthy: {
        walls: this.acousticMaterials['brick_mortar'],
        floor: this.acousticMaterials['wooden_floor'],
        ceiling: this.acousticMaterials['wood_planks'],
        furnishing: this.acousticMaterials['cloth_heavy']
      },
      noble: {
        walls: this.acousticMaterials['stone_thick'],
        floor: this.acousticMaterials['wooden_floor'],
        ceiling: this.acousticMaterials['wood_planks'],
        furnishing: this.acousticMaterials['cloth_heavy']
      }
    };

    return defaultMaterials[socialClass];
  }

  private static calculateAcousticProperties(
    room: any,
    materials: RoomAcoustics['materials']
  ): RoomAcoustics['acousticProperties'] {
    const volume = (room.width || 8) * (room.height || 8) * 10; // Assuming 10ft ceiling
    const surfaceArea = 2 * ((room.width || 8) * (room.height || 8)) + // Floor + ceiling
                        2 * ((room.width || 8) * 10 + (room.height || 8) * 10); // Walls

    // Calculate reverberation time using Sabine's formula (simplified)
    const totalAbsorption = (materials.walls.absorption * 0.4 + 
                            materials.floor.absorption * 0.2 + 
                            materials.ceiling.absorption * 0.2 + 
                            materials.furnishing.absorption * 0.2) * surfaceArea;

    const reverberationTime = 0.16 * volume / Math.max(totalAbsorption, 0.1);

    // Sound clarity based on reverberation and materials
    const soundClarity = Math.max(0, Math.min(1, 1 - reverberationTime / 3));

    // Background noise based on room type
    const backgroundNoiseBase = {
      'kitchen': 25,
      'workshop': 30,
      'common': 15,
      'bedroom': 10,
      'storage': 5,
      'study': 8
    };
    const backgroundNoise = backgroundNoiseBase[room.type] || 12;

    // Sound isolation based on wall materials
    const soundIsolation = Math.max(0, Math.min(1, materials.walls.absorption + (1 - materials.walls.transmission)));

    return {
      reverberationTime: Math.max(0.1, Math.min(5, reverberationTime)),
      soundClarity,
      backgroundNoise,
      soundIsolation
    };
  }

  private static generateRoomSounds(room: any, seed: number): SoundSource[] {
    const sounds: SoundSource[] = [];
    
    // Add room-specific sounds
    const roomSoundTypes = {
      'kitchen': ['cooking_sounds'],
      'workshop': ['smithing_hammer'],
      'common': ['conversation_quiet', 'fireplace_crackling'],
      'bedroom': ['footsteps_wood'],
      'study': ['conversation_quiet'],
      'storage': ['door_creak']
    };

    const possibleSounds = roomSoundTypes[room.type] || ['footsteps_wood'];
    
    possibleSounds.forEach((soundType, index) => {
      const template = this.soundSources[soundType];
      if (template) {
        sounds.push({
          ...template,
          id: `${room.id}_${soundType}`,
          x: Math.floor(this.seedRandom(seed + index) * (room.width || 8)),
          y: Math.floor(this.seedRandom(seed + index + 100) * (room.height || 8)),
          floor: room.floor || 0
        });
      }
    });

    return sounds;
  }

  private static calculateSoundPathways(room: any, allRooms: any[]): RoomAcoustics['soundPathways'] {
    const pathways: RoomAcoustics['soundPathways'] = [];

    // Find adjacent rooms (simplified - assumes rooms are adjacent if they share coordinates)
    allRooms.forEach(otherRoom => {
      if (room.id === otherRoom.id) return;

      // Check if rooms are adjacent (simplified logic)
      const isAdjacent = Math.abs(room.x - otherRoom.x) <= 1 && Math.abs(room.y - otherRoom.y) <= 1;
      if (isAdjacent) {
        pathways.push({
          connectedRoomId: otherRoom.id,
          soundTransmission: 0.3, // Base transmission through walls
          pathway: 'wall'
        });
      }

      // Check for doors (if rooms are connected by doors)
      if (room.connections && room.connections.includes(otherRoom.id)) {
        pathways.push({
          connectedRoomId: otherRoom.id,
          soundTransmission: 0.7, // Much higher transmission through doors
          pathway: 'door'
        });
      }
    });

    return pathways;
  }

  private static selectSoundscapeProfile(buildingType: string): SoundscapeProfile {
    // Find the best matching soundscape profile
    const profile = Object.values(this.soundscapeProfiles).find(p => 
      p.buildingTypes.includes(buildingType)
    );

    return profile || this.soundscapeProfiles['cozy_home'];
  }

  private static calculateMasterVolume(socialClass: 'poor' | 'common' | 'wealthy' | 'noble', weather: string): BuildingAcoustics['masterVolumeByTime'] {
    const baseVolume = {
      poor: 0.8,    // Thinner walls, more noise
      common: 0.6,
      wealthy: 0.4,
      noble: 0.3    // Better sound isolation
    }[socialClass];

    const weatherMultiplier = {
      'clear': 1.0,
      'rain': 1.3,
      'storm': 1.6,
      'snow': 0.9
    }[weather] || 1.0;

    return {
      dawn: baseVolume * 0.6 * weatherMultiplier,
      morning: baseVolume * 1.0 * weatherMultiplier,
      midday: baseVolume * 1.2 * weatherMultiplier,
      afternoon: baseVolume * 1.0 * weatherMultiplier,
      evening: baseVolume * 0.8 * weatherMultiplier,
      night: baseVolume * 0.4 * weatherMultiplier
    };
  }

  private static generateAcousticEvents(
    buildingType: string,
    inhabitants: any[],
    seed: number
  ): BuildingAcoustics['acousticEvents'] {
    const events: BuildingAcoustics['acousticEvents'] = [];

    // Common acoustic events
    const eventTemplates = [
      {
        name: 'Unexpected Visitor',
        description: 'Someone arrives at the door with loud knocking',
        triggerCondition: 'random_visitor',
        duration: 5
      },
      {
        name: 'Argument Breaks Out',
        description: 'Loud voices and heated discussion',
        triggerCondition: 'social_conflict',
        duration: 10
      },
      {
        name: 'Mysterious Sounds',
        description: 'Strange sounds from an unknown source',
        triggerCondition: 'night_activity',
        duration: 15
      }
    ];

    // Add 1-2 random events
    const eventCount = 1 + Math.floor(this.seedRandom(seed) * 2);
    for (let i = 0; i < eventCount; i++) {
      const template = eventTemplates[Math.floor(this.seedRandom(seed + i) * eventTemplates.length)];
      
      events.push({
        id: `acoustic_event_${i}`,
        name: template.name,
        description: template.description,
        triggerCondition: template.triggerCondition,
        soundChanges: [{
          roomId: 'common_room', // Default to common room
          newSounds: [{
            ...this.soundSources['conversation_quiet'],
            id: `event_sound_${i}`,
            x: 4,
            y: 4,
            floor: 0,
            volume: 35 // Louder for events
          }],
          modifiedSounds: []
        }],
        duration: template.duration
      });
    }

    return events;
  }

  private static generateListeningPosts(rooms: any[], seed: number): BuildingAcoustics['listeningPosts'] {
    const posts: BuildingAcoustics['listeningPosts'] = [];

    // Find strategic listening positions
    rooms.forEach((room, index) => {
      // Doorways are good listening posts
      posts.push({
        id: `listening_post_${room.id}`,
        name: `${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Doorway`,
        x: 0, // Near the entrance
        y: Math.floor((room.height || 8) / 2),
        floor: room.floor || 0,
        roomId: room.id,
        advantageForPerception: 2,
        hearableRooms: [] // Would be calculated based on sound pathways
      });

      // Central room positions for large rooms
      if ((room.width || 8) * (room.height || 8) > 24) {
        posts.push({
          id: `listening_center_${room.id}`,
          name: `Center of ${room.type.charAt(0).toUpperCase() + room.type.slice(1)}`,
          x: Math.floor((room.width || 8) / 2),
          y: Math.floor((room.height || 8) / 2),
          floor: room.floor || 0,
          roomId: room.id,
          advantageForPerception: 0,
          hearableRooms: []
        });
      }
    });

    return posts;
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Public methods for gameplay integration
  static calculateSoundPerceptionDC(
    sound: SoundSource,
    listenerPosition: { x: number; y: number; floor: number },
    listenerRace: keyof SoundSource['perceptionDC'],
    roomAcoustics: RoomAcoustics,
    masterVolume: number
  ): number {
    // Base DC from sound properties
    let baseDC = sound.perceptionDC[listenerRace];

    // Distance modifier
    const distance = Math.sqrt(
      Math.pow(sound.x - listenerPosition.x, 2) + 
      Math.pow(sound.y - listenerPosition.y, 2)
    );

    const distanceModifier = Math.floor(distance * 2); // +2 DC per tile distance
    baseDC += distanceModifier;

    // Volume and attenuation
    const effectiveVolume = sound.volume * masterVolume * Math.pow(1 - sound.attenuation, distance);
    const volumeModifier = effectiveVolume < 10 ? 5 : effectiveVolume > 50 ? -5 : 0;
    baseDC += volumeModifier;

    // Room acoustics
    const acousticModifier = Math.floor((1 - roomAcoustics.acousticProperties.soundClarity) * 5);
    baseDC += acousticModifier;

    // Background noise interference
    const noiseModifier = Math.floor(roomAcoustics.acousticProperties.backgroundNoise / 10);
    baseDC += noiseModifier;

    return Math.max(5, Math.min(30, baseDC));
  }

  static getSoundsAudibleFrom(
    position: { x: number; y: number; floor: number },
    roomId: string,
    buildingAcoustics: BuildingAcoustics,
    listenerRace: keyof SoundSource['perceptionDC']
  ): { sound: SoundSource; dc: number; source: string }[] {
    const audibleSounds: { sound: SoundSource; dc: number; source: string }[] = [];
    const currentRoom = buildingAcoustics.rooms[roomId];
    
    if (!currentRoom) return audibleSounds;

    // Sounds in current room
    currentRoom.soundSources.forEach(sound => {
      const dc = this.calculateSoundPerceptionDC(
        sound, 
        position, 
        listenerRace, 
        currentRoom, 
        1.0
      );
      
      audibleSounds.push({
        sound,
        dc,
        source: `Current room (${currentRoom.roomType})`
      });
    });

    // Sounds from connected rooms
    currentRoom.soundPathways.forEach(pathway => {
      const connectedRoom = buildingAcoustics.rooms[pathway.connectedRoomId];
      if (!connectedRoom) return;

      connectedRoom.soundSources.forEach(sound => {
        const transmittedVolume = sound.volume * pathway.soundTransmission;
        const modifiedSound = { ...sound, volume: transmittedVolume };
        
        const dc = this.calculateSoundPerceptionDC(
          modifiedSound,
          position,
          listenerRace,
          currentRoom,
          1.0
        );

        audibleSounds.push({
          sound: modifiedSound,
          dc: dc + 5, // Harder to identify sounds from other rooms
          source: `Adjacent room (${connectedRoom.roomType}) via ${pathway.pathway}`
        });
      });
    });

    return audibleSounds.sort((a, b) => a.dc - b.dc);
  }

  static generateAmbientSoundDescription(
    roomId: string,
    buildingAcoustics: BuildingAcoustics,
    timeOfDay: string,
    weather: string
  ): string {
    const room = buildingAcoustics.rooms[roomId];
    if (!room) return "The room is eerily quiet.";

    const audibleSounds = room.soundSources.filter(sound => 
      !sound.triggerConditions || 
      !sound.triggerConditions.timeOfDay || 
      sound.triggerConditions.timeOfDay.includes(timeOfDay)
    );

    if (audibleSounds.length === 0) {
      return `The ${room.roomType} is quiet, with only the subtle creaking of the building settling.`;
    }

    const descriptions: string[] = [];
    audibleSounds.forEach(sound => {
      let desc = `You hear ${sound.name.toLowerCase()}`;
      
      if (sound.properties.includes('continuous')) {
        desc += ' providing a steady background";'
      } else if (sound.properties.includes('intermittent')) {
        desc += ' occurring occasionally';
      } else if (sound.properties.includes('rhythmic')) {
        desc += ' with a regular pattern';
      }

      descriptions.push(desc);
    });

    // Add reverb description
    if (room.acousticProperties.reverberationTime > 1.5) {
      descriptions.push("sounds echo noticeably in the space");
    } else if (room.acousticProperties.reverberationTime < 0.5) {
      descriptions.push("sounds seem muffled and absorbed");
    }

    return descriptions.join(", ") + ".";
  }

  // Utility methods
  static getAcousticMaterial(id: string): AcousticMaterial | null {
    return this.acousticMaterials[id] || null;
  }

  static getSoundSource(id: string): Omit<SoundSource, 'id' | 'x' | 'y' | 'floor'> | null {
    return this.soundSources[id] || null;
  }

  static addCustomAcousticMaterial(id: string, material: AcousticMaterial): void {
    this.acousticMaterials[id] = material;
  }

  static addCustomSoundSource(id: string, sound: Omit<SoundSource, 'id' | 'x' | 'y' | 'floor'>): void {
    this.soundSources[id] = sound;
  }
}