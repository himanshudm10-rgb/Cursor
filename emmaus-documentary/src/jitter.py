import cv2, numpy as np, subprocess, sys, json
src = sys.argv[1]
w, h = 480, 270
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
prev = None; shifts = []; diffs = []
win = cv2.createHanningWindow((w, h), cv2.CV_32F)
while True:
    b = p.stdout.read(w * h)
    if len(b) < w * h: break
    f = np.frombuffer(b, np.uint8).reshape(h, w).astype(np.float32)
    if prev is not None:
        (dx, dy), r = cv2.phaseCorrelate(prev, f, win)
        shifts.append((dx, dy, r)); diffs.append(float(np.mean(np.abs(f - prev))))
    prev = f
S = np.array(shifts); D = np.array(diffs)
json.dump({"s": S.tolist(), "d": D.tolist()}, open(sys.argv[2], "w"))
# jitter: second difference of motion where correlation is confident and no cut
acc = np.zeros(len(S))
for i in range(1, len(S) - 1):
    if min(S[i-1, 2], S[i, 2], S[i+1, 2]) < 0.3 or D[i] > 25: continue
    acc[i] = np.hypot(S[i+1, 0] - 2*S[i, 0] + S[i-1, 0], S[i+1, 1] - 2*S[i, 1] + S[i-1, 1])
idx = np.argsort(-acc)[:40]
for i in sorted(idx):
    print(f"t={i/24:7.2f}s  jerk={acc[i]:.2f}  shift=({S[i,0]:+.2f},{S[i,1]:+.2f}) prev=({S[i-1,0]:+.2f},{S[i-1,1]:+.2f}) diff={D[i]:.1f}")
