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

    const palette = Palette.DEFAULT;
    const brush = new Brush(palette);

    ctx.fillStyle = `#${palette.paper.toString(16)}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const road of model.roads) {
      drawRoad(ctx, brush, road, palette);
    }

    for (const patch of model.patches) {
      const ward = patch.ward;
      if (ward) {
        switch (ward.constructor) {
          case Castle:
            drawBuilding(ctx, brush, ward.geometry, palette.light, palette.dark, Brush.NORMAL_STROKE * 2);
            break;
          // Add other ward types here
        }
      }
    }

    if (model.wall) {
      drawWall(ctx, brush, model.wall, false, palette);
    }

    if (model.citadel) {
      drawWall(ctx, brush, (model.citadel.ward as Castle).wall, true, palette);
    }
  }, [model]);

  const drawRoad = (ctx: CanvasRenderingContext2D, brush: Brush, road: Street, palette: Palette) => {
    ctx.strokeStyle = `#${palette.medium.toString(16)}`;
    ctx.lineWidth = Ward.MAIN_STREET + Brush.NORMAL_STROKE;
    ctx.beginPath();
    for (const point of road.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    ctx.strokeStyle = `#${palette.paper.toString(16)}`;
    ctx.lineWidth = Ward.MAIN_STREET - Brush.NORMAL_STROKE;
    ctx.beginPath();
    for (const point of road.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  };

  const drawWall = (ctx: CanvasRenderingContext2D, brush: Brush, wall: CurtainWall, large: boolean, palette: Palette) => {
    ctx.strokeStyle = `#${palette.dark.toString(16)}`;
    ctx.lineWidth = Brush.THICK_STROKE;
    ctx.beginPath();
    for (const point of wall.shape.vertices) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.stroke();

    for (const gate of wall.gates) {
      drawGate(ctx, brush, wall.shape, gate, palette);
    }

    for (const tower of wall.towers) {
      drawTower(ctx, brush, tower, Brush.THICK_STROKE * (large ? 1.5 : 1), palette);
    }
  };

  const drawTower = (ctx: CanvasRenderingContext2D, brush: Brush, p: Point, r: number, palette: Palette) => {
    ctx.fillStyle = `#${palette.dark.toString(16)}`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawGate = (ctx: CanvasRenderingContext2D, brush: Brush, wall: Polygon, gate: Point, palette: Palette) => {
    ctx.strokeStyle = `#${palette.dark.toString(16)}`;
    ctx.lineWidth = Brush.THICK_STROKE * 2;
    const dir = wall.next(gate).subtract(wall.prev(gate)).normalize().scale(Brush.THICK_STROKE * 1.5);
    ctx.beginPath();
    ctx.moveTo(gate.x - dir.x, gate.y - dir.y);
    ctx.lineTo(gate.x + dir.x, gate.y + dir.y);
    ctx.stroke();
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, brush: Brush, blocks: Polygon[], fill: number, line: number, thickness: number) => {
    ctx.strokeStyle = `#${line.toString(16)}`;
    ctx.lineWidth = thickness * 2;
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

  return <canvas ref={canvasRef} width={800} height={600} />;
};