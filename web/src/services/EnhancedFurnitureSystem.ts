import { SocialClass } from './StandaloneBuildingGenerator';
import { RoomFunction } from './FloorMaterialSystem';

export interface FurnitureAsset {
  id: string;
  name: string;
  assetPath: string;
  category: FurnitureCategory;
  material: FurnitureMaterial;
  socialClass: SocialClass[];
  roomTypes: RoomFunction[];
  width: number; // in tiles
  height: number; // in tiles
  cost: number;
  comfort: number; // 0-100
  durability: number; // 0-100
  rotatable: boolean;
  placement: PlacementType;
  functionalRadius?: number; // for chairs near tables, etc.
  lightLevel?: number; // for lighting furniture
}

export type FurnitureCategory = 
  | 'seating' | 'table' | 'bed' | 'storage' | 'cooking' | 'lighting' 
  | 'religious' | 'decorative' | 'work' | 'bathing' | 'magical';

export type FurnitureMaterial = 
  | 'wood_ashen' | 'wood_dark' | 'wood_light' | 'wood_red' | 'wood_walnut'
  | 'metal_black' | 'metal_bronze' | 'metal_gold' | 'metal_gray' | 'metal_rusty' | 'metal_silver'
  | 'stone' | 'fabric' | 'glass' | 'magical';

export type PlacementType = 'center' | 'wall' | 'corner' | 'anywhere';

export interface FurnitureSet {
  id: string;
  name: string;
  primaryPiece: FurnitureAsset; // main item (like a table)
  complementaryPieces: FurnitureAsset[]; // chairs for the table
  spatialRelationships: SpatialRelation[];
}

export interface SpatialRelation {
  pieceId: string;
  relativeX: number; // relative to primary piece
  relativeY: number;
  facing: 0 | 90 | 180 | 270; // degrees
  required: boolean; // must be placed for set to be complete
}

export interface PlacedFurniture {
  asset: FurnitureAsset;
  x: number;
  y: number;
  rotation: number;
  condition: 'pristine' | 'good' | 'worn' | 'damaged' | 'broken';
  setId?: string; // if part of a furniture set
  functionalConnections?: string[]; // IDs of related furniture pieces
}

export class EnhancedFurnitureSystem {
  private static furnitureAssetCatalog: Map<string, FurnitureAsset> = new Map();
  private static furnitureSets: Map<string, FurnitureSet> = new Map();
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    await this.loadFurnitureAssets();
    this.createFurnitureSets();
    this.initialized = true;
  }

  private static async loadFurnitureAssets() {
    // Seating Assets
    const seatingAssets = this.createSeatingAssets();
    seatingAssets.forEach(asset => this.furnitureAssetCatalog.set(asset.id, asset));

    // Table Assets
    const tableAssets = this.createTableAssets();
    tableAssets.forEach(asset => this.furnitureAssetCatalog.set(asset.id, asset));

    // Bed Assets
    const bedAssets = this.createBedAssets();
    bedAssets.forEach(asset => this.furnitureAssetCatalog.set(asset.id, asset));

    // Storage Assets
    const storageAssets = this.createStorageAssets();
    storageAssets.forEach(asset => this.furnitureAssetCatalog.set(asset.id, asset));

    // Cooking Assets
    const cookingAssets = this.createCookingAssets();
    cookingAssets.forEach(asset => this.furnitureAssetCatalog.set(asset.id, asset));

    // Lighting Assets
    const lightingAssets = this.createLightingAssets();
    lightingAssets.forEach(asset => this.furnitureAssetCatalog.set(asset.id, asset));

    // Specialized Assets
    const specializedAssets = this.createSpecializedAssets();
    specializedAssets.forEach(asset => this.furnitureAssetCatalog.set(asset.id, asset));
  }

  private static createSeatingAssets(): FurnitureAsset[] {
    const materials: Array<{type: FurnitureMaterial, path: string, socialClass: SocialClass[], cost: number}> = [
      { type: 'wood_ashen', path: 'Wood_Ashen', socialClass: ['poor', 'common'], cost: 15 },
      { type: 'wood_dark', path: 'Wood_Dark', socialClass: ['common', 'wealthy'], cost: 25 },
      { type: 'wood_light', path: 'Wood_Light', socialClass: ['poor', 'common'], cost: 18 },
      { type: 'wood_red', path: 'Wood_Red', socialClass: ['common', 'wealthy'], cost: 30 },
      { type: 'wood_walnut', path: 'Wood_Walnut', socialClass: ['wealthy', 'noble'], cost: 45 },
      { type: 'metal_black', path: 'Metal_Black', socialClass: ['common', 'wealthy'], cost: 35 },
      { type: 'metal_bronze', path: 'Metal_Bronze', socialClass: ['wealthy', 'noble'], cost: 60 },
      { type: 'metal_gold', path: 'Metal_Gold', socialClass: ['noble'], cost: 120 },
      { type: 'metal_silver', path: 'Metal_Silver', socialClass: ['wealthy', 'noble'], cost: 80 }
    ];

    const seatingTypes = [
      { name: 'Simple Chair', file: 'Chair', comfort: 60, roomTypes: ['bedroom', 'living', 'common', 'office', 'study'] as RoomFunction[] },
      { name: 'Barber Chair', file: 'Chair_Barber', comfort: 70, roomTypes: ['workshop'] as RoomFunction[] },
      { name: 'Throne', file: 'Throne', comfort: 90, roomTypes: ['office'] as RoomFunction[] }
    ];

    const assets: FurnitureAsset[] = [];

    materials.forEach(material => {
      seatingTypes.forEach(seatType => {
        // Skip inappropriate combinations
        if (seatType.name === 'Throne' && !material.socialClass.includes('noble')) return;
        if (seatType.name === 'Barber Chair' && material.socialClass.includes('poor')) return;

        const asset: FurnitureAsset = {
          id: `${seatType.file.toLowerCase()}_${material.type}`,
          name: `${seatType.name} (${material.path.replace('_', ' ')})`,
          assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Seating/${seatType.file}_${material.path}_A1_1x1.png`,
          category: 'seating',
          material: material.type,
          socialClass: material.socialClass,
          roomTypes: seatType.roomTypes,
          width: 1,
          height: 1,
          cost: material.cost + (seatType.comfort - 60), // comfort bonus to cost
          comfort: seatType.comfort,
          durability: this.getMaterialDurability(material.type),
          rotatable: true,
          placement: 'anywhere',
          functionalRadius: 1 // can interact with adjacent tiles
        };

        assets.push(asset);
      });
    });

    return assets;
  }

  private static createTableAssets(): FurnitureAsset[] {
    const materials: Array<{type: FurnitureMaterial, path: string, socialClass: SocialClass[], cost: number}> = [
      { type: 'wood_ashen', path: 'Wood_Ashen', socialClass: ['poor', 'common'], cost: 30 },
      { type: 'wood_dark', path: 'Wood_Dark', socialClass: ['common', 'wealthy'], cost: 45 },
      { type: 'wood_light', path: 'Wood_Light', socialClass: ['poor', 'common'], cost: 35 },
      { type: 'wood_red', path: 'Wood_Red', socialClass: ['common', 'wealthy'], cost: 50 },
      { type: 'wood_walnut', path: 'Wood_Walnut', socialClass: ['wealthy', 'noble'], cost: 75 }
    ];

    const tableTypes = [
      { name: 'Small Dining Table', file: 'Table_Dining_Small', width: 1, height: 1, roomTypes: ['living', 'common'] as RoomFunction[] },
      { name: 'Large Dining Table', file: 'Table_Dining_Large', width: 2, height: 2, roomTypes: ['living', 'common', 'tavern_hall'] as RoomFunction[] },
      { name: 'Work Table', file: 'Table_Work', width: 2, height: 1, roomTypes: ['workshop', 'kitchen'] as RoomFunction[] },
      { name: 'Desk', file: 'Table_Desk', width: 2, height: 1, roomTypes: ['office', 'study', 'bedroom'] as RoomFunction[] },
      { name: 'Round Table', file: 'Table_Round', width: 1, height: 1, roomTypes: ['living', 'common', 'tavern_hall'] as RoomFunction[] }
    ];

    const assets: FurnitureAsset[] = [];

    materials.forEach(material => {
      tableTypes.forEach(tableType => {
        const asset: FurnitureAsset = {
          id: `${tableType.file.toLowerCase()}_${material.type}`,
          name: `${tableType.name} (${material.path.replace('_', ' ')})`,
          assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Tables/${tableType.file}_${material.path}_A1_${tableType.width}x${tableType.height}.png`,
          category: 'table',
          material: material.type,
          socialClass: material.socialClass,
          roomTypes: tableType.roomTypes,
          width: tableType.width,
          height: tableType.height,
          cost: material.cost * (tableType.width * tableType.height), // size affects cost
          comfort: 0, // tables don't provide comfort themselves
          durability: this.getMaterialDurability(material.type),
          rotatable: tableType.width !== tableType.height, // only non-square tables can rotate meaningfully
          placement: tableType.name.includes('Desk') ? 'wall' : 'center'
        };

        assets.push(asset);
      });
    });

    return assets;
  }

  private static createBedAssets(): FurnitureAsset[] {
    const bedTypes = [
      { 
        name: 'Simple Bed Frame', 
        file: 'Bed_Frame_Simple', 
        materials: [
          { type: 'wood_ashen' as FurnitureMaterial, path: 'Wood_Ashen', socialClass: ['poor'] as SocialClass[], cost: 40, comfort: 50 },
          { type: 'wood_light' as FurnitureMaterial, path: 'Wood_Light', socialClass: ['poor', 'common'] as SocialClass[], cost: 45, comfort: 55 }
        ]
      },
      { 
        name: 'Quality Bed', 
        file: 'Bed_Arranged', 
        materials: [
          { type: 'wood_dark' as FurnitureMaterial, path: 'Wood_Dark', socialClass: ['common', 'wealthy'] as SocialClass[], cost: 75, comfort: 75 },
          { type: 'wood_red' as FurnitureMaterial, path: 'Wood_Red', socialClass: ['wealthy'] as SocialClass[], cost: 90, comfort: 80 },
          { type: 'wood_walnut' as FurnitureMaterial, path: 'Wood_Walnut', socialClass: ['wealthy', 'noble'] as SocialClass[], cost: 120, comfort: 85 }
        ]
      },
      { 
        name: 'Metal Bed Frame', 
        file: 'Bed_Frame_Metal', 
        materials: [
          { type: 'metal_black' as FurnitureMaterial, path: 'Metal_Black', socialClass: ['common'] as SocialClass[], cost: 60, comfort: 60 },
          { type: 'metal_bronze' as FurnitureMaterial, path: 'Metal_Bronze', socialClass: ['wealthy'] as SocialClass[], cost: 100, comfort: 70 },
          { type: 'metal_silver' as FurnitureMaterial, path: 'Metal_Silver', socialClass: ['wealthy', 'noble'] as SocialClass[], cost: 140, comfort: 75 }
        ]
      }
    ];

    const assets: FurnitureAsset[] = [];

    bedTypes.forEach(bedType => {
      bedType.materials.forEach(material => {
        // Single bed
        assets.push({
          id: `${bedType.file.toLowerCase()}_single_${material.type}`,
          name: `${bedType.name} - Single (${material.path.replace('_', ' ')})`,
          assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Bedding/${bedType.file}_${material.path}_Single_1x2.png`,
          category: 'bed',
          material: material.type,
          socialClass: material.socialClass,
          roomTypes: ['bedroom'],
          width: 1,
          height: 2,
          cost: material.cost,
          comfort: material.comfort,
          durability: this.getMaterialDurability(material.type),
          rotatable: true,
          placement: 'wall'
        });

        // Double bed (if appropriate for social class)
        if (!material.socialClass.includes('poor')) {
          assets.push({
            id: `${bedType.file.toLowerCase()}_double_${material.type}`,
            name: `${bedType.name} - Double (${material.path.replace('_', ' ')})`,
            assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Bedding/${bedType.file}_${material.path}_Double_2x2.png`,
            category: 'bed',
            material: material.type,
            socialClass: material.socialClass,
            roomTypes: ['bedroom'],
            width: 2,
            height: 2,
            cost: material.cost * 1.8, // double beds cost more but not quite 2x
            comfort: material.comfort + 10, // double beds are more comfortable
            durability: this.getMaterialDurability(material.type),
            rotatable: true,
            placement: 'wall'
          });
        }
      });
    });

    return assets;
  }

  private static createStorageAssets(): FurnitureAsset[] {
    const storageTypes = [
      { name: 'Simple Cupboard', file: 'Cupboard_Simple', width: 1, height: 1, capacity: 20 },
      { name: 'Large Cupboard', file: 'Cupboard_Large', width: 1, height: 1, capacity: 35 },
      { name: 'Wardrobe', file: 'Wardrobe', width: 1, height: 1, capacity: 50 },
      { name: 'Nightstand', file: 'Nightstand', width: 1, height: 1, capacity: 10 },
      { name: 'Bookshelf', file: 'Bookshelf', width: 1, height: 1, capacity: 30 },
      { name: 'Chest', file: 'Chest', width: 2, height: 1, capacity: 40 }
    ];

    const materials: Array<{type: FurnitureMaterial, path: string, socialClass: SocialClass[], costMultiplier: number}> = [
      { type: 'wood_ashen', path: 'Wood_Ashen', socialClass: ['poor', 'common'], costMultiplier: 1.0 },
      { type: 'wood_dark', path: 'Wood_Dark', socialClass: ['common', 'wealthy'], costMultiplier: 1.3 },
      { type: 'wood_red', path: 'Wood_Red', socialClass: ['wealthy'], costMultiplier: 1.5 },
      { type: 'wood_walnut', path: 'Wood_Walnut', socialClass: ['wealthy', 'noble'], costMultiplier: 2.0 }
    ];

    const assets: FurnitureAsset[] = [];

    storageTypes.forEach(storageType => {
      materials.forEach(material => {
        // Skip inappropriate combinations
        if (storageType.name === 'Bookshelf' && material.socialClass.includes('poor')) return;
        if (storageType.name === 'Nightstand' && material.type === 'wood_walnut') return; // overkill

        const roomTypes: RoomFunction[] = [];
        if (storageType.name.includes('Nightstand')) roomTypes.push('bedroom');
        else if (storageType.name.includes('Bookshelf')) roomTypes.push('office', 'study');
        else roomTypes.push('bedroom', 'living', 'common', 'kitchen', 'storage');

        const asset: FurnitureAsset = {
          id: `${storageType.file.toLowerCase()}_${material.type}`,
          name: `${storageType.name} (${material.path.replace('_', ' ')})`,
          assetPath: `/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Cupboards_and_Wardrobes/${storageType.file}_${material.path}_A1_${storageType.width}x${storageType.height}.png`,
          category: 'storage',
          material: material.type,
          socialClass: material.socialClass,
          roomTypes: roomTypes,
          width: storageType.width,
          height: storageType.height,
          cost: Math.round((20 + storageType.capacity * 1.5) * material.costMultiplier),
          comfort: 0,
          durability: this.getMaterialDurability(material.type),
          rotatable: false,
          placement: storageType.name.includes('Nightstand') ? 'corner' : 'wall'
        };

        assets.push(asset);
      });
    });

    return assets;
  }

  private static createCookingAssets(): FurnitureAsset[] {
    return [
      {
        id: 'cooking_fire_pit',
        name: 'Cooking Fire Pit',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Cooking/Fire_Pit_A1_1x1.png',
        category: 'cooking',
        material: 'stone',
        socialClass: ['poor'],
        roomTypes: ['kitchen'],
        width: 1,
        height: 1,
        cost: 25,
        comfort: 0,
        durability: 90,
        rotatable: false,
        placement: 'anywhere',
        lightLevel: 40
      },
      {
        id: 'cooking_stove_stone',
        name: 'Stone Cooking Stove',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Cooking/Stove_Stone_A1_2x1.png',
        category: 'cooking',
        material: 'stone',
        socialClass: ['common', 'wealthy'],
        roomTypes: ['kitchen'],
        width: 2,
        height: 1,
        cost: 80,
        comfort: 0,
        durability: 95,
        rotatable: true,
        placement: 'wall',
        lightLevel: 30
      },
      {
        id: 'cooking_oven_brick',
        name: 'Brick Bread Oven',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Cooking/Oven_Brick_A1_2x2.png',
        category: 'cooking',
        material: 'stone',
        socialClass: ['wealthy', 'noble'],
        roomTypes: ['kitchen'],
        width: 2,
        height: 2,
        cost: 150,
        comfort: 0,
        durability: 98,
        rotatable: false,
        placement: 'corner',
        lightLevel: 20
      }
    ];
  }

  private static createLightingAssets(): FurnitureAsset[] {
    return [
      {
        id: 'lighting_chandelier_bronze',
        name: 'Bronze Chandelier',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Lighting/Chandelier_Bronze_A1_1x1.png',
        category: 'lighting',
        material: 'metal_bronze',
        socialClass: ['wealthy', 'noble'],
        roomTypes: ['living', 'common', 'tavern_hall'],
        width: 1,
        height: 1,
        cost: 200,
        comfort: 15, // good lighting provides comfort
        durability: 85,
        rotatable: false,
        placement: 'center',
        lightLevel: 80
      },
      {
        id: 'lighting_brazier',
        name: 'Standing Brazier',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Lighting/Brazier_A1_1x1.png',
        category: 'lighting',
        material: 'metal_black',
        socialClass: ['poor', 'common'],
        roomTypes: ['living', 'common', 'workshop'],
        width: 1,
        height: 1,
        cost: 45,
        comfort: 10,
        durability: 80,
        rotatable: false,
        placement: 'corner',
        lightLevel: 60
      },
      {
        id: 'lighting_candelabra',
        name: 'Ornate Candelabra',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Lighting/Candelabra_A1_1x1.png',
        category: 'lighting',
        material: 'metal_silver',
        socialClass: ['wealthy', 'noble'],
        roomTypes: ['bedroom', 'office', 'study'],
        width: 1,
        height: 1,
        cost: 120,
        comfort: 12,
        durability: 75,
        rotatable: false,
        placement: 'wall',
        lightLevel: 50
      }
    ];
  }

  private static createSpecializedAssets(): FurnitureAsset[] {
    return [
      {
        id: 'religious_altar_stone',
        name: 'Stone Altar',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Religious/Altar_Stone_A1_2x1.png',
        category: 'religious',
        material: 'stone',
        socialClass: ['common', 'wealthy', 'noble'],
        roomTypes: ['office'], // temples, chapels
        width: 2,
        height: 1,
        cost: 300,
        comfort: 20, // spiritual comfort
        durability: 100,
        rotatable: false,
        placement: 'wall'
      },
      {
        id: 'magical_orrery',
        name: 'Celestial Orrery',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Magical/Orrery_A1_2x2.png',
        category: 'magical',
        material: 'magical',
        socialClass: ['wealthy', 'noble'],
        roomTypes: ['study', 'office'],
        width: 2,
        height: 2,
        cost: 800,
        comfort: 25,
        durability: 60, // complex mechanisms are fragile
        rotatable: false,
        placement: 'center',
        lightLevel: 30 // magical glow
      },
      {
        id: 'work_anvil',
        name: 'Blacksmith Anvil',
        assetPath: '/assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Work/Anvil_A1_1x1.png',
        category: 'work',
        material: 'metal_black',
        socialClass: ['common', 'wealthy'],
        roomTypes: ['workshop'],
        width: 1,
        height: 1,
        cost: 150,
        comfort: 0,
        durability: 100,
        rotatable: false,
        placement: 'center'
      }
    ];
  }

  private static createFurnitureSets() {
    // Dining set: table + chairs
    const diningSetSizes = [
      { tableSize: '1x1', chairCount: 2, positions: [[-1, 0], [1, 0]] },
      { tableSize: '2x2', chairCount: 4, positions: [[-1, 0], [2, 0], [0, -1], [0, 2]] }
    ];

    const materials = ['wood_ashen', 'wood_dark', 'wood_red', 'wood_walnut'];

    materials.forEach(material => {
      diningSetSizes.forEach((setSize, index) => {
        const tableId = `table_dining_${setSize.tableSize === '1x1' ? 'small' : 'large'}_${material}`;
        const chairId = `chair_simple_${material}`;

        const table = this.furnitureAssetCatalog.get(tableId);
        const chair = this.furnitureAssetCatalog.get(chairId);

        if (table && chair) {
          const furnitureSet: FurnitureSet = {
            id: `dining_set_${setSize.tableSize}_${material}`,
            name: `Dining Set ${setSize.tableSize} (${material.replace('_', ' ')})`,
            primaryPiece: table,
            complementaryPieces: [chair],
            spatialRelationships: setSize.positions.map((pos, i) => ({
              pieceId: chairId,
              relativeX: pos[0],
              relativeY: pos[1],
              facing: pos[0] === -1 ? 90 : pos[0] === 1 ? 270 : pos[1] === -1 ? 180 : 0,
              required: i < 2 // first 2 chairs are required
            }))
          };

          this.furnitureSets.set(furnitureSet.id, furnitureSet);
        }
      });
    });

    // Bedroom sets: bed + nightstand
    materials.forEach(material => {
      const bedId = `bed_frame_simple_single_${material}`;
      const nightstandId = `nightstand_${material}`;

      const bed = this.furnitureAssetCatalog.get(bedId);
      const nightstand = this.furnitureAssetCatalog.get(nightstandId);

      if (bed && nightstand) {
        const furnitureSet: FurnitureSet = {
          id: `bedroom_set_${material}`,
          name: `Bedroom Set (${material.replace('_', ' ')})`,
          primaryPiece: bed,
          complementaryPieces: [nightstand],
          spatialRelationships: [{
            pieceId: nightstandId,
            relativeX: 1, // beside the bed
            relativeY: 0,
            facing: 270, // facing the bed
            required: false
          }]
        };

        this.furnitureSets.set(furnitureSet.id, furnitureSet);
      }
    });
  }

  static selectOptimalFurniture(
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    roomWidth: number,
    roomHeight: number,
    budget: number,
    preferSets: boolean,
    seed: number
  ): PlacedFurniture[] {
    
    const roomArea = (roomWidth - 2) * (roomHeight - 2); // account for walls
    const placedFurniture: PlacedFurniture[] = [];

    // Try furniture sets first if preferred
    if (preferSets) {
      const availableSets = this.getAvailableSets(roomFunction, socialClass, budget, roomArea);
      if (availableSets.length > 0) {
        const randomIndex = Math.floor(this.seedRandom(seed) * availableSets.length);
        const chosenSet = availableSets[randomIndex];
        
        const setPlacement = this.tryPlaceSet(chosenSet, roomWidth, roomHeight, seed + 1);
        if (setPlacement.length > 0) {
          placedFurniture.push(...setPlacement);
          budget -= this.calculateSetCost(chosenSet);
        }
      }
    }

    // Fill remaining space with individual pieces
    const individualFurniture = this.selectIndividualFurniture(
      roomFunction, socialClass, roomWidth, roomHeight, budget, placedFurniture, seed + 100
    );
    
    placedFurniture.push(...individualFurniture);

    return placedFurniture;
  }

  private static getAvailableSets(
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    budget: number,
    roomArea: number
  ): FurnitureSet[] {
    return Array.from(this.furnitureSets.values()).filter(set => {
      // Check if primary piece is suitable for room
      if (!set.primaryPiece.roomTypes.includes(roomFunction)) return false;
      if (!set.primaryPiece.socialClass.includes(socialClass)) return false;
      
      // Check if set fits in room
      const totalArea = set.primaryPiece.width * set.primaryPiece.height +
                       set.complementaryPieces.reduce((sum, piece) => sum + piece.width * piece.height, 0);
      if (totalArea > roomArea * 0.6) return false; // sets shouldn't take up more than 60% of room
      
      // Check budget
      const setCost = this.calculateSetCost(set);
      if (setCost > budget) return false;
      
      return true;
    });
  }

  private static calculateSetCost(set: FurnitureSet): number {
    return set.primaryPiece.cost + 
           set.complementaryPieces.reduce((sum, piece) => sum + piece.cost, 0);
  }

  private static tryPlaceSet(
    set: FurnitureSet,
    roomWidth: number,
    roomHeight: number,
    seed: number
  ): PlacedFurniture[] {
    const placedPieces: PlacedFurniture[] = [];
    
    // Try to place primary piece first
    const primaryPlacement = this.findPlacementForPiece(
      set.primaryPiece, roomWidth, roomHeight, [], seed
    );
    
    if (!primaryPlacement) return [];

    placedPieces.push(primaryPlacement);

    // Place complementary pieces based on spatial relationships
    set.spatialRelationships.forEach(relation => {
      const complementaryPiece = set.complementaryPieces.find(p => p.id.includes(relation.pieceId.split('_')[0]));
      if (!complementaryPiece) return;

      const targetX = primaryPlacement.x + relation.relativeX;
      const targetY = primaryPlacement.y + relation.relativeY;

      // Check if position is valid
      if (this.isValidPlacement(targetX, targetY, complementaryPiece.width, complementaryPiece.height, roomWidth, roomHeight, placedPieces)) {
        placedPieces.push({
          asset: complementaryPiece,
          x: targetX,
          y: targetY,
          rotation: relation.facing,
          condition: 'good',
          setId: set.id,
          functionalConnections: [primaryPlacement.asset.id]
        });
      }
    });

    return placedPieces;
  }

  private static findPlacementForPiece(
    asset: FurnitureAsset,
    roomWidth: number,
    roomHeight: number,
    existingPieces: PlacedFurniture[],
    seed: number
  ): PlacedFurniture | null {
    
    const validPositions: {x: number, y: number, score: number}[] = [];

    for (let y = 1; y <= roomHeight - asset.height - 1; y++) {
      for (let x = 1; x <= roomWidth - asset.width - 1; x++) {
        if (this.isValidPlacement(x, y, asset.width, asset.height, roomWidth, roomHeight, existingPieces)) {
          const score = this.calculatePlacementScore(x, y, asset, roomWidth, roomHeight);
          validPositions.push({ x, y, score });
        }
      }
    }

    if (validPositions.length === 0) return null;

    // Sort by score and add randomness
    validPositions.sort((a, b) => b.score - a.score);
    const topPositions = validPositions.filter(pos => pos.score >= validPositions[0].score - 10);
    const randomIndex = Math.floor(this.seedRandom(seed) * topPositions.length);
    const chosenPosition = topPositions[randomIndex];

    return {
      asset,
      x: chosenPosition.x,
      y: chosenPosition.y,
      rotation: 0,
      condition: 'good'
    };
  }

  private static isValidPlacement(
    x: number, y: number, width: number, height: number,
    roomWidth: number, roomHeight: number,
    existingPieces: PlacedFurniture[]
  ): boolean {
    // Check room boundaries
    if (x < 1 || y < 1 || x + width > roomWidth - 1 || y + height > roomHeight - 1) {
      return false;
    }

    // Check collision with existing pieces
    for (const piece of existingPieces) {
      if (!(x >= piece.x + piece.asset.width || x + width <= piece.x ||
            y >= piece.y + piece.asset.height || y + height <= piece.y)) {
        return false;
      }
    }

    return true;
  }

  private static calculatePlacementScore(
    x: number, y: number, asset: FurnitureAsset,
    roomWidth: number, roomHeight: number
  ): number {
    let score = 50;

    // Placement type preferences
    if (asset.placement === 'wall') {
      const nearWall = (x === 1 || x + asset.width === roomWidth - 1 || 
                       y === 1 || y + asset.height === roomHeight - 1);
      if (nearWall) score += 30;
    } else if (asset.placement === 'corner') {
      const inCorner = ((x <= 2 || x >= roomWidth - asset.width - 2) && 
                       (y <= 2 || y >= roomHeight - asset.height - 2));
      if (inCorner) score += 35;
    } else if (asset.placement === 'center') {
      const centerX = roomWidth / 2;
      const centerY = roomHeight / 2;
      const distanceFromCenter = Math.abs(x + asset.width/2 - centerX) + 
                                Math.abs(y + asset.height/2 - centerY);
      score += Math.max(0, 30 - distanceFromCenter * 3);
    }

    return score;
  }

  private static selectIndividualFurniture(
    roomFunction: RoomFunction,
    socialClass: SocialClass,
    roomWidth: number,
    roomHeight: number,
    budget: number,
    existingPieces: PlacedFurniture[],
    seed: number
  ): PlacedFurniture[] {
    
    const placedFurniture: PlacedFurniture[] = [];
    let currentBudget = budget;
    let currentSeed = seed;

    // Get essential furniture for room type
    const essentialCategories = this.getEssentialFurnitureForRoom(roomFunction);
    
    // Filter available furniture
    const availableFurniture = Array.from(this.furnitureAssetCatalog.values()).filter(asset => {
      return asset.roomTypes.includes(roomFunction) &&
             asset.socialClass.includes(socialClass) &&
             asset.cost <= currentBudget;
    });

    // Place essential furniture first
    essentialCategories.forEach(category => {
      const categoryFurniture = availableFurniture.filter(asset => asset.category === category);
      if (categoryFurniture.length === 0) return;

      // Sort by appropriateness score
      const scoredFurniture = categoryFurniture.map(asset => ({
        asset,
        score: this.calculateFurnitureScore(asset, roomFunction, socialClass)
      }));
      
      scoredFurniture.sort((a, b) => b.score - a.score);
      
      const topChoices = scoredFurniture.filter(f => f.score >= scoredFurniture[0].score - 10);
      const randomIndex = Math.floor(this.seedRandom(currentSeed++) * topChoices.length);
      const chosenAsset = topChoices[randomIndex].asset;

      const placement = this.findPlacementForPiece(
        chosenAsset, roomWidth, roomHeight, [...existingPieces, ...placedFurniture], currentSeed++
      );

      if (placement) {
        placedFurniture.push(placement);
        currentBudget -= chosenAsset.cost;
      }
    });

    return placedFurniture;
  }

  private static getEssentialFurnitureForRoom(roomFunction: RoomFunction): FurnitureCategory[] {
    switch (roomFunction) {
      case 'bedroom':
        return ['bed', 'storage'];
      case 'kitchen':
        return ['cooking', 'table', 'storage'];
      case 'living':
      case 'common':
        return ['table', 'seating'];
      case 'office':
      case 'study':
        return ['table', 'seating', 'storage'];
      case 'workshop':
        return ['work', 'table', 'storage'];
      case 'tavern_hall':
        return ['table', 'seating'];
      default:
        return ['storage'];
    }
  }

  private static calculateFurnitureScore(
    asset: FurnitureAsset,
    roomFunction: RoomFunction,
    socialClass: SocialClass
  ): number {
    let score = 50;

    // Material quality alignment with social class
    const socialIndex = ['poor', 'common', 'wealthy', 'noble'].indexOf(socialClass);
    
    if (asset.material.includes('walnut') && socialIndex >= 2) score += 20;
    if (asset.material.includes('gold') && socialIndex === 3) score += 25;
    if (asset.material.includes('ashen') && socialIndex <= 1) score += 15;

    // Room function specific bonuses
    if (roomFunction === 'bedroom' && asset.category === 'bed') score += 30;
    if (roomFunction === 'kitchen' && asset.category === 'cooking') score += 30;
    if ((roomFunction === 'office' || roomFunction === 'study') && asset.name.includes('Desk')) score += 25;

    // Comfort and durability considerations
    score += asset.comfort * 0.3;
    score += asset.durability * 0.2;

    return score;
  }

  private static getMaterialDurability(material: FurnitureMaterial): number {
    if (material.includes('metal')) return 90;
    if (material === 'stone') return 95;
    if (material.includes('walnut') || material.includes('dark')) return 80;
    if (material.includes('wood')) return 70;
    return 60;
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Public accessor methods
  static getAllFurnitureAssets(): FurnitureAsset[] {
    return Array.from(this.furnitureAssetCatalog.values());
  }

  static getFurnitureAssetById(id: string): FurnitureAsset | null {
    return this.furnitureAssetCatalog.get(id) || null;
  }

  static getFurnitureByCategory(category: FurnitureCategory): FurnitureAsset[] {
    return Array.from(this.furnitureAssetCatalog.values()).filter(asset => asset.category === category);
  }

  static getFurnitureBySocialClass(socialClass: SocialClass): FurnitureAsset[] {
    return Array.from(this.furnitureAssetCatalog.values()).filter(asset => 
      asset.socialClass.includes(socialClass)
    );
  }

  static getAllFurnitureSets(): FurnitureSet[] {
    return Array.from(this.furnitureSets.values());
  }

  static getFurnitureSetById(id: string): FurnitureSet | null {
    return this.furnitureSets.get(id) || null;
  }
}