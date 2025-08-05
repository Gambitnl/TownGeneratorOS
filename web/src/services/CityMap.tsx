import React, { useRef, useEffect } from 'react';
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

interface CityMapProps {
  model: Model;
}

export const CityMap: React.FC<CityMapProps> = ({ model }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    const palette = Palette.DEFAULT;
    const brush = new Brush(palette);

    // Clear canvas with background
    ctx.fillStyle = `#${palette.paper.toString(16)}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    const scale = Math.min(700 / (maxX - minX), 500 / (maxY - minY)) * 0.8;
    const offsetX = (canvas.width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2 - minY * scale;

    // Apply transformation
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw patches (wards)
    for (const patch of model.patches) {
      const ward = patch.ward;
      if (ward) {
        drawWard(ctx, brush, ward, palette);
      }
    }

    // Draw streets
    for (const street of model.streets) {
      drawRoad(ctx, brush, street, palette, 2);
    }

    // Draw roads
    for (const road of model.roads) {
      drawRoad(ctx, brush, road, palette, 1);
    }

    // Draw arteries
    for (const artery of model.arteries) {
      drawRoad(ctx, brush, artery, palette, 3);
    }

    // Draw walls
    if (model.wall) {
      drawWall(ctx, brush, model.wall, false, palette);
    }

    if (model.border) {
      drawWall(ctx, brush, model.border, false, palette);
    }

    // Draw citadel
    if (model.citadel && model.citadel.ward instanceof Castle) {
      drawWall(ctx, brush, (model.citadel.ward as Castle).wall, true, palette);
    }

    ctx.restore();
  }, [model]);

  const drawWard = (ctx: CanvasRenderingContext2D, brush: Brush, ward: Ward, palette: Palette) => {
    const patch = ward.patch;
    
    // Determine ward color based on type
    let fillColor: number;
    let strokeColor: number;
    
    switch (ward.constructor) {
      case Castle:
        fillColor = palette.dark;
        strokeColor = palette.dark;
        break;
      case Market:
        fillColor = palette.light;
        strokeColor = palette.medium;
        break;
      case Cathedral:
        fillColor = palette.paper;
        strokeColor = palette.dark;
        break;
      case MilitaryWard:
        fillColor = palette.dark;
        strokeColor = palette.medium;
        break;
      case PatriciateWard:
        fillColor = palette.light;
        strokeColor = palette.dark;
        break;
      case CraftsmenWard:
        fillColor = palette.medium;
        strokeColor = palette.dark;
        break;
      case MerchantWard:
        fillColor = palette.light;
        strokeColor = palette.medium;
        break;
      case Slum:
        fillColor = palette.dark;
        strokeColor = palette.medium;
        break;
      case Park:
        fillColor = palette.paper;
        strokeColor = palette.light;
        break;
      case Farm:
        fillColor = palette.light;
        strokeColor = palette.medium;
        break;
      default:
        fillColor = palette.medium;
        strokeColor = palette.dark;
        break;
    }

    // Draw ward shape
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

    // Draw ward geometry if available
    if (ward.geometry && ward.geometry.length > 0) {
      drawBuilding(ctx, brush, ward.geometry, fillColor, strokeColor, 1);
    }
  };

  const drawRoad = (ctx: CanvasRenderingContext2D, brush: Brush, road: Street, palette: Palette, width: number = 1) => {
    if (road.vertices.length < 2) return;

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
  };

  const drawWall = (ctx: CanvasRenderingContext2D, brush: Brush, wall: CurtainWall, large: boolean, palette: Palette) => {
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
      drawGate(ctx, brush, wall.shape, gate, palette);
    }

    // Draw towers
    for (const tower of wall.towers) {
      drawTower(ctx, brush, tower, large ? 3 : 2, palette);
    }
  };

  const drawTower = (ctx: CanvasRenderingContext2D, brush: Brush, p: Point, r: number, palette: Palette) => {
    ctx.fillStyle = `#${palette.dark.toString(16)}`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = `#${palette.medium.toString(16)}`;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawGate = (ctx: CanvasRenderingContext2D, brush: Brush, wall: Polygon, gate: Point, palette: Palette) => {
    ctx.strokeStyle = `#${palette.dark.toString(16)}`;
    ctx.lineWidth = 3;
    
    const nextPoint = wall.next(gate);
    const prevPoint = wall.prev(gate);
    const dir = nextPoint.subtract(prevPoint).normalize().scale(4);
    
    ctx.beginPath();
    ctx.moveTo(gate.x - dir.x, gate.y - dir.y);
    ctx.lineTo(gate.x + dir.x, gate.y + dir.y);
    ctx.stroke();
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, brush: Brush, blocks: Polygon[], fill: number, line: number, thickness: number) => {
    ctx.strokeStyle = `#${line.toString(16)}`;
    ctx.lineWidth = thickness;
    
    for (const block of blocks) {
      ctx.beginPath();
      for (const point of block.vertices) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.stroke();
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
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      width: '100%',
      height: '100%'
    }}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600}
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};