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
    vh = w * out_h / out_w
    if w <= PW: cx = min(max(cx, w / 2), PW - w / 2)       # close views never leave the canvas
    if vh <= PH and w <= PW: cy = min(max(cy, vh / 2), PH - vh / 2)
    s = out_w / w
    M = np.array([[s, 0, out_w / 2 - cx * s], [0, s, out_h / 2 - cy * s]], np.float32)
    interp = cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC
    if s < 1:
        # pre-shrink for clean downsampling
        f = s * 1.0
        small = cv2.resize(img, (int(PW * f), int(PH * f)), interpolation=cv2.INTER_AREA)
        M = np.array([[1, 0, out_w / 2 - cx * f], [0, 1, out_h / 2 - cy * f]], np.float32)
        return cv2.warpAffine(small, M, (out_w, out_h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=SURROUND.tolist())
    return cv2.warpAffine(img, M, (out_w, out_h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=SURROUND.tolist())

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
RIGHT = (1350, 605, 620); RIGHT_T = (1362, 575, 440)
SERV = (440, 320, 620); SERV_T = (432, 280, 470)
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
    S(n, "P", xf, keys=keys, **kw)

# 1. Opening
S(None, "black", 0, g=0.0)
Pn(-0.9, [(0, (930, 560, 1500)), (1, (930, 392, 520))], xf=0, expk=[(0, -7), (0.38, -1.0), (1, -0.55)], vig=0.55)
Pn(12.70, [(0, (930, 392, 520)), (1, (930, 388, 470))], xf=0, expk=[(0, -0.55), (1, -0.35)], bloomk=[(0, 0.1), (1, 0.75)], vig=0.5)
Pn(16.62, LEFT_T, xf=0.35, expk=[(0, -0.6)], vig=0.5)
Pn(17.85, RIGHT_T, xf=0.35, expk=[(0, -0.6)], vig=0.5)
Pn(18.85, SERV_T, xf=0.35, expk=[(0, -0.6)], vig=0.5)
Pn(19.70, [(0, (1450, 520, 950)), (1, (1800, 520, 720))], xf=0.7, expk=[(0, -1.1), (1, -1.3)], blur=2.2, vig=0.6)
Pn(27.30, (1790, 525, 760), xf=0, expk=[(0, -1.3), (0.55, -1.6), (1, -6)], blur=2.2, vig=0.6)
S(None, "black", 0.3, g=gap_start(30.48))
Pn(30.48, [(0, (930, 170, 800)), (1, (930, 215, 920))], xf=1.4, expk=[(0, -0.8)], vig=0.45)
Pn(35.15, FULL, xf=1.2)
Pn(39.35, [(0, FULL), (1, (950, 640, 1520))], xf=0)
# 2. What is happening in the painting
Pn(48.79, [(0, LEFT), (1, LEFT_T)], xf=0.8)
Pn(53.45, [(0, RIGHT), (1, RIGHT_T)], xf=0.8)
Pn(57.37, [(0, SERV), (1, SERV_T)], xf=0.8)
Pn(61.29, [(0, (930, 395, 600)), (1, FACE)], xf=0.8, bloomk=[(0, 0.2), (1, 0.35)])
Pn(66.41, [(0, JES_M), (1, (930, 450, 1180))], xf=0.9, bloomk=[(0, 0.35), (1, 0.7)])
Pn(75.13, [(0, FULL), (1, (1000, 660, 2200))], xf=1.2)
# 3. The road to Emmaus (reconstruction)
Pn(88.41, [(0, (1180, 330, 760)), (1, (1235, 305, 340))], xf=1.0, warm=0.08)
S(92.46, "road", 1.8, plate=dict(kind="afternoon", walkers=2, s_range=(0.22, 0.32)))
S(102.78, "road", 1.2, plate=dict(kind="late", walkers=2, s_range=(0.20, 0.28), stranger="join"))
S(114.41, "road", 1.4, plate=dict(kind="dusk", walkers=2, s_range=(0.12, 0.22), stranger="with", houses=True, z=(1.04, 1.10), dx=-0.02))
S(124.18, "village", 1.4)
S(130.50, "table", 1.2, plate=dict(lit=True))
Pn(132.90, [(0, HANDS), (1, (930, 760, 780))], xf=1.0, warm=0.05)
Pn(137.22, [(0, RIGHT_T), (1, (1364, 572, 400))], xf=0.4)
Pn(138.60, [(0, LEFT_T), (1, (228, 505, 430))], xf=0.4)
Pn(140.02, [(0, (930, 400, 700)), (1, (930, 390, 480))], xf=0.5, bloomk=[(0, 0.3), (1, 0.6)])
Pn(146.10, [(0, (930, 390, 480)), (1, (930, 388, 440))], xf=0, bloomk=[(0, 0.6), (0.6, 1.4), (1, 3.2)], expk=[(0, 0), (0.6, 0.4), (1, 1.6)])
S(149.67, "table", 1.0, plate=dict(lit=False, z=(1.0, 1.06)))
Pn(158.32, [(0, JES_M), (1, (930, 455, 880))], xf=1.0, expk=[(0, -0.3)])
S(164.56, "road", 0.8, plate=dict(kind="dusk", walkers=0, z=(1.02, 1.05)), expk=[(0, -0.6)])
# 4. Reading the painting
S(165.45, "table", 1.0, plate=dict(lit=True, z=(1.0, 1.03)))
Pn(168.20, [(0, FULL), (1, (1000, 670, 2250))], xf=2.0)
Pn(172.85, LEFT_T, xf=0.8)
Pn(175.70, RIGHT_T, xf=0.8)
Pn(178.61, [(0, SERV), (1, SERV_T)], xf=0.8)
Pn(183.81, (930, 500, 1100), xf=0.8)
Pn(186.20, [(0, (930, 500, 1100)), (1, SKY)], xf=0)
S(189.96, "backlit", 1.0)
Pn(197.56, [(0, (930, 395, 560)), (0.25, (930, 395, 560)), (1, (930, 520, 1300))], xf=1.0, bloomk=[(0, 0.3), (1, 0.5)])
Pn(207.91, [(0, (930, 480, 1050)), (1, (930, 400, 600))], xf=0.8, bloomk=[(0, 0.45), (1, 0.9)])
Pn(214.35, JES_W, xf=1.0, bloomk=[(0, 0.5)])
# 5. The hidden family
Pn(221.51, [(0, (930, 500, 1300)), (1, (1780, 540, 820))], xf=0.6, g=gap_start(221.51) + 0.0)
Pn(229.04, [(0, (1792, 270, 520)), (1, MAN)], xf=0.6)
Pn(231.60, WOMAN, xf=0.4)
Pn(232.62, BOY, xf=0.4)
Pn(233.50, FAM, xf=0.6)
Pn(240.24, FAM, xf=0, expk=[(0, 0), (1, -0.35)])
Pn(241.62, MAN, xf=0.6, g=G(241.62) - 0.25)
Pn(247.06, WOMAN, xf=0.6)
Pn(249.70, BOY, xf=0.6)
Pn(252.26, [(0, FAM), (1, FULL)], xf=0.8)
Pn(260.11, FAM_W, xf=1.0)
S(263.87, "diptych", 1.0, a=[(0, (930, 410, 560)), (1, (930, 400, 500))], b=[(0, (1830, 450, 600)), (1, (1830, 440, 540))])
Pn(271.70, [(0, (1450, 560, 1500)), (1, (1380, 540, 1300))], xf=1.2, bloomk=[(0, 0.3)])
# 6. The artist
S(285.13, "studio", 1.4, g=gap_start(285.13))
Pn(291.61, [(0, (1360, 560, 330)), (1, (1350, 575, 380))], xf=1.0)
Pn(295.40, [(0, (640, 760, 420)), (1, (650, 762, 470))], xf=0.8)
S(298.30, "studio", 1.0, plate=dict(z=(1.25, 1.32), cx=0.62))
S(303.03, "church", 1.4)
Pn(313.63, [(0, (1850, 535, 520)), (1, WOMAN)], xf=1.2, warm=0.10)
Pn(320.51, FAM, xf=1.0, warm=0.08)
S(326.08, "votive", 1.4)
Pn(338.10, [(0, FAM), (1, (1250, 560, 1500))], xf=1.4, bloomk=[(0, 0.2), (1, 0.4)])
S(352.20, "gallery", 1.2, plate=dict(mood="museum", z=(1.0, 1.14)))
Pn(360.34, FAM, xf=0.8)
Pn(364.02, [(0, (930, 390, 640)), (1, FACE)], xf=0.8)
Pn(369.18, FULL, xf=1.0)
# 7. Fame
S(376.46, "gallery", 1.2, plate=dict(mood="salon", z=(1.0, 1.08)))
S(381.31, "gallery", 1.0, plate=dict(mood="museum", z=(1.18, 1.28)))
Pn(392.80, [(0, FULL), (1, (980, 640, 1900))], xf=1.0, warm=0.06, bloomk=[(0, 0.2), (1, 0.4)])
Pn(405.60, MAN, xf=0.8, warm=0.06)
# 8. Forgotten
Pn(409.14, [(0, MAN), (1, (1792, 255, 470))], xf=0.6, g=gap_start(409.14), expk=[(0, 0), (1, -1.3)], satk=[(0, 1), (1, 0.6)])
S(419.23, "gallery", 1.4, plate=dict(mood="dim", z=(1.16, 1.0)))
Pn(433.19, (1792, 255, 520), xf=1.4, expk=[(0, -1.0)], satk=[(0, 0.6)])
Pn(445.03, [(0, FAM), (1, FAM_W)], xf=1.2, warm=0.05)
Pn(455.56, MAN, xf=1.0, expk=[(0, -0.3), (1, -3.5)])
S(459.08, "gallery", 1.0, plate=dict(mood="museum", z=(1.0, 1.06)))
# 9. Ending
Pn(463.69, WIDE, xf=1.6)
Pn(467.00, [(0, WIDE), (1, (1780, 540, 900))], xf=0)
Pn(472.81, [(0, (1780, 540, 900)), (1, (930, 395, 640))], xf=0)
Pn(477.43, [(0, (930, 395, 640)), (0.35, WIDE), (1, (1000, 685, 2550))], xf=0)
Pn(490.94, [(0, (1000, 685, 2550)), (1, (950, 960, 1600))], xf=0)
Pn(497.01, [(0, (950, 960, 1600)), (0.75, (930, 395, 600)), (1, (930, 393, 580))], xf=0, g=gap_start(497.01))
Pn(507.00, [(0, (930, 393, 580)), (1, (930, 390, 530))], xf=0, bloomk=[(0, 0.3), (1, 0.45)])
S(None, "black", 5.0, g=TOTAL - 6.0)

for i, s in enumerate(SHOTS):
    s["end"] = SHOTS[i + 1]["g"] if i + 1 < len(SHOTS) else TOTAL
SHOTS.sort(key=lambda s: s["g"])
for i, s in enumerate(SHOTS):
    s["end"] = SHOTS[i + 1]["g"] if i + 1 < len(SHOTS) else TOTAL

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
    return dict(exp=keyval(s.get("expk"), u, 0.0), bloom=keyval(s.get("bloomk"), u, 0.0 if s["kind"] == "P" else (0.08 if s["kind"] in ("gallery", "diptych") else 0.35)),
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
    elif mode == "edl":
        for s in SHOTS: print(f"{s['g']:7.2f}-{s['end']:7.2f}  {s['kind']:8} n={s['n']}")
