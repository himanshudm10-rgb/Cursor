"""Original score built from FluidR3 GM samples. Every cue is placed on story beats (narration time n)."""
import numpy as np, subprocess, os, functools
from scipy.signal import oaconvolve, butter, sosfilt
from timeline import n2g, TOTAL, INS

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)
NAMES = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}

def m(s):
    if s[1] in "s#": return NAMES[s[0]] + 1 + 12 * (int(s[2:]) + 1)
    i = 2 if s[1] == "b" else 1
    return NAMES[s[:i]] + 12 * (int(s[i:]) + 1)

@functools.lru_cache(None)
def raw(inst, name):
    p = f"{HERE}/samples/{inst}_{name}.mp3"
    if not os.path.exists(p) or os.path.getsize(p) < 100: return None
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    x = np.frombuffer(b, np.float32).copy()
    # trim leading silence
    k = np.argmax(np.abs(x) > 0.003)
    return x[k:]

AVAIL = [f"{n}{o}" for o in range(1, 7) for n in ("C", "E", "Ab")]

@functools.lru_cache(None)
def sample(inst, midi):
    best = min((a for a in AVAIL if raw(inst, a) is not None), key=lambda a: abs(m(a) - midi))
    x = raw(inst, best)
    ratio = 2 ** ((midi - m(best)) / 12)
    if abs(ratio - 1) > 1e-6:
        idx = np.arange(0, len(x) - 1, ratio)
        x = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    return x / (np.max(np.abs(x)) + 1e-9)

SUSTAIN = {"string_ensemble_1", "cello", "contrabass", "choir_aahs", "voice_oohs", "synth_strings_1",
           "pad_2_warm", "oboe", "french_horn", "flute"}

def sustained(x, n):
    """Extend a sample to n samples: natural attack, then granular loop from the steady body."""
    a = int(0.5 * SR)
    if n <= len(x) - int(0.3 * SR): return x[:n].copy()
    lo, hi = int(0.45 * SR), max(int(0.46 * SR) + 1, len(x) - int(0.9 * SR))
    g = int(0.7 * SR); hop = g // 2
    win = np.hanning(g).astype(np.float32)
    out = np.zeros(n + g, np.float32)
    pos = a - hop
    while pos < n:
        st = rng.integers(lo, max(lo + 1, hi - g))
        out[pos:pos + g] += x[st:st + g] * win
        pos += hop
    fade = np.linspace(0, 1, hop, dtype=np.float32)
    out[:a - hop] = x[:a - hop]
    out[a - hop:a] = x[a - hop:a] * (1 - fade) + out[a - hop:a] * fade
    return out[:n]

class Track:
    def __init__(self):
        self.L = np.zeros(int((TOTAL + 2) * SR), np.float32)
        self.R = np.zeros_like(self.L)

    def note(self, inst, note, t, dur, vel=0.5, atk=None, rel=None, pan=0.0):
        midi = m(note) if isinstance(note, str) else note
        x = sample(inst, midi)
        sus = inst in SUSTAIN
        atk = atk if atk is not None else (0.6 if sus else 0.005)
        rel = rel if rel is not None else (1.5 if sus else 0.8)
        n = int((dur + rel) * SR)
        y = sustained(x, n) if sus else np.pad(x, (0, max(0, n - len(x))))[:n]
        env = np.ones(n, np.float32)
        na = min(n, max(1, int(atk * SR))); env[:na] = np.linspace(0, 1, na) ** 1.5
        nd = int(dur * SR); nr = n - nd
        if nr > 0: env[nd:] *= np.linspace(1, 0, nr) ** 2
        y = y * env * vel
        i0 = int(t * SR)
        if i0 >= len(self.L): return
        y = y[:len(self.L) - i0]
        gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.L[i0:i0 + len(y)] += y * gl
        self.R[i0:i0 + len(y)] += y * gr

    def chord(self, inst, notes, t, dur, vel=0.4, spread=0.5, **kw):
        k = len(notes)
        for j, nn in enumerate(notes):
            p = 0 if k == 1 else (j / (k - 1) * 2 - 1) * spread
            self.note(inst, nn, t, dur, vel / np.sqrt(k), pan=p, **kw)

    def arr(self):
        return np.stack([self.L, self.R], 1)

def G(n): return n2g(n)

def build():
    S = {k: Track() for k in ["low", "strings", "choir", "piano", "guitar", "wind", "brass", "harp", "perc"]}
    lo, st, ch, pi, gu, ww, br, hp, pc = (S[k] for k in ["low", "strings", "choir", "piano", "guitar", "wind", "brass", "harp", "perc"])

    # ---------- CUE 1: opening mystery (n 0 -> 27.3), music cut at "born almost" ----------
    cut1 = G(27.25)
    lo.note("contrabass", "D2", 1.2, cut1 - 1.2 - 0.4, 0.35, atk=4, rel=0.4)
    lo.note("synth_strings_1", "D3", 2.0, cut1 - 2.4, 0.18, atk=5, rel=0.4, pan=-0.3)
    lo.note("synth_strings_1", "A3", 6.0, cut1 - 6.4, 0.14, atk=5, rel=0.4, pan=0.3)
    st.note("string_ensemble_1", "A5", G(7.0), cut1 - G(7.0) - 0.4, 0.10, atk=4, rel=0.4, pan=0.4)
    st.note("string_ensemble_1", "Bb5", G(12.5), cut1 - G(12.5) - 0.4, 0.07, atk=4, rel=0.4, pan=-0.4)
    # the uncomfortable low note
    lo.note("cello", "Eb2", G(16.6), cut1 - G(16.6) - 0.4, 0.30, atk=2.5, rel=0.4)
    lo.note("contrabass", "Eb1", G(16.9), cut1 - G(16.9) - 0.4, 0.25, atk=3, rel=0.4)
    ch.chord("voice_oohs", ["A3", "Bb3", "D4"], G(19.8), cut1 - G(19.8) - 0.4, 0.16, atk=4, rel=0.4)
    # ---------- TITLE: restrained low pulse + Dm(add9) bloom ----------
    tt = G(30.48) - INS[0][1]  # first second of the inserted title pause
    pc.note("timpani", "D2", tt - 0.2, 2.0, 0.55, rel=2.5)
    lo.note("contrabass", "D1", tt - 0.2, 6.0, 0.35, atk=0.3, rel=3)
    st.chord("string_ensemble_1", ["D3", "A3", "E4", "F4", "A4"], tt + 0.2, 7.5, 0.42, atk=2.2, rel=3)
    ch.chord("choir_aahs", ["A4", "D5"], tt + 0.6, 6.5, 0.12, atk=2.5, rel=3)
    # ---------- CUE 1b: investigation of the painting (n 33 -> 88) ----------
    prog = [(["D3", "A3", "F4"], 0), (["Bb2", "F3", "D4"], 1), (["G2", "D3", "Bb3"], 2), (["A2", "E3", "Cs4"], 3)]
    t = G(34.6); end = G(87.6)
    i = 0
    while t < end - 1:
        notes = prog[i % 4][0]
        d = min(9.0, end - t)
        lo.chord("synth_strings_1", notes, t, d, 0.20, atk=2.5, rel=2.5)
        lo.note("cello", notes[0], t, d, 0.12, atk=2, rel=2)
        t += 9.0; i += 1
    motif = ["D5", "C5", "A4", "F4"]
    for k, tm in enumerate([G(39.4), G(48.9), G(61.3), G(75.2)]):
        for j, nn in enumerate(motif if k % 2 == 0 else ["A4", "G4", "F4", "D4"]):
            pi.note("acoustic_grand_piano", nn, tm + j * 0.9, 1.6, 0.22 - 0.02 * j, rel=2.5, pan=0.15)
        pi.note("acoustic_grand_piano", "D3", tm, 3.0, 0.14, rel=3)
    st.chord("string_ensemble_1", ["F4", "A4", "D5"], G(66.4), 9.0, 0.18, atk=3, rel=3)   # the glow
    # ---------- CUE 2: biblical journey (n 88.4 -> 130.5) ----------
    bpm = 72; beat = 60 / bpm
    harm = [["D3", "A3", "D4", "F4"], ["Bb2", "F3", "Bb3", "D4"], ["F2", "C3", "F3", "A3"], ["C3", "G3", "C4", "E4"],
            ["G2", "D3", "G3", "Bb3"], ["Eb3", "Bb3", "Eb4", "G4"], ["Bb2", "F3", "Bb3", "D4"], ["A2", "E3", "A3", "Cs4"]]
    t = G(88.6); end = G(130.3); bar = 0
    while t < end - beat:
        ch_ = harm[bar % 8]
        pat = [0, 1, 2, 3, 2, 1, 2, 3]
        for k8, p in enumerate(pat):
            tt_ = t + k8 * beat / 2
            if tt_ >= end: break
            fade = min(1, (tt_ - G(88.6)) / 4) * (1 - max(0, (tt_ - (end - 6)) / 6))
            gu.note("acoustic_guitar_nylon", ch_[p], tt_, beat * 1.2, 0.30 * fade, rel=1.2, pan=-0.2 + 0.1 * p)
        lo.note("cello", ch_[0], t, beat * 4, 0.12, atk=1.0, rel=1.5)
        st.chord("string_ensemble_1", ch_[1:], t, beat * 4, 0.10, atk=1.5, rel=2)
        t += beat * 4; bar += 1
    # oboe lament
    mel = [("A4", 0, 2), ("Bb4", 2, 1), ("A4", 3, 1), ("G4", 4, 2), ("F4", 6, 2), ("E4", 8, 3), ("D4", 11, 5),
           ("F4", 16, 2), ("G4", 18, 1), ("A4", 19, 1), ("Bb4", 20, 3), ("A4", 23, 1), ("G4", 24, 2), ("F4", 26, 2), ("E4", 28, 4)]
    for base in (G(96.0), G(112.0)):
        for nn, b, d in mel:
            ww.note("oboe", nn, base + b * beat, d * beat * 0.95, 0.20, atk=0.15, rel=0.6, pan=0.25)
    # ---------- CUE 3: recognition (n 130.5 -> 150.7) ----------
    lo.note("contrabass", "D2", G(130.4), G(137.1) - G(130.4), 0.25, atk=2, rel=1)
    st.note("string_ensemble_1", "A5", G(132.9), G(136.3) - G(132.9), 0.09, atk=2, rel=0.6)
    rise = [(137.2, ["D3", "A3", "D4", "F4"]), (138.6, ["Bb2", "F3", "D4", "F4"]), (139.6, ["F2", "C3", "A3", "F4"]),
            (140.0, ["D2", "A2", "D3", "Fs3", "A3", "D4", "Fs4", "A4"]), (142.6, ["Bb1", "F2", "Bb2", "D3", "F3", "Bb3", "D4", "F4"]),
            (145.0, ["G1", "D2", "G2", "D3", "G3", "Bb3", "D4", "G4"]), (147.2, ["A1", "E2", "A2", "E3", "A3", "Cs4", "E4", "A4"])]
    cutD = G(149.62)
    for k, (n0, notes) in enumerate(rise):
        t0 = G(n0); t1 = G(rise[k + 1][0]) if k + 1 < len(rise) else cutD
        v = [0.25, 0.32, 0.38, 0.62, 0.66, 0.68, 0.72][k]
        st.chord("string_ensemble_1", notes, t0, t1 - t0 + 0.05, v, atk=0.9 if k else 1.4, rel=0.25)
        lo.chord("contrabass", notes[:2], t0, t1 - t0 + 0.05, v * 0.5, atk=0.8, rel=0.25)
        if k >= 3:
            ch.chord("choir_aahs", notes[-4:], t0, t1 - t0 + 0.05, v * 0.55, atk=1.0, rel=0.25)
            br.chord("french_horn", notes[2:4], t0, t1 - t0 + 0.05, v * 0.25, atk=1.2, rel=0.25)
    pc.note("timpani", "D2", G(140.0), 2.5, 0.45, rel=2.5)
    # absence: only a high choir thread remains
    ch.chord("choir_aahs", ["A4", "E5"], cutD - 0.05, 4.2, 0.12, atk=0.05, rel=4.5)
    # ---------- CUE 4: painting investigation (n 151 -> 221.5) ----------
    t = G(151.5); end = G(221.3); i = 0
    prog4 = [["D3", "A3", "F4"], ["C3", "G3", "E4"], ["Bb2", "F3", "D4"], ["A2", "E3", "C4"]]
    while t < end - 1:
        d = min(10, end - t)
        lo.chord("synth_strings_1", prog4[i % 4], t, d, 0.17, atk=3, rel=2.5)
        t += 10; i += 1
    for tm in [G(152.0), G(158.4), G(166.0), G(172.9), G(183.9), G(190.0), G(214.4)]:
        for j, nn in enumerate(motif):
            pi.note("acoustic_grand_piano", nn, tm + j * 1.1, 1.8, 0.18 - 0.015 * j, rel=2.5, pan=0.1)
    st.chord("string_ensemble_1", ["F4", "A4", "C5", "F5"], G(198.4), 15.5, 0.24, atk=3.5, rel=3.5)   # the glow
    ch.chord("voice_oohs", ["F4", "A4", "C5"], G(207.9), 13, 0.13, atk=4, rel=3)
    # ---------- CUE 5: hidden family (n 221.5 -> 285) ----------
    t = G(221.6); end = G(240.2); k = 0
    while t < end:
        acc = 0.18 + 0.12 * (t - G(221.6)) / (end - G(221.6))
        lo.note("cello", "D2", t, 0.35, acc, atk=0.02, rel=0.4)
        lo.note("contrabass", "D1", t, 0.35, acc * 0.8, atk=0.02, rel=0.4)
        if k % 2 == 0: pc.note("timpani", "D2", t, 0.5, acc * 0.5, rel=1.2)
        t += 1.0 if t < G(229) else 0.8; k += 1
    st.chord("string_ensemble_1", ["E5", "F5"], G(221.6), G(240.2) - G(221.6), 0.08, atk=6, rel=0.5)
    st.chord("synth_strings_1", ["A3", "Bb3"], G(229.0), G(240.2) - G(229.0), 0.12, atk=4, rel=0.5)
    # "So who are they?" -> held high A alone through the pause
    st.note("string_ensemble_1", "A5", G(240.2), G(242.1) - G(240.2) + 0.3, 0.10, atk=0.3, rel=0.6)
    # the reveal
    pc.note("timpani", "D2", G(242.15), 2.0, 0.40, rel=3)
    lo.note("contrabass", "D1", G(242.15), 9.5, 0.30, atk=0.1, rel=3)
    st.chord("string_ensemble_1", ["D3", "A3", "E4", "A4"], G(242.3), 9.5, 0.28, atk=1.5, rel=3)
    st.chord("string_ensemble_1", ["Bb2", "F3", "D4", "A4"], G(252.2), 8, 0.30, atk=2.5, rel=3)
    st.chord("string_ensemble_1", ["G2", "D3", "Bb3", "E4"], G(259.9), 9, 0.22, atk=2.5, rel=3)
    # the shift: from mystery to wonder
    won = [(269.2, ["F2", "C3", "F3", "A3", "C4", "F4", "A4", "C5"]), (273.6, ["Bb1", "F2", "D3", "F3", "Bb3", "D4", "F4", "Bb4"]),
           (278.0, ["D2", "A2", "D3", "F3", "A3", "D4", "F4", "A4"]), (281.4, ["C2", "G2", "E3", "G3", "C4", "E4", "G4", "C5"])]
    for k, (n0, notes) in enumerate(won):
        t0 = G(n0); t1 = G(won[k + 1][0]) if k + 1 < len(won) else G(285.0) + 1.6
        st.chord("string_ensemble_1", notes, t0, t1 - t0 + 0.2, 0.45, atk=2.0, rel=2.5)
        ch.chord("choir_aahs", notes[-4:], t0 + 0.3, t1 - t0, 0.22, atk=2.5, rel=2.5)
        hp.chord("orchestral_harp", notes[2:], t0, 2, 0.22, rel=2, spread=0.6)
    # ---------- CUE 6: the artist (n 285 -> 376) ----------
    seg = [(287.0, ["F2", "C3", "A3"]), (294.0, ["D2", "A2", "F3"]), (301.0, ["Bb1", "F2", "D3"]), (308.0, ["C2", "G2", "E3"]),
           (313.6, ["Bb1", "F2", "D3", "F3"]), (320.5, ["F2", "C3", "A3", "C4"]), (326.0, ["G2", "D3", "Bb3", "D4"]), (332.3, ["C2", "G2", "E3", "G3"]),
           (338.1, ["F2", "C3", "A3", "C4"]), (342.9, ["D2", "A2", "F3", "A3"]), (347.5, ["Bb1", "F2", "D3", "F3"]), (352.0, ["A1", "E2", "C3", "E3"]),
           (360.3, ["D2", "A2", "F3"]), (369.2, ["Bb1", "F2", "D3"])]
    for k, (n0, notes) in enumerate(seg):
        t0 = G(n0); t1 = G(seg[k + 1][0]) if k + 1 < len(seg) else G(376.3)
        warm = n0 >= 313.6
        lo.chord("synth_strings_1", notes, t0, t1 - t0, 0.16, atk=2, rel=2)
        if warm and n0 < 352: ch.chord("voice_oohs", [x for x in notes[1:]], t0, t1 - t0, 0.10, atk=2.5, rel=2)
        if warm and n0 < 352: st.chord("string_ensemble_1", notes[1:], t0, t1 - t0, 0.14, atk=2.5, rel=2)
        # piano: broken chord, sparse
        top = [x for x in notes[1:]]
        for j in range(3):
            pi.note("acoustic_grand_piano", top[j % len(top)].replace("2", "4").replace("3", "4"), t0 + 0.4 + j * 1.3, 1.8, 0.13, rel=2.5, pan=0.1)
    cel = [("A3", 0, 3), ("G3", 3, 1), ("F3", 4, 2), ("E3", 6, 2), ("D3", 8, 4), ("F3", 12, 2), ("G3", 14, 2), ("A3", 16, 4), ("C4", 20, 2), ("Bb3", 22, 2), ("A3", 24, 6)]
    for nn, b, d in cel:
        lo.note("cello", nn, G(320.6) + b * 0.95, d * 0.95, 0.22, atk=0.4, rel=1.0, pan=-0.2)
    for tm in [G(352.2), G(364.0)]:
        for j, nn in enumerate(motif):
            pi.note("acoustic_grand_piano", nn, tm + j * 1.0, 1.8, 0.17, rel=2.5, pan=0.1)
    # ---------- CUE 7: fame (n 376 -> 409) ----------
    beat = 60 / 84
    walt = [["F2", "A3", "C4", "F4"], ["D2", "A3", "D4", "F4"], ["Bb1", "F3", "Bb3", "D4"], ["C2", "G3", "C4", "E4"],
            ["F2", "A3", "C4", "F4"], ["A1", "E3", "A3", "Cs4"], ["D2", "F3", "A3", "D4"], ["C2", "G3", "Bb3", "E4"]]
    t = G(376.5); end = G(409.1); bar = 0
    while t < end - 3 * beat:
        c = walt[bar % 8]
        prog_ = (t - G(376.5)) / (end - G(376.5))
        v = 0.22 + 0.25 * prog_
        lo.note("cello", c[0], t, beat * 0.9, v * 0.9, atk=0.05, rel=0.5)
        lo.note("contrabass", c[0], t, beat * 0.9, v * 0.5, atk=0.05, rel=0.5)
        for b in (1, 2):
            st.chord("string_ensemble_1", c[1:], t + b * beat, beat * 0.7, v * 0.55, atk=0.06, rel=0.4)
        hp.chord("orchestral_harp", c[1:] + [c[3].replace("4", "5")], t, 1.5, v * 0.6, rel=1.5, spread=0.7)
        t += 3 * beat; bar += 1
    hmel = [("C5", 0, 3), ("A4", 3, 2), ("Bb4", 5, 1), ("C5", 6, 3), ("D5", 9, 3), ("C5", 12, 4), ("Bb4", 16, 2), ("A4", 18, 6)]
    for base, inst, v in [(G(386.0), "flute", 0.16), (G(398.4), "french_horn", 0.26)]:
        for nn, b, d in hmel:
            br.note(inst, nn if inst == "flute" else nn.replace("5", "4").replace("4", "4"), base + b * beat, d * beat, v, atk=0.15, rel=0.7)
    # Institut de France cadence
    st.chord("string_ensemble_1", ["F2", "C3", "F3", "A3", "C4", "F4", "A4", "C5"], G(405.6), G(409.1) - G(405.6) + 0.6, 0.55, atk=0.4, rel=1.5)
    br.chord("french_horn", ["F3", "A3", "C4"], G(405.6), G(409.1) - G(405.6), 0.25, atk=0.5, rel=1.2)
    pc.note("timpani", "F2", G(405.6), 2, 0.35, rel=2)
    # ---------- CUE 8: decline (n 409 -> 463.7), layers removed ----------
    dec = [(409.5, ["A2", "E3", "C4"]), (417.6, ["F2", "C3", "A3"]), (425.6, ["D2", "A2", "F3"]), (433.2, ["E2", "B2", "G3"]),
           (441.3, ["A2", "E3", "C4"]), (447.2, ["F2", "C3", "A3"]), (455.6, ["D2", "A2", "F3"])]
    for k, (n0, notes) in enumerate(dec):
        t0 = G(n0); t1 = G(dec[k + 1][0]) if k + 1 < len(dec) else G(463.5)
        if n0 < 433: lo.note("cello", notes[0], t0, t1 - t0, 0.12, atk=2, rel=2)
        if n0 < 446: st.chord("string_ensemble_1", notes[1:], t0, t1 - t0, 0.13 * (1 - (n0 - 409) / 50), atk=3, rel=2.5)
        lo.chord("synth_strings_1", notes, t0, t1 - t0, 0.10 if n0 < 455 else 0.06, atk=3, rel=2.5)
        for j in range(2 if n0 < 446 else 1):
            pi.note("acoustic_grand_piano", notes[2].replace("3", "4"), t0 + 0.5 + j * 2.6, 2.2, 0.14, rel=3)
            pi.note("acoustic_grand_piano", notes[1].replace("2", "4").replace("3", "4"), t0 + 1.8 + j * 2.6, 2.2, 0.10, rel=3)
    # ---------- CUE 9: ending reprise (n 463.7 -> end) ----------
    mot_maj = ["D5", "Cs5", "A4", "Fs4"]
    endp = [(463.7, ["D2", "A2", "D3", "Fs3", "A3"]), (472.8, ["B1", "Fs2", "D3", "Fs3", "B3"]), (477.4, ["G1", "D2", "B2", "D3", "G3"]),
            (486.7, ["A1", "E2", "Cs3", "E3", "A3"]), (490.9, ["D2", "A2", "Fs3", "A3", "D4"]), (497.0, ["B1", "Fs2", "D3", "Fs3", "B3"]),
            (505.6, ["G1", "D2", "B2", "D3", "G3"]), (510.6, ["A1", "E2", "Cs3", "E3", "A3"]), (517.4, ["D2", "A2", "Fs3", "A3", "D4", "Fs4"])]
    for k, (n0, notes) in enumerate(endp):
        t0 = G(n0); t1 = G(endp[k + 1][0]) if k + 1 < len(endp) else TOTAL - 0.5
        last = k == len(endp) - 1
        v = 0.30 if n0 < 477 else (0.38 if n0 < 497 else 0.32)
        st.chord("string_ensemble_1", notes, t0, t1 - t0 + (0 if last else 0.3), v * (1.25 if last else 1), atk=2.5, rel=4 if last else 2)
        lo.note("contrabass", notes[0], t0, t1 - t0, 0.18, atk=2, rel=3 if last else 1.5)
        if n0 >= 477: ch.chord("choir_aahs", notes[-3:], t0 + 0.4, t1 - t0, 0.15 if not last else 0.2, atk=3, rel=4 if last else 2)
    for tm in [G(464.0), G(477.6), G(491.2), G(501.4), G(517.6)]:
        for j, nn in enumerate(mot_maj):
            pi.note("acoustic_grand_piano", nn, tm + j * 1.15, 2.0, 0.20 - 0.015 * j, rel=3, pan=0.1)
        pi.note("acoustic_grand_piano", "D3", tm, 4, 0.12, rel=3)
    hp.chord("orchestral_harp", ["D4", "Fs4", "A4", "D5", "Fs5"], G(517.6) + 4.8, 3, 0.25, rel=5, spread=0.7)
    return S

def reverb_ir(sec=3.4, seed=1):
    r = np.random.default_rng(seed)
    n = int(sec * SR); t = np.arange(n) / SR
    env = np.exp(-t * 6.9 / sec)
    ir = np.stack([r.standard_normal(n) * env, r.standard_normal(n) * env], 1).astype(np.float32)
    sos = butter(2, 5500, "low", fs=SR, output="sos")
    ir = sosfilt(sos, ir, axis=0)
    ir[:int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(0).mean())

def mixdown(S):
    sends = {"low": 0.35, "strings": 0.55, "choir": 0.65, "piano": 0.45, "guitar": 0.30, "wind": 0.40, "brass": 0.45, "harp": 0.5, "perc": 0.45}
    gains = {"low": 1.0, "strings": 1.0, "choir": 1.0, "piano": 0.9, "guitar": 0.9, "wind": 0.9, "brass": 0.9, "harp": 0.8, "perc": 0.9}
    dry = 0; wet = 0
    for k, tr in S.items():
        a = tr.arr() * gains[k]
        dry = dry + a; wet = wet + a * sends[k]
    ir = reverb_ir()
    rev = np.stack([oaconvolve(wet[:, 0], ir[:, 0])[:len(wet)], oaconvolve(wet[:, 1], ir[:, 1])[:len(wet)]], 1)
    out = dry * 0.8 + rev * 0.35
    sos = butter(2, 35, "high", fs=SR, output="sos")
    out = sosfilt(sos, out, axis=0)
    return (out / (np.max(np.abs(out)) + 1e-9) * 0.89).astype(np.float32)

if __name__ == "__main__":
    S = build()
    mus = mixdown(S)
    import wave
    np.save(f"{HERE}/music.npy", mus)
    pcm = (np.clip(mus, -1, 1) * 32767).astype(np.int16)
    with wave.open(f"{HERE}/music.wav", "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print("music", mus.shape, len(mus) / SR)
