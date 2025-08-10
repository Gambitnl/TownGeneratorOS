import React from 'react';
import packageJson from '../../package.json';

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(0, 0, 0, 0.9)',
  backdropFilter: 'blur(10px)',
  padding: '0.75rem 1.5rem',
  borderBottom: '1px solid var(--border-color)',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  background: 'linear-gradient(135deg, var(--gold) 0%, var(--bronze) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  margin: 0,
  letterSpacing: '0.5px',
};

const versionStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  opacity: 0.7,
  fontWeight: 'normal',
};

export const Header: React.FC = () => {
  return (
    <header style={headerStyles} className="compact-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={titleStyles}>Medieval Fantasy Town Generator OS</h1>
        <span style={versionStyles}>v{packageJson.version}</span>
      </div>
    </header>
  );
};