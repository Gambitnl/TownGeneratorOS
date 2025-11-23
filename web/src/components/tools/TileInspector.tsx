import React from 'react';
import { Tile } from '@/types/tile';

export interface TileInspectorProps {
    tile: Tile | null;
    position?: {
        x: number;
        y: number;
    };
    visible?: boolean;
    onClose?: () => void;
}

export const TileInspector: React.FC<TileInspectorProps> = ({
    tile,
    position = { x: 10, y: 10 },
    visible = true,
    onClose
}) => {
    if (!visible || !tile) {
        return null;
    }

    const style: React.CSSProperties = {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '2px solid #444',
        fontFamily: 'monospace',
        fontSize: '13px',
        zIndex: 1000,
        minWidth: '200px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)'
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid #555'
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#00ff88'
    };

    const closeButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '0',
        lineHeight: '1',
        opacity: 0.7,
        transition: 'opacity 0.2s'
    };

    const rowStyle: React.CSSProperties = {
        marginBottom: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px'
    };

    const labelStyle: React.CSSProperties = {
        color: '#aaa',
        fontWeight: 'normal'
    };

    const valueStyle: React.CSSProperties = {
        color: '#fff',
        fontWeight: 'bold'
    };

    const getTileTypeColor = (type: string): string => {
        switch (type) {
            case 'grass': return '#4CAF50';
            case 'road': return '#757575';
            case 'house': return '#FF9800';
            case 'water': return '#2196F3';
            case 'wall': return '#9E9E9E';
            default: return '#fff';
        }
    };

    return (
        <div style={style}>
            <div style={headerStyle}>
                <div style={titleStyle}>Tile Inspector</div>
                {onClose && (
                    <button
                        style={closeButtonStyle}
                        onClick={onClose}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                        aria-label="Close"
                    >
                        ×
                    </button>
                )}
            </div>

            <div style={rowStyle}>
                <span style={labelStyle}>Position:</span>
                <span style={valueStyle}>({tile.x}, {tile.y})</span>
            </div>

            <div style={rowStyle}>
                <span style={labelStyle}>Type:</span>
                <span style={{ ...valueStyle, color: getTileTypeColor(tile.type) }}>
                    {tile.type}
                </span>
            </div>

            {tile.variant && (
                <div style={rowStyle}>
                    <span style={labelStyle}>Variant:</span>
                    <span style={valueStyle}>{tile.variant}</span>
                </div>
            )}

            <div style={rowStyle}>
                <span style={labelStyle}>Rotation:</span>
                <span style={valueStyle}>{tile.rotation}°</span>
            </div>
        </div>
    );
};

export default TileInspector;
