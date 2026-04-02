"use client";

import { useEffect, useRef } from "react";

const DS = 2.5;
const SP = 3.5;
const BG: [number, number, number] = [0.051, 0.059, 0.102];

const COLOR_STORY: [number, number, number][] = [
  [0.05, 0.15, 0.45],
  [0.1, 0.4, 1.0],
  [0.0, 0.6, 0.8],
  [0.0, 0.7, 0.4],
  [0.0, 0.85, 0.3],
  [0.5, 0.9, 0.1],
  [1.0, 0.65, 0.0],
  [1.0, 0.15, 0.45],
  [0.7, 0.0, 0.9],
  [0.55, 0.1, 1.0],
  [0.0, 0.5, 0.9],
  [0.0, 0.7, 0.6],
];

const NUM_MODES = 7;
const MODE_DURATION = 5;
const FADE_DURATION = 1.0;
const sC = COLOR_STORY.length;
const MODE_HAS_GRID = [true, false, false, false, true, true, false];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRGB(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgba(c: [number, number, number], a: number) {
  return `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${a})`;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function getCellColor(
  row: number,
  col: number,
  t: number,
  mode: number,
  COLS: number,
  ROWS: number,
): [number, number, number] {
  const speed = 1.5;
  let cp: number;
  switch (mode) {
    case 0:
      cp = mod(t * speed + (row * COLS + col) * 1.7, sC);
      break;
    case 1:
      cp = mod(t * speed + col * (sC / COLS), sC);
      break;
    case 2:
      cp = mod(t * speed + row * (sC / ROWS), sC);
      break;
    case 3:
      cp = mod(t * speed + (col + row) * 1.5, sC);
      break;
    case 4: {
      const dr = row - (ROWS - 1) / 2;
      const dc = col - (COLS - 1) / 2;
      cp = mod(t * speed + Math.sqrt(dr * dr + dc * dc) * 2.5, sC);
      break;
    }
    case 5:
      cp = mod(t * speed + col * (sC / COLS) + row * 0.5, sC);
      break;
    default:
      cp = mod(t * speed + (COLS - col + ROWS - row) * 1.5, sC);
      break;
  }
  const ci = Math.floor(cp) % sC;
  return lerpRGB(COLOR_STORY[ci], COLOR_STORY[(ci + 1) % sC], cp - Math.floor(cp));
}

export default function PolymarketCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let COLS = 0;
    let ROWS = 0;
    let startTime: number | null = null;
    let animId: number;

    const GAP = SP * 3;

    function computeGrid() {
      const target = 140;
      COLS = Math.max(3, Math.round(W / target));
      ROWS = Math.max(3, Math.round(H / target));
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeGrid();
    }

    function frame(ts: number) {
      if (!startTime) startTime = ts;
      const t = (ts - startTime) / 1000;

      ctx!.fillStyle = rgba(BG, 1);
      ctx!.fillRect(0, 0, W, H);

      const cyclePos = t / MODE_DURATION;
      const curMode = Math.floor(cyclePos) % NUM_MODES;
      const nxtMode = (curMode + 1) % NUM_MODES;
      const modeT = cyclePos - Math.floor(cyclePos);
      const fadeStart = 1 - FADE_DURATION / MODE_DURATION;
      const blend = modeT > fadeStart ? (modeT - fadeStart) / (1 - fadeStart) : 0;

      const showGrid =
        blend < 0.5 ? MODE_HAS_GRID[curMode] : MODE_HAS_GRID[nxtMode];
      const gap = showGrid ? GAP : 0;
      const cellW = (W - (COLS - 1) * gap) / COLS;
      const cellH = (H - (ROWS - 1) * gap) / ROWS;

      const totalDotCols = Math.floor(W / SP);
      const totalDotRows = Math.floor(H / SP);

      for (let dr = 0; dr < totalDotRows; dr++) {
        const py = dr * SP + (SP - DS) / 2;
        let cellRow: number;
        let insideGapY = false;
        if (showGrid) {
          cellRow = Math.floor(py / (cellH + gap));
          if (cellRow >= ROWS) cellRow = ROWS - 1;
          const cellTopY = cellRow * (cellH + gap);
          if (py >= cellTopY + cellH && py < cellTopY + cellH + gap)
            insideGapY = true;
        } else {
          cellRow = Math.min(
            Math.floor(dr / (totalDotRows / ROWS)),
            ROWS - 1,
          );
        }

        for (let dc = 0; dc < totalDotCols; dc++) {
          const px = dc * SP + (SP - DS) / 2;
          let cellCol: number;
          let insideGapX = false;
          if (showGrid) {
            cellCol = Math.floor(px / (cellW + gap));
            if (cellCol >= COLS) cellCol = COLS - 1;
            const cellLeftX = cellCol * (cellW + gap);
            if (px >= cellLeftX + cellW && px < cellLeftX + cellW + gap)
              insideGapX = true;
          } else {
            cellCol = Math.min(
              Math.floor(dc / (totalDotCols / COLS)),
              COLS - 1,
            );
          }

          if (insideGapX || insideGapY) continue;

          let color = getCellColor(cellRow, cellCol, t, curMode, COLS, ROWS);
          if (blend > 0) {
            color = lerpRGB(
              color,
              getCellColor(cellRow, cellCol, t, nxtMode, COLS, ROWS),
              blend,
            );
          }

          const scanDim = dr % 2 === 0 ? 1 : 0.55;
          ctx!.fillStyle = rgba(color, 0.35 * scanDim);
          ctx!.fillRect(px, py, DS, DS);
        }
      }

      animId = requestAnimationFrame(frame);
    }

    resize();
    animId = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}
