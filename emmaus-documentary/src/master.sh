#!/bin/bash
# voice-forward master: gentle glue compression, then 2-pass loudnorm to -14 LUFS / -1.5 dBTP
set -e
IN=$1; OUT=$2
PRE="acompressor=threshold=-20dB:ratio=2.5:attack=8:release=250:makeup=2,alimiter=limit=0.89:attack=3:release=60:level=disabled"
J=$(ffmpeg -hide_banner -i $IN -af "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p')
gi(){ echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -v error -y -i $IN -af "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(gi input_i):measured_TP=$(gi input_tp):measured_LRA=$(gi input_lra):measured_thresh=$(gi input_thresh):offset=$(gi target_offset):linear=true,aresample=48000" -c:a pcm_s16le $OUT
ffmpeg -hide_banner -i $OUT -af ebur128=peak=true -f null - 2>&1 | grep -A15 Summary | grep -E " I:| LRA:| Peak:"
