#!/bin/bash
# Render the film in chunks (retrying each), then concatenate losslessly -> out/video.mp4
set -u
cd "$(dirname "$0")"
mkdir -p out/chunks
TOTAL=1820
RANGES=("0-454" "455-909" "910-1364" "1365-1819")
for r in "${RANGES[@]}"; do
  f="out/chunks/c_${r}.mp4"
  [ -s "$f" ] && continue
  for attempt in 1 2 3; do
    echo "chunk $r attempt $attempt"
    npx remotion render Film "$f" --frames="$r" --codec=h264 --crf=16 --muted --concurrency=4 --timeout=120000 >> out/render.log 2>&1 && break
    rm -f "$f"
  done
done
ls out/chunks/*.mp4 | sort -t_ -k2 -n | sed "s#^#file '$(pwd)/#; s#\$#'#" > out/chunks/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/video.mp4 && echo CONCAT_OK
