import React, { useRef, useEffect, useState } from 'react';
import { Model } from './Model';
import { Palette } from '@/types/palette';
import { Brush } from './Brush';
import { PatchView } from './PatchView';
import { CurtainWall } from './CurtainWall';
import { Street } from '@/types/street';
import { Polygon } from '@/types/polygon';
import { Point } from '@/types/point';
import { Ward } from './Ward';
import { Castle } from './wards/Castle';
import { Market } from './wards/Market';
import { GateWard } from './wards/GateWard';
import { Farm } from './wards/Farm';
import { AdministrationWard } from './wards/AdministrationWard';
import { Cathedral } from './wards/Cathedral';
import { CommonWard } from './wards/CommonWard';
import { CraftsmenWard } from './wards/CraftsmenWard';
import { MerchantWard } from './wards/MerchantWard';
import { MilitaryWard } from './wards/MilitaryWard';
import { Park } from './wards/Park';
import { PatriciateWard } from './wards/PatriciateWard';
import { Slum } from './wards/Slum';
import { MapTooltip } from '@/components/Tooltip';

interface CityMapProps {
  model: Model;
}

interface MapElement {
  type: 'ward' | 'street' | 'road' | 'artery' | 'wall' | 'gate' | 'tower';
  element: any;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  tooltip: string;
}

export const CityMap: React.FC<CityMapProps> = ({ model }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; visible: boolean }>({
    content: '',
    x: 0,
    y: 0,
    visible: false
  });
  const [mapElements, setMapElements] = useState<MapElement[]>([]);

  const transform = useRef({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      drawMap();
    });

    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, [model]);

  useEffect(() => {
    drawMap();
  }, [model]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    const palette = Palette.DEFAULT;
    const brush = new Brush(palette);

    // Clear canvas with background
    ctx.fillStyle = `#${palette.paper.toString(16)}`;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate bounds for centering
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const patch of model.patches) {
      for (const vertex of patch.shape.vertices) {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
      }
    }

    const mapWidth = maxX - minX;
    const mapHeight = maxY - minY;

    const scale = Math.min(rect.width / mapWidth, rect.height / mapHeight) * 0.9;
    const offsetX = (rect.width - mapWidth * scale) / 2 - minX * scale;
    const offsetY = (rect.height - mapHeight * scale) / 2 - minY * scale;

    transform.current = { x: offsetX, y: offsetY, scale };

    // Apply transformation
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const elements: MapElement[] = [];

    // Draw patches (wards) with improved rendering
    for (const patch of model.patches) {
      const ward = patch.ward;
      if (ward) {
        const element = drawWard(ctx, brush, ward, palette, elements);
        if (element) {
          elements.push(element);
        }
      }
    }

    // Draw streets with better visual hierarchy
    for (const street of model.streets) {
      const element = drawRoad(ctx, brush, street, palette, 2, 'street');
      if (element) {
        elements.push(element);
      }
    }

    // Draw roads
    for (const road of model.roads) {
      const element = drawRoad(ctx, brush, road, palette, 1, 'road');
      if (element) {
        elements.push(element);
      }
    }

    // Draw arteries (main streets)
    for (const artery of model.arteries) {
      const element = drawRoad(ctx, brush, artery, palette, 3, 'artery');
      if (element) {
        elements.push(element);
      }
    }

    // Draw walls
    if (model.wall) {
      const element = drawWall(ctx, brush, model.wall, false, palette, elements);
      if (element) {
        elements.push(element);
      }
    }

    if (model.border) {
      const element = drawWall(ctx, brush, model.border, false, palette, elements);
      if (element) {
        elements.push(element);
      }
    }

    // Draw citadel
    if (model.citadel && model.citadel.ward instanceof Castle) {
      const element = drawWall(ctx, brush, (model.citadel.ward as Castle).wall, true, palette, elements);
      if (element) {
        elements.push(element);
      }
    }

    

    ctx.restore();
    setMapElements(elements);
  };

  useEffect(() => {
    drawMap();
  }, [model]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find element under mouse
    const element = findElementAtPosition(x, y);
    
    if (element) {
      console.log('Found element:', element.type, element.tooltip); // Debug log
      setTooltip({
        content: element.tooltip,
        x: event.clientX,
        y: event.clientY,
        visible: true
      });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const findElementAtPosition = (x: number, y: number): MapElement | null => {
    const canvas = canvasRef.current;
    if (!canvas || mapElements.length === 0) return null;

    const { x: offsetX, y: offsetY, scale } = transform.current;

    // Transform mouse coordinates to world coordinates
    const worldX = (x - offsetX) / scale;
    const worldY = (y - offsetY) / scale;

    // Check each element in reverse order (top to bottom)
    for (let i = mapElements.length - 1; i >= 0; i--) {
      const element = mapElements[i];
      if (worldX >= element.bounds.minX && worldX <= element.bounds.maxX &&
          worldY >= element.bounds.minY && worldY <= element.bounds.maxY) {
        return element;
      }
    }
    return null;
  };

  const drawWard = (ctx: CanvasRenderingContext2D, brush: Brush, ward: Ward, palette: Palette, elements: MapElement[]): MapElement | null => {
    const patch = ward.patch;
    
    // Determine ward color based on type with improved contrast
    let fillColor: number;
    let strokeColor: number;
    let wardName: string;
    
    switch (ward.constructor) {
      case Castle:
        fillColor = palette.dark;
        strokeColor = palette.dark;
        wardName = 'Castle';
        break;
      case Market:
        fillColor = palette.light;
        strokeColor = palette.medium;
        wardName = 'Market';
        break;
      case Cathedral:
        fillColor = palette.paper;
        strokeColor = palette.dark;
        wardName = 'Cathedral';
        break;
      case MilitaryWard:
        fillColor = palette.dark;
        strokeColor = palette.medium;
        wardName = 'Military Ward';
        break;
      case PatriciateWard:
        fillColor = palette.light;
        strokeColor = palette.dark;
        wardName = 'Patriciate Ward';
        break;
      case CraftsmenWard:
        fillColor = palette.medium;
        strokeColor = palette.dark;
        wardName = 'Craftsmen Ward';
        break;
      case MerchantWard:
        fillColor = palette.light;
        strokeColor = palette.medium;
        wardName = 'Merchant Ward';
        break;
      case Slum:
        fillColor = palette.dark;
        strokeColor = palette.medium;
        wardName = 'Slum';
        break;
      case Park:
        fillColor = palette.paper;
        strokeColor = palette.light;
        wardName = 'Park';
        break;
      case Farm:
        fillColor = palette.light;
        strokeColor = palette.medium;
        wardName = 'Farm';
        break;
      default:
        fillColor = palette.medium;
        strokeColor = palette.dark;
        wardName = 'Common Ward';
        break;
    }

    // Calculate bounds for tooltip with some padding for easier detection
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const vertex of patch.shape.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }
    
    // Add padding to make detection easier
    const padding = 2;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Draw ward shape with improved rendering
    ctx.fillStyle = `#${fillColor.toString(16)}`;
    ctx.strokeStyle = `#${strokeColor.toString(16)}`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (const vertex of patch.shape.vertices) {
      ctx.lineTo(vertex.x, vertex.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw ward geometry if available with better detail
    if (ward.geometry && ward.geometry.length > 0) {
      const buildingElements = drawBuilding(ctx, brush, ward.geometry, fillColor, strokeColor, 1);
      elements.push(...buildingElements);
    }

    return {
      type: 'ward',
      element: ward,
      bounds: { minX, minY, maxX, maxY },
      tooltip: `${wardName} - ${ward.geometry?.length || 0} buildings`
    };
  };

  const drawRoad = (ctx: CanvasRenderingContext2D, brush: Brush, road: Street, palette: Palette, width: number = 1, type: string): MapElement | null => {
    if (road.vertices.length < 2) return null;

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const vertex of road.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    // Draw road with improved visual hierarchy
    ctx.strokeStyle = `#${palette.dark.toString(16)}`;
    ctx.lineWidth = width * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(road.vertices[0].x, road.vertices[0].y);
    for (let i = 1; i < road.vertices.length; i++) {
      ctx.lineTo(road.vertices[i].x, road.vertices[i].y);
    }
    ctx.stroke();

    // Draw road surface
    ctx.strokeStyle = `#${palette.medium.toString(16)}`;
    ctx.lineWidth = width;
    
    ctx.beginPath();
    ctx.moveTo(road.vertices[0].x, road.vertices[0].y);
    for (let i = 1; i < road.vertices.length; i++) {
      ctx.lineTo(road.vertices[i].x, road.vertices[i].y);
    }
    ctx.stroke();

    const typeNames = {
      street: 'Street',
      road: 'Road',
      artery: 'Main Street'
    };

    return {
      type: type as any,
      element: road,
      bounds: { minX, minY, maxX, maxY },
      tooltip: `${typeNames[type as keyof typeof typeNames]} - ${road.vertices.length} segments`
    };
  };

  const drawWall = (ctx: CanvasRenderingContext2D, brush: Brush, wall: CurtainWall, large: boolean, palette: Palette, elements: MapElement[]): MapElement | null => {
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const point of wall.shape.vertices) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    ctx.strokeStyle = `#${palette.dark.toString(16)}`;
    ctx.lineWidth = large ? 4 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    for (const point of wall.shape.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw gates
    for (const gate of wall.gates) {
      elements.push(drawGate(ctx, brush, wall.shape, gate, palette));
    }

    // Draw towers
    for (const tower of wall.towers) {
      elements.push(drawTower(ctx, brush, tower, large ? 3 : 2, palette));
    }

    return {
      type: 'wall',
      element: wall,
      bounds: { minX, minY, maxX, maxY },
      tooltip: `${large ? 'Castle' : 'City'} Wall - ${wall.gates.length} gates, ${wall.towers.length} towers`
    };
  };

  const drawTower = (ctx: CanvasRenderingContext2D, brush: Brush, p: Point, r: number, palette: Palette): MapElement => {
    ctx.fillStyle = `#${palette.dark.toString(16)}`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = `#${palette.medium.toString(16)}`;
    ctx.lineWidth = 1;
    ctx.stroke();

    return {
      type: 'tower',
      element: p,
      bounds: { minX: p.x - r, minY: p.y - r, maxX: p.x + r, maxY: p.y + r },
      tooltip: 'Tower'
    };
  };

  const drawGate = (ctx: CanvasRenderingContext2D, brush: Brush, wall: Polygon, gate: Point, palette: Palette): MapElement => {
    ctx.strokeStyle = `#${palette.dark.toString(16)}`;
    ctx.lineWidth = 3;
    
    const nextPoint = wall.next(gate);
    const prevPoint = wall.prev(gate);
    const dir = nextPoint.subtract(prevPoint).normalize().scale(4);
    
    ctx.beginPath();
    ctx.moveTo(gate.x - dir.x, gate.y - dir.y);
    ctx.lineTo(gate.x + dir.x, gate.y + dir.y);
    ctx.stroke();

    return {
      type: 'gate',
      element: gate,
      bounds: { minX: gate.x - 2, minY: gate.y - 2, maxX: gate.x + 2, maxY: gate.y + 2 },
      tooltip: 'Gate'
    };
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, brush: Brush, blocks: Polygon[], fill: number, line: number, thickness: number): MapElement[] => {
    const elements: MapElement[] = [];

    ctx.strokeStyle = `#${line.toString(16)}`;
    ctx.lineWidth = thickness;
    
    for (const block of blocks) {
      ctx.beginPath();
      for (const point of block.vertices) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.stroke();

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const vertex of block.vertices) {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
      }

      elements.push({
        type: 'ward',
        element: block,
        bounds: { minX, minY, maxX, maxY },
        tooltip: 'Building'
      });
    }

    ctx.fillStyle = `#${fill.toString(16)}`;
    for (const block of blocks) {
      ctx.beginPath();
      for (const point of block.vertices) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    return elements;
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      width: '100%',
      height: '100%',
      position: 'relative'
    }}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600}
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '100%',
          maxHeight: '100%',
          cursor: 'pointer'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <MapTooltip 
        content={tooltip.content}
        x={tooltip.x}
        y={tooltip.y}
        visible={tooltip.visible}
      />
    </div>
  );
};