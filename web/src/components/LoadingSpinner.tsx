import React from 'react';

const spinnerContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '3rem',
  background: 'var(--card-bg)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-medium)',
  backdropFilter: 'blur(10px)',
  border: '1px solid var(--border-color)',
  maxWidth: '300px',
  margin: '2rem auto',
  position: 'relative',
  overflow: 'hidden',
};

const spinnerStyles: React.CSSProperties = {
  width: '60px',
  height: '60px',
  border: '4px solid var(--accent-bg)',
  borderTop: '4px solid var(--gold)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '1.5rem',
  position: 'relative',
};

const innerSpinnerStyles: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '30px',
  height: '30px',
  border: '2px solid transparent',
  borderTop: '2px solid var(--bronze)',
  borderRadius: '50%',
  animation: 'spin 0.5s linear infinite reverse',
};

const loadingTextStyles: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontSize: '1.1rem',
  fontWeight: '500',
  marginBottom: '0.5rem',
  textAlign: 'center',
};

const loadingSubtextStyles: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
  textAlign: 'center',
  fontStyle: 'italic',
};

const glowEffectStyles: React.CSSProperties = {
  position: 'absolute',
  top: '-2px',
  left: '-2px',
  right: '-2px',
  bottom: '-2px',
  background: 'linear-gradient(45deg, var(--gold), var(--bronze), var(--gold))',
  borderRadius: 'var(--radius-lg)',
  opacity: 0.3,
  animation: 'glow 2s ease-in-out infinite',
  zIndex: -1,
};

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Generating Town", 
  submessage = "Creating your medieval settlement..." 
}) => {
  return (
    <div style={spinnerContainerStyles} className="fade-in loading-spinner">
      <div style={glowEffectStyles}></div>
      <div style={spinnerStyles}>
        <div style={innerSpinnerStyles}></div>
      </div>
      <div style={loadingTextStyles} className="loading-spinner-text">{message}</div>
      <div style={loadingSubtextStyles} className="loading-spinner-subtext">{submessage}</div>
    </div>
  );
};