import React from 'react';

interface CitySizeButtonProps {
  label: string;
  minSize: number;
  maxSize: number;
  onGenerate: (size: number) => void;
}

export const CitySizeButton: React.FC<CitySizeButtonProps> = ({ label, minSize, maxSize, onGenerate }) => {
  const handleClick = () => {
    const size = minSize + Math.floor(Math.random() * (maxSize - minSize));
    onGenerate(size);
  };

  return (
    <button className="btn btn-primary" onClick={handleClick}>
      {label}
    </button>
  );
};

