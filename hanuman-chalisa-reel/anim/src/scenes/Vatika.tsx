// 24.84 - 27.34 "When Maa Sita was held captive,"  Sita under the Ashoka tree, rakshasi guards in the dark.
// 30.32 - 31.84 "found her in Ashok Vatika."  Tilt down from Hanuman hidden in the branches to Sita.
// 31.84 - 35.36 "He introduced himself as Shri Ram ka doot"  He kneels before her; she lifts her head.
// 35.36 - 37.32 "and gave her Shri Ram's ring."  Close-up: the ring passes from his hand to hers.
// 37.32 - 39.18 "But before returning, Hanumanji"  He rises, low angle.
// 39.18 - 41.18 "destroyed Ashok Vatika."  The grove falls; leaves storm.
import React from 'react';
import {CharFX, Warrior} from '../characters';
import {Hanuman, RingHands, Sita} from '../hanuman';
import {flash, keys, ramp} from '../lib';
import {Dust, DustBank, Layer, Scene, Sky} from '../world';
import {AshokaTree, Leaves} from './sets';

/** The moonlit grove backdrop shared by the Vatika shots. */
const Grove: React.FC<{t: number; warm?: number; fall?: number}> = ({t, warm = 0, fall = 0}) => (
	<>
		<Layer depth={0.05}>
			<Sky top="#0a0d16" mid={warm ? '#3a2a2a' : '#1e2836'} bottom={warm ? '#7a5038' : '#4a5058'} glow={warm ? '#e0a060' : '#c8c4b0'} glowX={760} glowY={360} glowR={600} />
			<circle cx={760} cy={360} r={74} fill="#efe6c8" opacity={0.85} filter="url(#b2)" />
		</Layer>
		<Layer depth={0.25}>
			{[-100, 200, 520, 860, 1180].map((x, i) => (
				<AshokaTree key={x} x={x} y={1260} s={0.7} seed={10 + i} t={t} tone="#141418" leaf="#1a2018" leafLight="#2e3a2a" flower="#6a3020" fall={fall * (i % 2 ? 1 : 0.6) * ramp(fall, i * 0.08, 1)} dir={i % 2 ? 1 : -1} />
			))}
			<rect x={-800} y={1250} width={2700} height={1000} fill="#121410" />
		</Layer>
	</>
);

export const Captive: React.FC<{t: number}> = ({t}) => (
	<Scene cam={{zoom: keys(t, [[-0.4, 1.0], [2.6, 1.14]]), y: 40}} bg="#0a0d16">
		<Grove t={t} />
		<Layer depth={0.6}>
			{[-80, 120, 900, 1120].map((x, i) => (
				<g key={x} transform={`translate(${x} 1420) scale(${1.5 + (i % 2) * 0.2})`} fill="#07080b" style={{color: '#07080b'}}>
					<Warrior t={t} seed={30 + i} facing={x < 540 ? 1 : -1} shield={i % 2 === 0} />
				</g>
			))}
		</Layer>
		<Layer depth={1}>
			<rect x={-800} y={1380} width={2700} height={900} fill="#0e100c" />
			<AshokaTree x={640} y={1390} s={1.25} seed={3} t={t} tone="#1e1612" leaf="#24301e" leafLight="#4a5a36" flower="#a04a24" />
			<ellipse cx={500} cy={1120} rx={300} ry={260} fill="#f2e2b8" opacity={0.16} filter="url(#b70)" />
			<g transform="translate(500 1385) scale(0.8)">
				<CharFX dark={0.35} rim="#e8e0c8" rimA={0.9} rimDir={[0.6, -0.8]} rimW={8}>
					<Sita t={t} bow={0.8} />
				</CharFX>
			</g>
		</Layer>
		<Layer depth={1.4}>
			<Leaves t={t} seed={5} count={18} vx={30} vy={90} color="#3a4a2e" color2="#a04a24" size={1.1} opacity={0.8} />
			<Dust t={t} seed={6} count={40} color="#e0e2e8" vx={8} vy={-6} size={1.8} opacity={0.4} />
		</Layer>
	</Scene>
);

export const FoundHer: React.FC<{t: number}> = ({t}) => {
	const tilt = ramp(t, 0.1, 1.5);
	return (
		<Scene cam={{zoom: 1.25, y: -420 + tilt * 520}} bg="#0a0d16">
			<Grove t={t} />
			<Layer depth={1}>
				<AshokaTree x={620} y={1500} s={1.6} seed={3} t={t} tone="#1e1612" leaf="#24301e" leafLight="#4a5a36" flower="#a04a24" />
				{/* hidden among the leaves */}
				<g transform="translate(700 840) scale(0.3)">
					<CharFX dark={0.45} rim="#f2e2b8" rimDir={[0.4, -1]} rimW={10}>
						<Hanuman t={t} pose="kneel" gada="none" rArm={20} lArm={30} lElbow={-90} head={14} look={-1} wind={0.3} />
					</CharFX>
				</g>
				<path d="M560,820 C620,790 700,800 780,840 C700,860 620,860 560,820 Z" fill="#24301e" />
				<g transform="translate(470 1500) scale(0.75)">
					<CharFX dark={0.35} rim="#e8e0c8" rimA={0.9} rimDir={[0.6, -0.8]} rimW={8}>
						<Sita t={t} bow={0.8} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.4}>
				<Leaves t={t} seed={7} count={22} vx={20} vy={110} color="#3a4a2e" color2="#a04a24" size={1.2} />
			</Layer>
		</Scene>
	);
};

export const DootIntro: React.FC<{t: number}> = ({t}) => {
	const lift = ramp(t, 0.9, 2.4);
	return (
		<Scene cam={{zoom: keys(t, [[-0.3, 1.0], [3.6, 1.15]]), x: keys(t, [[-0.3, -30], [3.6, 30]]), y: 60}} bg="#0e0e14">
			<Grove t={t} warm={1} />
			<Layer depth={1}>
				<rect x={-800} y={1370} width={2700} height={900} fill="#14120e" />
				<AshokaTree x={760} y={1380} s={1.25} seed={3} t={t} tone="#1e1612" leaf="#2a3420" leafLight="#5a6a3a" flower="#b05428" />
				<ellipse cx={540} cy={1060} rx={480} ry={340} fill="#f6d090" opacity={0.2 + lift * 0.08} filter="url(#b70)" />
				<g transform="translate(320 1376) scale(0.6)">
					<CharFX dark={0.28} rim="#ffe0a8" rimA={0.95} rimDir={[0.8, -0.6]} rimW={9}>
						<Hanuman t={t} pose="kneel" anjali={1} gada="none" wind={0.3} head={-3} />
					</CharFX>
				</g>
				<g transform="translate(770 1376) scale(0.74)">
					<CharFX dark={0.3} rim="#ffe0a8" rimA={0.9} rimDir={[-0.8, -0.6]} rimW={8}>
						<Sita t={t} bow={0.8 - lift * 0.65} look={-1} glow={lift * 0.6} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.4}>
				<Leaves t={t} seed={8} count={16} vx={20} vy={70} color="#4a5a36" color2="#d0703a" size={1.1} opacity={0.8} />
				<Dust t={t} seed={9} count={45} color="#ffe2b0" vx={10} vy={-14} size={2} opacity={0.5} />
			</Layer>
		</Scene>
	);
};

export const RingClose: React.FC<{t: number}> = ({t}) => {
	const give = ramp(t, 0.05, 1.3);
	const glow = ramp(t, 0.6, 1.4);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [2, 1.12]]), rot: keys(t, [[0, -2], [2, 1]])}} bg="#120c0a">
			<Layer depth={0.2}>
				<rect x={-800} y={-800} width={2700} height={3500} fill="#160e0c" />
				<ellipse cx={560} cy={880} rx={600} ry={500} fill="#d89a50" opacity={0.25} filter="url(#b70)" />
				<g opacity={0.35}>
					<AshokaTree x={900} y={2200} s={2.4} seed={3} t={t} tone="#0e0a08" leaf="#1a2014" leafLight="#2a3420" flower="#5a2a18" />
				</g>
			</Layer>
			<Layer depth={1}>
				<g transform="translate(540 860) scale(1.6)">
					<CharFX dark={0.12} rim="#ffd894" rimA={0.8} rimDir={[0, -1]} rimW={5}>
						<RingHands t={t} give={give} glow={glow} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={10} count={50} color="#ffe2a8" vx={6} vy={-20} size={2} opacity={0.4 + glow * 0.3} />
			</Layer>
		</Scene>
	);
};

export const Rise: React.FC<{t: number}> = ({t}) => {
	const up = ramp(t, 0, 0.9);
	return (
		<Scene cam={{zoom: keys(t, [[-0.2, 1.05], [1.9, 1.15]]), y: keys(t, [[-0.2, 120], [1.9, 0]])}} bg="#0e0e14">
			<Grove t={t} warm={1} />
			<Layer depth={1}>
				<AshokaTree x={150} y={1700} s={1.4} seed={4} t={t} tone="#1e1612" leaf="#2a3420" leafLight="#5a6a3a" flower="#b05428" />
				<AshokaTree x={1000} y={1720} s={1.3} seed={6} t={t} tone="#1e1612" leaf="#2a3420" leafLight="#5a6a3a" flower="#b05428" />
				<rect x={-800} y={1700} width={2700} height={800} fill="#14120e" />
				<g transform={`translate(560 ${1730 + (1 - up) * 140}) scale(1.0)`}>
					<CharFX dark={0.25} rim="#ffd894" rimA={1} rimDir={[0.4, -1]} rimW={10}>
						<Hanuman t={t} wind={0.8} rArm={20} rElbow={-40} gadaAng={30} gadaGlow={up * 0.7} lArm={30} lElbow={-30} brow={up * 6} look={keys(t, [[0, 0], [1.2, 0.8]])} head={-4} tailUp={up} legSpread={0.5} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.4}>
				<Leaves t={t} seed={11} count={26} vx={60} vy={90} color="#4a5a36" color2="#d0703a" size={1.2} />
				<Dust t={t} seed={12} count={40} color="#ffe2b0" vx={10} vy={-14} size={2} opacity={0.45} />
			</Layer>
		</Scene>
	);
};

export const DestroyVatika: React.FC<{t: number}> = ({t}) => {
	const swing = keys(t, [[0, 165], [0.45, 165], [0.75, 40], [1.3, 150], [1.6, 60]]);
	const fall = ramp(t, 0.6, 1.9);
	const fl = flash(t, [0.75, 1.6], 7);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [2, 1.12]]), rot: keys(t, [[0, -2], [2, 2]]), y: 20}} bg="#0e0e14">
			<Grove t={t} warm={1} fall={fall} />
			<Layer depth={0.7}>
				{[-60, 1140].map((x, i) => (
					<AshokaTree key={x} x={x} y={1560} s={1.1} seed={20 + i} t={t} tone="#1a1410" leaf="#24301e" leafLight="#4a5a36" flower="#a04a24" fall={ramp(t, 0.75 + i * 0.3, 1.8 + i * 0.3)} dir={i ? 1 : -1} />
				))}
				<g transform="translate(0 0)">
					<DustBank t={t} y={1560} color="#7a6448" opacity={0.6 * fall} seed={3} speed={50} height={140} />
				</g>
			</Layer>
			<Layer depth={1}>
				<rect x={-800} y={1640} width={2700} height={800} fill="#14120e" />
				<g transform="translate(540 1660) scale(0.82)">
					<CharFX dark={0.22 - fl * 0.1} rim="#ffd894" rimA={1} rimDir={[0.2, -1]} rimW={9}>
						<Hanuman t={t} wind={1.3} rArm={swing} rElbow={-10} gadaAng={(swing - 165) * 0.6} gadaGlow={0.5} lArm={50} lElbow={-40} brow={6} legSpread={1} tailUp={1} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.4}>
				<Leaves t={t} seed={13} count={70} vx={260} vy={60} color="#4a5a36" color2="#d0703a" size={1.4} />
				<Dust t={t} seed={14} count={60} color="#d8c0a0" vx={140} vy={-30} size={2.4} opacity={0.6} />
			</Layer>
		</Scene>
	);
};
