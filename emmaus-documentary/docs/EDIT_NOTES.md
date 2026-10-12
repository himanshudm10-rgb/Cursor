# Strangest Painting of Jesus: edit notes

Edit notes for the documentary cut of Pascal Dagnan-Bouveret's *Christ and the Disciples at Emmaus* (1896–97).

- **Master:** 1920×1080, 24 fps, H.264 High, BT.709. Stereo 48 kHz.
- **Running time:** 9:09.8 (549.8 s).
- **Loudness:** −14.0 LUFS integrated, −1.5 dBTP, LRA 3.4 LU.

The full shot list, with timecodes, view coordinates and dissolve lengths, is in [`shotlist.md`](shotlist.md). The narration transcript, with segment timestamps, is in [`transcript.txt`](transcript.txt).

---

## Revision 4: QC fixes and a bigger score

- **Highlights on target.** Every spotlight, ring and loupe was re-measured against the painting.
  - The right disciple's and the servant's targets had been off their faces, and Jesus's face target was too low.
  - Spotlights were resized to one head or hand. The previous highlight now fades out fully, so each one reads clearly.
  - The loupe stays fully on screen.
  - The opening searchlight stays on Jesus and narrows to his eyes rather than wandering.
- **Jitter fixed.** Frame-to-frame motion was measured across the whole film with phase correlation (`src/jitter.py`). Three causes were fixed:
  - Edge clamping of camera moves kicked in abruptly. It caused one-frame jumps of up to 84 px at 8:07 and kinks at 8:12 and 8:32. Clamping is now continuous and applied to keyframes, never mid-move.
  - Zoom-outs used a whole-pixel resize that shimmered. They now use an exact transform.
  - The comparison slide started at full speed. It now eases in.
  - Worst remaining frame-to-frame jerk: about 5 px, down from 84 px.
- **Content.** Every section was re-checked against the narration. The "≈ 1,900 years" label was removed, because it contradicted the narrator's "nearly two thousand years".
- **Music.** The score is more epic and mysterious. Sound effects are unchanged.
  - New elements:
    - low brass "braams" (brass section, trombone, tuba) on the key reveals;
    - a taiko heartbeat building suspense;
    - pizzicato ostinatos under the investigation;
    - tremolo strings and synth choir;
    - a full brass, choir and taiko climax on "It was Jesus";
    - a big choral reprise at the end.
  - A levelling stage on the music bus lifts quiet cues.
  - Ducking under the voice is now 6 dB, down from 9.
  - Result: music sits about 10.5 dB under the narration during speech and about 7.5 dB under between lines. The master is −14 LUFS.

## Revision 3: JavaScript visual engine

Most of the film's visuals are now rendered by a JavaScript engine running in headless Chromium (`js/`), then graded, grained and subtitled by `src/film.py`.

- **Emmaus reconstruction (3D):** a WebGL raymarched landscape (`js/gl.js`). It has eroded limestone hills with terraces, a valley road, olive groves as 3D trees, soft sun shadows, haze and clouds.
  - Each view is rendered once as a colour plate plus a depth map. Camera moves use depth parallax from that map.
  - Articulated walking figures are composited on top (`js/figure.js`). They have tunics, mantles, head-cloths, sashes, staffs, a walk cycle, rim light and dust at each footfall. Faces are never detailed.
  - Everything passes through an oil-paint (Kuwahara) filter with a canvas weave, so the recreations read as moving paintings rather than CG.
  - The shots: wide valley; side-tracking pair with heads bowed; the stranger joining from a side path; side-tracking three; a time-lapse from afternoon to dusk; Emmaus at dusk with lit windows; the lamplit room where three seated shadows become two.
- **Painting treatments (`js/paint.js`):** these change only light, framing and layout, never the artwork itself.
  - A searchlight exploring the darkened canvas.
  - A ghost echo of the face.
  - A triptych of reactions.
  - Three presences pulsing in the corner, and a timeline from c. AD 30 to the 1890s.
  - Element-by-element spotlighting, and a magnifier loupe on each face.
  - A sharp-versus-soft face comparison, rays behind Christ, and the painting presented as a framed object.
  - The family faces lifting out as cards and returning.
  - Two eras pulled apart across a timeline and merged back.
  - A brushstroke reveal, light motes travelling from Christ to the family, a gilded sheen, and dust settling over the forgotten artist.
- **Cutaways (`js/broll.js`):**
  - A north-light Paris studio with the painting half-finished on the easel and a bellows camera.
  - A Gothic church with stained glass casting coloured light, and votive candles with rack focus.
  - A museum with a visitor before the painting.
  - The skylit Salon with an 1890s crowd.
  - Industrial Pittsburgh with furnaces and smokestacks, and Frick's panelled collection room.
  - The Institut de France dome over the Seine.
  - An early-modern room with original abstract shapes. These are not copies of any real artwork.
- Narration, music, mix and subtitles are unchanged from revision 2.

## Revision 2

- **No fades.** There is no fade-in, no fade-out and no dip to black anywhere. The painting is on screen from frame 1, and the film ends on Jesus's face. Dissolves between shots remain.
- **Subtitles.** Single-line subtitles are burned in (Lato 40 px, bottom centre, clear of the name captions). Recognition errors from the transcript are corrected (Emmaus, Dagnan-Bouveret, dates). Separate files: `subtitles.srt` and `subtitles.ass`, built by `src/subs.py`.

## 1. What this cut is, and what it is not yet

The session that built this cut had no access to Wikimedia, museum image APIs or any stock or AI-video service. Only GitHub and the package registries were reachable. That shaped the cut in three ways:

| Brief asked for | What this cut does | Status |
|---|---|---|
| Painting as primary evidence | Every analytical beat uses the original painting. Framing is camera moves only. Figures are never moved, animated, repainted or invented. | Done. The source file should still be replaced (see §5). |
| Biblical recreations (road, stranger, dinner) | Procedural matte-painting plates rendered in code: the road at three times of day, the village at dusk, a candlelit table and an extinguished candle. Figures stay distant, backlit silhouettes, so no faces are invented. | Placeholder-grade. Swap for filmed or licensed footage, or AI recreations, if you have them. |
| Authentic portrait of the artist | **Not available.** The reveal uses the artist's own self-portrait *inside* the painting, which is authentic evidence. | Slot open (see §4). |
| Surviving preparatory study of the family | **Not available.** Shot 52 holds on the family detail while the narrator mentions the study. | Slot open. |
| 19th-century Paris, Frick and exhibition archival | Procedural studio, church and gallery plates, plus restrained lower-thirds. | Slots open. |
| Examples of newer movements (Picasso etc.) | Deliberately **not** shown: none were available, and Picasso's work is still in copyright. A dimmed gallery plate carries the line. | Slot open (licensed images only). |

Nothing in the cut presents a recreation as archival. There are no fake photographs or AI faces, and nothing invented is labelled as historical.

---

## 2. Structure and story beats

Times are film time (mm:ss). A ‖ marks a pause I inserted into an existing silence in the narration. The narration itself is not cut or re-ordered.

| Time | Section | Picture | Sound |
|---|---|---|---|
| 00:00 | Cold open | The painting is on screen from the first frame (no fade-in). A 16 s unbroken push ends on Christ's eyes at "staring directly at you". | Distant wind. A contrabass D drone enters, then a high string A, then B♭ rubbing against it. |
| 00:16 | "ghost-like" | Held on the face. Bloom on the existing halo via the grade only. | — |
| 00:20 | "terrified" | Three short details: left disciple, right disciple, servant. | The uncomfortable note: E♭ in cello and bass against the D. |
| 00:23 | "hidden in the corner" | Slow move to the right edge. The family stays underexposed and softened, so they can't be identified yet. | Soft "oohs" cluster. |
| 00:31 | "born almost 2,000 years after" | Still frame, held dark. | **Music cut to silence.** |
| 00:34 ‖ 3.6 s | Title | STRANGEST PAINTING OF JESUS (Cinzel, tracked, small rule), over the held, darkened family frame. | A single soft timpani D and a Dm(add9) string bloom. |
| 00:37 | Questions | Sunset sky above Christ's head, then the whole painting held still. | Sparse piano "gaze motif" (D–C–A–F). |
| 00:46 | What we see | Eased push to the table, then each face framed on its line. | — |
| 01:22 | Title card | Whole painting. Lower third with title, artist and dates. | String lift. |
| 01:35 | Luke 24 | Push into the landscape behind Christ, dissolving into the road plate. | Nylon guitar at 72 bpm, D minor. |
| 01:40–02:17 | The road | Two walkers in the afternoon. A stranger joins from a side path in late light. Dusk passing stone houses, then the village with warm windows. | Oboe lament. Footsteps on dry earth, wind, distant birds, cloth. |
| 02:17 | Dinner | Candle on a wooden table. | Room tone, candle crackle. |
| 02:20 ‖ 1.3 s | Bread | Christ's hands holding the broken bread (painting), slow push. | Everything drops away. **The bread crack lands in the pause.** |
| 02:25 | Recognition | Right disciple, then left disciple. "It was Jesus" lands on his face. | Orchestral rise: strings, choir, horns, timpani. Turns to D major on "It was Jesus". |
| 02:34 | "he disappeared" | The light takes over the face (bloom and exposure), dissolving to the same table with the candle just out and smoke rising. | Hard cut to a single choir thread, then near-silence ‖ 2.6 s. |
| 02:56 | "he's gone" | Empty road at dusk. | — |
| 02:56 ‖ 1.0 s | Back to the painting | Lit candle table **match-dissolves** into the full painting. Both table edges sit at about 58% frame height. | Piano gaze motif. |
| 03:22 | The light | Tilt up to the setting sun. Then a **backlit-figure demo plate** shows that a face against the sun goes dark. Then back to the painting, where the face, hands and robe glow. | Warm high strings on "glowing". |
| 03:53 ‖ 1.2 s | Family: setup | One deliberate move from Christ to the corner. Man, woman and boy framed on each word. Then a locked-off steady shot. | Heartbeat pulse (cello, bass, soft timpani) that tightens. |
| 04:13 ‖ 1.6 s | "So who are they?" | Steady shot, slightly dimmed. | Only a held high A. |
| 04:16 | **Reveal** | Each face full frame, held still, with name lower-thirds. | Timpani D. Sustained strings. |
| 04:27 | "witnessing the resurrection" | Pull back from the family to the whole canvas. | — |
| 04:38 | "nearly 2,000 years earlier" | **Diptych**: Christ's face beside the family, eras side by side. | **Shift from mystery to wonder**: F–B♭–Dm–C, choir and harp. |
| 04:59 ‖ 2.0 s | The artist | North-light studio with dust in the beam. Realism details from the canvas. | Brush strokes, window air. Intimate piano and cello. |
| 05:19 | Faith | Church light ("The 1890s"), then the wife's face in warm grade, then votive candles. Move from the family back to Christ. | Choir "oohs", warm strings. Cello melody. |
| 06:09 | "you're standing alongside them" | Gallery plate: the painting on a wall, dolly in. Then family, then face. | Museum room tone. Piano motif. |
| 06:33 | Fame | Salon-style hall, then the gallery with a Frick lower third. The painting in a warm grade. "Institut de France · 1900" on the artist's face. | 3/4 at 84 bpm: harp, strings, flute, then horn. Cadence on "Institut". |
| 07:05 ‖ 1.0 s | Forgotten | The artist's face slowly darkens and loses saturation (never to black). A dim gallery. "1929". | Layers fall away: cello out, then strings out, then a lone piano. |
| 07:56 | Carnegie | Gallery plate, place card. | Quiet room. |
| 08:01 | Ending | **Widest view of the film** (pillarboxed with margin). Move to the corner on "those three figures". Slow return to his eyes on "Jesus continues to stare". Tilt down to the empty foreground on "left a place for us". | **Reprise of the gaze motif in D major**, strings and choir. |
| 08:34 ‖ 1.6 s | Final question | Long push back to his face, then held about 17 s. No graphic, no subscribe animation. | Motif once more after the last word. Harp D-major chord. The film ends on his face, with no fade-out. |

---

## 3. Music cue sheet

Original score, sequenced in code from FluidR3 GM samples (MIT-licensed, via `gleitz/midi-js-soundfonts`). Every cue starts on a story beat, not a time grid.

| Cue | Film time | Function | Instrumentation |
|---|---|---|---|
| 1 Opening | 00:01–00:31 | Low unease; music removed for "born 2,000 years after" | Contrabass and synth-string drone, high strings (A/B♭ rub), cello E♭, voice cluster |
| 1T Title | 00:34–00:42 | Restrained title bloom | Timpani, contrabass, Dm(add9) strings, choir |
| 1b Investigation | 00:38–01:35 | Curiosity | Pad progression Dm–B♭–Gm–A, piano gaze motif |
| 2 Journey | 01:35–02:17 | Grief and uncertainty | Nylon guitar arpeggios, oboe lament, soft strings, cello |
| 3 Recognition | 02:17–02:38 | Rise to revelation, then absence | Strings, choir, horns, timpani; ends in a single choir thread |
| 4 Investigation II | 02:39–03:53 | Intimate analysis | Pad, piano motif, warm strings on "glowing", voice "oohs" |
| 5 Family | 03:53–04:59 | Suspense, then reveal, then wonder | Heartbeat ostinato and clusters; reveal hit; F–B♭–Dm–C with choir and harp |
| 6 Artist and faith | 04:59–06:33 | Personal, devotional | Piano, cello melody, choir "oohs", strings |
| 7 Fame | 06:33–07:05 | Period elegance, confidence | 3/4: harp, strings, flute, then horn; F-major cadence |
| 8 Decline | 07:05–08:01 | Emptying out | Piano, strings and cello, removed layer by layer |
| 9 Ending | 08:01–09:10 | Reprise, warmer | Gaze motif in D major, strings, choir, contrabass, harp |

**Mix:**
- Music is automated per section, then ducked under speech by up to 9 dB (120 ms attack, 700 ms release). It opens up in the pauses.
- Sound design is synthesized: wind, footsteps on dry earth, birds, cloth, candle, bread crack, brush strokes and room tones. There are no whooshes, no risers and no horror stingers.
- The master chain is gentle glue compression, then a limiter, then two-pass `loudnorm` to −14 LUFS / −1.5 dBTP.

---

## 4. Open asset slots: swap these in when you have them

| Shot | Time | Needed | Suggested source |
|---|---|---|---|
| 48 | 04:16–04:22 | Photograph or self-portrait of Dagnan-Bouveret (intercut with the painted self) | Wikimedia Commons (public domain photographs exist), Musée d'Orsay |
| 52 | 04:35 | The surviving preparatory study of the family, with credit | Check Carnegie Museum of Art records for its current holder |
| 55, 58 | 05:00, 05:15 | Period photographs of a Paris studio or the artist at work | Gallica (BnF), Paris Musées |
| 68 | 06:33 | Paris Salon or exhibition hall, 1890s | Gallica, Library of Congress |
| 69 | 06:38 | Henry Clay Frick portrait (public domain photographs exist) | Frick Pittsburgh, Library of Congress |
| 71 | 07:02 | Institut de France / Académie des Beaux-Arts imagery | Wikimedia Commons |
| 73 | 07:17 | Early-modern works, properly licensed (Picasso is in copyright) | Licensed stock, or use a public-domain movement instead |
| 77 | 07:57 | Real Carnegie gallery view | Request from the museum's press office |
| 18–22 | 01:40–02:20 | Filmed or AI recreation of the road, stranger and dinner | Keep figures distant and unhaloed, as briefed |

Every plate is one entry in `SHOTS` in `src/film.py`. To swap one, add a shot kind that loads a still or video and keep the same in and out times. The audio does not change.

---

## 5. Things to verify or upgrade before publishing

1. **Painting file.** The supplied image is a 2000×1415 reseller copy (ArtsDot) with a watermark along the bottom edge. I crop the bottom 45 px. Close-ups of the face are about 4× upscaled and visibly soft.
   - The painting is public domain.
   - Get the Carnegie Museum of Art high-resolution image and drop it in as `painting_src.png`. Keep the same composition; if the dimensions differ, scale the view coordinates in `film.py`.
   - With a larger file, a true 4K master becomes possible: set `W, H = 3840, 2160` in `timeline.py`.
2. **Facts in the script to check against the Carnegie catalogue entry:**
   - Wife's name (Anne-Marie Walter) and son's name (Jean).
   - Frick's purchase and gift of the painting to the Carnegie Institute.
   - The 1900 election (Académie des Beaux-Arts, part of the Institut de France).
   - Which figure in the right-hand group is the wife and which is the son. I followed the narration: woman in front, boy at the far right.
3. **Pauses.** I added about 15 s of pauses at nine points, listed in `src/timeline.py`. Remove any you don't like; every picture and music cue moves with them automatically.
4. **Not checked:** I could not listen to the mix. Levels, ducking and loudness were verified by measurement only, so do a listening pass on headphones and on speakers.

---

## 6. Rebuild

```
# work dir = src/*  +  fonts/  +  samples/ (run fetch_samples.sh)  +  narration.mp3  +  painting_src.png
python3 asr.py           # optional: re-transcribe (Parakeet TDT via sherpa-onnx), writes words.json
python3 score.py         # music.wav
python3 mix.py           # mix_pre.wav (+ stems)
./master.sh mix_pre.wav mix_master.wav
python3 film.py stills qc.jpg 10 20 30      # contact sheet at any film times
./render_all.sh          # 4 parallel video parts -> parts/
# concat parts and mux mix_master.wav (see README)
```
