// Articulated robed walker, drawn procedurally. Faces are never detailed: figures read as backlit silhouettes with cloth detail.
'use strict';

const CLOTH = {
  undyed: { robe: [168, 150, 122], mantle: [120, 92, 66], head: [196, 182, 156], band: [70, 52, 38] },
  indigo: { robe: [150, 132, 108], mantle: [62, 70, 92], head: [184, 170, 146], band: [60, 46, 34] },
  ochre: { robe: [160, 128, 90], mantle: [138, 92, 54], head: [206, 192, 166], band: [84, 60, 40] },
  stranger: { robe: [190, 178, 156], mantle: [150, 136, 112], head: [214, 204, 184], band: [110, 92, 70] },
};
let _weave = null;
function weave() {
  if (!_weave) _weave = noiseTex(512, 512, 77, 0.035, 3, 0.7);
  return _weave;
}

// Pose at walk phase p (0..1). Units: figure height = 1, origin at ground under hips, +x forward.
function pose(p, opts) {
  const s = Math.sin(p * TAU), c = Math.cos(p * TAU);
  const stride = opts.stride ?? 1, bow = opts.bow ?? 0;
  const leg = (ph) => {
    const a = Math.sin(ph * TAU) * 0.42 * stride;           // hip swing (rad)
    const lift = Math.max(0, Math.cos(ph * TAU)) * 0.55 * stride; // knee bend while swinging forward
    const hip = [0, -0.50];
    const knee = [hip[0] + Math.sin(a) * 0.25, hip[1] + Math.cos(a) * 0.25];
    const shinA = a - lift;
    const ankle = [knee[0] + Math.sin(shinA) * 0.24, knee[1] + Math.cos(shinA) * 0.24];
    return { hip, knee, ankle, a };
  };
  const bob = -Math.abs(Math.cos(p * TAU)) * 0.012 * stride;
  return {
    near: leg(p), far: leg(p + 0.5), bob,
    armNear: -Math.sin(p * TAU) * 0.35 * stride, armFar: Math.sin(p * TAU) * 0.35 * stride,
    sway: s * 0.02 * stride, bow,
  };
}

function drawWalker(ctx, x, y, h, p, o = {}) {
  const view = o.view || 'side', dir = o.dir ?? 1, cl = o.cloth || CLOTH.undyed;
  const light = o.light ?? 1;           // +1 light from the right of screen, -1 from left (side view)
  const rim = o.rim || [255, 200, 140], rimA = o.rimA ?? 0.85, dark = o.dark ?? 0.55;
  const S = Math.ceil(h * 1.25);
  const F = canvas(S, S), f = F.ctx, M = canvas(S, S), m = M.ctx;
  const ox = S / 2, oy = S * 0.94;
  const P = pose(p, o);
  const setT = (c) => { c.setTransform(h * dir, 0, 0, h, ox, oy + P.bob * h); };
  const shade = (col, k) => rgb(col.map(v => v * (1 - dark * k)));
  const parts = view === 'side' ? sideParts : backParts;
  // colour pass
  setT(f); parts(f, P, cl, o, shade, false);
  // silhouette pass
  setT(m); parts(m, P, cl, o, shade, true);
  m.setTransform(1, 0, 0, 1, 0, 0);
  // cloth weave
  f.setTransform(1, 0, 0, 1, 0, 0);
  f.save(); f.globalCompositeOperation = 'multiply'; f.globalAlpha = 0.14;
  f.fillStyle = f.createPattern(weave(), 'repeat'); f.fillRect(0, 0, S, S); f.restore();
  f.save(); f.globalCompositeOperation = 'destination-in'; f.drawImage(M, 0, 0); f.restore();
  // rim light: silhouette minus silhouette shifted toward the light
  const R = canvas(S, S), r = R.ctx, d = Math.max(1.5, h * 0.012);
  r.drawImage(M, 0, 0);
  r.globalCompositeOperation = 'destination-out';
  if (view === 'side') r.drawImage(M, -d * light * dir * dir, d * 0.25);
  else { r.drawImage(M, 0, d * 0.9); r.globalAlpha = 0.6; r.drawImage(M, d * 0.6, d * 0.3); r.drawImage(M, -d * 0.6, d * 0.3); }
  r.globalAlpha = 1; r.globalCompositeOperation = 'source-in'; r.fillStyle = rgb(rim); r.fillRect(0, 0, S, S);
  f.save(); f.globalCompositeOperation = 'lighter'; f.globalAlpha = rimA;
  f.filter = `blur(${Math.max(0.4, h * 0.0025)}px)`; f.drawImage(R, 0, 0); f.filter = 'none';
  f.globalAlpha = rimA * 0.35; f.filter = `blur(${Math.max(1, h * 0.01)}px)`; f.drawImage(R, 0, 0); f.restore();
  if (o.haze) { f.save(); f.globalCompositeOperation = 'source-atop'; f.fillStyle = rgb(o.haze[0], o.haze[1]); f.fillRect(0, 0, S, S); f.restore(); }
  ctx.drawImage(F, x - ox, y - oy);
  return { mask: M, ox, oy };
}

function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
function limb(c, a, b, w, col) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }

function sideParts(c, P, cl, o, shade, sil) {
  const S = col => sil ? '#fff' : col;
  const bow = P.bow, gest = o.gesture || 0;
  // --- far arm
  const sh = [-0.005, -0.81 + bow * 0.02];
  const arm = (ang, near, g = 0) => {
    const el = [sh[0] + Math.sin(ang) * 0.16, sh[1] + Math.cos(ang) * 0.16];
    const fa = ang - 0.35 - g * 1.6;
    const hd = [el[0] + Math.sin(fa) * 0.15, el[1] + Math.cos(fa) * 0.15];
    return { el, hd };
  };
  const af = arm(P.armFar, false), an = arm(P.armNear, true, gest);
  limb(c, sh, af.el, 0.075, S(shade(cl.robe, 0.8)));
  limb(c, af.el, af.hd, 0.06, S(shade(cl.robe, 0.8)));
  c.fillStyle = S(shade([150, 112, 86], 0.9)); c.beginPath(); c.ellipse(af.hd[0], af.hd[1] + 0.01, 0.022, 0.03, 0, 0, TAU); c.fill();
  // staff held in far hand
  if (o.staff) {
    c.strokeStyle = S(shade([92, 70, 48], 0.6)); c.lineWidth = 0.014; c.lineCap = 'round';
    const tilt = 0.08 + P.armFar * 0.25;
    c.beginPath(); c.moveTo(af.hd[0] + Math.sin(tilt) * 0.3, af.hd[1] - 0.3); c.lineTo(af.hd[0] - Math.sin(tilt) * 0.62, af.hd[1] + 0.62 - Math.abs(P.bob) * 2); c.stroke();
  }
  // --- far leg
  const legDraw = (L, k) => {
    limb(c, L.knee, L.ankle, 0.05, S(shade([136, 100, 76], k)));
    c.fillStyle = S(shade([84, 62, 44], k)); // sandal + foot
    c.beginPath(); c.ellipse(L.ankle[0] + 0.035, L.ankle[1] + 0.006, 0.055, 0.016, Math.max(-0.4, Math.min(0.4, -L.a * 0.6)), 0, TAU); c.fill();
  };
  legDraw(P.far, 0.9);
  // --- robe (tunic)
  const fw = Math.max(P.near.knee[0], P.far.knee[0]), bw = Math.min(P.near.knee[0], P.far.knee[0]);
  const hemY = -0.10;
  const robe = new Path2D();
  robe.moveTo(0.035, -0.87 + bow * 0.03);
  robe.bezierCurveTo(0.10 + bow * 0.04, -0.80, 0.10, -0.66, 0.085, -0.55);
  robe.bezierCurveTo(0.09 + fw * 0.15, -0.38, 0.11 + fw * 0.45, -0.22, 0.12 + fw * 0.55, hemY + 0.01);
  robe.quadraticCurveTo(0.03 + fw * 0.2, hemY + 0.025, -0.02, hemY);
  robe.quadraticCurveTo(-0.08 + bw * 0.25, hemY - 0.02, -0.13 + bw * 0.5 + P.sway, hemY + 0.015);
  robe.bezierCurveTo(-0.11 + bw * 0.3, -0.30, -0.10, -0.50, -0.085, -0.60);
  robe.bezierCurveTo(-0.095, -0.72, -0.085, -0.82, -0.04, -0.875);
  robe.closePath();
  if (!sil) {
    c.fillStyle = linear(c, 0, -0.9, 0, 0, [[0, shade(cl.robe, 0.25)], [1, shade(cl.robe, 0.7)]]);
  } else c.fillStyle = '#fff';
  c.fill(robe);
  if (!sil) {
    c.save(); c.clip(robe);
    // folds that follow the striding leg
    c.strokeStyle = rgb(cl.robe.map(v => v * 0.45), 0.35); c.lineWidth = 0.006;
    for (let k = 0; k < 5; k++) {
      const x0 = -0.05 + k * 0.03;
      c.beginPath(); c.moveTo(x0, -0.52);
      c.quadraticCurveTo(x0 + fw * 0.4 + 0.01 * k, -0.30, x0 + fw * (0.5 + k * 0.08) + 0.01, hemY + 0.02); c.stroke();
    }
    c.strokeStyle = rgb(cl.robe.map(v => Math.min(255, v * 1.25)), 0.18); c.lineWidth = 0.004;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(0.02 + k * 0.03, -0.5); c.quadraticCurveTo(0.05 + fw * 0.4, -0.3, 0.07 + fw * 0.55, -0.12); c.stroke(); }
    c.restore();
  }
  // belt / sash
  c.fillStyle = S(shade(cl.band, 0.3));
  c.beginPath(); c.moveTo(-0.092, -0.56); c.lineTo(0.09, -0.555); c.lineTo(0.088, -0.525); c.lineTo(-0.094, -0.53); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-0.07, -0.53); c.quadraticCurveTo(-0.09 + P.sway * 2, -0.44, -0.075 + P.sway * 3, -0.40); c.lineWidth = 0.012; c.strokeStyle = S(shade(cl.band, 0.4)); c.stroke();
  // mantle: draped over the far shoulder, falling diagonally across the back
  const mt = new Path2D();
  mt.moveTo(0.03, -0.86); mt.bezierCurveTo(-0.02, -0.84, -0.09, -0.82, -0.10, -0.70);
  mt.bezierCurveTo(-0.115, -0.55, -0.13 + bw * 0.25 + P.sway, -0.35, -0.12 + bw * 0.35 + P.sway * 1.5, -0.22);
  mt.quadraticCurveTo(-0.06, -0.20, 0.0, -0.28);
  mt.bezierCurveTo(-0.02, -0.45, 0.02, -0.65, 0.05, -0.80); mt.closePath();
  c.fillStyle = sil ? '#fff' : linear(c, -0.1, -0.85, 0.05, -0.2, [[0, shade(cl.mantle, 0.3)], [1, shade(cl.mantle, 0.75)]]);
  c.fill(mt);
  if (!sil) {
    c.save(); c.clip(mt); c.strokeStyle = rgb(cl.mantle.map(v => v * 0.5), 0.45); c.lineWidth = 0.007;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(0.02 - k * 0.03, -0.80); c.quadraticCurveTo(-0.07 - k * 0.01, -0.55, -0.06 + bw * 0.2 - k * 0.012, -0.25); c.stroke(); }
    c.restore();
  }
  legDraw(P.near, 0.6);
  // --- head with head-cloth (profile, no features)
  const hx = 0.02 + bow * 0.05, hy = -0.925 + bow * 0.035;
  c.fillStyle = S(shade([120, 88, 64], 0.85));
  c.beginPath(); c.ellipse(hx + 0.012, hy + 0.012, 0.05, 0.062, 0.1 + bow, 0, TAU); c.fill(); // face mass
  c.beginPath(); c.moveTo(hx + 0.045, hy + 0.02); c.quadraticCurveTo(hx + 0.07, hy + 0.05, hx + 0.045, hy + 0.085); c.quadraticCurveTo(hx + 0.01, hy + 0.09, hx - 0.01, hy + 0.06); c.fill(); // beard
  c.beginPath(); c.moveTo(hx + 0.055, hy - 0.005); c.lineTo(hx + 0.07, hy + 0.018); c.lineTo(hx + 0.055, hy + 0.022); c.fill(); // nose
  const hc = new Path2D();
  hc.moveTo(hx + 0.05, hy - 0.045); hc.quadraticCurveTo(hx + 0.01, hy - 0.10, hx - 0.05, hy - 0.06);
  hc.quadraticCurveTo(hx - 0.085, hy + 0.02, hx - 0.09, hy + 0.10 + P.sway); hc.quadraticCurveTo(hx - 0.06, hy + 0.13, hx - 0.015, hy + 0.11);
  hc.quadraticCurveTo(hx - 0.005, hy + 0.03, hx + 0.02, hy - 0.01); hc.quadraticCurveTo(hx + 0.04, hy - 0.025, hx + 0.05, hy - 0.045);
  c.fillStyle = sil ? '#fff' : linear(c, hx, hy - 0.1, hx, hy + 0.1, [[0, shade(cl.head, 0.2)], [1, shade(cl.head, 0.6)]]);
  c.fill(hc);
  c.strokeStyle = S(shade(cl.band, 0.3)); c.lineWidth = 0.011;
  c.beginPath(); c.moveTo(hx + 0.045, hy - 0.04); c.quadraticCurveTo(hx, hy - 0.07, hx - 0.055, hy - 0.04); c.stroke();
  // --- near arm (sleeve over mantle)
  const sleeve = (A, k) => {
    limb(c, sh, A.el, 0.085, S(shade(cl.robe, k)));
    limb(c, A.el, A.hd, 0.07, S(shade(cl.robe, k)));
    c.fillStyle = S(shade([150, 112, 86], k + 0.1)); c.beginPath(); c.ellipse(A.hd[0] + 0.005, A.hd[1] + 0.012, 0.024, 0.032, 0, 0, TAU); c.fill();
  };
  sleeve(an, 0.45);
}

function backParts(c, P, cl, o, shade, sil) {
  const S = col => sil ? '#fff' : col;
  const sw = P.sway * 1.5;
  // legs: alternating heel lift seen from behind
  const leg = (side, ph) => {
    const lift = Math.max(0, Math.sin(ph * TAU)) * 0.05;
    const x = side * 0.035 + sw;
    c.strokeStyle = S(shade([120, 88, 64], 0.8)); c.lineWidth = 0.045; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, -0.2); c.lineTo(x, -0.03 - lift); c.stroke();
    c.fillStyle = S(shade([80, 58, 40], 0.85)); c.beginPath(); c.ellipse(x, -0.015 - lift, 0.03, 0.018, 0, 0, TAU); c.fill();
  };
  leg(-1, o.phase || 0); leg(1, (o.phase || 0) + 0.5);
  // arms swing slightly visible at sides
  const arm = (side, a) => {
    c.strokeStyle = S(shade(cl.robe, 0.6)); c.lineWidth = 0.07;
    c.beginPath(); c.moveTo(side * 0.09, -0.8); c.lineTo(side * (0.12 + Math.abs(a) * 0.04), -0.56 + a * 0.05); c.stroke();
  };
  arm(-1, P.armFar); arm(1, P.armNear);
  if (o.staff) {
    c.strokeStyle = S(shade([92, 70, 48], 0.6)); c.lineWidth = 0.014;
    c.beginPath(); c.moveTo(0.16, -1.0); c.lineTo(0.15 + P.armNear * 0.05, -0.02 - Math.abs(P.bob)); c.stroke();
  }
  const robe = new Path2D();
  robe.moveTo(-0.07, -0.86); robe.bezierCurveTo(-0.12, -0.82, -0.125, -0.6, -0.12, -0.52);
  robe.bezierCurveTo(-0.13 + sw, -0.35, -0.15 + sw, -0.2, -0.15 + sw * 1.5, -0.1);
  robe.quadraticCurveTo(0 + sw, -0.08 + Math.sin((o.phase || 0) * TAU) * 0.01, 0.15 + sw * 1.5, -0.1);
  robe.bezierCurveTo(0.15 + sw, -0.2, 0.13 + sw, -0.35, 0.12, -0.52);
  robe.bezierCurveTo(0.125, -0.6, 0.12, -0.82, 0.07, -0.86); robe.closePath();
  c.fillStyle = sil ? '#fff' : linear(c, 0, -0.9, 0, 0, [[0, shade(cl.robe, 0.35)], [1, shade(cl.robe, 0.8)]]);
  c.fill(robe);
  // mantle over shoulders with folds
  const mt = new Path2D();
  mt.moveTo(-0.08, -0.86); mt.bezierCurveTo(-0.13, -0.8, -0.135, -0.55, -0.12 + sw, -0.36);
  mt.quadraticCurveTo(0 + sw, -0.30, 0.10 + sw, -0.40); mt.bezierCurveTo(0.13, -0.6, 0.12, -0.8, 0.08, -0.86); mt.closePath();
  c.fillStyle = sil ? '#fff' : linear(c, 0, -0.86, 0, -0.3, [[0, shade(cl.mantle, 0.35)], [1, shade(cl.mantle, 0.8)]]);
  c.fill(mt);
  if (!sil) {
    c.save(); c.clip(mt); c.strokeStyle = rgb(cl.mantle.map(v => v * 0.5), 0.45); c.lineWidth = 0.008;
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 0.03, -0.84); c.quadraticCurveTo(k * 0.05 + sw, -0.6, k * 0.045 + sw * 1.2, -0.34); c.stroke(); }
    c.restore();
  }
  // head-cloth from behind, falling to shoulders
  const hb = new Path2D();
  hb.moveTo(-0.055, -0.98); hb.quadraticCurveTo(0, -1.02, 0.055, -0.98);
  hb.quadraticCurveTo(0.08, -0.9, 0.085 + sw * 0.5, -0.80); hb.quadraticCurveTo(0, -0.78, -0.085 + sw * 0.5, -0.80);
  hb.quadraticCurveTo(-0.08, -0.9, -0.055, -0.98); hb.closePath();
  c.fillStyle = sil ? '#fff' : linear(c, 0, -1.0, 0, -0.8, [[0, shade(cl.head, 0.25)], [1, shade(cl.head, 0.65)]]);
  c.fill(hb);
  c.strokeStyle = S(shade(cl.band, 0.3)); c.lineWidth = 0.012;
  c.beginPath(); c.moveTo(-0.056, -0.955); c.quadraticCurveTo(0, -0.975, 0.056, -0.955); c.stroke();
}
