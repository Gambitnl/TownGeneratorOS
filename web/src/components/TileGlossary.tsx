import React, { useState } from 'react';

interface TileCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: TileItem[];
}

interface TileItem {
  id: string;
  name: string;
  symbol: string;
  color: string;
  borderColor: string;
  description: string;
  usage: string[];
  materialTypes?: string[];
  size?: string;
}

const tileCategories: TileCategory[] = [
  {
    id: 'structural',
    name: 'Structural Elements',
    icon: '🏗️',
    description: 'Walls, floors, and basic building components',
    items: [
      {
        id: 'wall_stone',
        name: 'Stone Wall',
        symbol: '■',
        color: '#696969',
        borderColor: '#333',
        description: 'Thick stone walls providing excellent structural support and insulation',
        usage: ['Exterior walls', 'Load-bearing walls', 'Castle construction'],
        materialTypes: ['Granite', 'Limestone', 'Sandstone', 'Slate'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'wall_wood',
        name: 'Timber Wall',
        symbol: '■',
        color: '#8B4513',
        borderColor: '#654321',
        description: 'Wooden walls common in residential construction',
        usage: ['Interior walls', 'Residential buildings', 'Timber-frame houses'],
        materialTypes: ['Oak', 'Pine', 'Ash', 'Birch'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'floor_wood',
        name: 'Wooden Floor',
        symbol: '□',
        color: '#D2B48C',
        borderColor: '#999',
        description: 'Planked wooden flooring for interior spaces',
        usage: ['Living areas', 'Bedrooms', 'Upper floors'],
        materialTypes: ['Oak planks', 'Pine boards', 'Hardwood'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'floor_stone',
        name: 'Stone Floor',
        symbol: '□',
        color: '#A0A0A0',
        borderColor: '#999',
        description: 'Durable stone flooring for high-traffic areas',
        usage: ['Ground floors', 'Kitchens', 'Workshops', 'Courtyards'],
        materialTypes: ['Flagstone', 'Cobblestone', 'Marble', 'Slate'],
        size: '1x1 tile (5 feet)'
      }
    ]
  },
  {
    id: 'openings',
    name: 'Doors & Windows',
    icon: '🚪',
    description: 'Entry points and openings for light and air',
    items: [
      {
        id: 'door_wood',
        name: 'Wooden Door',
        symbol: '▬',
        color: '#8B4513',
        borderColor: '#654321',
        description: 'Standard wooden door for interior and exterior use',
        usage: ['Room entrances', 'House entrances', 'Interior passages'],
        materialTypes: ['Oak', 'Pine', 'Reinforced timber'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'door_metal',
        name: 'Iron Door',
        symbol: '▬',
        color: '#696969',
        borderColor: '#333',
        description: 'Heavy metal door for security and fortification',
        usage: ['Castle gates', 'Treasure rooms', 'Dungeons'],
        materialTypes: ['Iron', 'Steel', 'Reinforced metal'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'window',
        name: 'Window',
        symbol: '⧈',
        color: '#87CEEB',
        borderColor: '#4682B4',
        description: 'Opening with glass or shutters for light and ventilation',
        usage: ['Natural light', 'Ventilation', 'Surveillance'],
        materialTypes: ['Glass panes', 'Wooden shutters', 'Iron bars'],
        size: '1x1 tile (5 feet)'
      }
    ]
  },
  {
    id: 'furniture',
    name: 'Furniture & Objects',
    icon: '🪑',
    description: 'Movable furnishings and objects within buildings',
    items: [
      {
        id: 'bed',
        name: 'Bed',
        symbol: '🛏️',
        color: '#8B4513',
        borderColor: '#654321',
        description: 'Sleeping furniture sized for one or two occupants',
        usage: ['Bedrooms', 'Guest quarters', 'Master suites'],
        size: '1x2 tiles (5x10 feet)'
      },
      {
        id: 'chair',
        name: 'Chair',
        symbol: '🪑',
        color: '#D2691E',
        borderColor: '#A0522D',
        description: 'Single-person seating with directional orientation',
        usage: ['Dining', 'Work areas', 'Lounging'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'table',
        name: 'Table',
        symbol: '🍽️',
        color: '#CD853F',
        borderColor: '#8B4513',
        description: 'Flat surface for dining, work, or display',
        usage: ['Dining', 'Food preparation', 'Work surface'],
        size: 'Various (1x1 to 3x6 tiles)'
      },
      {
        id: 'chest',
        name: 'Storage Chest',
        symbol: '📦',
        color: '#8B4513',
        borderColor: '#654321',
        description: 'Wooden container for storing belongings',
        usage: ['Personal storage', 'Merchant goods', 'Equipment'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'bookshelf',
        name: 'Bookshelf',
        symbol: '📚',
        color: '#8B4513',
        borderColor: '#654321',
        description: 'Tall storage for books, scrolls, and documents',
        usage: ['Libraries', 'Studies', 'Scholar quarters'],
        size: '1x1 tile (5 feet)'
      }
    ]
  },
  {
    id: 'fixtures',
    name: 'Built-in Fixtures',
    icon: '🔥',
    description: 'Permanent installations and medieval amenities',
    items: [
      {
        id: 'hearth',
        name: 'Stone Hearth',
        symbol: '🔥',
        color: '#B22222',
        borderColor: '#8B0000',
        description: 'Central fireplace for heating and cooking',
        usage: ['Room heating', 'Cooking', 'Social gathering'],
        materialTypes: ['Stone', 'Brick', 'Clay'],
        size: '2x2 tiles (10x10 feet)'
      },
      {
        id: 'oven',
        name: 'Bread Oven',
        symbol: '🍞',
        color: '#8B4513',
        borderColor: '#654321',
        description: 'Clay or stone oven for baking bread',
        usage: ['Baking', 'Cooking', 'Food preparation'],
        materialTypes: ['Clay', 'Stone', 'Brick'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'privy',
        name: 'Privy',
        symbol: '🚽',
        color: '#696969',
        borderColor: '#333',
        description: 'Medieval toilet facility, often built into walls',
        usage: ['Sanitation', 'Personal hygiene'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'well',
        name: 'Well',
        symbol: '🪣',
        color: '#4682B4',
        borderColor: '#2F4F4F',
        description: 'Water source with stone lining and pulley system',
        usage: ['Water supply', 'Courtyard feature'],
        materialTypes: ['Stone', 'Wood pulley', 'Iron bucket'],
        size: '1x1 tile (5 feet)'
      }
    ]
  },
  {
    id: 'exterior',
    name: 'Exterior Elements',
    icon: '🏰',
    description: 'Architectural features and outdoor elements',
    items: [
      {
        id: 'chimney',
        name: 'Chimney',
        symbol: '🏠',
        color: '#696969',
        borderColor: '#2F4F4F',
        description: 'Vertical structure for smoke removal from hearths',
        usage: ['Smoke evacuation', 'Structural feature'],
        materialTypes: ['Stone', 'Brick', 'Clay'],
        size: '1x1 to 2x4 tiles'
      },
      {
        id: 'stairs',
        name: 'Staircase',
        symbol: '🪜',
        color: '#CD853F',
        borderColor: '#8B4513',
        description: 'Multi-level access with proper clearance',
        usage: ['Floor transitions', 'Vertical circulation'],
        materialTypes: ['Stone', 'Wood', 'Mixed construction'],
        size: '2x3 tiles (10x15 feet)'
      },
      {
        id: 'garden',
        name: 'Garden Plot',
        symbol: '🌱',
        color: '#228B22',
        borderColor: '#006400',
        description: 'Cultivated area for herbs, vegetables, or flowers',
        usage: ['Food production', 'Medicine herbs', 'Decoration'],
        size: 'Variable (2x2 to 4x6 tiles)'
      },
      {
        id: 'tree',
        name: 'Tree',
        symbol: '🌳',
        color: '#228B22',
        borderColor: '#006400',
        description: 'Mature tree providing shade and natural beauty',
        usage: ['Landscaping', 'Shade', 'Property boundary'],
        size: '1x1 to 2x2 tiles'
      }
    ]
  },
  {
    id: 'special',
    name: 'Special Features',
    icon: '⭐',
    description: 'Unique elements and advanced features',
    items: [
      {
        id: 'pillar',
        name: 'Support Pillar',
        symbol: '🏛️',
        color: '#A9A9A9',
        borderColor: '#696969',
        description: 'Structural column supporting upper floors',
        usage: ['Structural support', 'Large room spans', 'Decoration'],
        materialTypes: ['Stone', 'Marble', 'Wood', 'Metal'],
        size: '1x1 tile (5 feet)'
      },
      {
        id: 'altar',
        name: 'Altar',
        symbol: '✨',
        color: '#FFD700',
        borderColor: '#DAA520',
        description: 'Religious focal point for worship and ceremony',
        usage: ['Religious ceremonies', 'Shrine focus', 'Prayer'],
        materialTypes: ['Stone', 'Marble', 'Wood', 'Precious metals'],
        size: '2x1 tiles (10x5 feet)'
      },
      {
        id: 'anvil',
        name: 'Anvil',
        symbol: '🔨',
        color: '#2F4F4F',
        borderColor: '#000',
        description: 'Heavy iron block for metalworking and forging',
        usage: ['Blacksmithing', 'Metal shaping', 'Tool making'],
        materialTypes: ['Iron', 'Steel', 'Stone base'],
        size: '1x1 tile (5 feet)'
      }
    ]
  }
];

interface TileGlossaryProps {
  className?: string;
  style?: React.CSSProperties;
}

export const TileGlossary: React.FC<TileGlossaryProps> = ({ className, style }) => {
  const [activeCategory, setActiveCategory] = useState<string>('structural');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCategories = tileCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.usage.some(use => use.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(category => category.items.length > 0);

  const activeTab = filteredCategories.find(cat => cat.id === activeCategory) || filteredCategories[0];

  return (
    <div className={`tile-glossary ${className || ''}`} style={{ ...style }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: '#ecf0f1',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#ecf0f1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Tile & Asset Glossary
          </h3>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '13px', 
            color: '#bdc3c7',
            lineHeight: '1.4'
          }}>
            Reference guide for all building elements, furniture, and architectural features
          </p>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search tiles and assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(52, 73, 94, 0.8)',
              border: '2px solid rgba(149, 165, 166, 0.3)',
              borderRadius: '8px',
              color: '#ecf0f1',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(52, 152, 219, 0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(149, 165, 166, 0.3)'}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '16px',
          borderBottom: '2px solid rgba(149, 165, 166, 0.2)',
          paddingBottom: '12px'
        }}>
          {filteredCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              style={{
                padding: '6px 12px',
                backgroundColor: activeCategory === category.id 
                  ? 'rgba(52, 152, 219, 0.8)' 
                  : 'rgba(52, 73, 94, 0.6)',
                border: activeCategory === category.id 
                  ? '2px solid rgba(52, 152, 219, 1)' 
                  : '2px solid rgba(149, 165, 166, 0.3)',
                borderRadius: '20px',
                color: '#ecf0f1',
                fontSize: '12px',
                fontWeight: activeCategory === category.id ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== category.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(149, 165, 166, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== category.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(52, 73, 94, 0.6)';
                }
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span style={{ 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: '10px', 
                padding: '2px 6px',
                fontSize: '10px',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {category.items.length}
              </span>
            </button>
          ))}
        </div>

        {/* Category Description */}
        {activeTab && (
          <div style={{ 
            backgroundColor: 'rgba(44, 62, 80, 0.6)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid rgba(149, 165, 166, 0.2)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '6px' 
            }}>
              <span style={{ fontSize: '16px' }}>{activeTab.icon}</span>
              <strong style={{ color: '#3498db' }}>{activeTab.name}</strong>
            </div>
            <p style={{ 
              margin: '0', 
              fontSize: '13px', 
              color: '#bdc3c7',
              lineHeight: '1.4'
            }}>
              {activeTab.description}
            </p>
          </div>
        )}

        {/* Tile Items Grid */}
        {activeTab && (
          <div style={{ 
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
          }}>
            {activeTab.items.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'rgba(52, 73, 94, 0.7)',
                  border: '2px solid rgba(149, 165, 166, 0.2)',
                  borderRadius: '10px',
                  padding: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(52, 73, 94, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(52, 152, 219, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(52, 73, 94, 0.7)';
                  e.currentTarget.style.borderColor = 'rgba(149, 165, 166, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Item Header */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: item.color,
                      border: `2px solid ${item.borderColor}`,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0
                    }}
                  >
                    {item.symbol}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 2px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#ecf0f1'
                    }}>
                      {item.name}
                    </h4>
                    {item.size && (
                      <div style={{ 
                        fontSize: '11px',
                        color: '#95a5a6',
                        fontStyle: 'italic'
                      }}>
                        {item.size}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '12px',
                  color: '#bdc3c7',
                  lineHeight: '1.4'
                }}>
                  {item.description}
                </p>

                {/* Usage Tags */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {item.usage.map((use, index) => (
                      <span
                        key={index}
                        style={{
                          backgroundColor: 'rgba(46, 204, 113, 0.2)',
                          color: '#2ecc71',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '500',
                          border: '1px solid rgba(46, 204, 113, 0.3)'
                        }}
                      >
                        {use}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Material Types */}
                {item.materialTypes && (
                  <div>
                    <div style={{ 
                      fontSize: '11px',
                      color: '#95a5a6',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      Materials:
                    </div>
                    <div style={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '3px'
                    }}>
                      {item.materialTypes.map((material, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: 'rgba(155, 89, 182, 0.2)',
                            color: '#9b59b6',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '9px',
                            fontWeight: '400',
                            border: '1px solid rgba(155, 89, 182, 0.3)'
                          }}
                        >
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            color: '#95a5a6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              No tiles found
            </div>
            <div style={{ fontSize: '13px' }}>
              Try adjusting your search terms
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '2px solid rgba(149, 165, 166, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#95a5a6'
        }}>
          <div>
            📏 Each tile represents 5 feet × 5 feet (D&D standard)
          </div>
          <div>
            Total tiles: {tileCategories.reduce((sum, cat) => sum + cat.items.length, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};