// 0.00 - 4.82   chant: "Ram doot atulit bal dhama, Anjani putra Pavansut nama"
//   Frame 0 shows the hero: Hanuman kneeling in anjali on a crag above the sea at dawn, his gada beside him.
// 55.04 - end   "Yet, he called himself simply Bhagwan Shri Ram ka doot."
//   Bookend: the same crag at night, Lanka smouldering on the horizon; the camera pulls back until he is small.
import React from 'react';
import {CharFX} from '../characters';
import {Gada, Hanuman} from '../hanuman';
import {keys, ramp} from '../lib';
import {Clouds, Crag, Dust, Fire, Layer, Ridge, Scene, Sky} from '../world';
import {Grass} from './Protector';
import {LankaCity, Sea, mixColor} from './sets';

const DevotionPeak: React.FC<{t: number; night: number; cam: {x?: number; y?: number; zoom?: number; rot?: number}; anjali?: number; head?: number}> = ({t, night, cam, anjali = 1, head = 4}) => {
	const m = (a: string, b: string) => mixColor(a, b, night);
	return (
		<Scene cam={cam} bg={m('#2a2a3a', '#05070c')}>
			<Layer depth={0.05}>
				<Sky top={m('#2c3048', '#05070d')} mid={m('#7e4a36', '#141a28')} bottom={m('#c48a58', '#2a2626')} glow={m('#f4c27a', '#6a3a22')} glowX={night ? 820 : 540} glowY={1080} glowR={night ? 600 : 900} />
				{/* rising sun (dawn only) */}
				<circle cx={540} cy={1095} r={120} fill="#f6d48e" opacity={0.75 * (1 - night)} filter="url(#b8)" />
				<circle cx={540} cy={1095} r={260} fill="#f2b866" opacity={0.25 * (1 - night)} filter="url(#b40)" />
				{/* god rays */}
				<g opacity={0.12 * (1 - night)} filter="url(#b14)">
					{Array.from({length: 9}, (_, i) => {
						const a = -Math.PI / 2 + (i - 4) * 0.2 + Math.sin(t * 0.3 + i) * 0.02;
						return <path key={i} d={`M540,1095 L${540 + Math.cos(a - 0.04) * 2200},${1095 + Math.sin(a - 0.04) * 2200} L${540 + Math.cos(a + 0.04) * 2200},${1095 + Math.sin(a + 0.04) * 2200} Z`} fill="#ffe2a8" />;
					})}
				</g>
				{night > 0.5 && (
					<g>
						{Array.from({length: 70}, (_, i) => (
							<circle key={i} cx={(i * 397) % 1300 - 100} cy={(i * 211) % 900} r={i % 7 === 0 ? 2.2 : 1.2} fill="#e8e2d0" opacity={0.25 + 0.35 * Math.abs(Math.sin(t * 0.8 + i))} />
						))}
					</g>
				)}
			</Layer>
			<Layer depth={0.15}>
				<Clouds t={t} seed={7} y={620} spread={300} count={10} size={300} dark={m('#5a3a3a', '#0b0f18')} light={m('#e2a070', '#1e2636')} drift={8} opacity={0.75} />
			</Layer>
			<Layer depth={0.22}>
				{/* Lanka far away on the horizon (smouldering at night) */}
				<g transform="translate(820 1120) scale(0.17) translate(-540 -1120)" opacity={0.85}>
					<LankaCity t={t} base={1120} burn={night * 0.35} lit={0.2 + night * 0.4} tone={m('#4a3426', '#140e0c')} trim={m('#7a5a36', '#3a2a1c')} rock={m('#3a2a26', '#0a0808')} glow={night} />
				</g>
				<Sea t={t} y={1120} deep={m('#5a3a34', '#070a10')} mid={m('#8a5a44', '#0e1420')} light={m('#f2c890', '#6a4a36')} glowX={night ? 820 : 540} glow={m('#f6d090', '#c0602a')} speed={0.6} />
			</Layer>
			<Layer depth={0.45}>
				<Ridge seed={14} base={1330} amp={150} freq={0.004} fill={m('#3a2a2c', '#070809')} fill2={m('#5a3c34', '#0d0e12')} />
			</Layer>
			<Layer depth={1}>
				<Crag x={540} y={1240} w={520} h={170} fill={m('#22181a', '#040506')} rim={m('#f4c27a', '#8a5a3a')} seed={5} />
				{/* the gada rests against the rock beside him */}
				<g transform="translate(800 1238) rotate(18) scale(0.36)">
					<CharFX dark={0.25 + night * 0.6} rim={night ? '#d8925a' : '#ffd79a'} rimDir={[-0.6, -0.8]} rimW={8}>
						<Gada len={560} glow={0.4 * (1 - night)} />
					</CharFX>
				</g>
				{/* soft glow behind the hero so he never blends into the rock */}
				<ellipse cx={540} cy={900} rx={300} ry={360} fill={night ? '#a8603a' : '#f6cf88'} opacity={night ? 0.12 : 0.22} filter="url(#b70)" />
				<g transform="translate(540 1244) scale(0.74)">
					<CharFX dark={0.28 + night * 0.58} rim={night ? '#f0a060' : '#ffd79a'} rimA={0.95} rimDir={night ? [0.9, -0.3] : [0, -1]} rimW={8}>
						<Hanuman t={t} pose="kneel" anjali={anjali} gada="none" wind={0.55} head={head} look={0} />
					</CharFX>
				</g>
				<Dust t={t} seed={3} count={40} color={night ? '#d08a5a' : '#ffe2b0'} vx={14} vy={-16} size={2} opacity={0.55} area={[0, 500, 1080, 900]} />
			</Layer>
			<Layer depth={1.35}>
				<Grass t={t} y={1990} seed={9} color={m('#120c0a', '#020203')} h={260} n={70} x0={-500} x1={1600} />
				{night > 0.5 && <Fire t={t} x={-120} y={2050} s={0.4} seed={9} glow={0.4} />}
			</Layer>
		</Scene>
	);
};

export const Devotion: React.FC<{t: number}> = ({t}) => (
	<DevotionPeak t={t} night={0} cam={{zoom: keys(t, [[0, 1.06], [5.2, 1.22]]), y: keys(t, [[0, 60], [5.2, -20]])}} head={keys(t, [[0, 6], [4.8, 2]])} />
);

/** Bookend: same crag at night; start close on him, pull back until he is small. */
export const Bookend: React.FC<{t: number}> = ({t}) => {
	const pull = ramp(t, 0.2, 4.5, (x) => 1 - Math.pow(1 - x, 2));
	return <DevotionPeak t={t + 30} night={1} cam={{zoom: 1.75 - pull * 0.92, y: -260 + pull * 260, x: 0}} head={keys(t, [[0, 2], [3, 8]])} />;
};
