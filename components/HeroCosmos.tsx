"use client";

import { useEffect, useRef } from "react";

/**
 * Toone Cosmos — a procedural, indexed pixel-art "living nebula" for the hero.
 *
 * 240×300 grid; every pixel is one of the palette colors (Smoky Quartz theme
 * ramps from the desktop app's LayoutStyle). Two coarse W/4×H/4 fields ride on
 * top of domain-warped fbm noise:
 *   E "aether"  — every event (supernova ring, comet wake, cursor warmth,
 *                 black-hole feeding) is a stamp into it; it decays, diffuses
 *                 and drifts so marks smear like gas.
 *   R reservoir — the fuel economy: star birth/upkeep drain it, supernovae
 *                 enrich it, it regrows in ~90 s; exhausted regions dim.
 * Star lifecycle: ember → main-sequence → giant → supernova → cinder/pulsar,
 * with shock-triggered second-generation births, lazy pairwise gravity,
 * binary capture and constellation moments. Rare events: comets, a black
 * hole, a galaxy sprite drifting behind the gas.
 * Interaction: click = kindle at the densest nearby gas, hold ~1.2 s
 * (stationary) = collapse-and-burst, drag = carve a bright gas furrow that
 * sows embers along the path. Hovering leaves no mark — only deliberate
 * gestures touch the gas. Nothing chases the cursor; the star cap never
 * rises with interaction.
 * Kinship rule (life-like, continuous — deliberately not Conway): every
 * promoted star responds to its neighborhood. Isolation fades a star early,
 * 2–3 companions sustain it and occasionally seed an ember between them,
 * crowds (5+) burn the local reservoir and age their oldest member. Births
 * and deaths reuse the normal machinery, so the rule changes the canvas's
 * social texture without changing its vocabulary.
 * Ramp step 0 IS the page background (#141413), so the art has no edge.
 */

const W = 240;
const H = 300;
const CW = 60;   // coarse field: W/4
const CH = 75;   // coarse field: H/4
const TICK = 1 / 30;

type RGB = [number, number, number];

const hx = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

// Smoky Quartz (desktop LayoutStyle theme) — matches the site's neutral
// palette. density[0] = page bg #141413; gas rises through smoke grays to a
// pale warm white; starlight tops at the site's cream #F0EDE6; brand-amber
// accents for ignitions.
const DENSITY: RGB[] = ["#141413", "#191918", "#232322", "#33322F", "#4A4844", "#66635E", "#8C8880", "#B3AEA3"].map(hx);
const STAR: RGB[] = ["#CCC7B8", "#E0DCD1", "#F0EDE6"].map(hx);
const ACCENT: RGB[] = ["#C98F56", "#F2D0A0"].map(hx);
const HOLE: RGB = hx("#0A0A09");

const BAYER: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

type Fbm = ((x: number, y: number, z: number, oct: number) => number) & {
  n3: (x: number, y: number, z: number) => number;
};

function makeNoise(rng: () => number): Fbm {
  const P = new Uint8Array(512);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const g = (h: number) => (P[h] / 255) * 2 - 1;
  function n3(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255, zi = Math.floor(z) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y), zf = z - Math.floor(z);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const h = (X: number, Y: number, Z: number) => g(P[P[P[X & 255] + (Y & 255)] + (Z & 255)]);
    const L = (a: number, b: number, t: number) => a + (b - a) * t;
    return L(
      L(L(h(xi, yi, zi), h(xi + 1, yi, zi), u), L(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
      L(L(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), L(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v),
      w
    );
  }
  const fbm = ((x: number, y: number, z: number, oct: number) => {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i++) {
      s += a * n3(x * f, y * f, z * f);
      a *= 0.5;
      f *= 2;
    }
    return s * 0.5 + 0.5;
  }) as Fbm;
  fbm.n3 = n3;
  return fbm;
}

function bresenham(
  x0: number, y0: number, x1: number, y1: number,
  cb: (x: number, y: number, i: number) => void
): void {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, i = 0;
  for (;;) {
    cb(x0, y0, i++);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

interface Star {
  x: number; y: number; vx: number; vy: number;
  stage: "ember" | "main" | "giant";
  born: number; life: number; mass: number; ph: number;
  willPromote: boolean;
  promotedAt?: number; mainLife?: number; giantAt?: number;
  binary: { bin: Binary; side: number } | null;
  dead?: boolean;
}
interface Binary { cx: number; cy: number; vx: number; vy: number; r: number; period: number; ph: number }
interface Nova { x: number; y: number; r: number; t0: number }
interface Cinder { x: number; y: number; t0: number; life: number; pulsar: boolean; angle: number; lastPulse: number }
interface Comet { p0: [number, number]; p1: [number, number]; p2: [number, number]; t0: number; dur: number; x?: number; y?: number }
interface Ring { cx: number; cy: number; f: number }
interface Shooter { x0: number; y0: number; x1: number; y1: number; t0: number; dur: number }
interface BlackHole { x: number; y: number; t0: number; life: number; orbiters: { r: number; a: number }[] }
interface Galaxy { x: number; y: number; t0: number; frame: number }

class Cosmos {
  ctx: CanvasRenderingContext2D;
  img: ImageData;
  levelBuf = new Uint8Array(W * H);
  rng: () => number;
  fbm: Fbm;

  E = new Float32Array(CW * CH);
  I = new Float32Array(CW * CH);
  R = new Float32Array(CW * CH).fill(1);
  Etmp = new Float32Array(CW * CH);
  vig = new Float32Array(W * H);

  backdrop: [number, number, number, number][] = [];
  stars: Star[] = [];
  novae: Nova[] = [];
  cinders: Cinder[] = [];
  comets: Comet[] = [];
  rings: Ring[] = [];
  shooters: Shooter[] = [];
  constellation: { members: Star[]; t0: number } | null = null;
  blackhole: BlackHole | null = null;
  galaxy: Galaxy | null = null;
  spawnQueue: [number, number, number][] = [];
  galaxySprite: [number, number, number][][];

  t = 0;
  frameNo = 0;
  diffuseCounter = 0;
  lastConstellation = -60;
  nextComet = 8;
  nextBlackhole: number;
  nextGalaxy: number;
  nextIdleEvent = 12;
  lastPointer = -99;
  birthTimer = 0;
  forcePromoteAt = 5;
  streamY = 0;

  ptr = { x: -1, y: -1, lx: -1, ly: -1, down: 0, dragDist: 0, sown: 0, holdArmed: false, lastKindle: -9, lastHold: -99 };
  kinTimer = 0;

  constructor(ctx: CanvasRenderingContext2D, seed: number) {
    this.ctx = ctx;
    this.img = ctx.createImageData(W, H);
    this.rng = mulberry32(seed);
    this.fbm = makeNoise(this.rng);
    this.nextBlackhole = 45 + this.rng() * 40;
    this.nextGalaxy = 70 + this.rng() * 50;

    // feather: wide enough that clouds thin out before the boundary — a
    // dense cloud must never be sliced by the panel edge. The band's contour
    // is warped by static noise so the dissolve is an irregular cloud-bank
    // silhouette, never a straight line the eye can trace.
    const mx = W * 0.10, my = H * 0.12;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const dxRaw = Math.min(x + 0.5, W - x - 0.5);
        const dyRaw = Math.min(y + 0.5, H - y - 0.5);
        const wobX = this.fbm.n3(x * 0.045, y * 0.045, 7.3) * 10;
        const wobY = this.fbm.n3(x * 0.045 + 19.7, y * 0.045, 3.1) * 12;
        const fx = smoothstep(0, mx, dxRaw + wobX);
        const fy = smoothstep(0, my, dyRaw + wobY);
        // hard guard: the outermost ~4 px always reach exact page color,
        // even where the wobble pushes the contour outward
        const guard = smoothstep(0, 4, Math.min(dxRaw, dyRaw));
        // ^1.4 lengthens the tail: gas thins gradually toward the rim
        // instead of holding full density and then dropping off a cliff
        this.vig[y * W + x] = Math.pow(fx * fy, 1.4) * guard;
      }

    for (let i = 0; i < 70; i++)
      this.backdrop.push([(this.rng() * W) | 0, (this.rng() * H) | 0, this.rng() * Math.PI * 2, 0.4 + this.rng() * 1.6]);

    this.galaxySprite = this.makeGalaxySprite();

    // opening script: a bright filament + first embers, so the first ten
    // seconds always deliver
    for (let k = 0; k < 14; k++) {
      const x = 30 + k * 13.5, y = 82 + Math.sin(k * 0.7) * 18;
      this.stamp(x, y, 1.6, 0.4);
    }
    // second filament so the opening composition fills the lower half too
    for (let k = 0; k < 12; k++) {
      const x = 55 + k * 13, y = 214 + Math.sin(k * 0.8 + 2) * 16;
      this.stamp(x, y, 1.6, 0.34);
    }
    this.spawnQueue.push([1.5, 69, 87], [2.0, 132, 75], [2.6, 180, 93], [3.2, 110, 218], [3.8, 170, 208]);
  }

  // ---------- coarse field ops ----------
  cellIdx(x: number, y: number): number { return (y >> 2) * CW + (x >> 2); }

  stamp(cx: number, cy: number, sigma: number, amp: number): void {
    const gx = cx / 4, gy = cy / 4;
    const r = Math.ceil(sigma * 3);
    const x0 = Math.max(0, Math.floor(gx - r)), x1 = Math.min(CW - 1, Math.ceil(gx + r));
    const y0 = Math.max(0, Math.floor(gy - r)), y1 = Math.min(CH - 1, Math.ceil(gy + r));
    const s2 = 2 * sigma * sigma;
    for (let j = y0; j <= y1; j++)
      for (let i = x0; i <= x1; i++) {
        const d2 = (i - gx) * (i - gx) + (j - gy) * (j - gy);
        this.I[j * CW + i] += amp * Math.exp(-d2 / s2);
      }
  }

  stampRing(cx: number, cy: number, radius: number, amp: number): void {
    const steps = Math.max(10, (radius * 0.5) | 0);
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      const x = cx + Math.cos(a) * radius, y = cy + Math.sin(a) * radius;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      this.I[this.cellIdx(x | 0, y | 0)] += amp;
    }
  }

  stampR(cx: number, cy: number, radiusPx: number, amt: number): void {
    const gx = (cx / 4) | 0, gy = (cy / 4) | 0, r = Math.ceil(radiusPx / 4);
    for (let j = Math.max(0, gy - r); j <= Math.min(CH - 1, gy + r); j++)
      for (let i = Math.max(0, gx - r); i <= Math.min(CW - 1, gx + r); i++)
        this.R[j * CW + i] = Math.min(1, Math.max(0, this.R[j * CW + i] + amt));
  }

  sampleGas(x: number, y: number): number {
    const wf = 0.016, wt = this.t * 0.03;
    const wx = this.fbm.n3(x * wf, y * wf, wt);
    const wy = this.fbm.n3(x * wf + 37.2, y * wf + 11.8, wt);
    const freq = 2.8 / W;
    return this.fbm((x + 11 * wx) * freq + this.t * 0.008, (y + 11 * wy) * freq + this.streamY, this.t * 0.045, 4);
  }

  densityAt(x: number, y: number): number {
    const s = smoothstep(0.51, 0.87,this.sampleGas(x, y));
    const ci = this.cellIdx(x, y);
    let d = s + 0.9 * this.E[ci];
    d = Math.min(1, Math.max(0, d));
    d *= 0.75 + 0.25 * this.R[ci];
    // voids stay at exactly the page color — the panel must never read as a
    // rectangle, only the clouds themselves carry light
    return d * this.vig[y * W + x];
  }

  // ---------- entities ----------
  spawnEmber(x: number, y: number, forced: boolean): Star | null {
    if (this.stars.length >= 56) return null;
    const s: Star = {
      x, y, vx: 0, vy: 0, stage: "ember", born: this.t,
      life: 4 + this.rng() * 5, mass: 1, ph: this.rng() * Math.PI * 2,
      binary: null, willPromote: forced || this.rng() < 0.45,
    };
    this.stars.push(s);
    this.stamp(x, y, 1.2, -0.25);
    this.stampR(x, y, 6, -0.15);
    return s;
  }

  promote(s: Star): void {
    s.stage = "main";
    s.promotedAt = this.t;
    s.mainLife = 20 + this.rng() * 25;
  }

  supernova(s: Star): void {
    this.novae.push({ x: s.x, y: s.y, r: 0, t0: this.t });
    this.stampR(s.x, s.y, 10, 0.1);
    this.cinders.push({
      x: s.x | 0, y: s.y | 0, t0: this.t, life: 20 + this.rng() * 10,
      pulsar: this.rng() < 0.25, angle: this.rng() * Math.PI, lastPulse: this.t,
    });
    s.dead = true;
  }

  launchComet(): void {
    const fromLeft = this.rng() < 0.5;
    const y0 = 20 + this.rng() * 60, y1 = 100 + this.rng() * 80;
    this.comets.push({
      p0: [fromLeft ? -10 : W + 10, y0],
      p1: [W / 2 + (this.rng() - 0.5) * 60, (y0 + y1) / 2 - 30 - this.rng() * 30],
      p2: [fromLeft ? W + 10 : -10, y1],
      t0: this.t, dur: 4 + this.rng() * 3,
    });
  }

  launchBlackhole(): void {
    let best: [number, number] | null = null, bd = 0.75;
    for (let k = 0; k < 60; k++) {
      const x = (20 + this.rng() * (W - 40)) | 0, y = (20 + this.rng() * (H - 40)) | 0;
      const d = this.densityAt(x, y);
      if (d > bd) { bd = d; best = [x, y]; }
    }
    if (!best) return;
    this.blackhole = {
      x: best[0], y: best[1], t0: this.t, life: 18 + this.rng() * 7,
      orbiters: [0, 1, 2].map((i) => ({ r: 8 - i * 2, a: this.rng() * Math.PI * 2 })),
    };
  }

  launchGalaxy(): void {
    this.galaxy = { x: -12, y: 30 + this.rng() * 120, t0: this.t, frame: 0 };
  }

  makeGalaxySprite(): [number, number, number][][] {
    const frames: [number, number, number][][] = [];
    for (let f = 0; f < 3; f++) {
      const pts: [number, number, number][] = [[0, 0, 1]];
      for (let arm = 0; arm < 2; arm++)
        for (let k = 1; k <= 6; k++) {
          const r = k * 0.75;
          const a = arm * Math.PI + k * 0.55 + f * 0.7;
          pts.push([Math.round(Math.cos(a) * r * 1.3), Math.round(Math.sin(a) * r * 0.8), k < 4 ? 1 : 0]);
        }
      frames.push(pts);
    }
    return frames;
  }

  // ---------- interaction ----------
  pointerMove(x: number, y: number): void { this.ptr.x = x; this.ptr.y = y; this.lastPointer = this.t; }
  pointerLeave(): void { this.ptr.x = this.ptr.lx = -1; }
  pointerDown(): void {
    this.ptr.down = this.t;
    this.ptr.holdArmed = false;
    this.ptr.dragDist = 0;
    this.ptr.sown = 0;
  }

  pointerUp(x: number, y: number): void {
    const P = this.ptr;
    const held = P.down ? this.t - P.down : 0;
    const wasDrag = P.dragDist > 8;
    P.down = 0;
    P.dragDist = 0;
    P.sown = 0;
    if (P.holdArmed) {
      P.lastHold = this.t;
      P.holdArmed = false;
      this.stampRing(x, y, 10, 1.0);
      this.stampRing(x, y, 16, 0.5);
      for (let m = 0; m < 4; m++)
        this.spawnQueue.push([this.t + m * 0.2, (x + (this.rng() - 0.5) * 24) | 0, (y + (this.rng() - 0.5) * 24) | 0]);
      return;
    }
    // a drag already spent its gesture sowing the furrow — no kindle on top
    if (wasDrag || held > 0.35 || this.t - P.lastKindle < 0.3) return;
    P.lastKindle = this.t;
    let best: [number, number] | null = null, bd = 0.5;
    for (let dy = -10; dy <= 10; dy += 2)
      for (let dx = -10; dx <= 10; dx += 2) {
        const px = (x + dx) | 0, py = (y + dy) | 0;
        if (px < 2 || py < 2 || px >= W - 2 || py >= H - 2) continue;
        const d = this.densityAt(px, py);
        if (d > bd) { bd = d; best = [px, py]; }
      }
    this.rings.push({ cx: x, cy: y, f: 0 });
    if (best) {
      const s = this.spawnEmber(best[0], best[1], true);
      if (s) this.promote(s);
    } else if (this.rng() < 0.35) {
      const edge: [number, number] = this.rng() < 0.5 ? [-6, this.rng() * H] : [W + 6, this.rng() * H];
      this.shooters.push({ x0: edge[0], y0: edge[1], x1: x, y1: y, t0: this.t, dur: 0.8 });
    }
  }

  wheel(dy: number): void {
    this.streamY = Math.max(-0.02, Math.min(0.02, this.streamY + dy * 0.00002));
  }

  // ---------- simulation tick (30 Hz) ----------
  tick(dt: number): void {
    this.t += dt;
    const t = this.t;
    const E = this.E, I = this.I, R = this.R;

    for (let i = 0; i < E.length; i++) {
      E[i] = Math.max(-1, Math.min(1, (E[i] + I[i]) * 0.995));
      I[i] = 0;
      R[i] += 0.012 * dt * (1 - R[i]);
    }
    if (++this.diffuseCounter >= 3) {
      this.diffuseCounter = 0;
      const T = this.Etmp;
      for (let j = 0; j < CH; j++)
        for (let i = 0; i < CW; i++) {
          const o = j * CW + i;
          const n = E[o - CW] ?? E[o], s = E[o + CW] ?? E[o];
          const w = i > 0 ? E[o - 1] : E[o], e = i < CW - 1 ? E[o + 1] : E[o];
          T[o] = E[o] * 0.82 + 0.045 * (n + s + w + e) + 0.15 * (e - E[o]) * 0.25;
        }
      E.set(T);
    }
    this.streamY *= 0.9;

    const P = this.ptr;
    if (P.x >= 0) {
      const moved = P.lx >= 0 ? Math.hypot(P.x - P.lx, P.y - P.ly) : 0;
      const dragging = P.down > 0 && P.dragDist + moved > 8;
      // hover leaves no mark — only a pressed pointer touches the gas
      if (dragging && P.lx >= 0) {
        const steps = Math.max(1, (moved / 8) | 0);
        // a drag carves a furrow of tight, bright gas
        for (let k = 0; k <= steps; k++)
          this.stamp(P.lx + ((P.x - P.lx) * k) / steps, P.ly + ((P.y - P.ly) * k) / steps, 2.2, 0.55 / (steps * 0.6 + 1));
      }
      if (P.down > 0) {
        P.dragDist += moved;
        // sow the furrow: every ~14 px of drag seeds an ember slightly behind
        // the cursor, delayed so the fresh gas visibly ignites. Capped per
        // gesture; embers still face the normal density check on spawn.
        if (dragging && P.sown < 6 && P.dragDist > (P.sown + 1) * 14) {
          P.sown++;
          this.stampR(P.x, P.y, 8, 0.05);
          this.spawnQueue.push([t + 0.25 + this.rng() * 0.3, P.x | 0, P.y | 0]);
        }
      }
      P.lx = P.x;
      P.ly = P.y;
      // a hold is stationary by definition — a drag never arms the collapse
      if (P.down && t - P.down > 1.2 && P.dragDist < 8 && t - P.lastHold > 60) {
        this.stamp(P.x, P.y, 2, 0.5);
        this.stampRing(P.x, P.y, 12, -0.15);
        P.holdArmed = true;
      }
    }

    this.spawnQueue = this.spawnQueue.filter(([st, x, y]) => {
      if (t >= st) { this.spawnEmber(x, y, true); return false; }
      return true;
    });
    if (this.forcePromoteAt && t >= this.forcePromoteAt) {
      const e = this.stars.find((s) => s.stage === "ember");
      if (e) this.promote(e);
      this.forcePromoteAt = 0;
    }

    // births — economy-gated, lantern-biased
    this.birthTimer += dt;
    const promoted = this.stars.filter((s) => s.stage !== "ember");
    const L = promoted.reduce((a, s) => a + s.mass, 0);
    if (this.birthTimer > 0.4) {
      this.birthTimer = 0;
      const tries = L < 6 ? 12 : 6;
      for (let k = 0; k < tries; k++) {
        const x = (8 + this.rng() * (W - 16)) | 0, y = (8 + this.rng() * (H - 16)) | 0;
        const ci = this.cellIdx(x, y);
        if (R[ci] < 0.3) continue;
        const d = this.densityAt(x, y);
        let pBirth = d > 0.72 ? 0.35 : 0;
        pBirth *= 1 + 6 * Math.max(0, E[ci]);
        const gov = Math.max(0, (32 - L) / 10);
        pBirth *= gov > 1 ? 1 : gov;
        if (this.rng() < pBirth && !this.stars.some((s) => (s.x - x) ** 2 + (s.y - y) ** 2 < 196))
          this.spawnEmber(x, y, false);
      }
    }

    // star lifecycle
    for (const s of this.stars) {
      if (s.dead) continue;
      const age = t - s.born;
      if (s.stage === "ember") {
        if (age > s.life) {
          if (s.willPromote && this.densityAt(s.x | 0, s.y | 0) > 0.55) this.promote(s);
          else { s.dead = true; this.stamp(s.x, s.y, 1, 0.15); }
        }
      } else if (s.stage === "main") {
        this.stampR(s.x, s.y, 4, -0.004 * dt);
        const mAge = t - (s.promotedAt ?? t);
        if (mAge > 15 && this.densityAt(s.x | 0, s.y | 0) > 0.8 && this.stars.filter((x) => x.stage === "giant").length < 3) {
          s.stage = "giant";
          s.giantAt = t;
          s.mass = 3;
        } else if (mAge > (s.mainLife ?? 30)) {
          if (this.rng() < 0.35 + Math.max(0, (L - 28) / 40)) this.supernova(s);
          else { s.dead = true; this.stamp(s.x, s.y, 1.4, 0.2); }
        }
      } else if (s.stage === "giant") {
        if (t - (s.giantAt ?? t) > 10 + (s.ph % 1) * 5) this.supernova(s);
      }
    }
    this.stars = this.stars.filter((s) => !s.dead);

    // kinship rule — life-like, continuous, deliberately not Conway. Stars
    // respond to their neighborhood at a slow cadence: isolation fades a star
    // early, 2–3 companions sustain it (and occasionally seed an ember
    // between two of them), crowds of 5+ burn the local reservoir and age
    // their oldest member. All effects route through mainLife and the normal
    // birth queue, so deaths still supernova/fade and births still face the
    // density check — the rule adds social texture, not new vocabulary.
    this.kinTimer += dt;
    if (this.kinTimer > 0.5) {
      this.kinTimer = 0;
      const kin = this.stars.filter((s) => s.stage === "main" && !s.dead);
      for (const s of kin) {
        const near = kin.filter((o) => o !== s && (o.x - s.x) ** 2 + (o.y - s.y) ** 2 < 676);
        const n = near.length;
        if (n === 0) {
          s.mainLife = (s.mainLife ?? 30) - 0.4;
        } else if (n <= 3) {
          if (n >= 2) s.mainLife = Math.min(55, (s.mainLife ?? 30) + 0.3);
          if (n >= 2 && this.rng() < 0.06 && this.stars.length < 50) {
            const o = near[(this.rng() * n) | 0];
            const mx = ((s.x + o.x) / 2) | 0, my = ((s.y + o.y) / 2) | 0;
            if (mx > 4 && my > 4 && mx < W - 4 && my < H - 4 &&
                this.R[this.cellIdx(mx, my)] > 0.35 && this.densityAt(mx, my) > 0.55)
              this.spawnQueue.push([t + 0.3, mx, my]);
          }
        } else if (n >= 5) {
          this.stampR(s.x, s.y, 6, -0.03);
          const oldest = [s, ...near].reduce((a, b) =>
            (a.promotedAt ?? 0) < (b.promotedAt ?? 0) ? a : b);
          oldest.mainLife = (oldest.mainLife ?? 30) - 1.0;
        }
      }
    }

    // gravity + binary capture
    const free = this.stars.filter((s) => s.stage !== "ember" && !s.binary);
    for (let i = 0; i < free.length; i++) {
      const a = free[i];
      for (let j = i + 1; j < free.length; j++) {
        const b = free[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1600) continue;
        const d = Math.max(8, Math.sqrt(d2));
        const f = 2.0 / Math.pow(d, 1.5);
        a.vx += (f * b.mass * dx) / d * dt;
        a.vy += (f * b.mass * dy) / d * dt;
        b.vx -= (f * a.mass * dx) / d * dt;
        b.vy -= (f * a.mass * dy) / d * dt;
        if (d < 10 && Math.hypot(a.vx - b.vx, a.vy - b.vy) < 2 && this.stars.filter((s) => s.binary).length < 8) {
          const bin: Binary = {
            cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2,
            vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2,
            r: 2 + this.rng() * 3, period: 6 + this.rng() * 4, ph: this.rng() * Math.PI * 2,
          };
          a.binary = { bin, side: 0 };
          b.binary = { bin, side: 1 };
        }
      }
      a.vx *= 0.985;
      a.vy *= 0.985;
      const sp = Math.hypot(a.vx, a.vy);
      if (sp > 6) { a.vx *= 6 / sp; a.vy *= 6 / sp; }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.x = Math.max(4, Math.min(W - 4, a.x));
      a.y = Math.max(4, Math.min(H - 4, a.y));
    }
    for (const s of this.stars) {
      if (!s.binary) continue;
      const B = s.binary.bin;
      if (s.binary.side === 0) {
        B.cx += B.vx * dt;
        B.cy += B.vy * dt;
        B.vx *= 0.99;
        B.vy *= 0.99;
      }
      const a = B.ph + (t / B.period) * Math.PI * 2 + s.binary.side * Math.PI;
      s.x = B.cx + Math.cos(a) * B.r;
      s.y = B.cy + Math.sin(a) * B.r * 0.8;
    }

    // constellation moment
    if (!this.constellation && t - this.lastConstellation > 45) {
      const prom = this.stars.filter((s) => s.stage !== "ember");
      for (const s of prom) {
        const near = prom.filter((o) => (o.x - s.x) ** 2 + (o.y - s.y) ** 2 < 900);
        if (near.length >= 4) {
          this.constellation = { members: near.slice(0, 7), t0: t };
          this.lastConstellation = t;
          break;
        }
      }
    }
    if (this.constellation && t - this.constellation.t0 > 4.5) this.constellation = null;

    // supernova rings + triggered second-generation births
    for (const nv of this.novae) {
      const age = t - nv.t0;
      nv.r = age * 10;
      if (age < 3) {
        this.stampRing(nv.x, nv.y, nv.r, 0.5 - age * 0.14);
        if (nv.r > 5) this.stamp(nv.x, nv.y, nv.r / 8, -0.1);
        this.stampR(nv.x, nv.y, nv.r, 0.02);
        for (let k = 0; k < 8; k++) {
          const a = this.rng() * Math.PI * 2;
          const x = (nv.x + Math.cos(a) * nv.r) | 0, y = (nv.y + Math.sin(a) * nv.r) | 0;
          if (x < 4 || y < 4 || x >= W - 4 || y >= H - 4) continue;
          const d = this.densityAt(x, y);
          if (d > 0.6 && d < 0.72 && this.rng() < 0.03) this.spawnQueue.push([t + 1 + this.rng() * 2, x, y]);
        }
      }
    }
    this.novae = this.novae.filter((nv) => t - nv.t0 < 3);
    this.cinders = this.cinders.filter((c) => t - c.t0 < c.life);

    // comets
    for (const c of this.comets) {
      const u = (t - c.t0) / c.dur;
      if (u > 1) continue;
      const x = (1 - u) * (1 - u) * c.p0[0] + 2 * (1 - u) * u * c.p1[0] + u * u * c.p2[0];
      const y = (1 - u) * (1 - u) * c.p0[1] + 2 * (1 - u) * u * c.p1[1] + u * u * c.p2[1];
      c.x = x;
      c.y = y;
      if (x > 0 && y > 0 && x < W && y < H) {
        this.stamp(x, y, 1.5, 0.3);
        if (this.densityAt(x | 0, y | 0) > 0.8 && this.rng() < 0.06)
          this.spawnQueue.push([t + 0.5, x | 0, y | 0]);
      }
    }
    this.comets = this.comets.filter((c) => t - c.t0 < c.dur + 0.5);

    // black hole
    const B = this.blackhole;
    if (B) {
      const age = t - B.t0;
      this.stamp(B.x, B.y, 2.5, -0.04);
      this.stampR(B.x, B.y, 10, -0.02 * dt);
      for (const o of B.orbiters) {
        o.a += dt * (14 / o.r);
        o.r -= dt * 2;
        if (o.r < 1.5) o.r = 8;
      }
      for (const s of this.stars) {
        const d = Math.hypot(s.x - B.x, s.y - B.y);
        if (d < 20 && s.stage !== "ember" && !s.binary) {
          s.vx += ((B.x - s.x) / d) * 8 * dt;
          s.vy += ((B.y - s.y) / d) * 8 * dt;
          if (d < 3) { s.dead = true; this.stamp(B.x, B.y, 1.5, 0.6); }
        }
      }
      this.stars = this.stars.filter((s) => !s.dead);
      if (age > B.life) {
        this.stampRing(B.x, B.y, 12, 0.7);
        this.stampR(B.x, B.y, 14, 0.15);
        this.blackhole = null;
      }
    }

    // galaxy drift
    if (this.galaxy) {
      this.galaxy.x += 3 * dt;
      this.galaxy.frame = (((t - this.galaxy.t0) / 0.8) | 0) % 3;
      if (this.galaxy.x > W + 12) this.galaxy = null;
    }

    // click pressure rings (field-only)
    for (const r of this.rings) {
      r.f++;
      if (r.f <= 20) this.stampRing(r.cx, r.cy, r.f * 1.2 * 4, 0.5 * (1 - r.f / 20) * 0.4);
    }
    this.rings = this.rings.filter((r) => r.f <= 20);

    this.shooters = this.shooters.filter((s) => t - s.t0 < s.dur + 0.1);

    // director
    const engaged = t - this.lastPointer < 8;
    const mult = engaged ? 0.5 : 1;
    if (t > this.nextComet) {
      if (this.rng() < mult) this.launchComet();
      this.nextComet = t + 18 + this.rng() * 15;
    }
    if (t > this.nextBlackhole && !this.blackhole) {
      if (this.rng() < mult) this.launchBlackhole();
      this.nextBlackhole = t + 80 + this.rng() * 50;
    }
    if (t > this.nextGalaxy && !this.galaxy) {
      this.launchGalaxy();
      this.nextGalaxy = t + 120 + this.rng() * 60;
    }
    if (t > this.nextIdleEvent) {
      this.nextIdleEvent = t + 5 + this.rng() * 6;
      if (!engaged && this.rng() < 0.8) {
        for (let k = 0; k < 40; k++) {
          const x = (10 + this.rng() * (W - 20)) | 0, y = (10 + this.rng() * (H - 20)) | 0;
          if (this.densityAt(x, y) > 0.7) {
            for (let m = 0; m < 3; m++)
              this.spawnQueue.push([t + m * 0.4, (x + (this.rng() - 0.5) * 16) | 0, (y + (this.rng() - 0.5) * 16) | 0]);
            break;
          }
        }
      }
    }
  }

  // ---------- render ----------
  render(): void {
    const { img, levelBuf, vig, E, R } = this;
    const d = img.data;
    const N = DENSITY.length;
    const t = this.t;
    this.frameNo++;

    const wf = 0.016, wt = t * 0.03;
    const freq = 2.8 / W;
    const drift = t * 0.008;
    const zz = t * 0.045;
    for (let y = 0; y < H; y++) {
      const cy = (y >> 2) * CW;
      for (let x = 0; x < W; x++) {
        const wx = this.fbm.n3(x * wf, y * wf, wt);
        const wy = this.fbm.n3(x * wf + 37.2, y * wf + 11.8, wt);
        let s = this.fbm((x + 11 * wx) * freq + drift, (y + 11 * wy) * freq + this.streamY, zz, 4);
        s = smoothstep(0.51, 0.87,s);
        const ci = cy + (x >> 2);
        let comp = s + 0.9 * E[ci];
        comp = comp < 0 ? 0 : comp > 1 ? 1 : comp;
        comp *= 0.75 + 0.25 * R[ci];
        comp *= vig[y * W + x];               // voids stay at page color
        const level = comp * (N - 1);
        let idx = level | 0;
        if (level - idx > BAYER[y & 3][x & 3]) idx++;
        if (idx >= N) idx = N - 1;
        levelBuf[y * W + x] = idx;
        const c = DENSITY[idx];
        const o = (y * W + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }

    let flashRamp = STAR;
    for (const nv of this.novae) {
      if (t - nv.t0 < 0.25) {
        flashRamp = STAR.map((c) => c.map((v) => Math.min(255, v + 28)) as RGB);
        break;
      }
    }

    const put = (x: number, y: number, c: RGB) => {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const o = (y * W + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
    };

    // backdrop starfield behind thin gas
    for (const [x, y, ph, f] of this.backdrop) {
      if (levelBuf[y * W + x] >= 2) continue;
      const tw = Math.sin(ph + t * f);
      if (tw > 0.2) put(x, y, DENSITY[Math.min(N - 1, 2 + (tw > 0.75 ? 1 : 0))]);
    }

    // galaxy sprite behind dense gas
    if (this.galaxy) {
      const G = this.galaxy;
      for (const [gx, gy, step] of this.galaxySprite[G.frame]) {
        const x = (G.x + gx) | 0, y = (G.y + gy) | 0;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (levelBuf[y * W + x] >= 3) continue;
        put(x, y, STAR[step]);
      }
    }

    // constellation MST lines, dashed
    if (this.constellation) {
      const C = this.constellation;
      const age = t - C.t0;
      const vis = age < 0.5 ? age / 0.5 : age > 3.5 ? 1 - (age - 3.5) : 1;
      if (vis > 0) {
        const m = C.members.filter((s) => !s.dead);
        if (m.length >= 2) {
          const inT = [m[0]], out = m.slice(1);
          while (out.length) {
            let bi = 0, bj = 0, bd2 = 1e9;
            for (let i = 0; i < inT.length; i++)
              for (let j = 0; j < out.length; j++) {
                const d2 = (inT[i].x - out[j].x) ** 2 + (inT[i].y - out[j].y) ** 2;
                if (d2 < bd2) { bd2 = d2; bi = i; bj = j; }
              }
            const a = inT[bi], b = out.splice(bj, 1)[0];
            inT.push(b);
            const dashMod = vis > 0.99 ? 2 : 3;
            bresenham(a.x | 0, a.y | 0, b.x | 0, b.y | 0, (px, py, i) => {
              if (i % dashMod === 0) put(px, py, STAR[0]);
            });
          }
        }
      }
    }

    // stars
    for (const s of this.stars) {
      const x = s.x | 0, y = s.y | 0;
      if (s.stage === "ember") {
        const a = (t - s.born) / s.life;
        const env = Math.sin(Math.min(1, Math.max(0, a)) * Math.PI);
        const tw = 0.8 + 0.2 * Math.sin(t * 5 + s.ph);
        const idx = (env * tw * ACCENT.length) | 0;
        if (idx > 0) put(x, y, ACCENT[Math.min(ACCENT.length - 1, idx)]);
      } else if (s.stage === "main") {
        put(x, y, flashRamp[2]);
        put(x + 1, y, STAR[1]); put(x - 1, y, STAR[1]);
        put(x, y + 1, STAR[1]); put(x, y - 1, STAR[1]);
        const shim = Math.sin(t * 2.4 + s.ph);
        if (shim > 0.1) {
          const ring2 = [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]];
          for (let k = 0; k < 8; k++)
            if ((k + (this.frameNo >> 5)) % 2) put(x + ring2[k][0], y + ring2[k][1], STAR[0]);
        }
        if (shim > 0.75) {
          put(x + 2, y, STAR[0]); put(x - 2, y, STAR[0]);
          put(x, y + 2, STAR[0]); put(x, y - 2, STAR[0]);
        }
      } else {
        const pulse = Math.sin(t * Math.PI) > 0 ? 1 : 0;
        put(x, y, flashRamp[2]);
        put(x + 1, y, STAR[2 - pulse]); put(x - 1, y, STAR[2 - pulse]);
        put(x, y + 1, STAR[2 - pulse]); put(x, y - 1, STAR[2 - pulse]);
        put(x + 1, y + 1, STAR[0]); put(x - 1, y - 1, STAR[0]);
        if ((x + y + ((t * 4) | 0)) % 2) { put(x + 1, y - 1, STAR[0]); put(x - 1, y + 1, STAR[0]); }
        for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          put(x + ux * 2, y + uy * 2, STAR[1]);
          put(x + ux * 4, y + uy * 4, STAR[0]);
        }
      }
    }

    // supernova flash + expanding dithered ring
    for (const nv of this.novae) {
      const age = t - nv.t0;
      if (age < 0.3) {
        put(nv.x, nv.y, STAR[2]);
        for (let k = 1; k <= 5; k++) {
          const c = k <= 2 ? STAR[2] : k <= 4 ? STAR[1] : ACCENT[1];
          put(nv.x + k, nv.y, c); put(nv.x - k, nv.y, c);
          put(nv.x, nv.y + k, c); put(nv.x, nv.y - k, c);
        }
      }
      const step = nv.r < 8 ? 2 : nv.r < 16 ? 1 : 0;
      const n = Math.max(12, (nv.r * 5) | 0);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const px = nv.x + Math.cos(a) * nv.r, py = nv.y + Math.sin(a) * nv.r;
        if (((px | 0) + (py | 0)) % 2 === 0) put(px, py, STAR[step]);
      }
    }

    // cinders + pulsars
    for (const c of this.cinders) {
      if (Math.sin(t * 4.2 + c.x) > 0) put(c.x, c.y, ACCENT[0]);
      if (c.pulsar) {
        if (t - c.lastPulse > 1.6) { c.lastPulse = t; c.angle += 0.26; }
        if (t - c.lastPulse < 0.12) {
          put(c.x, c.y, STAR[2]);
          for (const dir of [0, Math.PI])
            for (let k = 2; k <= 10; k++) {
              if (k % 2) continue;
              put(c.x + Math.cos(c.angle + dir) * k, c.y + Math.sin(c.angle + dir) * k, k < 6 ? STAR[1] : STAR[0]);
            }
        }
      }
    }

    // comet heads (the E-field wake draws the tail)
    for (const c of this.comets) {
      if (c.x === undefined || c.y === undefined) continue;
      if (c.x < -2 || c.y < -2 || c.x > W + 2 || c.y > H + 2) continue;
      put(c.x, c.y, ACCENT[1]);
      put(c.x - 1, c.y, ACCENT[0]);
      put(c.x, c.y - 1, STAR[1]);
    }

    // shooting stars
    for (const s of this.shooters) {
      const u = Math.min(1, (t - s.t0) / s.dur);
      const x = s.x0 + (s.x1 - s.x0) * u, y = s.y0 + (s.y1 - s.y0) * u;
      put(x, y, STAR[2]);
      const len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0) || 1;
      for (let k = 2; k <= 4; k += 2)
        put(x - ((s.x1 - s.x0) / len) * k, y - ((s.y1 - s.y0) / len) * k, STAR[0]);
      if (u >= 1) this.stamp(s.x1, s.y1, 2, 0.6);
    }

    // black hole on top
    if (this.blackhole) {
      const B = this.blackhole;
      for (const o of B.orbiters)
        put(B.x + Math.cos(o.a) * o.r, B.y + Math.sin(o.a) * o.r * 0.7, ACCENT[o.r > 5 ? 0 : 1]);
      put(B.x, B.y, HOLE); put(B.x + 1, B.y, HOLE);
      put(B.x, B.y + 1, HOLE); put(B.x + 1, B.y + 1, HOLE);
    }

    this.ctx.putImageData(img, 0, 0);
  }
}

export default function HeroCosmos() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cosmos = new Cosmos(ctx, 9021);

    const gridPos = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    };
    const onMove = (e: PointerEvent) => { const [x, y] = gridPos(e); cosmos.pointerMove(x, y); };
    const onLeave = () => cosmos.pointerLeave();
    const onDown = () => cosmos.pointerDown();
    const onUp = (e: PointerEvent) => { const [x, y] = gridPos(e); cosmos.pointerUp(x, y); };
    const onWheel = (e: WheelEvent) => cosmos.wheel(e.deltaY);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    window.addEventListener("wheel", onWheel, { passive: true });

    // pause when the hero is offscreen
    let visible = true;
    const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.05 });
    io.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let started = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let ticked = false;
      if (!reduced) {
        acc += dt;
        while (acc >= TICK) { cosmos.tick(TICK); acc -= TICK; ticked = true; }
      } else if (!started) {
        // reduced motion: advance once to a composed frame, then hold still
        for (let i = 0; i < 90; i++) cosmos.tick(TICK);
        ticked = true;
      }
      // the sim advances at 30 Hz — rendering between ticks would redraw an
      // identical frame, so only render when something moved
      if (ticked) cosmos.render();
      started = true;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: "pixelated",
        cursor: "default",
        touchAction: "pan-y",
      }}
    />
  );
}
