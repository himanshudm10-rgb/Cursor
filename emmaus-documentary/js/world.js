// The Emmaus world: Judean hills, road, olive groves, village, interior. All procedural.
'use strict';

const PAL = {
  afternoon: { top: [104, 140, 182], mid: [214, 204, 186], hor: [252, 226, 176], sun: [255, 244, 214], land: [176, 146, 104], far: [190, 172, 150], shadow: [74, 58, 46], rim: [255, 226, 170] },
  golden: { top: [94, 108, 150], mid: [226, 178, 132], hor: [255, 200, 128], sun: [255, 232, 180], land: [160, 118, 76], far: [196, 150, 120], shadow: [60, 42, 34], rim: [255, 196, 120] },
  dusk: { top: [44, 44, 80], mid: [168, 96, 92], hor: [250, 150, 86], sun: [255, 196, 130], land: [98, 66, 54], far: [140, 92, 88], shadow: [36, 26, 28], rim: [255, 160, 96] },
};

function skyCanvas(w, h, pal, sx, sy, seed, opts = {}) {
  const c = canvas(w, h), x = c.ctx, n = makeNoise(seed);
  const hz = opts.horizon ?? h * 0.62;
  x.fillStyle = linear(x, 0, 0, 0, hz, [[0, rgb(pal.top)], [0.55, rgb(pal.mid)], [1, rgb(pal.hor)]]);
  x.fillRect(0, 0, w, h);
  // clouds: stretched fbm, lit from the sun side
  const id = x.getImageData(0, 0, w, h), d = id.data, cov = opts.cloud ?? 0.5;
  const step = 2;
  for (let y = 0; y < hz; y += step) for (let xx = 0; xx < w; xx += step) {
    const v = n.fbm(xx * 0.0016, y * 0.0065, 6);
    const den = smooth(cov, cov + 0.22, v) * smooth(0, hz * 0.25, y) * (1 - smooth(hz * 0.75, hz, y));
    if (den <= 0.001) continue;
    const dl = Math.hypot(xx - sx, (y - sy) * 1.6) / w;
    const lit = clamp(1.25 - dl * 2.2);
    const cc = mix3(pal.mid.map(v => v * 0.82), mix3(pal.hor, pal.sun, 0.5), lit);
    for (let yy = y; yy < Math.min(y + step, h); yy++) for (let x2 = xx; x2 < Math.min(xx + step, w); x2++) {
      const i = (yy * w + x2) * 4, a = den * 0.75;
      d[i] = lerp(d[i], cc[0], a); d[i + 1] = lerp(d[i + 1], cc[1], a); d[i + 2] = lerp(d[i + 2], cc[2], a);
    }
  }
  x.putImageData(id, 0, 0);
  x.filter = 'blur(1.2px)'; x.drawImage(c, 0, 0); x.filter = 'none';
  glow(x, sx, sy, h * 0.9, rgb(pal.hor, 0.55));
  glow(x, sx, sy, h * 0.28, rgb(pal.sun, 0.65));
  glow(x, sx, sy, h * 0.06, rgb([255, 252, 240], 1));
  x.fillStyle = rgb([255, 252, 242]); x.beginPath(); x.arc(sx, sy, h * 0.022, 0, TAU); x.fill();
  return c;
}

// one ridge layer: textured, hazed by distance, optional terraces and groves
function ridgeLayer(w, h, o) {
  const c = canvas(w, h), x = c.ctx, n = makeNoise(o.seed), r = RNG(o.seed + 1);
  const pts = [];
  for (let i = 0; i <= w; i += 4) pts.push([i, o.base - o.amp * n.f1(i * o.freq + o.seed * 3, 6) - (o.tilt || 0) * (i / w)]);
  const path = new Path2D(); path.moveTo(0, h); pts.forEach(p => path.lineTo(p[0], p[1])); path.lineTo(w, h); path.closePath();
  x.fillStyle = linear(x, 0, o.base - o.amp, 0, h, [[0, rgb(o.top)], [Math.min(1, (o.amp * 1.4) / (h - o.base + o.amp)), rgb(o.bottom)], [1, rgb(o.bottom.map(v => v * 0.85))]]);
  x.fill(path);
  x.save(); x.clip(path);
  // ground texture
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = o.tex ?? 0.35;
  x.fillStyle = x.createPattern(noiseTex(256, 256, o.seed + 5, 0.03, 5, 1.3), 'repeat'); x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  // terraces: soft contour lines following the ridge
  if (o.terraces) {
    for (let k = 1; k < o.terraces; k++) {
      x.strokeStyle = rgb(o.bottom.map(v => v * 0.7), 0.35 * o.near); x.lineWidth = 1 + o.near * 1.5;
      x.beginPath();
      pts.forEach((p, i) => { const yy = p[1] + k * o.terGap + 6 * n(i * 0.01, k); i ? x.lineTo(p[0], yy) : x.moveTo(p[0], yy); });
      x.stroke();
      x.strokeStyle = rgb(o.top.map(v => Math.min(255, v * 1.12)), 0.25 * o.near); x.lineWidth = 1;
      x.beginPath();
      pts.forEach((p, i) => { const yy = p[1] + k * o.terGap + 6 * n(i * 0.01, k) - 2; i ? x.lineTo(p[0], yy) : x.moveTo(p[0], yy); });
      x.stroke();
    }
  }
  // groves of small olive trees with sunlit tops
  if (o.trees) {
    for (let i = 0; i < o.trees; i++) {
      const px = r.range(0, w), j = Math.min(pts.length - 1, Math.floor(px / 4));
      const yy = pts[j][1] + r.range(4, o.treeDepth || 60) * (0.4 + r() * 0.6);
      if (n(px * 0.004, 9.3) < 0.42) continue;
      const s = o.treeSize * r.range(0.7, 1.3);
      x.fillStyle = rgb(o.treeCol, 0.95); x.beginPath(); x.ellipse(px, yy, s * 1.2, s * 0.8, 0, 0, TAU); x.fill();
      x.fillStyle = rgb(o.treeLit, 0.55); x.beginPath(); x.ellipse(px + s * 0.35 * (o.lightDir || 1), yy - s * 0.3, s * 0.6, s * 0.4, 0, 0, TAU); x.fill();
      x.fillStyle = rgb(o.treeCol.map(v => v * 0.6), 0.35); x.beginPath(); x.ellipse(px - s * 0.6 * (o.lightDir || 1), yy + s * 0.7, s * 1.3, s * 0.25, 0, 0, TAU); x.fill();
    }
  }
  x.restore();
  // atmospheric haze
  if (o.haze) { x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = rgb(o.haze[0], o.haze[1]); x.fillRect(0, 0, w, h); x.restore(); }
  c.ridge = pts; return c;
}

// detailed olive tree: twisted trunk, branch fans, leaf clusters lit from one side
function oliveTree(seed, size, pal, light = 1) {
  const r = RNG(seed), S = size, c = canvas(S * 2.2, S * 2.0), x = c.ctx;
  const bx = S * 1.1, by = S * 1.95;
  const bark = [78, 66, 52], leaf = [104, 116, 82], leafHi = mix3([170, 176, 128], pal.rim, 0.35), leafDk = [52, 60, 46];
  // trunk: several twisting strands
  for (let k = 0; k < 4; k++) {
    x.strokeStyle = rgb(bark.map(v => v * r.range(0.75, 1.1))); x.lineCap = 'round';
    x.lineWidth = S * r.range(0.06, 0.11);
    x.beginPath(); x.moveTo(bx + r.range(-S * 0.08, S * 0.08), by);
    x.bezierCurveTo(bx + r.range(-S * 0.2, S * 0.2), by - S * 0.35, bx + r.range(-S * 0.25, S * 0.25), by - S * 0.6, bx + r.range(-S * 0.35, S * 0.35), by - S * 0.85);
    x.stroke();
  }
  // branches
  const tips = [];
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + r.range(-1.2, 1.2), L = S * r.range(0.45, 0.85);
    const sx = bx + r.range(-S * 0.15, S * 0.15), sy = by - S * r.range(0.6, 0.85);
    const ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L * 0.8;
    x.strokeStyle = rgb(bark.map(v => v * 0.85)); x.lineWidth = S * 0.025;
    x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo((sx + ex) / 2 + r.range(-S * 0.1, S * 0.1), (sy + ey) / 2, ex, ey); x.stroke();
    tips.push([ex, ey]);
  }
  // canopy: clusters of leaf ellipses, dark underside, silver-lit top on the light side
  for (let pass = 0; pass < 3; pass++) {
    for (const [tx, ty] of tips) {
      const n = pass === 2 ? 40 : 70;
      for (let i = 0; i < n; i++) {
        const ang = r() * TAU, rad = S * 0.32 * Math.sqrt(r());
        const px = tx + Math.cos(ang) * rad * 1.3, py = ty + Math.sin(ang) * rad * 0.8;
        const litK = clamp(0.5 + ((px - bx) / S) * 0.6 * light - ((py - by + S) / S) * 0.5);
        let col = pass === 0 ? leafDk : mix3(leaf, leafHi, litK * (pass === 2 ? 1 : 0.5));
        x.fillStyle = rgb(col, pass === 0 ? 0.9 : 0.75);
        x.beginPath(); x.ellipse(px, py, S * r.range(0.018, 0.04), S * r.range(0.008, 0.016), r() * TAU, 0, TAU); x.fill();
      }
    }
  }
  c.base = [bx, by]; return c;
}

function rockCanvas(seed, size, pal, light = 1) {
  const r = RNG(seed), c = canvas(size * 2.4, size * 1.6), x = c.ctx;
  const cx = size * 1.2, cy = size * 1.35, pts = [];
  const N = 11;
  for (let i = 0; i < N; i++) {
    const a = Math.PI + (i / (N - 1)) * Math.PI, rr = size * r.range(0.7, 1.1);
    pts.push([cx + Math.cos(a) * rr * 1.1, cy + Math.sin(a) * rr * 0.75]);
  }
  const p = new Path2D(); p.moveTo(pts[0][0], cy); pts.forEach(q => p.lineTo(q[0], q[1])); p.lineTo(pts[N - 1][0], cy); p.closePath();
  const base = [150, 134, 112];
  x.fillStyle = linear(x, cx - size * light, cy - size, cx + size * light, cy, [[0, rgb(mix3(base, pal.rim, 0.35))], [1, rgb(base.map(v => v * 0.45))]]);
  x.fill(p); x.save(); x.clip(p);
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.6; x.fillStyle = x.createPattern(noiseTex(128, 128, seed, 0.08, 4, 1.6), 'repeat'); x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.5; x.strokeStyle = rgb(base.map(v => v * 0.35)); x.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) { x.beginPath(); let px = cx + r.range(-size, size) * 0.6, py = cy - r.range(0, size * 0.6); x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += r.range(-size * 0.15, size * 0.15); py += r.range(0, size * 0.15); x.lineTo(px, py); } x.stroke(); }
  x.restore();
  x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(cx - size * 0.3 * light, cy + 2, size * 1.2, size * 0.12, 0, 0, TAU); x.fill();
  c.base = [cx, cy]; return c;
}

// wind-swept dry grass, drawn live
function grass(ctx, t, list, pal, wind = 1) {
  ctx.save(); ctx.lineCap = 'round';
  for (const g of list) {
    const sway = Math.sin(t * 1.3 + g.x * 0.013) * 0.25 * wind + Math.sin(t * 2.9 + g.x * 0.05) * 0.06 * wind;
    ctx.strokeStyle = rgb(mix3(g.col, pal.rim, g.lit), g.a);
    ctx.lineWidth = g.w;
    ctx.beginPath(); ctx.moveTo(g.x, g.y);
    const tx = g.x + Math.sin(g.lean + sway) * g.h, ty = g.y - Math.cos(g.lean + sway) * g.h;
    ctx.quadraticCurveTo(g.x + Math.sin(g.lean + sway * 0.4) * g.h * 0.5, g.y - g.h * 0.55, tx, ty);
    ctx.stroke();
  }
  ctx.restore();
}
function makeGrass(seed, n, x0, x1, y0, y1, hRange, pal, opts = {}) {
  const r = RNG(seed), out = [];
  for (let i = 0; i < n; i++) {
    const y = r.range(y0, y1), k = (y - y0) / Math.max(1, y1 - y0);
    out.push({ x: r.range(x0, x1), y, h: r.range(hRange[0], hRange[1]) * (0.6 + 0.6 * k), lean: r.range(-0.4, 0.4), w: r.range(0.8, 2.2) * (opts.wk || 1),
      col: r.pick([[150, 128, 82], [176, 150, 98], [120, 102, 66], [196, 170, 112]]), lit: r.range(0.1, 0.7), a: r.range(0.55, 0.95) });
  }
  return out.sort((a, b) => a.y - b.y);
}

function birds(ctx, t, seed, n, x0, y0, vx, col, scale = 1) {
  const r = RNG(seed);
  ctx.save(); ctx.strokeStyle = rgb(col, 0.8); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ox = r.range(-120, 120) * scale, oy = r.range(-40, 40) * scale, ph = r() * TAU, s = r.range(5, 9) * scale;
    const x = x0 + vx * t + ox + 6 * Math.sin(t * 0.7 + ph), y = y0 + oy + 4 * Math.sin(t * 0.9 + ph);
    const f = Math.sin(t * 9 + ph);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath(); ctx.moveTo(x - s, y - f * s * 0.6); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s, y - f * s * 0.6); ctx.stroke();
  }
  ctx.restore();
}

function dustPuffs(ctx, list, t, col) {
  ctx.save(); ctx.globalCompositeOperation = 'source-over';
  for (const p of list) {
    const age = t - p.t; if (age < 0 || age > 1.6) continue;
    const k = age / 1.6, rad = p.s * (0.4 + k * 1.6);
    ctx.fillStyle = radial(ctx, p.x + p.vx * age, p.y - rad * 0.3, rad, [[0, rgb(col, 0.28 * (1 - k))], [1, rgb(col, 0)]]);
    ctx.fillRect(p.x + p.vx * age - rad, p.y - rad * 1.3, rad * 2, rad * 2);
  }
  ctx.restore();
}

function stoneWall(ctx, x0, x1, yFn, hFn, seed, pal, light = 1) {
  const r = RNG(seed);
  for (let x = x0; x < x1;) {
    const y = yFn(x), hh = hFn(x), sw = hh * r.range(0.7, 1.3);
    for (let row = 0; row < 3; row++) {
      const by = y - row * hh * 0.34, bw = sw * r.range(0.6, 1.0), bh = hh * r.range(0.3, 0.38);
      const base = [140, 124, 100].map(v => v * r.range(0.8, 1.1));
      ctx.fillStyle = linear(ctx, x, by - bh, x + bw, by, [[0, rgb(mix3(base, pal.rim, 0.3 * light))], [1, rgb(base.map(v => v * 0.55))]]);
      ctx.beginPath(); ctx.ellipse(x + bw / 2 + (row % 2) * bw * 0.4, by - bh / 2, bw / 2, bh / 2, r.range(-0.1, 0.1), 0, TAU); ctx.fill();
    }
    x += sw * 0.85;
  }
}

// ---------------------------------------------------------------------------- scenes
const WORLD = {};

// 1. Wide establishing: two walkers heading up the road into the hills
WORLD.road_wide = {
  setup(dur) {
    const p = this.pal = PAL.afternoon, w = 2300, h = 1300;
    this.sky = skyCanvas(w, h, p, w * 0.64, h * 0.30, 11, { horizon: h * 0.56, cloud: 0.5 });
    const hz = [p.far, p.hor];
    this.l1 = ridgeLayer(w, h, { seed: 21, base: h * 0.50, amp: 120, freq: 0.0016, top: mix3(p.far, p.hor, 0.5), bottom: mix3(p.far, p.hor, 0.3), haze: [p.hor, 0.35], near: 0.2, trees: 160, treeSize: 3, treeCol: [150, 140, 120], treeLit: p.rim, tex: 0.15 });
    this.l2 = ridgeLayer(w, h, { seed: 22, base: h * 0.58, amp: 110, freq: 0.002, top: mix3(p.land, p.hor, 0.35), bottom: p.land, haze: [p.hor, 0.18], near: 0.5, terraces: 6, terGap: 16, trees: 420, treeSize: 5, treeCol: [96, 100, 74], treeLit: p.rim, tex: 0.3 });
    this.l3 = ridgeLayer(w, h, { seed: 23, base: h * 0.70, amp: 70, freq: 0.0024, top: mix3(p.land, p.rim, 0.2), bottom: p.land.map(v => v * 0.85), near: 0.9, terraces: 4, terGap: 26, trees: 200, treeSize: 9, treeDepth: 120, treeCol: [86, 92, 64], treeLit: p.rim, tex: 0.4 });
    // road: from bottom centre winding up to the ridge
    const g = this.ground = canvas(w, h), x = g.ctx;
    const road = new Path2D(), N = 80, center = [], half = [];
    for (let i = 0; i <= N; i++) {
      const k = i / N, y = lerp(h * 1.02, h * 0.66, Math.pow(k, 0.7));
      const cx = w * 0.5 + Math.sin(k * 4.2) * w * 0.12 * (1 - k) + k * w * 0.08;
      center.push([cx, y]); half.push(lerp(260, 8, Math.pow(k, 0.6)));
    }
    road.moveTo(center[0][0] - half[0], center[0][1]);
    center.forEach((c, i) => road.lineTo(c[0] - half[i], c[1]));
    for (let i = N; i >= 0; i--) road.lineTo(center[i][0] + half[i], center[i][1]);
    road.closePath();
    x.fillStyle = linear(x, 0, h * 0.66, 0, h, [[0, rgb(mix3(p.land, p.hor, 0.5))], [1, rgb(mix3(p.land, [210, 190, 150], 0.5))]]);
    x.fill(road); x.save(); x.clip(road);
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.45; x.fillStyle = x.createPattern(noiseTex(256, 256, 31, 0.05, 5, 1.4), 'repeat'); x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    // ruts and pebbles
    for (const off of [-0.4, 0.4]) { x.strokeStyle = rgb(p.shadow, 0.18); x.lineWidth = 3; x.beginPath(); center.forEach((c, i) => { const xx = c[0] + off * half[i]; i ? x.lineTo(xx, c[1]) : x.moveTo(xx, c[1]); }); x.stroke(); }
    const r = RNG(32);
    for (let i = 0; i < 900; i++) { const k = Math.pow(r(), 1.8), j = Math.floor(k * N), c = center[j]; const px = c[0] + r.range(-1, 1) * half[j], s = lerp(4, 0.5, k); x.fillStyle = rgb([120 + r() * 60, 104 + r() * 50, 80 + r() * 40], 0.8); x.beginPath(); x.ellipse(px, c[1] + r.range(-6, 6), s, s * 0.6, 0, 0, TAU); x.fill(); }
    x.restore();
    this.center = center; this.half = half;
    this.trees = [];
    const r2 = RNG(40);
    for (let i = 0; i < 9; i++) {
      const side = i % 2 ? 1 : -1, k = r2.range(0.05, 0.55), j = Math.floor(k * N);
      const c = center[j], s = lerp(220, 50, Math.pow(k, 0.6));
      this.trees.push({ img: oliveTree(100 + i, s, p, 1), x: c[0] + side * (half[j] + r2.range(60, 400) * (1 - k)), y: c[1], k });
    }
    this.trees.sort((a, b) => a.y - b.y);
    this.rocks = [];
    for (let i = 0; i < 14; i++) { const k = r2.range(0.0, 0.6), j = Math.floor(k * N), c = center[j], side = r2() < 0.5 ? -1 : 1; this.rocks.push({ img: rockCanvas(200 + i, lerp(50, 10, k), p), x: c[0] + side * (half[j] + r2.range(10, 120)), y: c[1] + 4 }); }
    this.grass = makeGrass(5, 520, -50, w + 50, h * 0.86, h * 1.02, [30, 90], p);
    this.w = w; this.h = h;
  },
  draw(ctx, t, dur) {
    const p = this.pal, u = t / dur;
    const z = lerp(1.0, 1.07, ease(u)), camY = lerp(0, -40, ease(u));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-this.w / 2, -this.h / 2 - camY);
    const par = (img, k) => ctx.drawImage(img, (1 - k) * 30 * u, 0);
    par(this.sky, 0.1);
    birds(ctx, t, 8, 7, 1300, 330, -26, [60, 50, 50]);
    par(this.l1, 0.3); par(this.l2, 0.55); par(this.l3, 0.8); ctx.drawImage(this.ground, 0, 0);
    for (const rk of this.rocks) ctx.drawImage(rk.img, rk.x - rk.img.base[0], rk.y - rk.img.base[1]);
    // walkers: back view, receding along the road
    const s0 = lerp(0.20, 0.27, u);
    const walk = (k, off, ph, cl, staff) => {
      const j = Math.min(this.center.length - 2, Math.floor(k * (this.center.length - 1))), c = this.center[j];
      const sc = lerp(220, 40, Math.pow(k, 0.6));
      // long shadow toward camera
      ctx.fillStyle = rgb(p.shadow, 0.28); ctx.beginPath(); ctx.ellipse(c[0] + off * this.half[j] - sc * 0.08, c[1] + sc * 0.22, sc * 0.09, sc * 0.26, 0.15, 0, TAU); ctx.fill();
      drawWalker(ctx, c[0] + off * this.half[j], c[1], sc, (t * 0.85 + ph) % 1, { view: 'back', cloth: cl, rim: p.rim, rimA: 0.9, dark: 0.5, staff, phase: (t * 0.85 + ph) % 1, haze: [p.hor, 0.12 + k * 0.3] });
    };
    const trees = this.trees;
    trees.filter(tr => tr.k > s0).forEach(tr => this._tree(ctx, tr, t));
    walk(s0 + 0.012, 0.22, 0.4, CLOTH.indigo, true);
    walk(s0, -0.2, 0.0, CLOTH.undyed, false);
    trees.filter(tr => tr.k <= s0).forEach(tr => this._tree(ctx, tr, t));
    grass(ctx, t, this.grass, p, 1);
    motes(ctx, t, 9, 90, [0, this.h * 0.3, this.w, this.h], { color: p.rim, alpha: 0.35, size: [0.8, 2.2] });
    ctx.restore();
  },
  _tree(ctx, tr, t) {
    ctx.save(); ctx.translate(tr.x, tr.y);
    ctx.transform(1, 0, Math.sin(t * 0.8 + tr.x) * 0.012, 1, 0, 0);
    ctx.drawImage(tr.img, -tr.img.base[0], -tr.img.base[1]); ctx.restore();
  },
};

// 2. Side tracking shot: figures in profile against the sky, layers scrolling at their own depth
function trackScene(cfg) {
  return {
    setup(dur) {
      const p = this.pal = PAL[cfg.pal], w = 6200, h = 1080;
      this.sky = skyCanvas(2600, h, p, 1700, cfg.sunY ?? 380, cfg.seed || 12, { horizon: 760, cloud: 0.48 });
      this.l1 = ridgeLayer(w, h, { seed: 51, base: 700, amp: 140, freq: 0.0011, top: mix3(p.far, p.hor, 0.45), bottom: mix3(p.far, p.hor, 0.25), haze: [p.hor, 0.4], near: 0.2, trees: 500, treeSize: 3, treeCol: p.far.map(v => v * 0.7), treeLit: p.rim, tex: 0.15 });
      this.l2 = ridgeLayer(w, h, { seed: 52, base: 790, amp: 90, freq: 0.0016, top: mix3(p.land, p.hor, 0.3), bottom: p.land, haze: [p.hor, 0.15], near: 0.6, terraces: 5, terGap: 14, trees: 900, treeSize: 6, treeCol: [92, 94, 70].map(v => v * (cfg.pal === 'dusk' ? 0.6 : 1)), treeLit: p.rim, tex: 0.3 });
      if (cfg.city) this.city = cityCanvas(p);
      this.trees = []; const r = RNG(60);
      for (let i = 0; i < 26; i++) this.trees.push({ img: oliveTree(300 + i % 8, r.range(170, 260), p, -1), x: i * 340 + r.range(-100, 100), y: 905 + r.range(-10, 10) });
      this.rocks = []; for (let i = 0; i < 40; i++) this.rocks.push({ img: rockCanvas(400 + i % 10, r.range(14, 46), p, -1), x: i * 210 + r.range(-80, 80), y: 1000 + r.range(0, 30) });
      this.fg = makeGrass(7, 900, 0, w, 1050, 1095, [60, 180], p, { wk: 1.8 });
      this.mid = makeGrass(8, 1400, 0, w, 960, 1015, [14, 40], p);
      this.ground = canvas(w, 220); const g = this.ground.ctx;
      g.fillStyle = linear(g, 0, 0, 0, 220, [[0, rgb(mix3(p.land, p.hor, 0.35))], [1, rgb(p.land.map(v => v * 0.7))]]); g.fillRect(0, 0, w, 220);
      g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.5; g.fillStyle = g.createPattern(noiseTex(256, 128, 61, 0.05, 5, 1.4), 'repeat'); g.fillRect(0, 0, w, 220);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      for (let i = 0; i < 2600; i++) { const px = r.range(0, w), py = r.range(30, 220); g.fillStyle = rgb([110 + r() * 70, 96 + r() * 60, 72 + r() * 50], 0.7); g.beginPath(); g.ellipse(px, py, r.range(1, 4), r.range(0.6, 2), 0, 0, TAU); g.fill(); }
      this.w = w;
      this.puffs = [];
    },
    draw(ctx, t, dur) {
      const p = this.pal, h = cfg.h || 520;
      const cadence = 0.82, groundSpeed = 0.78 * h * cadence;   // px/s, matches the stride so feet plant
      const cam = groundSpeed * t;
      ctx.drawImage(this.sky, -40 - cam * 0.01, 0);
      if (cfg.birds) birds(ctx, t, 4, 6, 300, 260, 30, p.shadow.map(v => v * 1.4), 1.2);
      ctx.drawImage(this.l1, -cam * 0.05, 0);
      if (this.city) ctx.drawImage(this.city, 980 - cam * 0.05, 520);
      ctx.drawImage(this.l2, -cam * 0.14, 0);
      // grove trees on the far side of the road
      ctx.save(); ctx.globalAlpha = 1;
      for (const tr of this.trees) { const x = tr.x - cam * 0.45; if (x < -400 || x > W + 400) continue; ctx.save(); ctx.translate(x, tr.y - 40); ctx.scale(0.62, 0.62); ctx.transform(1, 0, Math.sin(t * 0.8 + tr.x) * 0.01, 1, 0, 0); ctx.drawImage(tr.img, -tr.img.base[0], -tr.img.base[1]); ctx.restore(); }
      ctx.restore();
      ctx.save(); ctx.translate(-((cam * 0.7) % 1), 0); ctx.drawImage(this.ground, -cam * 0.7, 900); ctx.restore();
      ctx.save(); ctx.translate(-cam * 0.7, 0); grass(ctx, t, this.mid.filter(g => g.x - cam * 0.7 > -50 && g.x - cam * 0.7 < W + 50), p, 0.8); ctx.restore();
      for (const rk of this.rocks) { const x = rk.x - cam * 0.85; if (x < -200 || x > W + 200) continue; ctx.drawImage(rk.img, x - rk.img.base[0], rk.y - rk.img.base[1] + 20); }
      // walkers (ground plane at y = 1010, all moving with the camera)
      const walkers = cfg.walkers(t, dur);
      const groundY = 1010;
      walkers.sort((a, b) => a.depth - b.depth);
      for (const wk of walkers) {
        const sc = h * wk.scale, ph = (t * cadence + wk.ph) % 1;
        const x = wk.x, y = groundY - (1 - wk.scale) * 60;
        ctx.fillStyle = rgb(p.shadow, 0.25); ctx.beginPath(); ctx.ellipse(x - sc * 0.25, y, sc * 0.32, sc * 0.03, 0, 0, TAU); ctx.fill();
        drawWalker(ctx, x, y, sc, ph, { view: 'side', dir: 1, cloth: wk.cloth, rim: p.rim, rimA: 1, dark: wk.dark ?? 0.62, light: 1, staff: wk.staff, bow: wk.bow, gesture: wk.gesture ? wk.gesture(t) : 0, stride: wk.stride ?? 1, haze: [p.hor, 0.05 + (1 - wk.scale) * 0.4] });
        // dust at each foot strike
        const step = Math.floor((t * cadence + wk.ph) * 2);
        if (step !== wk._last) { this.puffs.push({ t, x: x + sc * 0.08, y, vx: -groundSpeed * 0.15, s: sc * 0.07 }); wk._last = step; }
      }
      dustPuffs(ctx, this.puffs, t, mix3(p.land, p.hor, 0.6));
      ctx.save(); ctx.translate(-cam * 1.25, 0);
      ctx.filter = 'blur(5px)';
      grass(ctx, t, this.fg.filter(g => g.x - cam * 1.25 > -80 && g.x - cam * 1.25 < W + 80), { rim: p.rim }, 1.2);
      ctx.filter = 'none'; ctx.restore();
      motes(ctx, t, 13, 120, [0, 200, W, H], { color: p.rim, alpha: 0.4, drift: -20 });
      if (cfg.flare) { glow(ctx, 1700 - cam * 0.01 - 40, cfg.sunY ?? 380, 700, rgb(p.hor, 0.18)); }
    },
  };
}

WORLD.track_two = trackScene({
  pal: 'afternoon', sunY: 330, birds: true, flare: true,
  walkers: (t) => [
    { x: 760, scale: 1.0, depth: 1, ph: 0.0, cloth: CLOTH.undyed, bow: 0.6, staff: false },
    { x: 1040, scale: 0.9, depth: 0, ph: 0.37, cloth: CLOTH.indigo, bow: 0.45, staff: true },
  ],
});
WORLD.track_three = trackScene({
  pal: 'golden', sunY: 420, flare: true, seed: 14,
  walkers: (t, dur) => {
    const u = t / dur, join = ease(clamp(t / (dur * 0.45)));
    return [
      { x: 640, scale: 1.0, depth: 2, ph: 0.0, cloth: CLOTH.undyed, bow: 0.3, gesture: tt => Math.max(0, Math.sin((tt - 3) * 0.9)) * clamp((tt - 3) / 1) },
      { x: 960, scale: 0.92, depth: 1, ph: 0.37, cloth: CLOTH.indigo, bow: 0.2, staff: true },
      { x: lerp(-260, 1260, join), scale: 0.84, depth: 0, ph: 0.62, cloth: CLOTH.stranger, bow: 0.0, stride: lerp(1.25, 1, join), dark: 0.66 },
    ];
  },
});
WORLD.track_city = trackScene({
  pal: 'golden', sunY: 470, city: true, seed: 15, h: 330,
  walkers: () => [
    { x: 520, scale: 1.0, depth: 2, ph: 0.0, cloth: CLOTH.undyed, bow: 0.3 },
    { x: 690, scale: 0.94, depth: 1, ph: 0.37, cloth: CLOTH.indigo, staff: true },
    { x: 860, scale: 0.9, depth: 0, ph: 0.62, cloth: CLOTH.stranger, dark: 0.66, gesture: tt => 0.5 + 0.4 * Math.sin(tt * 0.8) },
  ],
});

// distant walled city on a hill (Jerusalem behind them), hazy silhouette
function cityCanvas(p) {
  const c = canvas(900, 260), x = c.ctx, r = RNG(91);
  const col = mix3(p.far, p.hor, 0.35), dk = mix3(p.far, p.shadow, 0.2);
  x.fillStyle = rgb(col); x.beginPath(); x.moveTo(0, 260); x.quadraticCurveTo(450, 120, 900, 260); x.fill();
  x.fillStyle = rgb(dk);
  x.fillRect(120, 150, 660, 60);
  for (let i = 0; i < 12; i++) x.fillRect(120 + i * 58, 138, 26, 20);
  for (const tx of [140, 330, 520, 740]) x.fillRect(tx, 112, 36, 98);
  x.fillRect(360, 92, 220, 70);       // great platform and sanctuary
  x.fillRect(430, 54, 80, 50);
  for (let i = 0; i < 40; i++) x.fillRect(r.range(150, 760), r.range(120, 160), r.range(10, 30), r.range(10, 40));
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = rgb(p.hor, 0.35); x.fillRect(0, 0, 900, 260);
  return c;
}

// 3. Time-lapse: the sun falls across the sky as three small figures cross a ridge
WORLD.timelapse = {
  setup(dur) {
    this.frames = ['afternoon', 'golden', 'dusk'].map((k, i) => skyCanvas(2000, 1080, PAL[k], 1200 - i * 220, 260 + i * 200, 70 + i, { horizon: 700, cloud: 0.46 }));
    this.ridges = ['afternoon', 'golden', 'dusk'].map(k => { const p = PAL[k]; return [
      ridgeLayer(2000, 1080, { seed: 71, base: 700, amp: 130, freq: 0.0013, top: mix3(p.far, p.hor, 0.4), bottom: mix3(p.far, p.hor, 0.2), haze: [p.hor, 0.35], near: 0.2, trees: 200, treeSize: 3, treeCol: p.far.map(v => v * 0.7), treeLit: p.rim }),
      ridgeLayer(2000, 1080, { seed: 72, base: 860, amp: 120, freq: 0.0018, top: p.land.map(v => v * 0.8), bottom: p.land.map(v => v * 0.55), near: 0.8, terraces: 4, terGap: 30, trees: 120, treeSize: 10, treeCol: [70, 72, 52], treeLit: p.rim, lightDir: -1 }),
    ]; });
  },
  draw(ctx, t, dur) {
    const u = t / dur, k = u * 2, i = Math.min(1, Math.floor(k)), f = ease(k - i);
    const blend = (arr) => { ctx.drawImage(arr[i], 0, 0); ctx.globalAlpha = f; ctx.drawImage(arr[i + 1], 0, 0); ctx.globalAlpha = 1; };
    ctx.save(); ctx.translate(-u * 40, 0);
    blend(this.frames);
    // fast clouds (time-lapse streaks)
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.35; ctx.drawImage(this.frames[0], -t * 120 % 2000, 0); ctx.restore();
    blend(this.ridges.map(r => r[0]));
    blend(this.ridges.map(r => r[1]));
    ctx.restore();
    const pal = k < 1 ? PAL.afternoon : PAL.golden;
    for (let j = 0; j < 3; j++) {
      const x = lerp(1500, 600, u) - j * 34, y = 830 + Math.sin(x * 0.004) * 10 - 0;
      drawWalker(ctx, x, y, 66, (t * 0.9 + j * 0.3) % 1, { view: 'side', dir: -1, cloth: [CLOTH.stranger, CLOTH.indigo, CLOTH.undyed][j], rim: pal.rim, rimA: 1, dark: 0.75, light: -1 });
    }
  },
};

// 4. Feet on the dusty road, low and close: sandals, hems, dust
WORLD.feet = {
  setup(dur) {
    const p = this.pal = PAL.golden;
    this.sky = skyCanvas(2000, 1080, p, 1500, 520, 81, { horizon: 640, cloud: 0.5 });
    this.far = ridgeLayer(4000, 1080, { seed: 82, base: 640, amp: 60, freq: 0.002, top: mix3(p.far, p.hor, 0.4), bottom: mix3(p.far, p.hor, 0.2), haze: [p.hor, 0.4], near: 0.2 });
    this.ground = canvas(5000, 460); const g = this.ground.ctx, r = RNG(83);
    g.fillStyle = linear(g, 0, 0, 0, 460, [[0, rgb(mix3(p.land, p.hor, 0.5))], [1, rgb(p.land.map(v => v * 0.6))]]); g.fillRect(0, 0, 5000, 460);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55; g.fillStyle = g.createPattern(noiseTex(256, 256, 84, 0.04, 5, 1.5), 'repeat'); g.fillRect(0, 0, 5000, 460);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    for (let i = 0; i < 5000; i++) { const py = Math.pow(r(), 0.7) * 460, s = lerp(0.6, 7, py / 460); g.fillStyle = rgb([100 + r() * 90, 86 + r() * 70, 64 + r() * 50], 0.85); g.beginPath(); g.ellipse(r() * 5000, py, s, s * 0.55, 0, 0, TAU); g.fill(); g.fillStyle = rgb(p.rim, 0.3); g.beginPath(); g.ellipse(r() * 5000, py, s * 0.5, s * 0.25, 0, 0, TAU); g.fill(); }
    this.puffs = []; this.grass = makeGrass(9, 300, 0, 5000, 1060, 1090, [50, 140], p, { wk: 2 });
  },
  draw(ctx, t, dur) {
    const p = this.pal, h = 2300, cadence = 0.8, gs = 0.78 * h * cadence * 0.35; // camera drifts slower than walkers
    ctx.drawImage(this.sky, -t * 4, 0);
    ctx.drawImage(this.far, -t * 10, 0);
    ctx.drawImage(this.ground, -t * gs * 0.5 % 1000, 620);
    const gy = 960;
    const ws = [{ x0: -300, ph: 0, cl: CLOTH.undyed }, { x0: -1100, ph: 0.35, cl: CLOTH.indigo }, { x0: -1900, ph: 0.62, cl: CLOTH.stranger }];
    for (const wk of ws) {
      const x = wk.x0 + t * (0.78 * h * cadence - gs * 0.5) * 0.55, ph = (t * cadence * 0.55 + wk.ph) % 1;
      if (x < -900 || x > W + 900) continue;
      ctx.fillStyle = rgb(p.shadow, 0.3); ctx.beginPath(); ctx.ellipse(x - 300, gy + 10, 420, 30, 0, 0, TAU); ctx.fill();
      drawWalker(ctx, x, gy, h, ph, { view: 'side', cloth: wk.cl, rim: p.rim, rimA: 1, dark: 0.5, light: 1 });
      const step = Math.floor((t * cadence * 0.55 + wk.ph) * 2);
      if (step !== wk._l) { this.puffs.push({ t, x: x + 60, y: gy, vx: 30, s: 90 }); wk._l = step; }
    }
    dustPuffs(ctx, this.puffs, t, mix3(p.land, p.hor, 0.7));
    ctx.filter = 'blur(6px)'; ctx.save(); ctx.translate(-t * gs, 0); grass(ctx, t, this.grass, p, 1); ctx.restore(); ctx.filter = 'none';
    motes(ctx, t, 85, 160, [0, 300, W, H], { color: p.rim, alpha: 0.5, size: [1, 3] });
    glow(ctx, 1500, 520, 900, rgb(p.hor, 0.15));
  },
};

// 5. Emmaus at dusk: stone houses, lamps, smoke, the three arriving at a doorway
WORLD.village = {
  setup(dur) {
    const p = this.pal = PAL.dusk, r = RNG(95);
    this.sky = skyCanvas(2100, 1180, p, 600, 640, 96, { horizon: 700, cloud: 0.5 });
    this.l1 = ridgeLayer(2100, 1180, { seed: 97, base: 700, amp: 90, freq: 0.0016, top: mix3(p.far, p.hor, 0.3), bottom: p.far.map(v => v * 0.8), haze: [p.hor, 0.3], near: 0.3, trees: 150, treeSize: 4, treeCol: p.far.map(v => v * 0.6), treeLit: p.rim });
    // village: houses climbing a slope
    const v = this.vil = canvas(2100, 1180), x = v.ctx;
    x.fillStyle = linear(x, 0, 760, 0, 1180, [[0, rgb(p.land.map(v => v * 0.9))], [1, rgb(p.land.map(v => v * 0.45))]]);
    x.beginPath(); x.moveTo(0, 1180); x.lineTo(0, 860); x.quadraticCurveTo(900, 720, 2100, 800); x.lineTo(2100, 1180); x.fill();
    this.windows = [];
    const houses = [];
    for (let i = 0; i < 16; i++) houses.push({ x: 820 + r.range(0, 1250), w: r.range(120, 240), h: r.range(90, 170), y: 0 });
    houses.sort((a, b) => a.x - b.x);
    houses.forEach(hs => { hs.y = 820 - (hs.x - 800) * 0.04 + r.range(0, 120); });
    houses.sort((a, b) => a.y - b.y);
    const stone = [128, 104, 86];
    for (const hs of houses) {
      const { x: hx, y: hy, w: hw, h: hh } = hs;
      x.fillStyle = linear(x, hx, hy - hh, hx + hw, hy, [[0, rgb(mix3(stone, p.rim, 0.35))], [1, rgb(stone.map(v => v * 0.5))]]);
      x.fillRect(hx, hy - hh, hw, hh);
      x.save(); x.beginPath(); x.rect(hx, hy - hh, hw, hh); x.clip();
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = x.createPattern(noiseTex(128, 128, 98, 0.1, 3, 1.5), 'repeat'); x.fillRect(hx, hy - hh, hw, hh);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.25; x.strokeStyle = rgb(stone.map(v => v * 0.4)); x.lineWidth = 1;
      for (let yy = hy - hh + 14; yy < hy; yy += 14) { x.beginPath(); x.moveTo(hx, yy); x.lineTo(hx + hw, yy); x.stroke(); for (let xx = hx + ((yy / 14) % 2) * 12; xx < hx + hw; xx += 24) { x.beginPath(); x.moveTo(xx, yy - 14); x.lineTo(xx, yy); x.stroke(); } }
      x.restore();
      x.fillStyle = rgb(stone.map(v => v * 0.35)); x.fillRect(hx - 4, hy - hh - 8, hw + 8, 10); // roof parapet
      x.fillStyle = rgb([52, 36, 26]); const dx = hx + r.range(0.15, 0.6) * hw; x.fillRect(dx, hy - 64, 30, 64);
      if (r() < 0.7) { const wx = hx + r.range(0.6, 0.85) * hw, wy = hy - hh * 0.65; this.windows.push([wx + 8, wy + 10, r() * 6]); x.fillStyle = rgb([70, 46, 30]); x.fillRect(wx, wy, 16, 20); }
    }
    this.door = [1100, 880];
    this.trees = [oliveTree(501, 230, p, -1), oliveTree(502, 180, p, -1)];
    this.palm = palmCanvas(p);
    this.fg = makeGrass(97, 500, 0, 2100, 1120, 1180, [40, 110], p, { wk: 1.6 });
  },
  draw(ctx, t, dur) {
    const p = this.pal, u = t / dur;
    ctx.save(); ctx.translate(-80 * ease(u), -20 * ease(u)); ctx.scale(1 + 0.04 * u, 1 + 0.04 * u);
    ctx.drawImage(this.sky, -60, -60);
    ctx.fillStyle = rgb([255, 240, 220], 0.8); ctx.beginPath(); ctx.arc(1500, 180, 1.6, 0, TAU); ctx.fill(); // evening star
    ctx.drawImage(this.l1, -60, -60);
    ctx.drawImage(this.palm, 1830, 420);
    ctx.drawImage(this.vil, -60, -60);
    // smoke from a roof
    for (let k = 0; k < 18; k++) { const a = ((t * 0.25 + k / 18) % 1); glow(ctx, 1460 + a * 120 + Math.sin(a * 7 + t) * 20, 600 - a * 380, 30 + a * 70, rgb([180, 160, 170], 0.18 * (1 - a)), 1, 'source-over'); }
    // lit windows and the open door
    for (const [wx, wy, ph] of this.windows) { const fl = 0.85 + 0.15 * Math.sin(t * 7 + ph); ctx.fillStyle = rgb([255, 190, 110], fl); ctx.fillRect(wx - 68, wy - 60, 14, 18); glow(ctx, wx - 61, wy - 51, 40, rgb([255, 160, 80], 0.35 * fl)); }
    const [dx, dy] = this.door, fl = 0.9 + 0.1 * Math.sin(t * 6.3);
    ctx.fillStyle = rgb([255, 196, 120], fl); ctx.fillRect(dx, dy - 90, 46, 90);
    glow(ctx, dx + 23, dy - 40, 260, rgb([255, 150, 70], 0.45 * fl));
    ctx.fillStyle = radial(ctx, dx + 23, dy + 10, 220, [[0, rgb([255, 170, 90], 0.35)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(dx - 200, dy, 446, 120);
    ctx.drawImage(this.trees[0], 380, 640); ctx.drawImage(this.trees[1], 1680, 700);
    // arrivals
    const arr = ease(clamp(u * 1.25));
    for (let j = 0; j < 3; j++) {
      const x = lerp(520, 940, arr) - j * 70, y = dy + 6 + j * 4;
      const walking = arr < 0.995, ph = walking ? (t * 0.85 + j * 0.33) % 1 : 0.25;
      drawWalker(ctx, x, y, 150 - j * 6, ph, { view: 'side', cloth: [CLOTH.undyed, CLOTH.indigo, CLOTH.stranger][j], rim: [255, 170, 100], rimA: 0.9, dark: 0.72, light: 1, stride: walking ? 1 : 0.05, gesture: j === 0 ? clamp((u - 0.7) * 4) * 0.9 : 0 });
    }
    grass(ctx, t, this.fg, p, 0.7);
    ctx.restore();
  },
};
function palmCanvas(p) {
  const c = canvas(300, 520), x = c.ctx;
  x.strokeStyle = rgb(p.shadow); x.lineWidth = 14; x.beginPath(); x.moveTo(150, 520); x.quadraticCurveTo(130, 300, 160, 90); x.stroke();
  for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i / 10 - 0.5) * 3.4; x.lineWidth = 6; x.beginPath(); x.moveTo(160, 90); x.quadraticCurveTo(160 + Math.cos(a) * 80, 90 + Math.sin(a) * 60 - 20, 160 + Math.cos(a) * 150, 90 + Math.sin(a) * 90 + 50); x.stroke(); }
  return c;
}

// 6. Interior: stone room, oil lamp, bread; three seated shadows on the wall (or two, after he is gone)
WORLD.interior = {
  setup(dur, opts) {
    this.opts = opts || {};
    const c = this.room = canvas(2120, 1200), x = c.ctx, r = RNG(120);
    x.fillStyle = '#2a1c14'; x.fillRect(0, 0, 2120, 1200);
    // stone blocks
    for (let row = 0; row < 18; row++) for (let col = 0; col < 16; col++) {
      const bw = r.range(110, 160), bx = col * 136 + (row % 2) * 60 + r.range(-8, 8), by = row * 52;
      const v = r.range(0.75, 1.1);
      x.fillStyle = rgb([92 * v, 70 * v, 54 * v]); x.beginPath(); x.roundRect(bx, by, bw, 46, 8); x.fill();
    }
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.6; x.fillStyle = x.createPattern(noiseTex(256, 256, 121, 0.04, 5, 1.5), 'repeat'); x.fillRect(0, 0, 2120, 1200);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    // wall niche
    x.fillStyle = '#140d09'; x.beginPath(); x.roundRect(1520, 260, 150, 200, [75, 75, 6, 6]); x.fill();
    // table
    const ty = 760;
    x.fillStyle = linear(x, 0, ty, 0, 1200, [[0, '#6b4a30'], [1, '#2b1a10']]); x.fillRect(0, ty, 2120, 440);
    x.save(); x.beginPath(); x.rect(0, ty, 2120, 440); x.clip(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.7;
    x.fillStyle = x.createPattern(woodTex(), 'repeat'); x.fillRect(0, ty, 2120, 440); x.restore();
    // linen cloth on the table
    x.fillStyle = linear(x, 0, ty, 0, ty + 260, [[0, '#d8ccb4'], [1, '#8a7c66']]);
    x.beginPath(); x.moveTo(380, ty + 4); x.lineTo(1740, ty + 4); x.lineTo(1860, ty + 300); x.lineTo(260, ty + 300); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(80,64,48,0.25)'; x.lineWidth = 2; for (let k = 0; k < 9; k++) { x.beginPath(); x.moveTo(420 + k * 150, ty + 8); x.lineTo(320 + k * 170, ty + 300); x.stroke(); }
    this.ty = ty;
    this.bread = breadCanvas(this.opts.broken);
    this.jug = jugCanvas();
    this.lamp = [1080, ty + 70];
  },
  draw(ctx, t, dur) {
    const u = t / dur, [lx, ly] = this.lamp, fl = 1 + 0.07 * Math.sin(t * 9.1) + 0.05 * Math.sin(t * 15.7 + 1) + 0.03 * Math.sin(t * 27.3);
    const lean = 3 * Math.sin(t * 1.9) + 2 * Math.sin(t * 4.3);
    ctx.save(); const z = lerp(1.0, 1.06, ease(u)); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-1060, -600 + (this.opts.dy || 0));
    ctx.drawImage(this.room, 0, 0);
    // cast shadows of the seated figures on the back wall, swaying with the flame
    const seats = this.opts.empty ? [-1, 1] : [-1, 0, 1];
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (const s of seats) {
      const sx = lx + s * 470 - lean * 6 * (1 + Math.abs(s)), sy = 520;
      ctx.fillStyle = 'rgba(14,7,4,0.78)'; ctx.filter = 'blur(10px)';
      ctx.beginPath(); ctx.ellipse(sx, sy - 210, 70, 90, 0, 0, TAU); ctx.fill();          // head + head-cloth
      ctx.beginPath(); ctx.moveTo(sx - 60, sy - 140); ctx.quadraticCurveTo(sx - 190, sy - 60, sx - 210, sy + 240); ctx.lineTo(sx + 210, sy + 240); ctx.quadraticCurveTo(sx + 190, sy - 60, sx + 60, sy - 140); ctx.fill();
      if (s === 0 && this.opts.gesture) { ctx.beginPath(); ctx.ellipse(sx + 120, sy + 60 - 30 * ease(u), 60, 26, -0.4, 0, TAU); ctx.fill(); }
    }
    ctx.filter = 'none'; ctx.restore();
    // lamplight falloff
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = radial(ctx, lx + lean, ly - 60, 1700 * fl, [[0, 'rgba(255,240,210,1)'], [0.45, 'rgba(210,160,110,1)'], [1, 'rgba(40,24,14,1)']]);
    ctx.fillRect(0, 0, 2120, 1200); ctx.restore();
    // props
    ctx.drawImage(this.jug, 1420, this.ty - 150);
    ctx.drawImage(this.bread, 660, this.ty - 10);
    // clay oil lamp and flame
    ctx.fillStyle = linear(ctx, lx - 60, ly, lx + 60, ly + 40, [[0, '#a86a3c'], [1, '#3a2010']]);
    ctx.beginPath(); ctx.ellipse(lx, ly, 70, 26, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(lx + 50, ly - 6); ctx.quadraticCurveTo(lx + 100, ly - 14, lx + 106, ly - 4); ctx.lineTo(lx + 60, ly + 10); ctx.fill();
    if (!this.opts.out) {
      const fx = lx + 104 + lean, fy = ly - 12;
      glow(ctx, fx, fy - 30, 420 * fl, 'rgba(255,170,80,0.35)');
      ctx.fillStyle = radial(ctx, fx, fy - 18, 40, [[0, 'rgba(255,255,230,1)'], [0.4, 'rgba(255,200,90,0.95)'], [1, 'rgba(255,120,30,0)']]);
      ctx.beginPath(); ctx.moveTo(fx - 9, fy); ctx.quadraticCurveTo(fx - 12, fy - 26, fx + lean * 0.6, fy - 54 * fl); ctx.quadraticCurveTo(fx + 12, fy - 26, fx + 9, fy); ctx.fill();
      glow(ctx, fx, fy - 20, 60, 'rgba(255,230,160,0.7)');
    } else {
      // a thread of smoke where the flame was
      ctx.save(); ctx.strokeStyle = 'rgba(200,200,210,0.25)'; ctx.lineWidth = 3; ctx.filter = 'blur(3px)'; ctx.beginPath();
      for (let k = 0; k < 60; k++) { const a = k / 60, xx = lx + 104 + Math.sin(a * 9 - t * 1.4) * 30 * a, yy = ly - 14 - a * 600; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
    }
    motes(ctx, t, 130, 70, [500, 200, 1700, 900], { color: [255, 200, 140], alpha: 0.3, size: [0.6, 1.8], speed: 3 });
    ctx.restore();
  },
};
function woodTex() { const c = canvas(512, 256), x = c.ctx, n = makeNoise(140), id = x.createImageData(512, 256); for (let y = 0; y < 256; y++) for (let xx = 0; xx < 512; xx++) { const v = 0.6 + 0.4 * Math.sin(xx * 0.02 + n.fbm(xx * 0.004, y * 0.05, 4) * 18), i = (y * 512 + xx) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = v * 255; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); return c; }
function breadCanvas(broken) {
  const c = canvas(760, 200), x = c.ctx;
  const loaf = (cx, cy, rw, rh, rot) => {
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.fillStyle = linear(x, 0, -rh, 0, rh, [[0, '#d39a5c'], [0.6, '#9a5c2c'], [1, '#4a2a14']]); x.beginPath(); x.ellipse(0, 0, rw, rh, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,220,170,0.35)'; x.beginPath(); x.ellipse(-rw * 0.2, -rh * 0.4, rw * 0.6, rh * 0.25, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(90,50,20,0.5)'; x.lineWidth = 2; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(k * rw * 0.3, -rh * 0.6); x.quadraticCurveTo(k * rw * 0.3 + 6, 0, k * rw * 0.3, rh * 0.5); x.stroke(); }
    x.restore();
  };
  if (!broken) { loaf(380, 110, 170, 54, 0); loaf(170, 130, 90, 36, -0.1); }
  else {
    loaf(300, 112, 110, 50, -0.15); loaf(470, 104, 100, 46, 0.2);
    x.fillStyle = '#f0dcb4'; x.beginPath(); x.ellipse(392, 110, 18, 44, 0.1, 0, TAU); x.fill();     // torn crumb faces
    x.fillStyle = '#e8d0a4'; x.beginPath(); x.ellipse(378, 112, 14, 40, -0.1, 0, TAU); x.fill();
    for (let i = 0; i < 14; i++) { x.fillStyle = '#c99a62'; x.beginPath(); x.arc(330 + i * 10, 160 + (i % 3) * 5, 3, 0, TAU); x.fill(); }
    loaf(170, 130, 90, 36, -0.1);
  }
  return c;
}
function jugCanvas() {
  const c = canvas(240, 260), x = c.ctx;
  x.fillStyle = linear(x, 30, 0, 210, 0, [[0, '#c48452'], [0.5, '#8a4e28'], [1, '#2e1a0c']]);
  x.beginPath(); x.moveTo(90, 20); x.lineTo(150, 20); x.quadraticCurveTo(150, 60, 190, 110); x.quadraticCurveTo(230, 200, 160, 250); x.lineTo(80, 250); x.quadraticCurveTo(10, 200, 50, 110); x.quadraticCurveTo(90, 60, 90, 20); x.fill();
  x.strokeStyle = '#5a321a'; x.lineWidth = 10; x.beginPath(); x.moveTo(150, 50); x.quadraticCurveTo(215, 60, 195, 130); x.stroke();
  x.fillStyle = linear(x, 0, 0, 120, 0, [[0, '#b07444'], [1, '#3a2010']]); x.beginPath(); x.ellipse(40, 230, 34, 24, 0, 0, TAU); x.fill();
  return c;
}

// 7. Demonstration: a seated figure against the setting sun (face falls into shadow)
WORLD.backlit = {
  setup(dur) {
    const p = this.pal = PAL.golden;
    this.sky = skyCanvas(2100, 1180, p, 1050, 420, 160, { horizon: 690, cloud: 0.55 });
    this.hills = ridgeLayer(2100, 1180, { seed: 161, base: 690, amp: 80, freq: 0.002, top: mix3(p.far, p.hor, 0.35), bottom: p.far.map(v => v * 0.7), haze: [p.hor, 0.35], near: 0.3, trees: 200, treeSize: 4, treeCol: p.far.map(v => v * 0.6), treeLit: p.rim });
  },
  draw(ctx, t, dur) {
    const p = this.pal, u = t / dur;
    ctx.save(); const z = lerp(1, 1.05, ease(u)); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-1050, -590);
    ctx.drawImage(this.sky, 0, 0); ctx.drawImage(this.hills, 0, 0);
    rays(ctx, 1050, 420, 1400, 26, t, p.sun, 0.07, 5);
    // seated figure, frontal, head covering, arms resting on the table. Pure silhouette with rim light.
    const F = canvas(2100, 1180), f = F.ctx;
    f.fillStyle = '#fff';
    f.beginPath(); f.ellipse(1050, 430, 62, 80, 0, 0, TAU); f.fill();                       // head
    f.beginPath(); f.moveTo(985, 420); f.quadraticCurveTo(960, 560, 930, 600); f.lineTo(1170, 600); f.quadraticCurveTo(1140, 560, 1115, 420); f.fill(); // hair/beard mass
    f.beginPath(); f.moveTo(1000, 540); f.quadraticCurveTo(820, 560, 740, 700); f.lineTo(700, 900); f.lineTo(1400, 900); f.lineTo(1360, 700); f.quadraticCurveTo(1280, 560, 1100, 540); f.fill(); // shoulders + robe
    f.beginPath(); f.ellipse(800, 880, 140, 40, 0.1, 0, TAU); f.ellipse(1300, 880, 140, 40, -0.1, 0, TAU); f.fill(); // forearms on table
    const M = canvas(2100, 1180); M.ctx.drawImage(F, 0, 0);
    f.globalCompositeOperation = 'source-in'; f.fillStyle = '#120c0a'; f.fillRect(0, 0, 2100, 1180);
    // rim light all round (silhouette minus shrunken silhouette)
    const R = canvas(2100, 1180), rr = R.ctx; rr.drawImage(M, 0, 0); rr.globalCompositeOperation = 'destination-out';
    rr.filter = 'blur(6px)'; rr.drawImage(M, 0, 8); rr.filter = 'none';
    rr.globalCompositeOperation = 'source-in'; rr.fillStyle = rgb(p.rim); rr.fillRect(0, 0, 2100, 1180);
    ctx.drawImage(F, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9; ctx.drawImage(R, 0, 0); ctx.filter = 'blur(10px)'; ctx.drawImage(R, 0, 0); ctx.restore();
    // table edge
    ctx.fillStyle = linear(ctx, 0, 880, 0, 1180, [[0, '#4a3a2c'], [1, '#120c08']]); ctx.fillRect(0, 880, 2100, 300);
    ctx.fillStyle = rgb(p.rim, 0.6); ctx.fillRect(0, 878, 2100, 3);
    glow(ctx, 1050, 420, 260, rgb(p.sun, 0.25));
    motes(ctx, t, 162, 110, [0, 0, 2100, 1180], { color: p.rim, alpha: 0.4 });
    ctx.restore();
  },
};

// 8. Empty road at dusk, wind
WORLD.road_empty = {
  setup(dur) { const p = this.pal = PAL.dusk; this.base = WORLD.road_wide; this.sky = skyCanvas(2100, 1180, p, 1100, 640, 170, { horizon: 650, cloud: 0.5 });
    this.l1 = ridgeLayer(2100, 1180, { seed: 171, base: 650, amp: 120, freq: 0.0015, top: mix3(p.far, p.hor, 0.3), bottom: p.far.map(v => v * 0.7), haze: [p.hor, 0.3], near: 0.3, trees: 200, treeSize: 4, treeCol: p.far.map(v => v * 0.5), treeLit: p.rim });
    this.l2 = ridgeLayer(2100, 1180, { seed: 172, base: 820, amp: 60, freq: 0.002, top: p.land.map(v => v * 0.8), bottom: p.land.map(v => v * 0.4), near: 0.9, terraces: 3, terGap: 40 });
    this.grass = makeGrass(173, 700, 0, 2100, 980, 1180, [40, 140], p, { wk: 1.4 }); },
  draw(ctx, t, dur) { const p = this.pal; ctx.save(); ctx.translate(-90, -50); ctx.drawImage(this.sky, 0, 0); ctx.drawImage(this.l1, 0, 0); ctx.drawImage(this.l2, 0, 0);
    ctx.fillStyle = rgb(mix3(p.land, p.hor, 0.3), 0.9); ctx.beginPath(); ctx.moveTo(900, 1180); ctx.quadraticCurveTo(1000, 900, 1080, 830); ctx.lineTo(1110, 830); ctx.quadraticCurveTo(1200, 950, 1500, 1180); ctx.fill();
    grass(ctx, t, this.grass, p, 2.0); motes(ctx, t, 174, 200, [0, 600, 2100, 1180], { color: mix3(p.land, p.hor, 0.6), alpha: 0.35, drift: 60, speed: 20 }); ctx.restore(); },
};
