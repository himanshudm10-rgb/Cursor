// 24.25 - 28.20  "He is not a weak god. He is a warrior and a leader."
// 28.20 - 31.45  "In the sixth mandala, sage Bharadwaja prays to him..."
// 31.45 - 33.05  "...for the strength to win battles."  (match cut: raised hands -> fist on the weapon)
import React from 'react';
import {CharFX, Chariot, Horse, Indra, IndraFist, Sage, Warrior} from '../characters';
import {C, flash, keys, ramp, rng, smoothPath} from '../lib';
import {CloudCrawl, Clouds, Dust, DustBank, Fire, Layer, Ridge, Scene, Sky, Smoke} from '../world';

export const Banner: React.FC<{t: number; x: number; y: number; h: number; color: string; ph: number}> = ({t, x, y, h, color, ph}) => {
	const w = (k: number) => Math.sin(t * 4 + ph + k) * 8;
	return (
		<g>
			<line x1={x} y1={y} x2={x} y2={y - h} stroke="#120d09" strokeWidth={4} />
			<path d={smoothPath([[x, y - h], [x + 40, y - h + 6 + w(0)], [x + 80, y - h + 14 + w(1)], [x + 60, y - h + 34 + w(2)], [x, y - h + 40]], true)} fill={color} />
		</g>
	);
};

/** A row of an army built by graphic repetition (rise 0..1 lifts it into frame). */
export const ArmyRow: React.FC<{t: number; y: number; n: number; scale: number; seed: number; tone: string; banners?: number; chariots?: number; rise: number}> = ({t, y, n, scale, seed, tone, banners = 0, chariots = 0, rise}) => {
	const r = rng(seed);
	const items = Array.from({length: n}, (_, i) => ({x: -250 + (i / n) * 1600 + r() * 30, dy: r() * 30}));
	return (
		<g transform={`translate(0 ${(1 - rise) * 260})`} opacity={rise} fill={tone} style={{color: tone}}>
			{items.map((it, i) => (
				<g key={i} transform={`translate(${it.x} ${y + it.dy}) scale(${scale})`}>
					<Warrior t={t} seed={seed + i} shield={i % 3 !== 0} />
				</g>
			))}
			{Array.from({length: chariots}, (_, i) => {
				const cx = -100 + (i + 0.5) * (1300 / chariots);
				return (
					<g key={'c' + i} transform={`translate(${cx} ${y + 40}) scale(${scale * 1.4})`}>
						<Chariot t={t * 0.1} fill={tone} trim="#6a4a26">
							<g transform="translate(300 -40) scale(0.9)">
								<Horse t={t} gallop={0.08} phase={i} fill={tone} mane="#000" />
							</g>
						</Chariot>
					</g>
				);
			})}
			{Array.from({length: banners}, (_, i) => (
				<Banner key={'b' + i} t={t} x={-120 + (i + 0.5) * (1400 / banners)} y={y - 10} h={360 * scale} color={i % 3 === 0 ? C.red : i % 3 === 1 ? '#7a5a2a' : '#2a3a5a'} ph={i * 1.7} />
			))}
		</g>
	);
};

export const WarriorScene: React.FC<{t: number}> = ({t}) => {
	const expand = ramp(t, 1.62, 3.3, (x) => 1 - Math.pow(1 - x, 3));
	const zoom = t < 1.62 ? keys(t, [[0, 2.0], [1.62, 2.22]]) : 2.22 + (1.0 - 2.22) * expand;
	const camY = t < 1.62 ? 60 : 60 + (0 - 60) * expand;
	const rise = (d: number) => ramp(t, 1.7 + d, 2.6 + d);
	const lit = flash(t, [2.55], 6) * 0.7;
	return (
		<Scene cam={{zoom, y: camY}} bg="#1d2129">
			<Layer depth={0.1}>
				<Sky top="#141a24" mid="#4b4e58" bottom="#c79a62" glow="#f1c584" glowY={1300} glowR={700} />
			</Layer>
			<Layer depth={0.3}>
				<Clouds t={t} seed={91} y={420} spread={420} count={12} size={340} dark="#20242e" light="#6e6a6c" drift={10} lit={lit} />
				<CloudCrawl seed={92} x={900} y={300} len={800} v={lit} ang={Math.PI - 0.15} />
				<Ridge seed={93} base={1330} amp={120} freq={0.003} fill="#3a3a42" fill2="#7a6a5e" />
			</Layer>
			<Layer depth={0.45}>
				<ArmyRow t={t} y={1360} n={70} scale={0.32} seed={100} tone="#3a3330" banners={9} rise={rise(0)} />
				<DustBank t={t} y={1380} color="#b39a74" opacity={0.45 * rise(0)} seed={3} speed={12} height={80} />
			</Layer>
			<Layer depth={0.65}>
				<ArmyRow t={t} y={1460} n={48} scale={0.45} seed={200} tone="#2a2420" banners={6} chariots={4} rise={rise(0.15)} />
			</Layer>
			<Layer depth={0.85}>
				<ArmyRow t={t} y={1600} n={30} scale={0.62} seed={300} tone="#171310" banners={4} rise={rise(0.3)} />
				<DustBank t={t} y={1640} color="#9a8462" opacity={0.5 * rise(0.3)} seed={6} speed={18} height={110} />
			</Layer>
			<Layer depth={1}>
				<rect x={-800} y={1700} width={2700} height={1200} fill="#211a14" opacity={rise(0.2)} />
				<g transform="translate(540 1900) scale(1.15)">
					<CharFX dark={0.18} rim="#ffd79a" rimA={0.95} rimDir={[0.2, -1]} rimW={6}>
						<Indra t={t} wind={0.9} rArm={12} rElbow={8} vajraAng={78} lArm={24} lElbow={-58} look={keys(t, [[0, 0], [2.4, 0], [3.2, -0.3]])} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={41} count={70} color="#e8cf9e" vx={40} vy={-5} size={2.4} opacity={0.55} />
			</Layer>
		</Scene>
	);
};

export const Tree: React.FC<{x: number; y: number; s: number; tone: string}> = ({x, y, s, tone}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`} fill={tone}>
		<path d="M-14,0 L-10,-260 L10,-260 L14,0 Z" />
		<path d="M0,-200 L-60,-300 M0,-230 L50,-320" stroke={tone} strokeWidth={10} />
		<circle cx={-60} cy={-330} r={90} />
		<circle cx={40} cy={-360} r={110} />
		<circle cx={-10} cy={-440} r={100} />
		<circle cx={90} cy={-290} r={70} />
	</g>
);

export const Bharadwaja: React.FC<{t: number}> = ({t}) => {
	const pray = ramp(t, 1.25, 2.4);
	const push = ramp(t, 2.55, 3.3, (x) => x * x);
	const camX = keys(t, [[0, -170], [2.55, 90], [3.3, 140]]);
	const camY = keys(t, [[0, 40], [2.55, 60], [3.3, 110]]);
	return (
		<Scene cam={{x: camX, y: camY, zoom: 1.0 + push * 1.1 + t * 0.03}} bg="#1a1830">
			<Layer depth={0.1}>
				<Sky top="#0d1226" mid="#3a2f4e" bottom="#a4644a" glow="#e08a4a" glowX={300} glowY={1500} glowR={700} />
			</Layer>
			<Layer depth={0.4}>
				<Ridge seed={111} base={1400} amp={200} freq={0.003} fill="#231d30" fill2="#3a2a36" />
				<Tree x={60} y={1560} s={1.2} tone="#141020" />
				<Tree x={980} y={1520} s={1.0} tone="#141020" />
			</Layer>
			<Layer depth={0.7}>
				<Tree x={-60} y={1700} s={1.6} tone="#0d0a14" />
				<Tree x={1160} y={1720} s={1.5} tone="#0d0a14" />
			</Layer>
			<Layer depth={1}>
				<rect x={-600} y={1690} width={2300} height={800} fill="#1b130f" />
				<Smoke t={t} x={300} y={1680} rise={1500} seed={12} color="#7a6a6a" count={16} size={40} spread={0.6} opacity={0.45} />
				<rect x={250} y={1690} width={100} height={22} fill="#4a301a" />
				<Fire t={t} x={300} y={1694} s={0.75} seed={7} />
				<g transform="translate(560 1720) scale(1.0)">
					<CharFX dark={0.25} rim="#ffae5c" rimA={1} rimDir={[-1, -0.25]} rimW={8}>
						<Sage t={t} pray={pray} wind={0.4} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.6}>
				<g fill="#07060b">
					<path d="M-200,300 C0,200 120,380 60,620 C-40,520 -160,520 -200,300 Z" />
					<path d="M1150,1300 C980,1240 920,1460 990,1700 C1060,1600 1200,1560 1150,1300 Z" />
				</g>
				<Dust t={t} seed={51} count={40} color="#ffbf7a" vx={-10} vy={-24} size={2} opacity={0.6} area={[0, 900, 1080, 1000]} />
			</Layer>
		</Scene>
	);
};

export const Fist: React.FC<{t: number}> = ({t}) => {
	const energy = ramp(t, 0.45, 1.05) * 0.9;
	const lit = flash(t, [0.8, 1.25], 7);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.12], [1.7, 1.0]]), rot: keys(t, [[0, -3], [1.7, 2]])}} bg="#0b1220">
			<Layer depth={0.2}>
				<Sky top="#060a14" mid="#16233a" bottom="#2a3a55" />
				<Clouds t={t} seed={121} y={700} spread={800} count={12} size={300} dark="#0f1726" light="#34445e" drift={40} lit={lit} />
			</Layer>
			<Layer depth={1}>
				<g transform="translate(540 960) scale(1.05)">
					<CharFX dark={0.12} rim="#cfe0ff" rimA={0.8 + lit * 0.2} rimDir={[-0.6, -0.8]} rimW={8}>
						<IndraFist t={t} energy={energy} grip={ramp(t, 0.05, 0.4)} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={61} count={40} color="#cfe0ff" vx={60} vy={-20} size={2} opacity={0.4 + energy * 0.4} />
			</Layer>
		</Scene>
	);
};
