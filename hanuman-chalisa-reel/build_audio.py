"""Build the score + SFX stems for the Hanuman reel.

  python3 build_audio.py            -> anim/public/music.wav, anim/public/sfx.wav

Music bed: Epidemic Sound "Dragon King" (Jo Wandrini), cut to 62.8 s with Epidemic's EditRecording
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


def main():
    c = json.load(open(os.path.join(HERE, "cues.json")))
    S.setup(c["end"])
    pub = os.path.join(ANIM, "public")
    e = score.vo_envelope(os.path.join(pub, "Voiceover.mp3"))

    # ---- music: Epidemic bed + synth impacts/risers
    bed = np.zeros((2, S.N))
    place2(bed, load(os.path.join(EPI, "dragon_king_edit.wav")), 0.0)
    shape = S.env([(0, 1.0), (21.75, 1.0), (22.15, 0.25), (22.28, 1.0),  # a breath, then the Lanka reveal
                   (54.7, 1.0), (55.4, 0.5), (59.56, 0.5), (59.9, 0.7), (60.2, 0.5), (60.66, 0.0)])  # humble last line, fade after black
    bed *= shape
    bed = bed / (np.max(np.abs(bed)) + 1e-9)
    synth_mus = score.build_music(c)
    synth_mus = synth_mus / (np.max(np.abs(synth_mus)) + 1e-9)
    music = bed * 0.85 + synth_mus * 0.35
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
