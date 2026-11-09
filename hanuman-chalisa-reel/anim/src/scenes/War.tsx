// 41.18 - 43.36 "Ravan sent his warriors, including his son"  Ravan points from his fire-lit court; ranks of warriors rise.
// 43.36 - 46.24 "Akshay Kumar, whom Hanumanji killed."  Akshay's chariot charges; Hanuman meets it; flash; a wheel rolls away.
// 46.24 - 48.80 "And when the rakshasas set his tail on fire,"  Bound in ropes, torches close in, the tail ignites.
// 51.98 - 55.04 "The son of Vayudev had shaken Ravan's kingdom."  Ravan's golden throne cracks apart in the burning hall.
import React from 'react';
import {CharFX, Chariot, Horse, Throne, Warrior} from '../characters';
import {Hanuman, Ravan} from '../hanuman';
import {flash, keys, ramp, rng} from '../lib';
import {Clouds, Dust, DustBank, Fire, Layer, Ridge, Scene, Sky, Smoke} from '../world';
import {ArmyRow} from './Warrior';
import {LankaCity, Ropes, Torch} from './sets';

/** The fire-lit hall of Ravan: pillars, braziers, red drapes. */
const Hall: React.FC<{t: number; burn?: number}> = ({t, burn = 0}) => (
	<>
		<Layer depth={0.1}>
			<rect x={-900} y={-900} width={2900} height={3800} fill="#1a0a08" />
			<ellipse cx={540} cy={800} rx={700} ry={800} fill={burn ? '#e0642a' : '#a0381e'} opacity={0.25 + burn * 0.2} filter="url(#b70)" />
		</Layer>
		<Layer depth={0.4}>
			{[-200, 120, 960, 1280].map((x, i) => (
				<g key={x}>
					<rect x={x - 60} y={-200} width={120} height={2200} fill="#2a1410" />
					<rect x={x - 20} y={-200} width={40} height={2200} fill="#000" opacity={0.25} />
					{[300, 700, 1100].map((y) => (
						<rect key={y} x={x - 74} y={y} width={148} height={22} fill="#7a5a30" />
					))}
					<path d={`M${x + 60},${-200} C${x + 140},200 ${x + 160},500 ${x + 120 + Math.sin(t + i) * 10},900`} stroke="#5a1410" strokeWidth={60} fill="none" opacity={0.8} />
				</g>
			))}
		</Layer>
		<Layer depth={0.7}>
			{[200, 880].map((x, i) => (
				<g key={x}>
					<path d={`M${x - 50},1500 L${x + 50},1500 L${x + 24},1300 L${x - 24},1300 Z`} fill="#3a2414" />
					<path d={`M${x - 70},1300 L${x + 70},1300 L${x + 50},1260 L${x - 50},1260 Z`} fill="#7a5a30" />
					<Fire t={t + i} x={x} y={1262} s={0.9} seed={70 + i} glow={1} />
				</g>
			))}
		</Layer>
	</>
);

export const RavanCourt: React.FC<{t: number}> = ({t}) => {
	const point = ramp(t, 0.25, 1.0);
	const rise = (d: number) => ramp(t, 0.4 + d, 1.3 + d);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [2.2, 1.1]]), y: keys(t, [[0, -60], [2.2, 40]])}} bg="#1a0a08">
			<Hall t={t} />
			<Layer depth={0.85}>
				<rect x={-800} y={1300} width={2700} height={900} fill="#140806" />
				<g transform="translate(540 1270) scale(0.82)">
					<g transform="translate(0 -30) scale(1.05)">
						<Throne crack={0} fill="#2a1a0e" edge="#8a6430" />
					</g>
					<CharFX dark={0.4} rim="#ffa060" rimA={1} rimDir={[0.4, -1]} rimW={8}>
						<Ravan t={t} point={point} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.05}>
				<ArmyRow t={t} y={1560} n={34} scale={0.62} seed={500} tone="#140806" banners={4} rise={rise(0)} />
			</Layer>
			<Layer depth={1.3}>
				<ArmyRow t={t} y={1820} n={22} scale={0.95} seed={600} tone="#080302" rise={rise(0.2)} />
				<Dust t={t} seed={15} count={60} color="#ffb070" vx={20} vy={-50} size={2.2} opacity={0.6} />
			</Layer>
		</Scene>
	);
};

export const Akshay: React.FC<{t: number}> = ({t}) => {
	const hit = 2.0; // "killed"
	const cx = t * 120;
	const before = t < hit;
	const chX = before ? -320 + t * 420 : 0;
	const wheel = ramp(t, hit, hit + 0.9);
	const fl = flash(t, [hit], 6);
	const leap = ramp(t, hit - 0.5, hit, (x) => x * x);
	const armA = before ? 40 + leap * 120 : keys(t, [[hit, 160], [hit + 0.25, 40]]);
	return (
		<Scene cam={{x: cx, zoom: keys(t, [[0, 1.0], [hit, 1.1], [2.9, 1.04]])}} bg="#2a2420">
			<Layer depth={0}>
				<Sky top="#1a1418" mid="#5a3a2e" bottom="#c0844a" glow="#e8a050" glowY={1150} glowR={800} />
			</Layer>
			<Layer depth={0.15}>
				<Clouds t={t} seed={131} y={420} spread={300} count={12} size={300} dark="#2a2228" light="#9a6a52" drift={4} />
				<g transform="translate(0 220)">
					<LankaCity t={t} base={1100} s={0.7} lit={0.4} glow={0.6} tone="#3a2618" trim="#7a5a30" rock="#1a120c" />
				</g>
			</Layer>
			<Layer depth={0.5}>
				<Ridge seed={132} base={1380} amp={70} freq={0.004} fill="#3a2a20" fill2="#4a3626" />
				<g fill="#1e1612" style={{color: '#1e1612'}}>
					{Array.from({length: 26}, (_, i) => (
						<g key={i} transform={`translate(${-300 + i * 70} ${1390 + (i % 3) * 8}) scale(0.32)`}>
							<Warrior t={t} seed={i + 40} facing={1} shield={i % 2 === 0} />
						</g>
					))}
				</g>
			</Layer>
			<Layer depth={1}>
				<rect x={-800} y={1560} width={3200} height={800} fill="#2a2018" />
				{before && (
					<g transform={`translate(${chX + cx} 1640) scale(0.85)`}>
						<CharFX dark={0.6} rim="#ffc070" rimDir={[0.3, -1]} rimW={5}>
							<Chariot t={t} speed={2.2} fill="#24160e" trim="#8a6430">
								<g transform="translate(300 -30)">
									<Horse t={t} gallop={1.3} phase={0.3} fill="#22160e" />
								</g>
								<g transform="translate(380 -10)">
									<Horse t={t} gallop={1.3} phase={0.6} fill="#1a100a" />
								</g>
								{/* the prince: a crowned warrior silhouette */}
								<g transform="translate(-6 -120) scale(2.3)" fill="#160e0a" style={{color: '#160e0a'}}>
									<Warrior t={t} seed={77} shield={false} />
									<path d="M-16,-192 L-12,-214 L-4,-202 L0,-220 L4,-202 L12,-214 L16,-192 Z" fill="#8a6430" />
								</g>
							</Chariot>
						</CharFX>
					</g>
				)}
				{!before && (
					<g transform={`translate(${cx + 300 + wheel * 520} ${1562 - Math.abs(Math.sin(wheel * 9)) * 30 * (1 - wheel)}) rotate(${wheel * 540})`} opacity={1 - ramp(t, hit + 0.6, hit + 0.9)}>
						<circle r={70} stroke="#24160e" strokeWidth={12} fill="none" />
						{Array.from({length: 6}, (_, i) => (
							<line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 3) * 66} y2={Math.sin((i * Math.PI) / 3) * 66} stroke="#24160e" strokeWidth={6} />
						))}
					</g>
				)}
				<g transform={`translate(${cx + 820 - leap * 180} ${1680 - Math.sin(leap * Math.PI) * 260}) scale(0.72)`}>
					<CharFX dark={0.2 - fl * 0.1} rim="#ffd894" rimA={1} rimDir={[-0.6, -0.8]} rimW={9}>
						<Hanuman t={t} wind={1.2} windDir={1} rArm={armA} rElbow={-10} gadaAng={(armA - 160) * 0.6} gadaGlow={fl} lArm={40} lElbow={-40} brow={6} legSpread={0.8} tailUp={1} />
					</CharFX>
				</g>
				<g transform={`translate(${cx} 0)`}>
					<DustBank t={t} y={1640} color="#a48c66" opacity={0.6 + wheel * 0.3} seed={12} speed={-60} height={140} />
				</g>
			</Layer>
			<Layer depth={1.5}>
				<Dust t={t} seed={16} count={70} color="#e0c79a" vx={-200} vy={-20} size={2.6} opacity={0.6} area={[cx * 1.5 - 200, 900, 1500, 1000]} />
			</Layer>
		</Scene>
	);
};

export const TailFire: React.FC<{t: number}> = ({t}) => {
	const ign = ramp(t, 1.15, 2.2);
	const torch = ramp(t, 0, 1.2);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [2.6, 1.1]]), x: keys(t, [[0, -40], [2.6, 60]]), y: keys(t, [[0, 40], [2.6, -60]])}} bg="#140a08">
			<Layer depth={0.1}>
				<Sky top="#0e0808" mid="#3a1a14" bottom="#7a3a22" glow="#d06a30" glowX={800} glowY={900} glowR={700 + ign * 300} />
			</Layer>
			<Layer depth={0.4}>
				<g fill="#0a0504" style={{color: '#0a0504'}}>
					{Array.from({length: 9}, (_, i) => (
						<g key={i} transform={`translate(${-120 + i * 160} ${1500 + (i % 2) * 30}) scale(1.1)`}>
							<Warrior t={t} seed={90 + i} facing={i < 4 ? 1 : -1} shield={false} />
						</g>
					))}
				</g>
			</Layer>
			<Layer depth={1}>
				<rect x={-800} y={1900} width={2700} height={800} fill="#100806" />
				<ellipse cx={540} cy={1100} rx={420} ry={500} fill="#ffb060" opacity={0.12 + ign * 0.2} filter="url(#b70)" />
				<g transform="translate(470 1950) scale(1.0)">
					<CharFX dark={0.3 - ign * 0.12} rim={ign > 0.3 ? '#ffc070' : '#e0b090'} rimA={1} rimDir={[0.9, -0.4]} rimW={9}>
						<Hanuman t={t} gada="none" wind={0.4} rArm={6} rElbow={10} lArm={8} lElbow={-6} brow={4 - ign * 2} look={keys(t, [[0, 0], [1.1, 1], [2.4, 0.4]])} tailFire={ign} tailUp={0.6 + ign * 0.4} />
						<g transform="translate(0 -40)">
							<Ropes y0={-640} n={3} w={170} />
						</g>
					</CharFX>
				</g>
				{/* torch-bearers' arms reaching in */}
				{[0, 1].map((i) => (
					<g key={i} transform={`translate(${1180 - torch * (180 + i * 60)} ${900 + i * 260})`}>
						<path d={`M0,0 L${260},${60 + i * 30}`} stroke="#080404" strokeWidth={40} strokeLinecap="round" />
						<Torch t={t + i} x={-10} y={-40} s={1.2} seed={30 + i} />
					</g>
				))}
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={17} count={60} color="#ffb070" vx={20} vy={-80} size={2.4} opacity={0.4 + ign * 0.5} />
			</Layer>
		</Scene>
	);
};

export const Shaken: React.FC<{t: number}> = ({t}) => {
	const crack = ramp(t, 0.9, 2.2, (x) => 1 - Math.pow(1 - x, 3));
	const fl = flash(t, [1.0, 1.6], 7) * 0.6;
	const r = rng(4);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.12], [3.0, 0.98]]), y: keys(t, [[0, 60], [3.0, 0]])}} bg="#1a0a08">
			<Hall t={t} burn={1} />
			<Layer depth={0.85}>
				<rect x={-800} y={1400} width={2700} height={900} fill="#140806" />
				<g transform="translate(540 1420) scale(0.9)">
					<Throne crack={crack} fill="#3a2410" edge="#c49a4e" />
					{crack > 0.05 && (
						<g stroke="#ffd08a" strokeWidth={4} opacity={crack * 0.9} fill="none">
							<path d="M0,-1260 L-30,-900 L-10,-560 L-20,-470" />
							<path d="M-200,-860 L-30,-900 L200,-860" />
						</g>
					)}
				</g>
				<Smoke t={t * 2} x={540} y={1300} rise={1500} seed={7} color="#2a1610" count={14} size={70} spread={1.2} opacity={0.5} />
			</Layer>
			<Layer depth={1.1}>
				{/* falling debris */}
				{Array.from({length: 16}, (_, i) => {
					const x = 100 + r() * 880;
					const st = 0.9 + r() * 0.8;
					const y = 200 + Math.max(0, t - st) * Math.max(0, t - st) * 900 + r() * 200;
					return t > st ? <rect key={i} x={x} y={y} width={10 + r() * 22} height={8 + r() * 16} fill="#3a2410" transform={`rotate(${t * 200 * (r() - 0.5)} ${x} ${y})`} /> : null;
				})}
				<Fire t={t} x={60} y={1960} s={1.6} seed={81} glow={1} />
				<Fire t={t} x={1040} y={1980} s={1.5} seed={82} glow={1} />
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={18} count={80} color="#ffb060" vx={30} vy={-120} size={2.6} opacity={0.8} />
			</Layer>
			<rect x={-2000} y={-2000} width={6000} height={6000} fill="#ffd8a0" opacity={fl * 0.3} />
		</Scene>
	);
};
