// Creative treatments of the original painting. The artwork itself is never repainted or distorted:
// every effect is light, framing, overlay or layout on top of the authentic image.
'use strict';
const PAINT = {};
const PW = 2000, PH = 1370;
const V = {
  FULL: [1000, 685, 2436], FACE: [930, 390, 520], JES_M: [930, 470, 1000], LEFT_T: [228, 505, 470], RIGHT_T: [1300, 545, 440],
  SERV_T: [360, 240, 470], FAM: [1810, 545, 780], MAN: [1792, 250, 430], WOMAN: [1850, 535, 400], BOY: [1918, 572, 400],
};
const P_ = () => IMG.painting;

// draw the painting region (cx,cy,w) into dest rect, aspect taken from dest
function pview(ctx, cx, cy, w, dx = 0, dy = 0, dw = W, dh = H, alpha = 1) {
  [cx, cy, w] = cview([cx, cy, w], dw, dh);
  const h = w * dh / dw;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#050403'; ctx.fillRect(dx, dy, dw, dh);
  ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
  const s = dw / w;
  ctx.drawImage(P_(), dx + dw / 2 - cx * s, dy + dh / 2 - cy * s, PW * s, PH * s);
  ctx.restore();
}
// painting point -> screen for a full-frame view
// keep a view inside the canvas; continuous in (cx, cy, w) so camera moves never jump
function cview(v, dw = W, dh = H) {
  let [cx, cy, w] = v; const h = w * dh / dw;
  cx = w / 2 > PW - w / 2 ? PW / 2 : Math.min(Math.max(cx, w / 2), PW - w / 2);
  cy = h / 2 > PH - h / 2 ? PH / 2 : Math.min(Math.max(cy, h / 2), PH - h / 2);
  return [cx, cy, w];
}
function p2s(v, px, py) { v = cview(v); const s = W / v[2]; return [W / 2 + (px - v[0]) * s, H / 2 + (py - v[1]) * s, s]; }
function vlerp(a, b, e) { a = cview(a); b = cview(b); return a.map((x, i) => lerp(x, b[i], e)); }
// darkness everywhere except soft spotlights (screen coords)
function spotlights(ctx, spots, dim, col = [6, 4, 3]) {
  const o = canvas(W, H), x = o.ctx;
  x.fillStyle = rgb(col, dim); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  for (const s of spots) {
    if (s.a <= 0.001) continue;
    x.save(); x.translate(s.x, s.y); x.scale(1, s.ry / s.rx); x.globalAlpha = s.a;
    x.fillStyle = radial(x, 0, 0, s.rx, [[0, 'rgba(0,0,0,1)'], [0.55, 'rgba(0,0,0,0.9)'], [1, 'rgba(0,0,0,0)']]);
    x.fillRect(-s.rx, -s.rx, 2 * s.rx, 2 * s.rx); x.restore();
  }
  ctx.drawImage(o, 0, 0);
}
function desat(ctx, amount) { if (amount <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = amount; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function goldText(ctx, txt, x, y, size, a = 1, align = 'center') {
  ctx.save(); ctx.globalAlpha = a; ctx.font = `${size}px Cinzel`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(txt, x + 2, y + 2); ctx.fillStyle = '#e8d9b8'; ctx.fillText(txt, x, y); ctx.restore();
}

// 1. Opening: a searchlight moving over a darkened canvas, settling on his eyes
PAINT.p_open = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const u = t / dur, v = vlerp([930, 560, 1500], [930, 392, 520], ease(u));
    pview(ctx, ...v);
    // the beam stays on him: wide on the figure, narrowing to his eyes by "staring directly at you"
    const bp = [930, lerp(470, 350, ease(u))], [sx, sy, s] = p2s(v, bp[0], bp[1]);
    const r = lerp(560, 300, ease(u)) * s / (W / 1500) * 0.9 * (0.97 + 0.03 * Math.sin(t * 1.3));
    spotlights(ctx, [{ x: sx, y: sy, rx: r, ry: r * 1.1, a: 1 }], lerp(0.55, 0.45, u));
    motes(ctx, t, 201, 80, [sx - r, sy - r, sx + r, sy + r], { color: [255, 236, 200], alpha: 0.35, size: [0.6, 1.6], speed: 4, mask: (x, y) => clamp(1 - Math.hypot(x - sx, y - sy) / r) });
  },
};

// 2. "ghost-like": a faint, slow echo of the face breathing outward
PAINT.p_ghost = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const u = t / dur, v = vlerp([930, 392, 520], [930, 388, 470], ease(u));
    pview(ctx, ...v);
    for (let k = 1; k <= 2; k++) {
      const ph = ((t * 0.18 + k * 0.5) % 1), sc = 1 + ph * 0.06, a = 0.10 * Math.sin(Math.PI * ph) * smooth(0, 0.3, u);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(6px)';
      ctx.translate(W / 2, H * 0.45); ctx.scale(sc, sc); ctx.translate(-W / 2, -H * 0.45);
      pview(ctx, ...v, 0, 0, W, H, a); ctx.restore();
    }
    glow(ctx, W / 2, H * 0.42, 700, 'rgba(255,236,190,0.10)');
  },
};

// 3. "everyone around him seems terrified": a triptych of reactions sliding in
PAINT.p_triptych = {
  setup(dur) {},
  draw(ctx, t, dur) {
    ctx.save(); ctx.filter = 'blur(14px) brightness(0.35)'; pview(ctx, ...V.FULL); ctx.restore();
    const items = [[V.LEFT_T, 0.0], [V.RIGHT_T, 0.55], [V.SERV_T, 1.1]];
    const pw = 520, ph = 820, gap = 40, x0 = (W - (3 * pw + 2 * gap)) / 2;
    items.forEach(([v, t0], i) => {
      const k = easeOut((t - t0) / 0.7); if (k <= 0) return;
      const x = x0 + i * (pw + gap), y = (H - ph) / 2 + (1 - k) * 60;
      ctx.save(); ctx.globalAlpha = k;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + 10, y + 14, pw, ph);
      const vv = [v[0], v[1] - t * 6, v[2] * 0.62 * (1 - 0.04 * t / dur)];
      pview(ctx, vv[0], vv[1], vv[2], x, y, pw, ph);
      ctx.strokeStyle = 'rgba(214,186,128,0.8)'; ctx.lineWidth = 2; ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
      ctx.restore();
    });
  },
};

// 4. "hidden in the corner": the rest drains away, three faint presences pulse in the shadows
PAINT.p_corner = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const u = t / dur, v = vlerp([1450, 520, 950], [1800, 520, 720], ease(u));
    ctx.save(); ctx.filter = 'blur(2.2px) brightness(0.55)'; pview(ctx, ...v); ctx.restore();
    desat(ctx, 0.5 * u);
    const heads = [[1790, 245], [1845, 527], [1921, 563]];
    heads.forEach(([px, py], i) => {
      const [x, y, s] = p2s(v, px, py), k = smooth(0.25 + i * 0.12, 0.45 + i * 0.12, u);
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.2 + i);
      ctx.save(); ctx.globalAlpha = k * 0.55 * pulse; ctx.strokeStyle = 'rgba(232,206,150,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 95 * s * (1 + 0.08 * pulse), 0, TAU); ctx.stroke(); ctx.restore();
      glow(ctx, x, y, 140 * s, `rgba(255,220,160,${0.10 * k * pulse})`);
    });
  },
};

// 5. "born almost 2,000 years after": a timeline drawn across the dark corner
PAINT.p_born = {
  setup(dur) {},
  draw(ctx, t, dur) {
    ctx.save(); ctx.filter = 'blur(2.2px) brightness(0.42)'; pview(ctx, 1790, 525, 760); ctx.restore(); desat(ctx, 0.5);
    const a = smooth(0.2, 0.8, t) * (1 - smooth(2.6, 3.1, t));
    if (a <= 0) return;
    const y = 820, x0 = 360, x1 = 1560, k = easeOut((t - 0.3) / 2.0), xe = lerp(x0, x1, k);
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(220,196,140,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xe, y); ctx.stroke();
    for (let i = 0; i <= 20; i++) { const tx = lerp(x0, x1, i / 20); if (tx > xe) break; ctx.beginPath(); ctx.moveTo(tx, y - (i % 5 ? 6 : 14)); ctx.lineTo(tx, y + (i % 5 ? 6 : 14)); ctx.stroke(); }
    ctx.fillStyle = '#e8d9b8'; ctx.beginPath(); ctx.arc(x0, y, 6, 0, TAU); ctx.fill();
    goldText(ctx, 'c. AD 30', x0, y + 50, 30);
    const year = Math.round(lerp(30, 1896, k));
    goldText(ctx, k < 0.999 ? String(year) : '1890s', xe, y - 50, 34);
    if (k > 0.99) { ctx.fillStyle = '#e8d9b8'; ctx.beginPath(); ctx.arc(x1, y, 6, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
};

// 6. Reading the scene: each named element is lit in turn
PAINT.p_read = {
  setup(dur, o) { this.beats = o.beats; },
  draw(ctx, t, dur) {
    const v = vlerp(V.FULL, [1000, 660, 2250], ease(t / dur));
    pview(ctx, ...v);
    const targets = {
      all: [], jesus: [[930, 470, 250, 330]], bread: [[640, 760, 150, 95], [1225, 750, 150, 95]], men: [[225, 520, 170, 260], [1300, 600, 190, 230]], woman: [[370, 400, 170, 300]],
    };
    let spots = [], dim = 0;
    for (const [t0, name] of this.beats) {
      const k = smooth(t0, t0 + 0.8, t);
      if (k <= 0) continue;
      dim = name === 'all' ? lerp(dim, 0, k) : lerp(dim, 0.5, k);
      spots = spots.map(s => ({ ...s, a: s.a * (1 - k) }));
      for (const [px, py, rx, ry] of targets[name]) { const [x, y, s] = p2s(v, px, py); spots.push({ x, y, rx: rx * s * 1.6, ry: ry * s * 1.5, a: k }); }
    }
    if (dim > 0.01) spotlights(ctx, spots, dim);
  },
};

// 7. Magnifying loupe gliding from face to face
PAINT.p_loupe = {
  setup(dur, o) { this.stops = o.stops; },
  draw(ctx, t, dur) {
    const v = V.FULL;
    pview(ctx, ...v); ctx.fillStyle = 'rgba(8,6,4,0.45)'; ctx.fillRect(0, 0, W, H);
    const kf = this.stops.map(([t0, px, py]) => [t0, [px, py]]);
    const [px, py] = keys(kf, t), [x0, y0, s] = p2s(v, px, py);
    const R = 300, mag = 2.6, x = clamp(x0, R + 30, W - R - 30), y = clamp(y0, R + 30, H - R - 30);
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.filter = 'blur(18px)'; ctx.beginPath(); ctx.arc(x + 16, y + 22, R, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
    const w2 = (2 * R) / (s * mag);
    pview(ctx, px, py, w2, x - R, y - R, 2 * R, 2 * R);
    ctx.fillStyle = radial(ctx, x - R * 0.4, y - R * 0.5, R * 1.3, [[0, 'rgba(255,255,255,0.10)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
    ctx.restore();
    ctx.strokeStyle = linear(ctx, x - R, y - R, x + R, y + R, [[0, '#f3dfa6'], [0.5, '#8a6a2c'], [1, '#d9bd78']]); ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(x, y, R + 6, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,28,10,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
  },
};

// 8. "unlike everyone else, his face looks slightly blurred": crisp disciple vs his face, side by side
PAINT.p_compare = {
  setup(dur, o) { this.split = o.split; },
  draw(ctx, t, dur) {
    const k = ease((t - this.split) / 1.3);
    const vJ = vlerp([930, 395, 600], V.FACE, ease(t / dur));
    if (k <= 0) { pview(ctx, ...vJ); return; }
    const half = W / 2;
    pview(ctx, vJ[0], vJ[1], vJ[2] * (1 - 0.5 * k), lerp(0, half, k), 0, lerp(W, half, k), H);
    pview(ctx, 1295, 540, 300, lerp(-half, 0, k), 0, half, H);
    ctx.fillStyle = 'rgba(214,186,128,0.8)'; ctx.fillRect(lerp(0, half, k) - 1, 0, 2, H);
  },
};

// 9. The glow: rays from behind him, light breathing outward
PAINT.p_glow = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const v = vlerp(V.JES_M, [930, 450, 1180], ease(t / dur)); pview(ctx, ...v);
    const [x, y, s] = p2s(v, 930, 330);
    rays(ctx, x, y, 1100 * s * 1.2, 32, t, [255, 232, 180], 0.035 * smooth(0, 1.5, t), 9);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(24px)'; ctx.globalAlpha = 0.05 + 0.03 * Math.sin(t * 1.1);
    pview(ctx, ...v); ctx.restore();
  },
};

// 10. The painting presented as an object: it swings in on a dark wall
PAINT.p_present = {
  setup(dur) {},
  draw(ctx, t, dur) {
    ctx.fillStyle = linear(ctx, 0, 0, 0, H, [[0, '#17120f'], [1, '#0a0807']]); ctx.fillRect(0, 0, W, H);
    glow(ctx, W / 2, H * 0.42, 900, 'rgba(255,220,170,0.10)', 1, 'source-over');
    const k = easeOut(t / 3.2), ang = lerp(0.55, 0, k), sc = lerp(0.62, 0.74, ease(t / dur));
    const pw = W * sc, ph = pw * PH / PW, cx = W / 2, cy = H * 0.46;
    // perspective swing about the vertical axis, drawn in vertical slices
    const N = 80, depth = 1600;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.filter = 'blur(30px)'; ctx.fillRect(cx - pw / 2 + 30, cy - ph / 2 + 40, pw, ph); ctx.restore();
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const proj = uu => { const xw = (uu - 0.5) * pw, z = xw * Math.sin(ang), xx = xw * Math.cos(ang); const f = depth / (depth + z); return [cx + xx * f, f]; };
      const [x0, f0] = proj(u0), [x1] = proj(u1);
      const hh = ph * f0;
      ctx.drawImage(P_(), u0 * PW, 0, PW / N + 0.5, PH, x0, cy - hh / 2, x1 - x0 + 0.6, hh);
    }
    // gilt frame edge (front-on part)
    ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = linear(ctx, cx - pw / 2, 0, cx + pw / 2, 0, [[0, '#7a5a22'], [0.5, '#e2c27a'], [1, '#7a5a22']]); ctx.lineWidth = 16;
    ctx.strokeRect(cx - pw / 2 - 8, cy - ph / 2 - 8, pw + 16, ph + 16); ctx.restore();
  },
};

// 11. Family names: a soft light finds each head in turn (before the reveal)
PAINT.p_presence = {
  setup(dur, o) { this.beats = o.beats; this.v0 = o.v0; this.v1 = o.v1; },
  draw(ctx, t, dur) {
    const v = vlerp(this.v0, this.v1, ease(t / dur)); pview(ctx, ...v);
    const heads = { man: [1790, 245], woman: [1845, 527], boy: [1921, 563], all: null };
    let spots = []; let dim = 0;
    for (const [t0, who] of this.beats) {
      const k = smooth(t0, t0 + 0.5, t); if (k <= 0) continue;
      dim = lerp(dim, who === 'all' ? 0.3 : 0.62, k);
      spots = spots.map(s => ({ ...s, a: s.a * (1 - k) }));
      const hs = who === 'all' ? [heads.man, heads.woman, heads.boy] : [heads[who]];
      for (const [px, py] of hs) { const [x, y, s] = p2s(v, px, py); spots.push({ x, y, rx: 75 * s, ry: 90 * s, a: k }); }
    }
    spotlights(ctx, spots, dim);
  },
};

// 12. The reveal: each face lifts out of the canvas as a card
const CARD_CROPS = { man: [1790, 236, 190], woman: [1855, 522, 128], boy: [1926, 562, 128] };
const CARD_SLOTS = [W / 2 - 600, W / 2, W / 2 + 600];
function drawCard(ctx, c, x, y, scale, rot, a = 1, paper = 1) {
  const cw = 470, ch = 580;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.filter = 'blur(20px)'; ctx.fillRect(-cw / 2 + 20, -ch / 2 + 30, cw, ch); ctx.filter = 'none';
  ctx.fillStyle = `rgba(216,201,166,${paper})`; ctx.fillRect(-cw / 2 - 14, -ch / 2 - 14, cw + 28, ch + 28);
  ctx.filter = 'brightness(1.35) contrast(1.05)';
  pview(ctx, c[0], c[1], c[2] * cw / ch, -cw / 2, -ch / 2, cw, ch); ctx.filter = 'none';
  ctx.strokeStyle = 'rgba(90,70,40,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);
  ctx.restore();
}
PAINT.p_cards = {
  setup(dur, o) { this.beats = o.beats; },
  draw(ctx, t, dur) {
    const v = [1620, 520, 760];
    ctx.save(); ctx.filter = 'blur(10px) brightness(0.4)'; pview(ctx, ...v); ctx.restore();
    this.beats.forEach(([t0, who], i) => {
      const k = easeOut((t - t0) / 1.1); if (k <= 0) return;
      const last = i === this.beats.length - 1, next = this.beats[i + 1];
      const settle = last ? ease((t - t0 - 1.6) / 1.0) : ease((t - next[0]) / 0.9);
      const c = CARD_CROPS[who], [hx, hy] = p2s(v, c[0], c[1]);
      const arrive = last ? CARD_SLOTS[i] : W / 2;
      const tx = lerp(arrive, CARD_SLOTS[i], settle);
      const x = lerp(hx, tx, k), y = lerp(hy, H * 0.45, k);
      drawCard(ctx, c, x, y, lerp(0.3, lerp(1.0, 0.72, settle), k), lerp(0, (i - 1) * 0.035, k));
    });
  },
};

// 13. Cards return to the canvas and we pull back to the whole painting
PAINT.p_return = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const k = ease(t / (dur * 0.55)), v = vlerp([1620, 520, 760], V.FULL, ease(clamp((t - 0.8) / (dur - 0.8))));
    pview(ctx, ...v);
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.filter = 'blur(10px) brightness(0.4)'; pview(ctx, 1620, 520, 760); ctx.restore();
    ['man', 'woman', 'boy'].forEach((who, i) => {
      const c = CARD_CROPS[who], [hx, hy, s] = p2s(v, c[0], c[1]);
      const target = (c[2] * 470 / 580) * s / 470;
      const a = 1 - smooth(0.85, 1, k); if (a <= 0) return;
      drawCard(ctx, c, lerp(CARD_SLOTS[i], hx, k), lerp(H * 0.45, hy, k), lerp(0.72, target, k), lerp((i - 1) * 0.035, 0, k), a, 1 - k);
    });
  },
};

// 14. Two eras apart: Christ and the family pulled apart by a 2,000-year timeline, then brought together again
PAINT.p_eras = {
  setup(dur, o) { this.join = o.join; },
  draw(ctx, t, dur) {
    ctx.fillStyle = '#0a0807'; ctx.fillRect(0, 0, W, H);
    const apart = easeOut(t / 2.2) * (1 - ease((t - this.join) / 1.6));
    const merge = ease((t - this.join - 0.8) / 1.8);
    const pw = 640, ph = 860, gap = lerp(20, 520, apart), cy = H / 2;
    const lx = W / 2 - gap / 2 - pw, rx = W / 2 + gap / 2;
    ctx.save(); ctx.globalAlpha = 1 - merge;
    pview(ctx, 930, 420, 520, lx, cy - ph / 2, pw, ph);
    pview(ctx, 1715, 440, 560, rx, cy - ph / 2, pw, ph);
    ctx.strokeStyle = 'rgba(214,186,128,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(lx, cy - ph / 2, pw, ph); ctx.strokeRect(rx, cy - ph / 2, pw, ph);
    if (gap > 60) {
      const a = smooth(60, 300, gap);
      ctx.globalAlpha = a * (1 - merge); ctx.strokeStyle = 'rgba(220,196,140,0.85)';
      ctx.beginPath(); ctx.moveTo(lx + pw + 20, cy); ctx.lineTo(rx - 20, cy); ctx.stroke();
      for (let i = 0; i <= 10; i++) { const x = lerp(lx + pw + 20, rx - 20, i / 10); ctx.beginPath(); ctx.moveTo(x, cy - 8); ctx.lineTo(x, cy + 8); ctx.stroke(); }
      goldText(ctx, 'c. AD 30', lx + pw / 2, cy + ph / 2 + 44, 28, a * (1 - merge));
      goldText(ctx, '1896', rx + pw / 2, cy + ph / 2 + 44, 28, a * (1 - merge));
    }
    ctx.restore();
    if (merge > 0) pview(ctx, ...vlerp([1380, 560, 1700], [1380, 540, 1500], ease((t - this.join) / (dur - this.join))), 0, 0, W, H, merge);
  },
};

// 15. Brushstroke reveal of a face: primed canvas, charcoal lines, then strokes of paint following the forms
PAINT.p_brush = {
  setup(dur) {
    const v = this.v = [1300, 545, 340];
    const c = canvas(W, H); pview(c.ctx, ...v); const d = c.ctx.getImageData(0, 0, W, H).data;
    const lum = (x, y) => { x = clamp(x | 0, 0, W - 1); y = clamp(y | 0, 0, H - 1); const i = (y * W + x) * 4; return d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; };
    const r = RNG(77); this.strokes = [];
    const passes = [[2600, 46], [5000, 22], [11000, 10]];
    passes.forEach(([n, size], pass) => {
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H, idx = ((y | 0) * W + (x | 0)) * 4;
        const gx = lum(x + 6, y) - lum(x - 6, y), gy = lum(x, y + 6) - lum(x, y - 6);
        const a = Math.atan2(gy, gx) + Math.PI / 2 + r.range(-0.2, 0.2);   // stroke along the contour
        const detail = Math.hypot(gx, gy);
        if (pass === 2 && detail < 6 && r() < 0.6) continue;
        this.strokes.push({ x, y, c: [d[idx], d[idx + 1], d[idx + 2]], s: size * r.range(0.7, 1.3), a, t: pass + r() });
      }
    });
    this.full = c;
  },
  draw(ctx, t, dur) {
    const u = t / dur, prog = u * 4.2;
    ctx.fillStyle = '#ddd3bc'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.3; ctx.fillStyle = ctx.createPattern(canvasWeave(), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
    const ek = smooth(0, 1.0, prog);
    if (ek > 0) {
      const s = W / this.v[2];
      ctx.save(); ctx.globalAlpha = 0.32 * ek * (1 - smooth(2.2, 3.4, prog)); ctx.filter = 'invert(1) sepia(1) brightness(0.35) blur(1px)';
      ctx.beginPath(); ctx.rect(0, 0, W * ek, H); ctx.clip();
      ctx.drawImage(IMG.edges, W / 2 - this.v[0] * s, H / 2 - this.v[1] * s, PW * s, PH * s); ctx.restore();
    }
    ctx.lineCap = 'round';
    for (const st of this.strokes) {
      const k = clamp((prog - 1 - st.t * 0.85) * 3); if (k <= 0) continue;
      const L = st.s * k, dx = Math.cos(st.a) * L, dy = Math.sin(st.a) * L;
      ctx.strokeStyle = rgb(st.c, 0.9); ctx.lineWidth = st.s * 0.45;
      ctx.beginPath(); ctx.moveTo(st.x - dx, st.y - dy); ctx.quadraticCurveTo(st.x + dy * 0.15, st.y - dx * 0.15, st.x + dx, st.y + dy); ctx.stroke();
    }
    const fin = smooth(3.5, 4.2, prog);
    if (fin > 0) { ctx.globalAlpha = fin; ctx.drawImage(this.full, 0, 0); ctx.globalAlpha = 1; }
  },
};

// 16. Light connecting them: golden motes drift from Christ toward the family as we travel between them
PAINT.p_witness = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const v = vlerp(V.FAM, [1250, 560, 1500], ease(t / dur)); pview(ctx, ...v);
    const [jx, jy] = p2s(v, 930, 420), [fx_, fy] = p2s(v, 1830, 470);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = RNG(91);
    for (let i = 0; i < 140; i++) {
      const ph = (t * 0.12 + r()) % 1, off = r.gauss() * 60, x = lerp(jx, fx_, ph), y = lerp(jy, fy, ph) + Math.sin(ph * Math.PI * 2 + i) * 30 + off;
      ctx.fillStyle = `rgba(255,226,170,${0.5 * Math.sin(Math.PI * ph)})`; ctx.beginPath(); ctx.arc(x, y, r.range(1, 2.6), 0, TAU); ctx.fill();
    }
    ctx.restore();
    glow(ctx, jx, jy, 300, 'rgba(255,230,180,0.12)');
  },
};

// 17. Gilded moment: a sheen of light passes across the canvas
PAINT.p_gilded = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const v = vlerp(V.FULL, [980, 640, 1900], ease(t / dur)); pview(ctx, ...v);
    const x = lerp(-600, W + 600, ((t / 5) % 1));
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = linear(ctx, x - 400, 0, x + 400, H, [[0, 'rgba(255,240,200,0)'], [0.5, 'rgba(255,240,200,0.55)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
    motes(ctx, t, 92, 120, [0, 0, W, H], { color: [255, 214, 140], alpha: 0.45, size: [0.8, 2.2], speed: 5 });
  },
};

// 18. Forgotten: the artist's face as dust settles over the canvas
PAINT.p_dust = {
  setup(dur, o) { this.o = o; },
  draw(ctx, t, dur) {
    const u = t / dur, o = this.o, v = vlerp(o.v0, o.v1, ease(u)); pview(ctx, ...v);
    desat(ctx, lerp(o.d0, o.d1, u));
    ctx.fillStyle = `rgba(6,5,4,${lerp(o.k0, o.k1, ease(u))})`; ctx.fillRect(0, 0, W, H);
    const r = RNG(93);
    ctx.save();
    for (let i = 0; i < 260; i++) {
      const x = r() * W, sp = r.range(10, 40), y = (r() * H + t * sp) % H, s = r.range(0.6, 2.2);
      ctx.fillStyle = `rgba(200,190,170,${0.25 * r()})`; ctx.beginPath(); ctx.arc(x + Math.sin(t + i) * 6, y, s, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.10 * u; ctx.fillStyle = ctx.createPattern(canvasWeave(), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  },
};

// 19. "But here..." the painting's own light: face, hands, robe lit in turn, then rays outward from him
PAINT.p_inner = {
  setup(dur, o) { this.beats = o.beats; },
  draw(ctx, t, dur) {
    const v = vlerp([930, 470, 1200], [930, 470, 1150], ease(t / dur)); pview(ctx, ...v);
    const T = { face: [[930, 352, 100, 125]], hands: [[640, 765, 130, 85], [1225, 750, 130, 85]], robe: [[930, 600, 260, 220]], all: [[930, 520, 420, 460]] };
    let spots = [], dim = 0;
    for (const [t0, k_] of this.beats) {
      const k = smooth(t0, t0 + 0.6, t); if (k <= 0) continue;
      dim = lerp(dim, k_ === 'all' ? 0.3 : 0.6, k); spots = spots.map(s => ({ ...s, a: s.a * (1 - k) }));
      for (const [px, py, rx, ry] of T[k_]) { const [x, y, s] = p2s(v, px, py); spots.push({ x, y, rx: rx * s * 1.15, ry: ry * s * 1.15, a: k }); }
    }
    spotlights(ctx, spots, dim);
  },
};
PAINT.p_source = {
  setup(dur) {},
  draw(ctx, t, dur) {
    const v = vlerp([930, 480, 1050], [930, 400, 600], ease(t / dur)); pview(ctx, ...v);
    ctx.fillStyle = 'rgba(10,8,6,0.22)'; ctx.fillRect(0, 0, W, H);
    const [x, y, s] = p2s(v, 930, 500);
    glow(ctx, x, y - 80 * s, 620 * s * (1 + 0.06 * Math.sin(t * 1.3)), 'rgba(255,232,190,0.16)');
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(26px)'; ctx.globalAlpha = 0.06; pview(ctx, ...v); ctx.restore();
  },
};
