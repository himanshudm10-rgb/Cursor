#!/bin/bash
# Create a new mythic-reel project:  new_project.sh <project_dir> <voiceover.(mp3|wav)> [script.txt]
# -> <project_dir>/anim (Remotion engine + the Indra reference scenes), public/Voiceover.mp3, src/words.json
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
abs() { python3 -c "import os,sys; print(os.path.abspath(sys.argv[1]))" "$1"; }
DIR="$(abs "$1")"; VO="$(abs "$2")"; SCRIPT="${3:+$(abs "$3")}"
ANIM="$DIR/anim"
mkdir -p "$ANIM"
rsync -a --exclude node_modules --exclude out "$SKILL/template/" "$ANIM/"
cd "$ANIM"
npm install --no-audit --no-fund --silent
FF="$(python3 -c "import sys; sys.path.insert(0,'$SKILL/audio'); from synth import ffmpeg; print(ffmpeg())")"
"$FF" -v error -y -i "$VO" -ar 44100 -ac 1 -b:a 192k public/Voiceover.mp3
if [ -n "$SCRIPT" ]; then
  python3 "$SKILL/scripts/transcribe.py" public/Voiceover.mp3 src/words.json --script "$SCRIPT"
else
  python3 "$SKILL/scripts/transcribe.py" public/Voiceover.mp3 src/words.json
fi
"$FF" -hide_banner -i public/Voiceover.mp3 2>&1 | grep Duration
echo "project ready: $ANIM"
