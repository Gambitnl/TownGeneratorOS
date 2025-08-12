import React, { useState } from 'react';
import { GlossarySidebar } from './GlossarySidebar';

interface TopBarMenuProps {
  onGenerate: (size: string) => void;
  onRandomGenerate: () => void;
  isLoading: boolean;
  proceduralBuildings?: boolean;
  onProceduralBuildingsChange?: (enabled: boolean) => void;
  useEnhancedAssets?: boolean;
  onEnhancedAssetsChange?: (enabled: boolean) => void;
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
    id: 'test',
    label: 'Test',
    icon: '🧪',
    options: [
      { id: 'simple_building', label: 'Simple Buildings', description: 'Test the new simplified building generator' }
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
  onProceduralBuildingsChange,
  useEnhancedAssets = false,
  onEnhancedAssetsChange
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
          title="Toggle building glossary"
        >
          📋 Glossary
        </button>

        {/* Enhanced features are now enabled by default */}
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

      {/* Use the new sidebar glossary instead of modal */}
      <GlossarySidebar
        show={showGlossary}
        onItemHover={(item) => {
          // Could add highlighting logic here if needed
          console.log('Hovered glossary item:', item?.name);
        }}
      />

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

        /* Glossary button uses the new GlossarySidebar component - no modal styles needed */
      `}</style>
    </div>
  );
};