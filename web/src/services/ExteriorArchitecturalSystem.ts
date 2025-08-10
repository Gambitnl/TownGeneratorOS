import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { FloorFootprint } from './StructuralEngine';
import { Room } from './ProceduralBuildingGenerator';

export interface ExteriorElement {
  id: string;
  type: 'chimney' | 'entrance' | 'roof_structure' | 'buttress' | 'tower' | 'bay_window' | 'balcony' | 'dormer';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floorLevel: number;
  materials: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  functionality: string[];
  socialClassRequirement: SocialClass[];
  buildingTypes: BuildingType[];
  priority: number;
  structural: boolean; // affects building stability
  weatherProtection: number; // 0-100, how much weather protection it provides
}

export interface RoofStructure {
  id: string;
  type: 'gable' | 'hip' | 'shed' | 'gambrel' | 'mansard' | 'tower_cone';
  pitch: number; // roof angle in degrees
  material: string;
  covers: Array<{ x: number; y: number; width: number; height: number }>; // areas covered
  drainagePoints: Array<{ x: number; y: number; type: 'gutter' | 'downspout' }>;
  supportRequirements: {
    loadBearingWalls: boolean;
    additionalSupports: boolean;
  };
}

export interface Chimney {
  id: string;
  x: number;
  y: number;
  height: number;
  material: string;
  servedRooms: string[];
  flue: {
    diameter: number;
    material: string;
  };
  cap: {
    style: 'simple' | 'decorative' | 'functional';
    material: string;
  };
}

export class ExteriorArchitecturalSystem {
  private static elementTemplates: ExteriorElement[] = [
    // CHIMNEYS
    {
      id: 'chimney_stone_large',
      type: 'chimney',
      name: 'Large Stone Chimney',
      x: 0, y: 0, width: 2, height: 4,
      floorLevel: 0,
      materials: {
        primary: 'stone_granite',
        secondary: 'brick_fired',
        accent: 'metal_iron'
      },
      functionality: ['heating', 'cooking', 'smoke_removal'],
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      buildingTypes: ['house_small', 'house_large', 'tavern', 'blacksmith'],
      priority: 1,
      structural: false,
      weatherProtection: 0
    },

    {
      id: 'chimney_brick_simple',
      name: 'Simple Brick Chimney',
      type: 'chimney',
      x: 0, y: 0, width: 1, height: 3,
      floorLevel: 0,
      materials: {
        primary: 'brick_fired'
      },
      functionality: ['heating', 'smoke_removal'],
      socialClassRequirement: ['poor', 'common'],
      buildingTypes: ['house_small', 'shop'],
      priority: 1,
      structural: false,
      weatherProtection: 0
    },

    // ENTRANCES
    {
      id: 'entrance_grand',
      name: 'Grand Entrance',
      type: 'entrance',
      x: 0, y: 0, width: 3, height: 2,
      floorLevel: 0,
      materials: {
        primary: 'stone_limestone',
        secondary: 'wood_oak',
        accent: 'metal_bronze'
      },
      functionality: ['entrance', 'status_display', 'weather_protection'],
      socialClassRequirement: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'tavern'],
      priority: 2,
      structural: false,
      weatherProtection: 75
    },

    {
      id: 'entrance_simple',
      name: 'Simple Entrance',
      type: 'entrance',
      x: 0, y: 0, width: 2, height: 1,
      floorLevel: 0,
      materials: {
        primary: 'wood_oak',
        secondary: 'stone_limestone'
      },
      functionality: ['entrance', 'basic_protection'],
      socialClassRequirement: ['poor', 'common', 'wealthy'],
      buildingTypes: ['house_small', 'house_large', 'shop', 'blacksmith'],
      priority: 1,
      structural: false,
      weatherProtection: 40
    },

    // BAY WINDOWS
    {
      id: 'bay_window',
      name: 'Bay Window',
      type: 'bay_window',
      x: 0, y: 0, width: 2, height: 1,
      floorLevel: 1,
      materials: {
        primary: 'wood_oak',
        secondary: 'glass',
        accent: 'metal_lead'
      },
      functionality: ['light', 'ventilation', 'display'],
      socialClassRequirement: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'shop'],
      priority: 3,
      structural: false,
      weatherProtection: 20
    },

    // BUTTRESSES (for large stone buildings)
    {
      id: 'stone_buttress',
      name: 'Stone Buttress',
      type: 'buttress',
      x: 0, y: 0, width: 1, height: 2,
      floorLevel: 0,
      materials: {
        primary: 'stone_granite'
      },
      functionality: ['structural_support', 'wall_reinforcement'],
      socialClassRequirement: ['noble'],
      buildingTypes: ['house_large', 'tavern'],
      priority: 2,
      structural: true,
      weatherProtection: 0
    },

    // DORMERS (roof windows)
    {
      id: 'dormer_window',
      name: 'Dormer Window',
      type: 'dormer',
      x: 0, y: 0, width: 1, height: 1,
      floorLevel: 2, // typically in attic/upper floors
      materials: {
        primary: 'wood_oak',
        secondary: 'thatch'
      },
      functionality: ['attic_light', 'ventilation'],
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      buildingTypes: ['house_large', 'tavern'],
      priority: 3,
      structural: false,
      weatherProtection: 30
    },

    // BALCONIES
    {
      id: 'stone_balcony',
      name: 'Stone Balcony',
      type: 'balcony',
      x: 0, y: 0, width: 3, height: 1,
      floorLevel: 1,
      materials: {
        primary: 'stone_limestone',
        secondary: 'metal_iron'
      },
      functionality: ['outdoor_space', 'status_display', 'ventilation'],
      socialClassRequirement: ['noble'],
      buildingTypes: ['house_large'],
      priority: 3,
      structural: true,
      weatherProtection: 0
    }
  ];

  static generateExteriorElements(
    floorFootprints: FloorFootprint[],
    rooms: Room[],
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): ExteriorElement[] {
    const elements: ExteriorElement[] = [];
    
    // Generate chimneys for hearths and cooking areas
    const chimneys = this.generateChimneys(rooms, buildingType, socialClass, seed);
    elements.push(...chimneys);

    // Generate main entrance
    const entrance = this.generateMainEntrance(floorFootprints[0], buildingType, socialClass, seed + 100);
    if (entrance) elements.push(entrance);

    // Generate additional architectural elements based on social class
    if (socialClass === 'wealthy' || socialClass === 'noble') {
      const decorativeElements = this.generateDecorativeElements(
        floorFootprints,
        buildingType,
        socialClass,
        seed + 200
      );
      elements.push(...decorativeElements);
    }

    // Generate structural supports if needed
    const structuralElements = this.generateStructuralSupports(
      floorFootprints,
      buildingType,
      socialClass,
      seed + 300
    );
    elements.push(...structuralElements);

    return elements;
  }

  private static generateChimneys(
    rooms: Room[],
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): ExteriorElement[] {
    const chimneys: ExteriorElement[] = [];
    
    // Find rooms with hearths or cooking areas
    const roomsNeedingChimneys = rooms.filter(room =>
      room.fixtures?.some(fixture => 
        fixture.type === 'hearth' || fixture.type === 'bread_oven'
      )
    );

    roomsNeedingChimneys.forEach((room, index) => {
      const fixtureWithChimney = room.fixtures?.find(f => 
        f.type === 'hearth' || f.type === 'bread_oven'
      );
      
      if (fixtureWithChimney) {
        const template = socialClass === 'poor' || socialClass === 'common' ?
          this.elementTemplates.find(t => t.id === 'chimney_brick_simple') :
          this.elementTemplates.find(t => t.id === 'chimney_stone_large');
        
        if (template) {
          const chimney: ExteriorElement = {
            ...template,
            id: `chimney_${room.id}_${index}`,
            x: fixtureWithChimney.x,
            y: fixtureWithChimney.y - 1, // Place above fixture
            floorLevel: room.floor
          };
          
          chimneys.push(chimney);
        }
      }
    });

    return chimneys;
  }

  private static generateMainEntrance(
    groundFootprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): ExteriorElement | null {
    
    const template = (socialClass === 'wealthy' || socialClass === 'noble') ?
      this.elementTemplates.find(t => t.id === 'entrance_grand') :
      this.elementTemplates.find(t => t.id === 'entrance_simple');
    
    if (!template) return null;

    const usable = groundFootprint.usableArea;
    
    // Place entrance on south wall (front of building)
    const entranceX = usable.x + Math.floor((usable.width - template.width) / 2);
    const entranceY = usable.y + usable.height;

    return {
      ...template,
      id: `main_entrance_${seed}`,
      x: entranceX,
      y: entranceY
    };
  }

  private static generateDecorativeElements(
    floorFootprints: FloorFootprint[],
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): ExteriorElement[] {
    const elements: ExteriorElement[] = [];
    
    // Add bay windows for wealthy buildings
    if (socialClass === 'wealthy' || socialClass === 'noble') {
      const bayWindowTemplate = this.elementTemplates.find(t => t.id === 'bay_window');
      if (bayWindowTemplate && floorFootprints.length > 1) {
        const upperFloor = floorFootprints[1];
        
        const bayWindow: ExteriorElement = {
          ...bayWindowTemplate,
          id: `bay_window_${seed}`,
          x: upperFloor.usableArea.x + 2,
          y: upperFloor.usableArea.y,
          floorLevel: 1
        };
        
        elements.push(bayWindow);
      }
    }

    // Add dormers for multi-story buildings
    if (floorFootprints.length > 2) {
      const dormerTemplate = this.elementTemplates.find(t => t.id === 'dormer_window');
      if (dormerTemplate) {
        const topFloor = floorFootprints[floorFootprints.length - 1];
        
        const dormer: ExteriorElement = {
          ...dormerTemplate,
          id: `dormer_${seed}`,
          x: topFloor.usableArea.x + Math.floor(topFloor.usableArea.width / 2),
          y: topFloor.usableArea.y,
          floorLevel: floorFootprints.length - 1
        };
        
        elements.push(dormer);
      }
    }

    // Add balcony for noble multi-story buildings
    if (socialClass === 'noble' && floorFootprints.length > 1) {
      const balconyTemplate = this.elementTemplates.find(t => t.id === 'stone_balcony');
      if (balconyTemplate) {
        const secondFloor = floorFootprints[1];
        
        const balcony: ExteriorElement = {
          ...balconyTemplate,
          id: `balcony_${seed}`,
          x: secondFloor.usableArea.x + Math.floor((secondFloor.usableArea.width - balconyTemplate.width) / 2),
          y: secondFloor.usableArea.y + secondFloor.usableArea.height,
          floorLevel: 1
        };
        
        elements.push(balcony);
      }
    }

    return elements;
  }

  private static generateStructuralSupports(
    floorFootprints: FloorFootprint[],
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): ExteriorElement[] {
    const elements: ExteriorElement[] = [];
    
    // Add buttresses for large stone buildings
    if (socialClass === 'noble' && floorFootprints.length > 2) {
      const buttressTemplate = this.elementTemplates.find(t => t.id === 'stone_buttress');
      if (buttressTemplate) {
        const groundFloor = floorFootprints[0];
        
        // Add buttresses at corners
        const corners = [
          { x: groundFloor.usableArea.x - 1, y: groundFloor.usableArea.y },
          { x: groundFloor.usableArea.x + groundFloor.usableArea.width, y: groundFloor.usableArea.y },
          { x: groundFloor.usableArea.x - 1, y: groundFloor.usableArea.y + groundFloor.usableArea.height - 1 },
          { x: groundFloor.usableArea.x + groundFloor.usableArea.width, y: groundFloor.usableArea.y + groundFloor.usableArea.height - 1 }
        ];
        
        corners.forEach((corner, index) => {
          const buttress: ExteriorElement = {
            ...buttressTemplate,
            id: `buttress_${index}_${seed}`,
            x: corner.x,
            y: corner.y,
            floorLevel: 0
          };
          
          elements.push(buttress);
        });
      }
    }

    return elements;
  }

  static generateRoofStructures(
    floorFootprints: FloorFootprint[],
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): RoofStructure[] {
    const roofStructures: RoofStructure[] = [];
    
    if (floorFootprints.length === 0) return roofStructures;
    
    const topFloor = floorFootprints[floorFootprints.length - 1];
    
    // Determine roof type based on building and social class
    let roofType: RoofStructure['type'] = 'gable';
    let roofMaterial = 'thatch';
    let pitch = 45;
    
    switch (socialClass) {
      case 'poor':
        roofType = 'shed';
        roofMaterial = 'thatch';
        pitch = 30;
        break;
      case 'common':
        roofType = 'gable';
        roofMaterial = 'wood_shingles';
        pitch = 40;
        break;
      case 'wealthy':
        roofType = 'hip';
        roofMaterial = 'clay_tiles';
        pitch = 45;
        break;
      case 'noble':
        roofType = buildingType === 'house_large' ? 'mansard' : 'hip';
        roofMaterial = 'slate';
        pitch = 50;
        break;
    }
    
    const mainRoof: RoofStructure = {
      id: `main_roof_${seed}`,
      type: roofType,
      pitch,
      material: roofMaterial,
      covers: [{
        x: topFloor.usableArea.x - 1,
        y: topFloor.usableArea.y - 1,
        width: topFloor.usableArea.width + 2,
        height: topFloor.usableArea.height + 2
      }],
      drainagePoints: [
        { x: topFloor.usableArea.x, y: topFloor.usableArea.y + topFloor.usableArea.height, type: 'gutter' },
        { x: topFloor.usableArea.x + topFloor.usableArea.width - 1, y: topFloor.usableArea.y + topFloor.usableArea.height, type: 'downspout' }
      ],
      supportRequirements: {
        loadBearingWalls: true,
        additionalSupports: floorFootprints.length > 2
      }
    };
    
    roofStructures.push(mainRoof);
    
    // Add tower roofs for large buildings
    if (buildingType === 'house_large' && socialClass === 'noble' && this.seedRandom(seed) > 0.7) {
      const towerRoof: RoofStructure = {
        id: `tower_roof_${seed}`,
        type: 'tower_cone',
        pitch: 60,
        material: roofMaterial,
        covers: [{
          x: topFloor.usableArea.x,
          y: topFloor.usableArea.y,
          width: 3,
          height: 3
        }],
        drainagePoints: [],
        supportRequirements: {
          loadBearingWalls: true,
          additionalSupports: true
        }
      };
      
      roofStructures.push(towerRoof);
    }
    
    return roofStructures;
  }

  static integrateExteriorElements(
    rooms: Room[],
    elements: ExteriorElement[]
  ): void {
    
    elements.forEach(element => {
      if (element.type === 'entrance') {
        // Find room closest to entrance and add door
        const groundFloorRooms = rooms.filter(r => r.floor === 0);
        if (groundFloorRooms.length > 0) {
          const closestRoom = groundFloorRooms.reduce((closest, room) => {
            const distToCurrent = Math.abs(room.x + room.width/2 - element.x) + 
                                Math.abs(room.y + room.height/2 - element.y);
            const distToClosest = Math.abs(closest.x + closest.width/2 - element.x) + 
                                Math.abs(closest.y + closest.height/2 - element.y);
            return distToCurrent < distToClosest ? room : closest;
          });
          
          // Add entrance door if not already present
          const doorExists = closestRoom.doors.some(door => 
            Math.abs(door.x - element.x) <= 1 && Math.abs(door.y - element.y) <= 1
          );
          
          if (!doorExists) {
            closestRoom.doors.push({
              x: element.x + Math.floor(element.width / 2),
              y: element.y,
              direction: 'south'
            });
          }
        }
      }
    });
  }

  static getExteriorElementVisualStyle(element: ExteriorElement): {
    color: string;
    borderColor: string;
    icon: string;
    description: string;
  } {
    switch (element.type) {
      case 'chimney':
        return {
          color: '#696969',
          borderColor: '#2F4F4F',
          icon: '🏠',
          description: 'Stone chimney'
        };
      
      case 'entrance':
        return {
          color: '#8B4513',
          borderColor: '#654321',
          icon: '🚪',
          description: element.socialClassRequirement?.includes('noble') ? 'Grand entrance' : 'Main entrance'
        };
      
      case 'bay_window':
        return {
          color: '#87CEEB',
          borderColor: '#4682B4',
          icon: '🪟',
          description: 'Bay window'
        };
      
      case 'buttress':
        return {
          color: '#A9A9A9',
          borderColor: '#696969',
          icon: '🏛️',
          description: 'Stone buttress'
        };
      
      case 'balcony':
        return {
          color: '#D2B48C',
          borderColor: '#A0522D',
          icon: '🏰',
          description: 'Stone balcony'
        };
      
      case 'dormer':
        return {
          color: '#CD853F',
          borderColor: '#8B4513',
          icon: '🏠',
          description: 'Dormer window'
        };
      
      default:
        return {
          color: '#D2B48C',
          borderColor: '#A0522D',
          icon: '🏗️',
          description: 'Architectural element'
        };
    }
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}