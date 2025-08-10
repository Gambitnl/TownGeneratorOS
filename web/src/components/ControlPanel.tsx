import React, { useState } from 'react';
import { Button } from './Button';

interface ControlPanelProps {
  onGenerate: (size: string) => void;
  onRandomGenerate: () => void;
  isLoading: boolean;
  proceduralBuildings?: boolean;
  onProceduralBuildingsChange?: (enabled: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  onRandomGenerate, 
  isLoading,
  proceduralBuildings = false,
  onProceduralBuildingsChange
}) => {
  const [activeCategory, setActiveCategory] = useState<'settlements' | 'villages' | null>('settlements');

  return (
    <div className="control-panel">
      {/* Main Settlement Types */}
      <div className="control-section">
        <h3>🏰 Generate Settlement</h3>
        <div className="settlement-grid">
          <Button 
            variant="primary" 
            className="settlement-button village"
            onClick={() => onGenerate('village')}
            disabled={isLoading}
            title="Generate a medieval village (20-30 buildings)"
          >
            <span className="settlement-icon">🏡</span>
            <div className="settlement-info">
              <h4>Village</h4>
              <p>Organic medieval settlement with curved roads and varied buildings</p>
            </div>
          </Button>

          <Button 
            variant="primary" 
            className="settlement-button town"
            onClick={() => onGenerate('town')}
            disabled={isLoading}
            title="Generate a medieval town (10-15 districts)"
          >
            <span className="settlement-icon">🏘️</span>
            <div className="settlement-info">
              <h4>Town</h4>
              <p>Growing town with market square and multiple districts</p>
            </div>
          </Button>

          <Button 
            variant="primary" 
            className="settlement-button city"
            onClick={() => onGenerate('city')}
            disabled={isLoading}
            title="Generate a medieval city (18-25 districts)"
          >
            <span className="settlement-icon">🏙️</span>
            <div className="settlement-info">
              <h4>City</h4>
              <p>Large walled city with complex districts and roads</p>
            </div>
          </Button>

          <Button 
            variant="primary" 
            className="settlement-button capital"
            onClick={() => onGenerate('capital')}
            disabled={isLoading}
            title="Generate a medieval capital (28-40 districts)"
          >
            <span className="settlement-icon">🏰</span>
            <div className="settlement-info">
              <h4>Capital</h4>
              <p>Massive capital with castle, cathedral, and sprawling districts</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Village Types */}
      <div className="control-section">
        <h3>🏞️ Village Types</h3>
        <div className="village-types">
          <Button 
            variant="outline" 
            className="village-type-button"
            onClick={() => onGenerate('hamlet')}
            disabled={isLoading}
            title="Generate a tiny hamlet (12-18 buildings)"
          >
            🏕️ Hamlet
          </Button>
          <Button 
            variant="outline" 
            className="village-type-button"
            onClick={() => onGenerate('village-coastal')}
            disabled={isLoading}
            title="Generate a coastal fishing village"
          >
            🐟 Fishing Village  
          </Button>
          <Button 
            variant="outline" 
            className="village-type-button"
            onClick={() => onGenerate('village-forest')}
            disabled={isLoading}
            title="Generate a forest woodcutter village"
          >
            🌲 Forest Village
          </Button>
        </div>
      </div>

      {/* Building Types */}
      <div className="control-section">
        <h3>🏠 Individual Buildings</h3>
        <div className="building-types">
          <Button 
            variant="outline" 
            className="building-type-button"
            onClick={() => onGenerate('building-house_small')}
            disabled={isLoading}
            title="Generate a small house with detailed interior (D&D ready)"
          >
            🏘️ Small House
          </Button>
          <Button 
            variant="outline" 
            className="building-type-button"
            onClick={() => onGenerate('building-house_large')}
            disabled={isLoading}
            title="Generate a large house with multiple rooms"
          >
            🏛️ Large House
          </Button>
          <Button 
            variant="outline" 
            className="building-type-button"
            onClick={() => onGenerate('building-tavern')}
            disabled={isLoading}
            title="Generate a tavern with main hall and accommodations"
          >
            🍺 Tavern
          </Button>
          <Button 
            variant="outline" 
            className="building-type-button"
            onClick={() => onGenerate('building-blacksmith')}
            disabled={isLoading}
            title="Generate a blacksmith workshop with forge"
          >
            🔨 Blacksmith
          </Button>
          <Button 
            variant="outline" 
            className="building-type-button"
            onClick={() => onGenerate('building-shop')}
            disabled={isLoading}
            title="Generate a general goods shop"
          >
            🏪 Shop
          </Button>
          <Button 
            variant="outline" 
            className="building-type-button"
            onClick={() => onGenerate('building-market_stall')}
            disabled={isLoading}
            title="Generate a small market stall"
          >
            🛒 Market Stall
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="control-section">
        <div className="quick-actions">
          <Button 
            variant="secondary" 
            onClick={onRandomGenerate}
            disabled={isLoading}
            title="Generate random settlement"
          >
            🎲 Surprise Me
          </Button>
        </div>
      </div>

      {/* D&D Options */}
      {onProceduralBuildingsChange && (
        <div className="control-section">
          <h3>🏠 D&D Map Options</h3>
          <div className="dnd-options">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={proceduralBuildings}
                onChange={(e) => onProceduralBuildingsChange(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkbox-label">
                <strong>Detailed Building Layouts</strong>
                <br />
                <small>Generate interior rooms and furnishing for D&D exploration</small>
              </span>
            </label>
          </div>
        </div>
      )}


      <style>{`
        .control-panel {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1rem;
          max-width: 400px;
          color: white;
        }

        .control-section {
          margin-bottom: 1.5rem;
        }

        .control-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .settlement-grid {
          display: grid;
          gap: 0.75rem;
        }

        .settlement-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }

        .settlement-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .settlement-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .settlement-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .settlement-info {
          flex: 1;
        }

        .settlement-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .settlement-info p {
          margin: 0;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.3;
        }

        .quick-actions {
          display: flex;
          gap: 0.5rem;
        }

        .quick-actions button {
          flex: 1;
        }

        .village-types {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .building-types {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .village-type-button {
          padding: 0.75rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .village-type-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .building-type-button {
          padding: 0.75rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .building-type-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .dnd-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkbox-option {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .checkbox-option:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .checkbox-option input {
          margin-top: 0.2rem;
        }

        .checkbox-label {
          flex: 1;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .checkbox-label small {
          color: rgba(255, 255, 255, 0.7);
        }

        /* Hover animations */
        .settlement-button.village:hover {
          border-color: #8fbc8f;
          box-shadow: 0 0 20px rgba(143, 188, 143, 0.3);
        }

        .settlement-button.town:hover {
          border-color: #daa520;
          box-shadow: 0 0 20px rgba(218, 165, 32, 0.3);
        }

        .settlement-button.city:hover {
          border-color: #4682b4;
          box-shadow: 0 0 20px rgba(70, 130, 180, 0.3);
        }

        .settlement-button.capital:hover {
          border-color: #cd853f;
          box-shadow: 0 0 20px rgba(205, 133, 63, 0.3);
        }
      `}</style>
    </div>
  );
};