// Illustrated palm-leaf manuscripts (no readable script: abstract strokes under a headline).
// 12.30 - 14.70 "Those stories come from the Puranas, which were written much later."
// 20.70 - 24.25 "He is mentioned in almost every mandala, more than any other deity."
import React from 'react';
import {Vajra} from '../characters';
import {C, clamp, flash, keys, ramp, rng} from '../lib';
import {Dust, Fire, Layer, Ridge, Scene} from '../world';

/** One row of abstract script. motifs: glyph indices replaced by a small emblem (here the Vajra). */
const GlyphRow: React.FC<{seed: number; w: number; y: number; ink: string; motifs?: number[]; glow?: number[]}> = ({seed, w, y, ink, motifs = [], glow = []}) => {
	const r = rng(seed);
	const out: React.ReactNode[] = [];
	let x = 0;
	let gi = 0;
	while (x < w - 30) {
		const word = 2 + Math.floor(r() * 4);
		const x0 = x;
		for (let k = 0; k < word && x < w - 30; k++, gi++) {
			const m = motifs.indexOf(gi);
			if (m >= 0) {
				const g = glow[m] ?? 0;
				out.push(
					<g key={`m${gi}`} transform={`translate(${x + 18} ${y + 14}) rotate(90) scale(0.2)`}>
						{g > 0.02 && <circle r={90} fill={C.paleGold} opacity={0.5 * g} filter="url(#b14)" />}
						<Vajra len={150} />
					</g>,
				);
				x += 36;
				continue;
			}
			const a = r();
			const b = r();
			const d =
				`M${x + 4},${y + 4} L${x + 4},${y + 26} ` +
				(a > 0.5 ? `M${x + 4},${y + 14} C${x + 16},${y + 8} ${x + 20},${y + 22} ${x + 10},${y + 24} ` : `M${x + 14},${y + 4} C${x + 22},${y + 12} ${x + 18},${y + 26} ${x + 6},${y + 20} `) +
				(b > 0.6 ? `M${x + 12},${y + 26} q6,8 -2,12 ` : '') +
				(b < 0.25 ? `M${x + 2},${y - 2} q8,-8 14,0 ` : '');
			out.push(<path key={gi} d={d} stroke={ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />);
			x += 22 + r() * 6;
		}
		out.push(<path key={`h${gi}`} d={`M${x0},${y + 4} L${x - 2},${y + 4}`} stroke={ink} strokeWidth={2.6} />);
		x += 16;
	}
	return <g>{out}</g>;
};

/** A palm leaf: long rounded strip with string holes and rows of script. */
export const Leaf: React.FC<{w?: number; h?: number; seed: number; rows?: number; motifs?: number[][]; glow?: number[][]; tone?: string; reveal?: number}> = ({w = 940, h = 170, seed, rows = 4, motifs = [], glow = [], tone = C.paper, reveal = 1}) => {
	const id = `lf${seed}`;
	return (
		<g>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={tone} />
					<stop offset="1" stopColor="#b59c6e" />
				</linearGradient>
				<clipPath id={id + 'c'}>
					<rect x={0} y={0} width={w * reveal} height={h} />
				</clipPath>
			</defs>
			<rect x={4} y={10} width={w} height={h} rx={h / 2.4} fill="#000" opacity={0.35} filter="url(#b8)" />
			<rect x={0} y={0} width={w} height={h} rx={h / 2.4} fill={`url(#${id})`} stroke="#6b5434" strokeWidth={2} />
			{Array.from({length: 7}, (_, i) => (
				<path key={i} d={`M30,${18 + i * 22} L${w - 30},${20 + i * 22}`} stroke="#8a744e" strokeWidth={1} opacity={0.35} />
			))}
			<g clipPath={`url(#${id}c)`}>
				{Array.from({length: rows}, (_, i) => (
					<g key={i} transform="translate(60 0)">
						<GlyphRow seed={seed * 10 + i} w={w - 120} y={26 + i * ((h - 40) / rows)} ink="#3a2614" motifs={motifs[i]} glow={glow[i]} />
					</g>
				))}
			</g>
			<circle cx={w * 0.3} cy={h / 2} r={9} fill="#2a1d10" />
			<circle cx={w * 0.7} cy={h / 2} r={9} fill="#2a1d10" />
		</g>
	);
};

export const Puranas: React.FC<{t: number}> = ({t}) => {
	const turn1 = ramp(t, 0.35, 1.05);
	const turn2 = ramp(t, 1.05, 1.7);
	const toLand = ramp(t, 1.55, 2.4);
	const flip = (p: number) => Math.cos(Math.PI * p);
	const leafY = (i: number) => 520 + i * 200;
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.08], [2.4, 1.22]]), x: keys(t, [[0, -40], [2.4, 60]]), rot: -2}} bg="#120b06">
			<Layer depth={0.2}>
				<rect x={-500} y={-500} width={2200} height={3000} fill="#1a1009" />
				<ellipse cx={180} cy={1500} rx={700} ry={600} fill="#e09a48" opacity={0.18 + 0.03 * Math.sin(t * 13)} filter="url(#b70)" />
			</Layer>
			<Layer depth={1}>
				<g opacity={1 - toLand}>
					{[3, 2, 1, 0].map((i) => {
						const p = i === 0 ? turn1 : i === 1 ? turn2 : 0;
						const sy = flip(p);
						return (
							<g key={i} transform={`translate(70 ${leafY(i)}) translate(0 ${-p * 120}) scale(1 ${Math.max(0.02, Math.abs(sy))})`}>
								<Leaf seed={30 + i} rows={4} tone={sy < 0 ? '#a58a5d' : C.paper} reveal={sy < 0 ? 0 : 1} />
							</g>
						);
					})}
					<path d={`M${70 + 940 * 0.3},420 L${70 + 940 * 0.3},1300 M${70 + 940 * 0.7},420 L${70 + 940 * 0.7},1300`} stroke="#5a2e1c" strokeWidth={4} opacity={0.6} />
				</g>
				{/* script lines become a ridge: older layers of the tradition */}
				<g opacity={toLand}>
					<Ridge seed={61} base={1250} amp={340} freq={0.004} fill="#3a2a1a" fill2="#1a120a" rim="#e2c88a" rimW={4} />
				</g>
				<Fire t={t} x={200} y={1600} s={0.9} seed={4} glow={0.9} />
				<path d="M110,1600 C100,1670 300,1670 290,1600 Z" fill="#4a2a18" />
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={21} count={45} color="#f0c98a" vx={8} vy={-12} size={1.8} opacity={0.5} />
			</Layer>
		</Scene>
	);
};

export const Mandalas: React.FC<{t: number}> = ({t}) => {
	const N = 10;
	const closeStart = 2.55;
	const fold = ramp(t, closeStart, closeStart + 0.6);
	const cover = ramp(t, closeStart + 0.55, closeStart + 0.95, (x) => x * x);
	const slam = flash(t, [closeStart + 0.95], 10);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [closeStart, 1.12], [3.55, 1.35]]), y: keys(t, [[0, -260], [closeStart, 260], [closeStart + 0.6, 0]])}} bg="#110b07">
			<Layer depth={0.2}>
				<rect x={-500} y={-1500} width={2200} height={5000} fill="#17100a" />
				<ellipse cx={540} cy={960} rx={800} ry={900} fill="#c98a3e" opacity={0.16} filter="url(#b70)" />
			</Layer>
			<Layer depth={1}>
				{Array.from({length: N}, (_, i) => {
					const appear = ramp(t, i * 0.2, i * 0.2 + 0.45);
					const baseY = 120 + i * 175;
					const y = baseY + (960 - 85 - baseY) * fold;
					const x = 70 + (1 - appear) * 900 + (i % 2 ? 14 : -14) * (1 - fold);
					const rot = (i % 2 ? 1.2 : -1.2) * (1 - fold);
					const g = (k: number) => clamp(ramp(t, 0.35 + i * 0.2 + k * 0.1, 0.6 + i * 0.2 + k * 0.1) - ramp(t, 1.4 + i * 0.2, 2.0 + i * 0.2) * 0.6);
					return (
						<g key={i} transform={`translate(${x} ${y}) rotate(${rot} 470 85)`} opacity={appear}>
							<Leaf seed={50 + i} rows={4} motifs={[[3 + (i % 3)], [], [6 + (i % 4)], [2]]} glow={[[g(0)], [], [g(1)], [g(2)]]} />
						</g>
					);
				})}
				<g opacity={fold > 0.9 ? 1 : 0}>
					<rect x={40} y={960 + 70} width={1000} height={90} rx={36} fill="#4a2c16" stroke="#2a180a" strokeWidth={4} />
					<rect x={40} y={960 - 175 - (1 - cover) * 600} width={1000} height={90} rx={36} fill="#5a3418" stroke="#2a180a" strokeWidth={4} />
					<path d={`M120,${960 - 130 - (1 - cover) * 600} L960,${960 - 130 - (1 - cover) * 600}`} stroke={C.gold} strokeWidth={4} opacity={0.6} />
				</g>
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={22} count={40} color="#f0c98a" vx={10} vy={-8} size={1.8} opacity={0.45 + slam * 0.5} />
			</Layer>
		</Scene>
	);
};
