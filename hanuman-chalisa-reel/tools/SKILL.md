---
name: mythic-reel
description: Turn a voiceover (plus its script) into a fully animated 9:16 cinematic mythology/history reel in the "Indra of the Vedas" house style - layered 2.5D painted-vector illustration, consistent hand-built characters, parallax camera, lightning/smoke/dust, transitions designed from the artwork, inscription-style word-synced subtitles, a generated epic score (brass, choir, string ostinato, taiko) and a voice-first mix. Use when the user asks for an animated reel/short/video from a voiceover about gods, myths, legends, epics or ancient history, or says "make it like the Indra video".
---

# Mythic Reel

Produces a finished vertical film (1080x1920, 30 fps, -14 LUFS) from a voiceover. Everything is drawn in code (React/SVG in Remotion), so there are no photos, stock or AI images, and one consistent visual world.

The reference film is **"The Indra of the Vedas"**. Its complete source is the template (`template/src/scenes/*`) and its score is `audio/cues.indra.json`. When in doubt, copy what the reference does.

```
SKILL=~/.claude/skills/mythic-reel
template/        Remotion project: lib.ts, world.tsx, characters.tsx, Captions.tsx, Main.tsx, scenes/ (Indra reference)
audio/           synth.py (instruments + SFX), score.py (cue sheet -> music.wav + sfx.wav), mix.py, check_mix.py, cues.indra.json
scripts/         new_project.sh, transcribe.py, finalize.sh, sheet.py
```

## Inputs to get from the user
1. **Voiceover file** (mp3/wav/m4a/aiff). It is the absolute timeline: never change, trim or reorder it.
2. **Script text**, used for exact subtitle spelling and punctuation. If it's missing, ask, or fall back to the raw transcript.
3. Optional brief: the emotional arc, key characters, or must-have shots. If none is given, derive them from the script (see "Story design").

## Pipeline

```bash
# 1. project + word timings  (-> <dir>/anim, public/Voiceover.mp3, src/words.json)
$SKILL/scripts/new_project.sh <project_dir> <voiceover> <script.txt>

# 2. design & build scenes (you), checking with stills as you go
cd <project_dir>/anim && npx tsc --noEmit -p . && node stills.mjs 0 4.2 9.5 ...
python3 $SKILL/scripts/sheet.py . sheetA.jpg 0 4.2 9.5 ...   # then Read out/stills/sheetA.jpg

# 3. score cue sheet: copy cues.indra.json -> <project_dir>/cues.json and retime it

# 4. render (muted) -> TV-range fix -> score -> per-word voice check -> voice-first mix
$SKILL/scripts/finalize.sh <project_dir>/anim <project_dir>/cues.json <project_dir>/<Title>_9x16.mp4
#    re-mix only, after editing cues:  add --skip-render as the 4th argument
```

- `new_project.sh` copies the template, runs `npm install`, converts the voiceover, and transcribes it with faster-whisper (its own venv lives in `~/.cache/mythic-reel`; the model downloads on first use).
- ffmpeg is found automatically: `$FFMPEG`, then PATH, then the AutoSubs bundle, then Remotion's bundled binary.
- A full render takes roughly 8–15 minutes. Run it in the background.
- Send the user the final mp4 with SendUserFile (display: render).

## Story design (do this before any code)
Read `src/words.json` and the script. Then:
1. **Emotional arc.** Name 5–7 beats. Reference: misconception, mystery, revelation, power, awe, protection, absence, question.
2. **Shot list.** One shot per phrase or idea, cut **on word boundaries** from `words.json`. Shots run 1.5–4 s, and hero shots hold 2.8–3.5 s. Put each cut a hair before the word that motivates it.
3. **Frame 0 shows the hero.** Never open on black or with a fade-in (reels die on a black first frame). Open mid-scene on the subject.
4. **Visualise what is being said at that moment**, but never literally illustrate insults or accusations. Use symbols instead: a cracked throne, a dying storm, a figure sinking into silhouette.
5. **Bookend.** The last shot returns to the reveal location, now dark: the camera pulls back until the hero is small, then hard-cuts to black ~0.7 s after the last word and holds ~1 s. `END_SEC` = black cut + 1.1.
6. **Exactly one biggest hero shot**, on the line that states the thesis ("He acts like a divine general"). The music peaks there.
7. **Respectful absence beats.** Modern / "forgotten today" sections show absence (an empty shrine, a figure fading from the sky). Never mock other traditions.

## Visual style bible (non-negotiable)
- **Medium.** Layered 2.5D painted-vector illustration, like an Indian epic turned into a premium animated graphic novel. Flat painted fills, painted shadow shapes, a rim-light edge, soft volumetric glows. No outlines on characters (rim light only), no gradients on skin, no anime, no 3D, no photos.
- **Palette** (`C` in lib.ts): deep blue/storm grey/charcoal for power and night; muted gold, bronze and dark red for the hero; warm earth and sand for battle; warm gold-green for protection; neutral greys for modern scenes. Keep saturation low, and keep gold accents small.
- **Lighting.** Wrap every character in `CharFX`:
  - `dark` 0.2–0.6 normally; 0.75–0.95 for silhouettes, distant figures and diminished moments.
  - `rim` is the key light's colour: cold `#dfe8ff` for storm, warm `#ffd79a` for dawn and fire.
  - `rimDir` points toward that light.
  - Lightning raises `lit`, which lowers `dark` and brightens the rim.
- **Depth.** Every scene is a `Scene` with 4–7 `Layer`s:

  | depth | content |
  |---|---|
  | 0–0.1 | sky gradient + glow |
  | 0.15–0.3 | clouds, bolts, far ridges |
  | 0.4–0.85 | mid ridges, armies, cities |
  | 1 | hero plane |
  | 1.3–1.6 | foreground dust, grass, rocks, leaves |

  Camera moves (`cam.x/y/zoom/rot`) produce the parallax.
- **Camera.** Slow push-ins, pull-backs, vertical reveals (tilt up through smoke to a giant in the storm), fake orbit (opposite pans on far and near layers plus ±2° rotation), tracking (`cam.x = t*speed`, with the subject at `540 + cam.x`). No shake and no fast zooms.
- **Atmosphere in every shot.** `Dust` particles at a minimum, plus `Clouds`/`Smoke`/`Fire`/`DustBank` as the scene needs. Lightning comes as `Bolt` (ground strike) or `CloudCrawl` (through clouds), driven by `flash(t, [times])`. Each flash gets a matching thunder cue in the score.
- **Finish.** Applied globally by Main: vignette, animated grain, paper texture, and a white flash on `flash`/`split` cuts.
- **Colour grade (house look, mandatory).** Every film gets the reference grade: warm amber-sepia, painterly and soft, never neon.
  - Look: golden/amber highlights that roll off softly (no clipped whites), slightly lifted **warm brown** blacks (never pure black or purple), low saturation, mid-tones readable even at night. Storm/night scenes stay muted **teal-grey** (not saturated blue). Purple/magenta casts are always pulled to neutral.
  - Measured targets (`grade/grade_check.py`): median luma 0.13 (night/storm) to 0.28 (day); p98 luma 0.30–0.75; p2 luma 0.03–0.10; mean saturation 0.35–0.50; shadows R ≥ B (warm) except storms (G ≈ B).
  - Three.js pipeline: use `grade/house_grade.glsl` in the final pass, with per-scene `expo` (≈1.1 day, 1.5 dusk, 1.8–2.2 night/storm) and `cool` (0 warm .. 1 storm). Remotion pipeline: apply `grade/ffmpeg_grade.txt` in `finalize.sh` after the TV-range conversion.
  - Paint at natural values and let the grade unify; don't pre-darken scenes to look "moody" (the old films came out too dark and too saturated). Run `grade_check.py` on a contact sheet of stills before the full render and fix every flag.
- **Text.** **Subtitles only.** No chapter titles, labels, captions-as-design or invented script. Manuscript writing must be abstract strokes (`GlyphRow`), never readable or fake Sanskrit.
- **Subtitles** (`Captions.tsx`, automatic from `words.json`):
  - Cinzel 600 at 48 px, phrases of up to 5 words that break at punctuation and pauses.
  - The spoken word is gold `#e9c77e`, spoken words parchment, upcoming words dimmed.
  - Positioned at y≈1330 (above the reel UI). **No box, plate, gradient or bar behind them** - text with a soft drop shadow only, and not too big (≈30 px Cinzel on 1080-wide 16:9).
  - Fix spellings in `words.json`, never in the component.

## Long-form 16:9 / continuous variant (Three.js)
When the user asks for YouTube long-form or "continuous, no jumpy cuts": build in Three.js instead of Remotion, as one continuous camera move per chapter through painted multiplane layers (parallax factor p: zOf/sOf), fades through black only between chapters, none at the start/end. (The original Three.js Indra project is not bundled with this skill; build the engine fresh following these rules, reusing `grade/house_grade.glsl`.) Keep cloud drift relative to the chapter start (setEpoch), music ducked only ~5 dB under words (pauses about -6 dB vs voice) so the BGM is audible, and the house colour grade above.

## Characters
- **Reuse before you build.** `characters.tsx` has:
  - `Indra` (front/back/seated poses, arm angles, wind, weapon energy), `IndraFace` (close-up bust), `IndraFist` (match-cut grip) and `Vajra`
  - `Sage` (seated, `pray` 0..1) and `Sudas` (profile king in a chariot)
  - `Warrior` (silhouette, inherits fill), `Horse`, `Chariot`, `Cow` (with a calf variant) and `Throne` (cracks into shards)
  - `Villager` (in scenes/Protector.tsx)
- **A new deity or hero** (Shiva, Hanuman, Arjuna, Karna, Barbarik…) gets a new component built **with the same construction** so the world stays consistent:
  - Origin between the feet, ~900 units tall, head top at y≈-912. Front view, so `back` can mirror it (`scale(-1 1)`).
  - Body from `limb()` (tapered muscle limbs) and `smoothPath()` (torso, hair, cloth); the arm-angle system copies `Indra`'s `arm()`.
  - **Signature silhouette**: 3 identifiers readable as a black shape, e.g. Indra = bronze shoulder discs + long wind-blown hair with topknot + Vajra. Give every hero a distinct weapon or emblem, headgear and cloth line.
  - Palette from `C` plus at most one new accent colour. Keep the painted shadow shapes on the far side (x+), with skin `C.skin`/`C.skinShade` (or a variant for the character).
  - Animate with limited motion: breathing (`br`), wind on hair and cloth (`gust`/`wave`), eye `look`, arm raises over 0.5–0.8 s with `ramp`. Characters rarely walk; the world moves around them.
  - When a scene needs it, also build a close-up face and a hand/weapon close-up for match cuts.
- **Every character appears through one component** with the same proportions in every shot. Never redraw a character inline in a scene.
- Test new characters on a sheet first: a temporary composition rendering front, back, raised and seated poses, plus the close-up, on a mid-grey background. Read the PNG and fix proportions before using them in scenes.

## Building scenes
- One file per sequence in `src/scenes/`. Each scene is `React.FC<{t:number}>`, where `t` is seconds since the shot's `from` (negative during its in-transition).
- Animate only with `keys(t, [[t0,v0],[t1,v1]...])`, `ramp(t,a,b)`, `flash(t,[..])`, `noise/fbm`, and seeded `rng`. Everything must be deterministic per frame: no `Math.random`, no state.
- Register shots in `Main.tsx` `SHOTS` as `{from, to, C, in: {type, d}}`. Transition types:
  - `cut`
  - `flash`: a lightning cut, 0.2–0.5 s
  - `fade`: a dissolve, 0.3–1.0 s
  - `ink`: organic ink-bloom mask, good into manuscripts or memory, 0.7–0.8 s
  - `dust`: a dust wash, for battle into a sacred place, 0.6 s
  - `split`: the dark frame tears open, for the one big reveal, 0.75 s

  Design transitions from the artwork too: smoke rising into clouds, script lines becoming a ridge, raised hands match-cut to a fist, a book slamming shut into a hard cut.
- Reusable set pieces in the reference: `MountainWorld` (storm peak, reused for the bookend), `Leaf`/`GlyphRow` (palm-leaf manuscripts), `ArmyRow`/`Banner` (armies by graphic repetition), `Formation`/`River` (top-down battle-map language with lightning scattering units), `SudasCharge` (side-tracking chariot charge), `Hut`/`Tree`/`Grass`/`Building`/`Shikhara`/`Shrine`.
- **Check as you go.** After each 2–3 scenes, render stills at the midpoints and the transitions (`stills.mjs`), build a sheet, Read it, and fix:
  - characters too dark or blending into the background (add a glow behind them, raise the rim)
  - layers covering the hero
  - empty frames
  - shapes that read as accidents (smooth cones, blobs, perfect circles)

## Score cue sheet (`cues.json`)
Copy `audio/cues.indra.json` and retime it to the new words (times are in VO seconds):
- **`intro`**: a cold, uneasy drone with a dissonant shimmer during the opening misconception beat; `until` = the musical drop.
- **`music_env`**: the master envelope. Put a 0.5 s silence just before the big reveal, a hard drop at the "today / forgotten" cut, and a fade after the black cut.
- **`chords`**: `[start, dur, chord, brass, choir, strings]`, changing every 1.3–3.4 s on cut points.
  - Key of D minor. `transpose` in semitones for variety.
  - Grow from `Dm` → `Bb` → `F`/`C`; tension with `Gm` → `A`; warm sections in `F`/`C`.
  - The thesis line carries brass/choir 1.3. The end is an unresolved `Dm9`/`Dsus2`.
- **`hush`**: a near-silent held tonic for the absence beat.
- **`ostinato`** (16ths), **`grooves`** (taiko; `dense` 2 adds rim hits) and **`rolls`** drive the war sections. Start the peak's groove ~0.35 s **after** the first word of the thesis line, not on it.
- **`impacts` / `risers`** go on big cuts and should land in pauses.
- **`sfx`**: thunder for every lightning flash. Thunder lags its lightning, so move it into the next pause when the flash lands on a word. Also: metal shimmer + crackle when the weapon wakes, page turns, cracks, and env lanes for wind, fire, river, chariot and crowd, plus hooves and bells.
- Available chord names: `Dm Bb C F Gm A Am Eb Dm9 Dsus2` (add voicings in `synth.CHORDS`/`ROOTS`).

## Mix rules (the voice tells the story)
- `score.py` ducks music −14 dB and SFX −17 dB under every word, with look-ahead. `mix.py` adds a light sidechain plus voice EQ and compression, normalised to −14 LUFS.
- `finalize.sh` runs `check_mix.py`. **Targets: per-word median ≥ 18 dB voice over bed, every word ≥ 5 dB.** For any word listed under 10 dB, move or soften the thunder, impact or drum entry in `cues.json`, then rerun `finalize.sh ... --skip-render`.
- In pauses the score should rise to within about 3–10 dB of the voice level, so it still feels epic.

## Pitfalls already solved (don't reintroduce)
- `CharFX` needs `colorInterpolationFilters="sRGB"`, or `dark` barely darkens.
- In expressions, guard `exp()` growth with `max(t-a,0)`. The old ffmpeg `0*inf=NaN` bug blacked out early frames.
- `boltPath` sub-branches pass `nBranch=0`; otherwise recursion is infinite.
- Clamp camera pull-back zooms so scaled layers never go smaller than the frame. Keep foreground ridges wide (x from -800 to W+800).
- In tracking scenes, wrap `DustBank` in `translate(cam.x*depth)` or it drifts off-screen.
- Remotion outputs full-range `yuvj420p`, and `finalize.sh` converts it to TV-range bt709. Renders are `--muted`; audio is always added by `mix.py`.
- Render stills one at a time (`stills.mjs` does this). Parallel `renderStill` calls crash.

## Deliverable checklist
- [ ] Frame 0 shows the hero; there is no black first frame.
- [ ] Cuts sit on word boundaries; there is one designed big reveal and one biggest hero shot, plus a bookend ending and a cut to black.
- [ ] The same character design is used in every shot, and there are no added titles or labels.
- [ ] The subtitles are spelled exactly as in the script.
- [ ] `check_mix.py` targets are met, and the final file is at about −14 LUFS.
- [ ] You sent the user the mp4 and told them, briefly, what each section shows.
