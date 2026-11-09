"""Contact sheet of review stills:  python3 sheet.py <anim_dir> <name.jpg> t1 t2 t3 ...  (needs out/stills/s_<t>.jpg)"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "audio"))
from synth import ffmpeg  # noqa: E402

anim, out, times = sys.argv[1], sys.argv[2], sys.argv[3:]
args = []
for x in times:
    args += ["-i", os.path.join(anim, "out", "stills", f"s_{float(x):.2f}.jpg")]
f = "".join(f"[{i}]scale=360:-1[v{i}];" for i in range(len(times))) + "".join(f"[v{i}]" for i in range(len(times))) + f"hstack={len(times)}"
subprocess.run([ffmpeg(), "-v", "error", "-y", *args, "-filter_complex", f, os.path.join(anim, "out", "stills", out)], check=True)
print(os.path.join(anim, "out", "stills", out))
