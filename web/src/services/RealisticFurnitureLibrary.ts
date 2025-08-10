import { BuildingType, SocialClass } from './StandaloneBuildingGenerator';
import { RoomFunction } from './FloorMaterialSystem';

export interface FurnitureAsset {
  id: string;
  name: string;
  category: 'seating' | 'table' | 'storage' | 'cooking' | 'bed' | 'work' | 'decor';
  assetPath: string;
  width: number;
  height: number;
  orientation: 0 | 90 | 180 | 270; // degrees clockwise from north
  socialClassRequirement: SocialClass[];
  roomTypes: RoomFunction[];
  priority: number; // 1 = essential, 2 = important, 3 = nice-to-have
  interactionPoints?: Array<{
    x: number; // relative to furniture origin
    y: number;
    type: 'sit' | 'use' | 'access';
    facing: 0 | 90 | 180 | 270; // direction person should face
  }>;
  spacingRequirements: {
    front: number; // tiles needed in front
    back: number;
    left: number;
    right: number;
  };
}

export interface PlacedFurniture {
  furniture: FurnitureAsset;
  x: number;
  y: number;
  orientation: number;
  roomId: string;
}

export class RealisticFurnitureLibrary {
  private static assets: FurnitureAsset[] = [
    // BEDS
    {
      id: 'bed_single',
      name: 'Single Bed',
      category: 'bed',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Bedding/Arranged_Bedding/Arranged_Bed_Wood_Light_A1_1x2.png',
      width: 1,
      height: 2,
      orientation: 0,
      socialClassRequirement: ['poor', 'common'],
      roomTypes: ['bedroom'],
      priority: 1,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },
    {
      id: 'bed_double',
      name: 'Double Bed',
      category: 'bed',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Bedding/Arranged_Bedding/Arranged_Bed_Wood_Light_A6_2x2.png',
      width: 2,
      height: 2,
      orientation: 0,
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      roomTypes: ['bedroom'],
      priority: 1,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    // CHAIRS (with different orientations for table placement)
    {
      id: 'chair_north',
      name: 'Chair (North)',
      category: 'seating',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Seating/Chairs/Chair_Wood_Light_A_1x1.png',
      width: 1,
      height: 1,
      orientation: 0, // facing north
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['living', 'kitchen', 'common', 'tavern_hall', 'office'],
      priority: 2,
      interactionPoints: [{ x: 0, y: 0, type: 'sit', facing: 0 }],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },
    {
      id: 'chair_south',
      name: 'Chair (South)',
      category: 'seating',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Seating/Chairs/Chair_Wood_Light_B_1x1.png',
      width: 1,
      height: 1,
      orientation: 180, // facing south
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['living', 'kitchen', 'common', 'tavern_hall', 'office'],
      priority: 2,
      interactionPoints: [{ x: 0, y: 0, type: 'sit', facing: 180 }],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },
    {
      id: 'chair_east',
      name: 'Chair (East)',
      category: 'seating',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Seating/Chairs/Chair_Wood_Light_C_1x1.png',
      width: 1,
      height: 1,
      orientation: 90, // facing east
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['living', 'kitchen', 'common', 'tavern_hall', 'office'],
      priority: 2,
      interactionPoints: [{ x: 0, y: 0, type: 'sit', facing: 90 }],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },
    {
      id: 'chair_west',
      name: 'Chair (West)',
      category: 'seating',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Seating/Chairs/Chair_Wood_Light_D_1x1.png',
      width: 1,
      height: 1,
      orientation: 270, // facing west
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['living', 'kitchen', 'common', 'tavern_hall', 'office'],
      priority: 2,
      interactionPoints: [{ x: 0, y: 0, type: 'sit', facing: 270 }],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    // TABLES
    {
      id: 'table_round_small',
      name: 'Small Round Table',
      category: 'table',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Tables/Round_Tables/Table_Round_Wood_Light_D1_1x1.png',
      width: 1,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['living', 'kitchen', 'common', 'tavern_hall'],
      priority: 2,
      interactionPoints: [
        { x: 0, y: -1, type: 'use', facing: 180 }, // north side
        { x: 1, y: 0, type: 'use', facing: 270 },  // east side
        { x: 0, y: 1, type: 'use', facing: 0 },    // south side
        { x: -1, y: 0, type: 'use', facing: 90 }   // west side
      ],
      spacingRequirements: { front: 1, back: 1, left: 1, right: 1 }
    },
    {
      id: 'table_round_large',
      name: 'Large Round Table',
      category: 'table',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Tables/Round_Tables/Table_Round_Wood_Light_A1_2x2.png',
      width: 2,
      height: 2,
      orientation: 0,
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      roomTypes: ['living', 'common', 'tavern_hall'],
      priority: 2,
      interactionPoints: [
        { x: 0, y: -1, type: 'use', facing: 180 }, // north side
        { x: 1, y: -1, type: 'use', facing: 180 },
        { x: 2, y: 0, type: 'use', facing: 270 },  // east side
        { x: 2, y: 1, type: 'use', facing: 270 },
        { x: 1, y: 2, type: 'use', facing: 0 },    // south side
        { x: 0, y: 2, type: 'use', facing: 0 },
        { x: -1, y: 1, type: 'use', facing: 90 },  // west side
        { x: -1, y: 0, type: 'use', facing: 90 }
      ],
      spacingRequirements: { front: 1, back: 1, left: 1, right: 1 }
    },
    {
      id: 'table_rectangle',
      name: 'Rectangular Table',
      category: 'table',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Tables/Rectangle_Tables/Table_Rectangle_Wood_Light_E_2x1.png',
      width: 2,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['living', 'kitchen', 'common', 'workshop'],
      priority: 2,
      interactionPoints: [
        { x: 0, y: -1, type: 'use', facing: 180 }, // north side
        { x: 1, y: -1, type: 'use', facing: 180 },
        { x: 0, y: 1, type: 'use', facing: 0 },    // south side
        { x: 1, y: 1, type: 'use', facing: 0 }
      ],
      spacingRequirements: { front: 1, back: 1, left: 0, right: 0 }
    },

    // BENCHES (Medieval alternative to chairs)
    {
      id: 'bench_long',
      name: 'Long Bench',
      category: 'seating',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Seating/Benches/Bench_Wood_Light_C1_3x1.png',
      width: 3,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['living', 'common', 'tavern_hall'],
      priority: 2,
      interactionPoints: [
        { x: 0, y: 0, type: 'sit', facing: 0 },
        { x: 1, y: 0, type: 'sit', facing: 0 },
        { x: 2, y: 0, type: 'sit', facing: 0 }
      ],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    // COOKING EQUIPMENT
    {
      id: 'cooking_oven',
      name: 'Brick Oven',
      category: 'cooking',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Cooking_Appliances/Oven_Brick_Earthy_A1_2x2.png',
      width: 2,
      height: 2,
      orientation: 0,
      socialClassRequirement: ['common', 'wealthy', 'noble'],
      roomTypes: ['kitchen'],
      priority: 1,
      interactionPoints: [{ x: 1, y: 2, type: 'use', facing: 0 }], // front access
      spacingRequirements: { front: 2, back: 0, left: 0, right: 0 }
    },
    {
      id: 'cooking_pit',
      name: 'Cooking Pit',
      category: 'cooking',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Cooking_Appliances/Cooking_Pit_Brick_Earthy_A1_1x1.png',
      width: 1,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['poor', 'common'],
      roomTypes: ['kitchen'],
      priority: 1,
      spacingRequirements: { front: 1, back: 0, left: 1, right: 1 }
    },

    // STORAGE
    {
      id: 'chest',
      name: 'Storage Chest',
      category: 'storage',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Cupboards_and_Wardrobes/Cupboard_Wood_Light_A1_2x1.png',
      width: 2,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['bedroom', 'storage', 'living'],
      priority: 2,
      interactionPoints: [{ x: 1, y: 1, type: 'access', facing: 0 }],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },
    {
      id: 'shelf',
      name: 'Wall Shelf',
      category: 'storage',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Shelves/Shelf_Wood_Light_A_2x1.png',
      width: 2,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['poor', 'common', 'wealthy', 'noble'],
      roomTypes: ['kitchen', 'storage', 'workshop'],
      priority: 2,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },
    {
      id: 'bookshelf',
      name: 'Bookshelf',
      category: 'storage',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Shelves/Bookshelves/Bookshelf_Wood_Light_A_2x1.png',
      width: 2,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['office', 'living'],
      priority: 2,
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    // WORK FURNITURE
    {
      id: 'desk',
      name: 'Writing Desk',
      category: 'work',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Tables/Desks/Desk_Rectangle_Wood_Light_A1_2x1.png',
      width: 2,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['office'],
      priority: 1,
      interactionPoints: [{ x: 1, y: 1, type: 'use', facing: 0 }],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    },

    // LUXURY FURNITURE
    {
      id: 'armchair',
      name: 'Armchair',
      category: 'seating',
      assetPath: 'Assets/Core_Mapmaking_Pack_Part1_v1.03/FA_Assets/!Core_Settlements/Furniture/Seating/Armchairs/Armchair_Fabric_Brown_Wood_Light_C1_1x1.png',
      width: 1,
      height: 1,
      orientation: 0,
      socialClassRequirement: ['wealthy', 'noble'],
      roomTypes: ['living', 'office'],
      priority: 3,
      interactionPoints: [{ x: 0, y: 0, type: 'sit', facing: 0 }],
      spacingRequirements: { front: 1, back: 0, left: 0, right: 0 }
    }
  ];

  static getFurnitureForRoom(
    roomFunction: RoomFunction,
    roomWidth: number,
    roomHeight: number,
    socialClass: SocialClass,
    seed: number
  ): PlacedFurniture[] {
    const placedFurniture: PlacedFurniture[] = [];
    const roomArea = roomWidth * roomHeight;
    const usableArea = (roomWidth - 2) * (roomHeight - 2); // Account for walls

    // Filter furniture appropriate for this room and social class
    const suitableFurniture = this.assets.filter(asset =>
      asset.roomTypes.includes(roomFunction) &&
      asset.socialClassRequirement.includes(socialClass)
    );

    // Sort by priority (essential first)
    suitableFurniture.sort((a, b) => a.priority - b.priority);

    // Track occupied tiles
    const occupiedTiles: Set<string> = new Set();

    // Place furniture by priority
    suitableFurniture.forEach((furniture, index) => {
      if (placedFurniture.length >= 8) return; // Limit furniture per room

      const placement = this.findBestPlacement(
        furniture,
        roomWidth,
        roomHeight,
        occupiedTiles,
        placedFurniture,
        seed + index
      );

      if (placement) {
        placedFurniture.push(placement);
        this.markOccupiedTiles(placement, occupiedTiles);
      }
    });

    return placedFurniture;
  }

  private static findBestPlacement(
    furniture: FurnitureAsset,
    roomWidth: number,
    roomHeight: number,
    occupiedTiles: Set<string>,
    existingFurniture: PlacedFurniture[],
    seed: number
  ): PlacedFurniture | null {
    const attempts: Array<{x: number, y: number, score: number}> = [];

    // Try different positions in the room (avoiding walls)
    for (let x = 1; x < roomWidth - furniture.width - 1; x++) {
      for (let y = 1; y < roomHeight - furniture.height - 1; y++) {
        if (this.canPlaceFurniture(furniture, x, y, roomWidth, roomHeight, occupiedTiles)) {
          const score = this.scorePlacement(furniture, x, y, existingFurniture, roomWidth, roomHeight);
          attempts.push({ x, y, score });
        }
      }
    }

    if (attempts.length === 0) return null;

    // Sort by score and add some randomness
    attempts.sort((a, b) => b.score - a.score);
    const bestAttempts = attempts.slice(0, Math.min(3, attempts.length));
    const chosen = bestAttempts[Math.floor(this.seedRandom(seed) * bestAttempts.length)];

    // Determine orientation based on furniture type and placement
    const orientation = this.determineOptimalOrientation(
      furniture,
      chosen.x,
      chosen.y,
      existingFurniture,
      roomWidth,
      roomHeight,
      seed
    );

    return {
      furniture,
      x: chosen.x,
      y: chosen.y,
      orientation,
      roomId: 'room_' + seed
    };
  }

  private static canPlaceFurniture(
    furniture: FurnitureAsset,
    x: number,
    y: number,
    roomWidth: number,
    roomHeight: number,
    occupiedTiles: Set<string>
  ): boolean {
    // Check if furniture fits in room
    if (x + furniture.width >= roomWidth - 1 || y + furniture.height >= roomHeight - 1) {
      return false;
    }

    // Check if any tiles are occupied
    for (let fx = 0; fx < furniture.width; fx++) {
      for (let fy = 0; fy < furniture.height; fy++) {
        if (occupiedTiles.has(`${x + fx},${y + fy}`)) {
          return false;
        }
      }
    }

    // Check spacing requirements
    const spacing = furniture.spacingRequirements;
    for (let sx = x - spacing.left; sx < x + furniture.width + spacing.right; sx++) {
      for (let sy = y - spacing.back; sy < y + furniture.height + spacing.front; sy++) {
        if (sx > 0 && sx < roomWidth - 1 && sy > 0 && sy < roomHeight - 1) {
          if (occupiedTiles.has(`${sx},${sy}`)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private static scorePlacement(
    furniture: FurnitureAsset,
    x: number,
    y: number,
    existingFurniture: PlacedFurniture[],
    roomWidth: number,
    roomHeight: number
  ): number {
    let score = 100; // Base score

    // Prefer wall placement for storage items
    if (furniture.category === 'storage') {
      const nearWall = (x === 1 || x === roomWidth - furniture.width - 2 || 
                       y === 1 || y === roomHeight - furniture.height - 2);
      if (nearWall) score += 50;
    }

    // Prefer central placement for tables
    if (furniture.category === 'table') {
      const centerX = roomWidth / 2;
      const centerY = roomHeight / 2;
      const distanceFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
      score -= distanceFromCenter * 10;
    }

    // Beds prefer corners or walls
    if (furniture.category === 'bed') {
      const nearCorner = (x <= 2 && y <= 2) || (x >= roomWidth - furniture.width - 2 && y <= 2);
      if (nearCorner) score += 40;
    }

    // Penalize crowding
    existingFurniture.forEach(existing => {
      const distance = Math.abs(existing.x - x) + Math.abs(existing.y - y);
      if (distance < 3) score -= 20;
    });

    return score;
  }

  private static determineOptimalOrientation(
    furniture: FurnitureAsset,
    x: number,
    y: number,
    existingFurniture: PlacedFurniture[],
    roomWidth: number,
    roomHeight: number,
    seed: number
  ): number {
    // Chairs should face tables
    if (furniture.category === 'seating' && furniture.id.includes('chair')) {
      const nearbyTables = existingFurniture.filter(f => 
        f.furniture.category === 'table' && 
        Math.abs(f.x - x) <= 2 && Math.abs(f.y - y) <= 2
      );

      if (nearbyTables.length > 0) {
        const table = nearbyTables[0];
        // Calculate direction to face table
        const dx = table.x - x;
        const dy = table.y - y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? 90 : 270; // Face east or west
        } else {
          return dy > 0 ? 180 : 0; // Face south or north
        }
      }
    }

    // Beds face away from doors (simplified - face north)
    if (furniture.category === 'bed') {
      return 0;
    }

    // Desks face into room (away from walls)
    if (furniture.category === 'work') {
      if (x === 1) return 90; // Against west wall, face east
      if (x >= roomWidth - furniture.width - 2) return 270; // Against east wall, face west
      if (y === 1) return 180; // Against north wall, face south
      return 0; // Default face north
    }

    // Default orientation
    return furniture.orientation;
  }

  private static markOccupiedTiles(placement: PlacedFurniture, occupiedTiles: Set<string>): void {
    const { furniture, x, y } = placement;
    for (let fx = 0; fx < furniture.width; fx++) {
      for (let fy = 0; fy < furniture.height; fy++) {
        occupiedTiles.add(`${x + fx},${y + fy}`);
      }
    }

    // Also mark spacing requirements
    const spacing = furniture.spacingRequirements;
    for (let sx = x - spacing.left; sx < x + furniture.width + spacing.right; sx++) {
      for (let sy = y - spacing.back; sy < y + furniture.height + spacing.front; sy++) {
        occupiedTiles.add(`${sx},${sy}`);
      }
    }
  }

  static getAssetForFurniture(furnitureId: string, socialClass: SocialClass): FurnitureAsset | null {
    const baseAsset = this.assets.find(asset => asset.id === furnitureId);
    if (!baseAsset || !baseAsset.socialClassRequirement.includes(socialClass)) {
      return null;
    }

    // Upgrade asset path based on social class (wood types)
    let assetPath = baseAsset.assetPath;
    switch (socialClass) {
      case 'poor':
        assetPath = assetPath.replace('Wood_Light', 'Wood_Ashen');
        break;
      case 'common':
        assetPath = assetPath.replace('Wood_Light', 'Wood_Light');
        break;
      case 'wealthy':
        assetPath = assetPath.replace('Wood_Light', 'Wood_Walnut');
        break;
      case 'noble':
        assetPath = assetPath.replace('Wood_Light', 'Wood_Dark');
        break;
    }

    return { ...baseAsset, assetPath };
  }

  private static seedRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}