import React, { useState } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: string;
}

const getButtonStyles = (
  variant: string = 'primary', 
  size: string = 'medium', 
  disabled: boolean = false,
  isHovered: boolean = false,
  isPressed: boolean = false
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all var(--transition-medium)',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
    outline: 'none',
    boxShadow: disabled ? 'none' : 'var(--shadow-soft)',
    transform: isPressed ? 'translateY(1px)' : 'translateY(0)',
  };

  // Size variants
  const sizeStyles = {
    small: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      minHeight: '32px',
    },
    medium: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      minHeight: '40px',
    },
    large: {
      padding: '1rem 2rem',
      fontSize: '1.125rem',
      minHeight: '48px',
    },
  };

  // Color variants
  const colorStyles = {
    primary: {
      background: disabled 
        ? 'var(--accent-bg)' 
        : isHovered 
          ? 'linear-gradient(135deg, #e6c547 0%, #d4af37 100%)'
          : 'linear-gradient(135deg, var(--gold) 0%, var(--bronze) 100%)',
      color: disabled ? 'var(--text-muted)' : 'var(--primary-bg)',
      border: `1px solid ${disabled ? 'var(--border-color)' : 'transparent'}`,
      boxShadow: disabled 
        ? 'none' 
        : isHovered 
          ? '0 4px 20px rgba(212, 175, 55, 0.4)' 
          : 'var(--shadow-soft)',
    },
    secondary: {
      background: disabled 
        ? 'var(--accent-bg)' 
        : isHovered
          ? 'var(--accent-bg)'
          : 'var(--secondary-bg)',
      color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
      border: `1px solid ${disabled ? 'var(--border-color)' : isHovered ? 'var(--gold)' : 'var(--border-color)'}`,
    },
    accent: {
      background: disabled 
        ? 'var(--accent-bg)' 
        : isHovered
          ? 'linear-gradient(135deg, #dd8c3a 0%, #cd7f32 100%)'
          : 'linear-gradient(135deg, var(--bronze) 0%, var(--iron) 100%)',
      color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
      border: `1px solid ${disabled ? 'var(--border-color)' : 'transparent'}`,
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size as keyof typeof sizeStyles],
    ...colorStyles[variant as keyof typeof colorStyles],
  };
};

const iconStyles: React.CSSProperties = {
  fontSize: '1.2em',
  lineHeight: 1,
};

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  icon
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      style={getButtonStyles(variant, size, disabled, isHovered, isPressed)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      className="fade-in"
    >
      {icon && <span style={iconStyles}>{icon}</span>}
      {label}
    </button>
  );
};
