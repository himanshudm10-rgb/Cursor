// 22.34 - 24.84 "we need to visit Ravan's Lanka."  The big reveal (split): golden Lanka across a storm-dark sea.
// 27.34 - 28.62 "Hanumanji crossed the ocean,"  Side-tracking leap across the sea.
// 28.62 - 30.32 "entered Lanka, and finally,"  On the city wall at night, looking up at the towers.
// 48.80 - 51.98 "Hanumanji escaped and burned much of Lanka."  The biggest hero shot: leaping over burning rooftops.
import React from 'react';
import {CharFX} from '../characters';
import {Hanuman} from '../hanuman';
import {W, clamp, flash, keys, ramp, rng} from '../lib';
import {Bolt, CloudCrawl, Clouds, Dust, Fire, Layer, Scene, Sky, Smoke} from '../world';
import {LankaCity, Sea} from './sets';

export const LankaReveal: React.FC<{t: number}> = ({t}) => {
	const lit = flash(t, [0.05, 1.3, 2.0], 8);
	return (
		<Scene cam={{zoom: keys(t, [[0, 0.98], [2.6, 1.18]], (x) => x * x * (3 - 2 * x)), y: keys(t, [[0, 80], [2.6, 0]])}} bg="#0a0e16">
			<Layer depth={0.06}>
				<Sky top="#0a0e18" mid="#26304a" bottom="#6a5a58" glow="#d8a060" glowY={1000} glowR={800} />
			</Layer>
			<Layer depth={0.15}>
				<Clouds t={t} seed={81} y={330} spread={420} count={13} size={360} dark="#141a28" light="#4a5468" drift={16} lit={lit} />
				<Bolt seed={82} x0={180} y0={-200} x1={120} y1={900} v={flash(t, [0.05], 8)} width={6} />
				<Bolt seed={83} x0={900} y0={-200} x1={980} y1={880} v={flash(t, [1.3], 9)} width={5} />
				<CloudCrawl seed={84} x={-100} y={360} len={1300} v={flash(t, [2.0], 5) * 0.8} ang={0.1} />
			</Layer>
			<Layer depth={0.35}>
				<LankaCity t={t} base={1080} s={1.0} lit={0.6} glow={1} tone="#6a4a26" trim="#c49a4e" rock="#16120f" />
			</Layer>
			<Layer depth={0.6}>
				<Sea t={t} y={1090} deep="#0a0e16" mid="#18202e" light="#e0b070" glowX={560} glow="#e6b06a" speed={1.2} />
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={85} count={50} color="#cfd6e0" vx={-60} vy={20} size={2} opacity={0.4} />
				<path d="M-900,2000 C-200,1700 300,1820 600,1900 C900,1980 1300,1760 2000,1900 L2000,2600 L-900,2600 Z" fill="#05070b" />
			</Layer>
		</Scene>
	);
};

/** Flying figure: the standing build rotated into flight, gada leading, tail streaming. */
const Flying: React.FC<{t: number; ang?: number; fire?: number}> = ({t, ang = 64, fire = 0}) => (
	<g transform={`rotate(${ang} 0 -480)`}>
		<Hanuman t={t} wind={1.6} windDir={-1} rArm={176} rElbow={-6} gadaAng={-10} lArm={30} lElbow={-10} head={-ang * 0.55} legSpread={0.2} tailFire={fire} tailUp={0.3} />
	</g>
);

export const OceanLeap: React.FC<{t: number}> = ({t}) => {
	const cx = t * 760;
	const bob = Math.sin(t * 2.4) * 18;
	return (
		<Scene cam={{x: cx, zoom: 1, y: 0}} bg="#1a2030">
			<Layer depth={0}>
				<Sky top="#1a2238" mid="#464c5c" bottom="#b88a58" glow="#f2c27e" glowX={760} glowY={1000} glowR={700} />
			</Layer>
			<Layer depth={0.1}>
				<Clouds t={t} seed={91} y={420} spread={300} count={16} size={300} dark="#2e3446" light="#94786a" drift={0} x0={-400} x1={2400} />
			</Layer>
			<Layer depth={0.35}>
				<Sea t={t} y={1180} deep="#1a2232" mid="#2a3446" light="#f0c890" glowX={760 + cx * 0.35} glow="#f6d090" speed={2} x0={-900} x1={W + 2400} />
			</Layer>
			<Layer depth={0.7}>
				<Clouds t={t} seed={92} y={1060} spread={160} count={14} size={200} dark="#4a4652" light="#a8907a" drift={0} opacity={0.75} x0={-200} x1={2400} />
			</Layer>
			<Layer depth={1}>
				<g transform={`translate(${540 + cx} ${820 + bob}) scale(0.62)`}>
					<ellipse cx={0} cy={-460} rx={420} ry={260} fill="#ffd894" opacity={0.18} filter="url(#b70)" />
					<CharFX dark={0.25} rim="#ffe0a8" rimA={1} rimDir={[0.4, -1]} rimW={8}>
						<Flying t={t} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.6}>
				<Dust t={t} seed={93} count={50} color="#ffffff" vx={-700} vy={0} size={2.6} opacity={0.5} area={[cx * 1.6 - 300, 0, 1700, 1920]} />
			</Layer>
		</Scene>
	);
};

export const EnterLanka: React.FC<{t: number}> = ({t}) => (
	<Scene cam={{zoom: keys(t, [[0, 1.0], [1.9, 1.12]]), y: keys(t, [[0, 60], [1.9, -40]])}} bg="#0a0c14">
		<Layer depth={0.05}>
			<Sky top="#070912" mid="#1a2234" bottom="#3a3a46" glow="#c8b490" glowX={760} glowY={420} glowR={420} />
			<circle cx={760} cy={420} r={70} fill="#efe2c0" opacity={0.85} filter="url(#b2)" />
		</Layer>
		<Layer depth={0.3}>
			<g transform="translate(0 260)">
				<LankaCity t={t} base={1150} s={1.45} lit={0.7} glow={0.7} tone="#4a3422" trim="#a88448" rock="#0c0a0a" />
			</g>
		</Layer>
		<Layer depth={1}>
			{/* the city wall he has climbed */}
			<rect x={-800} y={1440} width={2700} height={900} fill="#120e0c" />
			{Array.from({length: 26}, (_, i) => (
				<rect key={i} x={-800 + i * 110} y={1400} width={70} height={60} fill="#120e0c" />
			))}
			<path d="M-800,1440 L1900,1440" stroke="#8a6a3a" strokeWidth={4} opacity={0.6} />
			<g transform="translate(330 1404) scale(0.42)">
				<CharFX dark={0.55} rim="#e8dcc0" rimA={0.95} rimDir={[0.6, -0.8]} rimW={9}>
					<Hanuman t={t} back wind={0.5} rArm={10} lArm={14} lElbow={-10} />
				</CharFX>
			</g>
		</Layer>
		<Layer depth={1.3}>
			<Dust t={t} seed={95} count={40} color="#d8dce8" vx={20} vy={-6} size={1.8} opacity={0.4} />
		</Layer>
	</Scene>
);

export const BurningLanka: React.FC<{t: number}> = ({t}) => {
	// jump arc across the frame, left to right, then a second bound
	const p = ramp(t, 0, 3.1, (x) => x);
	const hx = 120 + p * 900;
	const hy = 1330 - Math.sin(Math.min(1, p * 1.25) * Math.PI) * 300 + (p > 0.8 ? (p - 0.8) * 500 : 0);
	const burn = keys(t, [[0, 0.55], [3.2, 1]]);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [3.2, 1.12]]), x: keys(t, [[0, -60], [3.2, 90]]), y: 40}} bg="#1a0c08">
			<Layer depth={0.05}>
				<Sky top="#120808" mid="#5a2214" bottom="#c0582a" glow="#f08a3a" glowY={1300} glowR={1000} />
			</Layer>
			<Layer depth={0.18}>
				<Smoke t={t * 2} x={300} y={1300} rise={1800} seed={11} color="#2a1610" count={18} size={70} spread={1.2} opacity={0.75} />
				<Smoke t={t * 2 + 3} x={820} y={1300} rise={1800} seed={12} color="#3a1e14" count={18} size={70} spread={1.2} opacity={0.7} />
			</Layer>
			<Layer depth={0.35}>
				<g transform="translate(0 200)">
					<LankaCity t={t} base={1150} s={1.3} burn={burn} lit={0.8} glow={1} tone="#3a2216" trim="#8a5a30" rock="#0e0806" />
				</g>
			</Layer>
			<Layer depth={0.7}>
				{/* near rooftops, burning */}
				{Array.from({length: 7}, (_, i) => {
					const x = -200 + i * 240;
					const y = 1350 + (i % 2) * 60;
					return (
						<g key={i}>
							<path d={`M${x - 140},${y} L${x},${y - 110} L${x + 140},${y} L${x + 120},${y + 700} L${x - 120},${y + 700} Z`} fill="#1a0e0a" />
							<path d={`M${x - 140},${y} L${x},${y - 110} L${x + 140},${y}`} stroke="#e0742c" strokeWidth={4} fill="none" opacity={0.7} />
							<Fire t={t + i} x={x + (i % 2 ? 40 : -50)} y={y - 40} s={0.9 + (i % 3) * 0.3} seed={20 + i} glow={0.9} />
						</g>
					);
				})}
			</Layer>
			<Layer depth={1}>
				<g transform={`translate(${hx} ${hy}) scale(0.62)`}>
					<ellipse cx={0} cy={-480} rx={380} ry={460} fill="#ffb060" opacity={0.25} filter="url(#b70)" />
					<CharFX dark={0.18} rim="#ffd08a" rimA={1} rimDir={[-0.3, -1]} rimW={9}>
						<g transform={`rotate(${keys(t, [[0, -18], [1.6, 10], [3.1, 24]])} 0 -480)`}>
							<Hanuman t={t} wind={1.4} windDir={-1} rArm={keys(t, [[0, 120], [1.2, 160], [3, 150]])} rElbow={-10} gadaAng={-20} lArm={70} lElbow={-40} legSpread={1} tailFire={1} tailUp={1} brow={4} gadaGlow={0.6} />
						</g>
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={97} count={90} color="#ffb060" vx={60} vy={-160} size={2.8} opacity={0.85} />
				<Fire t={t} x={-60} y={2000} s={2.2} seed={41} glow={1} />
				<Fire t={t} x={1150} y={2020} s={2.0} seed={42} glow={1} />
			</Layer>
			<rect x={-2000} y={-2000} width={6000} height={6000} fill="#ff8a3a" opacity={0.06 + 0.04 * clamp(Math.sin(t * 9))} style={{mixBlendMode: 'screen'}} />
		</Scene>
	);
};
