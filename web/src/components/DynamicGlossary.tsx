import React, { useState, useMemo } from 'react';
import { GlossaryGenerator, GlossaryCategory, GlossaryItem } from '../services/GlossaryGenerator';
import { BuildingType, SocialClass } from '../services/SimpleBuildingGenerator';
import './DynamicGlossary.css';

interface DynamicGlossaryProps {
  buildingType?: BuildingType;
  socialClass?: SocialClass;
  onItemHover?: (item: GlossaryItem | null) => void;
  className?: string;
}

export const DynamicGlossary: React.FC<DynamicGlossaryProps> = ({
  buildingType,
  socialClass,
  onItemHover,
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('furniture');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const allCategories = useMemo(() => {
    return GlossaryGenerator.generateDynamicGlossary();
  }, []);

  const filteredCategories = useMemo(() => {
    // Filter by context (building type, social class)
    const contextFiltered = GlossaryGenerator.filterGlossaryForBuilding(
      allCategories, 
      buildingType, 
      socialClass
    );
    
    // Apply search filter
    if (!searchTerm) return contextFiltered;
    
    return contextFiltered.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.usage.some(use => use.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })).filter(category => category.items.length > 0);
  }, [allCategories, buildingType, socialClass, searchTerm]);

  const activeTab = filteredCategories.find(cat => cat.id === activeCategory) || filteredCategories[0];

  return (
    <div className={`dynamic-glossary ${className}`}>
      {/* Header */}
      <div className="glossary-header">
        <h3 className="glossary-title">
          📋 Building Glossary
        </h3>
        <p className="glossary-subtitle">
          {buildingType || socialClass 
            ? `Filtered for ${buildingType?.replace('_', ' ') || ''} ${socialClass || ''}`
            : 'All building elements'
          }
        </p>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search elements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glossary-search"
        />
      </div>

      {/* Category Tabs */}
      <div className="glossary-tabs">
        {filteredCategories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`glossary-tab ${activeCategory === category.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{category.icon}</span>
            <span className="tab-name">{category.name}</span>
            <span className="tab-count">{category.items.length}</span>
          </button>
        ))}
      </div>

      {/* Category Description */}
      {activeTab && (
        <div className="glossary-category-info">
          <div className="category-header">
            <span className="category-icon">{activeTab.icon}</span>
            <strong className="category-name">{activeTab.name}</strong>
          </div>
          <p className="category-description">{activeTab.description}</p>
        </div>
      )}

      {/* Items Grid */}
      {activeTab && (
        <div className="glossary-items">
          {activeTab.items.map(item => (
            <div
              key={item.id}
              className="glossary-item"
              onMouseEnter={() => onItemHover?.(item)}
              onMouseLeave={() => onItemHover?.(null)}
            >
              {/* Item Header */}
              <div className="item-header">
                <div
                  className="item-symbol"
                  style={{
                    backgroundColor: item.color,
                    borderColor: darkenColor(item.color)
                  }}
                >
                  {item.symbol}
                </div>
                <div className="item-info">
                  <h4 className="item-name">{item.name}</h4>
                  <div className="item-size">{item.size}</div>
                </div>
              </div>

              {/* Description */}
              <p className="item-description">{item.description}</p>

              {/* Usage Tags */}
              <div className="item-tags">
                {item.usage.slice(0, 3).map((use, index) => (
                  <span key={index} className="usage-tag">
                    {use}
                  </span>
                ))}
              </div>

              {/* Context Info */}
              {(item.buildingTypes?.length || item.socialClasses?.length) && (
                <div className="item-context">
                  {item.buildingTypes && (
                    <div className="context-info">
                      <span className="context-label">Buildings:</span>
                      <span className="context-values">
                        {item.buildingTypes.map(type => type.replace('_', ' ')).join(', ')}
                      </span>
                    </div>
                  )}
                  {item.socialClasses && (
                    <div className="context-info">
                      <span className="context-label">Classes:</span>
                      <span className="context-values">
                        {item.socialClasses.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredCategories.length === 0 && (
        <div className="glossary-empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No elements found</div>
          <div className="empty-subtitle">
            {searchTerm 
              ? 'Try different search terms'
              : 'No elements available for this context'
            }
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="glossary-footer">
        <div className="footer-info">
          📏 Each tile = 5×5 feet (D&D standard)
        </div>
        <div className="footer-count">
          {filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0)} elements
        </div>
      </div>
    </div>
  );
};

// Helper function to darken colors for borders
function darkenColor(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - 40);
  const b = Math.max(0, (num & 0x0000FF) - 40);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}