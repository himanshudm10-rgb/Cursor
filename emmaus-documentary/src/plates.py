"""Procedural recreation plates. No faces, no invented portraits: environments, light, and distant silhouettes only.
Every plate is f(t, dur) -> float32 HxWx3 in [0,1]."""
import numpy as np, cv2, functools
W, H = 1920, 1080
BW, BH = 2240, 1260   # oversized canvas for camera drift

def rngf(seed): return np.random.default_rng(seed)

def fbm(h, w, seed, octaves=6, base=4, persistence=0.55):
    r = rngf(seed); out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        gh, gw = base * 2 ** o + 1, int(base * 2 ** o * w / h) + 1
        g = r.random((gh, gw)).astype(np.float32)
        out += cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC) * amp
        tot += amp; amp *= persistence
    return out / tot

def fbm1(n, seed, octaves=6, base=3):
    r = rngf(seed); out = np.zeros(n, np.float32); amp = 1.0
    for o in range(octaves):
        k = base * 2 ** o + 2
        g = r.random(k)
        out += np.interp(np.linspace(0, k - 1, n), np.arange(k), g) * amp; amp *= 0.5
    return out

def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def lerp(a, b, t): return a + (b - a) * t

def col(*c): return np.array(c, np.float32)

def cam(img, t, dur, z0=1.0, z1=1.06, dx=0.0, dy=0.0, cx=0.5, cy=0.5):
    """Crop-scale an oversized plate to 1920x1080 with an eased push and drift."""
    u = np.clip(t / max(dur, 1e-3), 0, 1.15)
    e = u if u > 1 else 0.5 - 0.5 * np.cos(np.pi * u)
    z = lerp(z0, z1, e)
    h, w = img.shape[:2]
    sw = W / z * (w / BW); sh = H / z * (h / BH)
    sw = min(sw, w); sh = min(sh, h)
    px = cx * w + dx * e * w; py = cy * h + dy * e * h
    x0 = np.clip(px - sw / 2, 0, w - sw); y0 = np.clip(py - sh / 2, 0, h - sh)
    s = W / sw
    M = np.array([[s, 0, -x0 * s], [0, s, -y0 * s]], np.float32)
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def glow(img, x, y, r, c, strength=1.0):
    h, w = img.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    d2 = ((xx - x) ** 2 + (yy - y) ** 2) / (r * r)
    img += (np.exp(-d2) * strength)[..., None] * c

# ---------------------------------------------------------------- landscape
@functools.lru_cache(4)
def landscape(kind):
    """kind: 'afternoon', 'late', 'dusk'. Returns static layers + geometry for the road plates."""
    h, w = BH, BW
    p = {"afternoon": dict(sun=(0.70, 0.30), hz=0.50, top=col(.50, .60, .72), hor=col(1.0, .86, .62), land=col(.58, .46, .33)),
         "late": dict(sun=(0.62, 0.44), hz=0.50, top=col(.42, .45, .58), hor=col(1.0, .70, .42), land=col(.50, .37, .26)),
         "dusk": dict(sun=(0.40, 0.505), hz=0.53, top=col(.20, .19, .32), hor=col(.98, .52, .30), land=col(.30, .21, .17))}[kind]
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    hz = p["hz"]
    t = np.clip(yy / hz, 0, 1) ** 1.6
    sky = lerp(p["top"], p["hor"], t[..., None]) * np.ones((h, w, 1), np.float32)
    cl = fbm(h, w, 3, 6, 2)
    streak = cv2.resize(cv2.resize(cl, (w // 16, h), interpolation=cv2.INTER_AREA), (w, h), interpolation=cv2.INTER_CUBIC)
    cloud = ss(0.52, 0.75, streak) * ss(0.05, 0.35, yy) * (1 - ss(hz * 0.8, hz, yy))
    sky = lerp(sky, sky * 0.82 + p["hor"] * 0.25, cloud[..., None] * 0.6)
    sx, sy = p["sun"][0] * w, p["sun"][1] * h
    glow(sky, sx, sy, 0.55 * h, p["hor"] * 0.55)
    glow(sky, sx, sy, 0.12 * h, col(1, .9, .7) * 0.6)
    glow(sky, sx, sy, 0.025 * h, col(1, 1, .92) * 1.6)
    img = sky.copy()
    xs = np.arange(w)
    ridge_layers = []
    # distant ridges (aerial perspective) -> near ground
    specs = [(hz - 0.06, 0.07, 0.15, 21), (hz - 0.035, 0.06, 0.30, 22), (hz - 0.01, 0.05, 0.50, 23), (hz + 0.02, 0.04, 0.72, 24)]
    for k, (base, amp, near, seed) in enumerate(specs):
        yr = (base - amp * fbm1(w, seed, 7, 2)) * h
        mask = (np.arange(h)[:, None] > yr[None, :]).astype(np.float32)
        mask = cv2.GaussianBlur(mask, (0, 0), 1.2 + 2.5 * (1 - near))
        c = lerp(p["hor"] * 0.85 + p["top"] * 0.15, p["land"] * 0.55, near)
        tex = fbm(h, w, seed + 50, 7, 8)
        layer = c * (0.85 + 0.3 * tex[..., None])
        # olive / shrub dots on the nearer ridges
        if near > 0.4:
            r = rngf(seed + 9)
            dots = np.zeros((h, w), np.float32)
            dens = fbm1(w, seed + 3, 5, 3)
            for _ in range(int(380 * near)):
                x = r.integers(0, w)
                if r.random() > dens[x] ** 2 * 1.6: continue
                y0 = yr[x] + r.random() ** 2 * (0.05 * h)
                rad = (1.5 + 3.5 * r.random()) * near
                cv2.ellipse(dots, (int(x), int(y0)), (int(max(1, rad * 1.4)), int(max(1, rad))), 0, 0, 360, float(0.5 + 0.5 * r.random()), -1, cv2.LINE_AA)
            dots = cv2.GaussianBlur(dots, (0, 0), 2.2) * mask
            layer = layer * (1 - 0.35 * dots[..., None])
        img = lerp(img, layer, mask[..., None])
        ridge_layers.append(yr)
    # foreground ground plane
    gy = (hz + 0.06) * h
    g = ss(gy - 0.02 * h, gy + 0.02 * h, np.arange(h, dtype=np.float32))[:, None]
    tex = fbm(h, w, 77, 8, 6)
    pebble = fbm(h, w, 78, 3, 120)
    ground = p["land"] * (0.75 + 0.35 * tex[..., None] + 0.12 * (pebble[..., None] - 0.5))
    depth = np.clip((np.arange(h)[:, None] - gy) / (h - gy), 0, 1)
    ground = ground * (1 - 0.45 * depth[..., None]) + p["hor"] * 0.15 * (1 - depth[..., None])
    img = lerp(img, ground, g[..., None] * np.ones((1, w, 1), np.float32))
    # road: winding from bottom to vanishing point near sun side
    vx = p["sun"][0] * w * 0.9 + 0.05 * w
    road = np.zeros((h, w), np.float32)
    ys = np.arange(int(gy), h)
    dd = (ys - gy) / (h - gy)
    cxs = vx + (0.5 * w - vx) * dd ** 1.2 + 0.08 * w * np.sin(dd * 5.0) * dd
    half = 6 + 0.32 * w * dd ** 1.25
    for y, c_, hw in zip(ys, cxs, half):
        x0, x1 = int(max(0, c_ - hw)), int(min(w, c_ + hw))
        road[y, x0:x1] = 1
    road = cv2.GaussianBlur(road, (0, 0), 3)
    rc = p["hor"] * 0.35 + p["land"] * 0.9
    rtex = fbm(h, w, 81, 6, 30)
    img = lerp(img, rc * (0.9 + 0.2 * rtex[..., None]) * (1 - 0.35 * depth[..., None]), (road * 0.85)[..., None])
    geom = dict(gy=gy, vx=vx, sun=(sx, sy), hz=hz * h, ridges=ridge_layers, hor=p["hor"], land=p["land"])
    return np.clip(img, 0, 2).astype(np.float32), geom

def road_pos(geom, s):
    """s=0 near camera, 1 at horizon -> (x, y, scale)."""
    h, w = BH, BW
    gy = geom["gy"]; vx = geom["vx"]
    dd = (1 - s) ** 2.2
    y = gy + dd * (h - gy)
    cx = vx + (0.5 * w - vx) * dd ** 1.2 + 0.08 * w * np.sin(dd * 5.0) * dd
    return cx, y, 0.06 + 0.94 * dd

def figure(img, x, y, height, phase, rim, base=col(.10, .07, .06), staff=False, hood=True):
    """Distant robed silhouette seen from behind/side. height in px. No face detail by design."""
    if height < 4: return
    S = 4  # supersample
    hgt = int(height * S); wid = int(height * 0.42 * S)
    pad = int(height * 0.6 * S)
    cw, ch = wid + 2 * pad, hgt + 2 * pad
    m = np.zeros((ch, cw), np.float32)
    bob = np.sin(phase * 2 * np.pi) * 0.012 * hgt
    sway = np.sin(phase * np.pi) * 0.05 * wid
    cx = cw // 2; top = pad + bob
    head_r = 0.085 * hgt
    hc = (int(cx), int(top + head_r))
    cv2.ellipse(m, hc, (int(head_r * (1.25 if hood else 1)), int(head_r * 1.15)), 0, 0, 360, 1, -1, cv2.LINE_AA)
    sh = top + 0.20 * hgt
    hem = top + 0.97 * hgt
    poly = np.array([[cx - 0.08 * hgt, top + 0.05 * hgt], [cx + 0.08 * hgt, top + 0.05 * hgt], [cx + 0.15 * hgt, sh], [cx + 0.17 * hgt, top + 0.55 * hgt],
                     [cx + 0.20 * hgt + sway, hem], [cx - 0.19 * hgt + sway * 0.5, hem], [cx - 0.16 * hgt, top + 0.55 * hgt], [cx - 0.15 * hgt, sh]], np.int32)
    cv2.fillPoly(m, [poly], 1, cv2.LINE_AA)
    cv2.ellipse(m, (int(cx), int(sh)), (int(0.17 * hgt), int(0.05 * hgt)), 0, 180, 360, 1, -1, cv2.LINE_AA)
    # feet hint
    fx = np.sin(phase * 2 * np.pi) * 0.06 * hgt
    cv2.ellipse(m, (int(cx + fx), int(hem)), (int(0.05 * hgt), int(0.02 * hgt)), 0, 0, 360, 1, -1, cv2.LINE_AA)
    cv2.ellipse(m, (int(cx - fx), int(hem)), (int(0.05 * hgt), int(0.02 * hgt)), 0, 0, 360, 1, -1, cv2.LINE_AA)
    if staff:
        cv2.line(m, (int(cx + 0.26 * hgt), int(top + 0.1 * hgt)), (int(cx + 0.30 * hgt + sway), int(hem + 0.02 * hgt)), 1, max(1, int(0.022 * hgt)), cv2.LINE_AA)
    m = cv2.GaussianBlur(m, (0, 0), S * 0.9)
    sm = cv2.resize(m, (cw // S, ch // S), interpolation=cv2.INTER_AREA)
    # rim light from the sun side
    rimm = np.clip(sm - np.roll(sm, -max(1, int(height * 0.04)), axis=1), 0, 1)
    ox, oy = int(x - sm.shape[1] / 2), int(y - (pad + hgt) / S)
    h, w = img.shape[:2]
    x0, y0 = max(0, ox), max(0, oy); x1, y1 = min(w, ox + sm.shape[1]), min(h, oy + sm.shape[0])
    if x1 <= x0 or y1 <= y0: return
    a = sm[y0 - oy:y1 - oy, x0 - ox:x1 - ox][..., None]
    rr = rimm[y0 - oy:y1 - oy, x0 - ox:x1 - ox][..., None]
    reg = img[y0:y1, x0:x1]
    reg[:] = reg * (1 - a) + base * a + rr * rim * 0.6
    # soft shadow on the ground
    sh_ = np.zeros_like(a[..., 0])

def dust(img, t, seed, n=160, color=col(1, .85, .6), region=None, size=(1.0, 3.5), speed=8, strength=0.5):
    r = rngf(seed); h, w = img.shape[:2]
    x0, y0, x1, y1 = region if region else (0, 0, w, h)
    px = r.random(n) * (x1 - x0) + x0; py = r.random(n) * (y1 - y0) + y0
    vx = r.normal(0.5, 1, n) * speed; vy = r.normal(-0.2, 0.6, n) * speed
    rad = r.uniform(*size, n); ph = r.random(n) * 6.28
    lay = np.zeros((h, w), np.float32)
    for i in range(n):
        x = (px[i] + vx[i] * t + 6 * np.sin(t * 0.7 + ph[i]) - x0) % (x1 - x0) + x0
        y = (py[i] + vy[i] * t + 4 * np.cos(t * 0.5 + ph[i]) - y0) % (y1 - y0) + y0
        tw = 0.5 + 0.5 * np.sin(t * 1.3 + ph[i])
        cv2.circle(lay, (int(x * 4), int(y * 4)), int(rad[i] * 4), float(tw), -1, cv2.LINE_AA, shift=2)
    lay = cv2.GaussianBlur(lay, (0, 0), 1.5)
    img += lay[..., None] * color * strength

def plate_road(t, dur, kind="afternoon", walkers=2, stranger=None, z=(1.0, 1.07), dx=0.03, s_range=(0.25, 0.35), houses=False, seed=0):
    base, g = landscape(kind)
    img = base.copy()
    if houses:
        _houses(img, g, seed=5, n=7, lit=False)
    sx, sy = g["sun"]
    rim = g["hor"] * 1.2
    u = t / max(dur, 1e-3)
    s0 = lerp(s_range[0], s_range[1], u)
    ws = [(s0, -0.010), (s0 + 0.004, 0.012)][:walkers]
    if stranger is not None:
        # stranger: joins from a side path. stranger(u) -> (s, lateral offset) or None
        st = stranger(u)
        if st is not None: ws.append(st)
    ws.sort(key=lambda a: -a[0])
    for k, (s, off) in enumerate(ws):
        x, y, sc = road_pos(g, s)
        x += off * BW * sc * 3
        hgt = 170 * sc
        haze = np.clip(1 - sc * 1.6, 0, 0.55)
        base_c = col(.10, .07, .06) * (1 - haze) + g["hor"] * 0.55 * haze
        sh = np.zeros(img.shape[:2], np.float32)
        cv2.ellipse(sh, (int(x), int(y + hgt * 0.10)), (int(hgt * 0.16), int(hgt * 0.30)), 0, 0, 360, 1, -1, cv2.LINE_AA)
        sh = cv2.GaussianBlur(sh, (0, 0), max(1, hgt * 0.05))
        img *= (1 - 0.35 * sh[..., None])
        figure(img, x, y, hgt, (t * 0.82 + k * 0.37) % 1.0, rim, base=base_c, staff=(k == 1))
    dust(img, t, seed + 1, 140, g["hor"], region=(0, int(g["hz"] - 300), BW, BH), size=(1.0, 3.0), speed=6, strength=0.35)
    return cam(img, t, dur, z[0], z[1], dx=dx)

def _houses(img, g, seed, n, lit, scale=1.0, xr=(0.12, 0.9), on_ridge=2):
    r = rngf(seed); h, w = img.shape[:2]
    yr = g["ridges"][on_ridge]
    land = g["land"]; hor = g["hor"]
    xs = np.sort(r.uniform(xr[0] * w, xr[1] * w, n))
    for x in xs:
        bw = r.uniform(40, 90) * scale; bh = r.uniform(28, 55) * scale
        yb = yr[int(x)] + r.uniform(8, 30) * scale
        x0, x1 = int(x - bw / 2), int(x + bw / 2); y0 = int(yb - bh)
        stone = land * 0.75 + hor * 0.08
        cv2.rectangle(img, (x0, y0), (x1, int(yb)), stone.tolist(), -1, cv2.LINE_AA)
        sunside = int(x0 + bw * 0.62)
        cv2.rectangle(img, (sunside, y0), (x1, int(yb)), (stone * 1.35 + hor * 0.1).tolist(), -1, cv2.LINE_AA)
        cv2.line(img, (x0 - 2, y0), (x1 + 2, y0), (stone * 0.6).tolist(), max(1, int(3 * scale)), cv2.LINE_AA)
        if lit and r.random() < 0.7:
            wx = int(x0 + bw * r.uniform(0.2, 0.5)); wy = int(y0 + bh * 0.4)
            cv2.rectangle(img, (wx, wy), (wx + int(7 * scale), wy + int(10 * scale)), (1.6, 1.0, 0.45), -1, cv2.LINE_AA)
        if r.random() < 0.6:
            dx_ = int(x0 + bw * 0.25)
            cv2.rectangle(img, (dx_, int(yb - bh * 0.55)), (dx_ + int(10 * scale), int(yb)), (stone * 0.35).tolist(), -1, cv2.LINE_AA)

def plate_village(t, dur):
    base, g = landscape("dusk")
    img = base.copy()
    _houses(img, g, 9, 9, True, scale=1.6, xr=(0.30, 0.95), on_ridge=3)
    # doorway warm light, figures arriving
    gy = g["gy"]
    door = (int(0.70 * BW), int(g["ridges"][3][int(0.70 * BW)] + 60))
    cv2.rectangle(img, (door[0] - 12, door[1] - 46), (door[0] + 12, door[1]), (1.5, 0.95, 0.5), -1, cv2.LINE_AA)
    glow(img, door[0], door[1] - 20, 70, col(1, .6, .3), 0.35)
    u = t / dur
    for k in range(3):
        fx = lerp(0.52, 0.66, u) * BW - k * 26
        fy = door[1] + 6 + k * 3
        figure(img, fx, fy, 64 - k * 3, (t * 0.8 + k * .33) % 1, g["hor"] * 1.1, staff=(k == 2))
    # chimney smoke
    sm = fbm(BH, BW, int(t * 2) % 50 + 300, 4, 6)
    dust(img, t, 31, 60, col(1, .7, .45), region=(0, int(gy - 250), BW, BH), speed=4, strength=0.25)
    return cam(img, t, dur, 1.0, 1.05, dx=0.02, cy=0.52)

# ---------------------------------------------------------------- interior: table, candle, smoke
@functools.lru_cache(2)
def table_base(lit):
    h, w = BH, BW
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    wall = col(.16, .10, .07) * (0.6 + 0.6 * fbm(h, w, 41, 7, 5)[..., None])
    stone = fbm(h, w, 42, 3, 40)
    wall = wall * (0.85 + 0.3 * stone[..., None])
    ty = 0.60 * h
    tm = ss(ty - 2, ty + 2, np.arange(h, dtype=np.float32))[:, None] * np.ones((1, w), np.float32)
    grain = cv2.resize(fbm(h // 2, w // 16, 43, 6, 3), (w, h), interpolation=cv2.INTER_CUBIC)
    wood = col(.36, .22, .12) * (0.7 + 0.6 * grain[..., None])
    img = lerp(wall, wood, tm[..., None])
    # table edge highlight
    cv2.line(img, (0, int(ty)), (w, int(ty)), (0.5, 0.33, 0.2), 2, cv2.LINE_AA)
    # bowl and cup (earthenware), simple forms
    for (bx, by, rw, rh) in [(0.30, 0.66, 150, 46), (0.74, 0.64, 70, 26)]:
        cx, cy = int(bx * w), int(by * h)
        cv2.ellipse(img, (cx, cy + rh), (rw, int(rh * 0.9)), 0, 0, 180, (0.30, 0.17, 0.10), -1, cv2.LINE_AA)
        cv2.rectangle(img, (cx - rw, cy), (cx + rw, cy + rh), (0.30, 0.17, 0.10), -1, cv2.LINE_AA)
        cv2.ellipse(img, (cx, cy), (rw, int(rh * 0.45)), 0, 0, 360, (0.40, 0.24, 0.14), -1, cv2.LINE_AA)
        cv2.ellipse(img, (cx, cy + 3), (int(rw * 0.85), int(rh * 0.33)), 0, 0, 360, (0.24, 0.14, 0.08), -1, cv2.LINE_AA)
    # candle body
    cx, cy = int(0.52 * w), int(0.60 * h)
    cv2.rectangle(img, (cx - 22, cy - 190), (cx + 22, cy + 8), (0.82, 0.74, 0.58), -1, cv2.LINE_AA)
    cv2.ellipse(img, (cx, cy + 8), (60, 14), 0, 0, 360, (0.25, 0.16, 0.09), -1, cv2.LINE_AA)
    cv2.line(img, (cx, cy - 190), (cx, cy - 206), (0.08, 0.05, 0.03), 3, cv2.LINE_AA)
    # candle light falloff on everything
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((X - cx) ** 2 + ((Y - (cy - 215)) * 1.15) ** 2) / h
    light = np.exp(-d * 2.6) * 1.3 + 0.12 if lit else np.exp(-d * 3.0) * 0.55 + 0.10
    img = img * light[..., None]
    img = cv2.GaussianBlur(img, (0, 0), 0.8)
    # depth of field: blur the wall
    blur = cv2.GaussianBlur(img, (0, 0), 6)
    img = lerp(blur, img, tm[..., None] * 0.9 + 0.1)
    return img.astype(np.float32), (cx, cy - 206)

def plate_table(t, dur, lit=True, z=(1.0, 1.08)):
    img, (fx, fy) = table_base(lit)
    img = img.copy()
    if lit:
        fl = 1 + 0.06 * np.sin(t * 9.1) + 0.04 * np.sin(t * 15.7 + 1) + 0.03 * np.sin(t * 23.3)
        img *= (0.94 + 0.06 * fl)
        flame = np.zeros(img.shape[:2], np.float32)
        lean = 3 * np.sin(t * 1.7)
        cv2.ellipse(flame, (int(fx + lean), int(fy - 28)), (11, 34), 0, 0, 360, 1, -1, cv2.LINE_AA)
        flame = cv2.GaussianBlur(flame, (0, 0), 3)
        img += flame[..., None] * col(1.6, 1.15, 0.55) * fl
        glow(img, fx, fy - 25, 120, col(1, .6, .25), 0.45 * fl)
        dust(img, t, 51, 50, col(1, .7, .4), region=(int(fx - 500), int(fy - 400), int(fx + 500), int(fy + 100)), size=(0.8, 2.0), speed=3, strength=0.25)
    else:
        _smoke(img, t, fx, fy)
    return cam(img, t, dur, z[0], z[1], cy=0.5)

def _smoke(img, t, fx, fy):
    h, w = img.shape[:2]
    lay = np.zeros((h, w), np.float32)
    pts = []
    for i in range(140):
        a = i / 140
        y = fy - a * 700
        x = fx + 40 * a * np.sin(a * 7 - t * 1.3) + 90 * a ** 2 * np.sin(a * 3.1 + t * 0.4)
        pts.append((x, y))
    for i in range(len(pts) - 1):
        a = i / len(pts)
        cv2.line(lay, (int(pts[i][0] * 4), int(pts[i][1] * 4)), (int(pts[i + 1][0] * 4), int(pts[i + 1][1] * 4)),
                 float((1 - a) ** 1.5), int(4 + 30 * a), cv2.LINE_AA, shift=2)
    lay = cv2.GaussianBlur(lay, (0, 0), 6)
    fade = np.clip(1 - t / 9, 0.25, 1)
    img += lay[..., None] * col(.55, .55, .6) * 0.35 * fade

# ---------------------------------------------------------------- backlit figure demo
@functools.lru_cache(1)
def backlit_base():
    h, w = BH, BW
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    sky = lerp(col(.45, .40, .50), col(1.0, .78, .45), np.clip(yy / 0.62, 0, 1)[..., None] ** 1.4) * np.ones((h, w, 1), np.float32)
    img = sky.copy()
    yr = (0.60 - 0.05 * fbm1(w, 91, 6, 2)) * h
    mask = (np.arange(h)[:, None] > yr[None, :]).astype(np.float32)
    img = lerp(img, col(.55, .38, .30) * 0.9, cv2.GaussianBlur(mask, (0, 0), 3)[..., None])
    sx, sy = 0.5 * w, 0.30 * h
    glow(img, sx, sy, 0.6 * h, col(1, .7, .4), 0.6)
    glow(img, sx, sy, 0.16 * h, col(1, .9, .7), 0.9)
    glow(img, sx, sy, 0.05 * h, col(1, 1, .9), 1.5)
    # seated figure silhouette: head, neck, shoulders, arms resting on table
    m = np.zeros((h, w), np.float32)
    cx = int(0.5 * w)
    cv2.ellipse(m, (cx, int(0.33 * h)), (int(0.052 * h), int(0.068 * h)), 0, 0, 360, 1, -1, cv2.LINE_AA)
    cv2.ellipse(m, (cx, int(0.36 * h)), (int(0.068 * h), int(0.10 * h)), 0, 0, 360, 1, -1, cv2.LINE_AA)  # hair / beard mass
    poly = np.array([[cx - 0.04 * h, 0.40 * h], [cx + 0.04 * h, 0.40 * h], [cx + 0.25 * h, 0.52 * h], [cx + 0.30 * h, 0.75 * h],
                     [cx - 0.30 * h, 0.75 * h], [cx - 0.25 * h, 0.52 * h]], np.int32)
    cv2.fillPoly(m, [poly], 1, cv2.LINE_AA)
    m = cv2.GaussianBlur(m, (0, 0), 2.5)
    rim = np.clip(m - cv2.GaussianBlur(m, (0, 0), 6), 0, 1) * 2
    body = col(.06, .045, .04)
    img = img * (1 - m[..., None]) + body * m[..., None] + rim[..., None] * col(1, .7, .4) * 0.9
    # table
    ty = int(0.72 * h)
    tb = np.zeros((h, w), np.float32); tb[ty:] = 1
    cloth = col(.30, .27, .22) * (0.8 + 0.3 * fbm(h, w, 92, 5, 6)[..., None])
    img = lerp(img, cloth * lerp(1.0, 0.5, np.clip((yy - 0.72) / 0.28, 0, 1))[..., None], tb[..., None])
    cv2.line(img, (0, ty), (w, ty), (0.9, 0.7, 0.45), 2, cv2.LINE_AA)
    return img.astype(np.float32)

def plate_backlit(t, dur):
    img = backlit_base().copy()
    dust(img, t, 93, 90, col(1, .85, .6), size=(1, 2.5), speed=4, strength=0.3)
    return cam(img, t, dur, 1.0, 1.06, cy=0.48)

# ---------------------------------------------------------------- studio, palette
@functools.lru_cache(1)
def studio_base():
    h, w = BH, BW
    img = col(.10, .085, .075) * (0.7 + 0.5 * fbm(h, w, 61, 7, 4)[..., None]) * np.ones((h, w, 1), np.float32)
    # tall north window, left
    wx0, wx1, wy0, wy1 = int(0.06 * w), int(0.36 * w), int(0.04 * h), int(0.80 * h)
    win = np.zeros((h, w), np.float32)
    cv2.rectangle(win, (wx0, wy0), (wx1, wy1), 1, -1)
    for k in range(1, 4):
        x = wx0 + (wx1 - wx0) * k // 4; cv2.line(win, (x, wy0), (x, wy1), 0, 10)
    for k in range(1, 6):
        y = wy0 + (wy1 - wy0) * k // 6; cv2.line(win, (wx0, y), (wx1, y), 0, 10)
    win = cv2.GaussianBlur(win, (0, 0), 3)
    skyc = col(.80, .86, .92)
    img = lerp(img, skyc * 0.62, win[..., None])
    # light beam diagonal to floor
    beam = np.zeros((h, w), np.float32)
    poly = np.array([[wx0, wy0], [wx1, wy0], [int(0.95 * w), h], [int(0.30 * w), h]], np.int32)
    cv2.fillPoly(beam, [poly], 1)
    beam = cv2.GaussianBlur(beam, (0, 0), 40) * (0.5 + 0.5 * fbm(h, w, 62, 4, 3))
    img += beam[..., None] * col(.9, .85, .75) * 0.22
    # easel with canvas, right of centre
    ex = int(0.66 * w)
    cv2.line(img, (ex - 120, h), (ex - 20, int(0.18 * h)), (0.18, 0.11, 0.07), 14, cv2.LINE_AA)
    cv2.line(img, (ex + 140, h), (ex + 30, int(0.18 * h)), (0.18, 0.11, 0.07), 14, cv2.LINE_AA)
    cv2.line(img, (ex, int(0.15 * h)), (ex + 10, h), (0.16, 0.10, 0.06), 12, cv2.LINE_AA)
    cnv = np.array([[ex - 230, int(0.24 * h)], [ex + 250, int(0.21 * h)], [ex + 250, int(0.64 * h)], [ex - 230, int(0.66 * h)]], np.int32)
    cm = np.zeros((h, w), np.float32); cv2.fillPoly(cm, [cnv], 1, cv2.LINE_AA)
    ctex = col(.58, .53, .44) * (0.93 + 0.10 * fbm(h, w, 63, 5, 6)[..., None])
    img = lerp(img, ctex, cm[..., None])
    cv2.line(img, (ex - 260, int(0.665 * h)), (ex + 280, int(0.645 * h)), (0.2, 0.12, 0.07), 16, cv2.LINE_AA)
    # light on canvas from window
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    lit = np.exp(-((X - wx1) ** 2 + (Y - 0.4 * h) ** 2) / (2 * (0.55 * w) ** 2))
    img = img * (0.35 + 0.9 * lit[..., None])
    img = lerp(img, skyc * 0.66, win[..., None] * 0.7)
    img += cv2.GaussianBlur(win, (0, 0), 30)[..., None] * skyc * 0.35
    return img.astype(np.float32)

def plate_studio(t, dur):
    img = studio_base().copy()
    dust(img, t, 64, 220, col(.95, .92, .85), region=(int(0.1 * BW), 0, int(0.9 * BW), BH), size=(0.8, 2.4), speed=3, strength=0.45)
    return cam(img, t, dur, 1.0, 1.07, dx=0.02)

def plate_palette(t, dur):
    h, w = BH, BW
    r = rngf(70)
    img = col(.40, .26, .15) * (0.75 + 0.4 * cv2.resize(fbm(h // 2, w // 12, 71, 6, 3), (w, h))[..., None])
    blobs = [(0.22, 0.30, (0.92, 0.88, 0.80)), (0.36, 0.22, (0.85, 0.65, 0.20)), (0.52, 0.20, (0.70, 0.30, 0.12)),
             (0.68, 0.25, (0.45, 0.15, 0.10)), (0.80, 0.36, (0.12, 0.15, 0.30)), (0.85, 0.55, (0.10, 0.08, 0.06))]
    for bx, by, c in blobs:
        m = np.zeros((h, w), np.float32)
        for k in range(5):
            cv2.circle(m, (int(bx * w + r.normal(0, 18)), int(by * h + r.normal(0, 12))), int(r.uniform(30, 52)), 1, -1, cv2.LINE_AA)
        m = cv2.GaussianBlur(m, (0, 0), 3)
        img = lerp(img, np.array(c, np.float32) * (0.9 + 0.2 * fbm(h, w, int(bx * 100), 3, 30)[..., None]), m[..., None])
        glow(img, bx * w - 20, by * h - 18, 14, col(1, 1, 1), 0.25 * m[int(by * h), int(bx * w)])
    # mixing swirl: two pigments folding together over time
    u = np.clip(t / dur, 0, 1)
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    mx, my = 0.50 * w, 0.62 * h
    dx, dy = X - mx, Y - my
    rad = np.sqrt(dx ** 2 + (dy * 1.3) ** 2)
    ang = np.arctan2(dy, dx) + (1.2 + 5 * u) * np.exp(-rad / 160)
    band = 0.5 + 0.5 * np.sin(ang * 2 + rad / 25)
    mixc = lerp(col(.85, .62, .35), col(.55, .22, .12), (band * (1 - u) + 0.5 * u)[..., None])
    mm = ss(240, 200, rad)
    img = lerp(img, mixc, mm[..., None])
    Yl = np.exp(-((X - 0.3 * w) ** 2 + (Y - 0.2 * h) ** 2) / (2 * (0.6 * w) ** 2))
    img = img * (0.45 + 0.75 * Yl[..., None])
    return cam(img.astype(np.float32), t, dur, 1.02, 1.10, dx=-0.01)

# ---------------------------------------------------------------- church & votive candles
@functools.lru_cache(1)
def church_base():
    h, w = BH, BW
    img = col(.07, .055, .05) * (0.7 + 0.5 * fbm(h, w, 81, 7, 4)[..., None]) * np.ones((h, w, 1), np.float32)
    blocks = np.zeros((h, w), np.float32)
    for y in range(0, h, 46):
        off = 0 if (y // 46) % 2 else 40
        for x in range(-off, w, 80): cv2.rectangle(blocks, (x + 2, y + 2), (x + 78, y + 44), 1, -1)
    img *= (0.75 + 0.25 * cv2.GaussianBlur(blocks, (0, 0), 2))[..., None]
    win = np.zeros((h, w), np.float32)
    for wx in (0.30, 0.62):
        x0, x1 = int(wx * w), int((wx + 0.07) * w); y0, y1 = int(0.12 * h), int(0.55 * h)
        cv2.rectangle(win, (x0, y0 + (x1 - x0) // 2), (x1, y1), 1, -1, cv2.LINE_AA)
        cv2.ellipse(win, ((x0 + x1) // 2, y0 + (x1 - x0) // 2), ((x1 - x0) // 2, (x1 - x0) // 2), 0, 180, 360, 1, -1, cv2.LINE_AA)
        cv2.line(win, ((x0 + x1) // 2, y0), ((x0 + x1) // 2, y1), 0.3, 4)
    winc = col(1.2, .95, .6)
    beam = np.zeros((h, w), np.float32)
    for wx in (0.30, 0.62):
        x0 = int(wx * w); x1 = int((wx + 0.07) * w)
        poly = np.array([[x0, int(0.2 * h)], [x1, int(0.2 * h)], [x1 + int(0.25 * w), h], [x0 + int(0.12 * w), h]], np.int32)
        cv2.fillPoly(beam, [poly], 1)
    beam = cv2.GaussianBlur(beam, (0, 0), 35) * (0.5 + 0.6 * fbm(h, w, 82, 4, 3))
    img += beam[..., None] * col(1, .8, .5) * 0.18
    glass = 0.75 + 0.35 * fbm(h, w, 84, 3, 60)
    img = lerp(img, winc * glass[..., None], cv2.GaussianBlur(win, (0, 0), 2.5)[..., None])
    img += cv2.GaussianBlur(win, (0, 0), 45)[..., None] * col(1, .7, .4) * 0.5
    # columns
    for cx_ in (0.12, 0.47, 0.86):
        x = int(cx_ * w)
        cv2.rectangle(img, (x - 55, 0), (x + 55, h), (0.04, 0.03, 0.028), -1)
        cv2.rectangle(img, (x - 55, 0), (x - 40, h), (0.09, 0.07, 0.05), -1)
    floor = ss(0.80 * h, 0.83 * h, np.arange(h, dtype=np.float32))[:, None, None]
    img = lerp(img, img * 0.6 + col(.1, .07, .05) * 0.3, floor)
    return img.astype(np.float32)

def plate_church(t, dur):
    img = church_base().copy()
    dust(img, t, 83, 200, col(1, .85, .6), region=(int(0.25 * BW), int(0.15 * BH), int(0.95 * BW), BH), size=(0.8, 2.2), speed=2.5, strength=0.4)
    return cam(img, t, dur, 1.0, 1.06, dx=0.015, cy=0.45)

def plate_votive(t, dur):
    h, w = BH, BW
    img = col(.05, .03, .025) * np.ones((h, w, 3), np.float32)
    r = rngf(100)
    lay = np.zeros((h, w), np.float32)
    for row in range(5):
        y = 0.55 * h + row * 0.09 * h
        n = 9 + row * 2
        for k in range(n):
            x = (k + 0.5 + r.normal(0, 0.15)) / n * w
            fl = 0.8 + 0.2 * np.sin(t * (6 + r.random() * 6) + r.random() * 6)
            rad = 10 + row * 7
            depth_blur = abs(row - 2)
            cv2.circle(lay, (int(x), int(y)), int(rad * (1 + 0.6 * depth_blur)), float(fl * (0.6 if depth_blur else 1.0)), -1, cv2.LINE_AA)
    lay = cv2.GaussianBlur(lay, (0, 0), 7)
    img += lay[..., None] * col(1.2, .7, .3) * 0.9
    glow(img, w * 0.5, h * 0.72, 0.5 * h, col(1, .5, .2), 0.18)
    return cam(img, t, dur, 1.0, 1.05, cy=0.55)

# ---------------------------------------------------------------- galleries (the painting itself hangs in them)
def gallery(t, dur, painting, mood="museum", z=(1.0, 1.12)):
    h, w = BH, BW
    key = (mood,)
    base = _gallery_base(mood, painting.shape)
    img = base[0].copy()
    (x0, y0, x1, y1) = base[1]
    p = cv2.resize(painting, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    lightf = 1.0 if mood != "dim" else 0.55
    img[y0:y1, x0:x1] = p * np.minimum(base[2][y0:y1, x0:x1, None], 0.92) * lightf
    return cam(img, t, dur, z[0], z[1], cy=0.47)

@functools.lru_cache(4)
def _gallery_base(mood, pshape):
    h, w = BH, BW
    wallc = {"museum": col(.20, .17, .15), "salon": col(.22, .09, .07), "dim": col(.12, .12, .13)}[mood]
    img = wallc * (0.85 + 0.25 * fbm(h, w, 111, 5, 4)[..., None]) * np.ones((h, w, 1), np.float32)
    ph, pw = pshape[:2]
    pw_ = int(0.42 * w); ph_ = int(pw_ * ph / pw)
    x0 = (w - pw_) // 2; y0 = int(0.40 * h) - ph_ // 2
    fr = 34
    cv2.rectangle(img, (x0 - fr, y0 - fr), (x0 + pw_ + fr, y0 + ph_ + fr), (0.55, 0.40, 0.18), -1, cv2.LINE_AA)
    cv2.rectangle(img, (x0 - fr + 8, y0 - fr + 8), (x0 + pw_ + fr - 8, y0 + ph_ + fr - 8), (0.38, 0.27, 0.12), 6, cv2.LINE_AA)
    if mood == "salon":
        r = rngf(112)
        for k in range(26):
            fw = int(r.uniform(120, 320)); fh = int(fw * r.uniform(0.6, 1.3))
            fx = int(r.uniform(0, w - fw)); fy = int(r.uniform(0.02 * h, 0.75 * h - fh))
            if fx + fw > x0 - 80 and fx < x0 + pw_ + 80 and fy + fh > y0 - 80 and fy < y0 + ph_ + 80: continue
            cv2.rectangle(img, (fx, fy), (fx + fw, fy + fh), (0.50, 0.36, 0.15), -1, cv2.LINE_AA)
            v = r.uniform(0.10, 0.30); inner = col(v * 1.1, v * 0.9, v * 0.7)
            cv2.rectangle(img, (fx + 12, fy + 12), (fx + fw - 12, fy + fh - 12), inner.tolist(), -1, cv2.LINE_AA)
        img = cv2.GaussianBlur(img, (0, 0), 3.5)
    # floor
    fy = int(0.80 * h)
    floor = col(.22, .15, .10) * (0.8 + 0.3 * cv2.resize(fbm(h // 4, w // 20, 113, 5, 3), (w, h))[..., None])
    fm = ss(fy - 3, fy + 3, np.arange(h, dtype=np.float32))[:, None, None]
    img = lerp(img, floor, fm)
    # bench silhouette
    cv2.rectangle(img, (int(0.36 * w), int(0.86 * h)), (int(0.64 * w), int(0.89 * h)), (0.05, 0.035, 0.03), -1, cv2.LINE_AA)
    for lx in (0.38, 0.62):
        cv2.rectangle(img, (int(lx * w) - 8, int(0.89 * h)), (int(lx * w) + 8, int(0.97 * h)), (0.04, 0.03, 0.025), -1)
    # spotlight pool
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    cx_, cy_ = w / 2, y0 + ph_ / 2
    spot = np.exp(-(((X - cx_) / (0.42 * w)) ** 2 + ((Y - cy_) / (0.45 * h)) ** 2))
    amb = {"museum": 0.25, "salon": 0.55, "dim": 0.12}[mood]
    if mood == "salon":
        sky = np.exp(-((Y / (0.35 * h)) ** 2)) * 0.5
        spot = spot * 0.7 + sky
    lightmap = amb + (1.15 if mood != "dim" else 0.6) * spot
    img = img * lightmap[..., None]
    return img.astype(np.float32), (x0, y0, x0 + pw_, y0 + ph_), lightmap.astype(np.float32)

PLATES = dict(road=plate_road, village=plate_village, table=plate_table, backlit=plate_backlit, studio=plate_studio,
              palette=plate_palette, church=plate_church, votive=plate_votive)
