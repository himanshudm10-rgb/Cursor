#!/bin/bash
# Downloads the FluidR3 GM instrument samples used by score.py (MIT licensed, gleitz/midi-js-soundfonts).
mkdir -p samples
B=https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM
for i in string_ensemble_1 string_ensemble_2 cello contrabass choir_aahs synth_choir acoustic_grand_piano orchestral_harp oboe french_horn trombone tuba brass_section timpani taiko_drum tremolo_strings pizzicato_strings \
         acoustic_guitar_nylon pad_2_warm voice_oohs synth_strings_1 flute; do
  for n in C1 E1 Ab1 C2 E2 Ab2 C3 E3 Ab3 C4 E4 Ab4 C5 E5 Ab5 C6 E6; do
    [ -s samples/${i}_$n.mp3 ] || curl -sf -o samples/${i}_$n.mp3 $B/$i-mp3/$n.mp3 &
  done; wait
done
