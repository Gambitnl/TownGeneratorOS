import React from 'react';
import { CitySizeButton } from './CitySizeButton';

interface ControlPanelProps {
    size: number;
    seed: number;
    onSizeChange: (size: number) => void;
    onSeedChange: (seed: string) => void;
    onGenerate: (size: number) => void;
    onRegenerate: () => void;
    onApplyCustom: () => void;
    onExport: () => void;
    onExportJSON: () => void;
    onShare: () => void;
    showGrid: boolean;
    showZones: boolean;
    showWater: boolean;
    onToggleLayer: (layer: 'grid' | 'zones' | 'water') => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    size,
    seed,
    onSizeChange,
    onSeedChange,
    onGenerate,
    onRegenerate,
    onApplyCustom,
    onExport,
    onExportJSON,
    onShare,
    showGrid,
    showZones,
    showWater,
    onToggleLayer
}) => {
    return (
        <div className="control-panel slide-in-right">
            <div className="control-section">
                <h3 className="control-section-title">Quick Generate</h3>
                <CitySizeButton label="Small Town" minSize={6} maxSize={10} onGenerate={onGenerate} />
                <CitySizeButton label="Large Town" minSize={10} maxSize={15} onGenerate={onGenerate} />
                <CitySizeButton label="Small City" minSize={15} maxSize={24} onGenerate={onGenerate} />
                <CitySizeButton label="Large City" minSize={24} maxSize={40} onGenerate={onGenerate} />
            </div>

            <div className="control-divider"></div>

            <div className="control-section">
                <h3 className="control-section-title">Layers</h3>
                <div className="layer-toggles">
                    <label className="checkbox-label" style={{ display: 'block', marginBottom: '8px' }}>
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={() => onToggleLayer('grid')}
                            style={{ marginRight: '8px' }}
                        />
                        Show Grid
                    </label>
                    <label className="checkbox-label" style={{ display: 'block', marginBottom: '8px' }}>
                        <input
                            type="checkbox"
                            checked={showZones}
                            onChange={() => onToggleLayer('zones')}
                            style={{ marginRight: '8px' }}
                        />
                        Show Zones
                    </label>
                    <label className="checkbox-label" style={{ display: 'block', marginBottom: '8px' }}>
                        <input
                            type="checkbox"
                            checked={showWater}
                            onChange={() => onToggleLayer('water')}
                            style={{ marginRight: '8px' }}
                        />
                        Show Water
                    </label>
                </div>
            </div>

            <div className="control-divider"></div>

            <div className="control-section">
                <h3 className="control-section-title">Customize</h3>

                <div className="input-group">
                    <label className="input-label">
                        Size: <span className="input-value">{size}</span>
                    </label>
                    <input
                        type="range"
                        className="input-range"
                        min="6"
                        max="40"
                        value={size}
                        onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Seed</label>
                    <input
                        type="number"
                        className="input-field"
                        value={seed}
                        onChange={(e) => onSeedChange(e.target.value)}
                        placeholder="Enter seed number"
                    />
                </div>

                <button className="btn btn-primary" onClick={onApplyCustom}>
                    Generate Custom
                </button>
                <button className="btn btn-secondary" onClick={onRegenerate}>
                    Regenerate
                </button>
            </div>

            <div className="control-divider"></div>

            <div className="control-section">
                <h3 className="control-section-title">Actions</h3>
                <button className="btn btn-secondary btn-icon" onClick={onExport}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Export PNG
                </button>
                <button className="btn btn-secondary btn-icon" onClick={onExportJSON}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Export VTT (JSON)
                </button>
                <button className="btn btn-secondary btn-icon" onClick={onShare}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share URL
                </button>
            </div>
        </div>
    );
};
