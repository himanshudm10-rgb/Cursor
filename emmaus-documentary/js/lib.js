// Shared helpers: seeded RNG, value noise, easing, canvas utilities.
'use strict';
const W = 1920, H = 1080;
const TAU = Math.PI * 2;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function RNG(seed) {
  const r = mulberry32(seed);
  r.range = (a, b) => a + (b - a) * r();
  r.int = (a, b) => Math.floor(a + (b - a) * r());
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  return r;
}

// 2D value noise with smooth interpolation
function makeNoise(seed) {
  const r = RNG(seed), P = new Uint8Array(512), V = new Float32Array(256);
  for (let i = 0; i < 256; i++) { P[i] = i; V[i] = r(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [P[i], P[j]] = [P[j], P[i]]; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const f = t => t * t * t * (t * (t * 6 - 15) + 10);
  function n2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const a = V[P[P[X] + Y]], b = V[P[P[X + 1] + Y]], c = V[P[P[X] + Y + 1]], d = V[P[P[X + 1] + Y + 1]];
    const u = f(xf), v = f(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  n2.fbm = (x, y, oct = 5, lac = 2, gain = 0.5) => {
    let s = 0, a = 1, t = 0;
    for (let i = 0; i < oct; i++) { s += a * n2(x, y); t += a; x *= lac; y *= lac; a *= gain; }
    return s / t;
  };
  n2.f1 = (x, oct = 5) => n2.fbm(x, 0.5, oct);
  return n2;
}

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return 0.5 - 0.5 * Math.cos(Math.PI * t); };
const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
const easeIn = t => { t = clamp(t); return t * t * t; };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix3 = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function keys(kf, t) { // [[t,v],...] eased
  if (t <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [t0, v0] = kf[i], [t1, v1] = kf[i + 1];
    if (t <= t1) {
      const e = ease((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((x, k) => lerp(x, v1[k], e)) : lerp(v0, v1, e);
    }
  }
  return kf[kf.length - 1][1];
}

function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  c.ctx = c.getContext('2d'); return c;
}

function radial(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
}
function linear(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
}
function glow(ctx, x, y, r, color, alpha = 1, mode = 'lighter') {
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = alpha;
  ctx.fillStyle = radial(ctx, x, y, r, [[0, color], [1, 'rgba(0,0,0,0)']]);
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}

// noise texture canvas (grayscale) for multiplying onto surfaces
function noiseTex(w, h, seed, scale = 0.02, oct = 5, contrast = 1) {
  const c = canvas(w, h), id = c.ctx.createImageData(w, h), n = makeNoise(seed);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = clamp(0.5 + (n.fbm(x * scale, y * scale, oct) - 0.5) * 2 * contrast) * 255, i = (y * w + x) * 4;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  c.ctx.putImageData(id, 0, 0); return c;
}

// particles drifting in light
function motes(ctx, t, seed, n, region, opts = {}) {
  const r = RNG(seed), [x0, y0, x1, y1] = region, col = opts.color || [255, 230, 190];
  const sp = opts.speed || 8, size = opts.size || [0.8, 2.6], alpha = opts.alpha || 0.55;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const px = r.range(x0, x1), py = r.range(y0, y1), vx = r.gauss() * sp + (opts.drift || 3), vy = r.gauss() * sp * 0.5 - 1;
    const ph = r() * TAU, s = r.range(size[0], size[1]);
    let x = px + vx * t + 7 * Math.sin(t * 0.6 + ph), y = py + vy * t + 5 * Math.cos(t * 0.45 + ph);
    x = x0 + ((x - x0) % (x1 - x0) + (x1 - x0)) % (x1 - x0); y = y0 + ((y - y0) % (y1 - y0) + (y1 - y0)) % (y1 - y0);
    const tw = 0.45 + 0.55 * Math.sin(t * 1.4 + ph * 3);
    ctx.fillStyle = rgb(col, alpha * tw * (opts.mask ? opts.mask(x, y) : 1));
    ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// god rays: wedges from a point
function rays(ctx, x, y, len, n, t, color, alpha, seed = 3, spread = TAU) {
  const r = RNG(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a0 = r() * spread - spread / 2 + Math.PI / 2 * (spread < TAU ? 1 : 0) + 0.04 * Math.sin(t * 0.3 + i);
    const w = r.range(0.01, 0.05), l = len * r.range(0.6, 1.1);
    const a = alpha * (0.5 + 0.5 * Math.sin(t * r.range(0.3, 0.8) + i * 1.7));
    ctx.fillStyle = radial(ctx, x, y, l, [[0, rgb(color, a)], [1, rgb(color, 0)]]);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a0 - w) * l, y + Math.sin(a0 - w) * l);
    ctx.lineTo(x + Math.cos(a0 + w) * l, y + Math.sin(a0 + w) * l);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
