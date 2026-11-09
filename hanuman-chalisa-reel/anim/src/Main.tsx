import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, END_SEC, FPS, clamp, flash, ramp, sec} from './lib';
import {Black, Defs, Finish} from './world';
import {Captions} from './Captions';
// ---- scenes for THIS film ----
import {Bookend, Devotion} from './scenes/Devotion';
import {EveryLine, GangaWriting, Vision} from './scenes/Tulsidas';
import {AnjaniVayu, RamDoot, Strength} from './scenes/Origin';
import {BurningLanka, EnterLanka, LankaReveal, OceanLeap} from './scenes/Lanka';
import {Captive, DestroyVatika, DootIntro, FoundHer, RingClose, Rise} from './scenes/Vatika';
import {Akshay, RavanCourt, Shaken, TailFire} from './scenes/War';

export const TOTAL_FRAMES = sec(END_SEC);
/** Final cut to black (~0.7 s after the last word, "doot." ends 58.86). */
export const BLACK_AT = 59.56;

type Trans = {type: 'cut' | 'fade' | 'ink' | 'split' | 'flash' | 'dust'; d?: number};
type Shot = {from: number; to: number; C: React.FC<{t: number}>; in: Trans};

// Cut points sit a hair before the word that motivates them (src/words.json).
// Scene component receives t = seconds since its `from` (negative during its in-transition).
export const SHOTS: Shot[] = [
	{from: 0, to: 4.76, C: Devotion, in: {type: 'cut'}}, // chant: Ram doot atulit bal dhama...
	{from: 4.76, to: 8.38, C: GangaWriting, in: {type: 'fade', d: 0.6}}, // This is part two of our Hanuman Chalisa series,
	{from: 8.38, to: 11.58, C: EveryLine, in: {type: 'ink', d: 0.7}}, // where we understand the meaning behind every line.
	{from: 11.58, to: 14.48, C: Vision, in: {type: 'fade', d: 0.6}}, // Tulsidas describes Hanumanji as the son of
	{from: 14.48, to: 16.34, C: AnjaniVayu, in: {type: 'fade', d: 0.5}}, // Mata Anjani and Vayudev,
	{from: 16.34, to: 19.1, C: Strength, in: {type: 'flash', d: 0.25}}, // possessing strength beyond comparison.
	{from: 19.1, to: 22.28, C: RamDoot, in: {type: 'fade', d: 0.6}}, // But to understand why he is called Shri Ram's messenger,
	{from: 22.28, to: 24.78, C: LankaReveal, in: {type: 'split', d: 0.75}}, // we need to visit Ravan's Lanka.   (the big reveal)
	{from: 24.78, to: 27.28, C: Captive, in: {type: 'fade', d: 0.7}}, // When Maa Sita was held captive,
	{from: 27.28, to: 28.56, C: OceanLeap, in: {type: 'cut'}}, // Hanumanji crossed the ocean,
	{from: 28.56, to: 30.26, C: EnterLanka, in: {type: 'cut'}}, // entered Lanka, and finally,
	{from: 30.26, to: 31.78, C: FoundHer, in: {type: 'fade', d: 0.5}}, // found her in Ashok Vatika.
	{from: 31.78, to: 35.3, C: DootIntro, in: {type: 'fade', d: 0.5}}, // He introduced himself as Shri Ram ka doot
	{from: 35.3, to: 37.26, C: RingClose, in: {type: 'cut'}}, // and gave her Shri Ram's ring.
	{from: 37.26, to: 39.12, C: Rise, in: {type: 'fade', d: 0.4}}, // But before returning, Hanumanji
	{from: 39.12, to: 41.12, C: DestroyVatika, in: {type: 'flash', d: 0.25}}, // destroyed Ashok Vatika.
	{from: 41.12, to: 43.3, C: RavanCourt, in: {type: 'cut'}}, // Ravan sent his warriors, including his son
	{from: 43.3, to: 46.18, C: Akshay, in: {type: 'flash', d: 0.2}}, // Akshay Kumar, whom Hanumanji killed.
	{from: 46.18, to: 48.74, C: TailFire, in: {type: 'fade', d: 0.4}}, // And when the rakshasas set his tail on fire,
	{from: 48.74, to: 51.92, C: BurningLanka, in: {type: 'flash', d: 0.3}}, // Hanumanji escaped and burned much of Lanka.  (biggest hero shot)
	{from: 51.92, to: 54.98, C: Shaken, in: {type: 'cut'}}, // The son of Vayudev had shaken Ravan's kingdom.
	{from: 54.98, to: BLACK_AT, C: Bookend, in: {type: 'fade', d: 0.8}}, // Yet, he called himself simply Bhagwan Shri Ram ka doot.
];

const half = (tr: Trans) => (tr.type === 'cut' || tr.type === 'flash' ? 0 : (tr.d ?? 0) / 2);

export const Main: React.FC = () => {
	const frame = useCurrentFrame();
	const T = frame / FPS;
	const layers: React.ReactNode[] = [];
	SHOTS.forEach((s, i) => {
		const next = SHOTS[i + 1];
		const start = s.from - half(s.in);
		const end = next ? next.from + half(next.in) : s.to;
		if (T < start || T >= end) return;
		const t = T - s.from;
		const p = s.in.d ? clamp((T - start) / s.in.d) : 1;
		let style: React.CSSProperties = {};
		if (s.in.type === 'fade' || s.in.type === 'dust') style = {opacity: p};
		if (s.in.type === 'ink') {
			// ink spreading through paper: several blooms at different rates
			const blob = (x: number, y: number, k: number) => {
				const r = Math.max(0, p * 150 * k - 8);
				return `radial-gradient(circle at ${x}% ${y}%, #000 ${r}%, transparent ${r + 9}%)`;
			};
			const m = [blob(50, 52, 1), blob(30, 40, 0.8), blob(72, 64, 0.85), blob(58, 28, 0.7), blob(36, 74, 0.75), blob(80, 38, 0.6)].join(', ');
			style = {WebkitMaskImage: m, maskImage: m};
		}
		layers.push(
			<AbsoluteFill key={i} style={style}>
				<s.C t={t} />
			</AbsoluteFill>,
		);
		// the dark frame tears open like a manuscript (the big reveal)
		if (s.in.type === 'split' && T < s.from + (s.in.d ?? 0.7)) {
			const q = ramp(T, s.from, s.from + (s.in.d ?? 0.7), (x) => x * x * (3 - 2 * x));
			const panel = (side: -1 | 1) => (
				<div
					key={side}
					style={{
						position: 'absolute',
						top: 0,
						bottom: 0,
						width: '50%',
						left: side < 0 ? 0 : '50%',
						background: '#030406',
						transform: `translateX(${side * q * 105}%)`,
						borderLeft: side > 0 ? `3px solid ${C.gold}` : undefined,
						borderRight: side < 0 ? `3px solid ${C.gold}` : undefined,
						boxShadow: `0 0 40px rgba(226,200,138,${0.6 * (1 - q)})`,
					}}
				/>
			);
			layers.push(
				<AbsoluteFill key={`split${i}`}>
					{panel(-1)}
					{panel(1)}
				</AbsoluteFill>,
			);
		}
		if (s.in.type === 'dust') {
			const k = 1 - Math.abs((T - s.from) / ((s.in.d ?? 0.6) / 2 + 0.2));
			if (k > 0)
				layers.push(
					<AbsoluteFill key={`dust${i}`} style={{background: 'radial-gradient(ellipse at 50% 60%, #b89a6e 0%, #6a5236 70%)', opacity: k * 0.85, filter: 'blur(20px)'}} />,
				);
		}
	});
	const cutFlashes = SHOTS.filter((s) => s.in.type === 'flash' || s.in.type === 'split').map((s) => s.from);
	const fl = flash(T, cutFlashes, 10);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Defs />
			{layers}
			{fl > 0.01 && <AbsoluteFill style={{background: '#e6eeff', opacity: fl * 0.75, mixBlendMode: 'screen'}} />}
			<Captions T={T} />
			<Finish frame={frame} />
			<Black v={T >= BLACK_AT ? 1 : 0} />
			{/* preview only - final renders are --muted and the voice-first mix is added by finalize.sh */}
			<Audio src={staticFile('Voiceover.mp3')} />
		</AbsoluteFill>
	);
};
