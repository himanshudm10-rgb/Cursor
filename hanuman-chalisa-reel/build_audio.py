"""Build the score + SFX stems for the Hanuman reel.

  python3 build_audio.py            -> anim/public/music.wav, anim/public/sfx.wav

Music bed: Epidemic Sound "Court of Akbar" (sitar; Karl Gustaf Westman / Andreas Unge), cut to 62.8 s with Epidemic's EditRecording
(quiet intro -> full orchestra ~9.5 s, a natural dip at 34-39 s under the Sita/ring moment, rebuild at 40 s
as Ravan sends his warriors). It is shaped with our own envelope (a breath before the Lanka reveal,
lowered for the humble final line, faded after the black cut) and layered with the skill's synthesized
impacts/risers. SFX: the skill's synth lanes (cues.json) plus Epidemic one-shots (tail ignition, burning
city, temple bells). Both stems are ducked under every word with the skill's look-ahead envelope.
"""
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "tools", "audio"))
import score  # noqa: E402
import synth as S  # noqa: E402

ANIM = os.path.join(HERE, "anim")
EPI = os.path.join(HERE, "audio", "epidemic")


def load(path, gain_db=0.0):
    raw = subprocess.run([S.ffmpeg(), "-v", "error", "-i", path, "-ac", "2", "-ar", str(S.SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
    return a * 10 ** (gain_db / 20)


def place2(buf, sig, at, gain=1.0):
    i = int(at * S.SR)
    n = min(sig.shape[1], buf.shape[1] - i)
    if n > 0:
        buf[:, i:i + n] += gain * sig[:, :n]


# ------------------------------------------------------------------ damru + tanpura
def damru_hit(f, gain=1.0, decay=0.09):
    """One strike of the damru: a tight, high-tuned skin (pitch drops a little) + the bead's click + a short rattle."""
    n = int(0.35 * S.SR)
    tt = np.arange(n) / S.SR
    pitch = f * (1 + 0.25 * np.exp(-tt / 0.012))
    body = np.sin(2 * np.pi * np.cumsum(pitch) / S.SR) * np.exp(-tt / decay)
    body += 0.35 * np.sin(2 * np.pi * np.cumsum(pitch * 2.31) / S.SR) * np.exp(-tt / (decay * 0.5))
    click = S.fft_filter(S.rng.standard_normal(n), lo=1800, hi=7000) * np.exp(-tt / 0.004) * 0.6
    rattle = S.fft_filter(S.rng.standard_normal(n), lo=2500, hi=9000) * np.exp(-tt / 0.03) * 0.12
    return (body + click + rattle) * gain


def damru_roll(buf, t0, t1, g0, g1, f_hi=520, f_lo=430, start_gap=0.16, end_gap=0.045, pan=0.0):
    """Accelerating alternating strikes of the two heads (the classic damru roll)."""
    tm, k = t0, 0
    while tm < t1:
        u = (tm - t0) / max(t1 - t0, 1e-3)
        g = g0 + (g1 - g0) * u
        hit = damru_hit(f_hi if k % 2 == 0 else f_lo, g)
        S.place(buf[0], hit, tm, np.sqrt(0.5 * (1 - pan)))
        S.place(buf[1], hit, tm + 0.004, np.sqrt(0.5 * (1 + pan)))
        tm += start_gap + (end_gap - start_gap) * u
        k += 1


def damru_groove(buf, t0, t1, bpm, g, pattern="x.xx.x.xx.x.x.xx"):
    """A steady damru rhythm in 16ths; accents on the beat."""
    six = 60 / bpm / 4
    tm, k = t0, 0
    while tm < t1:
        ch = pattern[k % len(pattern)]
        if ch == "x":
            acc = 1.0 if k % 4 == 0 else 0.62
            hit = damru_hit(520 if k % 2 == 0 else 430, g * acc)
            S.place(buf[0], hit, tm, 0.7)
            S.place(buf[1], hit, tm + 0.004, 0.7)
        tm += six
        k += 1


def damru_track():
    b = np.zeros((2, S.N))
    damru_roll(b, 0.0, 1.1, 0.35, 0.8, start_gap=0.18, end_gap=0.06)          # opening, under the chant
    damru_roll(b, 4.05, 4.75, 0.3, 0.9, start_gap=0.12, end_gap=0.04)          # into the narration
    damru_groove(b, 4.8, 11.5, 96, 0.22, "x.......x.......")                   # a gentle pulse under the intro
    damru_roll(b, 15.5, 16.32, 0.3, 1.0, start_gap=0.12, end_gap=0.035)       # strength beyond comparison
    damru_groove(b, 16.4, 19.0, 96, 0.35, "x...x...x.x.x...")
    damru_roll(b, 21.0, 22.2, 0.25, 1.0, start_gap=0.16, end_gap=0.03)        # the Lanka reveal
    damru_groove(b, 22.3, 24.7, 96, 0.4, "x..x..x.x..x..x.")
    damru_groove(b, 27.28, 28.55, 132, 0.55, "xxx.xxx.xxx.xxx.")              # the leap over the ocean
    damru_groove(b, 28.6, 31.2, 96, 0.22, "x.......x...x...")
    # 31.8 - 37.3: silence for Sita and the ring (sitar alone)
    damru_roll(b, 38.4, 39.1, 0.3, 1.0, start_gap=0.1, end_gap=0.035)         # he rises -> destroys the grove
    damru_groove(b, 39.12, 41.1, 112, 0.55, "x.xx.x.xx.x.x.xx")
    damru_groove(b, 41.12, 46.1, 112, 0.6, "x.xx.xx.x.xx.xxx")                # Ravan sends his warriors / Akshay
    damru_roll(b, 44.6, 45.3, 0.4, 1.0, start_gap=0.08, end_gap=0.03)
    damru_groove(b, 46.2, 48.7, 112, 0.45, "x...x.x.x...x.xx")
    damru_roll(b, 48.0, 48.72, 0.4, 1.0, start_gap=0.08, end_gap=0.028)       # into the burning of Lanka
    damru_groove(b, 48.74, 51.9, 120, 0.85, "xxxx.xx.xxxx.xxx")               # the peak
    damru_roll(b, 52.6, 53.3, 0.5, 1.0, start_gap=0.07, end_gap=0.03)         # the kingdom shakes
    damru_groove(b, 53.3, 54.9, 112, 0.5, "x.x.x.x.x...x...")
    damru_roll(b, 58.95, 59.5, 0.5, 0.15, start_gap=0.05, end_gap=0.12)       # a last, slowing flourish after "doot."
    return S.reverb(b, 1.2, 0.18)


def tanpura():
    """Soft drone on Sa and Pa (D and A), swelling slowly; carries the ending after the sitar fades."""
    d = S.drone(S.hz("D2"), harm=6) * 0.6 + S.drone(S.hz("A2"), harm=5) * 0.35 + S.drone(S.hz("D3"), harm=4) * 0.25
    env = S.env([(0, 0.0), (1.5, 0.6), (31.0, 0.6), (32.5, 1.0), (37.2, 1.0), (38.5, 0.5), (54.9, 0.5), (56.0, 1.0), (59.7, 1.0), (60.66, 0.0)])
    x = S.norm(S.fft_filter(d, hi=2500)) * env
    return np.stack([x, x])


def main():
    c = json.load(open(os.path.join(HERE, "cues.json")))
    S.setup(c["end"])
    pub = os.path.join(ANIM, "public")
    e = score.vo_envelope(os.path.join(pub, "Voiceover.mp3"))

    # ---- music: Epidemic sitar bed + synthesized damru + drone + impacts/risers
    bed = np.zeros((2, S.N))
    place2(bed, load(os.path.join(EPI, "court_of_akbar_edit.wav")), 0.0)
    shape = S.env([(0, 0.0), (0.35, 1.0), (21.75, 1.0), (22.1, 0.35), (22.28, 1.0),  # breath before the Lanka reveal
                   (54.7, 1.0), (55.4, 0.7), (57.3, 0.7), (58.0, 0.0), (60.66, 0.0)])
    bed *= shape
    bed = bed / (np.max(np.abs(bed)) + 1e-9)
    dam = damru_track()
    dam = dam / (np.max(np.abs(dam)) + 1e-9)
    drone = tanpura()
    synth_mus = score.build_music(c)
    synth_mus = synth_mus / (np.max(np.abs(synth_mus)) + 1e-9)
    music = bed * 0.8 + dam * 0.55 + drone * 0.22 + synth_mus * 0.3
    score.write(music * (1 - c["duck"]["music"] * e), os.path.join(pub, "music.wav"))

    # ---- sfx: synth lanes + Epidemic one-shots
    fx = score.build_sfx(c)
    fx = fx / (np.max(np.abs(fx)) + 1e-9)
    epi = np.zeros((2, S.N))
    ign = load(os.path.join(EPI, "fire_ignite.wav"))
    place2(epi, ign, 47.33 - 1.4, 1.6)  # whoosh onset ~1.4 s into the file -> lands on the tail igniting
    big = load(os.path.join(EPI, "fire_large.wav"))
    big *= np.interp(np.arange(big.shape[1]) / S.SR, [0, 0.3, 6.0, 9.0, 13.4], [0, 1, 1, 0.5, 0])
    place2(epi, big, 48.74, 0.9)  # burning Lanka
    bell = load(os.path.join(EPI, "temple_bell.wav"))
    for tm, g in [(10.95, 0.8), (58.95, 1.0)]:  # in the pause after "every line."; the last bell after "doot."
        place2(epi, bell, tm, g)
    epi = epi / (np.max(np.abs(epi)) + 1e-9)
    sfx = fx * 0.75 + epi * 0.55
    score.write(sfx * (1 - c["duck"]["sfx"] * e), os.path.join(pub, "sfx.wav"))


if __name__ == "__main__":
    main()
