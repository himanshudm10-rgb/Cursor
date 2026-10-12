// Painted reconstructions for the artist's world. All original, procedural, finished through the oil-paint pass.
'use strict';
const BROLL = {};
function painted2D(scene) {   // wrap a 2D draw in the paint pass
  return {
    async setup(dur, o) { this.o = o || {}; if (scene.setup) await scene.setup.call(this, dur, this.o); },
    draw(ctx, t, dur) { const F = canvas(W, H); scene.draw.call(this, F.ctx, t, dur); paintPass(ctx, F, this.o.r ?? 3, 0.09); },
  };
}
function camPush(ctx, u, z0, z1, cx = 0.5, cy = 0.5, dx = 0) { const z = lerp(z0, z1, ease(u)); ctx.translate(W * cx + dx * u, H * cy); ctx.scale(z, z); ctx.translate(-W * cx, -H * cy); }

// ------------------------------------------------------------------ the studio, Paris
function unfinishedPainting(w, h) {
  const c = canvas(w, h), x = c.ctx;
  x.fillStyle = '#d6ccb4'; x.fillRect(0, 0, w, h);
  x.save(); x.globalAlpha = 0.35; x.filter = 'invert(1) sepia(1) brightness(0.4)'; x.drawImage(IMG.edges, 0, 0, w, h); x.restore();
  // painted area grows from the left: the centre and left are finished, the right side still underdrawing
  const m = canvas(w, h), mx = m.ctx; const r = RNG(301);
  mx.fillStyle = '#fff'; mx.fillRect(0, 0, w * 0.58, h);
  for (let i = 0; i < 900; i++) { const yy = r() * h, xx = w * 0.58 + Math.abs(r.gauss()) * w * 0.12; mx.beginPath(); mx.ellipse(xx, yy, r.range(6, 22), r.range(3, 8), r.range(-0.6, 0.6), 0, TAU); mx.fill(); }
  const p = canvas(w, h); p.ctx.drawImage(IMG.painting, 0, 0, w, h); p.ctx.globalCompositeOperation = 'destination-in'; p.ctx.drawImage(m, 0, 0);
  x.drawImage(p, 0, 0); return c;
}
BROLL.studio = painted2D({
  setup(dur, o) {
    const c = this.bg = canvas(W * 1.2, H * 1.2), x = c.ctx, w = c.width, h = c.height, r = RNG(310);
    x.fillStyle = linear(x, 0, 0, 0, h, [[0, '#2b231d'], [1, '#14100d']]); x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.fillStyle = x.createPattern(noiseTex(256, 256, 311, 0.03, 4, 1.1), 'repeat'); x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    // north-light window: sky with Paris roofs and chimney pots
    const wx0 = 120, wx1 = 900, wy0 = 40, wy1 = 900;
    x.fillStyle = linear(x, 0, wy0, 0, wy1, [[0, '#c9d4dc'], [1, '#e8e6dc']]); x.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    x.fillStyle = '#8f949a';
    let rx = wx0; while (rx < wx1) { const bw = r.range(80, 200), bh = r.range(60, 160); x.fillRect(rx, wy1 - 220 - bh * 0.3, bw, 400); x.beginPath(); x.moveTo(rx - 10, wy1 - 220 - bh * 0.3); x.lineTo(rx + bw / 2, wy1 - 260 - bh * 0.6); x.lineTo(rx + bw + 10, wy1 - 220 - bh * 0.3); x.fill();
      for (let k = 0; k < 3; k++) { const cx = rx + r.range(10, bw - 20); x.fillRect(cx, wy1 - 300 - bh * 0.6, 16, 60); x.fillStyle = '#7a6a5e'; for (let j = 0; j < 3; j++) x.fillRect(cx + j * 5, wy1 - 312 - bh * 0.6, 4, 12); x.fillStyle = '#8f949a'; }
      rx += bw + r.range(0, 30); }
    x.strokeStyle = '#1e1813'; x.lineWidth = 14;
    for (let k = 0; k <= 5; k++) { const xx = lerp(wx0, wx1, k / 5); x.beginPath(); x.moveTo(xx, wy0); x.lineTo(xx, wy1); x.stroke(); }
    for (let k = 0; k <= 7; k++) { const yy = lerp(wy0, wy1, k / 7); x.beginPath(); x.moveTo(wx0, yy); x.lineTo(wx1, yy); x.stroke(); }
    x.lineWidth = 30; x.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    // floorboards
    x.fillStyle = linear(x, 0, 960, 0, h, [[0, '#4a3524'], [1, '#22170f']]); x.fillRect(0, 960, w, h - 960);
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 3; for (let k = -10; k < 30; k++) { x.beginPath(); x.moveTo(1150 + k * 60, 960); x.lineTo(1150 + k * 200, h); x.stroke(); }
    // easel and the painting in progress
    const ex = 1500;
    x.strokeStyle = '#3a2618'; x.lineWidth = 26; x.lineCap = 'round';
    x.beginPath(); x.moveTo(ex - 260, h); x.lineTo(ex - 60, 120); x.stroke(); x.beginPath(); x.moveTo(ex + 300, h); x.lineTo(ex + 80, 120); x.stroke();
    x.beginPath(); x.moveTo(ex + 10, 90); x.lineTo(ex + 30, h - 40); x.stroke();
    const pw = 760, ph = pw * 1370 / 2000;
    this.canvasPos = [ex - pw / 2 + 10, 260, pw, ph];
    x.fillStyle = '#000'; x.fillRect(ex - pw / 2 - 6, 254, pw + 12, ph + 12);
    x.drawImage(unfinishedPainting(pw, ph), ex - pw / 2 + 10 - 10, 260 - 0, pw, ph);
    x.fillStyle = '#3a2618'; x.fillRect(ex - pw / 2 - 40, 260 + ph, pw + 80, 26);
    // stool with palette and jar of brushes
    x.fillStyle = '#2e1f14'; x.fillRect(820, 1000, 260, 26); x.fillRect(840, 1026, 20, 200); x.fillRect(1040, 1026, 20, 200);
    x.fillStyle = '#9a7246'; x.beginPath(); x.ellipse(900, 990, 150, 36, -0.1, 0, TAU); x.fill();
    [['#e8e0cc', 820], ['#c99a3c', 860], ['#9c3a22', 900], ['#3a3020', 940], ['#2a3858', 980]].forEach(([cc, px]) => { x.fillStyle = cc; x.beginPath(); x.ellipse(px, 980 + Math.sin(px) * 6, 14, 8, 0, 0, TAU); x.fill(); });
    x.fillStyle = '#5a4a3a'; x.fillRect(1030, 930, 50, 70);
    x.strokeStyle = '#2a1a10'; x.lineWidth = 5; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(1040 + k * 7, 930); x.lineTo(1030 + k * 12, 820 + k * 8); x.stroke(); }
    // bellows camera on a tripod by the window
    const cx = 640, cy = 640; x.fillStyle = '#1c140e';
    x.lineWidth = 12; x.strokeStyle = '#2a1d12'; x.beginPath(); x.moveTo(cx, cy + 40); x.lineTo(cx - 120, h); x.moveTo(cx, cy + 40); x.lineTo(cx + 130, h); x.moveTo(cx, cy + 40); x.lineTo(cx + 10, h); x.stroke();
    x.fillStyle = '#4a321e'; x.fillRect(cx - 70, cy - 70, 70, 120);
    x.fillStyle = '#18100b'; x.beginPath(); x.moveTo(cx, cy - 60); x.lineTo(cx + 120, cy - 36); x.lineTo(cx + 120, cy + 36); x.lineTo(cx, cy + 50); x.fill();
    x.strokeStyle = 'rgba(80,60,40,0.6)'; x.lineWidth = 2; for (let k = 1; k < 7; k++) { const xx = cx + k * 17; x.beginPath(); x.moveTo(xx, cy - 60 + k * 3.5); x.lineTo(xx, cy + 50 - k * 2); x.stroke(); }
    x.fillStyle = '#4a321e'; x.fillRect(cx + 120, cy - 44, 26, 88); x.fillStyle = '#0a0806'; x.beginPath(); x.arc(cx + 160, cy, 28, 0, TAU); x.fill();
    x.fillStyle = 'rgba(200,210,220,0.25)'; x.beginPath(); x.arc(cx + 160, cy - 6, 10, 0, TAU); x.fill();
    // light falloff from the window
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = radial(x, 700, 400, 1700, [[0, 'rgba(255,250,240,1)'], [0.5, 'rgba(150,135,120,1)'], [1, 'rgba(40,32,26,1)']]); x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
    this.win = [wx0, wy0, wx1, wy1];
  },
  draw(ctx, t, dur) {
    const u = t / dur, o = this.o;
    ctx.save(); camPush(ctx, u, o.z0 ?? 1.0, o.z1 ?? 1.06, o.cx ?? 0.5, o.cy ?? 0.5, o.dx ?? -40);
    ctx.drawImage(this.bg, -W * 0.1, -H * 0.1);
    // window light shaft
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const [wx0, wy0, wx1, wy1] = this.win.map((v, i) => v - (i % 2 ? H * 0.1 : W * 0.1));
    ctx.fillStyle = linear(ctx, wx0, wy0, wx1 + 800, H, [[0, 'rgba(230,226,215,0.32)'], [1, 'rgba(230,226,215,0)']]);
    ctx.beginPath(); ctx.moveTo(wx0, wy0); ctx.lineTo(wx1, wy0); ctx.lineTo(wx1 + 900, H + 200); ctx.lineTo(wx0 + 400, H + 200); ctx.closePath(); ctx.fill(); ctx.restore();
    motes(ctx, t, 312, 260, [200, 0, 1700, H], { color: [240, 236, 220], alpha: 0.45, size: [0.7, 2.2], speed: 3 });
    ctx.restore();
  },
});

// ------------------------------------------------------------------ church interior, stained glass
BROLL.church = painted2D({
  setup(dur) {
    const c = this.bg = canvas(W * 1.15, H * 1.15), x = c.ctx, w = c.width, h = c.height, r = RNG(320);
    x.fillStyle = '#16110e'; x.fillRect(0, 0, w, h);
    // stone courses
    for (let row = 0; row < 40; row++) for (let col = 0; col < 30; col++) { const v = r.range(0.7, 1.1); x.fillStyle = rgb([52 * v, 44 * v, 38 * v]); x.fillRect(col * 80 + (row % 2) * 40, row * 34, 76, 30); }
    // arcade of pointed arches with columns
    this.windows = [];
    for (let k = 0; k < 4; k++) {
      const ax = 160 + k * 560, aw = 260, top = 140, base = 760;
      const glass = canvas(aw, base - top), g = glass.ctx, gh = base - top;
      g.fillStyle = '#1d2a5a'; g.fillRect(0, 0, aw, gh);
      // diamond quarries
      for (let yy = -20; yy < gh + 20; yy += 34) for (let xx = -20; xx < aw + 20; xx += 34) {
        g.fillStyle = rgb(r.pick([[40, 60, 120], [30, 46, 96], [56, 80, 140], [70, 90, 150]]));
        g.beginPath(); g.moveTo(xx, yy - 17); g.lineTo(xx + 17, yy); g.lineTo(xx, yy + 17); g.lineTo(xx - 17, yy); g.fill();
      }
      // medallions: roundels with figures of colour
      for (const my of [gh * 0.22, gh * 0.55, gh * 0.85]) {
        g.fillStyle = '#c8a040'; g.beginPath(); g.arc(aw / 2, my, 74, 0, TAU); g.fill();
        g.fillStyle = r.pick(['#8c1e1e', '#a0302a', '#7a1a3a']); g.beginPath(); g.arc(aw / 2, my, 62, 0, TAU); g.fill();
        for (let k = 0; k < 6; k++) { g.fillStyle = rgb(r.pick([[230, 200, 120], [60, 120, 70], [240, 230, 210], [40, 60, 130]])); g.beginPath(); g.ellipse(aw / 2 + r.range(-30, 30), my + r.range(-30, 30), r.range(8, 22), r.range(14, 30), r.range(0, 3), 0, TAU); g.fill(); }
        g.strokeStyle = '#140c08'; g.lineWidth = 5; g.beginPath(); g.arc(aw / 2, my, 74, 0, TAU); g.stroke(); g.beginPath(); g.arc(aw / 2, my, 62, 0, TAU); g.stroke();
      }
      g.strokeStyle = 'rgba(20,12,8,0.9)'; g.lineWidth = 2.5;
      for (let d = -gh; d < aw + gh; d += 34) { g.beginPath(); g.moveTo(d, 0); g.lineTo(d + gh, gh); g.stroke(); g.beginPath(); g.moveTo(d, 0); g.lineTo(d - gh, gh); g.stroke(); }
      g.lineWidth = 9; for (let yy = 90; yy < gh; yy += 130) { g.beginPath(); g.moveTo(0, yy); g.lineTo(aw, yy); g.stroke(); }
      g.fillStyle = '#d0b060'; g.fillRect(0, 0, 14, gh); g.fillRect(aw - 14, 0, 14, gh);
      x.save(); x.beginPath(); x.moveTo(ax, base); x.lineTo(ax, top + 140); x.quadraticCurveTo(ax, top, ax + aw / 2, top - 30); x.quadraticCurveTo(ax + aw, top, ax + aw, top + 140); x.lineTo(ax + aw, base); x.closePath(); x.clip();
      x.drawImage(glass, ax, top - 30, aw, base - top + 30); x.restore();
      x.strokeStyle = '#0d0907'; x.lineWidth = 22; x.beginPath(); x.moveTo(ax, base); x.lineTo(ax, top + 140); x.quadraticCurveTo(ax, top, ax + aw / 2, top - 30); x.quadraticCurveTo(ax + aw, top, ax + aw, top + 140); x.lineTo(ax + aw, base); x.stroke();
      this.windows.push([ax + aw / 2, (top + base) / 2]);
      x.save(); x.globalCompositeOperation = 'lighter'; x.filter = 'blur(28px)'; x.globalAlpha = 0.35; x.drawImage(glass, ax, top - 30, aw, base - top + 30); x.restore();
      // column between windows
      const colx = ax + aw + 140; x.fillStyle = linear(x, colx - 60, 0, colx + 60, 0, [[0, '#2b231d'], [0.4, '#5a4c40'], [1, '#1a1410']]); x.fillRect(colx - 60, 0, 120, h);
    }
    // floor
    x.fillStyle = linear(x, 0, 860, 0, h, [[0, '#3a2f27'], [1, '#18120e']]); x.fillRect(0, 860, w, h - 860);
    for (let k = 0; k < 40; k++) { x.strokeStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.moveTo(k * 60 - 200, 860); x.lineTo(k * 120 - 1200, h); x.stroke(); }
    // pews
    for (let k = 0; k < 5; k++) { x.fillStyle = '#1c130c'; x.fillRect(200 + k * 30, 900 + k * 60, 1700 - k * 60, 30 + k * 6); }
  },
  draw(ctx, t, dur) {
    const u = t / dur;
    ctx.save(); camPush(ctx, u, 1.0, 1.07, 0.5, 0.45, -30);
    ctx.drawImage(this.bg, -W * 0.075, -H * 0.075);
    // coloured light beams onto the floor
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const tints = ['rgba(200,80,70,', 'rgba(70,110,200,', 'rgba(230,190,90,', 'rgba(90,170,110,'];
    this.windows.forEach(([wx, wy], i) => {
      const a = 0.16 + 0.05 * Math.sin(t * 0.7 + i);
      ctx.fillStyle = linear(ctx, wx, wy, wx + 500, H, [[0, tints[i] + a + ')'], [1, tints[i] + '0)']]);
      ctx.beginPath(); ctx.moveTo(wx - 130, wy - 200); ctx.lineTo(wx + 130, wy - 200); ctx.lineTo(wx + 760, H + 100); ctx.lineTo(wx + 300, H + 100); ctx.closePath(); ctx.fill();
      ctx.fillStyle = radial(ctx, wx + 560, 1000, 260, [[0, tints[i] + (a * 1.5) + ')'], [1, tints[i] + '0)']]); ctx.fillRect(wx + 300, 800, 520, 400);
    });
    ctx.restore();
    motes(ctx, t, 321, 240, [0, 100, W, H], { color: [255, 230, 190], alpha: 0.4, size: [0.7, 2], speed: 3 });
    ctx.restore();
  },
});

// ------------------------------------------------------------------ votive candles
BROLL.votive = painted2D({
  setup(dur) { const r = RNG(330); this.c = []; for (let row = 0; row < 4; row++) for (let k = 0; k < 9 + row * 2; k++) this.c.push({ row, x: (k + 0.5 + r.range(-0.2, 0.2)) / (9 + row * 2) * W, h: r.range(40, 110), ph: r() * 9, burn: r.range(0.5, 1) }); },
  draw(ctx, t, dur) {
    const u = t / dur, focus = lerp(3, 1, ease(u));   // rack focus from back rows to the front
    ctx.fillStyle = '#0b0705'; ctx.fillRect(0, 0, W, H);
    glow(ctx, W / 2, H * 0.75, 1100, 'rgba(255,140,60,0.18)', 1, 'source-over');
    for (let row = 0; row < 4; row++) {
      const L = canvas(W, H), x = L.ctx, sc = [0.55, 0.7, 0.85, 1.05][row], by = [560, 660, 790, 960][row];
      // tiered iron stand
      x.fillStyle = '#1a120c'; x.fillRect(0, by + 8 * sc, W, 22 * sc);
      for (const cd of this.c.filter(c => c.row === row)) {
        const ch = cd.h * sc * cd.burn, cw = 26 * sc, cx = cd.x, top = by - ch;
        x.fillStyle = linear(x, cx - cw, 0, cx + cw, 0, [[0, '#8a7258'], [0.4, '#f0e2c4'], [1, '#6a5640']]); x.fillRect(cx - cw / 2, top, cw, ch);
        x.fillStyle = 'rgba(240,226,196,0.9)'; x.beginPath(); x.ellipse(cx + cw * 0.3, top + 6 * sc, 3 * sc, 9 * sc, 0, 0, TAU); x.fill(); // wax drip
        const fl = 1 + 0.12 * Math.sin(t * 8 + cd.ph) + 0.08 * Math.sin(t * 13 + cd.ph * 2), lean = 2 * sc * Math.sin(t * 2 + cd.ph);
        glow(x, cx, top - 18 * sc, 90 * sc * fl, 'rgba(255,170,80,0.5)');
        x.fillStyle = radial(x, cx, top - 14 * sc, 22 * sc, [[0, 'rgba(255,255,235,1)'], [0.5, 'rgba(255,200,100,0.95)'], [1, 'rgba(255,120,30,0)']]);
        x.beginPath(); x.moveTo(cx - 6 * sc, top - 2); x.quadraticCurveTo(cx - 8 * sc, top - 18 * sc, cx + lean, top - 38 * sc * fl); x.quadraticCurveTo(cx + 8 * sc, top - 18 * sc, cx + 6 * sc, top - 2); x.fill();
      }
      const blur = Math.abs(row - focus) * 7;
      ctx.save(); if (blur > 0.5) ctx.filter = `blur(${blur}px)`; ctx.drawImage(L, 0, 0); ctx.restore();
    }
    // smoke threads rising
    ctx.save(); ctx.strokeStyle = 'rgba(200,190,190,0.12)'; ctx.lineWidth = 3; ctx.filter = 'blur(2px)';
    for (let k = 0; k < 4; k++) { ctx.beginPath(); const x0 = 400 + k * 380; for (let j = 0; j < 40; j++) { const a = j / 40, xx = x0 + Math.sin(a * 8 - t * 1.2 + k) * 30 * a, yy = 700 - a * 600; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
    ctx.restore();
  },
});

// ------------------------------------------------------------------ museum: the painting on a wall, a visitor before it
BROLL.museum = painted2D({
  setup(dur, o) {},
  draw(ctx, t, dur) {
    const u = t / dur, o = this.o;
    ctx.save(); camPush(ctx, u, o.z0 ?? 1.0, o.z1 ?? 1.15, 0.5, 0.42);
    ctx.fillStyle = linear(ctx, 0, 0, 0, H, [[0, o.wall0 || '#3b332c'], [1, o.wall1 || '#211c18']]); ctx.fillRect(0, 0, W, H);
    // spot pool and track light
    ctx.fillStyle = radial(ctx, W / 2, 420, 900, [[0, 'rgba(255,236,200,0.28)'], [1, 'rgba(255,236,200,0)']]); ctx.fillRect(0, 0, W, H);
    const pw = 860, ph = pw * PH / PW, px = (W - pw) / 2, py = 160;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.filter = 'blur(16px)'; ctx.fillRect(px + 20, py + 26, pw, ph); ctx.filter = 'none';
    ctx.fillStyle = linear(ctx, px, py, px + pw, py + ph, [[0, '#b08a44'], [0.5, '#e7cd8a'], [1, '#8a6a30']]); ctx.fillRect(px - 30, py - 30, pw + 60, ph + 60);
    ctx.drawImage(IMG.painting, px, py, pw, ph);
    // floor
    ctx.fillStyle = linear(ctx, 0, 820, 0, H, [[0, '#4a3828'], [1, '#1d150e']]); ctx.fillRect(0, 820, W, H - 820);
    ctx.save(); ctx.globalAlpha = 0.12; ctx.translate(0, 1640); ctx.scale(1, -1); ctx.drawImage(IMG.painting, px, py + 200, pw, ph * 0.6); ctx.restore();
    if (o.bench !== false) { ctx.fillStyle = '#18110b'; ctx.fillRect(560, 900, 800, 34); ctx.fillRect(600, 934, 26, 110); ctx.fillRect(1294, 934, 26, 110); }
    // a visitor seen from behind
    if (o.visitor) {
      const vx = 1180 + Math.sin(t * 0.4) * 3, vy = 1080;
      ctx.fillStyle = '#0e0b09';
      ctx.beginPath(); ctx.ellipse(vx, vy - 520, 48, 58, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(vx - 50, vy - 470); ctx.quadraticCurveTo(vx - 170, vy - 440, vx - 180, vy - 300); ctx.lineTo(vx - 160, vy); ctx.lineTo(vx + 160, vy); ctx.lineTo(vx + 180, vy - 300); ctx.quadraticCurveTo(vx + 170, vy - 440, vx + 50, vy - 470); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,170,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(vx, vy - 520, 48, 58, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    motes(ctx, t, 340, 90, [300, 0, 1600, 900], { color: [255, 236, 200], alpha: 0.3 });
    ctx.restore();
  },
});

// ------------------------------------------------------------------ the Salon: skylit hall, walls hung floor to ceiling, a crowd
function academicCanvas(seed, w, h) {   // indistinct, original tonal pictures for the hang
  const r = RNG(seed), c = canvas(w, h), x = c.ctx;
  const sky = [r.range(120, 200), r.range(120, 180), r.range(100, 160)];
  x.fillStyle = linear(x, 0, 0, 0, h, [[0, rgb(sky)], [0.6, rgb(sky.map(v => v * 0.7))], [1, rgb([60, 46, 34])]]); x.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { x.fillStyle = rgb([r.range(30, 90), r.range(25, 70), r.range(20, 50)], 0.8); x.beginPath(); x.ellipse(r() * w, h * r.range(0.55, 0.95), r.range(w * 0.05, w * 0.25), r.range(h * 0.05, h * 0.2), 0, 0, TAU); x.fill(); }
  return c;
}
function crowdFigure(x, ctx, cx, base, sc, kind, t, ph) {
  ctx.fillStyle = '#0c0907';
  const sway = Math.sin(t * 0.6 + ph) * 3 * sc;
  if (kind === 'man') {
    ctx.fillRect(cx - 28 * sc + sway, base - 330 * sc, 56 * sc, 60 * sc);                    // top hat
    ctx.fillRect(cx - 40 * sc + sway, base - 274 * sc, 80 * sc, 8 * sc);
    ctx.beginPath(); ctx.ellipse(cx + sway, base - 240 * sc, 30 * sc, 36 * sc, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 34 * sc + sway, base - 205 * sc); ctx.lineTo(cx - 70 * sc, base - 60 * sc); ctx.lineTo(cx - 60 * sc, base); ctx.lineTo(cx + 60 * sc, base); ctx.lineTo(cx + 70 * sc, base - 60 * sc); ctx.lineTo(cx + 34 * sc + sway, base - 205 * sc); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(cx + sway, base - 250 * sc, 26 * sc, 32 * sc, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + sway + 6 * sc, base - 285 * sc, 40 * sc, 14 * sc, -0.2, 0, TAU); ctx.fill();   // hat
    ctx.beginPath(); ctx.moveTo(cx - 24 * sc + sway, base - 218 * sc); ctx.quadraticCurveTo(cx - 40 * sc, base - 150 * sc, cx - 30 * sc, base - 120 * sc);
    ctx.quadraticCurveTo(cx - 110 * sc, base - 40 * sc, cx - 100 * sc, base); ctx.lineTo(cx + 120 * sc, base); ctx.quadraticCurveTo(cx + 120 * sc, base - 60 * sc, cx + 50 * sc, base - 120 * sc); // bustle
    ctx.quadraticCurveTo(cx + 40 * sc, base - 150 * sc, cx + 24 * sc + sway, base - 218 * sc); ctx.fill();
  }
}
BROLL.salon = painted2D({
  setup(dur) {
    const c = this.bg = canvas(W * 1.12, H * 1.12), x = c.ctx, w = c.width, h = c.height, r = RNG(350);
    // skylight vault
    x.fillStyle = linear(x, 0, 0, 0, 300, [[0, '#e4dfd2'], [1, '#b8ad9a']]); x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(50,40,32,0.8)'; x.lineWidth = 5;
    const vp = [w * 0.62, 420];
    for (let k = -20; k < 40; k++) { x.beginPath(); x.moveTo(k * 80, 0); x.lineTo(vp[0] + (k * 80 - vp[0]) * 0.35, 260); x.stroke(); }
    for (let k = 0; k < 6; k++) { const yy = 30 + k * k * 9; x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); }
    // left wall receding to the vanishing point, hung frame to frame
    const wall = (u) => [lerp(0, vp[0] - 120, u), lerp(260, 300, u), lerp(1000, 760, u)];   // x, top, bottom
    x.fillStyle = '#5c241c'; x.beginPath(); x.moveTo(0, 240); x.lineTo(vp[0] - 120, 300); x.lineTo(vp[0] - 120, 760); x.lineTo(0, 1000); x.fill();
    let u = 0, id = 0;
    while (u < 0.97) {
      const [x0, t0, b0] = wall(u), fw = lerp(260, 40, u) * r.range(0.7, 1.3), u1 = Math.min(1, u + fw / (vp[0] - 120));
      const [x1, t1, b1] = wall(u1);
      for (const [fa, fb] of [[0.05, 0.42], [0.47, 0.8]]) {
        const ya0 = lerp(t0, b0, fa), ya1 = lerp(t0, b0, fb), yb0 = lerp(t1, b1, fa), yb1 = lerp(t1, b1, fb);
        const blur = Math.abs(u - 0.35) * 6;
        x.save(); x.filter = `blur(${blur}px)`;
        x.fillStyle = '#b08a3e'; x.beginPath(); x.moveTo(x0, ya0); x.lineTo(x1, yb0); x.lineTo(x1, yb1); x.lineTo(x0, ya1); x.fill();
        const pic = academicCanvas(360 + id++, 200, 160);
        const ix0 = lerp(x0, x1, 0.08), ix1 = lerp(x0, x1, 0.92);
        x.setTransform((ix1 - ix0) / 200, (yb0 - ya0) / (x1 - x0) * (ix1 - ix0) / 200, 0, (ya1 - ya0) * 0.84 / 160, ix0, ya0 + (ya1 - ya0) * 0.08 + (yb0 - ya0) * 0.08);
        x.drawImage(pic, 0, 0); x.restore();
      }
      u = u1 + 0.01;
    }
    // far wall in haze
    x.fillStyle = 'rgba(200,180,160,0.5)'; x.fillRect(vp[0] - 120, 300, w - vp[0] + 120, 460);
    x.fillStyle = linear(x, 0, 760, 0, h, [[0, '#6a5440'], [1, '#2a1e14']]); x.beginPath(); x.moveTo(0, 1000); x.lineTo(vp[0] - 120, 760); x.lineTo(w, 760); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    this.crowd = []; for (let i = 0; i < 22; i++) this.crowd.push({ x: r.range(-100, W + 100), d: r(), kind: r() < 0.55 ? 'man' : 'woman', ph: r() * 6, v: r.range(-10, 10) });
    this.crowd.sort((a, b) => a.d - b.d);
  },
  draw(ctx, t, dur) {
    const u = t / dur;
    ctx.save(); camPush(ctx, u, 1.0, 1.06, 0.6, 0.45, 40);
    ctx.drawImage(this.bg, -W * 0.06, -H * 0.06);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 5; k++) { const bx = 300 + k * 320; ctx.fillStyle = linear(ctx, bx, 0, bx + 200, 900, [[0, 'rgba(255,250,235,0.18)'], [1, 'rgba(255,250,235,0)']]); ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 120, 0); ctx.lineTo(bx + 360, 900); ctx.lineTo(bx + 180, 900); ctx.fill(); }
    ctx.restore();
    // mid-ground visitors, sharp; a defocused foreground row
    const mid = canvas(W, H), fg = canvas(W, H);
    for (const p of this.crowd) {
      const near = p.d > 0.7, sc = near ? lerp(1.9, 2.4, p.d) : lerp(0.75, 1.15, p.d), base = near ? 1240 : lerp(860, 960, p.d);
      gentleman(near ? fg.ctx : mid.ctx, p.x + p.v * t, base, sc, p.kind, t, p.ph, near ? '#0a0806' : '#1c1612');
    }
    ctx.drawImage(mid, 0, 0);
    ctx.save(); ctx.filter = 'blur(9px)'; ctx.drawImage(fg, 0, 0); ctx.restore();
    motes(ctx, t, 351, 160, [0, 0, W, 900], { color: [255, 246, 226], alpha: 0.3 });
    ctx.restore();
  },
});
// 1890s visitors: proportioned silhouettes with a touch of skylight on the shoulders
function gentleman(ctx, cx, base, sc, kind, t, ph, col) {
  const sway = Math.sin(t * 0.6 + ph) * 2 * sc;
  ctx.save(); ctx.translate(cx + sway, base); ctx.scale(sc, sc); ctx.fillStyle = col;
  if (kind === 'man') {
    ctx.fillRect(-15, -232, 30, 34); ctx.fillRect(-22, -200, 44, 5);           // hat
    ctx.beginPath(); ctx.ellipse(0, -182, 15, 19, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -164); ctx.quadraticCurveTo(-42, -158, -44, -130); ctx.lineTo(-40, -40); ctx.lineTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(40, -40); ctx.lineTo(44, -130); ctx.quadraticCurveTo(42, -158, 10, -164); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(0, -176, 14, 17, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -194, 24, 8, -0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9, -160); ctx.quadraticCurveTo(-30, -150, -28, -120); ctx.quadraticCurveTo(-20, -100, -22, -92);
    ctx.quadraticCurveTo(-56, -40, -54, 0); ctx.lineTo(62, 0); ctx.quadraticCurveTo(66, -50, 30, -92); ctx.quadraticCurveTo(26, -100, 28, -120); ctx.quadraticCurveTo(30, -150, 9, -160); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,240,215,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, -150); ctx.quadraticCurveTo(0, -168, 30, -150); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ Pittsburgh: mills, furnaces, smoke over the river
BROLL.pittsburgh = painted2D({
  setup(dur) {
    const c = this.bg = canvas(W * 1.12, H * 1.12), x = c.ctx, w = c.width, h = c.height, r = RNG(370);
    x.fillStyle = linear(x, 0, 0, 0, 700, [[0, '#2a2430'], [0.6, '#7a4a3a'], [1, '#c46a3a']]); x.fillRect(0, 0, w, h);
    x.fillStyle = '#2a2026'; x.beginPath(); x.moveTo(0, 520); for (let k = 0; k <= 20; k++) x.lineTo(k * w / 20, 480 - Math.sin(k * 0.7) * 50 - r() * 30); x.lineTo(w, 760); x.lineTo(0, 760); x.fill();
    // river
    x.fillStyle = linear(x, 0, 760, 0, h, [[0, '#4a3036'], [1, '#160f12']]); x.fillRect(0, 760, w, h - 760);
    // mill buildings and stacks
    this.stacks = [];
    for (let i = 0; i < 18; i++) { const bx = r.range(0, w), bw = r.range(120, 300), bh = r.range(90, 220); x.fillStyle = '#140f10'; x.fillRect(bx, 760 - bh, bw, bh); x.beginPath(); x.moveTo(bx - 10, 760 - bh); x.lineTo(bx + bw / 2, 760 - bh - 50); x.lineTo(bx + bw + 10, 760 - bh); x.fill(); }
    for (let i = 0; i < 14; i++) { const sx = r.range(60, w - 60), sh = r.range(220, 420); x.fillStyle = '#100c0c'; x.fillRect(sx, 760 - sh, 22, sh); this.stacks.push([sx + 11, 760 - sh]); }
    // bridge
    x.strokeStyle = '#0e0a0a'; x.lineWidth = 8; x.beginPath(); x.moveTo(0, 800); x.lineTo(w, 790); x.stroke();
    for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(k * 400, 800); x.quadraticCurveTo(k * 400 + 200, 700, k * 400 + 400, 800); x.stroke(); }
    this.furn = []; for (let i = 0; i < 10; i++) this.furn.push([r.range(100, w - 100), r.range(700, 750), r() * 6]);
  },
  draw(ctx, t, dur) {
    const u = t / dur;
    ctx.save(); camPush(ctx, u, 1.0, 1.05, 0.5, 0.6, -40);
    ctx.drawImage(this.bg, -W * 0.06, -H * 0.06);
    for (const [fx, fy, ph] of this.furn) { const fl = 0.7 + 0.3 * Math.sin(t * 3 + ph); glow(ctx, fx, fy, 160 * fl, 'rgba(255,120,40,0.55)'); glow(ctx, fx, 900 + (fy - 700) * 2, 120, 'rgba(255,110,40,0.18)'); }
    for (const [sx, sy] of this.stacks) for (let k = 0; k < 10; k++) { const a = (t * 0.12 + k / 10) % 1; glow(ctx, sx + a * 260 + Math.sin(a * 5 + sx) * 30, sy - a * 320, 30 + a * 120, `rgba(60,46,50,${0.35 * (1 - a)})`, 1, 'source-over'); }
    ctx.restore();
  },
});

// ------------------------------------------------------------------ Frick's collection: panelled room, gilt frames, chandelier
BROLL.collection = painted2D({
  setup(dur) {
    const c = this.bg = canvas(W * 1.1, H * 1.1), x = c.ctx, w = c.width, h = c.height, r = RNG(380);
    x.fillStyle = '#2a1a10'; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 14; k++) { x.fillStyle = k % 2 ? '#3a2416' : '#33200f'; x.fillRect(k * 160, 0, 150, h); x.strokeStyle = 'rgba(0,0,0,0.4)'; x.strokeRect(k * 160 + 20, 760, 110, 220); }
    const frames = [[180, 220, 380, 480], [700, 160, 520, 380], [1360, 240, 360, 460], [720, 600, 260, 200], [1020, 600, 220, 200]];
    frames.forEach(([fx, fy, fw, fh], i) => { x.fillStyle = linear(x, fx, fy, fx + fw, fy + fh, [[0, '#9a7432'], [0.5, '#e0c272'], [1, '#6a4c1c']]); x.fillRect(fx, fy, fw, fh); x.drawImage(academicCanvas(390 + i, fw - 40, fh - 40), fx + 20, fy + 20); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(fx + 20, fy + 20, fw - 40, fh - 40); });
    x.fillStyle = '#1a1009'; x.fillRect(0, 980, w, h - 980);
  },
  draw(ctx, t, dur) {
    const u = t / dur;
    ctx.save(); camPush(ctx, u, 1.0, 1.06, 0.5, 0.45, -50);
    ctx.drawImage(this.bg, -W * 0.05, -H * 0.05);
    // chandelier
    const cx = 960, cy = 90;
    ctx.strokeStyle = '#6a5228'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy); ctx.stroke();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, lx = cx + Math.cos(a) * 110, ly = cy + 30 + Math.sin(a) * 26; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + Math.cos(a) * 60, cy + 50, lx, ly); ctx.stroke(); glow(ctx, lx, ly - 10, 40 * (0.9 + 0.1 * Math.sin(t * 7 + k)), 'rgba(255,200,120,0.9)'); }
    glow(ctx, cx, cy + 40, 700, 'rgba(255,190,110,0.18)');
    ctx.restore();
  },
});

// ------------------------------------------------------------------ Institut de France across the Seine at dusk
BROLL.institut = painted2D({
  setup(dur) {
    const c = this.bg = canvas(W * 1.1, H * 1.1), x = c.ctx, w = c.width, h = c.height;
    x.fillStyle = linear(x, 0, 0, 0, 700, [[0, '#1d2340'], [0.6, '#6a5a78'], [1, '#d08a62']]); x.fillRect(0, 0, w, h);
    const cx = w / 2, base = 700, col = '#17141c';
    x.fillStyle = col;
    // curved wings
    x.beginPath(); x.moveTo(cx - 820, base); x.lineTo(cx - 820, base - 150); x.quadraticCurveTo(cx - 400, base - 230, cx - 180, base - 220); x.lineTo(cx - 180, base); x.fill();
    x.beginPath(); x.moveTo(cx + 820, base); x.lineTo(cx + 820, base - 150); x.quadraticCurveTo(cx + 400, base - 230, cx + 180, base - 220); x.lineTo(cx + 180, base); x.fill();
    // portico, drum, dome, lantern
    x.fillRect(cx - 180, base - 300, 360, 300);
    x.beginPath(); x.moveTo(cx - 200, base - 300); x.lineTo(cx, base - 380); x.lineTo(cx + 200, base - 300); x.fill();
    x.fillRect(cx - 130, base - 470, 260, 100);
    x.beginPath(); x.ellipse(cx, base - 470, 140, 150, 0, Math.PI, TAU); x.fill();
    x.fillRect(cx - 22, base - 680, 44, 70); x.beginPath(); x.ellipse(cx, base - 680, 24, 26, 0, Math.PI, TAU); x.fill(); x.fillRect(cx - 3, base - 740, 6, 40);
    for (let k = -3; k <= 3; k++) { x.fillStyle = 'rgba(255,200,130,0.5)'; x.fillRect(cx + k * 44 - 8, base - 250, 16, 60); }
    // embankment and river with reflections
    x.fillStyle = '#100d14'; x.fillRect(0, base, w, 60);
    x.fillStyle = linear(x, 0, base + 60, 0, h, [[0, '#3a3046'], [1, '#0d0a10']]); x.fillRect(0, base + 60, w, h - base - 60);
    x.save(); x.globalAlpha = 0.35; x.translate(0, 2 * (base + 60)); x.scale(1, -1); x.drawImage(c, 0, 0, w, base + 60, 0, 0, w, base + 60); x.restore();
    this.lamps = []; for (let k = 0; k < 14; k++) this.lamps.push(80 + k * 150);
  },
  draw(ctx, t, dur) {
    const u = t / dur;
    ctx.save(); camPush(ctx, u, 1.0, 1.05, 0.5, 0.55, -30);
    ctx.drawImage(this.bg, -W * 0.05, -H * 0.05);
    for (const lx of this.lamps) { glow(ctx, lx, 690, 30, 'rgba(255,210,140,0.9)'); glow(ctx, lx, 690, 90, 'rgba(255,180,100,0.25)');
      ctx.fillStyle = 'rgba(255,190,110,0.18)'; for (let k = 0; k < 6; k++) ctx.fillRect(lx - 4 + Math.sin(t * 2 + k + lx) * 6, 800 + k * 40, 8, 26); }
    ctx.restore();
  },
});

// ------------------------------------------------------------------ newer art: a bright modern room, bold original abstractions; the old painting recedes
BROLL.modern = painted2D({
  setup(dur) {
    const r = RNG(400); this.abs = [];
    for (let i = 0; i < 4; i++) {
      const c = canvas(420, 540), x = c.ctx; x.fillStyle = r.pick(['#d8cfbf', '#c9b48a', '#a9b4b8']); x.fillRect(0, 0, 420, 540);
      for (let k = 0; k < 14; k++) { x.fillStyle = r.pick(['#b8432c', '#2c4a7a', '#d9a630', '#1e1a18', '#6a8a5a', '#e8e0d0', '#8a5a3a']); x.beginPath(); x.moveTo(r() * 420, r() * 540); for (let j = 0; j < r.int(3, 5); j++) x.lineTo(r() * 420, r() * 540); x.closePath(); x.fill(); }
      x.strokeStyle = '#141210'; x.lineWidth = 6; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(r() * 420, r() * 540); x.lineTo(r() * 420, r() * 540); x.stroke(); }
      this.abs.push(c);
    }
  },
  draw(ctx, t, dur) {
    const u = t / dur, shift = ease(u);
    ctx.save(); camPush(ctx, u, 1.0, 1.04, 0.5, 0.5);
    ctx.fillStyle = linear(ctx, 0, 0, 0, H, [[0, '#ece8df'], [1, '#c9c2b4']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#8a7a64'; ctx.fillRect(0, 900, W, 180);
    // the old painting at the left, light leaving it
    const pw = 520, ph = pw * PH / PW;
    ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = '#7a5c26'; ctx.fillRect(100 - 20, 300 - 20, pw + 40, ph + 40); ctx.drawImage(IMG.painting, 100, 300, pw, ph);
    ctx.fillStyle = `rgba(20,16,12,${0.15 + 0.6 * shift})`; ctx.fillRect(60, 260, pw + 80, ph + 80); ctx.restore();
    // bold new canvases arriving on the wall
    this.abs.forEach((c, i) => { const k = easeOut((t - i * 0.9) / 1.2); if (k <= 0) return; const x = 760 + i * 290, y = 260 + (1 - k) * 40; ctx.globalAlpha = k; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 10, y + 12, 240, 310); ctx.drawImage(c, x, y, 240, 310); ctx.globalAlpha = 1; });
    ctx.restore();
  },
});
