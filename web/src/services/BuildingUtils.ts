import buildingTemplates from '../data/buildingTemplates.json';
import furnitureTemplates from '../data/furnitureTemplates.json';
import materials from '../data/materials.json';
import { Random } from '../utils/Random';
import { BuildingType, SocialClass, RoomFunction } from './SimpleBuildingGenerator';

// Pure utility functions - no classes or state

export function getDefaultLotSize(buildingType: BuildingType, socialClass: SocialClass) {
  const baseSize = buildingTemplates.defaultSizes[buildingType];
  const multiplier = buildingTemplates.socialClassMultipliers[socialClass];
  
  return {
    width: Math.floor(baseSize.width * multiplier),
    height: Math.floor(baseSize.height * multiplier)
  };
}

export function getRoomPlan(buildingType: BuildingType) {
  return buildingTemplates.roomPlans[buildingType] || buildingTemplates.roomPlans.house_small;
}

export function getFurnitureForRoom(roomFunction: RoomFunction, socialClass: SocialClass) {
  const roomFurniture = furnitureTemplates.furnitureByRoom[roomFunction];
  if (!roomFurniture) return [];

  const allowedCategories = furnitureTemplates.socialClassFurniture[socialClass];
  const furniture = [];

  for (const category of allowedCategories) {
    if (roomFurniture[category]) {
      furniture.push(...roomFurniture[category]);
    }
  }

  return furniture.sort((a, b) => a.priority - b.priority);
}

export function getMaterialsForClass(socialClass: SocialClass) {
  return materials.materialsByClass[socialClass];
}

export function getFurnitureQuality(socialClass: SocialClass) {
  return furnitureTemplates.furnitureQualities[socialClass];
}

export function calculateBuildingFootprint(lotSize: { width: number; height: number }) {
  return {
    width: Math.max(6, lotSize.width - 4), // Minimum 6 tiles, leave 2 tiles on each side
    height: Math.max(6, lotSize.height - 4)
  };
}

export function findOptimalFurniturePlacement(
  roomWidth: number, 
  roomHeight: number, 
  furnitureWidth: number, 
  furnitureHeight: number,
  existingFurniture: Array<{ x: number; y: number; width: number; height: number }>,
  random: Random
) {
  const attempts = [];
  
  // Generate all possible positions
  for (let y = 1; y < roomHeight - furnitureHeight - 1; y++) {
    for (let x = 1; x < roomWidth - furnitureWidth - 1; x++) {
      if (isPositionClear(x, y, furnitureWidth, furnitureHeight, existingFurniture)) {
        attempts.push({ x, y });
      }
    }
  }

  if (attempts.length === 0) return null;
  
  // Prefer positions along walls (more realistic placement)
  const wallPositions = attempts.filter(pos => 
    pos.x === 1 || pos.y === 1 || 
    pos.x === roomWidth - furnitureWidth - 1 || 
    pos.y === roomHeight - furnitureHeight - 1
  );

  const candidates = wallPositions.length > 0 ? wallPositions : attempts;
  return candidates[Math.floor(random.next() * candidates.length)];
}

function isPositionClear(
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  existingFurniture: Array<{ x: number; y: number; width: number; height: number }>
): boolean {
  return !existingFurniture.some(furniture => 
    x < furniture.x + furniture.width &&
    x + width > furniture.x &&
    y < furniture.y + furniture.height &&
    y + height > furniture.y
  );
}

export function generateDoorPositions(
  roomWidth: number, 
  roomHeight: number, 
  connectionSide: 'north' | 'south' | 'east' | 'west'
) {
  const doorWidth = 1; // Doors are 1 tile wide
  
  switch (connectionSide) {
    case 'south':
      return {
        x: Math.floor(roomWidth / 2),
        y: roomHeight - 1,
        direction: connectionSide
      };
    case 'north':
      return {
        x: Math.floor(roomWidth / 2),
        y: 0,
        direction: connectionSide
      };
    case 'east':
      return {
        x: roomWidth - 1,
        y: Math.floor(roomHeight / 2),
        direction: connectionSide
      };
    case 'west':
      return {
        x: 0,
        y: Math.floor(roomHeight / 2),
        direction: connectionSide
      };
  }
}

export function generateWindowPositions(
  roomWidth: number, 
  roomHeight: number, 
  socialClass: SocialClass,
  random: Random
) {
  const windows = [];
  const windowCount = socialClass === 'poor' ? 1 : socialClass === 'common' ? 2 : 3;
  
  // Windows on exterior walls
  const sides = ['north', 'south', 'east', 'west'];
  
  for (let i = 0; i < Math.min(windowCount, sides.length); i++) {
    const side = sides[i];
    let windowPos;
    
    switch (side) {
      case 'north':
        windowPos = { x: Math.floor(roomWidth / 2), y: 0, direction: side };
        break;
      case 'south':
        windowPos = { x: Math.floor(roomWidth / 2), y: roomHeight - 1, direction: side };
        break;
      case 'east':
        windowPos = { x: roomWidth - 1, y: Math.floor(roomHeight / 2), direction: side };
        break;
      case 'west':
        windowPos = { x: 0, y: Math.floor(roomHeight / 2), direction: side };
        break;
    }
    
    if (windowPos) {
      windows.push(windowPos);
    }
  }
  
  return windows;
}

export function applyMaterialWeathering(
  materialColor: string, 
  age: number, 
  climate: string = 'temperate'
) {
  let condition: keyof typeof materials.weatheringEffects;
  
  if (age < 5) condition = 'new';
  else if (age < 20) condition = 'weathered';
  else if (age < 50) condition = 'old';
  else condition = 'deteriorated';
  
  const effect = materials.weatheringEffects[condition];
  const climateEffect = materials.climate_modifiers[climate as keyof typeof materials.climate_modifiers] || {};
  
  // Simple color modification (would be more complex in real implementation)
  const colorMultiplier = effect.colorMultiplier * (1 - (climateEffect.color_fading || 0));
  
  return {
    color: adjustColorBrightness(materialColor, colorMultiplier),
    texture: effect.texture,
    weathering: condition
  };
}

function adjustColorBrightness(hex: string, factor: number): string {
  // Simple brightness adjustment
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor((num >> 16) * factor);
  const g = Math.floor(((num >> 8) & 0x00FF) * factor);
  const b = Math.floor((num & 0x0000FF) * factor);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}