import React from 'react';
import { Button } from './Button';

interface FloorNavigationProps {
  currentFloor: number;
  totalFloors: number;
  hasBasement: boolean;
  onFloorChange: (floor: number) => void;
}

export const FloorNavigation: React.FC<FloorNavigationProps> = ({
  currentFloor,
  totalFloors,
  hasBasement,
  onFloorChange
}) => {
  const minFloor = hasBasement ? -1 : 0;
  const maxFloor = totalFloors - 1;

  const getFloorLabel = (floor: number): string => {
    if (floor === -1) return 'Basement';
    if (floor === 0) return 'Ground Floor';
    return `${floor + 1}${getOrdinalSuffix(floor + 1)} Floor`;
  };

  const getOrdinalSuffix = (num: number): string => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th';
    }
    
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const canGoUp = currentFloor < maxFloor;
  const canGoDown = currentFloor > minFloor;

  return (
    <div className="floor-navigation">
      <div className="floor-controls">
        <Button
          onClick={() => onFloorChange(currentFloor + 1)}
          disabled={!canGoUp}
          variant="secondary"
          title={canGoUp ? `Go to ${getFloorLabel(currentFloor + 1)}` : 'Top floor reached'}
          className="floor-button up-button"
        >
          ⬆️ Up
        </Button>
        
        <div className="floor-display">
          <span className="floor-label">{getFloorLabel(currentFloor)}</span>
          <span className="floor-counter">
            {currentFloor - minFloor + 1} of {maxFloor - minFloor + 1}
          </span>
        </div>
        
        <Button
          onClick={() => onFloorChange(currentFloor - 1)}
          disabled={!canGoDown}
          variant="secondary"
          title={canGoDown ? `Go to ${getFloorLabel(currentFloor - 1)}` : 'Lowest floor reached'}
          className="floor-button down-button"
        >
          ⬇️ Down
        </Button>
      </div>

      {/* Quick floor selector for buildings with many floors */}
      {(maxFloor - minFloor) > 2 && (
        <div className="floor-selector">
          {Array.from({ length: maxFloor - minFloor + 1 }, (_, i) => minFloor + i).map(floor => (
            <button
              key={floor}
              onClick={() => onFloorChange(floor)}
              className={`floor-quick-button ${currentFloor === floor ? 'active' : ''}`}
              title={getFloorLabel(floor)}
            >
              {floor === -1 ? 'B' : floor + 1}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .floor-navigation {
          position: fixed;
          top: 120px;
          right: 20px;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid var(--border-color);
          min-width: 200px;
        }

        .floor-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
        }

        .floor-button {
          min-width: 80px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .floor-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .floor-button.up-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: linear-gradient(135deg, #4CAF50, #45a049);
        }

        .floor-button.down-button:hover:not(:disabled) {
          transform: translateY(1px);
          background: linear-gradient(135deg, #FF6B6B, #ff5252);
        }

        .floor-display {
          text-align: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          min-width: 150px;
        }

        .floor-label {
          display: block;
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .floor-counter {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          opacity: 0.8;
        }

        .floor-selector {
          margin-top: 0.75rem;
          display: flex;
          gap: 0.25rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .floor-quick-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
          padding: 0.4rem 0.7rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s ease;
          min-width: 32px;
        }

        .floor-quick-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: var(--gold);
          transform: translateY(-1px);
        }

        .floor-quick-button.active {
          background: var(--gold);
          color: black;
          border-color: var(--gold);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};