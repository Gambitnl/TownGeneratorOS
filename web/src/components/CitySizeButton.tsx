import React from 'react';
import { Button } from './Button';
import { StateManager } from '../services/StateManager';
import { Model } from '../services/Model';
import { Game } from '../services/Game';
import { TownScene } from './TownScene';
import { Random } from '../utils/Random';

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

  return <Button label={label} onClick={handleClick} />;
};
