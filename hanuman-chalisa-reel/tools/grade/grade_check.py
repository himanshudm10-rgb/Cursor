"""Measure frames against the house grade targets.  python3 grade_check.py img1.jpg img2.jpg ...
Targets (reference films): median luma 0.13 (night/storm) .. 0.28 (day); p98 luma 0.30 .. 0.75 (no clipping);
p2 luma 0.03 .. 0.10 (lifted blacks); mean saturation 0.35 .. 0.50; shadows warm (R >= B) except storms (teal-grey, G ~ B)."""
import sys
import numpy as np
from PIL import Image
for p in sys.argv[1:]:
    a = np.asarray(Image.open(p).convert('RGB').resize((480, 270))).reshape(-1, 3) / 255.
    l = a @ [.299, .587, .114]
    s = ((a.max(1) - a.min(1)) / np.maximum(a.max(1), 1e-3)).mean()
    lo = a[l <= np.percentile(l, 10)].mean(0)
    p2, p50, p98 = np.percentile(l, [2, 50, 98])
    flags = [n for n, bad in [('too dark', p50 < 0.11), ('too bright', p50 > 0.32), ('clipping', p98 > 0.8), ('crushed blacks', p2 < 0.02),
                              ('oversaturated', s > 0.55), ('cold shadows (fine only in storms)', lo[2] > lo[0] + 0.01 and lo[2] > lo[1] + 0.01)] if bad]
    print(f'{p}: p2 {p2:.3f} p50 {p50:.3f} p98 {p98:.3f} sat {s:.2f} shadows {np.round(lo, 3)}  {"OK" if not flags else ", ".join(flags)}')
