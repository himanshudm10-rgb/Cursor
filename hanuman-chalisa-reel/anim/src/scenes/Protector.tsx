// 45.50 - 48.35  "Indra is also a protector."
// 48.35 - 51.50  "In the fifth mandala, he even reunites lost calves with their mothers."
// 51.50 - 54.05  "He is a god who fights for his people."
import React from 'react';
import {CharFX, Cow, Indra} from '../characters';
import {flash, keys, ramp, rng} from '../lib';
import {Bolt, CloudCrawl, Clouds, Dust, Layer, Ridge, Scene, Sky, Smoke} from '../world';
import {Hut} from './Vedic';

/** Simple villager, warm painted tones. walk 0..1 swings the legs. */
export const Villager: React.FC<{t: number; seed: number; child?: boolean; walk?: number; tone?: string; cloth?: string}> = ({t, seed, child, walk = 0, tone = '#6e4a32', cloth}) => {
	const r = rng(seed);
	const c = cloth ?? ['#c9b48a', '#8a3a2a', '#5a6a7a', '#b08a4a'][Math.floor(r() * 4)];
	const s = child ? 0.6 : 0.9 + r() * 0.15;
	const sw = Math.sin(t * 6 * walk + seed) * 16 * walk;
	return (
		<g transform={`scale(${s})`}>
			<path d={`M-8,-70 L${-10 + sw},0 L${-2 + sw},0 L0,-60 Z M8,-70 L${10 - sw},0 L${2 - sw},0 L0,-60 Z`} fill={tone} />
			<path d="M-22,-150 C-26,-110 -24,-80 -20,-60 L20,-60 C24,-80 26,-110 22,-150 Z" fill={c} />
			<path d="M-22,-150 L-30,-90 M22,-150 L30,-90" stroke={tone} strokeWidth={9} strokeLinecap="round" />
			<circle cx={0} cy={-170} r={16} fill={tone} />
			<path d="M-17,-176 C-14,-196 14,-196 17,-176 Z" fill="#15100c" />
		</g>
	);
};

export const Grass: React.FC<{t: number; y: number; seed: number; color: string; h?: number; n?: number; x0?: number; x1?: number}> = ({t, y, seed, color, h = 120, n = 90, x0 = -300, x1 = 1400}) => {
	const r = rng(seed);
	return (
		<g fill={color}>
			{Array.from({length: n}, (_, i) => {
				const x = x0 + ((x1 - x0) * i) / n + r() * 10;
				const hh = h * (0.6 + r() * 0.7);
				const sway = Math.sin(t * 1.8 + x * 0.01) * 14 + 6;
				return <path key={i} d={`M${x - 5},${y} Q${x + sway * 0.5},${y - hh * 0.5} ${x + sway},${y - hh} Q${x + sway * 0.3 + 2},${y - hh * 0.5} ${x + 5},${y} Z`} />;
			})}
		</g>
	);
};

export const Village: React.FC<{t: number}> = ({t}) => {
	const r = rng(5);
	const people = Array.from({length: 9}, (_, i) => ({x: 120 + i * 105 + r() * 30, child: i % 3 === 1, walk: i % 2 ? 0.6 : 0}));
	return (
		<Scene cam={{x: keys(t, [[0, -90], [3.2, 90]]), zoom: 1.05}} bg="#e9b874">
			<Layer depth={0.08}>
				<Sky top="#6f8aa8" mid="#e8c48c" bottom="#f2d6a0" glow="#fff0c8" glowX={760} glowY={900} glowR={600} />
				<circle cx={760} cy={880} r={70} fill="#fff4d6" opacity={0.9} filter="url(#b8)" />
			</Layer>
			<Layer depth={0.2}>
				<Clouds t={t} seed={171} y={420} spread={240} count={8} size={200} dark="#e2b88a" light="#fff0d0" drift={10} opacity={0.6} />
			</Layer>
			<Layer depth={0.4}>
				<Ridge seed={172} base={1250} amp={240} freq={0.003} peaks={[{x: 260, h: 160, w: 220}]} fill="#8a7a6a" fill2="#a89270" />
				{/* the protector on the hill, watching over them */}
				<g transform="translate(270 1006) scale(0.15)">
					<CharFX dark={0.45} rim="#fff0c8" rimA={1} rimDir={[0.8, -0.4]} rimW={10}>
						<Indra t={t} wind={0.6} rArm={12} rElbow={6} vajraAng={78} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={0.65}>
				<rect x={-600} y={1280} width={2400} height={900} fill="#7a7a42" />
				{Array.from({length: 6}, (_, i) => (
					<path key={i} d={`M-600,${1310 + i * 50} L1800,${1300 + i * 52}`} stroke={i % 2 ? '#8e8a4a' : '#6a6a38'} strokeWidth={24} />
				))}
				<Hut x={640} y={1330} s={0.6} tone="#8a6a48" />
				<Hut x={780} y={1340} s={0.75} tone="#7a5a3a" />
				<Hut x={930} y={1320} s={0.55} tone="#8a6a48" />
				<Smoke t={t} x={790} y={1260} rise={500} seed={14} color="#d9c9b0" count={10} size={20} spread={0.4} opacity={0.35} />
				{[0, 1, 2].map((i) => (
					<g key={i} transform={`translate(${200 + i * 130 + t * 12} ${1440 + i * 20}) scale(0.5)`}>
						<Cow t={t} walk={0.25} phase={i} fill={i === 1 ? '#a89478' : '#d8cab0'} />
					</g>
				))}
			</Layer>
			<Layer depth={1}>
				<rect x={-600} y={1600} width={2400} height={600} fill="#6a5a34" />
				{people.map((p, i) => (
					<g key={i} transform={`translate(${p.x + p.walk * t * 20} ${1700 + (i % 3) * 30}) `}>
						<Villager t={t} seed={i + 3} child={p.child} walk={p.walk} />
					</g>
				))}
			</Layer>
			<Layer depth={1.4}>
				<Grass t={t} y={1960} seed={3} color="#3a3a1c" h={200} />
				<Dust t={t} seed={91} count={50} color="#fff0c0" vx={12} vy={-6} size={2} opacity={0.6} area={[0, 700, 1080, 1100]} />
			</Layer>
		</Scene>
	);
};

export const Calves: React.FC<{t: number}> = ({t}) => {
	const cx = t * 150;
	const meet = 2.3;
	const calfX = (i: number) => cx + 260 + i * 150 + ramp(t, 1.8, meet) * 190;
	const momX = (i: number) => cx + 1300 + i * 150 - ramp(t, 1.4, meet) * 560;
	const nuzzle = ramp(t, meet + 0.3, meet + 0.8);
	return (
		<Scene cam={{x: cx, zoom: 1.15, y: 160}} bg="#e8b874">
			<Layer depth={0.05}>
				<Sky top="#8a9ab0" mid="#e6c08a" bottom="#f4d8a2" glow="#fff2cc" glowX={900} glowY={1100} glowR={700} />
			</Layer>
			<Layer depth={0.3}>
				<Ridge seed={181} base={1230} amp={160} freq={0.003} fill="#a89070" fill2="#c8ac80" />
				{Array.from({length: 7}, (_, i) => (
					<g key={i} transform={`translate(${900 + i * 90} ${1260 + (i % 2) * 14}) scale(0.22)`}>
						<Cow t={t} walk={0.2} phase={i} fill="#9a8a70" />
					</g>
				))}
			</Layer>
			<Layer depth={0.6}>
				<rect x={-600} y={1270} width={4000} height={900} fill="#b09a5a" />
				<g filter="url(#b14)" opacity={0.5}>
					<rect x={-600} y={1250} width={4000} height={80} fill="#f6e2b8" />
				</g>
			</Layer>
			<Layer depth={1}>
				<Grass t={t} y={1600} seed={8} color="#8a7a3a" h={150} n={140} x0={-300} x1={2400} />
				{[0, 1].map((i) => (
					<g key={'m' + i} transform={`translate(${momX(i)} ${1700 + i * 40}) scale(-1.05 1.05)`}>
						<Cow t={t} walk={t > 1.6 && t < meet + 0.3 ? 0.6 : 0.05} phase={i} fill={i ? '#cbbd9e' : '#ddd0b4'} headDown={i === 0 ? nuzzle : nuzzle * 0.5} />
					</g>
				))}
				{[0, 1].map((i) => (
					<g key={'c' + i} transform={`translate(${Math.min(calfX(i), momX(i) - 300)} ${1710 + i * 40}) scale(1.15)`}>
						<Cow t={t} calf walk={t < meet ? (t > 1.8 ? 1.2 : 0.6) : 0.05} phase={i * 1.7} fill={i ? '#d8c8a8' : '#e6d8bc'} headDown={i === 0 ? -nuzzle * 0.4 : 0} />
					</g>
				))}
			</Layer>
			<Layer depth={1.5}>
				<Grass t={t} y={2000} seed={9} color="#4a4020" h={260} n={120} x0={-300} x1={3800} />
				<Dust t={t} seed={92} count={60} color="#fff2c6" vx={-20} vy={-8} size={2.2} opacity={0.6} area={[cx * 1.5, 600, 1300, 1300]} />
			</Layer>
		</Scene>
	);
};

export const StormStand: React.FC<{t: number}> = ({t}) => {
	const lit = flash(t, [1.2, 1.9, 2.4], 6);
	const grow = ramp(t, 0, 2.6, (x) => x);
	const raise = ramp(t, 1.75, 2.3);
	const r = rng(9);
	const folk = Array.from({length: 14}, (_, i) => ({x: 40 + i * 75 + r() * 30, y: 1780 + r() * 70, child: i % 4 === 2}));
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.2], [2.6, 0.98]]), y: keys(t, [[0, -40], [2.6, 0]])}} bg="#121620">
			<Layer depth={0.06}>
				<Sky top="#06080e" mid="#1e2534" bottom="#6a6a68" />
			</Layer>
			<Layer depth={0.15}>
				<Clouds t={t} seed={191} y={500 + grow * 200} spread={600} count={16} size={360 + grow * 160} dark="#0a0d14" light="#2e3646" drift={-10} lit={lit} />
				<Bolt seed={192} x0={320} y0={-200} x1={260} y1={1260} v={flash(t, [1.2], 8)} width={6} />
				<Bolt seed={193} x0={860} y0={-200} x1={940} y1={1250} v={flash(t, [1.9], 8)} width={6} />
				<CloudCrawl seed={194} x={540} y={700} len={900} v={flash(t, [2.35], 4) * raise} ang={-0.5} />
				<CloudCrawl seed={195} x={540} y={700} len={900} v={flash(t, [2.35], 4) * raise} ang={Math.PI + 0.5} />
			</Layer>
			<Layer depth={0.4}>
				<Ridge seed={196} base={1320} amp={120} freq={0.003} fill="#1a1e28" fill2="#3a3a3e" />
				<Clouds t={t} seed={197} y={1200 - grow * 60} spread={160} count={12} size={240} dark="#151a24" light="#3a4252" drift={-30} opacity={0.75} />
			</Layer>
			<Layer depth={0.8}>
				<rect x={-600} y={1450} width={2400} height={900} fill="#2a2620" />
				<g transform="translate(540 1500) scale(0.62)">
					<CharFX dark={0.55 - lit * 0.35} rim="#dfe8ff" rimA={0.8} rimDir={[0, -1]} rimW={8}>
						<Indra t={t} back wind={1.4} windDir={-1} rArm={14 + raise * 140} rElbow={8 - raise * 18} vajraAng={70 - raise * 55} energy={raise * 0.9} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.1}>
				<Hut x={70} y={1760} s={1.0} tone="#3a2c20" />
				<Hut x={1010} y={1770} s={0.9} tone="#3a2c20" />
				{folk.map((f, i) => (
					<g key={i} transform={`translate(${f.x} ${f.y}) scale(0.62)`}>
						<CharFX dark={0.75} rim="#9fb0c8" rimDir={[0, -1]} rimW={4}>
							<Villager t={t} seed={i + 20} child={f.child} />
						</CharFX>
					</g>
				))}
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={93} count={70} color="#c8d0dc" vx={-120} vy={10} size={2.2} opacity={0.55} />
			</Layer>
		</Scene>
	);
};
