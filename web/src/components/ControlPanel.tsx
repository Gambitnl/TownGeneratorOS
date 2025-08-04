import React, { useState } from 'react';
import { Button } from './Button';
import { Random } from '../utils/Random';

interface ControlPanelProps {
  onGenerate: (size: number) => void;
  isLoading: boolean;
}

const panelStyles: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  right: '2rem',
  transform: 'translateY(-50%)',
  background: 'var(--card-bg)',
  backdropFilter: 'blur(10px)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-medium)',
  padding: '1.5rem',
  minWidth: '280px',
  maxWidth: '320px',
  zIndex: 1000,
};

const titleStyles: React.CSSProperties = {
  color: 'var(--text-accent)',
  fontSize: '1.25rem',
  fontWeight: '700',
  marginBottom: '1rem',
  textAlign: 'center',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
};

const sectionStyles: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const sectionTitleStyles: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontSize: '1rem',
  fontWeight: '600',
  marginBottom: '0.75rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
};

const buttonGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '0.75rem',
};

const seedInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--secondary-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color var(--transition-fast)',
};

const seedContainerStyles: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
};

const infoTextStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  fontStyle: 'italic',
  textAlign: 'center',
  marginTop: '1rem',
  lineHeight: 1.4,
};

const townSizes = [
  { label: 'Village', minSize: 4, maxSize: 8, icon: '🏘️', description: 'Small settlement' },
  { label: 'Town', minSize: 8, maxSize: 15, icon: '🏪', description: 'Growing community' },
  { label: 'City', minSize: 15, maxSize: 25, icon: '🏰', description: 'Bustling metropolis' },
  { label: 'Capital', minSize: 25, maxSize: 40, icon: '👑', description: 'Grand stronghold' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, isLoading }) => {
  const [customSeed, setCustomSeed] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSizeGenerate = (minSize: number, maxSize: number) => {
    if (isLoading) return;
    
    // Set custom seed if provided
    if (customSeed.trim()) {
      const seedNum = parseInt(customSeed.trim()) || customSeed.trim().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      Random.reset(seedNum);
    }
    
    const size = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
    onGenerate(size);
  };

  const handleRandomGenerate = () => {
    if (isLoading) return;
    
    const randomSeed = Math.floor(Math.random() * 100000);
    Random.reset(randomSeed);
    setCustomSeed(randomSeed.toString());
    
    const randomSize = 6 + Math.floor(Math.random() * 30);
    onGenerate(randomSize);
  };

  return (
    <div style={panelStyles} className="fade-in control-panel">
      <h3 style={titleStyles} className="control-panel-title">Town Generator</h3>
      
      <div style={sectionStyles}>
        <h4 style={sectionTitleStyles} className="control-panel-section-title">Settlement Size</h4>
        <div style={buttonGridStyles} className="button-grid">
          {townSizes.map((town, index) => (
            <Button
              key={index}
              label={`${town.icon} ${town.label}`}
              onClick={() => handleSizeGenerate(town.minSize, town.maxSize)}
              variant={index === 0 ? 'secondary' : index === townSizes.length - 1 ? 'accent' : 'primary'}
              size="medium"
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      <div style={sectionStyles}>
        <h4 style={sectionTitleStyles} className="control-panel-section-title">Quick Actions</h4>
        <div style={buttonGridStyles} className="button-grid">
          <Button
            label="🎲 Random Town"
            onClick={handleRandomGenerate}
            variant="accent"
            size="medium"
            disabled={isLoading}
          />
        </div>
      </div>

      <div style={sectionStyles}>
        <h4 style={sectionTitleStyles} className="control-panel-section-title">
          <span 
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            ⚙️ Advanced {showAdvanced ? '▼' : '▶'}
          </span>
        </h4>
        
        {showAdvanced && (
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              color: 'var(--text-secondary)' 
            }}>
              Custom Seed:
            </label>
            <div style={seedContainerStyles}>
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Enter seed..."
                style={seedInputStyles}
                onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              <Button
                label="🔄"
                onClick={() => setCustomSeed(Math.floor(Math.random() * 100000).toString())}
                variant="secondary"
                size="small"
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      <div style={infoTextStyles}>
        Each generation creates a unique medieval settlement with procedurally generated districts, roads, and landmarks.
      </div>
    </div>
  );
};