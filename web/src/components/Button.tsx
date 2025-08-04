import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

const buttonStyle: React.CSSProperties = {
  width: '45px',
  height: '13px',
  backgroundColor: '#1a1917',
  color: '#ccc5b8',
  border: 'none',
  padding: '0',
  margin: '0',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '8px',
  letterSpacing: '1px',
};

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <button style={buttonStyle} onClick={onClick}>
      {label}
    </button>
  );
};
