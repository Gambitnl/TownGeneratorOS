// Building Security Systems for D&D gameplay
export interface SecurityFeature {
  id: string;
  name: string;
  type: 'lock' | 'trap' | 'guard' | 'ward' | 'alarm' | 'barrier' | 'hidden' | 'magical';
  location: {
    x: number;
    y: number;
    floor: number;
    roomId?: string;
  };
  difficulty: number; // DC for D&D checks (10-25)
  triggerType?: 'pressure' | 'motion' | 'magic' | 'sound' | 'touch';
  effect?: string; // What happens when triggered/bypassed
  value: number; // Cost/value of the security feature
  socialClass: ('poor' | 'common' | 'wealthy' | 'noble')[];
  buildingTypes: string[];
  asset?: {
    path: string;
    variations: string[];
  };
  properties: string[]; // 'obvious', 'hidden', 'magical', 'deadly', 'nonlethal'
}

export interface SecretPassage {
  id: string;
  name: string;
  entranceX: number;
  entranceY: number;
  exitX: number;
  exitY: number;
  floor: number;
  width: number;
  height: number;
  hiddenBy: 'bookshelf' | 'fireplace' | 'wall' | 'trapdoor' | 'painting' | 'magical';
  discoveryDC: number; // Difficulty to find
  accessMethod: string; // How to open (lever, button, magic word, etc.)
  purpose: 'escape' | 'storage' | 'spy' | 'treasure' | 'ritual' | 'connection';
}

export interface GuardPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  floor: number;
  schedule: {
    timeOfDay: string;
    patrolRoute?: { x: number; y: number }[];
    alertness: 'low' | 'medium' | 'high';
  }[];
  guardType: 'servant' | 'guard' | 'elite' | 'magical';
  equipment: string[];
}

export interface BuildingSecurity {
  buildingId: string;
  securityLevel: 'none' | 'basic' | 'moderate' | 'high' | 'fortress';
  features: SecurityFeature[];
  secretPassages: SecretPassage[];
  guardPositions: GuardPosition[];
  totalSecurityValue: number;
  securityWeaknesses: string[]; // Known vulnerabilities
  breakInDifficulty: {
    front: number; // DC to break in through front
    back: number;  // DC to break in through back/side
    window: number; // DC to break in through window
    roof: number;   // DC to break in through roof
  };
}

export class SecuritySystem {
  private static securityFeatures: { [key: string]: SecurityFeature } = {
    'lock_simple': {
      id: 'lock_simple',
      name: 'Simple Lock',
      type: 'lock',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 12,
      effect: 'Prevents door opening without key',
      value: 5,
      socialClass: ['common', 'wealthy', 'noble'],
      buildingTypes: ['house_small', 'house_large', 'shop'],
      asset: { path: 'furniture/security/lock_simple', variations: ['iron', 'brass'] },
      properties: ['obvious', 'basic']
    },

    'lock_complex': {
      id: 'lock_complex',
      name: 'Complex Lock',
      type: 'lock',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 16,
      effect: 'High-security door lock with multiple tumblers',
      value: 25,
      socialClass: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'shop', 'tavern'],
      asset: { path: 'furniture/security/lock_complex', variations: ['masterwork', 'enchanted'] },
      properties: ['obvious', 'quality']
    },

    'trap_poison_needle': {
      id: 'trap_poison_needle',
      name: 'Poison Needle Trap',
      type: 'trap',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 14,
      triggerType: 'touch',
      effect: 'Poison needle in lock, 1d4 poison damage + Con save DC 13',
      value: 50,
      socialClass: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'shop'],
      properties: ['hidden', 'deadly']
    },

    'trap_pit': {
      id: 'trap_pit',
      name: 'Concealed Pit Trap',
      type: 'trap',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 15,
      triggerType: 'pressure',
      effect: '10ft deep pit, 1d6 falling damage, Dex save DC 13 to avoid',
      value: 100,
      socialClass: ['noble'],
      buildingTypes: ['house_large'],
      properties: ['hidden', 'nonlethal']
    },

    'ward_alarm': {
      id: 'ward_alarm',
      name: 'Magical Alarm Ward',
      type: 'ward',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 17,
      triggerType: 'magic',
      effect: 'Silent alarm alerts caster within 1 mile',
      value: 200,
      socialClass: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'shop'],
      properties: ['magical', 'hidden']
    },

    'guard_dog': {
      id: 'guard_dog',
      name: 'Guard Dog',
      type: 'guard',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 13,
      effect: 'Alerts on intruders, Perception +3, bite attack +4 (1d6+2)',
      value: 30,
      socialClass: ['common', 'wealthy'],
      buildingTypes: ['house_small', 'house_large', 'shop'],
      properties: ['obvious', 'loyal']
    },

    'iron_bars': {
      id: 'iron_bars',
      name: 'Iron Window Bars',
      type: 'barrier',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 18,
      effect: 'Prevents entry through windows, DC 18 Strength to bend',
      value: 40,
      socialClass: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'shop', 'blacksmith'],
      asset: { path: 'furniture/security/bars_iron', variations: ['plain', 'decorative'] },
      properties: ['obvious', 'sturdy']
    },

    'secret_compartment': {
      id: 'secret_compartment',
      name: 'Hidden Compartment',
      type: 'hidden',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 16,
      effect: 'Concealed storage space, Investigation DC 16 to find',
      value: 75,
      socialClass: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'shop'],
      properties: ['hidden', 'storage']
    },

    'magical_glyph': {
      id: 'magical_glyph',
      name: 'Glyph of Warding',
      type: 'magical',
      location: { x: 0, y: 0, floor: 0 },
      difficulty: 19,
      triggerType: 'motion',
      effect: 'Explosive runes, 3d8 thunder damage, Dex save DC 16',
      value: 500,
      socialClass: ['noble'],
      buildingTypes: ['house_large'],
      properties: ['magical', 'hidden', 'deadly']
    }
  };

  static generateBuildingSecurity(
    buildingId: string,
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    buildingValue: number,
    seed: number
  ): BuildingSecurity {
    const securityLevel = this.determineSecurityLevel(buildingType, socialClass, buildingValue);
    const features = this.generateSecurityFeatures(buildingType, socialClass, rooms, securityLevel, seed);
    const secretPassages = this.generateSecretPassages(buildingType, socialClass, rooms, seed);
    const guardPositions = this.generateGuardPositions(buildingType, socialClass, rooms, seed);
    
    const totalValue = features.reduce((sum, f) => sum + f.value, 0) +
                      secretPassages.length * 100 +
                      guardPositions.length * 200;

    return {
      buildingId,
      securityLevel,
      features,
      secretPassages,
      guardPositions,
      totalSecurityValue: totalValue,
      securityWeaknesses: this.identifyWeaknesses(features, secretPassages, guardPositions),
      breakInDifficulty: this.calculateBreakInDifficulty(features, securityLevel)
    };
  }

  private static determineSecurityLevel(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    buildingValue: number
  ): BuildingSecurity['securityLevel'] {
    const baseSecurity = {
      'house_small': 'basic',
      'house_large': 'moderate',
      'tavern': 'basic',
      'blacksmith': 'moderate',
      'shop': 'moderate',
      'market_stall': 'none'
    }[buildingType] || 'basic';

    const classModifier = {
      poor: -1,
      common: 0,
      wealthy: 1,
      noble: 2
    }[socialClass];

    const levels = ['none', 'basic', 'moderate', 'high', 'fortress'];
    const baseIndex = levels.indexOf(baseSecurity as any);
    const finalIndex = Math.max(0, Math.min(levels.length - 1, baseIndex + classModifier));
    
    return levels[finalIndex] as BuildingSecurity['securityLevel'];
  }

  private static generateSecurityFeatures(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    securityLevel: string,
    seed: number
  ): SecurityFeature[] {
    const features: SecurityFeature[] = [];
    const availableFeatures = Object.values(this.securityFeatures).filter(f =>
      f.socialClass.includes(socialClass) &&
      f.buildingTypes.includes(buildingType)
    );

    const featureCount = {
      'none': 0,
      'basic': 1,
      'moderate': 3,
      'high': 5,
      'fortress': 8
    }[securityLevel] || 1;

    // Add basic locks to most buildings
    if (securityLevel !== 'none') {
      const lockType = socialClass === 'poor' ? 'lock_simple' : 
                      (socialClass === 'wealthy' || socialClass === 'noble') ? 'lock_complex' : 'lock_simple';
      const lock = this.securityFeatures[lockType];
      if (lock) {
        features.push({
          ...lock,
          id: `${buildingType}_main_door_lock`,
          location: { x: 0, y: 0, floor: 0, roomId: 'entrance' }
        });
      }
    }

    // Add additional security features based on security level
    for (let i = features.length; i < featureCount && i < availableFeatures.length; i++) {
      const feature = availableFeatures[this.seedRandom(seed + i) * availableFeatures.length | 0];
      features.push({
        ...feature,
        id: `${buildingType}_security_${i}`,
        location: { 
          x: this.seedRandom(seed + i + 100) * 10 | 0, 
          y: this.seedRandom(seed + i + 200) * 10 | 0, 
          floor: 0 
        }
      });
    }

    return features;
  }

  private static generateSecretPassages(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    seed: number
  ): SecretPassage[] {
    const passages: SecretPassage[] = [];
    
    // Only wealthy and noble buildings get secret passages
    if (socialClass === 'poor' || socialClass === 'common') {
      return passages;
    }

    const passageChance = socialClass === 'wealthy' ? 0.3 : 0.6;
    if (this.seedRandom(seed) < passageChance) {
      passages.push({
        id: `${buildingType}_secret_passage_1`,
        name: 'Hidden Escape Route',
        entranceX: 2,
        entranceY: 2,
        exitX: 8,
        exitY: 8,
        floor: 0,
        width: 1,
        height: 6,
        hiddenBy: 'bookshelf',
        discoveryDC: socialClass === 'wealthy' ? 15 : 18,
        accessMethod: 'Pull specific book to activate mechanism',
        purpose: 'escape'
      });
    }

    return passages;
  }

  private static generateGuardPositions(
    buildingType: string,
    socialClass: 'poor' | 'common' | 'wealthy' | 'noble',
    rooms: any[],
    seed: number
  ): GuardPosition[] {
    const positions: GuardPosition[] = [];
    
    // Only wealthy and noble buildings have guards
    if (socialClass === 'poor' || socialClass === 'common') {
      return positions;
    }

    if (buildingType === 'house_large' && socialClass === 'noble') {
      positions.push({
        id: `${buildingType}_guard_entrance`,
        name: 'Door Guard',
        x: 0,
        y: 0,
        floor: 0,
        schedule: [
          {
            timeOfDay: 'day',
            alertness: 'medium'
          },
          {
            timeOfDay: 'night',
            patrolRoute: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 0 }],
            alertness: 'high'
          }
        ],
        guardType: socialClass === 'noble' ? 'elite' : 'guard',
        equipment: ['sword', 'chainmail', 'shield']
      });
    }

    return positions;
  }

  private static identifyWeaknesses(
    features: SecurityFeature[],
    secretPassages: SecretPassage[],
    guardPositions: GuardPosition[]
  ): string[] {
    const weaknesses: string[] = [];
    
    const hasLocks = features.some(f => f.type === 'lock');
    const hasTraps = features.some(f => f.type === 'trap');
    const hasGuards = guardPositions.length > 0;
    const hasAlarms = features.some(f => f.type === 'alarm' || f.type === 'ward');

    if (!hasLocks) weaknesses.push('No door locks - easy entry');
    if (!hasTraps) weaknesses.push('No traps - safe to move around');
    if (!hasGuards) weaknesses.push('No guards - no active defense');
    if (!hasAlarms) weaknesses.push('No alarms - intruders undetected');
    if (secretPassages.length > 0) weaknesses.push('Secret passages may be discoverable');

    return weaknesses;
  }

  private static calculateBreakInDifficulty(
    features: SecurityFeature[],
    securityLevel: string
  ): BuildingSecurity['breakInDifficulty'] {
    const baseDC = {
      'none': 8,
      'basic': 12,
      'moderate': 15,
      'high': 18,
      'fortress': 22
    }[securityLevel] || 12;

    const lockBonus = features.filter(f => f.type === 'lock').length * 2;
    const trapBonus = features.filter(f => f.type === 'trap').length * 1;
    const wardBonus = features.filter(f => f.type === 'ward').length * 3;

    return {
      front: baseDC + lockBonus + trapBonus + wardBonus,
      back: baseDC + Math.floor((lockBonus + trapBonus + wardBonus) * 0.7),
      window: baseDC + Math.floor((lockBonus + trapBonus + wardBonus) * 0.5),
      roof: baseDC + Math.floor((lockBonus + trapBonus + wardBonus) * 0.3)
    };
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  static getSecurityFeature(id: string): SecurityFeature | null {
    return this.securityFeatures[id] || null;
  }

  static addCustomSecurityFeature(id: string, feature: SecurityFeature): void {
    this.securityFeatures[id] = feature;
  }

  static getAllSecurityFeatures(): { [key: string]: SecurityFeature } {
    return { ...this.securityFeatures };
  }
}