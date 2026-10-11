"""Subtitles from the word-level transcript: ASR fixes, single-line cues on the film timeline, SRT + ASS."""
import json, os
from timeline import n2g, NARR_END

HERE = os.path.dirname(os.path.abspath(__file__))
W = json.load(open(f"{HERE}/words.json"))
words = [[w["w"], w["s"]] for w in W]

FIX = [
    ("ghost like,", "ghost-like,"), ("painting. because", "painting, because"), ("faces one man", "faces: one man"),
    ("shocked. while", "shocked, while"), ("near by.", "nearby."), ("every one else,", "everyone else,"),
    ("Emaus.", "Emmaus."), ("Pascal dagnam Bouvret", "Pascal Dagnan-Bouveret"),
    ("eighteen ninety six and eighteen ninety seven,", "1896 and 1897,"),
    ("strange part neither", "strange part: neither"), ("reached a mouse,", "reached Emmaus,"),
    ("Jesus The same", "Jesus. The same"), ("surprised they're", "surprised, they're"),
    ("Pascal Dagnon Bouvre the woman", "Pascal Dagnan-Bouveret. The woman"), ("Anne Marie and", "Anne-Marie, and"),
    ("Anne Marie,", "Anne-Marie,"), ("two thousand", "2,000"), ("naturally that", "naturally, that"),
    ("question why", "question: why"), ("Dagnom Bouveret", "Dagnan-Bouveret"), ("Dagnard Bouveret", "Dagnan-Bouveret"),
    ("eighteen nineties something", "1890s, something"), ("unusual he was", "unusual, he was"), ("ago. they", "ago, they"),
    ("Goya. and", "Goya, and"), ("time Dagnan-Bouveret", "time, Dagnan-Bouveret"), ("nineteen hundred", "1900,"),
    ("nineteen twenty nine,", "1929,"), ("To day", "Today,"), ("created those", "created, those"),
    ("moment in a way he", "moment. In a way, he"), ("table? or", "table? Or"),
]

def apply(words, src, dst):
    s, d = src.split(), dst.split()
    out, i, hits = [], 0, 0
    while i < len(words):
        if [w[0] for w in words[i:i + len(s)]] == s:
            ts = [w[1] for w in words[i:i + len(s)]]
            for k, x in enumerate(d): out.append([x, ts[min(k, len(ts) - 1)]])
            i += len(s); hits += 1
        else:
            out.append(words[i]); i += 1
    return out, hits

for a, b in FIX:
    words, h = apply(words, a, b)
    assert h, f"fix not applied: {a}"

MAXC = 44
WEAK = {"the", "a", "an", "of", "at", "to", "in", "and", "or", "his", "her", "their", "this", "that", "is", "was", "from", "with", "for", "on", "by", "as", "but", "so", "you", "he", "they", "we", "like", "about", "into", "what", "who", "were", "are", "be", "it's", "there's", "if", "when", "how", "why", "than", "because", "had", "has", "could", "would", "can"}
def text(c): return " ".join(w[0] for w in c)

def split_long(c):
    n = max(2, -(-len(text(c)) // MAXC))
    best = None
    def rec(c, n):
        if n == 1:
            L = len(text(c)); return (0 if L <= MAXC else 1e6, [c])
        tgt = len(text(c)) / n; res = None
        for j in range(1, len(c)):
            L = len(text(c[:j]))
            if L > MAXC: break
            pen = abs(L - tgt) + (25 if c[j - 1][0].lower().strip(",") in WEAK else 0)
            sub = rec(c[j:], n - 1)
            tot = pen + sub[0]
            if res is None or tot < res[0]: res = (tot, [c[:j]] + sub[1])
        return res or (1e6, [c])
    while True:
        r = rec(c, n)
        if r[0] < 1e5: return r[1]
        n += 1

# sentences -> clauses -> packed single lines
sents, cur = [], []
for w in words:
    cur.append(w)
    if w[0][-1] in ".?!": sents.append(cur); cur = []
if cur: sents.append(cur)
cues = []
for snt in sents:
    clauses, cl = [], []
    for w in snt:
        cl.append(w)
        if w[0][-1] in ",:;": clauses.append(cl); cl = []
    if cl: clauses.append(cl)
    line = []
    for cl in clauses:
        if line and len(text(line + cl)) <= MAXC: line += cl; continue
        if line: cues.append(line); line = []
        if len(text(cl)) <= MAXC: line = list(cl)
        else:
            parts = split_long(cl); cues += parts[:-1]; line = list(parts[-1])
    if line: cues.append(line)
# fold tiny tails into the previous line when they fit
merged = []
for c in cues:
    if merged and len(text(c)) < 14 and len(text(merged[-1] + c)) <= MAXC + 6 and merged[-1][-1][0][-1] not in ".?!":
        merged[-1] += c
    else: merged.append(c)
cues = merged
# fold tiny heads ("Well,", "and everything") forward into the next line when they fit
out = []
i = 0
while i < len(cues):
    c = cues[i]
    if i + 1 < len(cues) and len(text(c)) < 16 and len(text(c + cues[i + 1])) <= MAXC + 4:
        cues[i + 1] = c + cues[i + 1]
    else: out.append(c)
    i += 1
cues = out
for i, c in enumerate(cues):   # keep the museum name on one line
    if text(c).startswith("Today, the painting is preserved at"):
        k = [w[0] for w in c].index("preserved") + 1
        cues[i + 1] = c[k:] + cues[i + 1]; cues[i] = c[:k]

def g(n): return n2g(n)
rows = []
for i, c in enumerate(cues):
    st = g(c[0][1]) - 0.08
    nxt = g(cues[i + 1][0][1]) - 0.08 if i + 1 < len(cues) else g(NARR_END) + 0.6
    last = g(c[-1][1])
    en = min(nxt - 0.04, last + 0.75 + 0.06 * len(c[-1][0]))
    en = max(en, min(st + 1.0, nxt - 0.04))
    rows.append((st, en, text(c)))

def ts(t, sep):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{int(s):02d}{sep}{int(round((s - int(s)) * 1000)):03d}" if sep == "," else f"{h:d}:{m:02d}:{s:05.2f}"

with open(f"{HERE}/subtitles.srt", "w") as f:
    for i, (a, b, t) in enumerate(rows, 1):
        f.write(f"{i}\n{ts(a, ',')} --> {ts(b, ',')}\n{t}\n\n")

with open(f"{HERE}/subtitles.ass", "w") as f:
    f.write("""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Doc,Lato,40,&H00F2F2F2,&H00F2F2F2,&H80000000,&H96000000,0,0,0,0,100,100,0.5,0,1,1.6,1.2,2,200,200,46,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
    for a, b, t in rows:
        f.write(f"Dialogue: 0,{ts(a, '.')},{ts(b, '.')},Doc,,0,0,0,,{{\\fad(80,80)}}{t}\n")
print(len(rows), "cues; longest", max(len(r[2]) for r in rows))
