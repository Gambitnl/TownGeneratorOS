import React from 'react';
import { BuildingDetails } from '../services/BuildingLibrary';

interface BuildingDetailsModalProps {
  building: BuildingDetails | null;
  onClose: () => void;
}

export const BuildingDetailsModal: React.FC<BuildingDetailsModalProps> = ({ 
  building, 
  onClose 
}) => {
  if (!building) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'residential': return '🏠';
      case 'commercial': return '🏪';
      case 'workshop': return '⚒️';
      case 'service': return '🔧';
      case 'magical': return '✨';
      case 'religious': return '⛪';
      case 'mixed': return '🏘️';
      default: return '🏢';
    }
  };

  const getPurposeColor = (type: string) => {
    switch (type) {
      case 'residential': return '#8fbc8f';
      case 'commercial': return '#daa520';
      case 'workshop': return '#cd853f';
      case 'service': return '#4682b4';
      case 'magical': return '#9370db';
      case 'religious': return '#f0e68c';
      case 'mixed': return '#bc8f8f';
      default: return '#696969';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="building-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="building-title">
            <span className="building-icon">{getTypeIcon(building.type)}</span>
            <h2>{building.name}</h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Building Info */}
        <div className="building-info">
          <div className="purpose-section">
            <div 
              className="purpose-badge" 
              style={{ backgroundColor: getPurposeColor(building.type) }}
            >
              {building.type}
            </div>
            <div className="purposes">
              <div className="primary-purpose">
                <strong>Primary:</strong> {building.primaryPurpose}
              </div>
              {building.secondaryPurpose && (
                <div className="secondary-purpose">
                  <strong>Secondary:</strong> {building.secondaryPurpose}
                </div>
              )}
            </div>
          </div>

          <div className="description">
            <p>{building.description}</p>
          </div>
        </div>

        {/* Residents */}
        <div className="residents-section">
          <h3>👥 Residents</h3>
          <div className="residents-list">
            {building.residents.map((resident, index) => (
              <div key={index} className="resident-card">
                <div className="resident-header">
                  <h4>{resident.name}</h4>
                  <span className="occupation">{resident.occupation}</span>
                  <span className="age">Age {resident.age}</span>
                </div>
                
                <div className="personality">
                  <strong>Personality:</strong> {resident.personality.join(', ')}
                </div>
                
                <div className="background">
                  <strong>Background:</strong> {resident.background}
                </div>

                {resident.quirks && resident.quirks.length > 0 && (
                  <div className="quirks">
                    <strong>Quirks:</strong> {resident.quirks.join(', ')}
                  </div>
                )}

                {resident.relations && resident.relations.length > 0 && (
                  <div className="relations">
                    <strong>Relations:</strong> {resident.relations.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special Features */}
        {building.specialFeatures && building.specialFeatures.length > 0 && (
          <div className="features-section">
            <h3>⭐ Special Features</h3>
            <ul className="features-list">
              {building.specialFeatures.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Inventory */}
        {building.inventory && building.inventory.length > 0 && (
          <div className="inventory-section">
            <h3>📦 Available Items/Services</h3>
            <div className="inventory-grid">
              {building.inventory.map((item, index) => (
                <span key={index} className="inventory-item">{item}</span>
              ))}
            </div>
          </div>
        )}

        {/* Rumors */}
        {building.rumors && building.rumors.length > 0 && (
          <div className="rumors-section">
            <h3>🗣️ Local Rumors</h3>
            <ul className="rumors-list">
              {building.rumors.map((rumor, index) => (
                <li key={index}><em>"{rumor}"</em></li>
              ))}
            </ul>
          </div>
        )}

        {/* Adventure Hooks */}
        {building.hooks && building.hooks.length > 0 && (
          <div className="hooks-section">
            <h3>⚔️ Adventure Hooks</h3>
            <ul className="hooks-list">
              {building.hooks.map((hook, index) => (
                <li key={index}>{hook}</li>
              ))}
            </ul>
          </div>
        )}

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(2px);
          }

          .building-modal {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            border-radius: 12px;
            max-width: 600px;
            max-height: 90vh;
            width: 90%;
            overflow-y: auto;
            color: white;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(0, 0, 0, 0.2);
          }

          .building-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .building-icon {
            font-size: 1.5rem;
          }

          .building-title h2 {
            margin: 0;
            font-size: 1.5rem;
            color: #ecf0f1;
          }

          .close-button {
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          }

          .close-button:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .building-info {
            padding: 1.5rem;
          }

          .purpose-section {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .purpose-badge {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            text-transform: capitalize;
            font-size: 0.875rem;
          }

          .purposes {
            flex: 1;
          }

          .primary-purpose, .secondary-purpose {
            font-size: 0.95rem;
            margin: 0.25rem 0;
          }

          .description {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 8px;
            font-style: italic;
            border-left: 4px solid #3498db;
          }

          .residents-section, .features-section, .inventory-section, .rumors-section, .hooks-section {
            padding: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .residents-section h3, .features-section h3, .inventory-section h3, .rumors-section h3, .hooks-section h3 {
            margin: 0 0 1rem 0;
            font-size: 1.25rem;
            color: #ecf0f1;
          }

          .resident-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .resident-header {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .resident-header h4 {
            margin: 0;
            color: #ecf0f1;
            font-size: 1.1rem;
          }

          .occupation, .age {
            background: rgba(52, 152, 219, 0.3);
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.875rem;
          }

          .personality, .background, .quirks, .relations {
            margin: 0.5rem 0;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .features-list, .rumors-list, .hooks-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .features-list li, .rumors-list li, .hooks-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .features-list li:last-child, .rumors-list li:last-child, .hooks-list li:last-child {
            border-bottom: none;
          }

          .inventory-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .inventory-item {
            background: rgba(46, 125, 50, 0.3);
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.875rem;
            border: 1px solid rgba(76, 175, 80, 0.3);
          }

          .rumors-list em {
            color: #f39c12;
          }

          .hooks-list li {
            color: #e74c3c;
            font-weight: 500;
          }

          /* Scrollbar styling */
          .building-modal::-webkit-scrollbar {
            width: 8px;
          }

          .building-modal::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
          }

          .building-modal::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }

          .building-modal::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>
    </div>
  );
};