"""Build the epic score + SFX stems from a cue sheet.

  python3 score.py cues.json <anim_dir>
    reads  <anim_dir>/public/Voiceover.mp3
    writes <anim_dir>/public/music.wav and sfx.wav  (already ducked ~-14 dB under every word, with look-ahead)

Cue sheet format: see cues.indra.json (the reference film) and SKILL.md section "Score cue sheet".
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth as S  # noqa: E402


def stereo_bus():
    return np.zeros(S.N), np.zeros(S.N)


def build_music(c):
    L, R = stereo_bus()

    def add(sig, gain=1.0, pan=0.0):
        nonlocal L, R
        L += sig * gain * np.sqrt(0.5 * (1 - pan))
        R += sig * gain * np.sqrt(0.5 * (1 + pan))

    def at(sig, time, gain=1.0, pan=0.0):
        b = np.zeros(S.N)
        S.place(b, sig, time, 1.0)
        add(b, gain, pan)

    tonic = c.get("tonic", "D")
    # ---- intro: cold, uneasy (drone + dissonant shimmer + low tremolo strings)
    if c.get("intro"):
        u = c["intro"]["until"]
        fi = c["intro"].get("fade_in", 1.5)
        cold = S.env([(0, 0), (fi, 0.55), (u - 0.55, 0.6), (u, 0), (S.END, 0)])
        add(S.drone(S.hz(tonic + "2"), harm=5) * cold, 0.35)
        add(S.fft_filter(S.drone(S.hz(tonic + "2") * 4.2378, harm=2), lo=200) * cold, 0.05, -0.4)  # minor 9th above the octave: unease
        trem = S.env([(0, 0), (min(3, u * 0.4), 0), (u * 0.75, 0.3), (u - 0.05, 0.5), (u, 0), (S.END, 0)])
        add(S.fft_filter(S.saw(S.hz(tonic + "2"), S.N, harm=10), hi=400) * trem * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * S.t)), 0.06)

    # ---- chords: brass / choir / strings / sub
    hush_after = c.get("hush", [[1e9]])[0][0]
    for (t0, d, ch, b, ch_g, s_g) in c["chords"]:
        tail = 0.0 if (t0 + d >= hush_after - 0.1 and t0 < hush_after) else 0.6
        if b:
            at(S.brass(ch, d + tail, bright=0.6 + 0.4 * min(b, 1)), t0, 0.16 * b, -0.15)
        if ch_g:
            at(S.choir(ch, d + tail), t0, 0.07 * ch_g, 0.2)
        if s_g:
            at(S.strings(ch, d + tail), t0, 0.06 * s_g, 0.35)
        n = int((d + 0.3) * S.SR)
        tt = np.arange(n) / S.SR
        at(np.sin(2 * np.pi * S.hz(S.ROOTS[ch]) * tt) * S.adsr(n, 0.2, 0.4), t0, 0.12 * max(b, 0.4))
    # ---- hush: one high held tonic + thin pad (the "forgotten / today" moment)
    for (t0, d) in c.get("hush", []):
        at(S.norm(S.saw(S.hz(tonic + "5"), int(d * S.SR), harm=6, vib=0.006)) * S.adsr(int(d * S.SR), 0.4, 0.8), t0, 0.025, 0.3)
        at(S.strings(c.get("hush_chord", "Dm"), d - 0.2), t0, 0.025)

    # ---- 16th-note string ostinato
    beat = 60 / c.get("bpm", 84)
    six = beat / 4
    pat = c.get("ostinato_pattern", ["D3", "D3", "A2", "D3", "F3", "D3", "A2", "D3"])
    for (t0, t1, g0, g1) in c.get("ostinato", []):
        k, tm = 0, t0
        while tm < t1:
            g = g0 + (g1 - g0) * (tm - t0) / (t1 - t0)
            at(S.ostinato_note(S.hz(pat[k % len(pat)])), tm, 0.05 * g * (1.25 if k % 4 == 0 else 1), 0.25 if k % 2 else -0.25)
            tm += six
            k += 1

    # ---- taiko ensemble
    big, mid, rim = S.drum(55, 0.9), S.drum(95, 0.45), S.drum(160, 0.2)
    perc = np.zeros(S.N)
    for (t0, t1, g0, g1, dense) in c.get("grooves", []):
        k, tm = 0, t0
        step = beat / 2 if dense else beat
        while tm < t1:
            g = g0 + (g1 - g0) * (tm - t0) / max(t1 - t0, 1e-3)
            if k % 8 in (0, 3, 6):
                S.place(perc, big, tm, g)
            if k % 2 == 1:
                S.place(perc, mid, tm, g * 0.55)
            if dense > 1:
                S.place(perc, rim, tm + step / 2, g * 0.25)
            tm += step
            k += 1
    for (t0, t1, g0, g1) in c.get("rolls", []):
        tm, step = t0, 0.12
        while tm < t1:
            S.place(perc, mid, tm, g0 + (g1 - g0) * (tm - t0) / (t1 - t0))
            tm += step
            step = max(0.05, step * 0.93)
    add(S.fft_filter(perc, hi=4000), 0.42)

    # ---- bansuri motif: [start, [[note, dur], ...], gain]
    for (t0, notes, g) in c.get("flute", []):
        tm = t0
        for (nt, d) in notes:
            if nt != "-":
                at(S.flute(S.hz(nt), d + 0.12), tm, 0.09 * g, 0.1)
            tm += d

    for (tm, g) in c.get("impacts", []):
        at(S.impact(1.0 + g), tm, g * 0.5)
    for (tm, d, g) in c.get("risers", []):
        at(S.riser(d), tm - d, g * 0.08)

    mix = np.stack([L, R]) * S.env(c["music_env"])
    return S.reverb(mix, 2.8, 0.45)


def build_sfx(c):
    L, R = stereo_bus()
    x = c.get("sfx", {})

    def add(sig, gain=1.0, pan=0.0):
        nonlocal L, R
        L += sig * gain * np.sqrt(0.5 * (1 - pan))
        R += sig * gain * np.sqrt(0.5 * (1 + pan))

    def at(sig, time, gain=1.0, pan=0.0):
        b = np.zeros(S.N)
        S.place(b, sig, time, 1.0)
        add(b, gain, pan)

    def E(name):
        return S.env([tuple(p) for p in x[name]]) if x.get(name) else None

    for tm in x.get("cracks", []):  # stone cracking
        at(S.crackle(0.7, 200) * np.exp(-np.arange(int(0.7 * S.SR)) / S.SR / 0.2), tm, 0.3)
    for (tm, s) in x.get("thunder", []):
        at(S.thunder(dist=1 - s * 0.8, dur=6), tm + 0.04 + (1 - s) * 0.4, 0.4 + 0.6 * s)
    for (tm, g) in x.get("metal", []):
        at(S.metal_ring(3.0, 560), tm, g * 0.4, -0.2)
        at(S.swell_metal(0.8), tm + 0.2, g * 0.2, 0.2)
    for (tm, d) in x.get("crackle", []):
        at(S.crackle(d, 140) * np.hanning(int(d * S.SR)), tm, 0.25)
    for tm in x.get("page_turns", []):
        at(S.page_turn(), tm, 0.35, S.rng.uniform(-0.4, 0.4))
    if E("wind") is not None:
        add(S.wind() * E("wind"), 0.5, -0.3)
    if E("rain") is not None:
        add(S.rain() * E("rain"), 0.22, 0.0)
    if E("fire") is not None:
        add(S.fire() * E("fire"), 0.3, 0.35)
    if E("river") is not None:
        river = S.fft_filter(S.rng.standard_normal(S.N), lo=300, hi=4000) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.3 * S.t))
        add(S.norm(river) * E("river"), 0.15, 0.3)
    if E("chariot") is not None:
        add(S.rumble_rhythm(5.5) * E("chariot"), 0.45)
    hv = np.zeros(S.N)
    for (tm, rate, d) in x.get("hooves", []):
        S.place(hv, S.hooves(rate, d), tm)
    add(hv, 0.45, 0.15)
    if E("swarm") is not None:
        add(S.swarm() * E("swarm"), 0.35, 0.1)
    for (tm, d, g) in x.get("bee", []):
        at(S.bee(d), tm, g * 0.4, S.rng.uniform(-0.5, 0.5))
    for (tm, d, g) in x.get("conch", []):
        at(S.conch(d), tm, g * 0.35, -0.1)
    if E("crowd") is not None:
        add(S.murmur(S.N / S.SR) * E("crowd"), 0.18)
    for b in x.get("bells", []):
        tm, f, g = b[0], b[1], b[2]
        d = b[3] if len(b) > 3 else 2.0
        at(S.bell(f, d), tm, g, S.rng.uniform(-0.5, 0.5))
    mix = np.stack([L, R]) * S.env(c["sfx_env"])
    return S.reverb(mix, 1.6, 0.25)


def vo_envelope(vo_path, threshold=0.005):
    raw = subprocess.run([S.ffmpeg(), "-v", "error", "-i", vo_path, "-ac", "1", "-ar", str(S.SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    v = np.frombuffer(raw, np.float32)
    v = np.pad(v, (0, max(0, S.N - len(v))))[:S.N]
    win = int(0.04 * S.SR)
    rms = np.sqrt(np.convolve(v ** 2, np.ones(win) / win, mode="same"))
    act = (rms > threshold).astype(float)
    act = np.convolve(act, np.ones(int(0.37 * S.SR)), mode="same")[:S.N] > 0  # widen words: look-ahead + tail
    k = int(0.12 * S.SR)
    return np.clip(np.convolve(act.astype(float), np.ones(k) / k, mode="same"), 0, 1)


def write(mix, path):
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(S.SR)
        w.writeframes(pcm.tobytes())
    print("wrote", path)


def main():
    cues_path, anim = sys.argv[1], sys.argv[2]
    c = json.load(open(cues_path))
    S.setup(c["end"])
    S.TRANSPOSE = c.get("transpose", 0)
    pub = os.path.join(anim, "public")
    e = vo_envelope(os.path.join(pub, "Voiceover.mp3"))
    duck = c.get("duck", {"music": 0.8, "sfx": 0.85})
    write(build_music(c) * (1 - duck["music"] * e), os.path.join(pub, "music.wav"))
    write(build_sfx(c) * (1 - duck["sfx"] * e), os.path.join(pub, "sfx.wav"))


if __name__ == "__main__":
    main()
