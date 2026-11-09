// Characters for "Hanuman Chalisa - Part 2". Built with the house toolkit (limb, smoothPath, C palette, CharFX).
// Every character appears only through these components, with the same proportions in every shot.
//
// HANUMAN signature silhouette (readable as a black shape):
//   1. tall tiered gold crown (mukut) with a finial
//   2. the gada (round fluted mace on a long handle)
//   3. the long S-curved tail that rises behind him and ends in a curl
// Accent colour: muted saffron (dhoti + sash). Skin: warm vermilion-ochre (sindoor), muzzle lighter.
import React from 'react';
import {limb} from './characters';
import {C, clamp, noise, rng, smoothPath} from './lib';
import {Fire} from './world';

const rad = (d: number) => (d * Math.PI) / 180;

export {HC, Gada, ribbon} from './props';
export {Hanuman} from './hero';
export type {HanumanPose} from './hero';
import {HC} from './props';

export {Akshay, Anjani, Rakshasa, Ram, Ravan, RingHands, Sita, Tulsidas} from './cast';
