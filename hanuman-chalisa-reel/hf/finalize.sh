#!/bin/bash
# Final pass on the HyperFrames render: the mythic-reel house colour grade + voice-first loudness (-14 LUFS, -1.5 dBTP).
#   hf/finalize.sh hf/out/hanuman_hf.mp4 Hanuman_Chalisa_Part2_9x16.mp4
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
IN="$1"; OUT="$2"
GRADE="$(grep -v '^#' "$HERE/../tools/grade/ffmpeg_grade.txt")"
ffmpeg -v error -y -i "$IN" \
  -vf "scale=out_range=tv,format=yuv420p,$GRADE" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89" -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
echo "wrote $OUT"
