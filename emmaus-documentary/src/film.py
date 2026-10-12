"""Edit decision list + renderer for 'Strangest Painting of Jesus'.
Shots are placed on narration timestamps (n) and mapped to film time with timeline.n2g."""
import numpy as np, cv2, functools, subprocess, sys, os, json
from PIL import Image, ImageDraw, ImageFont
from timeline import n2g as G, INS, TOTAL, FPS, W, H, NARR_END
import plates as P

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = f"{HERE}/fonts"

# ----------------------------------------------------------------- source painting
@functools.lru_cache(1)
def painting():
    im = cv2.cvtColor(cv2.imread(f"{HERE}/painting_src.png"), cv2.COLOR_BGR2RGB)
    im = im[:1370]                     # remove the reseller watermark strip along the bottom edge
    return (im.astype(np.float32) / 255.0)
PH, PW = 1370, 2000
SURROUND = np.array([0.018, 0.015, 0.014], np.float32)

def view(cx, cy, w, out_w=W, out_h=H, img=None):
    img = painting() if img is None else img
    cx, cy, w = cview(cx, cy, w, out_w, out_h)
    s = out_w / w
    M = np.array([[s, 0, out_w / 2 - cx * s], [0, s, out_h / 2 - cy * s]], np.float32)
    interp = cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC
    if s < 1:
        # exact (unquantised) scale: anti-alias with a blur matched to the shrink, then one affine warp
        sig = 0.5 * (1 / s - 1) + 0.25
        src = cv2.GaussianBlur(img, (0, 0), sig)
        return cv2.warpAffine(src, M, (out_w, out_h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=SURROUND.tolist())
    return cv2.warpAffine(img, M, (out_w, out_h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=SURROUND.tolist())

def cview(cx, cy, w, out_w=W, out_h=H):
    """keep a view inside the canvas; continuous, so interpolated moves never jump"""
    h = w * out_h / out_w
    cx = PW / 2 if w / 2 > PW - w / 2 else min(max(cx, w / 2), PW - w / 2)
    cy = PH / 2 if h / 2 > PH - h / 2 else min(max(cy, h / 2), PH - h / 2)
    return cx, cy, w

def ease(u):
    u = np.clip(u, 0, 1); return 0.5 - 0.5 * np.cos(np.pi * u)

def interp_keys(keys, u):
    """keys: [(u, value tuple)] -> eased interpolation."""
    if u <= keys[0][0]: return np.array(keys[0][1], float)
    for (u0, a), (u1, b) in zip(keys[:-1], keys[1:]):
        if u <= u1:
            e = ease((u - u0) / max(u1 - u0, 1e-6))
            return np.array(a, float) + (np.array(b, float) - np.array(a, float)) * e
    return np.array(keys[-1][1], float)

# ----------------------------------------------------------------- named views on the painting (cx, cy, width)
FULL = (1000, 685, 2436); WIDE = (1000, 685, 2900)
FACE = (930, 390, 520); FACE_T = (930, 385, 440)
JES_M = (930, 470, 1000); JES_W = (930, 560, 1400)
LEFT = (232, 540, 620); LEFT_T = (228, 505, 470)
RIGHT = (1310, 590, 620); RIGHT_T = (1300, 545, 440)
SERV = (390, 300, 620); SERV_T = (360, 240, 470)
FAM = (1810, 545, 780); FAM_W = (1760, 545, 920)
MAN = (1792, 250, 430); WOMAN = (1850, 535, 400); BOY = (1918, 572, 400)
HANDS = (930, 760, 1100); LAND = (640, 320, 520); SKY = (930, 250, 1100)

# ----------------------------------------------------------------- the edit
SHOTS = []
def S(n, kind, xf=0.8, g=None, **kw):
    SHOTS.append(dict(g=G(n) if g is None else g, n=n, kind=kind, xf=xf, **kw))

def gap_start(n_ins):
    for t, d in INS:
        if abs(t - n_ins) < 0.6: return G(t) - d
    raise KeyError(n_ins)

def Pn(n, keys, xf=0.8, **kw):
    """painting shot; keys either a single view or [(u, view), ...]"""
    if not isinstance(keys[0], tuple) or not isinstance(keys[0][1], tuple): keys = [(0, keys), (1, keys)]
    keys = [(u, cview(*k)) for u, k in keys]
    S(n, "P", xf, keys=keys, **kw)

def J(n, scene, xf=0.8, g=None, **opts):
    """shot rendered by the JS engine (headless Chromium) into js_frames/<id>/"""
    S(n, "seq", xf, g=g, scene=scene, opts=opts)

# 1. Opening
J(-3.5, "p_open", 0, g=0.0)
J(12.70, "p_ghost", 0)
J(16.62, "p_triptych", 0.35)
J(19.70, "p_corner", 0.7)
J(27.30, "p_born", 0.6)
Pn(30.48, [(0, (930, 170, 800)), (1, (930, 215, 920))], xf=1.4, expk=[(0, -0.8)], vig=0.45)
# 2. What is happening in the painting
J(35.15, "p_read", 1.2, beats=[[0, "all"], [42.31 - 35.15, "jesus"], [43.91 - 35.15, "bread"], [45.27 - 35.15, "men"], [47.03 - 35.15, "woman"]])
J(48.79, "p_loupe", 0.8, stops=[[0, 225, 500], [3.9, 225, 500], [4.9, 1293, 540], [7.8, 1293, 540], [8.8, 338, 212], [12.5, 338, 212]])
J(61.29, "p_compare", 0.8, split=62.57 - 61.29)
J(66.41, "p_glow", 0.9)
J(75.13, "p_present", 1.0)
# 3. The road to Emmaus (painted 3D reconstruction)
Pn(88.41, [(0, (1180, 330, 760)), (1, (1235, 305, 340))], xf=1.0, warm=0.08)
J(92.46, "road_wide", 1.8)
J(97.10, "track_two", 1.0)
J(102.78, "road_join", 1.0)
J(107.69, "track_three", 1.0)
J(114.41, "timelapse", 1.2)
J(124.18, "village", 1.2)
J(130.50, "interior_lit", 1.2)
Pn(132.90, [(0, HANDS), (1, (930, 760, 780))], xf=1.0, warm=0.05)
Pn(137.22, [(0, RIGHT_T), (1, (1364, 572, 400))], xf=0.4)
Pn(138.60, [(0, LEFT_T), (1, (228, 505, 430))], xf=0.4)
Pn(140.02, [(0, (930, 400, 700)), (1, (930, 390, 480))], xf=0.5, bloomk=[(0, 0.3), (1, 0.6)])
Pn(146.10, [(0, (930, 390, 480)), (1, (930, 388, 440))], xf=0, bloomk=[(0, 0.6), (0.6, 1.4), (1, 3.2)], expk=[(0, 0), (0.6, 0.4), (1, 1.6)])
J(149.67, "interior_empty", 1.0)
Pn(158.32, [(0, JES_M), (1, (930, 455, 880))], xf=1.0, expk=[(0, -0.3)])
J(164.56, "road_empty", 0.8)
# 4. Reading the painting
J(165.45, "interior_lit", 1.0)
Pn(168.20, [(0, FULL), (1, (1000, 670, 2250))], xf=2.0)
Pn(172.85, LEFT_T, xf=0.8)
Pn(175.70, RIGHT_T, xf=0.8)
Pn(178.61, [(0, SERV), (1, SERV_T)], xf=0.8)
Pn(183.81, (930, 500, 1100), xf=0.8)
Pn(186.20, [(0, (930, 500, 1100)), (1, SKY)], xf=0)
J(189.96, "backlit", 1.0)
J(197.56, "p_inner", 1.0, beats=[[0.6, "all"], [200.23 - 197.56, "face"], [201.43 - 197.56, "hands"], [202.95 - 197.56, "robe"], [205.0 - 197.56, "all"]])
J(207.91, "p_source", 0.8)
Pn(214.35, JES_W, xf=1.0, bloomk=[(0, 0.5)])
# 5. The hidden family
Pn(221.51, [(0, (930, 500, 1300)), (1, (1780, 540, 820))], xf=0.6, g=gap_start(221.51) + 0.0)
J(229.04, "p_presence", 0.6, v0=[1792, 330, 900], v1=[1810, 545, 780], beats=[[231.04 - 229.04, "man"], [231.68 - 229.04, "woman"], [232.64 - 229.04, "boy"], [233.6 - 229.04, "all"]])
Pn(240.24, FAM, xf=0, expk=[(0, 0), (1, -0.35)])
J(241.62, "p_cards", 0.6, g=G(241.62) - 0.25, beats=[[0.25, "man"], [round(G(247.06) - G(241.62) + 0.25, 3), "woman"], [round(G(249.70) - G(241.62) + 0.25, 3), "boy"]])
J(252.26, "p_return", 0.4)
Pn(260.11, FAM_W, xf=1.0)
J(263.87, "p_eras", 1.0, join=271.70 - 263.87)
# 6. The artist
J(285.13, "studio", 1.4, g=gap_start(285.13))
J(291.61, "p_brush", 1.0)
J(298.30, "studio", 1.0, z0=1.55, z1=1.68, cx=0.32, cy=0.58, dx=0)
J(303.03, "church", 1.4)
Pn(313.63, [(0, (1850, 535, 520)), (1, WOMAN)], xf=1.2, warm=0.10)
Pn(320.51, FAM, xf=1.0, warm=0.08)
J(326.08, "votive", 1.4)
J(338.10, "p_witness", 1.4)
J(352.20, "museum", 1.2, visitor=True)
Pn(360.34, FAM, xf=0.8)
Pn(364.02, [(0, (930, 390, 640)), (1, FACE)], xf=0.8)
Pn(369.18, FULL, xf=1.0)
# 7. Fame
J(376.46, "salon", 1.2)
J(381.31, "pittsburgh", 1.0)
J(386.75, "collection", 1.0)
J(392.80, "p_gilded", 1.0)
J(405.60, "institut", 0.8)
# 8. Forgotten
J(409.14, "p_dust", 0.6, g=gap_start(409.14), v0=[1792, 250, 430], v1=[1792, 255, 470], k0=0.0, k1=0.45, d0=0.0, d1=0.5)
J(419.23, "modern", 1.4)
J(433.19, "p_dust", 1.4, v0=[1792, 255, 520], v1=[1792, 255, 500], k0=0.45, k1=0.5, d0=0.5, d1=0.55)
Pn(445.03, [(0, FAM), (1, FAM_W)], xf=1.2, warm=0.05)
J(455.56, "p_dust", 1.0, v0=[1792, 250, 430], v1=[1792, 250, 410], k0=0.2, k1=0.7, d0=0.3, d1=0.6)
J(459.08, "museum", 1.0, z0=1.0, z1=1.06, bench=True)
# 9. Ending
Pn(463.69, WIDE, xf=1.6)
Pn(467.00, [(0, WIDE), (1, (1780, 540, 900))], xf=0)
Pn(472.81, [(0, (1780, 540, 900)), (1, (930, 395, 640))], xf=0)
Pn(477.43, [(0, (930, 395, 640)), (0.35, WIDE), (1, (1000, 685, 2550))], xf=0)
Pn(490.94, [(0, (1000, 685, 2550)), (1, (950, 960, 1600))], xf=0)
Pn(497.01, [(0, (950, 960, 1600)), (0.75, (930, 395, 600)), (1, (930, 393, 580))], xf=0, g=gap_start(497.01))
Pn(507.00, [(0, (930, 393, 580)), (1, (930, 390, 530))], xf=0, bloomk=[(0, 0.3), (1, 0.45)])

for i, s in enumerate(SHOTS):
    s["end"] = SHOTS[i + 1]["g"] if i + 1 < len(SHOTS) else TOTAL
SHOTS.sort(key=lambda s: s["g"])
for i, s in enumerate(SHOTS):
    s["end"] = SHOTS[i + 1]["g"] if i + 1 < len(SHOTS) else TOTAL
    if s["kind"] == "seq":
        s["id"] = f"{i:03d}_{s['scene']}"
        s["handle"] = (SHOTS[i + 1]["xf"] if i + 1 < len(SHOTS) else 0) + 0.25

def js_jobs():
    out = []
    for s in SHOTS:
        if s["kind"] != "seq": continue
        dur = s["end"] - s["g"]
        out.append(dict(id=s["id"], scene=s["scene"], dur=round(dur, 3), frames=int(np.ceil((dur + s["handle"]) * FPS)), opts=s["opts"]))
    return out

# ----------------------------------------------------------------- titles & lower thirds (sparse)
TEXT = [
    dict(t0=gap_start(30.48) + 0.5, t1=G(30.48) + 1.2, style="title", lines=["STRANGEST PAINTING OF JESUS"]),
    dict(t0=G(75.6), t1=G(86.6), style="lower", lines=["Christ and the Disciples at Emmaus", "Pascal Dagnan-Bouveret  ·  1896–1897"]),
    dict(t0=G(88.6), t1=G(92.2), style="place", lines=["The Gospel of Luke  ·  Chapter 24"]),
    dict(t0=G(92.9), t1=G(98.5), style="place", lines=["The road to Emmaus"]),
    dict(t0=G(242.4), t1=G(246.9), style="lower", lines=["Pascal Dagnan-Bouveret", "the artist  ·  1852–1929"]),
    dict(t0=G(247.3), t1=G(249.6), style="lower", lines=["Anne-Marie", "his wife"]),
    dict(t0=G(249.9), t1=G(252.2), style="lower", lines=["Jean", "their son"]),
    dict(t0=G(303.6), t1=G(309.0), style="place", lines=["The 1890s"]),
    dict(t0=G(381.6), t1=G(388.6), style="lower", lines=["Henry Clay Frick", "industrialist and collector  ·  1849–1919"]),
    dict(t0=G(405.8), t1=G(409.1) + 0.6, style="place", lines=["Institut de France  ·  1900"]),
    dict(t0=G(435.4), t1=G(440.6), style="place", lines=["1929"]),
    dict(t0=G(459.3), t1=G(463.5), style="place", lines=["Carnegie Museum of Art  ·  Pittsburgh"]),
]

@functools.lru_cache(64)
def text_layer(idx):
    d = TEXT[idx]
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
    if d["style"] == "title":
        f = ImageFont.truetype(f"{FONTS}/Cinzel[wght].ttf", 64); f.set_variation_by_name("Regular")
        s = d["lines"][0]; track = 14
        widths = [dr.textlength(c, font=f) + track for c in s]; tw = sum(widths) - track
        x = (W - tw) / 2; y = H / 2 - 40
        for c, wdt in zip(s, widths):
            dr.text((x, y), c, font=f, fill=(236, 226, 205, 255)); x += wdt
        dr.line([(W / 2 - 60, y + 104), (W / 2 + 60, y + 104)], fill=(200, 175, 120, 200), width=1)
    elif d["style"] == "lower":
        f1 = ImageFont.truetype(f"{FONTS}/CormorantGaramond[wght].ttf", 50); f1.set_variation_by_name("Medium")
        f2 = ImageFont.truetype(f"{FONTS}/CormorantGaramond-Italic[wght].ttf", 32); f2.set_variation_by_name(b"Medium Italic" if b"Medium Italic" in f2.get_variation_names() else f2.get_variation_names()[1])
        x, y = 120, H - 210
        dr.line([(x, y - 14), (x + 46, y - 14)], fill=(205, 180, 125, 220), width=2)
        dr.text((x, y), d["lines"][0], font=f1, fill=(240, 232, 214, 255))
        if len(d["lines"]) > 1: dr.text((x + 2, y + 62), d["lines"][1], font=f2, fill=(214, 202, 180, 235))
    elif d["style"] == "place":
        f = ImageFont.truetype(f"{FONTS}/Cinzel[wght].ttf", 28); f.set_variation_by_name("Regular")
        s = d["lines"][0].upper(); track = 5
        widths = [dr.textlength(c, font=f) + track for c in s]
        x, y = 120, H - 150
        for c, wdt in zip(s, widths):
            dr.text((x, y), c, font=f, fill=(232, 222, 200, 240)); x += wdt
    a = np.asarray(lay).astype(np.float32) / 255
    # soft shadow for legibility on bright frames
    sh = cv2.GaussianBlur(a[..., 3], (0, 0), 6) * 0.55
    return a[..., :3], a[..., 3], sh

# ----------------------------------------------------------------- shot rendering
def keyval(keys, u, default):
    if not keys: return default
    if len(keys) == 1: return keys[0][1]
    return float(interp_keys([(k, (v,)) for k, v in keys], u)[0])

def stranger_fn(mode):
    if mode == "join":
        def f(u):
            e = ease(min(1, u / 0.55))
            return (0.20 + (1 - e) * 0.06 + 0.08 * u + 0.004, 0.10 * (1 - e) + 0.004)
        return f
    if mode == "with":
        return lambda u: (0.12 + 0.10 * u + 0.002, 0.004)
    return None

def render_shot(s, g):
    t = g - s["g"]; dur = s["end"] - s["g"]; u = t / max(dur, 1e-3)
    k = s["kind"]
    if k == "black":
        return np.zeros((H, W, 3), np.float32)
    if k == "seq":
        d = f"{HERE}/js_frames/{s['id']}"
        n = s.get("_n")
        if n is None:
            n = s["_n"] = len([f for f in os.listdir(d) if f.endswith(".jpg")])
        i = min(n - 1, max(0, int(round(t * FPS))))
        im = cv2.imread(f"{d}/{i:05d}.jpg")
        return cv2.cvtColor(im, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    if k == "P":
        cx, cy, w = interp_keys(s["keys"], u)
        img = view(cx, cy, w)
        if s.get("blur"): img = cv2.GaussianBlur(img, (0, 0), s["blur"])
        return img
    if k == "diptych":
        a = view(*interp_keys(s["a"], u), out_w=W // 2 - 3, out_h=H)
        b = view(*interp_keys(s["b"], u), out_w=W // 2 - 3, out_h=H)
        out = np.zeros((H, W, 3), np.float32) + SURROUND
        out[:, :W // 2 - 3] = a; out[:, W // 2 + 3:] = b
        return out
    pl = dict(s.get("plate", {}))
    if k == "road":
        pl["stranger"] = stranger_fn(pl.get("stranger"))
        return P.plate_road(t, dur, **pl)
    if k == "gallery":
        return P.gallery(t, dur, painting(), **pl)
    if k == "studio":
        img = P.studio_base().copy()
        P.dust(img, t, 64, 220, P.col(.95, .92, .85), region=(int(0.1 * P.BW), 0, int(0.9 * P.BW), P.BH), size=(0.8, 2.4), speed=3, strength=0.45)
        z = pl.get("z", (1.0, 1.07))
        return P.cam(img, t, dur, z[0], z[1], dx=0.02, cx=pl.get("cx", 0.5))
    return P.PLATES[k](t, dur, **pl)

def grade_params(s, g):
    t = g - s["g"]; dur = s["end"] - s["g"]; u = t / max(dur, 1e-3)
    return dict(exp=keyval(s.get("expk"), u, 0.0), bloom=keyval(s.get("bloomk"), u, 0.0 if s["kind"] == "P" else (0.06 if s["kind"] in ("gallery", "diptych", "seq") else 0.35)),
                sat=keyval(s.get("satk"), u, 1.0), warm=s.get("warm", 0.0), vig=s.get("vig", 0.35), kind=s["kind"])

def apply_shot_grade(img, gp):
    if gp["exp"]: img = img * (2.0 ** gp["exp"])
    if gp["warm"]: img = img * np.array([1 + gp["warm"], 1 + gp["warm"] * 0.3, 1 - gp["warm"] * 0.8], np.float32)
    if gp["sat"] != 1:
        l = img.mean(2, keepdims=True); img = l + (img - l) * gp["sat"]
    if gp["bloom"] > 0:
        small = cv2.resize(img, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
        hi = np.clip(small - 0.62, 0, None)
        b = cv2.GaussianBlur(hi, (0, 0), 6) * 0.6 + cv2.GaussianBlur(hi, (0, 0), 22) * 0.9
        img = img + cv2.resize(b, (W, H), interpolation=cv2.INTER_LINEAR) * gp["bloom"]
    return img

# film finishing
_rng = np.random.default_rng(1234)
GRAIN = None
def grain_frames():
    global GRAIN
    if GRAIN is None:
        GRAIN = [cv2.GaussianBlur(_rng.standard_normal((H, W)).astype(np.float32), (0, 0), 0.7) for _ in range(12)]
    return GRAIN

@functools.lru_cache(1)
def vignette_map():
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((X - W / 2) / (W / 2)) ** 2 + ((Y - H / 2) / (H / 2)) ** 2) / np.sqrt(2)
    return d

def finish(img, vig, fidx):
    d = vignette_map()
    img = img * (1 - vig * np.clip(d - 0.25, 0, None) ** 1.6 * 1.8)[..., None]
    # highlight shoulder
    img = np.where(img < 0.82, img, 0.82 + 0.18 * np.tanh((img - 0.82) / 0.18))
    # gentle print-like curve and warm-neutral balance; lift blacks a touch, keep detail
    img = np.clip(img, 0, 1)
    img = img * 0.975 + 0.012
    g = grain_frames()[fidx % 12]
    lum = img.mean(2, keepdims=True)
    amp = 0.022 * (0.4 + 2.2 * lum * (1 - lum))
    img = img + g[..., None] * amp
    return img

def frame(g, fidx):
    # active shot and dissolve partner
    i = max(j for j, s in enumerate(SHOTS) if s["g"] <= g + 1e-9)
    s = SHOTS[i]
    img = apply_shot_grade(render_shot(s, g), gp := grade_params(s, g))
    vig = gp["vig"]
    if i > 0 and s["xf"] > 0 and g - s["g"] < s["xf"]:
        a = ease((g - s["g"]) / s["xf"])
        prev = SHOTS[i - 1]
        pimg = apply_shot_grade(render_shot(prev, g), pp := grade_params(prev, g))
        img = pimg * (1 - a) + img * a
        vig = pp["vig"] * (1 - a) + vig * a
    # global fade in/out
    img = finish(img, vig, fidx)
    # text
    for k, d in enumerate(TEXT):
        if d["t0"] <= g <= d["t1"]:
            fi = 1.2 if d["style"] == "title" else 0.7
            a = min(1, (g - d["t0"]) / fi, (d["t1"] - g) / fi)
            a = ease(a)
            rgb, al, sh = text_layer(k)
            img = img * (1 - sh[..., None] * a)
            img = img * (1 - al[..., None] * a) + rgb * al[..., None] * a
    return np.clip(img, 0, 1)

def render_range(f0, f1, out):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-color_primaries", "bt709",
           "-color_trc", "bt709", "-colorspace", "bt709", "-x264-params", "keyint=48", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(f0, f1):
        img = frame(f / FPS, f)
        p.stdin.write((img * 255 + 0.5).astype(np.uint8).tobytes())
        if f % 240 == 0: print(f"{out}: {f}/{f1}", flush=True)
    p.stdin.close(); p.wait()

def stills(times, out):
    ims = []
    for g in times:
        im = (frame(g, int(g * FPS)) * 255).astype(np.uint8)
        im = cv2.resize(im, (480, 270), interpolation=cv2.INTER_AREA)
        cv2.putText(im, f"{g:.1f}", (6, 18), 0, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        ims.append(im)
    while len(ims) % 4: ims.append(np.zeros_like(ims[0]))
    sheet = np.vstack([np.hstack(ims[i:i + 4]) for i in range(0, len(ims), 4)])
    cv2.imwrite(out, cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR))

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "range":
        render_range(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
    elif mode == "stills":
        ts = [float(x) for x in sys.argv[3:]]
        stills(ts, sys.argv[2])
    elif mode == "jobs":
        json.dump(js_jobs(), open(sys.argv[2], "w"), indent=1); print(len(js_jobs()), "jobs", sum(j["frames"] for j in js_jobs()), "frames")
    elif mode == "edl":
        for s in SHOTS: print(f"{s['g']:7.2f}-{s['end']:7.2f}  {s['kind']:8} n={s['n']}")
