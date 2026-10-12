"""Capture every JS shot with a pool of headless browsers. Skips shots already complete."""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
jobs = json.load(open(f"{HERE}/js_jobs.json"))
only = set(sys.argv[2:]) if len(sys.argv) > 2 else None
workers = int(sys.argv[1]) if len(sys.argv) > 1 else 3
def done(j):
    d = f"{HERE}/js_frames/{j['id']}"
    return os.path.isdir(d) and len([f for f in os.listdir(d) if f.endswith('.jpg')]) >= j["frames"]
def run(j):
    if done(j): return f"skip {j['id']}"
    d = f"{HERE}/js_frames/{j['id']}"; os.makedirs(d, exist_ok=True)
    have = len([f for f in os.listdir(d) if f.endswith('.jpg')])
    env = dict(os.environ, OPTS=json.dumps(j["opts"]))
    r = subprocess.run(["node", f"{HERE}/js/capture.js", j["scene"], str(j["frames"]), d, str(j["dur"]), "24", str(max(0, have - 1))],
                       env=env, capture_output=True, text=True)
    ok = done(j)
    with open(f"{HERE}/js_frames/log.txt", "a") as f: f.write(f"{j['id']} ok={ok}\n{r.stdout[-400:]}\n{r.stderr[-1500:]}\n")
    return f"{'done' if ok else 'FAIL'} {j['id']}"
todo = [j for j in jobs if (only is None or j["scene"] in only or j["id"] in only)]
todo.sort(key=lambda j: -j["frames"])
with ThreadPoolExecutor(workers) as ex:
    for res in ex.map(run, todo): print(res, flush=True)
print("ALL_JS_DONE")
