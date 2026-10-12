'use strict';
// Landscapes: raymarched once at high resolution (colour + depth), animated with depth parallax,
// composited with live 2D elements and figures, then passed through an oil-paint filter.
const W3 = {};
const TERS = {};
function ter(w, h) { const k = w + 'x' + h; return TERS[k] || (TERS[k] = new Terrain(w, h)); }
let _fx = null; function fx() { return _fx || (_fx = new FX()); }
function baseParams(light, sun, extra = {}) { return Object.assign({ uOct: 7, uTrees: 1, uHouses: 0, uRoadW: 3.2, uWindowGlow: 0, uVillage: [0, 0, 1, 0], uSun: sun, uTime: 0, uMode: 0 }, LIGHT[light], extra); }
const PLATE_W = 2400, PLATE_H = 1350;
const NEW_PLATES = [];
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
async function plate(P, size) {
  const [pw, ph] = size || [PLATE_W, PLATE_H];
  const key = hashStr(JSON.stringify(P) + TERRAIN_FS.length + (size ? size.join('x') : ''));
  const toCanvas = img => { const c = canvas(PLATE_W, PLATE_H); c.ctx.drawImage(img, 0, 0, PLATE_W, PLATE_H); return c; };
  try {
    const [a, b] = await Promise.all([loadImage(`plates/${key}_c.png`), loadImage(`plates/${key}_d.png`)]);
    return { col: toCanvas(a), dep: toCanvas(b), P };
  } catch (e) { /* not cached */ }
  const T = ter(pw, ph);
  const col = toCanvas(T.render(Object.assign({}, P, { uMode: 0 })));
  const dep = toCanvas(T.render(Object.assign({}, P, { uMode: 1 })));
  if (window.savePlate) await window.savePlate(key, col.toDataURL('image/png'), dep.toDataURL('image/png'));
  return { col, dep, P };
}
window.exportPlates = () => NEW_PLATES.splice(0).map(p => ({ key: p.key, c: p.col.toDataURL('image/png'), d: p.dep.toDataURL('image/png') }));

// screen position of a world point, for a plate shown with view {zoom, center}
function onPlate(world, P, view) {
  const pr = project(world, P.uRo, P.uTa, P.uFl, PLATE_W, PLATE_H); if (!pr) return null;
  const z = view.zoom || 1, c = view.center || [0.5, 0.5];
  const u = pr.x / PLATE_W, v = pr.y / PLATE_H, aspect = (PLATE_W / PLATE_H) / (W / H);
  return { x: ((u - c[0]) * z + 0.5) * W, y: ((v - c[1]) * z + 0.5) * H, s: pr.s * (H / PLATE_H) * z, z: pr.z };
}
let _weaveT = null;
function canvasWeave() {
  if (_weaveT) return _weaveT;
  const c = canvas(96, 96), x = c.ctx, id = x.createImageData(96, 96), r = RNG(5);
  const jit = Array.from({ length: 96 }, () => r.range(-0.15, 0.15));
  for (let y = 0; y < 96; y++) for (let xx = 0; xx < 96; xx++) {
    const v = 0.5 + 0.22 * Math.sin(TAU * xx / 4 + jit[y]) * Math.sin(TAU * y / 96 * 3) + 0.22 * Math.sin(TAU * y / 4 + jit[xx]) * Math.cos(TAU * xx / 96 * 2);
    const i = (y * 96 + xx) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = clamp(v) * 255; id.data[i + 3] = 255;
  }
  x.putImageData(id, 0, 0); return (_weaveT = c);
}
// final "painted" pass: oil-paint filter + faint canvas weave
function paintPass(ctx, src, r = 4, weave = 0.1) {
  ctx.drawImage(fx().kuwahara(src, r), 0, 0);
  if (weave > 0) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = weave; ctx.fillStyle = ctx.createPattern(canvasWeave(), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
function plateFrame(pl, view) { const c = canvas(W, H); c.ctx.drawImage(fx().parallax(pl.col, pl.dep, view), 0, 0); return c; }

const WALK = 1.25;       // m/s
const FIG_H = 1.75;      // m
const CAD = 0.82;        // stride cycles per second

// --------------------------------------------------------------------------------------------- road, wide
W3.road_wide = {
  async setup(dur) {
    const z0 = -20; this.z0 = z0;
    const ro = [roadX(z0) + 5, roadH(z0) + 7.5, z0], ta = [roadX(70) - 2, roadH(70) + 2, 70];
    this.pl = await plate(baseParams('afternoon', sunDir(0.62, 0.30), { uRo: ro, uTa: ta, uFl: 1.55 }));
    this.grass = makeGrass(15, 380, -40, W + 40, 1010, 1100, [40, 120], PAL.afternoon, { wk: 1.6 });
  },
  draw(ctx, t, dur) {
    const u = t / dur, view = { zoom: lerp(1.0, 1.08, ease(u)), center: [0.5, lerp(0.5, 0.47, ease(u))], shift: [lerp(0, 0.012, u), 0], par: 1 };
    const F = plateFrame(this.pl, view), f = F.ctx;
    const z = lerp(2, 2 + WALK * dur, u);
    const pal = PAL.afternoon;
    const walkers = [{ dz: 0.0, dx: -0.55, cl: CLOTH.undyed, ph: 0, staff: false }, { dz: 0.35, dx: 0.6, cl: CLOTH.indigo, ph: 0.4, staff: true }];
    walkers.sort((a, b) => b.dz - a.dz);
    for (const wk of walkers) {
      const zz = z + wk.dz, p = onPlate([roadX(zz) + wk.dx, roadH(zz), zz], this.pl.P, view); if (!p) continue;
      const hpx = p.s * FIG_H, ph = (t * CAD + wk.ph) % 1;
      f.fillStyle = rgb(pal.shadow, 0.3); f.beginPath(); f.ellipse(p.x - hpx * 0.1, p.y + hpx * 0.06, hpx * 0.12, hpx * 0.2, 0.3, 0, TAU); f.fill();
      drawWalker(f, p.x, p.y, hpx, ph, { view: 'back', cloth: wk.cl, rim: pal.rim, rimA: 0.8, dark: 0.45, staff: wk.staff, phase: ph });
    }
    grass(f, t, this.grass, pal, 1);
    motes(f, t, 16, 120, [0, 300, W, H], { color: pal.rim, alpha: 0.35 });
    birds(f, t, 17, 6, 1350, 210, -22, [70, 60, 60], 1.1);
    paintPass(ctx, F, 4);
  },
};

// --------------------------------------------------------------------------------------------- side tracking
function trackScene(cfg) {
  return {
    async setup(dur) {
      const z0 = cfg.z0, x0 = roadX(z0);
      const ro = [x0 - cfg.dist, roadH(z0) + 1.55, z0], ta = [x0 + 40, roadH(z0) + 2.5 + (cfg.tilt || 0), z0 + 4];
      this.pl = await plate(baseParams(cfg.light, cfg.sun, { uRo: ro, uTa: ta, uFl: 1.35, uRoadW: 3.6 }));
      this.ro = ro;
      const pal = this.pal = PAL[cfg.light];
      // foreground road strip (2D, scrolls at walking speed so the feet stay planted)
      const g = this.ground = canvas(8000, 420), x = g.ctx, r = RNG(cfg.z0 | 0);
      const base = mix3(pal.land, [214, 190, 150], 0.45);
      x.fillStyle = linear(x, 0, 0, 0, 420, [[0, rgb(base, 0)], [0.18, rgb(base, 0.95)], [1, rgb(base.map(v => v * 0.7))]]); x.fillRect(0, 0, 8000, 420);
      for (let i = 0; i < 9000; i++) { const py = 60 + Math.pow(r(), 0.8) * 360, s = lerp(0.8, 5, (py - 60) / 360); x.fillStyle = rgb([110 + r() * 80, 96 + r() * 66, 74 + r() * 50], 0.75); x.beginPath(); x.ellipse(r() * 8000, py, s, s * 0.55, 0, 0, TAU); x.fill(); }
      for (const ry of [170, 300]) { x.strokeStyle = rgb(pal.shadow, 0.15); x.lineWidth = 10; x.beginPath(); x.moveTo(0, ry); for (let k = 0; k < 8000; k += 40) x.lineTo(k, ry + Math.sin(k * 0.01) * 6); x.stroke(); }
      this.fg = makeGrass(cfg.z0 + 3, 1100, 0, 8000, 1060, 1100, [70, 220], pal, { wk: 2.2 });
      this.puffs = [];
      if (cfg.city) this.city = cityCanvas(pal);
    },
    draw(ctx, t, dur) {
      const pal = this.pal, u = t / dur;
      const view = { zoom: 1.04, center: [0.5, 0.5], shift: [-0.045 * u, 0], par: 1 };
      const F = plateFrame(this.pl, view), f = F.ctx;
      if (this.city) { f.save(); f.globalAlpha = 0.85; f.drawImage(this.city, cfg.city[0] - 140 * u, cfg.city[1], 700, 200); f.restore(); }
      const hpx = 1.35 * H / cfg.dist * FIG_H * 1.04;   // figure height at the road centre line
      const groundY = cfg.groundY;
      const speed = 0.78 * hpx * CAD;                    // px/s the ground passes under the feet
      f.drawImage(this.ground, -(speed * t) % 4000, groundY - 70);
      const walkers = cfg.walkers(t, dur).sort((a, b) => a.depth - b.depth);
      for (const wk of walkers) {
        const sc = hpx * wk.scale, ph = (t * CAD * (wk.stride ?? 1) + wk.ph) % 1, y = groundY - (1 - wk.scale) * 50;
        f.fillStyle = rgb(pal.shadow, 0.28); f.beginPath(); f.ellipse(wk.x - sc * 0.22 * (cfg.shadowDir || 1), y, sc * 0.3, sc * 0.035, 0, 0, TAU); f.fill();
        drawWalker(f, wk.x, y, sc, ph, { view: 'side', dir: 1, cloth: wk.cloth, rim: pal.rim, rimA: 0.95, dark: wk.dark ?? 0.5, light: cfg.lightSide ?? 1, staff: wk.staff, bow: wk.bow, gesture: wk.gesture ? wk.gesture(t) : 0, stride: wk.stride ?? 1 });
        const step = Math.floor((t * CAD + wk.ph) * 2);
        if (step !== wk._l) { this.puffs.push({ t, x: wk.x + sc * 0.06, y, vx: -speed * 0.2, s: sc * 0.06 }); wk._l = step; }
      }
      dustPuffs(f, this.puffs, t, mix3(pal.land, pal.hor, 0.6));
      const G = canvas(W, H), gc = G.ctx; gc.translate(-(speed * 1.6 * t) % 4000, 0);
      grass(gc, t, this.fg.filter(b => { const xx = b.x - (speed * 1.6 * t) % 4000; return xx > -100 && xx < W + 100; }), pal, 1.2);
      f.save(); f.filter = 'blur(7px)'; f.drawImage(G, 0, 0); f.restore();
      motes(f, t, 19, 140, [0, 100, W, H], { color: pal.rim, alpha: 0.4, drift: -18 });
      paintPass(ctx, F, 4);
    },
  };
}
const WALKERS_TWO = () => [
  { x: 760, scale: 1.0, depth: 1, ph: 0.0, cloth: CLOTH.undyed, bow: 0.65 },
  { x: 1030, scale: 0.93, depth: 0, ph: 0.37, cloth: CLOTH.indigo, bow: 0.5, staff: true },
];
W3.track_two = trackScene({ light: 'afternoon', sun: sunDir(0.9, 0.32), z0: 140, dist: 6.2, tilt: 16, groundY: 905, walkers: WALKERS_TWO });
W3.track_dusk = trackScene({
  light: 'dusk', sun: sunDir(1.45, 0.045), z0: 980, dist: 9.5, tilt: 6, groundY: 880, lightSide: 1,
  walkers: () => [
    { x: 640, scale: 1.0, depth: 2, ph: 0.0, cloth: CLOTH.undyed, bow: 0.2, dark: 0.82 },
    { x: 870, scale: 0.95, depth: 1, ph: 0.37, cloth: CLOTH.indigo, staff: true, dark: 0.82 },
    { x: 1100, scale: 0.92, depth: 0, ph: 0.62, cloth: CLOTH.stranger, dark: 0.82 },
  ],
});
W3.track_three = trackScene({
  light: 'golden', sun: sunDir(1.2, 0.17), z0: 420, dist: 6.6, tilt: 16, groundY: 905,
  walkers: (t, dur) => [
    { x: 600, scale: 1.0, depth: 2, ph: 0.0, cloth: CLOTH.undyed, bow: 0.25, gesture: tt => clamp(Math.sin((tt - 1.0) * 0.8)) * 0.85 },
    { x: 860, scale: 0.94, depth: 1, ph: 0.37, cloth: CLOTH.indigo, bow: 0.2, staff: true },
    { x: 1150, scale: 0.9, depth: 0, ph: 0.62, cloth: CLOTH.stranger, bow: 0.05, dark: 0.55 },
  ],
});

// --------------------------------------------------------------------------------------------- the stranger joins (from behind)
W3.road_join = {
  async setup(dur) {
    const z0 = 300; this.z0 = z0;
    const ro = [roadX(z0) - 1.2, roadH(z0) + 2.4, z0], ta = [roadX(z0 + 60), roadH(z0 + 60) + 1.6, z0 + 60];
    this.pl = await plate(baseParams('golden', sunDir(0.35, 0.22), { uRo: ro, uTa: ta, uFl: 1.45, uRoadW: 3.6 }));
    this.grass = makeGrass(31, 400, -40, W + 40, 1000, 1100, [50, 150], PAL.golden, { wk: 1.8 });
    this.puffs = [];
  },
  draw(ctx, t, dur) {
    const u = t / dur, pal = PAL.golden, view = { zoom: lerp(1.0, 1.05, u), center: [0.5, 0.5], shift: [0, -0.01 * u], par: 1 };
    const F = plateFrame(this.pl, view), f = F.ctx;
    const z = this.z0 + 7 + WALK * t * 0.35;   // camera follows slowly, walkers recede gently
    const join = ease(clamp(t / (dur * 0.7)));
    const list = [
      { z: z, dx: -0.6, cl: CLOTH.undyed, ph: 0, staff: false },
      { z: z + 0.3, dx: 0.55, cl: CLOTH.indigo, ph: 0.4, staff: true },
      { z: lerp(z + 9, z + 0.6, join), dx: lerp(9, 1.5, join), cl: CLOTH.stranger, ph: 0.7, staff: false },
    ].sort((a, b) => b.z - a.z);
    for (const wk of list) {
      const p = onPlate([roadX(wk.z) + wk.dx, roadH(wk.z), wk.z], this.pl.P, view); if (!p) continue;
      const hpx = p.s * FIG_H, ph = (t * CAD + wk.ph) % 1;
      f.fillStyle = rgb(pal.shadow, 0.3); f.beginPath(); f.ellipse(p.x + hpx * 0.15, p.y + hpx * 0.04, hpx * 0.3, hpx * 0.05, -0.15, 0, TAU); f.fill();
      drawWalker(f, p.x, p.y, hpx, ph, { view: 'back', cloth: wk.cl, rim: pal.rim, rimA: 0.9, dark: 0.5, staff: wk.staff, phase: ph });
    }
    grass(f, t, this.grass, pal, 1);
    motes(f, t, 33, 130, [0, 200, W, H], { color: pal.rim, alpha: 0.4 });
    paintPass(ctx, F, 4);
  },
};

// --------------------------------------------------------------------------------------------- time-lapse: hours pass
W3.timelapse = {
  async setup(dur) {
    const zc = 700, ro = [roadX(zc - 110) + 4, roadH(zc - 110) + 34, zc - 110], ta = [roadX(zc + 140), roadH(zc + 140) + 4, zc + 140];
    this.zc = zc;
    const keys = [['afternoon', 0.30, 0.9], ['golden', 0.17, 1.15], ['golden', 0.08, 1.3], ['dusk', 0.025, 1.42]];
    this.pls = [];
    for (const [L, el, az] of keys) this.pls.push(await plate(baseParams(L, sunDir(az, el), { uRo: ro, uTa: ta, uFl: 1.6, uOct: 6 }), [1920, 1080]));
  },
  draw(ctx, t, dur) {
    const u = t / dur, k = u * (this.pls.length - 1), i = Math.min(this.pls.length - 2, Math.floor(k)), fr = ease(k - i);
    const view = { zoom: 1.02 + 0.03 * u, center: [0.5, 0.5], shift: [0.01 * u, 0], par: 1 };
    const A = plateFrame(this.pls[i], view), B = plateFrame(this.pls[i + 1], view);
    const F = canvas(W, H), f = F.ctx; f.drawImage(A, 0, 0); f.globalAlpha = fr; f.drawImage(B, 0, 0); f.globalAlpha = 1;
    const pal = u < 0.5 ? PAL.golden : PAL.dusk;
    for (let j = 0; j < 3; j++) {
      const zz = this.zc - 40 + u * 25 - j * 1.4, p = onPlate([roadX(zz), roadH(zz), zz], this.pls[0].P, view); if (!p) continue;
      drawWalker(f, p.x, p.y, p.s * FIG_H, (t * 1.6 + j * 0.33) % 1, { view: 'back', cloth: [CLOTH.undyed, CLOTH.indigo, CLOTH.stranger][j], rim: pal.rim, rimA: 0.9, dark: 0.6, phase: (t * 1.6 + j * 0.33) % 1 });
    }
    birds(f, t, 41, 8, 200 + t * 60, 260, 40, [50, 40, 40], 1);
    paintPass(ctx, F, 4);
  },
};

// --------------------------------------------------------------------------------------------- feet on the road
W3.feet = {
  async setup(dur) {
    const z0 = 900, x0 = roadX(z0);
    const ro = [x0 - 3.0, roadH(z0) + 0.45, z0], ta = [x0 + 30, roadH(z0) + 1.4, z0 - 6];
    this.pl = await plate(baseParams('golden', sunDir(1.6, 0.06), { uRo: ro, uTa: ta, uFl: 1.2, uRoadW: 4 }));
    this.puffs = []; this.fg = makeGrass(44, 260, -60, W + 60, 1050, 1100, [80, 200], PAL.golden, { wk: 2.4 });
  },
  draw(ctx, t, dur) {
    const pal = PAL.golden, view = { zoom: 1.03, center: [0.5, 0.5], shift: [-0.01 * t / dur, 0], par: 1 };
    const F = plateFrame(this.pl, view), f = F.ctx, gy = 930, h = 2400;
    const ws = [{ x0: -500, ph: 0, cl: CLOTH.undyed }, { x0: -1500, ph: 0.35, cl: CLOTH.indigo }, { x0: -2500, ph: 0.62, cl: CLOTH.stranger }];
    const v = 0.78 * h * CAD * 0.5;   // slow-motion feel: half cadence
    for (const wk of ws) {
      const x = wk.x0 + v * t, ph = (t * CAD * 0.5 + wk.ph) % 1; if (x < -1000 || x > W + 1000) continue;
      f.fillStyle = rgb(pal.shadow, 0.35); f.beginPath(); f.ellipse(x - 420, gy + 8, 520, 34, 0, 0, TAU); f.fill();
      drawWalker(f, x, gy, h, ph, { view: 'side', cloth: wk.cl, rim: pal.rim, rimA: 1, dark: 0.45, light: 1 });
      const step = Math.floor((t * CAD * 0.5 + wk.ph) * 2);
      if (step !== wk._l) { this.puffs.push({ t, x: x + 60, y: gy, vx: 40, s: 110 }); wk._l = step; }
    }
    dustPuffs(f, this.puffs, t, mix3(pal.land, pal.hor, 0.7));
    const G = canvas(W, H); grass(G.ctx, t, this.fg, pal, 1); f.save(); f.filter = 'blur(8px)'; f.drawImage(G, 0, 0); f.restore();
    motes(f, t, 45, 160, [0, 200, W, H], { color: pal.rim, alpha: 0.5, size: [1, 3] });
    paintPass(ctx, F, 4);
  },
};

// --------------------------------------------------------------------------------------------- Emmaus at dusk
W3.village = {
  async setup(dur) {
    const zv = 1250, vx = roadX(zv) + 38, vh = roadH(zv) + 4;
    this.zv = zv;
    const ro = [roadX(zv - 95) - 14, roadH(zv - 95) + 7, zv - 95], ta = [vx - 12, vh + 4, zv];
    this.pl = await plate(baseParams('dusk', sunDir(-0.9, 0.035), { uRo: ro, uTa: ta, uFl: 1.5, uHouses: 1, uVillage: [vx, zv, 46, vh], uWindowGlow: 1.0 }));
    this.grass = makeGrass(51, 420, -40, W + 40, 1010, 1100, [40, 130], PAL.dusk, { wk: 1.6 });
  },
  draw(ctx, t, dur) {
    const u = t / dur, pal = PAL.dusk, view = { zoom: lerp(1.0, 1.06, ease(u)), center: [0.5, 0.5], shift: [0.008 * u, 0], par: 1 };
    const F = plateFrame(this.pl, view), f = F.ctx;
    // window flicker and an evening star
    f.fillStyle = 'rgba(255,240,220,0.85)'; f.beginPath(); f.arc(420, 150, 1.8, 0, TAU); f.fill();
    const z = lerp(this.zv - 62, this.zv - 52, ease(clamp(u * 1.15)));
    for (let j = 2; j >= 0; j--) {
      const zz = z + j * 0.5, dx = [-0.5, 0.6, 0.1][j], p = onPlate([roadX(zz) + dx, roadH(zz), zz], this.pl.P, view); if (!p) continue;
      const ph = (t * CAD + j * 0.33) % 1;
      drawWalker(f, p.x, p.y, p.s * FIG_H, ph, { view: 'back', cloth: [CLOTH.undyed, CLOTH.indigo, CLOTH.stranger][j], rim: [255, 160, 100], rimA: 0.8, dark: 0.65, phase: ph, staff: j === 1 });
    }
    for (let k = 0; k < 14; k++) { const a = (t * 0.2 + k / 14) % 1; glow(f, 1180 + a * 90 + Math.sin(a * 6 + t) * 18, 520 - a * 300, 26 + a * 60, 'rgba(170,150,160,0.16)', 1 - a, 'source-over'); }
    grass(f, t, this.grass, pal, 0.8);
    paintPass(ctx, F, 4);
  },
};

// --------------------------------------------------------------------------------------------- empty road at dusk
W3.road_empty = {
  async setup(dur) {
    const z0 = 1180, ro = [roadX(z0) + 2, roadH(z0) + 2.2, z0], ta = [roadX(z0 + 80), roadH(z0 + 80) + 1.5, z0 + 80];
    this.pl = await plate(baseParams('dusk', sunDir(0.1, 0.03), { uRo: ro, uTa: ta, uFl: 1.4 }));
    this.grass = makeGrass(61, 700, -40, W + 40, 960, 1100, [50, 160], PAL.dusk, { wk: 1.6 });
  },
  draw(ctx, t, dur) {
    const pal = PAL.dusk, F = plateFrame(this.pl, { zoom: 1.02 + 0.02 * t / dur, center: [0.5, 0.5], shift: [0, 0], par: 1 }), f = F.ctx;
    grass(f, t, this.grass, pal, 2.2);
    motes(f, t, 62, 220, [0, 500, W, H], { color: mix3(pal.land, pal.hor, 0.7), alpha: 0.35, drift: 70, speed: 20 });
    paintPass(ctx, F, 4);
  },
};

// --------------------------------------------------------------------------------------------- backlit demonstration
W3.backlit = {
  async setup(dur) {
    const z0 = 1500, sun = sunDir(0.0, 0.09), ro = [roadX(z0), roadH(z0) + 1.3, z0];
    const ta = [ro[0] + sun[0] * 100, ro[1] + 7, ro[2] + sun[2] * 100];
    this.pl = await plate(baseParams('golden', sun, { uRo: ro, uTa: ta, uFl: 1.3, uTrees: 1 }));
    this.sunP = onPlate([ro[0] + sun[0] * 1000, ro[1] + sun[1] * 1000, ro[2] + sun[2] * 1000], this.pl.P, { zoom: 1 });
  },
  draw(ctx, t, dur) {
    const u = t / dur, pal = PAL.golden, view = { zoom: lerp(1.0, 1.05, ease(u)), center: [0.5, 0.5], shift: [0, 0], par: 0.5 };
    const F = plateFrame(this.pl, view), f = F.ctx;
    const sx = this.sunP ? this.sunP.x : W / 2, sy = this.sunP ? this.sunP.y : 420;
    rays(f, sx, sy, 1400, 26, t, [255, 220, 160], 0.08, 5);
    // seated figure, frontal silhouette: head-cloth, beard, shoulders, arms on the table
    const M = canvas(W, H), m = M.ctx, cx = sx, top = sy - 40;
    m.fillStyle = '#fff';
    m.beginPath(); m.ellipse(cx, top + 30, 70, 88, 0, 0, TAU); m.fill();
    m.beginPath(); m.moveTo(cx - 80, top - 10); m.quadraticCurveTo(cx - 110, top + 120, cx - 150, top + 190); m.lineTo(cx + 150, top + 190); m.quadraticCurveTo(cx + 110, top + 120, cx + 80, top - 10); m.fill();
    m.beginPath(); m.moveTo(cx - 60, top + 110); m.quadraticCurveTo(cx, top + 210, cx + 60, top + 110); m.fill();
    m.beginPath(); m.moveTo(cx - 70, top + 150); m.quadraticCurveTo(cx - 300, top + 170, cx - 360, top + 330); m.lineTo(cx - 420, H); m.lineTo(cx + 420, H); m.lineTo(cx + 360, top + 330); m.quadraticCurveTo(cx + 300, top + 170, cx + 70, top + 150); m.fill();
    const body = canvas(W, H), b = body.ctx; b.drawImage(M, 0, 0); b.globalCompositeOperation = 'source-in';
    b.fillStyle = linear(b, 0, top, 0, H, [[0, '#1d1410'], [1, '#0b0807']]); b.fillRect(0, 0, W, H);
    const R = canvas(W, H), r = R.ctx; r.drawImage(M, 0, 0); r.globalCompositeOperation = 'destination-out'; r.filter = 'blur(5px)'; r.drawImage(M, 0, 7); r.filter = 'none';
    r.globalCompositeOperation = 'source-in'; r.fillStyle = 'rgb(255,200,130)'; r.fillRect(0, 0, W, H);
    f.drawImage(body, 0, 0);
    f.save(); f.globalCompositeOperation = 'lighter'; f.drawImage(R, 0, 0); f.filter = 'blur(12px)'; f.drawImage(R, 0, 0); f.restore();
    f.fillStyle = linear(f, 0, 900, 0, H, [[0, '#3a2c20'], [1, '#100b08']]); f.fillRect(0, 900, W, 180);
    f.fillStyle = 'rgba(255,200,130,0.5)'; f.fillRect(0, 899, W, 2);
    glow(f, sx, sy, 300, 'rgba(255,220,170,0.25)');
    motes(f, t, 63, 120, [0, 0, W, H], { color: [255, 210, 150], alpha: 0.4 });
    paintPass(ctx, F, 3);
  },
};

// --------------------------------------------------------------------------------------------- interior (2D), painted
for (const [name, opts] of [['interior_lit', {}], ['interior_empty', { empty: true, broken: true }]]) {
  W3[name] = {
    async setup(dur) { this.s = Object.create(WORLD.interior); this.s.setup(dur, opts); },
    draw(ctx, t, dur) { const F = canvas(W, H); this.s.draw(F.ctx, t, dur); paintPass(ctx, F, 3, 0.08); },
  };
}

W3.lookdev = {
  async setup(dur) {},
  draw(ctx, t, dur) {
    const z0 = 0, ro = [roadX(z0) - 3, roadH(z0) + 7, z0], ta = [roadX(60), roadH(60) + 2, 60];
    const L = ['afternoon', 'golden', 'dusk'][Math.round(t)], el = [0.32, 0.14, 0.03][Math.round(t)];
    ctx.drawImage(ter(960, 540).render(baseParams(L, sunDir(0.45, el), { uRo: ro, uTa: ta, uFl: 1.6, uOct: 6 })), 0, 0, W, H);
  },
};
