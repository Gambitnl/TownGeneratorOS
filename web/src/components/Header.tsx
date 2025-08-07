import React from 'react';
import packageJson from '../../package.json';

const headerStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: '2px solid var(--border-color)',
  padding: '1.5rem 2rem',
  position: 'relative',
  overflow: 'hidden',
};

const titleStyles: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  background: 'linear-gradient(135deg, var(--gold) 0%, var(--bronze) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textAlign: 'center',
  marginBottom: '0.5rem',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  letterSpacing: '1px',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '1rem',
  color: 'var(--text-secondary)',
  textAlign: 'center',
  fontStyle: 'italic',
  opacity: 0.8,
};

const versionStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  textAlign: 'center',
  opacity: 0.6,
  marginTop: '0.5rem',
};

const decorationStyles: React.CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  background: `
    radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(205, 127, 50, 0.1) 0%, transparent 50%)
  `,
  pointerEvents: 'none',
};

const ornamentStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '1rem 0 0.5rem 0',
};

const ornamentLineStyles: React.CSSProperties = {
  flex: 1,
  height: '2px',
  background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)',
  margin: '0 1rem',
};

const ornamentCenterStyles: React.CSSProperties = {
  width: '8px',
  height: '8px',
  background: 'var(--gold)',
  borderRadius: '50%',
  boxShadow: '0 0 10px var(--gold)',
};

export const Header: React.FC = () => {
  return (
    <header style={headerStyles} className="fade-in header">
      <div style={decorationStyles}></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={titleStyles} className="header-title">Medieval Fantasy Town Generator OS</h1>
        <div style={ornamentStyles}>
          <div style={ornamentLineStyles}></div>
          <div style={ornamentCenterStyles}></div>
          <div style={ornamentLineStyles}></div>
        </div>
        <p style={subtitleStyles} className="header-subtitle">
          Create immersive medieval settlements with 90+ fantasy vocations and interactive buildings
        </p>
        <p style={versionStyles} className="header-version">v{packageJson.version} - Enhanced Edition</p>
      </div>
    </header>
  );
};