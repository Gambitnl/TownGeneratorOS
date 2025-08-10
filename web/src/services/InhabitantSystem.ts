// NPC Inhabitant Personality & Routine Systems
export interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  effects: {
    roomUsage: { [roomType: string]: number }; // 0-2 multiplier for room usage
    activityPreference: string[]; // Preferred activities
    socialInteraction: number; // -1 to 1, negative = antisocial, positive = social
    cleanliness: number; // 0-1, affects room condition
    securityParanoia: number; // 0-1, affects security feature usage
    wealthDisplay: number; // 0-1, affects decoration/furniture choices
  };
}

export interface DailyActivity {
  id: string;
  name: string;
  description: string;
  timeSlot: 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'late_night';
  duration: number; // Hours
  roomRequired: string;
  items: string[]; // Items used during activity
  skillCheck?: {
    skill: string;
    dc: number;
    consequence: string;
  };
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  profession?: string[];
}

export interface Inhabitant {
  id: string;
  name: string;
  race: 'human' | 'elf' | 'dwarf' | 'halfling' | 'gnome' | 'tiefling' | 'dragonborn';
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  profession: string;
  socialClass: 'poor' | 'common' | 'wealthy' | 'noble';
  personalityTraits: PersonalityTrait[];
  primaryStats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  relationships: {
    inhabitantId: string;
    relationship: 'family' | 'friend' | 'enemy' | 'lover' | 'business' | 'servant' | 'master';
    strength: number; // -10 to 10
  }[];
  dailyRoutine: DailyActivity[];
  homeRoom: string; // Primary bedroom/living space
  workSpace?: string; // Workshop, office, etc.
  secrets: string[]; // Hidden information about the inhabitant
  possessions: string[]; // Important items they own/carry
  goals: string[]; // Long-term objectives
  fears: string[]; // Things they're afraid of
  quirks: string[]; // Unusual behaviors
}

export interface RoomUsagePattern {
  roomId: string;
  roomType: string;
  inhabitants: {
    id: string;
    timeSpent: number; // Hours per day
    preferredActivities: string[];
    roomModifications: string[]; // How they've customized the room
  }[];
  conflictAreas: {
    time: string;
    inhabitants: string[];
    issue: string;
    resolution?: string;
  }[];
}

export interface BuildingInhabitants {
  buildingId: string;
  inhabitants: Inhabitant[];
  relationships: {
    inhabitant1: string;
    inhabitant2: string;
    relationship: string;
    publicKnowledge: boolean;
    roomInteractions: string[];
  }[];
  roomUsage: { [roomId: string]: RoomUsagePattern };
  socialDynamics: {
    hierarchy: string[]; // Inhabitant IDs in order of social power
    alliances: string[][];
    conflicts: {
      parties: string[];
      issue: string;
      intensity: 'minor' | 'moderate' | 'major' | 'violent';
    }[];
  };
  dailySchedule: {
    [timeSlot: string]: {
      inhabitantId: string;
      activity: string;
      roomId: string;
    }[];
  };
}

export class InhabitantSystem {
  private static personalityTraits: { [key: string]: PersonalityTrait } = {
    'neat_freak': {
      id: 'neat_freak',
      name: 'Neat Freak',
      description: 'Obsessively cleans and organizes everything',
      effects: {
        roomUsage: { 'storage': 2.0, 'kitchen': 1.5, 'common': 1.3 },
        activityPreference: ['cleaning', 'organizing', 'maintenance'],
        socialInteraction: -0.3,
        cleanliness: 1.0,
        securityParanoia: 0.4,
        wealthDisplay: 0.6
      }
    },

    'social_butterfly': {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Loves entertaining guests and social gatherings',
      effects: {
        roomUsage: { 'common': 2.0, 'kitchen': 1.5, 'entrance': 1.3 },
        activityPreference: ['entertaining', 'cooking', 'conversation'],
        socialInteraction: 1.0,
        cleanliness: 0.7,
        securityParanoia: -0.2,
        wealthDisplay: 0.8
      }
    },

    'paranoid': {
      id: 'paranoid',
      name: 'Paranoid',
      description: 'Constantly worried about security and threats',
      effects: {
        roomUsage: { 'bedroom': 1.8, 'storage': 1.4, 'study': 1.2 },
        activityPreference: ['watching', 'planning', 'securing'],
        socialInteraction: -0.7,
        cleanliness: 0.6,
        securityParanoia: 1.0,
        wealthDisplay: 0.2
      }
    },

    'scholarly': {
      id: 'scholarly',
      name: 'Scholarly',
      description: 'Devoted to learning and intellectual pursuits',
      effects: {
        roomUsage: { 'study': 2.5, 'library': 2.0, 'bedroom': 0.8 },
        activityPreference: ['reading', 'writing', 'researching'],
        socialInteraction: -0.1,
        cleanliness: 0.5,
        securityParanoia: 0.3,
        wealthDisplay: 0.4
      }
    },

    'hedonistic': {
      id: 'hedonistic',
      name: 'Hedonistic',
      description: 'Seeks pleasure and comfort above all else',
      effects: {
        roomUsage: { 'bedroom': 1.6, 'common': 1.4, 'cellar': 1.3 },
        activityPreference: ['relaxing', 'drinking', 'eating'],
        socialInteraction: 0.3,
        cleanliness: 0.3,
        securityParanoia: 0.1,
        wealthDisplay: 1.0
      }
    },

    'workaholic': {
      id: 'workaholic',
      name: 'Workaholic',
      description: 'Constantly working and focused on productivity',
      effects: {
        roomUsage: { 'workshop': 2.5, 'study': 2.0, 'storage': 1.5 },
        activityPreference: ['crafting', 'planning', 'organizing'],
        socialInteraction: -0.4,
        cleanliness: 0.6,
        securityParanoia: 0.5,
        wealthDisplay: 0.5
      }
    },

    'secretive': {
      id: 'secretive',
      name: 'Secretive',
      description: 'Keeps many secrets and values privacy highly',
      effects: {
        roomUsage: { 'bedroom': 1.8, 'study': 1.6, 'cellar': 1.4 },
        activityPreference: ['hiding', 'planning', 'scheming'],
        socialInteraction: -0.5,
        cleanliness: 0.7,
        securityParanoia: 0.8,
        wealthDisplay: 0.3
      }
    }
  };

  private static dailyActivities: { [key: string]: DailyActivity } = {
    'wake_up': {
      id: 'wake_up',
      name: 'Wake Up',
      description: 'Getting up and preparing for the day',
      timeSlot: 'early_morning',
      duration: 1,
      roomRequired: 'bedroom',
      items: ['clothes', 'wash_basin'],
      socialClass: ['poor', 'common', 'wealthy', 'noble']
    },

    'prepare_breakfast': {
      id: 'prepare_breakfast',
      name: 'Prepare Breakfast',
      description: 'Cooking the morning meal',
      timeSlot: 'morning',
      duration: 1,
      roomRequired: 'kitchen',
      items: ['cookware', 'ingredients', 'fire'],
      skillCheck: { skill: 'cooking', dc: 12, consequence: 'burnt food, -1 to mood' },
      socialClass: ['poor', 'common', 'wealthy', 'noble']
    },

    'work_crafting': {
      id: 'work_crafting',
      name: 'Craft Items',
      description: 'Working on professional crafting',
      timeSlot: 'morning',
      duration: 4,
      roomRequired: 'workshop',
      items: ['tools', 'materials'],
      skillCheck: { skill: 'crafting', dc: 15, consequence: 'quality affects income' },
      socialClass: ['poor', 'common', 'wealthy'],
      profession: ['blacksmith', 'carpenter', 'tailor']
    },

    'study_books': {
      id: 'study_books',
      name: 'Study Ancient Texts',
      description: 'Reading and researching scholarly works',
      timeSlot: 'afternoon',
      duration: 3,
      roomRequired: 'study',
      items: ['books', 'writing_materials', 'candles'],
      skillCheck: { skill: 'investigation', dc: 14, consequence: 'gain knowledge or suffer eyestrain' },
      socialClass: ['wealthy', 'noble'],
      profession: ['scholar', 'wizard', 'cleric']
    },

    'entertain_guests': {
      id: 'entertain_guests',
      name: 'Entertain Guests',
      description: 'Hosting visitors in the common room',
      timeSlot: 'evening',
      duration: 2,
      roomRequired: 'common',
      items: ['wine', 'food', 'games'],
      skillCheck: { skill: 'persuasion', dc: 13, consequence: 'reputation change' },
      socialClass: ['wealthy', 'noble']
    },

    'maintenance_work': {
      id: 'maintenance_work',
      name: 'Building Maintenance',
      description: 'Repairing and maintaining the building',
      timeSlot: 'afternoon',
      duration: 2,
      roomRequired: 'storage',
      items: ['tools', 'materials'],
      skillCheck: { skill: 'carpenter_tools', dc: 12, consequence: 'building condition change' },
      socialClass: ['poor', 'common', 'wealthy']
    },

    'secret_meeting': {
      id: 'secret_meeting',
      name: 'Secret Meeting',
      description: 'Clandestine discussion with contacts',
      timeSlot: 'night',
      duration: 1,
      roomRequired: 'cellar',
      items: ['hooded_cloak', 'coded_messages'],
      skillCheck: { skill: 'stealth', dc: 16, consequence: 'discovery risk' },
      socialClass: ['common', 'wealthy', 'noble']
    },

    'prayer_meditation': {
      id: 'prayer_meditation',
      name: 'Prayer & Meditation',
      description: 'Spiritual contemplation and worship',
      timeSlot: 'early_morning',
      duration: 1,
      roomRequired: 'bedroom',
      items: ['holy_symbol', 'prayer_book'],
      socialClass: ['poor', 'common', 'wealthy', 'noble'],
      profession: ['cleric', 'paladin']
    }
  };

  static generateBuildingInhabitants(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    seed: number
  ): BuildingInhabitants {
    const inhabitants = this.generateInhabitants(buildingType, socialClass, rooms, seed);
    const relationships = this.generateRelationships(inhabitants, seed);
    const roomUsage = this.generateRoomUsage(rooms, inhabitants, seed);
    const socialDynamics = this.generateSocialDynamics(inhabitants, relationships, seed);
    const dailySchedule = this.generateDailySchedule(inhabitants, rooms, seed);

    return {
      buildingId,
      inhabitants,
      relationships,
      roomUsage,
      socialDynamics,
      dailySchedule
    };
  }

  private static generateInhabitants(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    seed: number
  ): Inhabitant[] {
    const inhabitants: Inhabitant[] = [];
    
    // Determine number of inhabitants based on building type and social class
    const inhabitantCount = {
      'house_small': 1,
      'house_large': socialClass === 'noble' ? 4 : socialClass === 'wealthy' ? 3 : 2,
      'tavern': 3, // Owner + staff
      'blacksmith': 2, // Master + apprentice
      'shop': 2, // Owner + family/helper
      'market_stall': 1
    }[buildingType] || 1;

    const races = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'tiefling', 'dragonborn'];
    const professions = {
      'blacksmith': ['blacksmith', 'apprentice_smith'],
      'shop': ['merchant', 'shopkeeper'],
      'tavern': ['innkeeper', 'barmaid', 'cook'],
      'house_small': ['farmer', 'laborer', 'artisan'],
      'house_large': ['noble', 'merchant', 'official', 'servant']
    };

    for (let i = 0; i < inhabitantCount; i++) {
      const availableTraits = Object.keys(this.personalityTraits);
      const selectedTraits = [];
      
      // Select 2-3 personality traits
      const traitCount = 2 + Math.floor(this.seedRandom(seed + i + 100) * 2);
      for (let t = 0; t < traitCount; t++) {
        const traitId = availableTraits[Math.floor(this.seedRandom(seed + i + t + 200) * availableTraits.length)];
        if (!selectedTraits.some(trait => trait.id === traitId)) {
          selectedTraits.push(this.personalityTraits[traitId]);
        }
      }

      const profession = professions[buildingType] ? 
        professions[buildingType][Math.floor(this.seedRandom(seed + i + 50) * professions[buildingType].length)] :
        'commoner';

      inhabitants.push({
        id: `${buildingType}_inhabitant_${i}`,
        name: this.generateName(seed + i + 300),
        race: races[Math.floor(this.seedRandom(seed + i + 400) * races.length)] as Inhabitant['race'],
        age: 18 + Math.floor(this.seedRandom(seed + i + 500) * 50),
        gender: this.seedRandom(seed + i + 600) < 0.5 ? 'male' : 'female',
        profession,
        socialClass,
        personalityTraits: selectedTraits,
        primaryStats: this.generateStats(profession, seed + i + 700),
        relationships: [], // Will be filled in generateRelationships
        dailyRoutine: this.generateDailyRoutine(profession, socialClass, selectedTraits, seed + i + 800),
        homeRoom: this.findAppropriateRoom(rooms, 'bedroom', i),
        workSpace: this.findAppropriateRoom(rooms, 'workshop', i) || this.findAppropriateRoom(rooms, 'shop', i),
        secrets: this.generateSecrets(profession, socialClass, seed + i + 900),
        possessions: this.generatePossessions(profession, socialClass, seed + i + 1000),
        goals: this.generateGoals(profession, socialClass, seed + i + 1100),
        fears: this.generateFears(selectedTraits, seed + i + 1200),
        quirks: this.generateQuirks(selectedTraits, seed + i + 1300)
      });
    }

    return inhabitants;
  }

  private static generateRelationships(inhabitants: Inhabitant[], seed: number): BuildingInhabitants['relationships'] {
    const relationships: BuildingInhabitants['relationships'] = [];
    
    for (let i = 0; i < inhabitants.length; i++) {
      for (let j = i + 1; j < inhabitants.length; j++) {
        const inhabitant1 = inhabitants[i];
        const inhabitant2 = inhabitants[j];
        
        // Determine relationship type and strength
        let relationshipType = 'acquaintance';
        let publicKnowledge = true;
        
        // Family relationships (same social class, age differences)
        if (inhabitant1.socialClass === inhabitant2.socialClass && 
            Math.abs(inhabitant1.age - inhabitant2.age) > 15) {
          relationshipType = 'family';
        }
        // Professional relationships
        else if (inhabitant1.profession === inhabitant2.profession) {
          relationshipType = 'business';
        }
        // Social compatibility based on personality traits
        else {
          const compatibility = this.calculateCompatibility(inhabitant1, inhabitant2);
          if (compatibility > 0.6) relationshipType = 'friend';
          else if (compatibility < -0.3) relationshipType = 'enemy';
          
          // Secret relationships
          if (this.seedRandom(seed + i + j) < 0.1) {
            relationshipType = 'lover';
            publicKnowledge = false;
          }
        }

        relationships.push({
          inhabitant1: inhabitant1.id,
          inhabitant2: inhabitant2.id,
          relationship: relationshipType,
          publicKnowledge,
          roomInteractions: this.determineRoomInteractions(inhabitant1, inhabitant2, relationshipType)
        });
      }
    }

    return relationships;
  }

  private static generateRoomUsage(
    rooms: any[], 
    inhabitants: Inhabitant[], 
    seed: number
  ): { [roomId: string]: RoomUsagePattern } {
    const roomUsage: { [roomId: string]: RoomUsagePattern } = {};

    rooms.forEach(room => {
      const pattern: RoomUsagePattern = {
        roomId: room.id,
        roomType: room.type,
        inhabitants: [],
        conflictAreas: []
      };

      inhabitants.forEach(inhabitant => {
        const baseUsage = this.calculateRoomUsage(inhabitant, room.type);
        const activities = this.getRoomActivities(inhabitant, room.type);
        const modifications = this.getRoomModifications(inhabitant, room.type);

        pattern.inhabitants.push({
          id: inhabitant.id,
          timeSpent: baseUsage,
          preferredActivities: activities,
          roomModifications: modifications
        });
      });

      // Identify potential conflicts
      this.identifyRoomConflicts(pattern, seed);
      roomUsage[room.id] = pattern;
    });

    return roomUsage;
  }

  private static generateSocialDynamics(
    inhabitants: Inhabitant[],
    relationships: BuildingInhabitants['relationships'],
    seed: number
  ): BuildingInhabitants['socialDynamics'] {
    // Create social hierarchy based on class, profession, and charisma
    const hierarchy = inhabitants
      .sort((a, b) => {
        const classOrder = { noble: 4, wealthy: 3, common: 2, poor: 1 };
        const classA = classOrder[a.socialClass];
        const classB = classOrder[b.socialClass];
        if (classA !== classB) return classB - classA;
        return b.primaryStats.charisma - a.primaryStats.charisma;
      })
      .map(i => i.id);

    // Form alliances based on compatible relationships
    const alliances: string[][] = [];
    const friendRelations = relationships.filter(r => r.relationship === 'friend' || r.relationship === 'family');
    
    friendRelations.forEach(rel => {
      let foundAlliance = false;
      for (const alliance of alliances) {
        if (alliance.includes(rel.inhabitant1) || alliance.includes(rel.inhabitant2)) {
          if (!alliance.includes(rel.inhabitant1)) alliance.push(rel.inhabitant1);
          if (!alliance.includes(rel.inhabitant2)) alliance.push(rel.inhabitant2);
          foundAlliance = true;
          break;
        }
      }
      if (!foundAlliance) {
        alliances.push([rel.inhabitant1, rel.inhabitant2]);
      }
    });

    // Identify conflicts
    const conflicts = relationships
      .filter(r => r.relationship === 'enemy')
      .map(r => ({
        parties: [r.inhabitant1, r.inhabitant2],
        issue: this.generateConflictIssue(seed + r.inhabitant1.charCodeAt(0)),
        intensity: 'moderate' as const
      }));

    return {
      hierarchy,
      alliances,
      conflicts
    };
  }

  private static generateDailySchedule(
    inhabitants: Inhabitant[],
    rooms: any[],
    seed: number
  ): BuildingInhabitants['dailySchedule'] {
    const timeSlots = ['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night', 'late_night'];
    const schedule: { [timeSlot: string]: { inhabitantId: string; activity: string; roomId: string }[] } = {};

    timeSlots.forEach(slot => {
      schedule[slot] = [];
      
      inhabitants.forEach(inhabitant => {
        const activities = inhabitant.dailyRoutine.filter(activity => activity.timeSlot === slot);
        if (activities.length > 0) {
          const activity = activities[Math.floor(this.seedRandom(seed + inhabitant.id.charCodeAt(0) + slot.charCodeAt(0)) * activities.length)];
          const roomId = this.findAppropriateRoomForActivity(rooms, activity.roomRequired);
          
          schedule[slot].push({
            inhabitantId: inhabitant.id,
            activity: activity.name,
            roomId: roomId || rooms[0].id
          });
        }
      });
    });

    return schedule;
  }

  // Helper methods
  private static generateName(seed: number): string {
    const firstNames = ['Aerin', 'Bram', 'Cara', 'Daven', 'Elara', 'Finn', 'Gwen', 'Hazel', 'Ivan', 'Jora'];
    const lastNames = ['Blackwood', 'Silverstone', 'Goldsmith', 'Ironforge', 'Swiftriver', 'Thornfield'];
    
    const firstName = firstNames[Math.floor(this.seedRandom(seed) * firstNames.length)];
    const lastName = lastNames[Math.floor(this.seedRandom(seed + 100) * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  private static generateStats(profession: string, seed: number): Inhabitant['primaryStats'] {
    const baseStat = () => 8 + Math.floor(this.seedRandom(seed++) * 8);
    const professionBonuses = {
      blacksmith: { strength: 2, constitution: 1 },
      scholar: { intelligence: 2, wisdom: 1 },
      merchant: { charisma: 2, intelligence: 1 },
      noble: { charisma: 1, intelligence: 1, wisdom: 1 }
    };

    const stats = {
      strength: baseStat(),
      dexterity: baseStat(),
      constitution: baseStat(),
      intelligence: baseStat(),
      wisdom: baseStat(),
      charisma: baseStat()
    };

    const bonuses = professionBonuses[profession] || {};
    Object.entries(bonuses).forEach(([stat, bonus]) => {
      stats[stat] += bonus;
    });

    return stats;
  }

  private static generateDailyRoutine(
    profession: string, 
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    traits: PersonalityTrait[],
    seed: number
  ): DailyActivity[] {
    const routine: DailyActivity[] = [];
    const availableActivities = Object.values(this.dailyActivities).filter(activity =>
      activity.socialClass.includes(socialClass) &&
      (!activity.profession || activity.profession.includes(profession))
    );

    // Add trait-influenced activities
    traits.forEach(trait => {
      trait.effects.activityPreference.forEach(preference => {
        const matchingActivity = availableActivities.find(act => 
          act.description.toLowerCase().includes(preference.toLowerCase())
        );
        if (matchingActivity && !routine.some(r => r.id === matchingActivity.id)) {
          routine.push({ ...matchingActivity });
        }
      });
    });

    // Fill remaining time slots with appropriate activities
    const timeSlots = ['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'];
    timeSlots.forEach(slot => {
      if (!routine.some(r => r.timeSlot === slot)) {
        const slotActivities = availableActivities.filter(act => act.timeSlot === slot);
        if (slotActivities.length > 0) {
          const activity = slotActivities[Math.floor(this.seedRandom(seed + slot.charCodeAt(0)) * slotActivities.length)];
          routine.push({ ...activity });
        }
      }
    });

    return routine;
  }

  private static calculateCompatibility(inhabitant1: Inhabitant, inhabitant2: Inhabitant): number {
    let compatibility = 0;
    
    // Social interaction preferences
    const social1 = inhabitant1.personalityTraits.reduce((sum, trait) => sum + trait.effects.socialInteraction, 0) / inhabitant1.personalityTraits.length;
    const social2 = inhabitant2.personalityTraits.reduce((sum, trait) => sum + trait.effects.socialInteraction, 0) / inhabitant2.personalityTraits.length;
    
    // Similar social preferences increase compatibility
    compatibility += 1 - Math.abs(social1 - social2);
    
    // Complementary traits (neat freak + messy can work)
    const cleanliness1 = inhabitant1.personalityTraits.reduce((sum, trait) => sum + trait.effects.cleanliness, 0) / inhabitant1.personalityTraits.length;
    const cleanliness2 = inhabitant2.personalityTraits.reduce((sum, trait) => sum + trait.effects.cleanliness, 0) / inhabitant2.personalityTraits.length;
    
    if (Math.abs(cleanliness1 - cleanliness2) > 0.5) compatibility -= 0.3; // Conflict over cleanliness
    
    return compatibility;
  }

  private static calculateRoomUsage(inhabitant: Inhabitant, roomType: string): number {
    let baseUsage = 2; // 2 hours per day base
    
    inhabitant.personalityTraits.forEach(trait => {
      const multiplier = trait.effects.roomUsage[roomType] || 1.0;
      baseUsage *= multiplier;
    });

    // Personal room gets more usage
    if (roomType === 'bedroom' && inhabitant.homeRoom.includes(roomType)) {
      baseUsage *= 1.5;
    }

    return Math.min(12, baseUsage); // Max 12 hours per day
  }

  private static getRoomActivities(inhabitant: Inhabitant, roomType: string): string[] {
    const activities: string[] = [];
    
    inhabitant.personalityTraits.forEach(trait => {
      activities.push(...trait.effects.activityPreference);
    });

    // Add profession-specific activities
    const professionActivities = {
      blacksmith: ['forging', 'sharpening', 'metalwork'],
      scholar: ['reading', 'writing', 'research'],
      merchant: ['accounting', 'negotiating', 'inventory']
    };

    const profActivities = professionActivities[inhabitant.profession];
    if (profActivities) {
      activities.push(...profActivities);
    }

    return [...new Set(activities)]; // Remove duplicates
  }

  private static getRoomModifications(inhabitant: Inhabitant, roomType: string): string[] {
    const modifications: string[] = [];
    
    inhabitant.personalityTraits.forEach(trait => {
      if (trait.id === 'neat_freak') {
        modifications.push('Extra storage containers', 'Cleaning supplies', 'Organization labels');
      } else if (trait.id === 'scholarly') {
        modifications.push('Additional bookshelves', 'Writing desk', 'Reading chair');
      } else if (trait.id === 'paranoid') {
        modifications.push('Extra locks', 'Hidden compartments', 'Peepholes');
      }
    });

    return modifications;
  }

  private static identifyRoomConflicts(pattern: RoomUsagePattern, seed: number): void {
    // Find inhabitants who use the room heavily at the same time
    const heavyUsers = pattern.inhabitants.filter(i => i.timeSpent > 4);
    
    if (heavyUsers.length > 1) {
      pattern.conflictAreas.push({
        time: 'peak_hours',
        inhabitants: heavyUsers.map(u => u.id),
        issue: 'Room overcrowding during peak usage',
        resolution: 'Staggered schedules or additional room usage'
      });
    }
  }

  private static generateSecrets(profession: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble', seed: number): string[] {
    const secrets = [
      'Owes significant debt to local merchant',
      'Has been selling information to competitors',
      'Secretly practices forbidden magic',
      'Is having an affair with neighbor',
      'Stole valuable item years ago, still hidden',
      'Is actually of higher/lower birth than claimed',
      'Knows location of hidden treasure',
      'Has been embezzling from employer',
      'Is secretly ill with rare disease',
      'Witnessed a crime but never reported it'
    ];

    const secretCount = socialClass === 'noble' ? 2 : 1;
    return secrets.slice(0, secretCount).map((secret, i) => 
      secret.replace(/years ago/, `${5 + Math.floor(this.seedRandom(seed + i) * 10)} years ago`)
    );
  }

  private static generatePossessions(profession: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble', seed: number): string[] {
    const basePossessions = ['clothes', 'personal effects'];
    const professionItems = {
      blacksmith: ['masterwork hammer', 'family anvil'],
      scholar: ['rare books', 'magical components'],
      merchant: ['ledger books', 'exotic goods']
    };
    
    const socialItems = {
      noble: ['family heirloom', 'signet ring', 'valuable jewelry'],
      wealthy: ['fine clothing', 'quality tools'],
      common: ['practical tools'],
      poor: ['worn possessions']
    };

    return [
      ...basePossessions,
      ...(professionItems[profession] || []),
      ...(socialItems[socialClass] || [])
    ];
  }

  private static generateGoals(profession: string, socialClass: 'poor' | 'common' | 'wealthy' | 'noble', seed: number): string[] {
    const goals = [
      'Improve social standing',
      'Master their profession',
      'Find true love',
      'Accumulate wealth',
      'Gain political influence',
      'Seek revenge on old enemy',
      'Discover family secrets',
      'Travel to distant lands'
    ];

    return goals.slice(0, 2);
  }

  private static generateFears(traits: PersonalityTrait[], seed: number): string[] {
    const fears = [
      'Being discovered',
      'Losing social status',
      'Financial ruin',
      'Physical violence',
      'Magical creatures',
      'Death of loved ones',
      'Public embarrassment'
    ];

    return fears.slice(0, 1 + traits.length);
  }

  private static generateQuirks(traits: PersonalityTrait[], seed: number): string[] {
    const quirks = [
      'Always counts coins twice',
      'Talks to themselves when working',
      'Never sits with back to door',
      'Collects unusual objects',
      'Hums while working',
      'Always wears particular item',
      'Has specific daily ritual'
    ];

    return quirks.slice(0, Math.min(2, traits.length));
  }

  private static findAppropriateRoom(rooms: any[], roomType: string, index: number): string {
    const matchingRooms = rooms.filter(room => room.type === roomType);
    if (matchingRooms.length > 0) {
      return matchingRooms[index % matchingRooms.length].id;
    }
    return rooms[0]?.id || 'unknown_room';
  }

  private static findAppropriateRoomForActivity(rooms: any[], requiredType: string): string | null {
    const room = rooms.find(r => r.type === requiredType);
    return room ? room.id : null;
  }

  private static determineRoomInteractions(inhabitant1: Inhabitant, inhabitant2: Inhabitant, relationshipType: string): string[] {
    const interactions = [];
    
    if (relationshipType === 'family') {
      interactions.push('kitchen', 'common');
    } else if (relationshipType === 'business') {
      interactions.push('workshop', 'study');
    } else if (relationshipType === 'lover') {
      interactions.push('bedroom', 'garden');
    } else if (relationshipType === 'friend') {
      interactions.push('common');
    }

    return interactions;
  }

  private static generateConflictIssue(seed: number): string {
    const issues = [
      'Disagreement over room usage',
      'Professional jealousy',
      'Romantic rivalry',
      'Financial dispute',
      'Personality clash',
      'Different cleanliness standards',
      'Noise complaints'
    ];

    return issues[Math.floor(this.seedRandom(seed) * issues.length)];
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Public methods
  static getPersonalityTrait(id: string): PersonalityTrait | null {
    return this.personalityTraits[id] || null;
  }

  static addCustomPersonalityTrait(id: string, trait: PersonalityTrait): void {
    this.personalityTraits[id] = trait;
  }

  static getDailyActivity(id: string): DailyActivity | null {
    return this.dailyActivities[id] || null;
  }

  static addCustomDailyActivity(id: string, activity: DailyActivity): void {
    this.dailyActivities[id] = activity;
  }
}