import React, { useState, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

interface MapTooltipProps {
  content: string;
  x: number;
  y: number;
  visible: boolean;
}

const tooltipStyles: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
};

const tooltipContentStyles: React.CSSProperties = {
  position: 'absolute',
  backgroundColor: 'rgba(26, 26, 26, 0.95)',
  color: 'var(--text-primary)',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  zIndex: 1000,
  border: '1px solid var(--border-color)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 0.2s ease-in-out',
  transform: 'translateY(-50%)',
};

const mapTooltipStyles: React.CSSProperties = {
  position: 'fixed',
  backgroundColor: 'rgba(26, 26, 26, 0.95)',
  color: 'var(--text-primary)',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  zIndex: 1000,
  border: '1px solid var(--border-color)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
  pointerEvents: 'none',
  transition: 'opacity 0.2s ease-in-out',
  transform: 'translate(-50%, -100%)',
  marginTop: '-8px',
};

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles = { ...tooltipContentStyles };
    
    switch (position) {
      case 'top':
        return { ...baseStyles, bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)' };
      case 'bottom':
        return { ...baseStyles, top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px)' };
      case 'left':
        return { ...baseStyles, right: '100%', top: '50%', transform: 'translateX(-8px) translateY(-50%)' };
      case 'right':
        return { ...baseStyles, left: '100%', top: '50%', transform: 'translateX(8px) translateY(-50%)' };
      default:
        return baseStyles;
    }
  };

  return (
    <div 
      style={tooltipStyles}
      className={className}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div 
        style={{
          ...getPositionStyles(),
          opacity: isVisible ? 1 : 0,
        }}
      >
        {content}
      </div>
    </div>
  );
};

export const MapTooltip: React.FC<MapTooltipProps> = ({ content, x, y, visible }) => {
  return (
    <div 
      style={{
        ...mapTooltipStyles,
        left: x,
        top: y,
        opacity: visible ? 1 : 0,
      }}
    >
      {content}
    </div>
  );
};
