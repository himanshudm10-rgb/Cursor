"""Word-level timestamps for the voiceover -> <anim>/src/words.json  [[start, end, word], ...]

  python3 transcribe.py <voiceover.mp3> <out_words.json> [--script script.txt]

Uses faster-whisper (medium.en) in a private venv at ~/.cache/mythic-reel/venv (created on first run).
If --script is given, each recognised word is replaced by the script's spelling when they match loosely,
so subtitles use the author's exact words and punctuation.
"""
import json
import os
import re
import subprocess
import sys

VENV = os.path.expanduser("~/.cache/mythic-reel/venv")
PY = os.path.join(VENV, "bin", "python")

INNER = r'''
import json, sys
from faster_whisper import WhisperModel
audio, out, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
m = WhisperModel("Systran/faster-whisper-medium.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, word_timestamps=True, initial_prompt=prompt or None)
words = [[round(w.start, 2), round(w.end, 2), w.word.strip()] for s in segs for w in s.words]
json.dump(words, open(out, "w"))
print(f"{len(words)} words, last ends at {words[-1][1]:.2f}s")
'''


def ensure_venv():
    if os.path.exists(PY):
        return
    os.makedirs(os.path.dirname(VENV), exist_ok=True)
    subprocess.run([sys.executable, "-m", "venv", VENV], check=True)
    subprocess.run([PY, "-m", "pip", "-q", "install", "--upgrade", "pip"], check=True)
    subprocess.run([PY, "-m", "pip", "-q", "install", "faster-whisper"], check=True)


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def align_to_script(words, script):
    toks = script.split()
    j = 0
    last = -1
    for k, (s, e, w) in enumerate(words):
        for look in range(j, min(j + 4, len(toks))):
            a, b = norm(w), norm(toks[look])
            if a == b or (a and b and (a.startswith(b) or b.startswith(a)) and abs(len(a) - len(b)) <= 2):
                words[k][2] = toks[look]
                j = look + 1
                last = k
                break
    # Whisper sometimes invents words in trailing silence ("Thank you."); drop anything after the script ends
    if j >= len(toks) - 1 and last >= 0:
        dropped = words[last + 1:]
        if dropped:
            print("dropped hallucinated trailing words:", " ".join(w[2] for w in dropped))
        words = words[: last + 1]
    return words


def main():
    audio, out = sys.argv[1], sys.argv[2]
    script = ""
    if "--script" in sys.argv:
        script = open(sys.argv[sys.argv.index("--script") + 1]).read()
    ensure_venv()
    # proper nouns from the script help recognition
    prompt = " ".join(sorted({w.strip(".,?!'\"") for w in script.split() if w[:1].isupper()}))[:400]
    subprocess.run([PY, "-c", INNER, audio, out, prompt], check=True)
    if script:
        words = align_to_script(json.load(open(out)), script)
        json.dump(words, open(out, "w"))
        print("aligned spellings/punctuation to the script")


if __name__ == "__main__":
    main()
