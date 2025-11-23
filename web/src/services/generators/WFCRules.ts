import { TileType } from '@/types/tile';

export type Socket = string;

export interface TileDefinition {
    id: string; // Unique ID for internal WFC use (e.g. "road_straight_0")
    type: TileType;
    variant: string;
    rotation: number; // 0, 90, 180, 270
    weight: number;
    sockets: {
        top: Socket;
        right: Socket;
        bottom: Socket;
        left: Socket;
    };
}

// Base definitions to be expanded into full rotated set
interface BaseTileDefinition {
    type: TileType;
    variant: string;
    weight: number;
    sockets: {
        top: Socket;
        right: Socket;
        bottom: Socket;
        left: Socket;
    };
    rotatable: boolean; // If true, generates 90, 180, 270 versions
    symmetry?: 'X' | 'I' | 'L' | 'T'; // Optimization hint for rotation redundancy
}

const BASE_DEFINITIONS: BaseTileDefinition[] = [
    {
        type: TileType.Grass,
        variant: 'default',
        weight: 100,
        sockets: { top: 'g', right: 'g', bottom: 'g', left: 'g' },
        rotatable: false,
        symmetry: 'X'
    },
    {
        type: TileType.Road,
        variant: 'straight',
        weight: 10,
        sockets: { top: 'r', right: 'g', bottom: 'r', left: 'g' }, // Vertical
        rotatable: true,
        symmetry: 'I'
    },
    {
        type: TileType.Road,
        variant: 'corner',
        weight: 10,
        sockets: { top: 'g', right: 'r', bottom: 'r', left: 'g' }, // Top-Right? No, Bottom-Right connection?
        // Let's visualize:
        //   g
        // g   r
        //   r
        // This connects Right and Bottom.
        rotatable: true,
        symmetry: 'L'
    },
    {
        type: TileType.Road,
        variant: 'tee',
        weight: 5,
        sockets: { top: 'g', right: 'r', bottom: 'r', left: 'r' }, // T pointing Left (Top is blocked)
        // Wait, T usually connects 3 ways.
        //   g
        // r   r
        //   r
        // Connects Right, Bottom, Left.
        rotatable: true,
        symmetry: 'T'
    },
    {
        type: TileType.Road,
        variant: 'cross',
        weight: 1,
        sockets: { top: 'r', right: 'r', bottom: 'r', left: 'r' },
        rotatable: false,
        symmetry: 'X'
    }
];

export function generateTileDefinitions(): TileDefinition[] {
    const definitions: TileDefinition[] = [];

    for (const base of BASE_DEFINITIONS) {
        // 0 degrees
        definitions.push({
            id: `${base.type}_${base.variant}_0`,
            type: base.type,
            variant: base.variant,
            rotation: 0,
            weight: base.weight,
            sockets: base.sockets
        });

        if (base.rotatable) {
            // 90 degrees
            // Rotated 90 deg clockwise:
            // Top -> Right
            // Right -> Bottom
            // Bottom -> Left
            // Left -> Top
            const s90 = {
                top: base.sockets.left,
                right: base.sockets.top,
                bottom: base.sockets.right,
                left: base.sockets.bottom
            };
            definitions.push({
                id: `${base.type}_${base.variant}_90`,
                type: base.type,
                variant: base.variant,
                rotation: 90,
                weight: base.weight,
                sockets: s90
            });

            if (base.symmetry !== 'I') { // 'I' symmetry means 180 is same as 0, 270 same as 90
                // 180 degrees
                const s180 = {
                    top: s90.left,
                    right: s90.top,
                    bottom: s90.right,
                    left: s90.bottom
                };
                definitions.push({
                    id: `${base.type}_${base.variant}_180`,
                    type: base.type,
                    variant: base.variant,
                    rotation: 180,
                    weight: base.weight,
                    sockets: s180
                });

                // 270 degrees
                const s270 = {
                    top: s180.left,
                    right: s180.top,
                    bottom: s180.right,
                    left: s180.bottom
                };
                definitions.push({
                    id: `${base.type}_${base.variant}_270`,
                    type: base.type,
                    variant: base.variant,
                    rotation: 270,
                    weight: base.weight,
                    sockets: s270
                });
            }
        }
    }

    return definitions;
}
