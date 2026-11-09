"""Measure voice dominance per spoken word (the voice must lead the whole story).

  python3 check_mix.py <anim_dir> [--music-db -4.3] [--sfx-db -9.5]

Prints median / 5th percentile / min dB of voice over (music+sfx) inside each word,
and lists every word under 10 dB with its time - move thunder/impacts off those words
(into the next pause) or soften them in the cue sheet, then rebuild the score.
Target: median >= 18 dB, every word >= 5 dB.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mix import bed_graph  # noqa: E402
from synth import ffmpeg  # noqa: E402


def read(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels()) / 32768
    return a.mean(1), w.getframerate()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("anim")
    ap.add_argument("--music-db", type=float, default=-4.3)
    ap.add_argument("--sfx-db", type=float, default=-9.5)
    a = ap.parse_args()
    pub = os.path.join(a.anim, "public")
    tmp = tempfile.mkdtemp()
    vo_o, bed_o = os.path.join(tmp, "vo.wav"), os.path.join(tmp, "bed.wav")
    graph = bed_graph(a.music_db, a.sfx_db) + "[mud][fxd]amix=inputs=2:normalize=0[bed]"
    # inputs: 0 dummy (keeps the indices of mix.py), 1 VO, 2 music, 3 sfx
    # cap the length: apad + anullsrc are endless, and without -t this once filled a disk
    w = wave.open(os.path.join(pub, "music.wav"))
    dur = f"{w.getnframes() / w.getframerate():.3f}"
    w.close()
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-f", "lavfi", "-t", dur, "-i", "anullsrc", "-i", os.path.join(pub, "Voiceover.mp3"),
                    "-i", os.path.join(pub, "music.wav"), "-i", os.path.join(pub, "sfx.wav"), "-filter_complex", graph,
                    "-map", "[vo1]", "-t", dur, vo_o, "-map", "[bed]", "-t", dur, bed_o], check=True)
    v, sr = read(vo_o)
    b, _ = read(bed_o)
    words = json.load(open(os.path.join(a.anim, "src", "words.json")))
    d, low = [], []
    for s, e, w in words:
        i, j = int(s * sr), int(e * sr)
        if j <= i:
            continue
        x = 20 * np.log10(np.sqrt((v[i:j] ** 2).mean()) / (np.sqrt((b[i:j] ** 2).mean()) + 1e-9) + 1e-12)
        d.append(x)
        if x < 10:
            low.append(f"{s:6.2f}s {w.strip():14s} {x:5.1f} dB")
    print(f"voice over bed, per word: median {np.median(d):.1f} dB | 5th pct {np.percentile(d, 5):.1f} | min {min(d):.1f}")
    for line in low:
        print("  under 10 dB:", line)


if __name__ == "__main__":
    main()
