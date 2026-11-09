"""Synth + sound-design library for the mythic-reel score (numpy only).
Call setup(end_seconds) before building anything."""
import os
import shutil

import numpy as np

SR = 48000
END = 60.0
N = int(END * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def setup(end):
    global END, N, t
    END = float(end)
    N = int(END * SR)
    t = np.arange(N) / SR


def ffmpeg():
    """FFMPEG env > PATH > AutoSubs bundle > Remotion's bundled ffmpeg (next to a project)."""
    cands = [os.environ.get("FFMPEG"), shutil.which("ffmpeg"), "/Applications/AutoSubs.app/Contents/MacOS/ffmpeg"]
    cands += [os.path.join(os.getcwd(), "node_modules/@remotion/compositor-darwin-arm64/ffmpeg"),
              os.path.join(os.getcwd(), "node_modules/@remotion/compositor-darwin-x64/ffmpeg")]
    for c in cands:
        if c and os.path.exists(c):
            return c
    raise SystemExit("ffmpeg not found: set FFMPEG=/path/to/ffmpeg")


# ------------------------------------------------------------------ basics
def env(points):
    """Piecewise-linear envelope from [(time, value), ...] over the whole timeline."""
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


def fft_filter(x, lo=None, hi=None, slope=4):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-6
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / f) ** slope)
    if hi:
        g *= 1 / (1 + (f / hi) ** slope)
    return np.fft.irfft(X * g, len(x))


def formant(x, formants):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = sum(a * np.exp(-0.5 * ((f - c) / bw) ** 2) for c, bw, a in formants)
    return np.fft.irfft(X * g, len(x))


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf) or i < 0:
        return
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += gain * sig[:n]


def brown(n):
    b = np.cumsum(rng.standard_normal(n))
    b -= np.convolve(b, np.ones(4801) / 4801, mode="same")
    return norm(b)


def reverb(mix, length, amt):
    ir_n = int(length * SR)
    ir = rng.standard_normal((2, ir_n)) * np.exp(-np.arange(ir_n) / SR / (length / 3.5))
    ir[:, 0] = 0
    n = mix.shape[1]
    wet = np.stack([np.fft.irfft(np.fft.rfft(mix[c], n + ir_n) * np.fft.rfft(ir[c] / 30, n + ir_n))[:n] for c in range(2)])
    return mix + amt * wet


# ------------------------------------------------------------------ pitch
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
TRANSPOSE = 0


def hz(name):
    """'D3' -> Hz. Flats as 'Bb2'/'Eb3'. Global TRANSPOSE in semitones."""
    name = name.replace('Bb', 'A#').replace('Eb', 'D#').replace('Ab', 'G#').replace('Db', 'C#').replace('Gb', 'F#')
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69 + TRANSPOSE) / 12)


# Voicings for the default key (D minor). Add more as needed.
CHORDS = {
    'Dm': ['D2', 'A2', 'D3', 'F3', 'A3'],
    'Bb': ['A#1', 'F2', 'A#2', 'D3', 'F3'],
    'C': ['C2', 'G2', 'C3', 'E3', 'G3'],
    'F': ['F1', 'C2', 'F2', 'A2', 'C3'],
    'Gm': ['G1', 'D2', 'G2', 'A#2', 'D3'],
    'A': ['A1', 'E2', 'A2', 'C#3', 'E3'],
    'Am': ['A1', 'E2', 'A2', 'C3', 'E3'],
    'Eb': ['D#2', 'A#2', 'D#3', 'G3', 'A#3'],
    'Dm9': ['D2', 'A2', 'D3', 'E3', 'F3', 'A3'],
    'Dsus2': ['D2', 'A2', 'D3', 'E3', 'A3'],
    'D': ['D2', 'A2', 'D3', 'F#3', 'A3'],
    'G': ['G1', 'D2', 'G2', 'B2', 'D3'],
}
ROOTS = {'Dm': 'D1', 'Bb': 'A#0', 'C': 'C1', 'F': 'F1', 'Gm': 'G0', 'A': 'A0', 'Am': 'A0', 'Eb': 'D#1', 'Dm9': 'D1', 'Dsus2': 'D1', 'D': 'D1', 'G': 'G0'}


# ------------------------------------------------------------------ instruments
def saw(f, n, harm=24, det=(-0.12, 0, 0.13), vib=0.0):
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for d in det:
        ph = 2 * np.pi * (f + d) * tt + rng.uniform(0, 6)
        if vib:
            ph += vib * np.sin(2 * np.pi * 5.2 * tt + rng.uniform(0, 6))
        for k in range(1, harm + 1):
            if f * k > 9000:
                break
            out += np.sin(k * ph) / k
    return out


def adsr(n, a, r, sustain=1.0):
    tt = np.arange(n) / SR
    dur = n / SR
    return np.minimum(1, tt / max(a, 1e-3)) * np.clip((dur - tt) / max(r, 1e-3), 0, 1) * sustain


def brass(chord, dur, bright=1.0):
    """Low brass section: saw stack whose filter swells open over the note."""
    n = int(dur * SR)
    s = sum(saw(hz(x), n, harm=20) for x in CHORDS[chord])
    dark = fft_filter(s, hi=500, slope=2)
    lit = fft_filter(s, hi=1800 * bright, slope=2)
    tt = np.arange(n) / SR
    sw = np.clip(tt / (dur * 0.6), 0, 1) ** 1.5
    return norm(dark * (1 - sw) + lit * sw) * adsr(n, 0.35, 0.5)


def choir(chord, dur):
    n = int(dur * SR)
    fm = [(700, 110, 1.0), (1150, 130, 0.45), (2600, 180, 0.15), (300, 90, 0.5)]
    s = sum(saw(hz(x) * 2, n, harm=30, det=(-0.6, 0, 0.5), vib=0.012) for x in CHORDS[chord][1:])
    return norm(formant(s, fm)) * adsr(n, 0.6, 0.7)


def strings(chord, dur):
    n = int(dur * SR)
    s = sum(saw(hz(x) * 2, n, harm=16, det=(-0.3, 0, 0.3), vib=0.01) for x in CHORDS[chord][2:])
    return norm(fft_filter(s, lo=150, hi=2600, slope=2)) * adsr(n, 0.5, 0.6)


def ostinato_note(f, dur=0.16):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return norm(fft_filter(saw(f, n, harm=14), hi=1600, slope=2)) * np.exp(-tt / 0.07) * np.minimum(1, tt / 0.004)


def drone(freq, detune=0.15, harm=8, bright=1.2):
    out = np.zeros(N)
    for d in (-detune, 0, detune):
        ph = 2 * np.pi * (freq + d) * t + rng.uniform(0, 6.28)
        for k in range(1, harm + 1):
            out += np.sin(k * ph) / k ** bright
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t + rng.uniform(0, 6))
    return norm(out) * lfo


def drum(freq=95, decay=0.42):
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    f = freq * 0.45 + freq * 0.55 * np.exp(-tt / 0.06)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / decay)
    skin = fft_filter(rng.standard_normal(n), lo=80, hi=900) * np.exp(-tt / 0.03) * 0.5
    return norm(body + skin)


def impact(size=1.0):
    n = int(5 * SR)
    tt = np.arange(n) / SR
    f = 28 + 70 * np.exp(-tt / 0.15)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (1.2 * size))
    crack = fft_filter(rng.standard_normal(n), lo=60, hi=2500) * np.exp(-tt / 0.08)
    tail = fft_filter(rng.standard_normal(n), hi=300) * np.exp(-tt / 1.6) * 0.6
    return norm(boom + 0.35 * crack + tail)


def riser(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return norm(fft_filter(rng.standard_normal(n), lo=200, hi=4000) * (tt / dur) ** 3)


# ------------------------------------------------------------------ sound design
def thunder(dist=1.0, dur=6.0):
    """dist 0 = close crack, 1 = far rumble."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    rumble = fft_filter(brown(n), hi=180 - 80 * dist)
    am = np.abs(fft_filter(rng.standard_normal(n), hi=6))
    rumble = rumble * norm(am) * np.exp(-tt / (1.4 + dist))
    crack = fft_filter(rng.standard_normal(n), lo=300, hi=5000) * np.exp(-tt / 0.12) * (1 - dist)
    a = np.minimum(1, tt / (0.02 + 0.5 * dist))
    return norm(a * (rumble + 0.6 * crack))


def wind():
    w = fft_filter(rng.standard_normal(N), lo=120, hi=900, slope=2)
    gust = 0.55 + 0.45 * norm(np.abs(fft_filter(rng.standard_normal(N), hi=0.4)))
    return norm(w) * gust


def fire():
    out = fft_filter(brown(N), lo=60, hi=600) * 0.4
    pops = np.zeros(N)
    idx = rng.integers(0, N, int(END * 9))
    pops[idx] = rng.uniform(0.3, 1, len(idx))
    pops = fft_filter(pops, lo=1500, hi=7000)
    return norm(out + 4 * pops)


def rumble_rhythm(rate):
    """Chariot wheels rumble."""
    base = fft_filter(rng.standard_normal(N), lo=40, hi=400)
    gate = 0.5 + 0.5 * np.sin(2 * np.pi * rate * t) ** 8
    return norm(base * gate)


def metal_ring(dur=3.0, f0=620):
    """Inharmonic bronze shimmer (a divine weapon waking)."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f0 * r * tt + k) * np.exp(-tt / (dur * (0.5 - 0.06 * k))) / (k + 1)
            for k, r in enumerate([1, 1.47, 2.09, 2.76, 3.52]))
    return norm(s) * np.minimum(1, tt / 0.004)


def swell_metal(dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = fft_filter(rng.standard_normal(n), lo=2500, hi=9000) * (tt / dur) ** 2
    s += 0.4 * np.sin(2 * np.pi * 1240 * tt + 3 * np.sin(2 * np.pi * 7 * tt)) * (tt / dur) ** 3
    return norm(s)


def crackle(dur=1.0, density=60):
    n = int(dur * SR)
    s = np.zeros(n)
    idx = rng.integers(0, n, int(dur * density))
    s[idx] = rng.uniform(-1, 1, len(idx))
    return norm(fft_filter(s, lo=1800, hi=9000))


def page_turn():
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    s = fft_filter(rng.standard_normal(n), lo=900, hi=6000) * np.exp(-((tt - 0.18) / 0.12) ** 2)
    s += 0.6 * fft_filter(rng.standard_normal(n), lo=200, hi=1200) * np.exp(-((tt - 0.4) / 0.04) ** 2)
    return norm(s)


def bell(f=880, dur=3.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / (dur * d)) * a
            for r, d, a in [(1, 0.5, 1), (2.01, 0.3, 0.5), (2.76, 0.2, 0.35), (5.4, 0.08, 0.2)])
    return norm(s)


def hooves(rate=6.0, dur=2.0):
    n = int(dur * SR)
    out = np.zeros(n)
    hn = int(0.08 * SR)
    hit = fft_filter(rng.standard_normal(hn), lo=80, hi=900) * np.exp(-np.arange(hn) / SR / 0.015)
    k = 0.0
    while k < dur:
        for off in (0, 0.06, 0.15, 0.21):
            i = int((k + off) * SR)
            if i + hn < n:
                out[i:i + hn] += hit * rng.uniform(0.6, 1)
        k += 2 / rate
    return norm(out)


def murmur(dur, bright=1.0):
    n = int(dur * SR)
    base = formant(rng.standard_normal(n), [(500, 200, 1), (1500, 300, 0.5 * bright)])
    am = 0.6 + 0.4 * norm(np.abs(fft_filter(rng.standard_normal(n), hi=3)))
    return norm(base * am)


def flute(f, dur):
    """Bansuri-like breathy flute note: soft attack, delayed vibrato, breath noise."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    vib = 0.006 * np.clip((tt - 0.25) / 0.4, 0, 1) * np.sin(2 * np.pi * 5.3 * tt)
    ph = 2 * np.pi * f * tt * (1 + vib)
    tone = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    breath = fft_filter(rng.standard_normal(n), lo=f * 0.8, hi=f * 3.5) * 0.18
    e = np.minimum(1, tt / 0.09) * np.minimum(1, (dur - tt) / 0.18).clip(0, 1)
    return norm(tone + breath) * e


def rain():
    """Steady rain bed: filtered noise plus dense soft patter."""
    x = fft_filter(rng.standard_normal(N), lo=500, hi=7000) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.17 * t))
    pat = np.zeros(N)
    drop = np.exp(-np.arange(int(0.012 * SR)) / SR / 0.003)
    for i in rng.integers(0, N - len(drop), int(END * 180)):
        pat[i:i + len(drop)] += drop * rng.uniform(0.2, 1)
    return norm(norm(x) + 0.5 * fft_filter(pat, lo=1500))


def swarm():
    """Bee swarm bed: many detuned buzzing wings (tanh-squared sines) with slow beating, plus wing hiss."""
    out = np.zeros(N)
    for k in range(12):
        f = rng.uniform(165, 300)
        wob = 1 + 0.025 * np.sin(2 * np.pi * rng.uniform(2, 7) * t + rng.uniform(0, 6))
        ph = 2 * np.pi * np.cumsum(f * wob) / SR
        out += np.tanh(2.5 * np.sin(ph)) * (0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(0.2, 1.5) * t + rng.uniform(0, 6)))
    hiss = fft_filter(rng.standard_normal(N), lo=1800, hi=6000) * 0.25
    return norm(fft_filter(out, lo=140, hi=3800, slope=2) + norm(hiss) * 0.3)


def bee(dur=1.5):
    """A single bee flying past: buzz with a doppler pitch sweep and in/out swell."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    u = tt / dur
    f = 230 * (1.08 - 0.16 * u) * (1 + 0.03 * np.sin(2 * np.pi * 6 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.tanh(3 * np.sin(ph)) + 0.3 * np.tanh(3 * np.sin(2.01 * ph))
    return norm(fft_filter(s, lo=150, hi=4000, slope=2)) * np.sin(np.pi * u) ** 1.5


def conch(dur=2.2, f=330):
    """Shankh: breathy horn tone, slow attack, slight upward bend, hollow formants."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    bend = 1 - 0.03 * np.exp(-tt / 0.25)
    ph = 2 * np.pi * np.cumsum(f * bend * (1 + 0.004 * np.sin(2 * np.pi * 5 * tt))) / SR
    tone = sum(np.sin(k * ph) / k ** 1.3 for k in range(1, 9))
    breath = fft_filter(rng.standard_normal(n), lo=f, hi=f * 6) * 0.2
    s = formant(tone + breath, [(f, 80, 1), (f * 3, 200, 0.6), (1500, 400, 0.3)])
    return norm(s) * np.minimum(1, tt / 0.3) * np.clip((dur - tt) / 0.6, 0, 1)
