// Generated from docs/promos/2026-10-29-graph-connections (tools/build-hero-v3.cjs +
// tools/hero-graph-bg-v3.js). Edit there and regenerate; do not hand-edit.
// The runtime is the approved standalone script, unwrapped from its IIFE so the React component
// can hand it the root element (the standalone page found it via document.currentScript).
// It stores its teardown on root.__hgbDestroy; HeroGraphBackground calls that on unmount.

export function startHeroGraph(rootEl) {
  // hero-graph-bg runtime. One calm loop: four steps run one at a time, two on one flank, then
  // two on the other. A step's run IS its sub-routine: its sub-steps run in order, and an account
  // is pinged (a small dot leaves the card along the connector, the tile answers with a faint glow,
  // the dot returns) only during the sub-step that uses it. The parent card keeps the app's
  // lit-from-within running state until its last sub-step finishes, then fades back to idle (no
  // completion outline: the app has none). The second step of a flank lights the edge it was handed
  // over on. Between the flanks the hand-off travels too: one dot leaves the last left step, fades
  // out before the text column, fades back in and arrives at the first right step. Then a rest.
  // Edges never move; at most two dots move at once; one running card (+ its running sub-step).
  //
  // Hover a step card → its sub-routine expands, mirroring the app (Toone desktop, paths under
  // apps/toone-desktop/Toone/Toone/):
  //  - Expansion is per sub-routine, toggled from the card: RoutineDraftPipelineView.swift:401-428
  //    (isExpanded / toggleSubRoutine over disclosure.expandedSubRoutineIds).
  //  - Child steps are step-kind nodes labelled "n. Title", chained parent → first step → … with
  //    stepChain links: RoutineDraftGraphBuilder.swift:331-391.
  //  - Step cards are 150 × 36, the strip hangs 46 below its parent with 24 between steps:
  //    RoutinePipelineLayoutEngine.swift:26, :30-32, :436-475. Here: 196 × 36, run vertically,
  //    36 / 12 (why: see SUB in build-hero-v3.cjs).
  //  - Step card: radius 8, fill .85, 1pt separator border, RUNNING badge pinned top-trailing at
  //    (+6, −6), lit from within while running: RoutinePipelineGraphComponents.swift:247-276, :392-412.
  //  - stepChain edges: straight, .secondary @.55, 1.2pt: RoutinePipelineGraphComponents.swift:56-57, :91-92.
  //  - The "Show sub-routines" capsule "4⌄" (grey .4 @.18 at rest, theme accent @.18 when open):
  //    RoutinePipelineGraphComponents.swift:195-210, accent from LayoutStyle.swift:338.
  //  - Boundary: the Routine Creator graph container, r14, inner background @.38, separator @.75:
  //    RoutineDraftPipelineView.swift:99-107.
  //  - Focus dims the rest, a running node stays lit, easeInOut .25 s: RoutineDraftPipelineView.swift:357-363.
  //  - A live sub-routine keeps its parent Running: RoutineDraftRuntimePresentation.swift:113-115.
  //  - No spring on hover here (owner: no bounce, scale ≤ 1.03; the app uses 1.08 with a spring,
  //    RoutinePipelineGraphComponents.swift:242-243).
  var root = rootEl;
  if (!root || root.__hgbDestroy) return;
  var CFG = {"uses":{"f":{"la":["claude","openai"],"lb":["linkedin"],"ra":["figma","higgsfield"],"rb":["threads","facebook","instagram"]},"c":{"la":["claude","openai"],"lb":["linkedin"],"ra":["figma","higgsfield"],"rb":["threads","facebook","instagram"]}},"into":{"lb":"la","ra":"lb","rb":"ra"},"hand":{"ra":"lb"},"subs":{"la":[null,"claude","openai",null],"lb":["linkedin",null,"linkedin",null],"ra":[null,"figma",null,"higgsfield"],"rb":[null,"threads","facebook","instagram"]},"loops":{"f":[["la","lb","ra","rb"]],"c":[["la","lb","ra","rb"]]}};
  var q = function (s) { return root.querySelector(s); };
  var qa = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  // ---- timeline (seconds) ----
  var LOOP0 = 2.0;   // first loop starts after the entry
  var SUB_PLAIN = 1.2, SUB_ACCT = 1.8; // a sub-step's length, without / with an account to ping
  var SFADE = .25;   // a sub-step's running fade in / out (the next one starts as it ends: never two)
  // a ping inside its sub-step: dot out, tile answers, dot back (offsets from the sub-step's start)
  var OUT = [.15, .75], HI = [.65, 1.15], BACK = [1.05, 1.65];
  var FADE = .45;    // parent running → idle fade, after its last sub-step
  var GAP = .6;      // nothing running between steps (no two flanks change at once)
  var REST = 3.0;    // fully still at the end of every loop
  var RESET = [.7, .2]; // finished sub-steps fade back to pending between P−.7 and P−.2 (inside the rest)
  var HAND = 1.8, HGAP = .3; // cross-flank hand-off: the dot's trip, and the pause either side of it
  var SPLIT = .34;   // share of the trip on each visible half of the edge (the rest is behind the text)
  // sub-step schedule per step: [{ a, b, acct }] relative to the step's start
  var SUBS = {};
  Object.keys(CFG.subs).forEach(function (k) {
    var t = 0;
    SUBS[k] = CFG.subs[k].map(function (acct) {
      var d = acct ? SUB_ACCT : SUB_PLAIN, o = { a: t, b: t + d, acct: acct };
      t += d; return o;
    });
  });
  var runOf = function (k) { var s = SUBS[k]; return s[s.length - 1].b; };
  // per layout set: step start times per loop, when each loop goes calm, and the period
  var PLAN = {};
  ['f', 'c'].forEach(function (set) {
    var P = 0, loops = CFG.loops[set].map(function (loop) {
      var s = 0, starts = {}, hands = {}, calm = 0;
      loop.forEach(function (k) {
        // a hand-off across the text replaces the plain gap before this step
        if (CFG.hand[k] && s > 0) { hands[k] = s - GAP + HGAP; s = hands[k] + HAND + HGAP; }
        starts[k] = s; calm = s + runOf(k) + FADE; s = calm + GAP;
      });
      P = Math.max(P, calm + REST);
      return { starts: starts, hands: hands, calm: calm };
    });
    PLAN[set] = { P: Math.ceil(P * 2) / 2, loops: loops };
  });
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var easeIO = function (x) { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var sine = function (x) { x = clamp(x); return .5 - .5 * Math.cos(Math.PI * x); };
  var easeOut = function (x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  var rise = function (a, b, t) { return easeIO((t - a) / (b - a)); };
  var win = function (t, a, b, ai, bo) { return rise(a, a + ai, t) * (1 - rise(b, b + bo, t)); };
  // the app's running breath: wash .10 ↔ .22, easeInOut 1.9 s, autoreverse
  var breath = function (dt) { return .10 + .12 * (.5 - .5 * Math.cos(Math.PI * Math.max(0, dt) / 1.9)); };

  function A(el, k, v) { var c = el.__hgb || (el.__hgb = {}); if (c[k] !== v) { c[k] = v; el.setAttribute(k, v); } }
  function St(el, k, v) { var c = el.__hgbs || (el.__hgbs = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } }
  function Cl(el, k, on) { var c = el.__hgbc || (el.__hgbc = {}); if (c[k] !== on) { c[k] = on; el.classList.toggle(k, on); } }

  // ---- elements, per layout set ('f' full, 'c' compact) ----
  var SETS = {};
  ['f', 'c'].forEach(function (set) {
    var S = { cards: {}, tiles: {}, conns: {}, edges: {}, dots: {}, steps: {}, subs: {}, chain: {}, open: {} };
    qa('[id^="hgb-' + set + '-card-"]').forEach(function (g) {
      S.cards[g.id.split('-card-')[1]] = { run: g.querySelector('.hgb-run'), wash: g.querySelector('.hgb-wash'),
        rim: g.querySelector('.hgb-rim'), live: g.querySelector('.hgb-live') };
    });
    qa('[id^="hgb-' + set + '-tile-"]').forEach(function (g) { S.tiles[g.id.split('-tile-')[1]] = g.querySelector('.hgb-hi'); });
    qa('[id^="hgb-' + set + '-u-"]').forEach(function (p) { S.conns[p.id.split('-u-')[1]] = { el: p, rest: +p.getAttribute('data-rest'), pts: null }; });
    qa('[id^="hgb-' + set + '-e-"]').forEach(function (p) { S.edges[p.id.split('-e-')[1]] = { el: p, rest: +p.getAttribute('data-rest') }; });
    qa('[id^="hgb-' + set + '-dot-"]').forEach(function (c) { S.dots[c.id.split('-dot-')[1]] = c; });
    qa('[id^="hgb-' + set + '-step-"]').forEach(function (g) { S.steps[g.getAttribute('data-step')] = g; });
    qa('[id^="hgb-' + set + '-sub-"]').forEach(function (g) { S.open[g.getAttribute('data-step')] = g; });
    Object.keys(CFG.subs).forEach(function (k) {
      S.subs[k] = CFG.subs[k].map(function (_, i) {
        var g = document.getElementById('hgb-' + set + '-ss-' + k + '-' + i);
        return { run: g.querySelector('.hgb-run'), wash: g.querySelector('.hgb-wash'), rim: g.querySelector('.hgb-rim'),
          live: g.querySelector('.hgb-live'), pend: g.querySelector('.hgb-pend'), pipRun: g.querySelector('.hgb-pip-run'),
          done: g.querySelector('.hgb-done'), label: g.querySelector('.hgb-t2') };
      });
      S.chain[k] = CFG.subs[k].map(function (_, i) { return document.getElementById('hgb-' + set + '-sc-' + k + '-' + i); });
    });
    SETS[set] = S;
  });
  var ins = qa('.hgb-in').map(function (g) { return { g: g, d: parseFloat(g.style.getPropertyValue('--d')) || 0 }; });
  var lines = qa('.hgb-lines');

  // The two halves of the cross-flank edge run from their step's port to the text column's edge,
  // wherever the flank sits (compact flanks are pinned to the viewport edges, so the gap to the
  // column grows with the width). Laid out once per resize; the markup ships the 1100px fit.
  function fitCross() {
    var rr = root.getBoundingClientRect(); if (!rr.width) return;
    var inner = parseFloat(getComputedStyle(root).getPropertyValue('--hgb-inner')) || 268;
    qa('.hgb-cross').forEach(function (p) {
      var svg = p.ownerSVGElement, m = svg && svg.getScreenCTM();
      if (!m || !svg.getBoundingClientRect().width) return; // layout set not shown
      var out = !/-in$/.test(p.id), port = p.getAttribute('data-port').split(' ').map(Number), ey = +p.getAttribute('data-y');
      var pt = svg.createSVGPoint(); pt.x = rr.left + rr.width / 2 + (out ? -inner : inner); pt.y = 0;
      var ex = pt.matrixTransform(m.inverse()).x + (out ? -2 : 2);
      var x0 = out ? port[0] : ex, y0 = out ? port[1] : ey, x1 = out ? ex : port[0], y1 = out ? ey : port[1], dx = x1 - x0;
      if (dx < 8) return;
      p.setAttribute('d', 'M' + x0.toFixed(1) + ' ' + y0 + 'C' + (x0 + .4 * dx).toFixed(1) + ' ' + y0 + ' ' + (x1 - .4 * dx).toFixed(1) + ' ' + y1 + ' ' + x1.toFixed(1) + ' ' + y1);
      var g = document.getElementById(p.getAttribute('stroke').slice(5, -1));
      if (g) { g.setAttribute('x1', x0.toFixed(1)); g.setAttribute('x2', x1.toFixed(1)); }
    });
    ['f', 'c'].forEach(function (set) { Object.keys(SETS[set].edges).forEach(function (k) { SETS[set].edges[k].pts = null; }); });
  }

  // connector paths are sampled once (48 segments) so the loop never reads layout
  function pts(c) {
    if (c.pts) return c.pts;
    var len = 0; try { len = c.el.getTotalLength(); } catch (e) { len = 0; }
    if (!len) return null;
    var a = [];
    for (var i = 0; i <= 48; i++) { var p = c.el.getPointAtLength(len * i / 48); a.push(p.x, p.y); }
    return (c.pts = a);
  }
  function at(a, u) {
    var f = clamp(u) * 48, i = Math.min(47, Math.floor(f)), r = f - i;
    return [a[2 * i] + (a[2 * i + 2] - a[2 * i]) * r, a[2 * i + 1] + (a[2 * i + 3] - a[2 * i + 1]) * r];
  }

  var mqCompact = window.matchMedia && window.matchMedia('(max-width: 1599px)');
  var setName = function () { return mqCompact && mqCompact.matches ? 'c' : 'f'; };

  // one sub-step card: run 0..1 (running treatment), done 0..1 (finished pip), wash
  function paintSub(el, run, done, wash) {
    A(el.run, 'opacity', run.toFixed(2));
    A(el.rim, 'opacity', (run * .9).toFixed(2));
    A(el.live, 'opacity', (run * .65).toFixed(2));
    A(el.wash, 'fill-opacity', run > 0 ? wash.toFixed(3) : '0.1');
    A(el.pipRun, 'opacity', run.toFixed(2));
    A(el.done, 'opacity', (done * (1 - run)).toFixed(2));
    A(el.pend, 'opacity', (1 - Math.max(run, done)).toFixed(2));
    A(el.label, 'fill-opacity', (.62 + .33 * Math.max(run, done)).toFixed(2));
  }

  var entryDone = false;
  function render(t, opts) {
    var still = !!(opts && opts.still);

    // entry (once, ~1.5 s): the app's top-to-bottom stagger, a short fade + 6px rise
    if (!entryDone || still) {
      entryDone = still || t >= 2;
      ins.forEach(function (o) {
        var p = still ? 1 : easeOut((t - o.d) / .6);
        St(o.g, 'opacity', p.toFixed(3));
        St(o.g, 'transform', p >= 1 ? '' : 'translateY(' + (6 * (1 - p)).toFixed(2) + 'px)');
      });
      var lp = still ? 1 : easeIO((t - .7) / .6);
      lines.forEach(function (g) { St(g, 'opacity', lp.toFixed(3)); });
    }

    var set = setName(), S = SETS[set], PL = PLAN[set];
    var live = !still && t >= LOOP0;
    var tau = live ? (t - LOOP0) % PL.P : -1;
    var n = live ? Math.floor((t - LOOP0) / PL.P) : 0;
    var li = n % PL.loops.length, starts = PL.loops[li].starts, hands = PL.loops[li].hands;
    // reduced motion: one card steadily running, mid-way through its sub-routine (its second
    // sub-step running, the first finished), with that sub-step's account in use
    var STILL_CARD = 'la', STILL_SUB = 1;
    var reset = live ? 1 - rise(PL.P - RESET[0], PL.P - RESET[1], tau) : 1;

    var connH = {}, tileH = {}, edgeH = {};
    Object.keys(S.dots).forEach(function (k) { S.dots[k].__on = 0; });
    Object.keys(S.cards).forEach(function (k) {
      var el = S.cards[k], s = starts[k], run = 0, wash = .1;
      var uses = CFG.uses[set][k], subs = SUBS[k], subEls = S.subs[k], chain = S.chain[k];
      if (still) {
        if (k === STILL_CARD) {
          run = 1; wash = .16; // the app's steady reduce-motion wash
          var sa = subs[STILL_SUB].acct;
          if (sa) { connH[k + '-' + sa] = 1; tileH[sa] = .6; }
        }
        subs.forEach(function (sb, i) {
          var on = k === STILL_CARD;
          paintSub(subEls[i], on && i === STILL_SUB ? 1 : 0, on && i < STILL_SUB ? 1 : 0, .16);
          A(chain[i], 'stroke-opacity', on && i === STILL_SUB ? '0.55' : '0.30');
        });
      } else if (live && s != null) {
        run = win(tau, s, s + runOf(k), FADE, FADE);
        wash = breath(tau - s);
        subs.forEach(function (sb, i) {
          var a = s + sb.a, b = s + sb.b;
          var sr = Math.min(run, win(tau, a, b - SFADE, SFADE, SFADE)); // never ahead of its parent
          paintSub(subEls[i], sr, rise(b - SFADE, b, tau) * reset, breath(tau - a));
          A(chain[i], 'stroke-opacity', (.30 + .25 * sr).toFixed(2));
          if (!sb.acct) return;
          // the ping belongs to this sub-step: dot out, the account answers, dot back
          var name = sb.acct, j = uses.indexOf(name), key = k + '-' + name;
          connH[key] = Math.max(connH[key] || 0, win(tau, a + OUT[0] - .1, a + BACK[1], .25, .35));
          tileH[name] = Math.max(tileH[name] || 0, win(tau, a + HI[0], a + HI[1], .3, .5));
          var c = S.conns[key], dot = S.dots[k.charAt(0) + j], pa = c && pts(c);
          if (!pa || !dot) return;
          var u = -1, o = 0;
          if (tau >= a + OUT[0] && tau <= a + OUT[1]) {
            var x = (tau - a - OUT[0]) / (OUT[1] - OUT[0]); u = sine(x); o = Math.min(1, x / .2, (1 - x) / .25);
          } else if (tau >= a + BACK[0] && tau <= a + BACK[1]) {
            var y = (tau - a - BACK[0]) / (BACK[1] - BACK[0]); u = 1 - sine(y); o = Math.min(1, y / .25, (1 - y) / .2);
          }
          if (u >= 0) {
            var pt = at(pa, u);
            St(dot, 'transform', 'translate(' + pt[0].toFixed(1) + 'px,' + pt[1].toFixed(1) + 'px)');
            A(dot, 'opacity', (.6 * o).toFixed(2));
            dot.__on = 1;
          }
        });
        // hand-over: the edge from this flank's previous step (same loop) lights while this one runs
        var from = CFG.into[k];
        if (from && starts[from] != null && starts[from] < s) edgeH[from + '-' + k] = run;
      } else {
        subs.forEach(function (sb, i) { paintSub(subEls[i], 0, 0, .1); A(chain[i], 'stroke-opacity', '0.30'); });
      }
      A(el.run, 'opacity', run.toFixed(2));
      A(el.rim, 'opacity', (run * .7).toFixed(2));
      A(el.live, 'opacity', (run * .65).toFixed(2));
      A(el.wash, 'fill-opacity', run > 0 ? wash.toFixed(3) : '0.1');
      if (S.steps[k]) Cl(S.steps[k], 'hgb-active', run > .02);
    });
    // the cross-flank hand-off: edge <from>-<to> (left half) + <from>-<to>-in (right half)
    if (live) Object.keys(hands).forEach(function (k) {
      var hs = hands[k], from = CFG.hand[k], key = from + '-' + k, x = (tau - hs) / HAND;
      edgeH[key] = Math.max(edgeH[key] || 0, win(tau, hs - .15, hs + HAND, .3, .45));
      if (x < 0 || x > 1) return;
      var p = sine(x), a, u, dot, o;
      if (p <= SPLIT) { a = S.edges[key]; dot = S.dots[from.charAt(0) + '0']; u = p / SPLIT; o = Math.min(1, x / .08) * (1 - u); }
      else if (p >= 1 - SPLIT) { a = S.edges[key + '-in']; dot = S.dots[k.charAt(0) + '0']; u = (p - 1 + SPLIT) / SPLIT; o = u * Math.min(1, (1 - x) / .08); }
      a = a && pts(a);
      if (!a || !dot) return;
      var pt = at(a, u);
      St(dot, 'transform', 'translate(' + pt[0].toFixed(1) + 'px,' + pt[1].toFixed(1) + 'px)');
      A(dot, 'opacity', (.6 * o).toFixed(2));
      dot.__on = 1;
    });
    Object.keys(S.conns).forEach(function (k) {
      var c = S.conns[k], h = connH[k] || 0;
      A(c.el, 'stroke-opacity', (c.rest + (.62 - c.rest) * h).toFixed(2));
    });
    Object.keys(S.edges).forEach(function (k) {
      var e = S.edges[k], h = edgeH[k.replace(/-in$/, '')] || 0;
      A(e.el, 'stroke-opacity', (e.rest + (.6 - e.rest) * h).toFixed(2));
    });
    Object.keys(S.tiles).forEach(function (k) { A(S.tiles[k], 'opacity', (tileH[k] || 0).toFixed(2)); });
    Object.keys(S.dots).forEach(function (k) { if (!S.dots[k].__on) A(S.dots[k], 'opacity', '0'); });
  }

  // seconds of nothing-to-draw ahead of t (0 = keep animating). The rest ends early enough to
  // draw the finished sub-steps fading back to pending.
  function idleFor(t) {
    if (t < LOOP0) return 0;
    var PL = PLAN[setName()], n = Math.floor((t - LOOP0) / PL.P), tau = (t - LOOP0) % PL.P;
    var calm = PL.loops[n % PL.loops.length].calm + .1, wake = PL.P - RESET[0] - .05;
    return tau >= calm && tau < wake ? wake - tau : 0;
  }

  // ---- clock: real time, ~30 fps, paused while hidden / scrolled away, asleep in calm windows ----
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var freeze = /[?&]hgb-freeze\b/.test(location.search);
  var clock = 0, last = 0, lastPaint = 0, visible = true, raf = 0, sleepT = 0, dead = false;
  var stillNow = function () { return reduce && reduce.matches; };
  window.__hgbSeek = function (t) { render(t); };
  window.__hgbStill = function () { render(99, { still: true }); };
  window.__hgbPlan = function () { return { LOOP0: LOOP0, SUBS: SUBS, PLAN: PLAN, OUT: OUT, HI: HI, BACK: BACK, FADE: FADE }; };

  function sleep(sec) {
    var from = performance.now();
    sleepT = setTimeout(function () {
      sleepT = 0;
      clock += Math.min(sec, (performance.now() - from) / 1000);
      last = 0; loop();
    }, sec * 1000);
  }
  function frame(now) {
    raf = 0;
    if (last) clock += Math.min(.1, (now - last) / 1000);
    last = now;
    if (now - lastPaint >= 32) {
      lastPaint = now;
      render(clock);
      var idle = idleFor(clock);
      if (idle > .05) { last = 0; sleep(idle); return; }
    }
    loop();
  }
  function loop() {
    if (dead || raf || sleepT || freeze || stillNow() || !visible || document.hidden) { last = 0; return; }
    raf = requestAnimationFrame(frame);
  }

  // ---- hover → sub-routine (only the step cards and an open sub-routine take the pointer) ----
  var closeT = 0, openKey = null, openSet = null;
  function setOpen(set, k) {
    if (openKey === k && openSet === set) return;
    if (openKey) {
      var P = SETS[openSet];
      P.steps[openKey].classList.remove('hgb-open'); P.open[openKey].classList.remove('hgb-open');
      P.open[openKey].ownerSVGElement.classList.remove('hgb-host');
    }
    openKey = k; openSet = k ? set : null;
    if (k) {
      var S = SETS[set];
      S.steps[k].classList.add('hgb-open'); S.open[k].classList.add('hgb-open');
      S.open[k].ownerSVGElement.classList.add('hgb-host');
    }
    root.classList.toggle('hgb-focus', !!k);
  }
  function hitInfo(e) {
    var el = e.target, k = el && el.getAttribute && el.getAttribute('data-step');
    var svg = el && el.ownerSVGElement;
    return k && svg ? { k: k, set: svg.classList.contains('hgb-c') ? 'c' : 'f' } : null;
  }
  function onEnter(e) {
    var h = hitInfo(e); if (!h) return;
    if (closeT) { clearTimeout(closeT); closeT = 0; }
    setOpen(h.set, h.k);
  }
  function onLeave() {
    if (closeT) clearTimeout(closeT);
    // a short grace so the pointer can cross from the card into its sub-routine
    closeT = setTimeout(function () { closeT = 0; setOpen(null, null); }, 120);
  }
  var hits = qa('.hgb-hit');
  hits.forEach(function (h) { h.addEventListener('pointerenter', onEnter); h.addEventListener('pointerleave', onLeave); });

  var fitT = 0;
  function onResize() {
    if (fitT) return;
    fitT = requestAnimationFrame(function () { fitT = 0; fitCross(); if (stillNow()) render(99, { still: true }); else render(clock); });
  }
  function onReduce() {
    if (reduce.matches) render(99, { still: true });
    else { clock = Math.max(clock, LOOP0); entryDone = false; render(clock); loop(); }
  }
  function onCompact() {
    setOpen(null, null); // the open sub-routine belongs to the layout that just went away
    fitCross();
    if (stillNow()) render(99, { still: true }); else render(clock);
  }
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', loop);
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', onReduce);
  if (mqCompact && mqCompact.addEventListener) mqCompact.addEventListener('change', onCompact);
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; loop(); });
    io.observe(root);
  }
  // Tears everything down (the React port calls this from its useEffect cleanup).
  root.__hgbDestroy = function () {
    dead = true;
    if (raf) cancelAnimationFrame(raf); if (sleepT) clearTimeout(sleepT); if (fitT) cancelAnimationFrame(fitT);
    if (closeT) clearTimeout(closeT);
    raf = sleepT = fitT = closeT = 0;
    hits.forEach(function (h) { h.removeEventListener('pointerenter', onEnter); h.removeEventListener('pointerleave', onLeave); });
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', loop);
    if (reduce && reduce.removeEventListener) reduce.removeEventListener('change', onReduce);
    if (mqCompact && mqCompact.removeEventListener) mqCompact.removeEventListener('change', onCompact);
    if (io) io.disconnect();
    setOpen(null, null);
    delete root.__hgbDestroy;
  };

  fitCross();
  root.classList.add('hgb-ready');
  if (stillNow()) render(99, { still: true });
  else { render(clock); loop(); }
}
