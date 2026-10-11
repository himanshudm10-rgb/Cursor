"""Global timeline: narration time (n) -> film time (g) with pre-roll and inserted pauses."""
PRE = 3.5          # dark pre-roll before first word
# (narration time near which to insert, seconds of pause)
_INS = [(30.55, 3.6),   # title card
        (136.95, 1.3),  # after "broke it"
        (150.75, 2.6),  # after "he disappeared"
        (165.55, 1.0),  # before "That's the moment"
        (221.45, 1.2),  # before "But now let's return"
        (241.25, 1.6),  # after "So who are they?"
        (285.25, 2.0),  # before the artist section
        (409.35, 1.0),  # before "But what happened next"
        (497.05, 1.6)]  # before "So now that you know"
NARR_END = 517.4
TAIL = 13.0

def _load_sil():
    import os
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sil.txt")
    st, en = [], []
    for l in open(p):
        k, v = l.split()
        (st if k.startswith("silence_start") else en).append(float(v))
    return list(zip(st, en))

def _snap(t, sil):
    best = None
    for s, e in sil:
        if s - 0.35 <= t <= e + 0.35:
            m = (s + e) / 2
            if best is None or abs(m - t) < abs(best - t): best = m
    return best if best is not None else t

SIL = _load_sil()
INS = [(_snap(t, SIL), d) for t, d in _INS]

def n2g(n):
    g = PRE + n
    for t, d in INS:
        if n >= t - 0.05: g += d
    return g

TOTAL = n2g(NARR_END) + TAIL
FPS = 24
W, H = 1920, 1080

if __name__ == "__main__":
    for t, d in INS: print(f"insert {d}s at n={t:.2f} -> g={n2g(t)-d:.2f}")
    print("TOTAL", TOTAL)
