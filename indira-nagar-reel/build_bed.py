"""Build public/music.wav + public/sfx.wav from the Epidemic Sound assets.
Music: "Rise of the Sun God" (Dream Cave), offset so its drop (58.05 s) lands on the Brahma-weapon cut (22.2 s).
Ducked -9 dB under every word with look-ahead; mix.py adds a light sidechain on top."""
import json, subprocess, numpy as np, wave, sys
SR = 48000
END = 42.6
HERE = sys.argv[1] if len(sys.argv) > 1 else '.'
def load(p, ss=0.0, t=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(ss)] + (['-t', str(t)] if t else []) + ['-i', p, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).reshape(-1, 2).copy()
def save(p, x):
    x = np.clip(x, -1, 1)
    w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype('<i2').tobytes()); w.close()
N = int(END * SR)
t = np.arange(N) / SR
OFFSET = 58.05 - 22.2
mu = load(f'{HERE}/music/rise_of_the_sun_god.wav', OFFSET, END)[:N]
mu = np.pad(mu, ((0, N - len(mu)), (0, 0)))
words = json.load(open(f'{HERE}/anim/src/words.json'))
duck = np.zeros(N)
for s, e, _ in words:
    duck[int(max(s - 0.12, 0) * SR):int((e + 0.05) * SR)] = 1
# smooth: fast attack, slow release (one-pole)
k_a, k_r = 1 - np.exp(-1 / (0.05 * SR)), 1 - np.exp(-1 / (0.35 * SR))
env = np.zeros(N); v = 0.0
d = duck
for i in range(N):
    v += (d[i] - v) * (k_a if d[i] > v else k_r)
    env[i] = v
gain_db = -9 * env
gain_db += np.where(t < 0.25, -40 * (1 - t / 0.25), 0)          # quick fade in (frame 0 still has music)
gain_db += np.where(t > 41.5, -40 * np.clip((t - 41.5) / 1.1, 0, 1), 0)  # fade out after the cut to black
mu *= (10 ** (gain_db / 20))[:, None]
save(f'{HERE}/anim/public/music.wav', mu)
fx = np.zeros((N, 2), np.float32)
def put(name, at, db):
    s = load(f'{HERE}/music/{name}.wav') * 10 ** (db / 20)
    i = int(at * SR); s = s[:N - i]; fx[i:i + len(s)] += s
put('impact', 6.92, -4)    # the split reveal
put('arrow', 11.35, -6)    # Karna's arrow in the school
put('impact', 22.15, -3)   # the Brahma weapon
put('thunder', 22.2, -6)
put('thunder', 25.05, -9)  # the weapon withdrawn (pause after "it.")
put('impact', 36.85, -6)   # Parashurama
save(f'{HERE}/anim/public/sfx.wav', fx)
print('bed written')
