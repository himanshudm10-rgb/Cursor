# Strangest Painting of Jesus: documentary edit

A cinematic documentary cut of Pascal Dagnan-Bouveret's *Christ and the Disciples at Emmaus* (1896–97). It is built entirely in code from the supplied narration and the painting.

- `docs/EDIT_NOTES.md`: structure, story beats, music cue sheet, open archival slots, and things to verify before publishing. **Read this first.**
- `docs/shotlist.md`: all 84 shots with film timecodes, painting view coordinates (cx, cy, width in source pixels) and dissolve lengths.
- `docs/transcript.txt`: the narration transcript.
- `docs/subtitles.srt` / `docs/subtitles.ass`: corrected subtitles on the film timeline (`src/subs.py`).
- `src/`: the pipeline.
  - `timeline.py`: maps narration time to film time, including the inserted pauses.
  - `score.py`: the original score.
  - `mix.py`: sound design and mix.
  - `master.sh`: −14 LUFS master.
  - `plates.py`: procedural recreation plates.
  - `film.py`: the edit itself (`SHOTS`, `TEXT`), grade and renderer.
- `js/`: the JavaScript visual engine (WebGL landscape, figures, painting treatments, cutaways). `src/run_js.py` captures every JS shot listed by `python3 src/film.py jobs js_jobs.json`.
- `fonts/`: Cinzel, Cormorant Garamond and EB Garamond (SIL Open Font License, from google/fonts).

The rendered video is not in the repo, because it is too large for git.

## Build

Requirements: Python 3 with `numpy scipy opencv-python-headless pillow`, plus `ffmpeg`. Re-transcribing also needs `sherpa-onnx`.

```bash
mkdir work && cp src/* work/ && cp -r fonts work/ && cd work
./fetch_samples.sh
cp /path/to/narration.mp3 narration.mp3
cp /path/to/painting.png painting_src.png   # 2000x1415 supplied copy; see EDIT_NOTES §5 for an upgrade
python3 score.py && python3 mix.py && ./master.sh mix_pre.wav mix_master.wav
./render_all.sh
printf "file 'parts/p%d.mp4'\n" 0 1 2 3 > parts.txt
ffmpeg -f concat -safe 0 -i parts.txt -i mix_master.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart master.mp4
```
