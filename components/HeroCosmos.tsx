"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Two observed cosmic structures, interpreted as living ASCII:
 * V838 Monocerotis' light echo and Wolf-Rayet 140's nested dust shells.
 * One is selected at random for each visit.
 */

const FPS = 15;
const FRAME_MS = 1000 / FPS;
const SETTLED_FPS = 8;
const SETTLED_FRAME_MS = 1000 / SETTLED_FPS;
const ECHO_DURATION = 14;
const FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const GLYPHS = [
  ".",
  "'",
  ":",
  ";",
  "~",
  "-",
  "=",
  "+",
  "*",
  "#",
  "%",
  "@",
  "|",
  "/",
  "\\",
];
const DENSITY_RAMP = [".", "'", ":", ";", "+", "*", "#", "%", "@"];
const COLORS = [
  "#20201f",
  "#2a2928",
  "#343331",
  "#4a4844",
  "#66635e",
  "#8c8880",
  "#b3aea3",
  "#e0dcd1",
  "#4b2927",
  "#854034",
  "#c56545",
  "#e99b63",
  "#f0c29c",
  "#a9c0c5",
  "#f3eee3",
  "#8f623d",
  "#c98f56",
  "#f2d0a0",
];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (value) => (value + 0.5) / 16 - 0.5,
);

const STARS = [
  { x: 0.08, y: 0.13, warm: false, phase: 0.4, speed: 0.31, size: 0 },
  { x: 0.24, y: 0.08, warm: true, phase: 4.1, speed: 0.24, size: 0 },
  { x: 0.78, y: 0.09, warm: false, phase: 2.7, speed: 0.41, size: 1 },
  { x: 0.91, y: 0.28, warm: false, phase: 4.2, speed: 0.27, size: 0 },
  { x: 0.13, y: 0.37, warm: false, phase: 1.2, speed: 0.34, size: 1 },
  { x: 0.87, y: 0.48, warm: true, phase: 3.2, speed: 0.21, size: 0 },
  { x: 0.39, y: 0.43, warm: false, phase: 0.9, speed: 0.38, size: 1 },
  { x: 0.58, y: 0.41, warm: true, phase: 4.8, speed: 0.3, size: 0 },
  { x: 0.57, y: 0.59, warm: false, phase: 2.4, speed: 0.33, size: 1 },
  { x: 0.42, y: 0.63, warm: true, phase: 5.7, speed: 0.28, size: 0 },
  { x: 0.09, y: 0.72, warm: true, phase: 1.8, speed: 0.36, size: 0 },
  { x: 0.86, y: 0.78, warm: false, phase: 5.1, speed: 0.34, size: 1 },
  { x: 0.28, y: 0.91, warm: false, phase: 3.3, speed: 0.29, size: 0 },
  { x: 0.68, y: 0.93, warm: true, phase: 2.2, speed: 0.25, size: 0 },
];

const WR140_STARS = [
  { x: 0.1, y: 0.16, warm: false, phase: 0.4, speed: 0.31 },
  { x: 0.79, y: 0.1, warm: false, phase: 2.7, speed: 0.41 },
  { x: 0.91, y: 0.32, warm: false, phase: 4.2, speed: 0.27 },
  { x: 0.12, y: 0.69, warm: true, phase: 1.8, speed: 0.36 },
  { x: 0.84, y: 0.8, warm: false, phase: 5.1, speed: 0.34 },
  { x: 0.31, y: 0.91, warm: false, phase: 3.3, speed: 0.29 },
];

type CosmosVariant = "v838" | "wr140";

type Atlas = {
  canvas: HTMLCanvasElement;
  tileWidth: number;
  tileHeight: number;
  cssTileWidth: number;
  cssTileHeight: number;
  glyphIndex: Map<string, number>;
};

type State = {
  width: number;
  height: number;
  dpr: number;
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  fontSize: number;
  atlas: Atlas;
  memory: Float32Array;
  initialized: boolean;
};

function clamp(value: number, low = 0, high = 1): number {
  return Math.min(high, Math.max(low, value));
}

function mix(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

function smoothstep(low: number, high: number, value: number): number {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
}

function hash2(x: number, y: number, seed: number): number {
  let value =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(seed, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise2(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const ux = tx * tx * (3 - 2 * tx);
  const uy = ty * ty * (3 - 2 * ty);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  return mix(mix(a, b, ux), mix(c, d, ux), uy);
}

function fbm(x: number, y: number, seed: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.55;
  let total = 0;

  for (let octave = 0; octave < octaves; octave++) {
    value += noise2(x, y, seed + octave * 31) * amplitude;
    total += amplitude;
    const nextX = x * 1.73 - y * 1.28 + 5.17;
    y = x * 1.28 + y * 1.73 - 3.43;
    x = nextX;
    amplitude *= 0.5;
  }

  return value / total;
}

function gaussian(value: number, width: number): number {
  return Math.exp(-Math.pow(value / width, 2));
}

function makeAtlas(
  fontSize: number,
  cellWidth: number,
  cellHeight: number,
  dpr: number,
): Atlas {
  const padding = 1.5;
  const cssTileWidth = cellWidth + padding * 2;
  const cssTileHeight = cellHeight + padding * 2;
  const tileWidth = Math.ceil(cssTileWidth * dpr);
  const tileHeight = Math.ceil(cssTileHeight * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = tileWidth * GLYPHS.length;
  canvas.height = tileHeight * COLORS.length;
  const context = canvas.getContext("2d");

  if (context) {
    context.scale(dpr, dpr);
    context.font = `400 ${fontSize}px ${FONT_STACK}`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    for (let color = 0; color < COLORS.length; color++) {
      context.fillStyle = COLORS[color];
      for (let glyph = 0; glyph < GLYPHS.length; glyph++) {
        context.fillText(
          GLYPHS[glyph],
          (glyph * tileWidth) / dpr + cssTileWidth / 2,
          (color * tileHeight) / dpr + cssTileHeight / 2,
        );
      }
    }
  }

  return {
    canvas,
    tileWidth,
    tileHeight,
    cssTileWidth,
    cssTileHeight,
    glyphIndex: new Map(GLYPHS.map((glyph, index) => [glyph, index])),
  };
}

function buildState(canvas: HTMLCanvasElement): State | null {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width < 2 || bounds.height < 2) return null;

  const width = bounds.width;
  const height = bounds.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cols = Math.round(clamp(width / 5.2, 70, 128));
  const cellWidth = width / cols;
  const fontSize = cellWidth / 0.61;
  const cellHeight = fontSize * 0.86;
  const rows = Math.ceil(height / cellHeight);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  return {
    width,
    height,
    dpr,
    cols,
    rows,
    cellWidth,
    cellHeight,
    fontSize,
    atlas: makeAtlas(fontSize, cellWidth, cellHeight, dpr),
    memory: new Float32Array(cols * rows),
    initialized: false,
  };
}

function tangentGlyph(angle: number): string {
  const x = Math.abs(Math.cos(angle));
  const y = Math.abs(Math.sin(angle));
  if (x > 0.88) return "|";
  if (y > 0.88) return "-";
  return Math.sin(angle) * Math.cos(angle) > 0 ? "/" : "\\";
}

function rayGlyph(x: number, y: number): string {
  const distances = [
    { glyph: "-", distance: Math.abs(y) },
    { glyph: "|", distance: Math.abs(x) },
    { glyph: "\\", distance: Math.abs(y - x * 1.2) },
    { glyph: "/", distance: Math.abs(y + x * 1.2) },
  ];
  distances.sort((a, b) => a.distance - b.distance);
  return distances[0].glyph;
}

function drawGlyph(
  context: CanvasRenderingContext2D,
  state: State,
  glyph: string,
  colorIndex: number,
  col: number,
  row: number,
): void {
  const glyphIndex = state.atlas.glyphIndex.get(glyph) ?? 0;
  const sourceX = glyphIndex * state.atlas.tileWidth;
  const sourceY = colorIndex * state.atlas.tileHeight;
  const destinationX =
    (col + 0.5) * state.cellWidth - state.atlas.cssTileWidth / 2;
  const destinationY =
    (row + 0.5) * state.cellHeight - state.atlas.cssTileHeight / 2;

  context.drawImage(
    state.atlas.canvas,
    sourceX,
    sourceY,
    state.atlas.tileWidth,
    state.atlas.tileHeight,
    destinationX,
    destinationY,
    state.atlas.cssTileWidth,
    state.atlas.cssTileHeight,
  );
}

function drawCore(
  context: CanvasRenderingContext2D,
  state: State,
  seconds: number,
  centerX: number,
  centerY: number,
): void {
  const pulse = 0.88 + Math.sin(seconds * 0.72) * 0.12;
  const ray = state.fontSize * (1.8 + pulse * 0.9);

  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `400 ${state.fontSize * 0.68}px ${FONT_STACK}`;
  context.globalAlpha = 0.15 + pulse * 0.12;
  context.fillStyle = "#c56545";
  context.fillText("---------", centerX, centerY);
  context.fillText("\\       /", centerX, centerY);
  context.fillText("|", centerX, centerY - ray * 1.45);
  context.fillText("|", centerX, centerY + ray * 1.45);

  context.globalAlpha = 0.65;
  context.font = `400 ${state.fontSize * 1.45}px ${FONT_STACK}`;
  context.fillStyle = "#f3eee3";
  context.fillText("+", centerX, centerY);
  context.globalAlpha = 1;
  context.font = `400 ${state.fontSize * 0.92}px ${FONT_STACK}`;
  context.fillStyle = "#f0c29c";
  context.fillText("*", centerX, centerY);
  context.restore();
}

function drawWR140Binary(
  context: CanvasRenderingContext2D,
  state: State,
  seconds: number,
  centerX: number,
  centerY: number,
): void {
  const orbit = seconds * 0.16;
  const separation = state.fontSize * 0.55;

  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `400 ${state.fontSize * 1.25}px ${FONT_STACK}`;
  context.globalAlpha = 0.98;
  context.fillStyle = "#f2d0a0";
  context.fillText(
    "*",
    centerX + Math.cos(orbit) * separation,
    centerY + Math.sin(orbit) * separation * 0.38,
  );
  context.fillStyle = "#e0dcd1";
  context.fillText(
    "+",
    centerX - Math.cos(orbit) * separation,
    centerY - Math.sin(orbit) * separation * 0.38,
  );
  context.restore();
}

function renderV838(
  canvas: HTMLCanvasElement,
  state: State,
  seconds: number,
  settle = false,
): void {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  context.imageSmoothingEnabled = true;

  const minDimension = Math.min(state.width, state.height);
  const centerX = state.width * 0.49;
  const centerY = state.height * 0.5;
  const centerNX = centerX / state.width;
  const centerNY = centerY / state.height;
  const smoothing = settle || !state.initialized ? 1 : 0.14;

  // One journey only. The front settles after revealing the whole cloud.
  const linearProgress = clamp(seconds / ECHO_DURATION);
  const progress = 1 - Math.pow(1 - linearProgress, 1.7);
  const formationTime = Math.min(seconds, ECHO_DURATION);
  const echoFront =
    0.12 + progress * 0.43 + Math.sin(formationTime * 0.13) * 0.0035;
  const flash = gaussian(progress, 0.055);
  const finalHold = smoothstep(0.88, 1, progress);
  const matureSeconds = Math.max(0, seconds - ECHO_DURATION);
  const orbit = matureSeconds * 0.055;
  const orbitX = Math.cos(orbit);
  const orbitY = Math.sin(orbit);
  const roll = Math.sin(orbit * 0.37) * 0.035 * finalHold;
  const rollCos = Math.cos(roll);
  const rollSin = Math.sin(roll);

  for (let row = 0; row < state.rows; row++) {
    const ny = (row + 0.5) / state.rows;
    for (let col = 0; col < state.cols; col++) {
      const nx = (col + 0.5) / state.cols;
      const x = ((nx - centerNX) * state.width) / minDimension;
      const y = ((ny - centerNY) * state.height) / minDimension;
      const screenRadius = Math.sqrt(x * x + y * y);
      const index = row * state.cols + col;

      if (screenRadius > 0.62) {
        state.memory[index] *= 1 - smoothing;
        continue;
      }

      // At maturity, orbit the viewpoint around the same final cloud. The
      // restrained roll, perspective squeeze, and depth parallax contour it
      // without restarting or rotating it like a flat graphic.
      const depth = fbm(x * 2.35 + 13.2, y * 2.35 - 6.7, 379, 3) - 0.5;
      const rolledX = x * rollCos - y * rollSin;
      const rolledY = x * rollSin + y * rollCos;
      const perspectiveX = 1 + orbitY * 0.065 * finalHold;
      const perspectiveY = 1 + Math.cos(orbit * 0.78) * 0.038 * finalHold;
      const sceneX =
        rolledX / perspectiveX +
        (orbitX * depth * 0.025 + orbitY * 0.005) * finalHold;
      const sceneY =
        rolledY / perspectiveY +
        (orbitY * depth * 0.017 - orbitX * 0.004) * finalHold;
      const radius = Math.sqrt(sceneX * sceneX + sceneY * sceneY);
      const angle = Math.atan2(sceneY, sceneX);

      // Domain-warp the coordinate field once. This topology never expands;
      // the light front below merely discovers different parts of it.
      const warpA = fbm(sceneX * 2.8 + 4.3, sceneY * 2.8 - 7.1, 41, 4) - 0.5;
      const warpB = fbm(sceneX * 3.1 - 8.7, sceneY * 3.1 + 2.6, 83, 4) - 0.5;
      const wx = sceneX + warpA * 0.09 + Math.sin(angle * 3 - 0.4) * 0.008;
      const wy = sceneY + warpB * 0.075 + Math.cos(angle * 4 + 0.7) * 0.007;
      const warpedRadius = Math.sqrt(wx * wx * 0.94 + wy * wy * 1.05);
      const warpedAngle = Math.atan2(wy, wx);

      const broadDust = fbm(wx * 5.2 + 11.7, wy * 5.2 - 3.8, 127, 5);
      const fineDust = fbm(wx * 14.5 - 1.3, wy * 14.5 + 9.1, 211, 4);
      const grain = fbm(wx * 27.0 + 5.4, wy * 27.0 - 2.2, 307, 3);

      const outerEdge =
        0.47 +
        Math.sin(warpedAngle * 3 + 0.8) * 0.026 +
        Math.sin(warpedAngle * 7 - 1.2) * 0.012 +
        (broadDust - 0.5) * 0.055;
      const envelope =
        smoothstep(0.1, 0.15, warpedRadius) *
        (1 - smoothstep(outerEdge - 0.045, outerEdge, warpedRadius));

      // Long curled ridges and small eddies produce the recognizable,
      // Van-Gogh-like dust sheets in the Hubble image.
      const spiralCoordinate =
        warpedRadius * 46 -
        warpedAngle * 2.1 +
        (broadDust - 0.5) * 12 +
        Math.sin(warpedAngle * 5 + warpedRadius * 11) * 1.3;
      const ridgeWave = 0.5 + 0.5 * Math.cos(spiralCoordinate);
      const ridges = Math.pow(smoothstep(0.48, 0.96, ridgeWave), 1.4);
      const knots = smoothstep(
        0.49,
        0.78,
        broadDust * 0.57 + fineDust * 0.31 + grain * 0.12,
      );
      let dust =
        envelope *
        clamp(
          0.07 +
            knots * 0.84 +
            ridges * 0.62 +
            Math.max(0, broadDust - 0.48) * 0.42,
        );

      // Art-directed gaps recreate the broken, layered structure: the dark
      // upper-left bay and the smaller lower-left cavity remain fixed.
      const upperBay = Math.exp(
        -(
          Math.pow((sceneX + 0.16) / 0.19, 2) +
          Math.pow((sceneY + 0.11) / 0.12, 2)
        ),
      );
      const lowerBay = Math.exp(
        -(
          Math.pow((sceneX + 0.14) / 0.13, 2) +
          Math.pow((sceneY - 0.2) / 0.14, 2)
        ),
      );
      dust *= 1 - upperBay * 0.78;
      dust *= 1 - lowerBay * 0.48;

      // A thick advancing front, a dim afterglow, and two optical folds.
      // Only existing dust responds, so the scene reveals rather than scales.
      const frontWarp =
        warpedRadius +
        (broadDust - 0.5) * 0.026 +
        Math.sin(warpedAngle * 6 + 0.6) * 0.007;
      const spectralSweep =
        0.5 +
        0.5 *
          Math.sin(
            seconds * 0.14 -
              frontWarp * 22 +
              warpedAngle * 1.7 +
              broadDust * 3.2,
          );
      const frontWidth = 0.023 + Math.sin(formationTime * 0.19) * 0.003;
      const leadingEdge = gaussian(frontWarp - echoFront, frontWidth);
      const afterglow =
        smoothstep(echoFront + 0.02, echoFront - 0.075, frontWarp) *
        smoothstep(0.08, 0.2, frontWarp);
      const foldA = gaussian(frontWarp - (echoFront - 0.075), 0.014);
      const foldB = gaussian(frontWarp - (echoFront - 0.14), 0.011);
      const illumination =
        (leadingEdge * 1.08 +
          afterglow * (0.47 + finalHold * 0.2) +
          foldA * 0.38 +
          foldB * 0.2) *
        (0.88 + spectralSweep * 0.12);

      // The original outburst leaves a warm inner halo, without turning the
      // whole piece into a permanent glowing disc.
      const innerHalo =
        gaussian(warpedRadius - 0.105, 0.055) *
        (0.2 + broadDust * 0.25) *
        (0.55 + flash);
      const core = gaussian(screenRadius, 0.022) * (0.55 + flash * 1.6);
      let target = dust * illumination * 1.28 + innerHalo + core;
      target = clamp(target);

      const previous = state.memory[index];
      const density = previous + (target - previous) * smoothing;
      state.memory[index] = density;

      const dither = BAYER[(row & 3) * 4 + (col & 3)] * 0.065;
      const tone = Math.pow(smoothstep(0.025, 0.9, density), 0.9);
      const quantized = tone + dither;
      if (quantized < 0.055) continue;

      let glyph: string;
      if (leadingEdge * dust > 0.2 || ridges * dust * illumination > 0.3) {
        glyph = tangentGlyph(warpedAngle + (broadDust - 0.5) * 1.8);
      } else {
        const rampIndex = Math.min(
          DENSITY_RAMP.length - 1,
          Math.max(0, Math.floor(quantized * DENSITY_RAMP.length)),
        );
        glyph = DENSITY_RAMP[rampIndex];
      }

      const warm =
        warpedRadius < 0.34 &&
        (illumination * dust > 0.055 || innerHalo > 0.025);
      let colorIndex: number;
      if (warm) {
        const heat =
          smoothstep(0.36, 0.08, warpedRadius) * 0.72 + spectralSweep * 0.28;
        colorIndex =
          tone > 0.6
            ? heat > 0.67
              ? 12
              : 11
            : tone > 0.32
              ? heat > 0.56
                ? 11
                : 10
              : heat > 0.63
                ? 9
                : 8;
      } else if (tone > 0.48 && leadingEdge > 0.26 && spectralSweep > 0.45) {
        colorIndex = spectralSweep > 0.76 ? 14 : 13;
      } else {
        colorIndex = Math.min(7, Math.max(0, Math.floor(tone * 8)));
      }
      drawGlyph(context, state, glyph, colorIndex, col, row);
    }
  }

  state.initialized = true;

  context.font = `400 ${state.fontSize * 0.88}px ${FONT_STACK}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const star of STARS) {
    const pulse = 0.5 + 0.5 * Math.sin(seconds * star.speed + star.phase);
    context.globalAlpha = 0.12 + pulse * (star.size ? 0.48 : 0.28);
    context.fillStyle = star.warm ? "#e99b63" : "#a9c0c5";
    context.fillText(
      star.size ? "+" : ".",
      star.x * state.width,
      star.y * state.height,
    );
  }
  context.globalAlpha = 1;

  drawCore(context, state, seconds, centerX, centerY);
}

function renderWR140(
  canvas: HTMLCanvasElement,
  state: State,
  seconds: number,
  settle = false,
): void {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  context.imageSmoothingEnabled = true;

  const minDimension = Math.min(state.width, state.height);
  const centerX = state.width * 0.44;
  const centerY = state.height * 0.49;
  const centerNX = centerX / state.width;
  const centerNY = centerY / state.height;
  const shellSpacing = 0.027;
  const expansion = (seconds * 0.0009) % shellSpacing;
  const smoothing = settle || !state.initialized ? 1 : 0.2;
  const coreBreath = 0.82 + Math.sin(seconds * 0.42) * 0.18;

  for (let row = 0; row < state.rows; row++) {
    const ny = (row + 0.5) / state.rows;
    for (let col = 0; col < state.cols; col++) {
      const nx = (col + 0.5) / state.cols;
      const x = ((nx - centerNX) * state.width) / minDimension;
      const y = ((ny - centerNY) * state.height) / minDimension;
      const radius = Math.sqrt(x * x + y * y);
      const angle = Math.atan2(y, x);
      const index = row * state.cols + col;

      if (radius > 0.61) {
        state.memory[index] *= 1 - smoothing;
        continue;
      }

      const broadNoise = fbm(
        x * 3.1 + seconds * 0.011,
        y * 3.1 - seconds * 0.008,
        71,
        3,
      );
      const grain = fbm(
        x * 10.8 - seconds * 0.028,
        y * 10.8 + seconds * 0.021,
        149,
        3,
      );

      const buckle =
        (broadNoise - 0.5) * 0.016 +
        Math.sin(angle * 3 + seconds * 0.045) * 0.004;
      const shellCoordinate =
        (radius + buckle - 0.07 - expansion) / shellSpacing;
      const shellNumber = Math.floor(shellCoordinate + 0.5);
      const shellDistance =
        Math.abs(shellCoordinate - Math.round(shellCoordinate)) * shellSpacing;
      const shellWidth = 0.0026 + radius * 0.0018;
      const shellBand = gaussian(shellDistance, shellWidth);
      const inShellRange = shellNumber >= 0 && shellNumber < 17 ? 1 : 0;

      const right = smoothstep(-0.58, 0.72, Math.cos(angle));
      const lower = smoothstep(-0.36, 0.86, Math.sin(angle));
      const upperRight = smoothstep(0.08, 0.9, Math.cos(angle - 0.72));
      const upperLeftGap =
        1 - smoothstep(0.46, 0.96, Math.cos(angle + 2.28)) * 0.92;
      const shellVisibility =
        clamp(0.05 + right * 0.57 + lower * 0.31 + upperRight * 0.24) *
        upperLeftGap *
        (0.56 + grain * 0.58);
      const shells = shellBand * inShellRange * shellVisibility;

      const plumeX = x - 0.19;
      const plumeY = y - 0.13;
      const plumeShape = Math.exp(
        -(Math.pow(plumeX / 0.29, 2) + Math.pow(plumeY / 0.16, 2)),
      );
      const warmPlume =
        plumeShape *
        smoothstep(0.38, 0.78, broadNoise * 0.6 + grain * 0.4) *
        0.5;

      const wakeShape = Math.exp(
        -(Math.pow((x + 0.19) / 0.31, 2) + Math.pow((y + 0.01) / 0.085, 2)),
      );
      const wake = wakeShape * (0.08 + broadNoise * 0.2);

      const rayDistance = Math.min(
        Math.abs(y),
        Math.abs(x),
        Math.abs(y - x * 1.2),
        Math.abs(y + x * 1.2),
      );
      const rays =
        gaussian(rayDistance, 0.0038) *
        (1 - smoothstep(0.08, 0.58, radius)) *
        (0.08 + grain * 0.13);

      const core = gaussian(radius, 0.032) * coreBreath;
      let target = shells * 0.87 + warmPlume + wake + rays + core * 1.25;
      target = clamp(target);

      const previous = state.memory[index];
      const density = previous + (target - previous) * smoothing;
      state.memory[index] = density;

      const dither = BAYER[(row & 3) * 4 + (col & 3)] * 0.065;
      const tone = Math.pow(smoothstep(0.025, 0.9, density), 0.9);
      const quantized = tone + dither;
      if (quantized < 0.055) continue;

      let glyph: string;
      if (shells > Math.max(warmPlume, wake, rays) * 0.9) {
        glyph = tangentGlyph(angle);
      } else if (rays > Math.max(shells, warmPlume, wake)) {
        glyph = rayGlyph(x, y);
      } else {
        const rampIndex = Math.min(
          DENSITY_RAMP.length - 1,
          Math.max(0, Math.floor(quantized * DENSITY_RAMP.length)),
        );
        glyph = DENSITY_RAMP[rampIndex];
      }

      const warm =
        warmPlume > 0.055 ||
        (radius < 0.13 && x > -0.015 && (shells > 0.12 || core > 0.08));
      const colorIndex = warm
        ? tone > 0.72
          ? 17
          : tone > 0.4
            ? 16
            : 15
        : Math.min(7, Math.max(0, Math.floor(tone * 8)));
      drawGlyph(context, state, glyph, colorIndex, col, row);
    }
  }

  state.initialized = true;

  context.font = `400 ${state.fontSize * 0.9}px ${FONT_STACK}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const star of WR140_STARS) {
    const pulse = 0.5 + 0.5 * Math.sin(seconds * star.speed + star.phase);
    context.globalAlpha = 0.12 + pulse * 0.32;
    context.fillStyle = star.warm ? "#c98f56" : "#8c8880";
    context.fillText(".", star.x * state.width, star.y * state.height);
  }
  context.globalAlpha = 1;

  drawWR140Binary(context, state, seconds, centerX, centerY);
}

function renderCosmos(
  canvas: HTMLCanvasElement,
  state: State,
  seconds: number,
  variant: CosmosVariant,
  settle = false,
): void {
  if (variant === "wr140") {
    renderWR140(canvas, state, seconds, settle);
  } else {
    renderV838(canvas, state, seconds, settle);
  }
}

export default function HeroCosmos() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [variant, setVariant] = useState<CosmosVariant | null>(null);

  useEffect(() => {
    setVariant(Math.random() < 0.5 ? "v838" : "wr140");
  }, []);

  useEffect(() => {
    if (!variant) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let state: State | null = null;
    let raf = 0;
    let resizeRaf = 0;
    let activeSeconds = variant === "v838" ? 0.35 : 6.5;
    let lastFrame = 0;
    let lastTick = performance.now();
    let intersecting = true;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const canAnimate = () =>
      !motion.matches && intersecting && document.visibilityState === "visible";

    const schedule = () => {
      if (!raf && canAnimate()) raf = requestAnimationFrame(loop);
    };

    const loop = (now: number) => {
      raf = 0;
      const delta = Math.min(100, now - lastTick);
      lastTick = now;
      activeSeconds += delta / 1000;
      const frameInterval =
        variant === "v838" && activeSeconds >= ECHO_DURATION
          ? SETTLED_FRAME_MS
          : FRAME_MS;

      if (state && now - lastFrame >= frameInterval) {
        renderCosmos(canvas, state, activeSeconds, variant);
        lastFrame = now;
      }
      schedule();
    };

    const resize = () => {
      resizeRaf = 0;
      const next = buildState(canvas);
      if (!next) return;
      if (
        state &&
        Math.abs(state.width - next.width) < 2 &&
        Math.abs(state.height - next.height) < 2 &&
        state.dpr === next.dpr
      ) {
        return;
      }
      state = next;
      renderCosmos(canvas, state, activeSeconds, variant, true);
      lastTick = performance.now();
      schedule();
    };

    const queueResize = () => {
      if (!resizeRaf) resizeRaf = requestAnimationFrame(resize);
    };

    const onVisibility = () => {
      lastTick = performance.now();
      schedule();
    };

    const onMotion = () => {
      if (motion.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        activeSeconds = variant === "v838" ? ECHO_DURATION : 10.5;
        if (state) {
          renderCosmos(canvas, state, activeSeconds, variant, true);
        }
      } else {
        lastTick = performance.now();
        schedule();
      }
    };

    const resizeObserver = new ResizeObserver(queueResize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        lastTick = performance.now();
        schedule();
      },
      { threshold: 0.02 },
    );

    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    queueResize();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, [variant]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
      {variant && (
        <p
          style={{
            position: "absolute",
            right: "clamp(12px, 3.5%, 24px)",
            bottom: "clamp(12px, 3%, 22px)",
            zIndex: 1,
            width: "min(76%, 390px)",
            margin: 0,
            color: "#8c8880",
            fontFamily: FONT_STACK,
            fontSize: "clamp(8px, 0.82vw, 10px)",
            fontWeight: 400,
            lineHeight: 1.45,
            letterSpacing: "0.035em",
            textAlign: "right",
            textWrap: "balance",
            opacity: 0.62,
            pointerEvents: "none",
          }}
        >
          {variant === "v838"
            ? "“Light Echo” Illuminates Dust Around Supergiant Star V838 Monocerotis (V838 Mon)"
            : "Wolf-Rayet 140"}
        </p>
      )}
    </>
  );
}
