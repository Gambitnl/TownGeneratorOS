import React, { useState } from 'react';
import { BuildingDetails } from '../services/BuildingLibrary';

interface BuildingDetailsModalProps {
  building: BuildingDetails | null;
  onClose: () => void;
}

type TabType = 'description' | 'residents' | 'interior';

export const BuildingDetailsModal: React.FC<BuildingDetailsModalProps> = ({ 
  building, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('description');
  
  if (!building) return null;

  // Determine building access and opening hours
  const getBuildingAccess = () => {
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 8 && currentHour <= 18;
    
    switch (building.type) {
      case 'commercial':
      case 'workshop':
      case 'service':
        return {
          canEnter: isBusinessHours,
          reason: isBusinessHours ? 'Welcome! Come in and browse our wares.' : `Closed for the day. Open from 8 AM to 6 PM.`
        };
      case 'magical':
        return {
          canEnter: true,
          reason: 'The magical energies here seem to welcome visitors at all hours.'
        };
      case 'religious':
        return {
          canEnter: true,
          reason: 'The doors are always open to those who seek spiritual guidance.'
        };
      case 'mixed':
        return {
          canEnter: isBusinessHours,
          reason: isBusinessHours ? 'The shop portion is open to visitors.' : 'The family is resting. The shop opens at 8 AM.'
        };
      case 'residential':
      default:
        return {
          canEnter: false,
          reason: 'This is a private residence. The occupants prefer not to have uninvited guests.'
        };
    }
  };

  const access = getBuildingAccess();

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="tab-content">
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
          </div>
        );

      case 'residents':
        return (
          <div className="tab-content">
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
          </div>
        );

      case 'interior':
        return (
          <div className="tab-content">
            <div className="interior-section">
              <h3>🏠 Building Interior</h3>
              
              <div className="access-status">
                <div className={`access-indicator ${access.canEnter ? 'allowed' : 'restricted'}`}>
                  {access.canEnter ? '✅ Access Granted' : '🚫 Access Restricted'}
                </div>
                <p className="access-reason">{access.reason}</p>
              </div>

              {access.canEnter ? (
                <div className="interior-content">
                  <div className="floor-plan">
                    <h4>Floor Plan</h4>
                    <div className="floor-grid">
                      {/* Placeholder for floor plan - we'll implement this later */}
                      <div className="floor-placeholder">
                        <p>🏠 Interior layout coming soon...</p>
                        <p>This space will show:</p>
                        <ul>
                          <li>Room layouts and functions</li>
                          <li>Furniture and decorations</li>
                          <li>Hidden areas and secrets</li>
                          <li>Interactive elements</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="access-denied">
                  <div className="denied-content">
                    <h4>🚪 Entry Denied</h4>
                    <p>You peer through the windows and doorway but cannot gain entry.</p>
                    {building.type === 'residential' && (
                      <div className="exterior-observations">
                        <h5>What you can see from outside:</h5>
                        <ul>
                          <li>Smoke rising from the chimney</li>
                          <li>Warm light flickering in the windows</li>
                          <li>The sound of daily life within</li>
                          <li>Well-maintained exterior and garden</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay-fullscreen" onClick={onClose}>
      <div className="building-modal-fullscreen" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-fullscreen">
          <div className="building-title">
            <span className="building-icon">{getTypeIcon(building.type)}</span>
            <h2>{building.name}</h2>
          </div>
          <button className="close-button-fullscreen" onClick={onClose}>✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            📋 Description
          </button>
          <button 
            className={`tab-button ${activeTab === 'residents' ? 'active' : ''}`}
            onClick={() => setActiveTab('residents')}
          >
            👥 Residents
          </button>
          <button 
            className={`tab-button ${activeTab === 'interior' ? 'active' : ''}`}
            onClick={() => setActiveTab('interior')}
          >
            🏠 Interior
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-content-fullscreen">
          {renderTabContent()}
        </div>

        <style>{`
          /* Full-screen modal overlay */
          .modal-overlay-fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 2000;
            backdrop-filter: blur(5px);
            transform: none !important;
          }

          /* Full-screen modal container */
          .building-modal-fullscreen {
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
            color: white;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: none !important;
          }

          /* Header */
          .modal-header-fullscreen {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
          }

          .building-title {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .building-icon {
            font-size: 2rem;
          }

          .building-title h2 {
            margin: 0;
            font-size: 2rem;
            color: #ecf0f1;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          }

          .close-button-fullscreen {
            background: rgba(231, 76, 60, 0.8);
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            width: 50px;
            height: 50px;
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-weight: bold;
          }

          .close-button-fullscreen:hover {
            background: rgba(231, 76, 60, 1);
            transform: scale(1.1);
          }

          /* Tab navigation */
          .tab-navigation {
            display: flex;
            background: rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
          }

          .tab-button {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            padding: 1rem 2rem;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border-bottom: 3px solid transparent;
            font-weight: 500;
          }

          .tab-button:hover {
            color: white;
            background: rgba(255, 255, 255, 0.05);
          }

          .tab-button.active {
            color: #3498db;
            background: rgba(52, 152, 219, 0.1);
            border-bottom-color: #3498db;
          }

          /* Main content area */
          .modal-content-fullscreen {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
          }

          .tab-content {
            max-width: 1200px;
            margin: 0 auto;
          }

          /* Content sections */
          .building-info, .residents-section, .features-section, .inventory-section, 
          .rumors-section, .hooks-section, .interior-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .purpose-section {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }

          .purpose-badge {
            padding: 0.75rem 1.5rem;
            border-radius: 25px;
            color: white;
            font-weight: 600;
            text-transform: capitalize;
            font-size: 1rem;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
          }

          .purposes {
            flex: 1;
            min-width: 300px;
          }

          .primary-purpose, .secondary-purpose {
            font-size: 1.1rem;
            margin: 0.5rem 0;
          }

          .description {
            background: rgba(52, 152, 219, 0.1);
            padding: 1.5rem;
            border-radius: 10px;
            font-style: italic;
            border-left: 4px solid #3498db;
            font-size: 1.1rem;
            line-height: 1.6;
          }

          /* Section headings */
          h3, h4, h5 {
            color: #ecf0f1;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
          }

          /* Resident cards */
          .resident-card {
            background: rgba(255, 255, 255, 0.08);
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.15);
          }

          .resident-header {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
            margin-bottom: 1rem;
          }

          .resident-header h4 {
            margin: 0;
            color: #ecf0f1;
            font-size: 1.3rem;
          }

          .occupation, .age {
            background: rgba(52, 152, 219, 0.4);
            padding: 0.4rem 0.8rem;
            border-radius: 15px;
            font-size: 0.9rem;
          }

          .personality, .background, .quirks, .relations {
            margin: 1rem 0;
            font-size: 1rem;
            line-height: 1.5;
          }

          /* Lists */
          .features-list, .rumors-list, .hooks-list {
            list-style: none;
            padding: 0;
          }

          .features-list li, .rumors-list li, .hooks-list li {
            padding: 0.75rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 1rem;
            line-height: 1.5;
          }

          .features-list li:last-child, .rumors-list li:last-child, .hooks-list li:last-child {
            border-bottom: none;
          }

          .inventory-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .inventory-item {
            background: rgba(46, 125, 50, 0.4);
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 1rem;
            border: 1px solid rgba(76, 175, 80, 0.4);
          }

          .rumors-list em {
            color: #f39c12;
          }

          .hooks-list li {
            color: #e74c3c;
            font-weight: 500;
          }

          /* Interior tab specific styles */
          .access-status {
            margin-bottom: 2rem;
            text-align: center;
          }

          .access-indicator {
            display: inline-block;
            padding: 1rem 2rem;
            border-radius: 25px;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }

          .access-indicator.allowed {
            background: rgba(46, 125, 50, 0.3);
            border: 2px solid rgba(76, 175, 80, 0.8);
            color: #4CAF50;
          }

          .access-indicator.restricted {
            background: rgba(244, 67, 54, 0.3);
            border: 2px solid rgba(244, 67, 54, 0.8);
            color: #f44336;
          }

          .access-reason {
            font-size: 1.1rem;
            font-style: italic;
            color: rgba(255, 255, 255, 0.8);
          }

          .floor-placeholder, .denied-content {
            text-align: center;
            padding: 2rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            border: 2px dashed rgba(255, 255, 255, 0.3);
          }

          .floor-placeholder p, .denied-content p {
            font-size: 1.1rem;
            margin-bottom: 1rem;
          }

          .floor-placeholder ul, .exterior-observations ul {
            text-align: left;
            max-width: 400px;
            margin: 0 auto;
          }

          .exterior-observations {
            margin-top: 2rem;
          }

          /* Scrollbar styling */
          .modal-content-fullscreen::-webkit-scrollbar {
            width: 12px;
          }

          .modal-content-fullscreen::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
          }

          .modal-content-fullscreen::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 6px;
          }

          .modal-content-fullscreen::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .modal-header-fullscreen {
              padding: 1rem;
            }
            
            .building-title h2 {
              font-size: 1.5rem;
            }
            
            .tab-button {
              padding: 0.75rem 1rem;
              font-size: 1rem;
            }
            
            .modal-content-fullscreen {
              padding: 1rem;
            }
            
            .purpose-section {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
      </div>
    </div>
  );
};