import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { FloorFootprint } from './StructuralEngine';
import { Room } from './ProceduralBuildingGenerator';

export interface Hallway {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'corridor' | 'entrance_hall' | 'landing' | 'gallery';
  connects: string[]; // Room IDs this hallway connects
  tiles: Array<{
    x: number;
    y: number;
    type: 'floor' | 'wall';
    material: string;
  }>;
  features: Array<{
    x: number;
    y: number;
    type: 'door' | 'arch' | 'pillar' | 'alcove';
    connects?: string; // Room ID if door/arch
  }>;
}

export interface HallwayTemplate {
  minWidth: number;
  maxWidth: number;
  preferredWidth: number;
  floorMaterial: string;
  wallMaterial: string;
  socialClassRequirements: SocialClass[];
  buildingTypes: BuildingType[];
  features: Array<{
    type: 'pillar' | 'alcove' | 'arch';
    frequency: number; // 0-1, how often this feature appears
    spacing: number; // tiles between features
  }>;
}

export class HallwaySystem {
  private static templates: { [key: string]: HallwayTemplate } = {
    basic_corridor: {
      minWidth: 2,
      maxWidth: 3,
      preferredWidth: 2,
      floorMaterial: 'wood_pine',
      wallMaterial: 'stone_limestone',
      socialClassRequirements: ['poor', 'common'],
      buildingTypes: ['house_small', 'house_large', 'shop'],
      features: []
    },

    grand_hallway: {
      minWidth: 3,
      maxWidth: 5,
      preferredWidth: 4,
      floorMaterial: 'stone_marble',
      wallMaterial: 'stone_granite',
      socialClassRequirements: ['wealthy', 'noble'],
      buildingTypes: ['house_large', 'tavern'],
      features: [
        { type: 'pillar', frequency: 0.3, spacing: 4 },
        { type: 'alcove', frequency: 0.2, spacing: 6 }
      ]
    },

    tavern_corridor: {
      minWidth: 3,
      maxWidth: 4,
      preferredWidth: 3,
      floorMaterial: 'wood_oak',
      wallMaterial: 'wood_oak',
      socialClassRequirements: ['common', 'wealthy'],
      buildingTypes: ['tavern'],
      features: [
        { type: 'arch', frequency: 0.4, spacing: 3 }
      ]
    },

    workshop_passage: {
      minWidth: 2,
      maxWidth: 3,
      preferredWidth: 2,
      floorMaterial: 'stone_limestone',
      wallMaterial: 'brick_fired',
      socialClassRequirements: ['poor', 'common', 'wealthy'],
      buildingTypes: ['blacksmith', 'shop'],
      features: []
    }
  };

  static generateHallways(
    rooms: Room[],
    footprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): Hallway[] {
    const hallways: Hallway[] = [];
    
    // Skip hallways for very small buildings
    if (rooms.length <= 2 || footprint.usableArea.width < 12 || footprint.usableArea.height < 12) {
      return hallways;
    }

    // Find rooms that need connections
    const connectableRooms = rooms.filter(room => 
      room.type !== 'storage' && room.doors.length < 2
    );

    if (connectableRooms.length < 3) return hallways;

    // Generate main hallway based on building layout
    const mainHallway = this.generateMainHallway(
      connectableRooms,
      footprint,
      buildingType,
      socialClass,
      seed
    );

    if (mainHallway) {
      hallways.push(mainHallway);
      
      // Generate secondary corridors if needed
      const secondaryHallways = this.generateSecondaryHallways(
        connectableRooms,
        mainHallway,
        footprint,
        buildingType,
        socialClass,
        seed + 100
      );
      
      hallways.push(...secondaryHallways);
    }

    return hallways;
  }

  private static generateMainHallway(
    rooms: Room[],
    footprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): Hallway | null {
    const template = this.selectHallwayTemplate(buildingType, socialClass);
    
    // Determine hallway orientation and position
    const buildingWidth = footprint.usableArea.width;
    const buildingHeight = footprint.usableArea.height;
    
    let hallwayConfig;
    
    if (buildingWidth > buildingHeight) {
      // Horizontal main hallway
      hallwayConfig = this.createHorizontalHallway(rooms, footprint, template, seed);
    } else {
      // Vertical main hallway
      hallwayConfig = this.createVerticalHallway(rooms, footprint, template, seed);
    }

    if (!hallwayConfig) return null;

    const hallway: Hallway = {
      id: `hallway_main_${seed}`,
      x: hallwayConfig.x,
      y: hallwayConfig.y,
      width: hallwayConfig.width,
      height: hallwayConfig.height,
      type: buildingType === 'house_large' && socialClass === 'noble' ? 'entrance_hall' : 'corridor',
      connects: hallwayConfig.connects,
      tiles: this.generateHallwayTiles(hallwayConfig, template),
      features: this.generateHallwayFeatures(hallwayConfig, template, seed)
    };

    return hallway;
  }

  private static createHorizontalHallway(
    rooms: Room[],
    footprint: FloorFootprint,
    template: HallwayTemplate,
    seed: number
  ): { x: number; y: number; width: number; height: number; connects: string[] } | null {
    // Find optimal Y position to connect most rooms
    const roomCentersY = rooms.map(room => room.y + Math.floor(room.height / 2));
    const avgY = Math.floor(roomCentersY.reduce((sum, y) => sum + y, 0) / roomCentersY.length);
    
    const hallwayY = Math.max(
      footprint.usableArea.y + 1,
      Math.min(avgY, footprint.usableArea.y + footprint.usableArea.height - template.preferredWidth - 1)
    );
    
    const hallwayX = footprint.usableArea.x + 1;
    const hallwayWidth = footprint.usableArea.width - 2;
    const hallwayHeight = template.preferredWidth;

    // Find which rooms this hallway can connect
    const connectedRooms = rooms.filter(room => {
      const roomBottom = room.y + room.height;
      const roomTop = room.y;
      const hallwayBottom = hallwayY + hallwayHeight;
      const hallwayTop = hallwayY;
      
      // Check if room overlaps with hallway Y range
      return (roomTop <= hallwayBottom && roomBottom >= hallwayTop) ||
             Math.abs(roomBottom - hallwayTop) <= 1 || 
             Math.abs(roomTop - hallwayBottom) <= 1;
    }).map(room => room.id);

    if (connectedRooms.length < 2) return null;

    return {
      x: hallwayX,
      y: hallwayY,
      width: hallwayWidth,
      height: hallwayHeight,
      connects: connectedRooms
    };
  }

  private static createVerticalHallway(
    rooms: Room[],
    footprint: FloorFootprint,
    template: HallwayTemplate,
    seed: number
  ): { x: number; y: number; width: number; height: number; connects: string[] } | null {
    // Find optimal X position to connect most rooms
    const roomCentersX = rooms.map(room => room.x + Math.floor(room.width / 2));
    const avgX = Math.floor(roomCentersX.reduce((sum, x) => sum + x, 0) / roomCentersX.length);
    
    const hallwayX = Math.max(
      footprint.usableArea.x + 1,
      Math.min(avgX, footprint.usableArea.x + footprint.usableArea.width - template.preferredWidth - 1)
    );
    
    const hallwayY = footprint.usableArea.y + 1;
    const hallwayWidth = template.preferredWidth;
    const hallwayHeight = footprint.usableArea.height - 2;

    // Find which rooms this hallway can connect
    const connectedRooms = rooms.filter(room => {
      const roomRight = room.x + room.width;
      const roomLeft = room.x;
      const hallwayRight = hallwayX + hallwayWidth;
      const hallwayLeft = hallwayX;
      
      // Check if room overlaps with hallway X range
      return (roomLeft <= hallwayRight && roomRight >= hallwayLeft) ||
             Math.abs(roomRight - hallwayLeft) <= 1 || 
             Math.abs(roomLeft - hallwayRight) <= 1;
    }).map(room => room.id);

    if (connectedRooms.length < 2) return null;

    return {
      x: hallwayX,
      y: hallwayY,
      width: hallwayWidth,
      height: hallwayHeight,
      connects: connectedRooms
    };
  }

  private static generateSecondaryHallways(
    rooms: Room[],
    mainHallway: Hallway,
    footprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): Hallway[] {
    const secondaryHallways: Hallway[] = [];
    
    // Find rooms not connected by main hallway
    const unconnectedRooms = rooms.filter(room => 
      !mainHallway.connects.includes(room.id)
    );

    if (unconnectedRooms.length === 0) return secondaryHallways;

    // Create short connecting corridors
    unconnectedRooms.forEach((room, index) => {
      const connector = this.createConnectingCorridor(
        room,
        mainHallway,
        footprint,
        buildingType,
        socialClass,
        seed + index
      );
      
      if (connector) {
        secondaryHallways.push(connector);
      }
    });

    return secondaryHallways;
  }

  private static createConnectingCorridor(
    room: Room,
    mainHallway: Hallway,
    footprint: FloorFootprint,
    buildingType: BuildingType,
    socialClass: SocialClass,
    seed: number
  ): Hallway | null {
    const template = this.selectHallwayTemplate(buildingType, socialClass);
    
    // Find closest connection point to main hallway
    const roomCenterX = room.x + Math.floor(room.width / 2);
    const roomCenterY = room.y + Math.floor(room.height / 2);
    const hallwayCenterX = mainHallway.x + Math.floor(mainHallway.width / 2);
    const hallwayCenterY = mainHallway.y + Math.floor(mainHallway.height / 2);

    let connectorConfig;

    if (Math.abs(roomCenterX - hallwayCenterX) > Math.abs(roomCenterY - hallwayCenterY)) {
      // Horizontal connector
      const startX = Math.min(room.x + room.width, mainHallway.x);
      const endX = Math.max(room.x, mainHallway.x + mainHallway.width);
      const connectorY = roomCenterY;
      
      connectorConfig = {
        x: startX,
        y: connectorY,
        width: endX - startX,
        height: 2,
        connects: [room.id, mainHallway.id]
      };
    } else {
      // Vertical connector
      const startY = Math.min(room.y + room.height, mainHallway.y);
      const endY = Math.max(room.y, mainHallway.y + mainHallway.height);
      const connectorX = roomCenterX;
      
      connectorConfig = {
        x: connectorX,
        y: startY,
        width: 2,
        height: endY - startY,
        connects: [room.id, mainHallway.id]
      };
    }

    const connector: Hallway = {
      id: `corridor_${room.id}_${seed}`,
      x: connectorConfig.x,
      y: connectorConfig.y,
      width: connectorConfig.width,
      height: connectorConfig.height,
      type: 'corridor',
      connects: connectorConfig.connects,
      tiles: this.generateHallwayTiles(connectorConfig, template),
      features: []
    };

    return connector;
  }

  private static generateHallwayTiles(
    config: { x: number; y: number; width: number; height: number },
    template: HallwayTemplate
  ): Array<{ x: number; y: number; type: 'floor' | 'wall'; material: string }> {
    const tiles = [];

    for (let y = config.y; y < config.y + config.height; y++) {
      for (let x = config.x; x < config.x + config.width; x++) {
        const isEdge = x === config.x || x === config.x + config.width - 1 ||
                      y === config.y || y === config.y + config.height - 1;
        
        tiles.push({
          x,
          y,
          type: isEdge ? 'wall' : 'floor',
          material: isEdge ? template.wallMaterial : template.floorMaterial
        });
      }
    }

    return tiles;
  }

  private static generateHallwayFeatures(
    config: { x: number; y: number; width: number; height: number },
    template: HallwayTemplate,
    seed: number
  ): Array<{ x: number; y: number; type: 'door' | 'arch' | 'pillar' | 'alcove'; connects?: string }> {
    const features = [];
    
    template.features.forEach((featureTemplate, index) => {
      if (this.seedRandom(seed + index) < featureTemplate.frequency) {
        const feature = this.placeHallwayFeature(config, featureTemplate, seed + index);
        if (feature) {
          features.push(feature);
        }
      }
    });

    return features;
  }

  private static placeHallwayFeature(
    config: { x: number; y: number; width: number; height: number },
    featureTemplate: { type: 'pillar' | 'alcove' | 'arch'; frequency: number; spacing: number },
    seed: number
  ): { x: number; y: number; type: 'pillar' | 'alcove' | 'arch' } | null {
    
    // Place feature along the longer dimension of the hallway
    if (config.width > config.height) {
      // Horizontal hallway - place features along length
      const featureX = config.x + Math.floor(this.seedRandom(seed) * (config.width - 2)) + 1;
      const featureY = config.y + Math.floor(config.height / 2);
      
      return {
        x: featureX,
        y: featureY,
        type: featureTemplate.type
      };
    } else {
      // Vertical hallway - place features along height
      const featureX = config.x + Math.floor(config.width / 2);
      const featureY = config.y + Math.floor(this.seedRandom(seed) * (config.height - 2)) + 1;
      
      return {
        x: featureX,
        y: featureY,
        type: featureTemplate.type
      };
    }
  }

  private static selectHallwayTemplate(buildingType: BuildingType, socialClass: SocialClass): HallwayTemplate {
    const candidates = Object.values(this.templates).filter(template =>
      template.buildingTypes.includes(buildingType) &&
      template.socialClassRequirements.includes(socialClass)
    );

    if (candidates.length === 0) {
      return this.templates.basic_corridor;
    }

    // Prefer more elaborate templates for higher social classes
    const sorted = candidates.sort((a, b) => {
      const aScore = a.socialClassRequirements.includes('noble') ? 3 :
                    a.socialClassRequirements.includes('wealthy') ? 2 : 1;
      const bScore = b.socialClassRequirements.includes('noble') ? 3 :
                    b.socialClassRequirements.includes('wealthy') ? 2 : 1;
      return bScore - aScore;
    });

    return sorted[0];
  }

  static integrateHallwaysIntoRooms(rooms: Room[], hallways: Hallway[]): void {
    hallways.forEach(hallway => {
      // Create doorways between hallway and connected rooms
      hallway.connects.forEach(roomId => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return;

        const doorway = this.findOptimalDoorwayPosition(room, hallway);
        if (doorway) {
          // Add door to room
          room.doors.push({
            x: doorway.x,
            y: doorway.y,
            connects: hallway.id
          });

          // Add corresponding door to hallway features
          hallway.features.push({
            x: doorway.x,
            y: doorway.y,
            type: 'door',
            connects: roomId
          });
        }
      });
    });
  }

  private static findOptimalDoorwayPosition(
    room: Room,
    hallway: Hallway
  ): { x: number; y: number } | null {
    
    // Find shared wall between room and hallway
    const roomBounds = {
      left: room.x,
      right: room.x + room.width - 1,
      top: room.y,
      bottom: room.y + room.height - 1
    };

    const hallwayBounds = {
      left: hallway.x,
      right: hallway.x + hallway.width - 1,
      top: hallway.y,
      bottom: hallway.y + hallway.height - 1
    };

    // Check for adjacent walls
    if (roomBounds.right + 1 === hallwayBounds.left) {
      // Room is west of hallway
      const overlapTop = Math.max(roomBounds.top, hallwayBounds.top);
      const overlapBottom = Math.min(roomBounds.bottom, hallwayBounds.bottom);
      if (overlapTop <= overlapBottom) {
        return {
          x: roomBounds.right,
          y: Math.floor((overlapTop + overlapBottom) / 2)
        };
      }
    }

    if (hallwayBounds.right + 1 === roomBounds.left) {
      // Room is east of hallway
      const overlapTop = Math.max(roomBounds.top, hallwayBounds.top);
      const overlapBottom = Math.min(roomBounds.bottom, hallwayBounds.bottom);
      if (overlapTop <= overlapBottom) {
        return {
          x: hallwayBounds.right,
          y: Math.floor((overlapTop + overlapBottom) / 2)
        };
      }
    }

    if (roomBounds.bottom + 1 === hallwayBounds.top) {
      // Room is north of hallway
      const overlapLeft = Math.max(roomBounds.left, hallwayBounds.left);
      const overlapRight = Math.min(roomBounds.right, hallwayBounds.right);
      if (overlapLeft <= overlapRight) {
        return {
          x: Math.floor((overlapLeft + overlapRight) / 2),
          y: roomBounds.bottom
        };
      }
    }

    if (hallwayBounds.bottom + 1 === roomBounds.top) {
      // Room is south of hallway
      const overlapLeft = Math.max(roomBounds.left, hallwayBounds.left);
      const overlapRight = Math.min(roomBounds.right, hallwayBounds.right);
      if (overlapLeft <= overlapRight) {
        return {
          x: Math.floor((overlapLeft + overlapRight) / 2),
          y: hallwayBounds.bottom
        };
      }
    }

    return null;
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}