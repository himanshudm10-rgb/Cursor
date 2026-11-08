// "Drona and Karna" - every shot of the film. t = seconds since the shot's start.
import React from 'react';
import {CharFX, Sage} from '../characters';
import {Arjuna, Arrow, Drona, DronaFace, Karna, KarnaFace, Parashurama, Student, Target} from '../cast';
import {C, clamp, flash, keys, ramp, rng, smoothPath} from '../lib';
import {Bolt, CloudCrawl, Clouds, Crag, Dust, DustBank, Fire, Layer, Ridge, Scene, Sky, Smoke} from '../world';
import {Hut} from './Vedic';
import {ArmyRow, Tree} from './Warrior';
import {Grass} from './Protector';
import {Leaf} from './Manuscript';

const Fig: React.FC<{x: number; y: number; s: number; dark?: number; rim?: string; rimDir?: [number, number]; rimW?: number; rimA?: number; children: React.ReactNode; opacity?: number}> = ({
	x,
	y,
	s,
	dark = 0.3,
	rim = '#ffd79a',
	rimDir = [-0.8, -0.5],
	rimW = 8,
	rimA = 0.9,
	children,
	opacity,
}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
		<CharFX dark={dark} rim={rim} rimDir={rimDir} rimW={rimW} rimA={rimA}>
			{children}
		</CharFX>
	</g>
);

/** Carved wooden ashram gateway (torana). */
const Torana: React.FC<{x: number; y: number; s: number; tone?: string}> = ({x, y, s, tone = '#2a1a10'}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`} fill={tone}>
		<rect x={-330} y={-900} width={44} height={900} />
		<rect x={286} y={-900} width={44} height={900} />
		<path d="M-400,-900 C-200,-960 200,-960 400,-900 L400,-860 C200,-916 -200,-916 -400,-860 Z" />
		<path d="M-360,-800 L360,-800 L360,-776 L-360,-776 Z" />
		{[-200, -100, 0, 100, 200].map((k) => (
			<rect key={k} x={k - 8} y={-860} width={16} height={60} />
		))}
		<path d="M-420,-900 L-470,-940 L-400,-920 Z M420,-900 L470,-940 L400,-920 Z" />
	</g>
);

/** Small oil lamp (diya). */
const Diya: React.FC<{t: number; x: number; y: number; s?: number; seed?: number}> = ({t, x, y, s = 1, seed = 1}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<ellipse cx={0} cy={-40} rx={160} ry={140} fill="#f0a24a" opacity={0.18 + 0.04 * Math.sin(t * 13 + seed)} filter="url(#b40)" />
		<path d="M-50,-10 C-40,14 40,14 50,-10 Z" fill="#7a4a24" stroke="#3a2010" strokeWidth={3} />
		<g transform="translate(0 -8) scale(0.28)">
			<Fire t={t} x={0} y={0} seed={seed} glow={0.5} />
		</g>
	</g>
);

// ============================================================ 1. the myth: 0.00 - 5.05
// "Dronacharya was so evil that he refused to teach Karna because he was a Sutaputra."
export const Myth: React.FC<{t: number}> = ({t}) => {
	const zoom = keys(t, [[0, 1.0], [5.2, 1.16]]);
	const bow = ramp(t, 3.7, 4.5);
	const palm = ramp(t, 1.6, 2.3);
	return (
		<Scene cam={{zoom, y: keys(t, [[0, 40], [5.2, -20]]), x: keys(t, [[0, -20], [5.2, 30]])}} bg="#1a0c0a">
			<Layer depth={0.08}>
				<Sky top="#120a0c" mid="#4a1c16" bottom="#a4482a" glow="#d0703a" glowX={640} glowY={1100} glowR={760} />
			</Layer>
			<Layer depth={0.2}>
				<Clouds t={t} seed={201} y={420} spread={340} count={12} size={300} dark="#2a1210" light="#6a2e20" drift={10} />
			</Layer>
			<Layer depth={0.45}>
				<Ridge seed={202} base={1330} amp={180} freq={0.003} fill="#2a1410" fill2="#4a2218" />
				<Tree x={90} y={1380} s={1.1} tone="#1a0c0a" />
				<Tree x={1010} y={1400} s={0.9} tone="#1a0c0a" />
			</Layer>
			<Layer depth={0.75}>
				<Torana x={640} y={1500} s={1.15} tone="#160a08" />
				<rect x={-600} y={1490} width={2300} height={900} fill="#1c0e0a" />
			</Layer>
			<Layer depth={1}>
				{/* Drona looms: the popular villain image - backlit, faceless red silhouette */}
				<ellipse cx={660} cy={1100} rx={360} ry={560} fill="#e07a3a" opacity={0.16} filter="url(#b70)" />
				<Fig x={660} y={1560} s={1.02} dark={0.82} rim="#ff9a5a" rimDir={[0.7, -0.6]} rimW={10}>
					<Drona t={t} stern={1} wind={0.6} windDir={-1} lArm={40 * palm + 22 * (1 - palm)} lElbow={115 * palm - 40 * (1 - palm)} lHand={palm > 0.5 ? 'palm' : 'fist'} head={-3} />
				</Fig>
				<Smoke t={t} x={300} y={1600} rise={900} seed={203} color="#4a2a22" count={12} size={60} opacity={0.4} />
			</Layer>
			<Layer depth={1.25}>
				{/* young Karna kneels before him, seen from behind */}
				<Fig x={250} y={2080} s={0.92} dark={0.88} rim="#ff9a5a" rimDir={[0.8, -0.5]} rimW={10}>
					<Karna t={t} back kneel={1} head={-8 - bow * 12} wind={0.6} rArm={18} rElbow={-30} lArm={18} lElbow={-30} />
				</Fig>
			</Layer>
			<Layer depth={1.5}>
				<Dust t={t} seed={204} count={50} color="#e0a070" vx={14} vy={-12} size={2.2} opacity={0.5} />
				<Grass t={t} y={2000} seed={205} color="#0c0606" h={170} n={70} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 2. the record: 5.05 - 6.95
// "But that is not the whole story."
export const Record: React.FC<{t: number}> = ({t}) => {
	const turn = ramp(t, 0.5, 1.3);
	return (
		<Scene cam={{zoom: keys(t, [[-0.5, 1.12], [2.4, 1.28]]), rot: keys(t, [[-0.5, -2], [2.4, 1]]), y: keys(t, [[-0.5, 30], [2.4, -10]])}} bg="#120b06">
			<Layer depth={0.05}>
				<Sky top="#0a0605" mid="#20140c" bottom="#3a2414" glow="#c27a3a" glowX={540} glowY={980} glowR={700} />
			</Layer>
			<Layer depth={0.6}>
				{/* wooden reading stand */}
				<path d="M120,1180 L960,1060 L1000,1380 L80,1500 Z" fill="#3a2414" />
				<path d="M120,1180 L960,1060" stroke="#6a4626" strokeWidth={6} />
				<path d="M80,1500 L1000,1380 L1000,1420 L80,1540 Z" fill="#24160c" />
			</Layer>
			<Layer depth={1}>
				{[0, 1, 2].map((i) => (
					<g key={i} transform={`translate(${70 + i * 8} ${1000 + i * 70}) rotate(-6)`}>
						<Leaf seed={30 + i} w={920} h={150} rows={3} />
					</g>
				))}
				{/* the top leaf lifts and turns: there is more to read */}
				<g transform={`translate(${74} ${930 - turn * 110}) rotate(${-6 - turn * 9}) scale(1 ${1 - turn * 0.25})`} opacity={1 - turn * 0.25}>
					<Leaf seed={41} w={920} h={150} rows={3} />
				</g>
				<Diya t={t} x={880} y={1560} s={1.3} seed={4} />
				<Smoke t={t} x={880} y={1500} rise={1200} seed={42} color="#6a5a4a" count={10} size={30} spread={0.4} opacity={0.4} />
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={43} count={60} color="#ffcf8a" vx={8} vy={-14} size={2} opacity={0.55} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 3. reveal: 6.95 - 10.10
// "In reality, Drona never refused to teach Karna."
export const Accepts: React.FC<{t: number}> = ({t}) => {
	const bless = ramp(t, 1.2, 2.0);
	const zoom = keys(t, [[0, 1.0], [3.3, 1.12]]);
	return (
		<Scene cam={{zoom, x: keys(t, [[0, 30], [3.3, -20]]), y: keys(t, [[0, -30], [3.3, 20]])}} bg="#2a2018">
			<Layer depth={0.06}>
				<Sky top="#3a3a4a" mid="#a4805a" bottom="#f0c88a" glow="#ffe0a0" glowX={600} glowY={1150} glowR={720} />
				<circle cx={600} cy={1120} r={90} fill="#fff0c8" opacity={0.8} filter="url(#b14)" />
			</Layer>
			<Layer depth={0.2}>
				{Array.from({length: 7}, (_, i) => (
					<path key={i} d={`M600,1120 L${-200 + i * 260},${-200} L${-120 + i * 260},${-200} Z`} fill="#fff2d0" opacity={0.05 + 0.02 * Math.sin(t + i)} filter="url(#b24)" />
				))}
				<Clouds t={t} seed={301} y={700} spread={300} count={10} size={260} dark="#8a6a56" light="#e6c296" drift={8} opacity={0.6} />
			</Layer>
			<Layer depth={0.45}>
				<Ridge seed={302} base={1360} amp={160} freq={0.003} fill="#6a5a4a" fill2="#8a7058" />
				<Hut x={180} y={1390} s={0.8} tone="#5a4430" />
				<Hut x={930} y={1400} s={0.7} tone="#5a4430" />
				<Tree x={60} y={1420} s={1.1} tone="#3a3424" />
				<Tree x={1040} y={1430} s={1.2} tone="#3a3424" />
			</Layer>
			<Layer depth={0.8}>
				<rect x={-600} y={1450} width={2300} height={900} fill="#6a5236" />
				<Grass t={t} y={1470} seed={303} color="#5a5230" h={60} n={90} />
			</Layer>
			<Layer depth={1}>
				<ellipse cx={540} cy={1660} rx={520} ry={60} fill="#000" opacity={0.25} filter="url(#b24)" />
				{/* Drona blesses his pupil */}
				<Fig x={700} y={1680} s={1.0} dark={0.22} rim="#ffe0a0" rimDir={[-0.7, -0.6]}>
					<Drona t={t} wind={0.4} look={-1} head={-4} lArm={22 + bless * 40} lElbow={-40 + bless * 110} lHand={bless > 0.4 ? 'palm' : 'fist'} />
				</Fig>
				<Fig x={330} y={1700} s={0.84} dark={0.25} rim="#ffe0a0" rimDir={[0.7, -0.6]}>
					<Karna t={t} wind={0.4} head={6 * bless} look={1} rArm={28} rElbow={-140} lArm={28} lElbow={-140} />
				</Fig>
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={304} count={70} color="#fff0c8" vx={12} vy={-8} size={2.2} opacity={0.6} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 4. the school: 10.10 - 12.62
// "Karna was actually Drona's student."
export const School: React.FC<{t: number}> = ({t}) => {
	const camX = keys(t, [[0, 90], [2.6, -60]]);
	const fly = ramp(t, 1.35, 1.75, (x) => x);
	return (
		<Scene cam={{x: camX, zoom: keys(t, [[0, 1.0], [2.6, 1.06]])}} bg="#5a4a3a">
			<Layer depth={0.06}>
				<Sky top="#5a6a80" mid="#c8a47a" bottom="#f0d4a0" glow="#ffe8b0" glowX={300} glowY={900} glowR={800} />
			</Layer>
			<Layer depth={0.25}>
				<Ridge seed={401} base={1060} amp={200} freq={0.003} fill="#8a8274" fill2="#a49478" />
				<Clouds t={t} seed={402} y={520} spread={200} count={8} size={220} dark="#b49a80" light="#f0dcb8" drift={10} opacity={0.6} />
			</Layer>
			<Layer depth={0.5}>
				<rect x={-800} y={1100} width={2800} height={1200} fill="#9a7a52" />
				<Tree x={-60} y={1120} s={0.9} tone="#4a4a30" />
				<Tree x={1180} y={1120} s={1.0} tone="#4a4a30" />
				{[130, 400, 670, 940].map((x, i) => (
					<Target key={i} x={x} y={1190} s={0.55} />
				))}
				{/* Drona watches from the side */}
				<Fig x={960} y={1270} s={0.26} dark={0.3} rim="#ffe0a0">
					<Drona t={t} look={-1} lArm={40} lElbow={-90} />
				</Fig>
			</Layer>
			<Layer depth={0.8}>
				<DustBank t={t} y={1290} color="#b8986a" opacity={0.35} height={60} />
			</Layer>
			<Layer depth={1}>
				{/* Karna's arrow flies to the centre target */}
				{fly > 0 && fly < 1 && (
					<g transform={`translate(${540 + fly * 120} ${1180 - fly * 10 - (1 - fly) * 500}) rotate(-80) scale(${1.2 - fly})`}>
						<Arrow len={220} />
					</g>
				)}
				{[-170, 1250].map((x, i) => (
					<Fig key={i} x={x} y={1900} s={0.62} dark={0.45} rim="#ffe0a0" rimDir={[0, -1]}>
						<Student t={t} seed={7 + i} />
					</Fig>
				))}
				{[110, 970].map((x, i) => (
					<Fig key={i} x={x} y={1820} s={0.56} dark={0.4} rim="#ffe0a0" rimDir={[0, -1]}>
						<Student t={t} seed={17 + i} draw={i ? 1 : 0.8} />
					</Fig>
				))}
				<Fig x={540} y={1860} s={0.62} dark={0.3} rim="#ffe0a0" rimDir={[0, -1]}>
					<Karna t={t} back bow="draw" pull={1 - ramp(t, 1.3, 1.4) * 0.9} wind={0.5} />
				</Fig>
			</Layer>
			<Layer depth={1.5}>
				<Dust t={t} seed={403} count={50} color="#fff0c8" vx={40} vy={-6} size={2} opacity={0.5} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 5. the Adi Parva: 12.62 - 16.88
// "The Mahabharata's Adi Parva lists Karna among Drona's pupils."
const SunMark: React.FC<{g: number}> = ({g}) => (
	<g>
		{g > 0.02 && <circle r={70} fill="#ffd98a" opacity={g * 0.6} filter="url(#b14)" />}
		<circle r={16} fill="#3a2614" />
		{Array.from({length: 10}, (_, i) => {
			const a = (i / 10) * Math.PI * 2;
			return <path key={i} d={`M${Math.cos(a) * 20},${Math.sin(a) * 20} L${Math.cos(a) * 30},${Math.sin(a) * 30}`} stroke="#3a2614" strokeWidth={4} strokeLinecap="round" />;
		})}
		{g > 0.02 && <circle r={12} fill="#ffe6a0" opacity={g} />}
	</g>
);
const BowMark: React.FC<{g: number}> = ({g}) => (
	<g>
		{g > 0.02 && <circle r={40} fill="#ffd98a" opacity={g * 0.35} filter="url(#b8)" />}
		<path d="M-10,-30 C14,-16 14,16 -10,30" stroke="#3a2614" strokeWidth={4} fill="none" />
		<path d="M-10,-30 L-10,30" stroke="#3a2614" strokeWidth={1.6} />
	</g>
);
export const AdiParva: React.FC<{t: number}> = ({t}) => {
	const sun = ramp(t, 1.85, 2.4);
	const all = ramp(t, 2.75, 3.4);
	const camY = keys(t, [[-0.4, -320], [1.6, 0], [4.3, 40]]);
	const zoom = keys(t, [[-0.4, 1.0], [1.6, 1.15], [4.3, 1.3]]);
	return (
		<Scene cam={{y: camY, zoom}} bg="#140c06">
			<Layer depth={0.05}>
				<Sky top="#0c0806" mid="#24160c" bottom="#3a2414" glow="#c27a3a" glowX={540} glowY={1000} glowR={760} />
			</Layer>
			<Layer depth={0.5}>
				{[0, 1, 2, 3].map((i) => (
					<g key={i} transform={`translate(${60 + (i % 2) * 20} ${300 + i * 150}) rotate(${-3 + i * 1.5})`}>
						<Leaf seed={50 + i} w={940} h={130} rows={3} tone="#cdbb94" />
					</g>
				))}
			</Layer>
			<Layer depth={1}>
				<g transform="translate(70 900)">
					<Leaf seed={60} w={940} h={330} rows={2} />
					{/* a row of pupils' marks: one is Karna's sun */}
					<g transform="translate(0 250)">
						{[150, 260, 370, 480, 590, 700, 810].map((x, i) =>
							i === 3 ? (
								<g key={i} transform={`translate(${x} 0)`}>
									<SunMark g={sun} />
								</g>
							) : (
								<g key={i} transform={`translate(${x} 0)`}>
									<BowMark g={all * (0.6 + 0.4 * Math.sin(t * 3 + i))} />
								</g>
							),
						)}
					</g>
				</g>
				<Diya t={t} x={170} y={1560} s={1.2} seed={6} />
				<Diya t={t} x={930} y={1600} s={1.0} seed={8} />
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={503} count={60} color="#ffcf8a" vx={6} vy={-12} size={2} opacity={0.55} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 6. the question: 16.88 - 19.22
// "Then why did Karna go to Parashurama?"
export const Journey: React.FC<{t: number}> = ({t}) => {
	const camY = keys(t, [[-0.4, 160], [2.5, -40]]);
	return (
		<Scene cam={{y: camY, zoom: keys(t, [[-0.4, 1.08], [2.5, 1.0]])}} bg="#1a1a26">
			<Layer depth={0.06}>
				<Sky top="#14182a" mid="#5a3e4a" bottom="#c27a4a" glow="#f0a05a" glowX={720} glowY={980} glowR={600} />
			</Layer>
			<Layer depth={0.2}>
				<Clouds t={t} seed={601} y={420} spread={300} count={12} size={300} dark="#2a2234" light="#8a5a5a" drift={12} />
			</Layer>
			<Layer depth={0.35}>
				{/* far Mahendra mountain, a single fire on its shoulder */}
				<Ridge seed={602} base={1180} amp={200} freq={0.003} peaks={[{x: 720, h: 520, w: 240}]} fill="#3a3046" fill2="#5a4050" />
				<circle cx={760} cy={800} r={40} fill="#ffb060" opacity={0.6 + 0.2 * Math.sin(t * 7)} filter="url(#b14)" />
				<circle cx={760} cy={800} r={6} fill="#ffe0a0" />
			</Layer>
			<Layer depth={0.6}>
				<Ridge seed={603} base={1420} amp={180} freq={0.004} fill="#241c2a" fill2="#2e2230" />
				<Clouds t={t} seed={604} y={1300} spread={100} count={9} size={200} dark="#3a2e3e" light="#7a5a5e" drift={20} opacity={0.5} />
			</Layer>
			<Layer depth={1}>
				<Crag x={300} y={1560} w={520} h={200} fill="#140e14" rim="#f0a05a" seed={6} />
				<Fig x={300} y={1564} s={0.42} dark={0.7} rim="#ffb070" rimDir={[0.8, -0.4]} rimW={12}>
					<Karna t={t} back wind={1.1} windDir={1} bow="hold" lArm={8} rArm={10} />
				</Fig>
			</Layer>
			<Layer depth={1.5}>
				<Dust t={t} seed={605} count={50} color="#ffc890" vx={50} vy={-4} size={2} opacity={0.5} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 7. what Drona would not teach: 19.22 - 22.20
// "Because he wanted something Drona would not teach him,"
export const DronaClose: React.FC<{t: number}> = ({t}) => {
	const close = ramp(t, 1.9, 2.5);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [3.0, 1.12]]), x: keys(t, [[0, -20], [3, 20]])}} bg="#120a06">
			<Layer depth={0.05}>
				<Sky top="#0a0605" mid="#1c120a" bottom="#2a1a0e" glow="#a4602a" glowX={900} glowY={1300} glowR={700} />
			</Layer>
			<Layer depth={0.3}>
				{/* lamp bokeh in the dark hall */}
				{Array.from({length: 9}, (_, i) => {
					const r = rng(700 + i);
					return <circle key={i} cx={r() * 1080} cy={300 + r() * 900} r={30 + r() * 50} fill="#f0a04a" opacity={0.12 + 0.06 * Math.sin(t * 2 + i)} filter="url(#b24)" />;
				})}
				<Smoke t={t} x={900} y={1500} rise={1400} seed={701} color="#5a4a3a" count={14} size={60} opacity={0.4} />
			</Layer>
			<Layer depth={1}>
				<Fig x={540} y={900} s={1.25} dark={0.3} rim="#ffb060" rimDir={[0.9, -0.2]} rimW={10}>
					<DronaFace t={t} stern={0.3 + close * 0.7} eyesClosed={close} look={0.4} />
				</Fig>
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={702} count={40} color="#ffcf8a" vx={6} vy={-10} size={2} opacity={0.5} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 8. THE BRAHMA WEAPON (biggest hero shot): 22.20 - 25.30
// "the Brahma weapon, including how to withdraw it."
const BrahmaFire: React.FC<{t: number; e: number}> = ({t, e}) => {
	if (e < 0.02) return null;
	return (
		<g>
			<circle r={420 * e} fill="#ffd98a" opacity={0.3 * e} filter="url(#b70)" />
			<circle r={160 * e} fill="#fff0c8" opacity={0.7 * e} filter="url(#b24)" />
			{/* four rotating rings of fire */}
			{[0, 1, 2, 3].map((i) => (
				<ellipse key={i} rx={(150 + i * 70) * e} ry={(40 + i * 18) * e} fill="none" stroke={i % 2 ? '#ffc070' : '#fff0c8'} strokeWidth={6 - i} opacity={0.8 * e} transform={`rotate(${t * (40 + i * 25) * (i % 2 ? -1 : 1) + i * 45})`} />
			))}
			{Array.from({length: 16}, (_, i) => {
				const a = (i / 16) * Math.PI * 2 + t * 0.6;
				const L = (260 + 90 * Math.sin(t * 5 + i)) * e;
				return <path key={i} d={`M${Math.cos(a) * 60 * e},${Math.sin(a) * 60 * e} L${Math.cos(a) * L},${Math.sin(a) * L}`} stroke="#ffe6a0" strokeWidth={3} opacity={0.6 * e} />;
			})}
			<circle r={40 * e} fill="#fff" />
		</g>
	);
};
export const Brahmastra: React.FC<{t: number}> = ({t}) => {
	const grow = ramp(t, 0.0, 1.0);
	const withdraw = ramp(t, 2.3, 2.9);
	const e = grow * (1 - withdraw * 0.92);
	const lit = flash(t, [0.05, 0.85, 1.5], 7) * (1 - withdraw);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.18], [1.6, 1.0], [3.1, 1.06]]), y: keys(t, [[0, 120], [1.6, 0]]), rot: keys(t, [[0, -2], [3.1, 1.5]])}} bg="#0a0c14">
			<Layer depth={0.08}>
				<Sky top="#06080e" mid="#1c2234" bottom="#4a3e46" glow="#e8b070" glowX={250} glowY={520} glowR={700 * (0.4 + e)} />
			</Layer>
			<Layer depth={0.18}>
				<Clouds t={t} seed={801} y={380} spread={500} count={14} size={360} dark="#10141e" light="#4a4a5a" drift={30} lit={lit + e * 0.4} litColor="#ffe0a0" />
				<CloudCrawl seed={802} x={-100} y={300} len={1300} v={lit} ang={0.1} />
				<Bolt seed={803} x0={420} y0={-200} x1={250} y1={520} v={flash(t, [0.85], 8) * (1 - withdraw)} color="#ffe6b0" />
			</Layer>
			<Layer depth={0.4}>
				<Ridge seed={804} base={1500} amp={220} freq={0.004} fill="#141420" fill2="#2a2430" rim={lit > 0.2 ? '#ffe0a0' : undefined} />
			</Layer>
			<Layer depth={0.7}>
				{/* the weapon's fire at the arrow tip */}
				<g transform="translate(250 520)">
					<BrahmaFire t={t} e={e} />
				</g>
			</Layer>
			<Layer depth={1}>
				<Crag x={700} y={1580} w={600} h={240} fill="#0a0a10" rim={'#ffe0a0'} seed={11} />
				<Fig x={700} y={1586} s={0.95} dark={0.55 - e * 0.25} rim="#ffe6b0" rimDir={[0.6, -0.8]} rimW={10} rimA={1}>
					<Karna t={t} back bow="draw" pull={1} arrowGlow={e} wind={1.2} windDir={-1} head={-10} aim={38} />
				</Fig>
			</Layer>
			<Layer depth={1.5}>
				<Dust t={t} seed={805} count={80} color="#ffe0a0" vx={-60 * (1 - withdraw * 2)} vy={-30} size={2.4} opacity={0.6} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 9. to fight Arjuna: 25.30 - 27.05
// "He wanted this to fight Arjun,"
export const Rival: React.FC<{t: number}> = ({t}) => (
	<Scene cam={{zoom: keys(t, [[0, 1.0], [1.8, 1.08]]), x: keys(t, [[0, -40], [1.8, 30]])}} bg="#1a1416">
		<Layer depth={0.06}>
			<Sky top="#14141e" mid="#5a3a34" bottom="#b0603a" glow="#e08a4a" glowX={540} glowY={1150} glowR={600} />
		</Layer>
		<Layer depth={0.25}>
			<Clouds t={t} seed={901} y={500} spread={300} count={12} size={300} dark="#241a1e" light="#7a4a3e" drift={16} />
		</Layer>
		<Layer depth={0.5}>
			<Ridge seed={902} base={1280} amp={120} freq={0.003} fill="#2a1e1c" fill2="#3a2620" />
			<ArmyRow t={t} y={1290} n={22} scale={0.35} seed={903} tone="#1a1212" banners={5} rise={1} />
		</Layer>
		<Layer depth={0.75}>
			<Crag x={820} y={1250} w={300} h={120} fill="#1c1414" rim="#e0a070" seed={9} />
			<Fig x={820} y={1254} s={0.46} dark={0.6} rim="#dfe8ff" rimDir={[-0.7, -0.6]} rimW={10}>
				<Arjuna t={t} wind={0.8} windDir={-1} look={-1} />
			</Fig>
			<DustBank t={t} y={1400} color="#7a5a42" opacity={0.4} height={80} />
		</Layer>
		<Layer depth={1}>
			<Fig x={250} y={2000} s={1.15} dark={0.35} rim="#ffb070" rimDir={[0.8, -0.5]} rimW={10}>
				<Karna t={t} bow="hold" wind={0.9} look={1} head={4} />
			</Fig>
		</Layer>
		<Layer depth={1.5}>
			<Dust t={t} seed={904} count={60} color="#ffc890" vx={70} vy={-6} size={2.4} opacity={0.55} />
		</Layer>
	</Scene>
);

// ============================================================ 10. Drona refuses: 27.05 - 28.70
// "but Drona refused."
export const Refuses: React.FC<{t: number}> = ({t}) => {
	const raise = ramp(t, 0.15, 0.6);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.08], [1.7, 1.0]]), y: keys(t, [[0, -40], [1.7, 0]])}} bg="#0c0a0a">
			<Layer depth={0.05}>
				<Sky top="#08070a" mid="#1a1418" bottom="#3a2a24" glow="#c06a3a" glowX={200} glowY={1100} glowR={600} />
			</Layer>
			<Layer depth={0.3}>
				{/* pillared hall */}
				{[80, 330, 750, 1000].map((x) => (
					<rect key={x} x={x - 40} y={300} width={80} height={1400} fill="#16100e" />
				))}
				<Smoke t={t} x={200} y={1500} rise={1200} seed={1001} color="#4a3a32" count={12} size={60} opacity={0.4} />
			</Layer>
			<Layer depth={1}>
				<Fig x={560} y={1900} s={1.4} dark={0.35} rim="#ffb060" rimDir={[-0.9, -0.3]} rimW={10}>
					<Drona t={t} stern={1} head={3 - raise * 6} look={-1} lArm={22 + raise * 18} lElbow={-40 + raise * 155} lHand={raise > 0.4 ? 'palm' : 'fist'} wind={0.3} />
				</Fig>
				<Diya t={t} x={140} y={1780} s={1.6} seed={9} />
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={1002} count={40} color="#ffcf8a" vx={6} vy={-10} size={2} opacity={0.45} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 11. reserved: 28.70 - 30.95
// "He said it was reserved for a Brahmin"
export const Reserved: React.FC<{t: number}> = ({t}) => {
	const glow = 0.5 + 0.3 * Math.sin(t * 2.4);
	return (
		<Scene cam={{zoom: keys(t, [[-0.3, 1.0], [2.3, 1.18]]), y: keys(t, [[-0.3, 60], [2.3, 0]])}} bg="#100a08">
			<Layer depth={0.05}>
				<Sky top="#0a0605" mid="#20140c" bottom="#3a2414" glow="#d08a3a" glowX={540} glowY={1000} glowR={600} />
			</Layer>
			<Layer depth={0.4}>
				<Fig x={540} y={1300} s={0.9} dark={0.9} rim="#ffb060" rimDir={[0, -1]} rimW={6} opacity={0.5}>
					<Drona t={t} lArm={50} lElbow={100} lHand="palm" />
				</Fig>
			</Layer>
			<Layer depth={1}>
				{/* stone altar; the weapon rests on it, bound with a sacred thread */}
				<path d="M200,1260 L880,1260 L940,1340 L140,1340 Z" fill="#4a3a2e" />
				<rect x={140} y={1340} width={800} height={260} fill="#2e241c" />
				<path d="M140,1340 L940,1340" stroke="#8a6a4a" strokeWidth={4} />
				{[220, 860].map((x, i) => (
					<Diya key={x} t={t} x={x} y={1262} s={1} seed={20 + i} />
				))}
				<g transform="translate(210 1215)">
					<Arrow len={660} glow={glow} />
				</g>
				<path d="M470,1206 C490,1240 510,1240 530,1206 M540,1206 C560,1240 580,1240 600,1206" stroke="#fffaf0" strokeWidth={4} fill="none" />
				{Array.from({length: 6}, (_, i) => (
					<circle key={i} cx={300 + i * 100} cy={1300} r={8} fill="#c8a050" />
				))}
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={1101} count={50} color="#ffd98a" vx={4} vy={-14} size={2} opacity={0.55} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 12. the Brahmin's vows: 30.95 - 33.20
// "who had observed the required vows"
export const Vows: React.FC<{t: number}> = ({t}) => (
	<Scene cam={{zoom: keys(t, [[-0.3, 1.04], [2.3, 1.14]]), x: keys(t, [[-0.3, 30], [2.3, -20]])}} bg="#14100e">
		<Layer depth={0.06}>
			<Sky top="#0e1018" mid="#3a2e34" bottom="#9a6040" glow="#e0904a" glowX={540} glowY={1300} glowR={600} />
		</Layer>
		<Layer depth={0.35}>
			<Ridge seed={1201} base={1300} amp={180} freq={0.003} fill="#241c20" fill2="#3a2a26" />
			<Tree x={120} y={1360} s={1.1} tone="#140e10" />
			<Tree x={960} y={1370} s={1.0} tone="#140e10" />
		</Layer>
		<Layer depth={1}>
			<rect x={-600} y={1600} width={2300} height={800} fill="#1e1410" />
			<Smoke t={t} x={540} y={1480} rise={1500} seed={1202} color="#7a6a6a" count={18} size={44} spread={0.7} opacity={0.5} />
			<path d="M440,1480 L640,1480 L660,1520 L420,1520 Z" fill="#5a3a22" />
			<Fire t={t} x={540} y={1484} s={0.7} seed={3} />
			<Fig x={540} y={1760} s={0.95} dark={0.25} rim="#ffae5c" rimDir={[0, -1]} rimW={8}>
				<Sage t={t} pray={0.9} wind={0.3} />
			</Fig>
		</Layer>
		<Layer depth={1.5}>
			<Dust t={t} seed={1203} count={50} color="#ffbf7a" vx={-8} vy={-22} size={2} opacity={0.6} area={[0, 700, 1080, 1100]} />
		</Layer>
	</Scene>
);

// ============================================================ 13. the Kshatriya's penance: 33.20 - 36.90
// "or a Kshatriya who had performed severe penance."
export const Penance: React.FC<{t: number}> = ({t}) => {
	const sunPulse = 0.85 + 0.15 * Math.sin(t * 1.4);
	return (
		<Scene cam={{zoom: keys(t, [[-0.3, 1.25], [3.8, 0.95]]), y: keys(t, [[-0.3, -60], [3.8, 40]]), rot: keys(t, [[-0.3, 1.5], [3.8, -1.5]])}} bg="#4a3020">
			<Layer depth={0.05}>
				<Sky top="#6a4a3a" mid="#d08a4a" bottom="#f0c07a" glow="#fff0c0" glowX={540} glowY={420} glowR={700 * sunPulse} />
				<circle cx={540} cy={420} r={110} fill="#fff6dc" filter="url(#b8)" />
			</Layer>
			<Layer depth={0.2}>
				{/* heat shimmer bands */}
				{[0, 1, 2].map((i) => (
					<path key={i} d={`M-200,${900 + i * 120 + Math.sin(t * 2 + i) * 10} C200,${880 + i * 120} 600,${930 + i * 120} 1300,${900 + i * 120}`} stroke="#fff0c8" strokeWidth={30} opacity={0.08} fill="none" filter="url(#b14)" />
				))}
				<Ridge seed={1301} base={1300} amp={160} freq={0.004} fill="#a4704a" fill2="#c08a5a" />
			</Layer>
			<Layer depth={0.6}>
				<Ridge seed={1302} base={1500} amp={120} freq={0.005} fill="#7a4e32" fill2="#8a5a3a" />
			</Layer>
			<Layer depth={1}>
				<Crag x={540} y={1560} w={420} h={180} fill="#3a2418" rim="#fff0c8" seed={4} />
				<Fig x={540} y={1564} s={0.85} dark={0.45} rim="#fff0c8" rimDir={[0, -1]} rimW={10}>
					<Arjuna t={t} tapas oneLeg wind={0.3} rArm={168} rElbow={4} lArm={168} lElbow={4} rHand="palm" lHand="palm" />
				</Fig>
			</Layer>
			<Layer depth={1.5}>
				<Dust t={t} seed={1303} count={60} color="#fff0c8" vx={30} vy={-6} size={2.2} opacity={0.5} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 14. Parashurama: 36.90 - 38.70
// "So Karna went to Parashurama,"
export const Mahendra: React.FC<{t: number}> = ({t}) => {
	const camY = keys(t, [[-0.3, 420], [1.9, 0]]);
	return (
		<Scene cam={{y: camY, zoom: keys(t, [[-0.3, 1.05], [1.9, 1.0]])}} bg="#18141e">
			<Layer depth={0.06}>
				<Sky top="#10121e" mid="#4a3446" bottom="#d0784a" glow="#f0a060" glowX={680} glowY={900} glowR={700} />
			</Layer>
			<Layer depth={0.2}>
				<Clouds t={t} seed={1401} y={300} spread={300} count={12} size={320} dark="#221c2a" light="#7a4e52" drift={10} />
			</Layer>
			<Layer depth={0.45}>
				<Ridge seed={1402} base={1320} amp={260} freq={0.003} fill="#2a2030" fill2="#3a2a34" />
			</Layer>
			<Layer depth={1}>
				<Crag x={680} y={1240} w={520} h={240} fill="#140e12" rim="#f0a060" seed={8} />
				<Smoke t={t} x={420} y={1240} rise={1300} seed={1403} color="#5a4a4a" count={12} size={40} opacity={0.4} />
				<Fire t={t} x={420} y={1246} s={0.55} seed={5} />
				<ellipse cx={720} cy={900} rx={300} ry={460} fill="#f0a060" opacity={0.12} filter="url(#b70)" />
				<Fig x={740} y={1246} s={0.9} dark={0.35} rim="#ffb070" rimDir={[-0.8, -0.5]} rimW={10}>
					<Parashurama t={t} wind={0.7} windDir={1} look={-1} axeGlow={0.4} />
				</Fig>
			</Layer>
			<Layer depth={1.3}>
				<Fig x={180} y={1900} s={0.6} dark={0.75} rim="#ffb070" rimDir={[0.8, -0.5]} rimW={10}>
					<Karna t={t} back wind={0.8} bow="hold" />
				</Fig>
			</Layer>
			<Layer depth={1.6}>
				<Dust t={t} seed={1404} count={60} color="#ffc890" vx={30} vy={-14} size={2.2} opacity={0.55} />
			</Layer>
		</Scene>
	);
};

// ============================================================ 15. the disguise (bookend): 38.70 - end
// "presenting himself as a Brahmin."
export const Disguise: React.FC<{t: number}> = ({t}) => {
	const glint = flash(t, [1.75], 4);
	const zoom = keys(t, [[0, 1.22], [1.6, 1.12], [3.0, 0.82]]);
	const dim = keys(t, [[1.7, 0], [2.9, 0.55]]);
	return (
		<Scene cam={{zoom, y: keys(t, [[0, 120], [3.0, -60]])}} bg="#120e14">
			<Layer depth={0.06}>
				<Sky top="#0e0e1a" mid="#3a2a3a" bottom="#a0603e" glow="#e0904a" glowX={540} glowY={1100} glowR={700} />
			</Layer>
			<Layer depth={0.3}>
				<Clouds t={t} seed={1501} y={400} spread={300} count={12} size={300} dark="#1e1824" light="#5e4048" drift={8} />
				<Ridge seed={1502} base={1280} amp={220} freq={0.003} fill="#221a26" fill2="#2e2430" />
			</Layer>
			<Layer depth={1}>
				<rect x={-800} y={1560} width={2700} height={900} fill="#160f10" />
				<Smoke t={t} x={540} y={1520} rise={1400} seed={1503} color="#6a5a5a" count={14} size={40} opacity={0.4} />
				<Fire t={t} x={540} y={1530} s={0.6} seed={13} />
				<Fig x={300} y={1600} s={1.0} dark={0.35} rim="#ffb070" rimDir={[0.8, -0.5]} rimW={10}>
					<Parashurama t={t} wind={0.4} look={1} lArm={40} lElbow={100} lHand="palm" />
				</Fig>
				<Fig x={740} y={1640} s={0.88} dark={0.3} rim="#ffb070" rimDir={[-0.8, -0.5]} rimW={10}>
					<Karna t={t} disguise={1} kneel={1} head={10} look={-1} glint={glint} rArm={30} rElbow={-140} lArm={30} lElbow={-140} />
				</Fig>
				{/* gold catches the firelight under the white cloth */}
				<circle cx={712} cy={1215} r={50} fill="#ffe6a0" opacity={glint * 0.8} filter="url(#b14)" />
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={1504} count={50} color="#ffc890" vx={10} vy={-18} size={2} opacity={0.55} />
			</Layer>
			<Layer depth={0}>
				<rect x={-2000} y={-3000} width={5000} height={8000} fill="#000" opacity={dim} />
			</Layer>
		</Scene>
	);
};

// (KarnaFace is part of the cast library for close-ups; unused helper kept referenced for type-checks)
export const _unused = [KarnaFace, clamp, smoothPath, C];
