import React, { useState } from 'react';
import { Button } from './Button';

interface ControlPanelProps {
  onGenerate: (size: string) => void;
  onRandomGenerate: () => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  onRandomGenerate, 
  isLoading 
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