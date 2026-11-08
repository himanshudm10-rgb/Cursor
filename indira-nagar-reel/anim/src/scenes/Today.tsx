// 54.05 - 57.15  "Yet today, very few people worship him."
// 57.15 - 59.40  "So what changed?"  (bookend: same mountain as the reveal, now dark)
import React from 'react';
import {CharFX, Indra, Vajra} from '../characters';
import {flash, keys, ramp, rng} from '../lib';
import {Clouds, Dust, Layer, Scene, Sky} from '../world';
import {MountainWorld} from './MountainWorld';
import {Villager} from './Protector';

export const Building: React.FC<{x: number; w: number; h: number; base: number; tone: string; seed: number; lit?: number}> = ({x, w, h, base, tone, seed, lit = 0.3}) => {
	const r = rng(seed);
	const wins = [];
	for (let yy = base - h + 30; yy < base - 40; yy += 46)
		for (let xx = x + 16; xx < x + w - 24; xx += 34) wins.push(<rect key={`${xx}-${yy}`} x={xx} y={yy} width={16} height={22} fill={r() < lit ? '#e8d7a4' : '#4a5058'} opacity={0.85} />);
	return (
		<g>
			<rect x={x} y={base - h} width={w} height={h} fill={tone} />
			{wins}
			<rect x={x + w * 0.6} y={base - h - 30} width={6} height={30} fill={tone} />
		</g>
	);
};

export const Shikhara: React.FC<{x: number; base: number; s: number; tone: string}> = ({x, base, s, tone}) => (
	<g transform={`translate(${x} ${base}) scale(${s})`} fill={tone}>
		<rect x={-120} y={-120} width={240} height={120} />
		<path d="M-90,-120 C-90,-260 -50,-380 0,-430 C50,-380 90,-260 90,-120 Z" />
		<rect x={-24} y={-460} width={48} height={30} rx={10} />
		<path d="M0,-460 L0,-520" stroke={tone} strokeWidth={6} />
		<path d="M0,-520 L30,-508 L0,-496 Z" />
	</g>
);

/** The small forgotten shrine: an empty pedestal under an emblem lintel. */
const Shrine: React.FC<{dust: number}> = ({dust}) => (
	<g>
		<rect x={-170} y={-40} width={340} height={40} fill="#6a6660" />
		<rect x={-150} y={-360} width={36} height={320} fill="#7a766e" />
		<rect x={114} y={-360} width={36} height={320} fill="#7a766e" />
		<path d="M-190,-360 L190,-360 L150,-440 L-150,-440 Z" fill="#6e6a62" />
		<path d="M-120,-440 L0,-540 L120,-440 Z" fill="#646058" />
		<g transform="translate(0 -400) scale(0.7)" opacity={0.75}>
			<Vajra len={220} dark />
		</g>
		<rect x={-60} y={-110} width={120} height={70} fill="#5a5650" />
		<rect x={-70} y={-120} width={140} height={14} fill="#625e56" />
		<path d="M-140,-300 L-128,-250 L-140,-200 M120,-200 L130,-160" stroke="#3a3832" strokeWidth={3} fill="none" />
		<path d="M-170,-40 C-150,-60 -120,-56 -100,-40 Z M100,-40 C120,-62 160,-58 170,-40 Z" fill="#4a5a3a" />
		<rect x={-170} y={-45} width={340} height={8} fill="#a8a094" opacity={0.5 * dust} />
	</g>
);

export const Today: React.FC<{t: number}> = ({t}) => {
	const ghost = keys(t, [[0, 0.22], [1.3, 0]]);
	const toShrine = ramp(t, 1.0, 1.9);
	const away = ramp(t, 1.9, 3.2);
	const zoom = 1 + toShrine * 0.75 - away * 0.55;
	const camX = toShrine * 230 - away * 80;
	const camY = -60 + toShrine * 640 - away * 260;
	const r = rng(12);
	const crowd = Array.from({length: 26}, () => ({x: r() * 1500 - 200, dir: r() > 0.5 ? 1 : -1, y: 1700 + r() * 120, sp: 40 + r() * 50}));
	const sat = 1 - away * 0.6;
	return (
		<div style={{position: 'absolute', inset: 0, filter: `saturate(${sat})`}}>
			<Scene cam={{zoom, x: camX, y: camY}} bg="#b9bcbe">
				<Layer depth={0.08}>
					<Sky top="#8e9aa6" mid="#c4c6c4" bottom="#dcd6c8" />
				</Layer>
				<Layer depth={0.15}>
					<Clouds t={t} seed={201} y={400} spread={260} count={8} size={240} dark="#aab2ba" light="#e2e2de" drift={8} opacity={0.7} />
					{/* the old god fading from the sky over the city */}
					<g transform="translate(540 1300) scale(1.1)" opacity={ghost}>
						<CharFX dark={0.95} rim="#ffffff" rimA={0.3}>
							<Indra t={t} wind={0.4} />
						</CharFX>
					</g>
				</Layer>
				<Layer depth={0.4}>
					{Array.from({length: 12}, (_, i) => {
						const rr = rng(300 + i);
						return <Building key={i} x={-300 + i * 140} w={120 + rr() * 60} h={380 + rr() * 520} base={1400} tone={i % 2 ? '#7c8088' : '#8a8c90'} seed={i} />;
					})}
					<Shikhara x={180} base={1400} s={0.8} tone="#a08870" />
					<Shikhara x={900} base={1400} s={0.6} tone="#9a8268" />
				</Layer>
				<Layer depth={0.7}>
					{Array.from({length: 9}, (_, i) => {
						const rr = rng(400 + i);
						return <Building key={i} x={-400 + i * 200} w={170 + rr() * 50} h={240 + rr() * 260} base={1560} tone={i % 2 ? '#5e626a' : '#6a6c70'} seed={50 + i} lit={0.5} />;
					})}
					<path d="M-400,1180 Q300,1260 1500,1170 M-400,1220 Q400,1300 1500,1210" stroke="#2a2c30" strokeWidth={3} fill="none" />
				</Layer>
				<Layer depth={1}>
					<rect x={-800} y={1560} width={2700} height={900} fill="#4a4a4c" />
					<rect x={-800} y={1560} width={2700} height={40} fill="#6a6a6a" />
					<g transform="translate(780 1600) scale(0.9)">
						<Shrine dust={away} />
					</g>
					{crowd.map((c, i) => (
						<g key={i} transform={`translate(${c.x + c.dir * c.sp * t} ${c.y}) scale(${c.dir} 1)`}>
							<Villager t={t} seed={i + 40} walk={1} tone="#3a3634" cloth={['#6a7a8a', '#8a6a5a', '#5a5a62', '#9a8a6a'][i % 4]} />
						</g>
					))}
				</Layer>
				<Layer depth={1.3}>
					<Dust t={t} seed={101} count={60} color="#f2ecdc" vx={4} vy={22} size={2} opacity={0.5} />
				</Layer>
			</Scene>
		</div>
	);
};

export const Question: React.FC<{t: number}> = ({t}) => {
	const lit = flash(t, [1.0], 3.2);
	return (
		<MountainWorld
			t={t + 20}
			cam={{zoom: keys(t, [[0, 2.7], [2.6, 0.62]], (x) => 1 - Math.pow(1 - x, 2)), y: keys(t, [[0, -20], [2.6, 120]])}}
			pose={{rArm: 8, rElbow: 4, vajraAng: 84, lArm: 18, lElbow: -40, wind: 1.0, energy: 0}}
			lit={lit * 0.8}
			faceLit={lit}
			bolts={[{seed: 31, v: flash(t, [1.0], 6) * 0.7, x0: 860, x1: 900}]}
			crawl={flash(t, [1.6], 3) * 0.4}
			dark={1}
		/>
	);
};
