"""Sound design + voice-forward mix. Writes mix_pre.wav (stereo, 48 kHz) before loudness mastering."""
import numpy as np, subprocess, wave
from scipy.signal import butter, sosfilt, oaconvolve
from timeline import n2g, INS, PRE, TOTAL
from score import reverb_ir

SR = 44100
N = int((TOTAL + 2) * SR)
r = np.random.default_rng(11)
G = n2g

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x, axis=0)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x, axis=0)

def pink(n):
    w = r.standard_normal(n)
    f = np.fft.rfft(w); k = np.arange(len(f)); k[0] = 1
    return np.fft.irfft(f / np.sqrt(k), n).astype(np.float32)

def smooth_env(n, rate_hz, depth, base):
    k = max(4, int(n / SR * rate_hz) + 4)
    pts = base + depth * r.random(k)
    return np.interp(np.linspace(0, k - 1, n), np.arange(k), pts).astype(np.float32)

def fades(n, fi, fo):
    e = np.ones(n, np.float32)
    a = int(fi * SR); b = int(fo * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[-b:] = np.minimum(e[-b:], np.linspace(1, 0, b))
    return e

class Bus:
    def __init__(self): self.x = np.zeros((N, 2), np.float32)
    def add(self, y, t, gain=1.0, pan=0.0):
        if y.ndim == 1:
            y = np.stack([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)], 1)
        i = int(t * SR); y = y[:max(0, N - i)]
        self.x[i:i + len(y)] += y * gain

def wind(dur, bright=900, lvl=1.0):
    n = int(dur * SR)
    L = bp(pink(n), 120, bright) * smooth_env(n, 0.25, 0.8, 0.3)
    R = bp(pink(n), 120, bright) * smooth_env(n, 0.25, 0.8, 0.3)
    y = np.stack([L, R], 1) * fades(n, 3, 3)[:, None]
    return y / (np.sqrt(np.mean(y ** 2)) + 1e-9) * 0.05 * lvl

def room(dur, lvl=1.0):
    n = int(dur * SR)
    y = np.stack([lp(pink(n), 260), lp(pink(n), 260)], 1) * fades(n, 2, 2)[:, None]
    return y / (np.sqrt(np.mean(y ** 2)) + 1e-9) * 0.02 * lvl

def step(soft=1.0):
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    thud = lp(r.standard_normal(n), 380) * np.exp(-t * 38) * 1.6
    crunch = np.zeros(n)
    for _ in range(r.integers(6, 14)):
        i = r.integers(0, int(0.09 * SR)); crunch[i] += r.standard_normal() * 0.8
    crunch = bp(crunch, 1200, 5200) * np.exp(-t * 20)
    sand = bp(r.standard_normal(n), 2000, 7000) * np.exp(-t * 45) * 0.25
    return ((thud + crunch + sand) * soft).astype(np.float32)

def footsteps(bus, t0, t1, rate, gain, pan):
    t = t0
    while t < t1:
        env = min(1, (t - t0) / 2, (t1 - t) / 2)
        bus.add(step(0.8 + 0.4 * r.random()), t + r.normal(0, 0.02), gain * env, pan + r.normal(0, 0.05))
        t += 1 / rate * (1 + r.normal(0, 0.04))

def bird(bus, t, gain, pan):
    for k in range(r.integers(2, 5)):
        d = 0.06 + 0.1 * r.random(); n = int(d * SR); tt = np.arange(n) / SR
        f0 = 2600 + 2200 * r.random(); f1 = f0 * (0.7 + 0.7 * r.random())
        f = np.linspace(f0, f1, n) + 180 * np.sin(2 * np.pi * (25 + 20 * r.random()) * tt)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
        bus.add(y.astype(np.float32), t + k * (0.12 + 0.15 * r.random()), gain, pan)

def bread_break(bus, t, gain):
    n = int(0.9 * SR); tt = np.arange(n) / SR
    y = np.zeros(n)
    # crust cracks: dense micro-impulses in two bursts
    for c0, cn, spread in [(0.0, 70, 0.22), (0.28, 45, 0.3)]:
        for _ in range(cn):
            i = int((c0 + abs(r.normal(0, spread / 2))) * SR)
            if i < n: y[i] += r.standard_normal() * (0.5 + r.random())
    y = bp(y, 900, 7500)
    tear = bp(r.standard_normal(n), 400, 2600) * np.exp(-((tt - 0.35) / 0.25) ** 2) * 0.18
    y = (y + tear) * np.exp(-tt * 2.2)
    bus.add((y / np.max(np.abs(y))).astype(np.float32), t, gain, -0.05)

def brush(bus, t, gain, pan):
    d = 0.5 + 0.5 * r.random(); n = int(d * SR); tt = np.arange(n) / SR
    y = bp(r.standard_normal(n), 1800, 6500) * np.sin(np.pi * tt / d) ** 1.5 * smooth_env(n, 12, 0.6, 0.4)
    bus.add((y * 0.25).astype(np.float32), t, gain, pan)

def cloth(bus, t, gain, pan):
    d = 0.35 + 0.4 * r.random(); n = int(d * SR); tt = np.arange(n) / SR
    y = bp(r.standard_normal(n), 700, 3500) * np.sin(np.pi * tt / d) ** 2 * smooth_env(n, 20, 0.7, 0.3)
    bus.add((y * 0.2).astype(np.float32), t, gain, pan)

def candle(dur):
    n = int(dur * SR); y = np.zeros(n)
    k = int(dur * 3)
    for i in r.integers(0, n - 2000, k): y[i] = r.standard_normal() * 0.6
    y = bp(y, 1500, 6000) + lp(pink(n), 180) * 0.02
    return (y * fades(n, 1, 1)).astype(np.float32)

def load_voice():
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", "narration.mp3", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    v = np.frombuffer(b, np.float32).copy()
    v = hp(v, 75)
    out = np.zeros(N, np.float32)
    cuts = [0.0] + [t for t, _ in INS] + [len(v) / SR]
    for k in range(len(cuts) - 1):
        a, b_ = cuts[k], cuts[k + 1]
        seg = v[int(a * SR):int(b_ * SR)]
        g = G(a + 1e-6) if k else PRE
        i = int(g * SR); out[i:i + len(seg)] += seg[:N - i]
    return out

def build():
    sfx = Bus(); amb = Bus()
    # opening: distant wind out of silence
    amb.add(wind(G(27.2) - 0.8, 700, 0.9), 0.8)
    amb.add(room(G(36) - G(27.2), 0.8), G(27.2))
    # painting investigation: quiet room
    amb.add(room(G(89) - G(35), 0.7), G(35))
    # road to Emmaus: wind, birds, footsteps, cloth
    amb.add(wind(G(131) - G(88.6), 1400, 1.0), G(88.6))
    footsteps(sfx, G(92.6), G(102.6), 1.7, 0.10, -0.15)
    footsteps(sfx, G(92.9), G(102.6), 1.62, 0.08, 0.2)
    footsteps(sfx, G(103.0), G(124.0), 1.65, 0.11, -0.1)
    footsteps(sfx, G(103.3), G(124.0), 1.58, 0.08, 0.25)
    footsteps(sfx, G(104.5), G(124.0), 1.52, 0.09, 0.05)
    for tb in np.arange(G(93.5), G(122), 4.3) + r.random(7) * 2:
        bird(sfx, tb, 0.022, r.uniform(-0.8, 0.8))
    for tc in [G(97.5), G(103.4), G(109.5), G(118.6), G(127.9)]:
        cloth(sfx, tc, 0.5, r.uniform(-0.3, 0.3))
    # dinner: quiet room, candle, bread
    amb.add(room(G(150.4) - G(124.5), 1.2), G(124.5))
    amb.add(np.stack([candle(G(150.0) - G(130.2))] * 2, 1) * 0.35, G(130.2))
    cloth(sfx, G(132.95), 0.6, 0.0)
    bread_break(sfx, G(135.62), 0.30)
    # absence: almost nothing, then room returns
    amb.add(room(G(222) - G(150.6), 0.8), G(150.6))
    # family section: still room
    amb.add(room(G(286) - G(221.6), 0.9), G(221.6))
    # studio: window ambience + brush strokes
    amb.add(wind(G(303) - G(285.2), 3000, 0.25), G(285.2))
    amb.add(room(G(303) - G(285.2), 1.0), G(285.2))
    for tb in np.arange(G(286.0), G(302.5), 1.3):
        brush(sfx, tb + r.random() * 0.4, 0.25, r.uniform(-0.2, 0.3))
    # church / faith
    amb.add(room(G(352) - G(303), 1.1), G(303))
    # museum room tone
    amb.add(room(G(377) - G(352), 1.4), G(352))
    amb.add(room(G(419) - G(377), 1.0), G(377))
    amb.add(room(G(464) - G(419), 0.8), G(419))
    amb.add(room(G(464) - G(458.8), 1.5), G(458.8))
    amb.add(room(TOTAL - G(463.6), 0.7), G(463.6))
    rev = reverb_ir(1.6, 3)
    s = sfx.x
    sfx_w = np.stack([oaconvolve(s[:, 0], rev[:, 0])[:N], oaconvolve(s[:, 1], rev[:, 1])[:N]], 1)
    return s * 0.85 + sfx_w * 0.25 + amb.x

def music_automation(n):
    """Base music gain (dB) by story section, before voice ducking."""
    pts = [(0, -6), (G(7), -5), (G(16.6), -3.5), (G(27.0), -3.5), (G(30.48) - 3.6, 0), (G(30.48) - 0.2, -1), (G(36), -3),
           (G(88.4), -2), (G(130.5), -2), (G(137.2), 0), (G(149.6), 1), (G(151), -1),
           (G(221.5), -1.5), (G(240), -1), (G(242), -0.5), (G(269), 0.5), (G(285), 1.5), (G(286.5), -1.5),
           (G(376.3), 0), (G(405), 1.5), (G(409.1), 1), (G(410), -1.5), (G(446), -2.5),
           (G(463.6), -1), (G(497), 0), (G(517.6), 1.5), (TOTAL, 1.5)]
    t = np.arange(n) / SR
    return 10 ** (np.interp(t, [p[0] for p in pts], [p[1] for p in pts]) / 20)

def duck(voice, n, depth_db=-6.0):
    w = int(0.05 * SR)
    p = np.convolve(voice ** 2, np.ones(w) / w, "same")
    lvl = 10 * np.log10(p + 1e-12)
    on = (lvl > np.percentile(lvl[lvl > -100], 60) - 20).astype(np.float32)
    # attack 120 ms, release 700 ms one-pole smoothing
    g = np.empty(n, np.float32); s = 0.0
    a_at = 1 - np.exp(-1 / (0.12 * SR)); a_rel = 1 - np.exp(-1 / (0.7 * SR))
    from scipy.signal import lfilter
    # implement asymmetric smoothing in blocks of 1 ms for speed
    blk = 44; m = on[:n - n % blk].reshape(-1, blk).max(1)
    out = np.empty_like(m); s = 0.0
    aa = 1 - np.exp(-blk / (0.12 * SR)); ar = 1 - np.exp(-blk / (0.7 * SR))
    for i, v in enumerate(m):
        s += (v - s) * (aa if v > s else ar); out[i] = s
    env = np.repeat(out, blk); env = np.pad(env, (0, n - len(env)), mode="edge")
    return 10 ** (depth_db * env / 20)

if __name__ == "__main__":
    voice = load_voice()
    # voice gain: bring speech to a healthy level before mastering
    act = voice[np.abs(voice) > 1e-4]
    voice *= 0.12 / np.sqrt(np.mean(act ** 2))
    mus = np.load("music.npy")[:N]
    mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))
    # music levelling: bring quiet cues up and tame the peaks so the score carries emotion throughout
    from scipy.ndimage import uniform_filter1d
    mono = mus.mean(1)
    env = np.sqrt(uniform_filter1d(mono ** 2, int(0.4 * SR)) + 1e-10)
    env_db = 20 * np.log10(env)
    target = -22.0
    gdb = np.clip((target - env_db) * 0.6, -8, 12)
    gdb[env_db < -60] = 0          # leave true silences silent
    gdb = uniform_filter1d(gdb, int(1.2 * SR))
    mus = mus * (10 ** (gdb / 20))[:, None]
    auto = music_automation(N) * duck(voice, N)
    mus = mus * auto[:, None] * 1.40
    fx = build()
    v2 = np.stack([voice, voice], 1)
    mix = v2 + mus + fx * 0.75
    mix = mix[:int(TOTAL * SR)]
    pk = np.max(np.abs(mix)); print("peak", pk)
    mix /= max(1, pk / 0.95)
    np.save("stems_voice.npy", voice[:len(mix)])
    for name, arr in [("mix_pre.wav", mix), ("stem_music.wav", mus[:len(mix)]), ("stem_fx.wav", fx[:len(mix)])]:
        pcm = (np.clip(arr, -1, 1) * 32767).astype(np.int16)
        with wave.open(name, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print("done", len(mix) / SR)
