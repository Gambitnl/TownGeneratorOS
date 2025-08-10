import React, { useState } from 'react';
import { TileGlossary } from './TileGlossary';

interface TopBarMenuProps {
  onGenerate: (size: string) => void;
  onRandomGenerate: () => void;
  isLoading: boolean;
  proceduralBuildings?: boolean;
  onProceduralBuildingsChange?: (enabled: boolean) => void;
}

const menuItems = [
  {
    id: 'buildings',
    label: 'Buildings',
    icon: '🏠',
    options: [
      { id: 'building-house_small', label: 'Small House', description: 'Cozy residential dwelling' },
      { id: 'building-house_large', label: 'Large House', description: 'Spacious family home' },
      { id: 'building-tavern', label: 'Tavern', description: 'Inn with rooms and common area' },
      { id: 'building-blacksmith', label: 'Blacksmith', description: 'Workshop with forge' },
      { id: 'building-shop', label: 'Shop', description: 'General goods store' },
      { id: 'building-market_stall', label: 'Market Stall', description: 'Small vendor booth' }
    ]
  },
  {
    id: 'villages',
    label: 'Villages',
    icon: '🏡',
    options: [
      { id: 'hamlet', label: 'Hamlet', description: 'Tiny rural settlement (12-18 buildings)' },
      { id: 'village', label: 'Village', description: 'Small farming community (20-30 buildings)' },
      { id: 'village-coastal', label: 'Fishing Village', description: 'Coastal settlement focused on fishing' },
      { id: 'village-forest', label: 'Forest Village', description: 'Woodland community of woodcutters' }
    ]
  },
  {
    id: 'towns',
    label: 'Towns',
    icon: '🏘️',
    options: [
      { id: 'town', label: 'Town', description: 'Growing settlement with market (10-15 districts)' }
    ],
    disabled: true
  },
  {
    id: 'cities',
    label: 'Cities',
    icon: '🏙️',
    options: [
      { id: 'city', label: 'City', description: 'Large walled city (18-25 districts)' }
    ],
    disabled: true
  },
  {
    id: 'citadels',
    label: 'Citadels',
    icon: '🏰',
    options: [
      { id: 'capital', label: 'Citadel', description: 'Massive fortress city (28-40 districts)' }
    ],
    disabled: true
  }
];

export const TopBarMenu: React.FC<TopBarMenuProps> = ({
  onGenerate,
  onRandomGenerate,
  isLoading,
  proceduralBuildings = false,
  onProceduralBuildingsChange
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showGlossary, setShowGlossary] = useState<boolean>(false);

  const handleMenuHover = (menuId: string) => {
    if (!isLoading) {
      setActiveMenu(menuId);
      if (showGlossary) setShowGlossary(false); // Close glossary when opening dropdown menus
    }
  };

  const handleMenuLeave = () => {
    setActiveMenu(null);
  };

  const handleOptionClick = (optionId: string) => {
    setActiveMenu(null);
    onGenerate(optionId);
  };

  return (
    <div className="top-bar-menu" onMouseLeave={handleMenuLeave}>
      <div className="menu-bar">
        {menuItems.map((menu) => (
          <div
            key={menu.id}
            className={`menu-item ${menu.disabled ? 'disabled' : ''} ${activeMenu === menu.id ? 'active' : ''}`}
            onMouseEnter={() => !menu.disabled && handleMenuHover(menu.id)}
          >
            <span className="menu-icon">{menu.icon}</span>
            <span className="menu-label">{menu.label}</span>
            {menu.disabled && <span className="coming-soon">Soon</span>}
          </div>
        ))}
        
        <div className="menu-separator"></div>
        
        <button 
          className="random-button"
          onClick={onRandomGenerate}
          disabled={isLoading}
          title="Generate random settlement"
        >
          🎲 Random
        </button>
        
        <button 
          className={`glossary-button ${showGlossary ? 'active' : ''}`}
          onClick={() => {
            setShowGlossary(!showGlossary);
            if (activeMenu) setActiveMenu(null); // Close any open dropdown menus
          }}
          title="Toggle tile & asset glossary"
        >
          📋 Glossary
        </button>

        {onProceduralBuildingsChange && (
          <>
            <div className="menu-separator"></div>
            <label className="procedural-toggle">
              <input
                type="checkbox"
                checked={proceduralBuildings}
                onChange={(e) => onProceduralBuildingsChange(e.target.checked)}
                disabled={isLoading}
              />
              <span className="toggle-label">Detailed Interiors</span>
            </label>
          </>
        )}
      </div>

      {activeMenu && (
        <div className="dropdown-menu">
          {menuItems
            .find(menu => menu.id === activeMenu)
            ?.options.map((option) => (
              <button
                key={option.id}
                className="dropdown-option"
                onClick={() => handleOptionClick(option.id)}
                disabled={isLoading}
              >
                <div className="option-label">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </button>
            ))}
        </div>
      )}

      {showGlossary && (
        <div className="glossary-modal">
          <div className="glossary-backdrop" onClick={() => setShowGlossary(false)} />
          <div className="glossary-content">
            <div className="glossary-header">
              <h3>📋 Tile & Asset Glossary</h3>
              <button 
                className="close-button"
                onClick={() => setShowGlossary(false)}
                title="Close glossary"
              >
                ✕
              </button>
            </div>
            <div className="glossary-body">
              <TileGlossary />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .top-bar-menu {
          position: relative;
          z-index: 1000;
        }

        .menu-bar {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color);
          padding: 0.75rem 1rem;
          gap: 0.5rem;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          color: var(--text-primary);
        }

        .menu-item:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: var(--gold);
        }

        .menu-item.active {
          background: rgba(255, 255, 255, 0.15);
          color: var(--gold);
        }

        .menu-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .menu-icon {
          font-size: 1.2rem;
        }

        .menu-label {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .coming-soon {
          font-size: 0.75rem;
          background: var(--gold);
          color: black;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .menu-separator {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          margin: 0 0.5rem;
        }

        .random-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .random-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          color: var(--gold);
          border-color: var(--gold);
        }

        .random-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .glossary-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .glossary-button:hover,
        .glossary-button.active {
          background: rgba(255, 255, 255, 0.15);
          color: var(--gold);
          border-color: var(--gold);
        }

        .procedural-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .procedural-toggle input[type="checkbox"] {
          margin: 0;
        }

        .toggle-label {
          font-weight: 500;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(15px);
          border: 1px solid var(--border-color);
          border-top: none;
          border-radius: 0 0 8px 8px;
          padding: 0.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .dropdown-option {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 0.75rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
        }

        .dropdown-option:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--gold);
          transform: translateY(-1px);
        }

        .dropdown-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .option-label {
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .option-description {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.3;
        }

        /* Glossary Modal Styles */
        .glossary-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 1rem;
          padding-top: 80px; /* Account for header height */
          overflow-y: auto;
        }

        .glossary-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          cursor: pointer;
        }

        .glossary-content {
          position: relative;
          background: rgba(44, 62, 80, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 2px solid rgba(149, 165, 166, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          max-width: calc(100vw - 2rem); /* Account for padding */
          max-height: calc(100vh - 160px); /* More room for header and padding */
          width: min(1200px, calc(100vw - 2rem));
          min-height: 400px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 20px; /* Extra space at bottom */
        }

        .glossary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          border-bottom: 2px solid rgba(149, 165, 166, 0.2);
          background: rgba(52, 73, 94, 0.8);
        }

        .glossary-header h3 {
          margin: 0;
          color: #ecf0f1;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-button {
          background: rgba(231, 76, 60, 0.2);
          border: 2px solid rgba(231, 76, 60, 0.4);
          color: #e74c3c;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          font-weight: bold;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(231, 76, 60, 0.3);
          border-color: rgba(231, 76, 60, 0.6);
          transform: scale(1.05);
        }

        .glossary-body {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        /* Override TileGlossary styles when in modal */
        .glossary-body .tile-glossary {
          background: transparent;
          box-shadow: none;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
};