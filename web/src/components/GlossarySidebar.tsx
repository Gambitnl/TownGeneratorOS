import React, { useState } from 'react';
import { DynamicGlossary } from './DynamicGlossary';
import { BuildingType, SocialClass } from '../services/SimpleBuildingGenerator';
import { GlossaryItem } from '../services/GlossaryGenerator';
import './GlossarySidebar.css';

interface GlossarySidebarProps {
  buildingType?: BuildingType;
  socialClass?: SocialClass;
  onItemHover?: (item: GlossaryItem | null) => void;
  show?: boolean;
}

export const GlossarySidebar: React.FC<GlossarySidebarProps> = ({
  buildingType,
  socialClass,
  onItemHover,
  show = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when show prop is true (controlled by parent)
  const shouldShow = show || isExpanded;

  if (!shouldShow) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`glossary-toggle ${isExpanded ? 'active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide Glossary' : 'Show Glossary'}
      >
        <span className="toggle-icon">📋</span>
        <span className="toggle-text">
          {isExpanded ? 'Hide' : 'Glossary'}
        </span>
      </button>

      {/* Sidebar */}
      <div className={`glossary-sidebar ${shouldShow ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h3>Building Glossary</h3>
          <button 
            className="close-button"
            onClick={() => setIsExpanded(false)}
            title="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="sidebar-content">
          <DynamicGlossary
            buildingType={buildingType}
            socialClass={socialClass}
            onItemHover={onItemHover}
            className="sidebar-glossary"
          />
        </div>
      </div>

      {/* Backdrop */}
      {shouldShow && (
        <div 
          className="glossary-backdrop"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};