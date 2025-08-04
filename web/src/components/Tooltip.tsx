import React, { useState, useEffect } from 'react';

interface TooltipProps {
  text: string;
  delay?: number;
}

const tooltipStyles: React.CSSProperties = {
  position: 'fixed',
  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)',
  backdropFilter: 'blur(10px)',
  color: 'var(--text-primary)',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '500',
  pointerEvents: 'none',
  zIndex: 10000,
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-medium)',
  maxWidth: '300px',
  wordWrap: 'break-word',
  lineHeight: 1.4,
  transform: 'translateY(-8px)',
  opacity: 0,
  transition: 'opacity 0.2s ease, transform 0.2s ease',
};

const tooltipVisibleStyles: React.CSSProperties = {
  opacity: 1,
  transform: 'translateY(-12px)',
};

const arrowStyles: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  marginLeft: '-6px',
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderTop: '6px solid rgba(42, 42, 42, 0.95)',
  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
};

export const Tooltip: React.FC<TooltipProps> = ({ text, delay = 500 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Calculate optimal position
      const tooltipWidth = 300; // max-width
      const tooltipHeight = 60; // estimated height
      const padding = 16;
      
      let x = e.clientX;
      let y = e.clientY - tooltipHeight - 12; // 12px above cursor
      
      // Keep tooltip within viewport bounds
      if (x + tooltipWidth + padding > window.innerWidth) {
        x = window.innerWidth - tooltipWidth - padding;
      }
      if (x - padding < 0) {
        x = padding;
      }
      if (y - padding < 0) {
        y = e.clientY + 20; // Show below cursor if not enough space above
      }

      setPosition({ x, y });

      // Show tooltip after delay
      const newTimeoutId = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      
      setTimeoutId(newTimeoutId);
    };

    const onMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsVisible(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [delay, timeoutId]);

  if (!text || !isVisible) {
    return null;
  }

  const finalStyles = {
    ...tooltipStyles,
    ...(isVisible ? tooltipVisibleStyles : {}),
    left: position.x,
    top: position.y,
  };

  return (
    <div style={finalStyles} className="tooltip">
      {text}
      <div style={arrowStyles}></div>
    </div>
  );
};
