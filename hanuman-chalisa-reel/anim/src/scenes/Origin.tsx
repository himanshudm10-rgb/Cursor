// 14.54 - 16.40 "Mata Anjani and Vayudev,"  Anjani on the mountain at dawn, the wind god swirling round her.
// 16.40 - 19.16 "possessing strength beyond comparison."  Hanuman on the summit raises the gada; the sun breaks through.
// 19.16 - 22.34 "But to understand why he is called Shri Ram's messenger,"  Hanuman kneels before Shri Ram at sunset.
import React from 'react';
import {CharFX} from '../characters';
import {Anjani, Hanuman, Ram} from '../hanuman';
import {keys, ramp} from '../lib';
import {Clouds, Crag, Dust, Layer, Ridge, Scene, Sky} from '../world';
import {Grass} from './Protector';
import {Leaves} from './sets';

export const AnjaniVayu: React.FC<{t: number}> = ({t}) => (
	<Scene cam={{zoom: keys(t, [[-0.3, 1.0], [2.2, 1.12]]), rot: keys(t, [[-0.3, -1.5], [2.2, 1.5]]), y: 20}} bg="#2a2a3a">
		<Layer depth={0.05}>
			<Sky top="#20283e" mid="#56423e" bottom="#c09062" glow="#f2cf8e" glowY={1150} glowR={800} />
		</Layer>
		<Layer depth={0.2}>
			<Clouds t={t * 3} seed={41} y={500} spread={400} count={12} size={300} dark="#38343f" light="#a08470" drift={30} opacity={0.8} />
			<Ridge seed={42} base={1300} amp={300} freq={0.003} fill="#5a5060" fill2="#8a7270" />
		</Layer>
		<Layer depth={0.5}>
			<Ridge seed={43} base={1480} amp={220} freq={0.004} fill="#3a3040" fill2="#4a3a40" />
		</Layer>
		<Layer depth={1}>
			<Crag x={540} y={1300} w={460} h={160} fill="#2a2228" rim="#f4cf8e" seed={8} />
			<ellipse cx={540} cy={950} rx={260} ry={380} fill="#f6d08e" opacity={0.2} filter="url(#b70)" />
			<g transform="translate(540 1304) scale(0.62)">
				<CharFX dark={0.3} rim="#ffe0a8" rimA={0.95} rimDir={[0, -1]} rimW={8}>
					<Anjani t={t} pray={1} wind={1.2} />
				</CharFX>
			</g>
		</Layer>
		<Layer depth={1.4}>
			<Leaves t={t} seed={4} count={36} vx={420} vy={-60} color="#6a7446" color2="#d8a050" size={1.2} />
			<Dust t={t} seed={44} count={50} color="#ffe8c0" vx={200} vy={-20} size={2} opacity={0.5} />
		</Layer>
	</Scene>
);

export const Strength: React.FC<{t: number}> = ({t}) => {
	const raise = ramp(t, 0.35, 1.25);
	const sun = ramp(t, 0.9, 2.2);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [2.9, 1.1]]), y: keys(t, [[0, 260], [2.9, 0]])}} bg="#1e2232">
			<Layer depth={0.05}>
				<Sky top="#18213a" mid="#4c4250" bottom="#c0915e" glow="#e8bc7a" glowY={760} glowR={600 + sun * 500} />
				<circle cx={540} cy={760} r={110 + sun * 40} fill="#fbe2a8" opacity={0.3 + sun * 0.4} filter="url(#b14)" />
				<g opacity={0.18 * sun} filter="url(#b14)">
					{Array.from({length: 12}, (_, i) => {
						const a = (i / 12) * Math.PI * 2 + t * 0.05;
						return <path key={i} d={`M540,760 L${540 + Math.cos(a - 0.05) * 2200},${760 + Math.sin(a - 0.05) * 2200} L${540 + Math.cos(a + 0.05) * 2200},${760 + Math.sin(a + 0.05) * 2200} Z`} fill="#fff0c4" />;
					})}
				</g>
			</Layer>
			<Layer depth={0.2}>
				<Clouds t={t} seed={51} y={900} spread={500} count={14} size={340} dark="#2a2a3a" light="#9a806c" drift={-40 - sun * 60} opacity={0.8 - sun * 0.3} />
				<Ridge seed={52} base={1500} amp={260} freq={0.003} fill="#4a4258" fill2="#6a5a5e" />
			</Layer>
			<Layer depth={0.55}>
				<Clouds t={t} seed={53} y={1480} spread={160} count={10} size={240} dark="#5a5060" light="#a88c74" drift={30} opacity={0.7} />
			</Layer>
			<Layer depth={1}>
				<Crag x={540} y={1560} w={620} h={220} fill="#1c1820" rim="#ffd79a" seed={12} />
				<g transform="translate(540 1566) scale(0.95)">
					<CharFX dark={0.36} rim="#ffe2a8" rimA={1} rimDir={[0, -1]} rimW={9}>
						<Hanuman t={t} wind={1.1} rArm={12 + raise * 150} rElbow={10 + raise * 8} gadaAng={raise * 14} gadaGlow={sun} lArm={18 + raise * 20} lElbow={-20 - raise * 30} legSpread={0.6} brow={raise * 4} look={0} tailUp={raise} />
					</CharFX>
				</g>
				<Dust t={t} seed={55} count={60} color="#ffe2b0" vx={80} vy={-30} size={2.4} opacity={0.6} area={[-200, 700, 1480, 1200]} />
			</Layer>
			<Layer depth={1.5}>
				<Ridge seed={56} base={2150} amp={200} freq={0.006} fill="#0c0a0e" />
			</Layer>
		</Scene>
	);
};

export const RamDoot: React.FC<{t: number}> = ({t}) => (
	<Scene cam={{zoom: keys(t, [[-0.3, 1.0], [3.4, 1.14]]), x: keys(t, [[-0.3, 40], [3.4, -20]]), y: 30}} bg="#2a1e22">
		<Layer depth={0.05}>
			<Sky top="#22223a" mid="#a4583a" bottom="#f0b46a" glow="#ffd08a" glowX={640} glowY={1150} glowR={850} />
			<circle cx={640} cy={1160} r={150} fill="#ffe0a0" opacity={0.7} filter="url(#b8)" />
		</Layer>
		<Layer depth={0.2}>
			<Clouds t={t} seed={61} y={560} spread={300} count={10} size={280} dark="#4a2a32" light="#e09a6a" drift={8} opacity={0.75} />
			<Ridge seed={62} base={1300} amp={140} freq={0.004} fill="#4a2e30" fill2="#7a4a3a" />
		</Layer>
		<Layer depth={0.5}>
			<Ridge seed={63} base={1480} amp={120} freq={0.004} fill="#2a1a1e" fill2="#3a2224" />
		</Layer>
		<Layer depth={1}>
			<rect x={-800} y={1520} width={2700} height={900} fill="#1a1012" />
			<path d="M-800,1520 L1900,1520" stroke="#f0a060" strokeWidth={4} opacity={0.6} />
			{/* Hanuman kneels, facing Ram and us */}
			<g transform="translate(700 1530) scale(0.5)">
				<CharFX dark={0.3} rim="#ffd08a" rimA={0.95} rimDir={[0, -1]} rimW={9}>
					<Hanuman t={t} pose="kneel" anjali={1} gada="none" wind={0.6} head={6} />
				</CharFX>
			</g>
		</Layer>
		<Layer depth={1.25}>
			{/* Ram, from behind, backlit */}
			<g transform="translate(300 2020) scale(1.2)">
				<CharFX dark={0.72} rim="#ffd894" rimA={1} rimDir={[0.8, -0.6]} rimW={6}>
					<Ram t={t} wind={0.8} />
				</CharFX>
			</g>
			<Grass t={t} y={2040} seed={64} color="#0a0607" h={200} n={60} x0={-400} x1={1500} />
		</Layer>
		<Layer depth={1.4}>
			<Dust t={t} seed={65} count={50} color="#ffd8a0" vx={20} vy={-12} size={2.2} opacity={0.55} />
		</Layer>
	</Scene>
);
