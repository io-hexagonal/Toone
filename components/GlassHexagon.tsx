"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The closing band's signature: the Toone mark in glass, lying on a faint
 * field of the hero's dots, with a routine running through it. The mark's
 * six segments are the routine's steps (the dark ones agent steps, the light
 * ones automatic steps, as in the How it works graph): a run comes in through
 * the cut on the left, splits into two parallel branches through the
 * segments, each segment lighting up while its step runs, merges at the cut
 * on the right and leaves. The lantern in the middle is Toone. One WebGL pass
 * draws the ground and the glass, so what is seen through the glass lines up
 * with what lies around it and bends at the bevels. Monochrome, no moving
 * light.
 *
 * The mark's geometry is read from public/assets/brand/toone-mark.svg: each
 * segment's corner-arc centres, grown back by the corner radius. Glass
 * treatment ported in spirit from hexagonal.io's liquid-glass lab.
 *
 * Runs only while on screen and the tab is visible; device pixel ratio is
 * capped at 1.5. Reduced motion: one still frame mid-run. No WebGL: the
 * canvas hides itself (glass-hex--off) and the band closes the gap.
 */

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;      // canvas size, device px
uniform vec2 u_center;   // hexagon centre, device px, top-left origin
uniform float u_r;       // hexagon inradius, device px
uniform float u_dpr;
uniform float u_time;

const vec3 BG = vec3(0.941, 0.929, 0.902);   // #f0ede6
const vec3 INK = vec3(0.114, 0.110, 0.098);  // #1d1c19

// iq's hexagon, flat top (edges at y = ±r).
float sdHex(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

// iq's exact distance to a convex polygon, for one quadrilateral.
#define EDGE(vi, vj) { vec2 e = vj - vi; vec2 w = p - vi; vec2 bb = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0); dd = min(dd, dot(bb, bb)); bvec3 cc = bvec3(p.y >= vi.y, p.y < vj.y, e.x * w.y > e.y * w.x); if (all(cc) || all(not(cc))) s *= -1.0; }
float sdQuad(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  float dd = dot(p - a, p - a); float s = 1.0;
  EDGE(a, d) EDGE(b, a) EDGE(c, b) EDGE(d, c)
  return s * sqrt(dd);
}

// The Toone mark, exactly as public/assets/brand/toone-mark.svg draws it, in
// its own 100-unit box. Each segment is the polygon of its corner-arc centres
// grown back by the corner radius (3.6), which reproduces the SVG's rounding
// exactly; the lantern is a regular hexagon rounded by 2. Pieces 0-2 are the
// mark's dark segments, 3-5 its light ones, 6 the lantern.
float U() { return u_r / 36.74; }
float piece(vec2 q, int i) {
  if (i == 0) return sdQuad(q, vec2(67.8043, 26.4174), vec2(79.3254, 46.3724), vec2(71.4823, 46.3724), vec2(63.8828, 33.2096)) - 3.6;
  if (i == 1) return sdQuad(q, vec2(61.5211, 77.2104), vec2(38.4789, 77.2104), vec2(42.4005, 70.4181), vec2(57.5995, 70.4181)) - 3.6;
  if (i == 2) return sdQuad(q, vec2(20.6746, 46.3724), vec2(32.1957, 26.4174), vec2(36.1172, 33.2096), vec2(28.5177, 46.3724)) - 3.6;
  if (i == 3) return sdQuad(q, vec2(39.0991, 16.8551), vec2(60.9009, 16.8551), vec2(56.9793, 23.6474), vec2(43.0207, 23.6474)) - 3.6;
  if (i == 4) return sdQuad(q, vec2(84.1547, 57.1320), vec2(73.2539, 76.0129), vec2(69.3323, 69.2206), vec2(76.3117, 57.1320)) - 3.6;
  if (i == 5) return sdQuad(q, vec2(26.7461, 76.0129), vec2(15.8453, 57.1320), vec2(23.6883, 57.1320), vec2(30.6677, 69.2206)) - 3.6;
  return sdHex(q - vec2(50.0), 13.2583 - 2.0) - 2.0;
}
// distance to the mark in device px; c is the offset from the mark's centre
float hexd(vec2 c) {
  vec2 q = c / U() + vec2(50.0);
  float d = 1e5;
  for (int i = 0; i < 7; i++) d = min(d, piece(q, i));
  return d * U();
}
int pieceAt(vec2 c) {
  vec2 q = c / U() + vec2(50.0);
  float d = 1e5; int k = 6;
  for (int i = 0; i < 7; i++) { float di = piece(q, i); if (di < d) { d = di; k = i; } }
  return k;
}

float edgeFade(vec2 q) {
  float m = 120.0 * u_dpr;
  return smoothstep(0.0, m, q.x) * smoothstep(0.0, m, u_res.x - q.x)
       * smoothstep(0.0, m, q.y) * smoothstep(0.0, m, u_res.y - q.y);
}

// The ground: the hero's dot field, ringing the glass and fading out before
// the text.
float dotsInk(vec2 q) {
  float cell = 6.0 * u_dpr;
  float dd = length(mod(q, cell) - 0.5 * cell);
  float rad = 1.05 * u_dpr;
  vec2 off = (q - u_center) / u_r;
  float ring = 1.0 - smoothstep(1.2, 3.0, length(off * vec2(0.6, 1.0)));
  return (1.0 - smoothstep(rad - 0.6, rad + 0.6, dd)) * ring * 0.13 * edgeFade(q);
}

// The routine the mark is made of. Its six segments are its steps: the dark
// ones agent steps, the light ones automatic steps. A run comes in through
// the cut on the mark's left, splits into two parallel branches (over the
// top: agent, automatic, agent; along the bottom: automatic, agent,
// automatic), merges at the cut on the right and leaves. Points in the
// mark's own 100-unit box, then device px.
vec2 P(vec2 m) { return u_center + (m - vec2(50.0)) * U(); }
float segd(vec2 q, vec2 a, vec2 b) {
  vec2 pa = q - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
vec2 walk(vec2 a, vec2 b, vec2 c, vec2 d, vec2 e, float f) {
  float l1 = length(b - a), l2 = length(c - b), l3 = length(d - c), l4 = length(e - d);
  float s = f * (l1 + l2 + l3 + l4);
  if (s < l1) return mix(a, b, s / l1); s -= l1;
  if (s < l2) return mix(b, c, s / l2); s -= l2;
  if (s < l3) return mix(c, d, s / l3); s -= l3;
  return mix(d, e, clamp(s / l4, 0.0, 1.0));
}
// where the run is: x = in, y = upper branch, z = lower branch, w = out
// (each a position in px), with a visibility per dot in u_vis
vec2 J() { return P(vec2(17.0, 51.75)); }
vec2 K() { return P(vec2(83.0, 51.75)); }
float reach() { return min(2.7 * u_r, 0.5 * u_res.x - 48.0 * u_dpr); }
vec2 S() { return vec2(u_center.x - reach(), J().y); }
vec2 E() { return vec2(u_center.x + reach(), K().y); }
vec2 up(float f) { return walk(J(), P(vec2(29.4, 38.1)), P(vec2(50.0, 20.25)), P(vec2(70.6, 38.1)), K(), f); }
vec2 lo(float f) { return walk(J(), P(vec2(24.2, 64.9)), P(vec2(50.0, 73.8)), P(vec2(75.8, 64.9)), K(), f); }

float tt() { return mod(u_time, 8.0); }
float ease(float x) { return x * x * (3.0 - 2.0 * x); }
vec2 runIn() { return mix(S(), J(), ease(clamp(tt() / 1.4, 0.0, 1.0))); }
float branchF() { return clamp((tt() - 1.4) / 3.6, 0.0, 1.0); }
vec2 runOut() { return mix(K(), E(), ease(clamp((tt() - 5.0) / 1.4, 0.0, 1.0))); }
float onIn() { return step(tt(), 1.4); }
float onBranch() { return step(1.4, tt()) * step(tt(), 5.0); }
float onOut() { return step(5.0, tt()) * step(tt(), 6.4); }

float routineInk(vec2 q) {
  float w = 1.2 * u_dpr;
  float d = min(segd(q, S(), J()), segd(q, K(), E()));
  vec2 a = J(); vec2 b = P(vec2(29.4, 38.1)); vec2 c = P(vec2(50.0, 20.25)); vec2 e = P(vec2(70.6, 38.1));
  d = min(d, min(min(segd(q, a, b), segd(q, b, c)), min(segd(q, c, e), segd(q, e, K()))));
  b = P(vec2(24.2, 64.9)); c = P(vec2(50.0, 73.8)); e = P(vec2(75.8, 64.9));
  d = min(d, min(min(segd(q, a, b), segd(q, b, c)), min(segd(q, c, e), segd(q, e, K()))));
  float line = (1.0 - smoothstep(0.5 * w, w, d)) * 0.24;
  // start (hollow) and end (solid) of the routine
  float r = 4.5 * u_dpr;
  float st = 1.0 - smoothstep(-0.6, 0.6, abs(length(q - S()) - r) - 0.7 * u_dpr);
  float en = 1.0 - smoothstep(-0.6, 0.6, length(q - E()) - r);
  // the run
  float rr = 3.0 * u_dpr;
  float run = max(max((1.0 - smoothstep(-0.6, 0.6, length(q - runIn()) - rr)) * onIn(),
                      (1.0 - smoothstep(-0.6, 0.6, length(q - runOut()) - rr)) * onOut()),
                  max(1.0 - smoothstep(-0.6, 0.6, length(q - up(branchF())) - rr),
                      1.0 - smoothstep(-0.6, 0.6, length(q - lo(branchF())) - rr)) * onBranch());
  return max(max(line, 0.55 * max(st, en)), 0.85 * run) * edgeFade(q);
}
// how strongly piece k is running: the run is inside it
float litPiece(int k) {
  if (onBranch() < 0.5) return 0.0;
  float lit = 0.0;
  for (int j = 0; j < 2; j++) {
    vec2 dot = j == 0 ? up(branchF()) : lo(branchF());
    vec2 m = (dot - u_center) / U() + vec2(50.0);
    lit = max(lit, 1.0 - smoothstep(-5.0, 1.0, piece(m, k)));
  }
  return lit;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 c = p - u_center;
  float d = hexd(c);

  vec3 col = mix(BG, INK, max(dotsInk(p), routineInk(p)));
  col = mix(col, INK, 0.02 * (1.0 - smoothstep(0.0, 22.0 * u_dpr, hexd(c - vec2(0.0, 8.0 * u_dpr)))) * step(0.0, d));

  if (d < 1.0 * u_dpr) {
    float e = 1.5 * u_dpr;
    vec2 grad = normalize(vec2(hexd(c + vec2(e, 0.0)) - hexd(c - vec2(e, 0.0)),
                               hexd(c + vec2(0.0, e)) - hexd(c - vec2(0.0, e))));
    float bevel = 0.09 * u_r;
    float t = clamp(-d / bevel, 0.0, 1.0);          // 0 at the rim, 1 on the flat
    float slope = pow(1.0 - t, 1.6);

    // a clear lens: magnify, pull in at the bevel
    // (gentle, so the routine seen through a step lines up with its edges outside)
    vec2 base = u_center + c * 0.94 - grad * slope * 4.0 * u_dpr;
    // the bevel shows clean glass: the dots fade out there, the routine bends through
    float seen = max(dotsInk(base) * (1.0 - 0.85 * slope), routineInk(base));
    vec3 inside = mix(BG, INK, seen);
    // as in the mark: dark segments (agent steps), light ones (automatic), the lantern
    int k = pieceAt(c);
    float rim = 1.0 - smoothstep(1.5 * u_dpr, 3.0 * u_dpr, -d);
    if (k == 6) {
      float glow = 1.0 - smoothstep(0.0, 13.26 * U(), length(c));
      inside = mix(inside, vec3(1.0), (0.3 + 0.12 * onBranch()) * glow);
    } else {
      inside = mix(inside, INK, k < 3 ? 0.24 : 0.05);
      // a running step lights up like a running card in the graph:
      // brighter glass, an ink rim
      float lit = litPiece(k);
      inside = mix(inside, vec3(1.0), 0.42 * lit);
      inside = mix(inside, INK, 0.35 * lit * rim);
    }
    // quiet, even edges: a light rim, a fine inner line, a darker bevel foot
    inside = mix(inside, vec3(1.0), 0.2 * rim);
    float inner = 1.0 - smoothstep(0.0, 1.0 * u_dpr, abs(-d - 3.0 * u_dpr));
    inside = mix(inside, INK, 0.07 * inner + 0.04 * slope);

    float a = 1.0 - smoothstep(-0.5 * u_dpr, 0.5 * u_dpr, d);
    col = mix(col, inside, a);
  }
  // a hairline outline, so the edge holds on any screen
  col = mix(col, INK, 0.10 * (1.0 - smoothstep(0.0, 0.5 * u_dpr, abs(d))));
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

type Props = {
  /** The mark's outer inradius (centre to the flat top) in CSS px. */
  radius?: number;
  /** The mark's centre from the top of the canvas, CSS px. */
  top?: number;
};

export default function GlassHexagon({ radius = 118, top = 160 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return setFailed(true);
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return setFailed(true);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return setFailed(true);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u("u_res"), uCenter = u("u_center"), uR = u("u_r"), uDpr = u("u_dpr"), uTime = u("u_time");

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1;
    let raf = 0;
    let onScreen = false;
    const start = performance.now();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = (now: number) => {
      const secs = (now - start) / 1000;
      const small = canvas.clientWidth < 640;
      const r = small ? 84 : radius;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uCenter, canvas.width / 2, (small ? top - 30 : top) * dpr);
      gl.uniform1f(uR, r * dpr);
      gl.uniform1f(uDpr, dpr);
      // reduced motion: one still frame mid-run, steps lit
      gl.uniform1f(uTime, still ? 3.1 : secs);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      draw(now);
      raf = onScreen && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (still) return draw(performance.now());
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    draw(start);
    const ro = new ResizeObserver(() => { resize(); draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; kick(); });
    io.observe(canvas);
    document.addEventListener("visibilitychange", kick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
    };
  }, [radius, top]);

  return <canvas ref={ref} className={failed ? "glass-hex glass-hex--off" : "glass-hex"} aria-hidden="true" />;
}
