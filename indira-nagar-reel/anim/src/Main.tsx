import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, END_SEC, FPS, clamp, flash, ramp, sec} from './lib';
import {Black, Defs, Finish} from './world';
import {Captions} from './Captions';
import {Accepts, AdiParva, Brahmastra, Disguise, DronaClose, Journey, Mahendra, Myth, Penance, Record, Refuses, Reserved, Rival, School, Vows} from './scenes/Story';

export const TOTAL_FRAMES = sec(END_SEC);
/** Final cut to black (~0.7 s after the last word). */
export const BLACK_AT = 41.5;

type Trans = {type: 'cut' | 'fade' | 'ink' | 'split' | 'flash' | 'dust'; d?: number};
type Shot = {from: number; to: number; C: React.FC<{t: number}>; in: Trans};

// Cut points sit on the voiceover's word boundaries (from src/words.json).
export const SHOTS: Shot[] = [
	{from: 0, to: 5.05, C: Myth, in: {type: 'cut'}},
	{from: 5.05, to: 6.95, C: Record, in: {type: 'ink', d: 0.7}},
	{from: 6.95, to: 10.1, C: Accepts, in: {type: 'split', d: 0.75}},
	{from: 10.1, to: 12.62, C: School, in: {type: 'cut'}},
	{from: 12.62, to: 16.88, C: AdiParva, in: {type: 'ink', d: 0.8}},
	{from: 16.88, to: 19.22, C: Journey, in: {type: 'fade', d: 0.6}},
	{from: 19.22, to: 22.2, C: DronaClose, in: {type: 'cut'}},
	{from: 22.2, to: 25.3, C: Brahmastra, in: {type: 'flash', d: 0.4}},
	{from: 25.3, to: 27.05, C: Rival, in: {type: 'cut'}},
	{from: 27.05, to: 28.7, C: Refuses, in: {type: 'flash', d: 0.25}},
	{from: 28.7, to: 30.95, C: Reserved, in: {type: 'fade', d: 0.5}},
	{from: 30.95, to: 33.2, C: Vows, in: {type: 'fade', d: 0.5}},
	{from: 33.2, to: 36.9, C: Penance, in: {type: 'dust', d: 0.6}},
	{from: 36.9, to: 38.7, C: Mahendra, in: {type: 'fade', d: 0.5}},
	{from: 38.7, to: BLACK_AT, C: Disguise, in: {type: 'cut'}},
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
