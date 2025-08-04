import React, { useState, useEffect } from 'react';

interface TooltipProps {
  text: string;
}

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  backgroundColor: '#1a1917',
  color: '#ccc5b8',
  padding: '2px 4px',
  fontFamily: 'monospace',
  fontSize: '8px',
  letterSpacing: '1px',
  pointerEvents: 'none',
};

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX + 4, y: e.clientY });
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  if (!text) {
    return null;
  }

  return (
    <div style={{ ...tooltipStyle, left: position.x, top: position.y }}>
      {text}
    </div>
  );
};
