"""Voice-first final mix + mux onto a (silent) picture.

  python3 mix.py <video.mp4> <anim_dir> <out.mp4> [--music-db -4.3] [--sfx-db -9.5]

VO: highpass, presence lift, gentle compression - always the dominant element.
Music/SFX: stems are already ducked per word by score.py; a light sidechain adds a second layer.
Final: loudnorm -14 LUFS, true peak -1.5 dB. Video stream is copied.
"""
import argparse
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synth import ffmpeg  # noqa: E402

VO_CHAIN = "highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=6:release=120:makeup=2"


def lufs(ff, path):
    err = subprocess.run([ff, "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])


def bed_graph(g_mu, g_fx, ratio=3):
    return (
        f"[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,{VO_CHAIN},apad[vo];"
        f"[vo]asplit=3[vo1][key1][key2];"
        f"[2:a]aresample=48000,volume={g_mu:.2f}dB[mu];"
        f"[3:a]aresample=48000,volume={g_fx:.2f}dB[fx];"
        f"[mu][key1]sidechaincompress=threshold=0.015:ratio={ratio}:attack=30:release=450:makeup=1[mud];"
        f"[fx][key2]sidechaincompress=threshold=0.015:ratio={ratio}:attack=20:release=300:makeup=1[fxd];"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("anim")
    ap.add_argument("out")
    ap.add_argument("--music-db", type=float, default=-4.3)
    ap.add_argument("--sfx-db", type=float, default=-9.5)
    ap.add_argument("--end", type=float, default=None)
    a = ap.parse_args()
    ff = ffmpeg()
    pub = os.path.join(a.anim, "public")
    vo, mu, fx = (os.path.join(pub, n) for n in ("Voiceover.mp3", "music.wav", "sfx.wav"))
    if a.end is None:
        dur = subprocess.run([ff, "-hide_banner", "-i", a.video], capture_output=True, text=True).stderr
        h, m, s = re.findall(r"Duration: (\d+):(\d+):([\d.]+)", dur)[0]
        a.end = int(h) * 3600 + int(m) * 60 + float(s)
    trim = f",atrim=0:{a.end}"
    graph = bed_graph(a.music_db, a.sfx_db) + f"[vo1][mud][fxd]amix=inputs=3:normalize=0:duration=longest{trim},loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89[a]"
    subprocess.run([ff, "-v", "error", "-y", "-i", a.video, "-i", vo, "-i", mu, "-i", fx, "-filter_complex", graph,
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
                    "-movflags", "+faststart", "-shortest", a.out], check=True)
    print("wrote", a.out, f"| {lufs(ff, a.out):.1f} LUFS")


if __name__ == "__main__":
    main()
