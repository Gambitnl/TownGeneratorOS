import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TileInspector } from './TileInspector';
import { TileType } from '@/types/tile';

describe('TileInspector', () => {
    it('should render null when tile is null', () => {
        const { container } = render(<TileInspector tile={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render null when visible is false', () => {
        const tile = { x: 0, y: 0, type: TileType.Grass, rotation: 0 };
        const { container } = render(<TileInspector tile={tile} visible={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render tile information when tile is provided', () => {
        const tile = { x: 5, y: 10, type: TileType.Road, rotation: 90, variant: 'straight' };
        render(<TileInspector tile={tile} />);

        expect(screen.getByText('Tile Inspector')).toBeTruthy();
        expect(screen.getByText('(5, 10)')).toBeTruthy();
        expect(screen.getByText('road')).toBeTruthy();
        expect(screen.getByText('straight')).toBeTruthy();
        expect(screen.getByText('90°')).toBeTruthy();
    });

    it('should not render variant when not provided', () => {
        const tile = { x: 0, y: 0, type: TileType.Grass, rotation: 0 };
        render(<TileInspector tile={tile} />);

        expect(screen.queryByText('Variant:')).toBeNull();
    });

    it('should render at specified position', () => {
        const tile = { x: 0, y: 0, type: TileType.Grass, rotation: 0 };
        const { container } = render(
            <TileInspector tile={tile} position={{ x: 100, y: 200 }} />
        );

        const inspector = container.firstChild as HTMLElement;
        expect(inspector.style.left).toBe('100px');
        expect(inspector.style.top).toBe('200px');
    });

    it('should render close button when onClose is provided', () => {
        const tile = { x: 0, y: 0, type: TileType.Grass, rotation: 0 };
        const onClose = () => { };
        render(<TileInspector tile={tile} onClose={onClose} />);

        expect(screen.getByLabelText('Close')).toBeTruthy();
    });

    it('should not render close button when onClose is not provided', () => {
        const tile = { x: 0, y: 0, type: TileType.Grass, rotation: 0 };
        render(<TileInspector tile={tile} />);

        expect(screen.queryByLabelText('Close')).toBeNull();
    });

    it('should display different tile types correctly', () => {
        const tiles = [
            { x: 0, y: 0, type: TileType.Grass, rotation: 0 },
            { x: 1, y: 1, type: TileType.Road, rotation: 0 },
            { x: 2, y: 2, type: TileType.House, rotation: 0 },
            { x: 3, y: 3, type: TileType.Water, rotation: 0 }
        ];

        for (const tile of tiles) {
            const { unmount } = render(<TileInspector tile={tile} />);
            expect(screen.getByText(tile.type)).toBeTruthy();
            unmount();
        }
    });
});
