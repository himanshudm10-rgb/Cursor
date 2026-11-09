#!/bin/bash
# Render + score + voice-first mix:  finalize.sh <anim_dir> <cues.json> <out.mp4> [--skip-render]
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
abs() { python3 -c "import os,sys; print(os.path.abspath(sys.argv[1]))" "$1"; }
ANIM="$(abs "$1")"; CUES="$(abs "$2")"; OUT="$(abs "$3")"
cd "$ANIM"
FF="$(python3 -c "import sys; sys.path.insert(0,'$SKILL/audio'); from synth import ffmpeg; print(ffmpeg())")"
if [ "${4:-}" != "--skip-render" ]; then
  npx remotion render Film out/video.mp4 --codec=h264 --crf=16 --muted --concurrency=8
fi
# Remotion writes full-range yuvj420p; convert to standard TV-range bt709 yuv420p for platforms
"$FF" -v error -y -i out/video.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 17 \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -an out/video_tv.mp4
python3 "$SKILL/audio/score.py" "$CUES" "$ANIM"
python3 "$SKILL/audio/check_mix.py" "$ANIM"
python3 "$SKILL/audio/mix.py" out/video_tv.mp4 "$ANIM" "$OUT"
