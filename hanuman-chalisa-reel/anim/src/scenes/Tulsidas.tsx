// 4.82 - 8.44   "This is part two of our Hanuman Chalisa series,"  Tulsidas writing on the ghats of the Ganga at dusk.
// 8.44 - 11.64  "where we understand the meaning behind every line."  Palm leaves; each line of script lights up in turn.
// 11.64 - 14.54 "Tulsidas describes Hanumanji as the son of"  The diya smoke rises into the vision of Hanuman in the sky.
import React from 'react';
import {CharFX, Sage} from '../characters';
import {Hanuman} from '../hanuman';
import {C, clamp, keys, ramp} from '../lib';
import {Clouds, Dust, Fire, Layer, Scene, Sky, Smoke} from '../world';
import {Leaf} from './Manuscript';
import {Shikhara} from './Today';
import {Sea} from './sets';

/** A small clay oil lamp. */
const Diya: React.FC<{t: number; x: number; y: number; s?: number; seed?: number}> = ({t, x, y, s = 1, seed = 1}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<ellipse cx={0} cy={-30} rx={60} ry={50} fill="#ffb060" opacity={0.25 + 0.05 * Math.sin(t * 11 + seed)} filter="url(#b24)" />
		<path d="M-34,-8 C-30,10 30,10 34,-8 Z" fill="#7a4424" />
		<path d="M-34,-8 L34,-8" stroke="#a8643a" strokeWidth={4} />
		<g transform="translate(0 -6) scale(0.16)">
			<Fire t={t} x={0} y={0} s={1} seed={seed} glow={0.5} />
		</g>
	</g>
);

/** Ghats: stepped stone banks with temple spires behind. */
const Ghats: React.FC<{y: number; tone: string; step: string}> = ({y, tone, step}) => (
	<g>
		<Shikhara x={180} base={y - 120} s={1.0} tone={tone} />
		<Shikhara x={880} base={y - 140} s={1.25} tone={tone} />
		<rect x={300} y={y - 330} width={420} height={210} fill={tone} />
		<path d="M300,-330 L720,-330" transform={`translate(0 ${y})`} stroke={step} strokeWidth={6} />
		{Array.from({length: 7}, (_, i) => (
			<rect key={i} x={-600 + i * 30} y={y - 120 + i * 30} width={2300 - i * 60} height={30} fill={i % 2 ? step : tone} />
		))}
	</g>
);

export const GangaWriting: React.FC<{t: number}> = ({t}) => (
	<Scene cam={{zoom: keys(t, [[-0.4, 1.12], [3.8, 1.25]]), x: keys(t, [[-0.4, -60], [3.8, 40]]), y: 80}} bg="#1a1214">
		<Layer depth={0.06}>
			<Sky top="#1c1a2c" mid="#6a3e3a" bottom="#d0884e" glow="#f0a85e" glowX={300} glowY={1000} glowR={700} />
		</Layer>
		<Layer depth={0.2}>
			<Clouds t={t} seed={21} y={520} spread={280} count={9} size={260} dark="#3a2630" light="#b0705a" drift={6} opacity={0.7} />
			<Ghats y={1040} tone="#2a1c1e" step="#3a2826" />
		</Layer>
		<Layer depth={0.4}>
			<Sea t={t} y={1040} deep="#2a1a1c" mid="#4a2c28" light="#f0b070" glowX={300} glow="#f6c27a" speed={0.3} />
			{/* floating diyas on the river */}
			{Array.from({length: 7}, (_, i) => (
				<Diya key={i} t={t} x={-100 + i * 190 + t * 18 + (i % 2) * 40} y={1120 + (i % 3) * 70} s={0.5 + (i % 3) * 0.15} seed={i + 2} />
			))}
		</Layer>
		<Layer depth={1}>
			<rect x={-800} y={1440} width={2700} height={900} fill="#1e1512" />
			<rect x={-800} y={1440} width={2700} height={10} fill="#4a3226" />
			<ellipse cx={560} cy={1240} rx={420} ry={360} fill="#f0a050" opacity={0.18} filter="url(#b70)" />
			<g transform="translate(560 1470) scale(0.95)">
				<CharFX dark={0.32} rim="#ffb468" rimA={0.95} rimDir={[0.9, -0.3]} rimW={8}>
					<Sage t={t} pray={0.12} wind={0.3} />
				</CharFX>
			</g>
			{/* low writing stand with a palm leaf */}
			<g transform="translate(380 1470)">
				<rect x={-150} y={-40} width={300} height={40} fill="#3a2414" />
				<rect x={-130} y={-10} width={20} height={10} fill="#2a1a10" />
				<g transform="translate(-140 -70) scale(0.3)">
					<Leaf seed={7} rows={4} reveal={clamp(ramp(t, 0, 3.4))} />
				</g>
			</g>
			<Diya t={t} x={790} y={1468} s={1.3} seed={9} />
		</Layer>
		<Layer depth={1.3}>
			<Dust t={t} seed={11} count={40} color="#ffcf8a" vx={10} vy={-18} size={2} opacity={0.5} area={[0, 900, 1080, 900]} />
		</Layer>
	</Scene>
);

export const EveryLine: React.FC<{t: number}> = ({t}) => {
	const N = 4;
	return (
		<Scene cam={{zoom: keys(t, [[-0.4, 1.08], [3.6, 1.2]]), y: keys(t, [[-0.4, -140], [3.6, 140]]), rot: -2}} bg="#120b06">
			<Layer depth={0.2}>
				<rect x={-500} y={-1500} width={2200} height={5000} fill="#1a1009" />
				<ellipse cx={540} cy={960} rx={800} ry={900} fill="#c98a3e" opacity={0.17} filter="url(#b70)" />
			</Layer>
			<Layer depth={1}>
				{Array.from({length: N}, (_, i) => {
					const y = 560 + i * 230;
					const lit = ramp(t, 0.15 + i * 0.62, 0.65 + i * 0.62);
					const fade = 1 - 0.55 * ramp(t, 0.9 + i * 0.62, 1.5 + i * 0.62);
					return (
						<g key={i} transform={`translate(70 ${y}) rotate(${i % 2 ? 1 : -1})`}>
							<g opacity={lit * fade}>
								<rect x={30} y={10} width={880} height={150} rx={60} fill="#ffd68a" opacity={0.55} filter="url(#b24)" />
							</g>
							<Leaf seed={40 + i} rows={4} reveal={clamp(ramp(t, -0.2 + i * 0.62, 0.6 + i * 0.62))} />
						</g>
					);
				})}
				<path d="M352,480 L352,1520 M728,480 L728,1520" stroke="#5a2e1c" strokeWidth={4} opacity={0.6} />
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={22} count={40} color="#f0c98a" vx={10} vy={-8} size={1.8} opacity={0.5} />
			</Layer>
		</Scene>
	);
};

export const Vision: React.FC<{t: number}> = ({t}) => {
	const tilt = ramp(t, 0.2, 2.7);
	const appear = ramp(t, 0.5, 2.2);
	return (
		<Scene cam={{zoom: keys(t, [[-0.3, 1.05], [3, 1.0]]), y: 520 - tilt * 720}} bg="#140e12">
			<Layer depth={0.1}>
				<Sky top="#120f1c" mid="#3a2630" bottom="#8a5038" glow="#e09050" glowY={1600} glowR={900} />
			</Layer>
			<Layer depth={0.5}>
				{/* the vision: Hanuman formed of smoke and lamp-light, high in the sky */}
				<g opacity={appear * 0.9}>
					<ellipse cx={540} cy={420} rx={420} ry={620} fill="#f2b468" opacity={0.18} filter="url(#b70)" />
					<g transform="translate(540 1020) scale(0.78)">
						<CharFX dark={0.55} rim="#ffd79a" rimA={1} rimDir={[0, -1]} rimW={10}>
							<Hanuman t={t} wind={0.9} rArm={12} rElbow={8} lArm={40} lElbow={-110} />
						</CharFX>
					</g>
				</g>
				<Clouds t={t} seed={31} y={1000} spread={200} count={10} size={260} dark="#2a1c22" light="#8a5a48" drift={10} opacity={0.75} />
			</Layer>
			<Layer depth={1}>
				<Smoke t={t + 3} x={760} y={1800} rise={1700} seed={5} color="#c0906a" count={14} size={40} spread={0.6} opacity={0.5} />
				<rect x={-800} y={1880} width={2700} height={900} fill="#1e1512" />
				<g transform="translate(470 1880) scale(0.95)">
					<CharFX dark={0.4} rim="#ffb468" rimDir={[0.9, -0.4]} rimW={8}>
						<Sage t={t} pray={ramp(t, 0.8, 2.0)} wind={0.3} />
					</CharFX>
				</g>
				<Diya t={t} x={760} y={1878} s={1.3} seed={9} />
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={13} count={45} color={C.paleGold} vx={6} vy={-30} size={2} opacity={0.5} />
			</Layer>
		</Scene>
	);
};
