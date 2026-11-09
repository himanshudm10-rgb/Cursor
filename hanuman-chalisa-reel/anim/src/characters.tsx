// Character library. One consistent painted graphic-novel look:
// flat painted fills + shadow shapes + a rim-light filter (CharFX).
// New characters for a new film MUST be built with the same toolkit:
// limb() for arms/legs, smoothPath() for cloth/hair, the C palette, and CharFX for lighting.
import React from 'react';
import {C, clamp, noise, rng, smoothPath} from './lib';

const rad = (d: number) => (d * Math.PI) / 180;

// ------------------------------------------------------------------ rim light / silhouette filter
let fxCounter = 0;
/**
 * Wraps a character. dark: 0 = full colour, 1 = near-black silhouette.
 * rim: colour of the light catching the edge; rimDir: [dx, dy] towards the light.
 */
export const CharFX: React.FC<{dark?: number; rim?: string; rimA?: number; rimDir?: [number, number]; rimW?: number; children: React.ReactNode; id?: string}> = ({
	dark = 0,
	rim = '#cfe0ff',
	rimA = 0.9,
	rimDir = [-1, -0.4],
	rimW = 4,
	children,
	id,
}) => {
	const fid = id ?? `fx${(fxCounter = (fxCounter + 1) % 100000)}`;
	const k = 1 - 0.9 * clamp(dark);
	const [dx, dy] = rimDir;
	return (
		<g>
			<defs>
				{/* sRGB is essential: in the default linearRGB space "dark" barely darkens */}
				<filter id={fid} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
					<feComponentTransfer in="SourceGraphic" result="dk">
						<feFuncR type="linear" slope={k} intercept={0.02 * dark} />
						<feFuncG type="linear" slope={k} intercept={0.025 * dark} />
						<feFuncB type="linear" slope={k} intercept={0.04 * dark} />
					</feComponentTransfer>
					<feOffset in="SourceAlpha" dx={dx * rimW} dy={dy * rimW} result="off" />
					<feComposite in="SourceAlpha" in2="off" operator="out" result="edge" />
					<feGaussianBlur in="edge" stdDeviation="1" result="edgeb" />
					<feFlood floodColor={rim} floodOpacity={rimA} />
					<feComposite in2="edgeb" operator="in" result="rimc" />
					<feMerge>
						<feMergeNode in="dk" />
						<feMergeNode in="rimc" />
					</feMerge>
				</filter>
			</defs>
			<g filter={`url(#${fid})`}>{children}</g>
		</g>
	);
};

/** Tapered limb with a muscle bulge, from p1 to p2. */
export const limb = (x1: number, y1: number, x2: number, y2: number, w1: number, wm: number, w2: number) => {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const L = Math.hypot(dx, dy) || 1;
	const nx = -dy / L;
	const ny = dx / L;
	const mx = x1 + dx * 0.38;
	const my = y1 + dy * 0.38;
	const pts: [number, number][] = [
		[x1 + nx * w1, y1 + ny * w1],
		[mx + nx * wm, my + ny * wm],
		[x2 + nx * w2, y2 + ny * w2],
		[x2 + (dx / L) * w2 * 0.9, y2 + (dy / L) * w2 * 0.9],
		[x2 - nx * w2, y2 - ny * w2],
		[mx - nx * wm * 0.92, my - ny * wm * 0.92],
		[x1 - nx * w1, y1 - ny * w1],
		[x1 - (dx / L) * w1 * 0.7, y1 - (dy / L) * w1 * 0.7],
	];
	return smoothPath(pts, true);
};

// ------------------------------------------------------------------ the Vajra
/** Centred on the grip, lying along +x. energy 0..1 adds crackle. */
export const Vajra: React.FC<{len?: number; energy?: number; t?: number; dark?: boolean}> = ({len = 220, energy = 0, t = 0, dark}) => {
	const s = len / 220;
	const metal = dark ? '#2a2018' : 'url(#vajraMetal)';
	const edge = '#2a1a0c';
	const half = (dir: 1 | -1) => {
		const x = (v: number) => v * dir;
		return (
			<g key={dir}>
				{/* lotus bulb */}
				<path d={`M${x(22)},-11 C${x(30)},-18 ${x(44)},-18 ${x(50)},-8 L${x(50)},8 C${x(44)},18 ${x(30)},18 ${x(22)},11 Z`} fill={metal} stroke={edge} strokeWidth={2} />
				<path d={`M${x(26)},0 L${x(48)},0`} stroke={edge} strokeWidth={1.4} opacity={0.6} />
				{/* outer prongs */}
				<path d={`M${x(48)},-7 C${x(64)},-30 ${x(84)},-32 ${x(96)},-18 C${x(103)},-9 ${x(107)},-4 ${x(112)},0 C${x(101)},-6 ${x(90)},-17 ${x(80)},-18 C${x(70)},-18 ${x(60)},-10 ${x(52)},-3 Z`} fill={metal} stroke={edge} strokeWidth={1.6} />
				<path d={`M${x(48)},7 C${x(64)},30 ${x(84)},32 ${x(96)},18 C${x(103)},9 ${x(107)},4 ${x(112)},0 C${x(101)},6 ${x(90)},17 ${x(80)},18 C${x(70)},18 ${x(60)},10 ${x(52)},3 Z`} fill={metal} stroke={edge} strokeWidth={1.6} />
				{/* central prong */}
				<path d={`M${x(50)},-4 L${x(104)},-2 L${x(114)},0 L${x(104)},2 L${x(50)},4 Z`} fill={metal} stroke={edge} strokeWidth={1.4} />
				<circle cx={x(52)} cy={0} r={5} fill={C.paleGold} stroke={edge} strokeWidth={1.2} />
			</g>
		);
	};
	return (
		<g transform={`scale(${s})`}>
			<defs>
				<linearGradient id="vajraMetal" x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
					<stop offset="0" stopColor="#d9b56a" />
					<stop offset="0.45" stopColor="#9c7232" />
					<stop offset="1" stopColor="#4e3416" />
				</linearGradient>
			</defs>
			{energy > 0.02 && (
				<g opacity={energy}>
					<ellipse cx={0} cy={0} rx={150} ry={60} fill="#bcd4ff" opacity={0.35} filter="url(#b24)" />
					{[0, 1, 2, 3].map((i) => {
						const r = rng(Math.floor(t * 12) * 7 + i);
						const y0 = (r() - 0.5) * 40;
						const pts: [number, number][] = Array.from({length: 7}, (_, k) => [-110 + k * 36, y0 + (r() - 0.5) * 34]);
						return <path key={i} d={pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')} stroke="#eef4ff" strokeWidth={1.8} fill="none" opacity={r() > 0.3 ? 1 : 0} />;
					})}
				</g>
			)}
			{half(1)}
			{half(-1)}
			{/* grip */}
			<rect x={-24} y={-9} width={48} height={18} rx={6} fill={dark ? '#1c140e' : '#5b3a1b'} stroke={edge} strokeWidth={2} />
			{[-16, 0, 16].map((gx) => (
				<rect key={gx} x={gx - 3} y={-11} width={6} height={22} rx={2} fill={dark ? '#2a2018' : C.gold} stroke={edge} strokeWidth={1} />
			))}
		</g>
	);
};

// ------------------------------------------------------------------ INDRA (full figure) - the reference hero build
export type IndraPose = {
	rArm?: number; // right shoulder angle (deg from hanging down, outward +)
	rElbow?: number;
	lArm?: number;
	lElbow?: number;
	vajraAng?: number; // extra rotation of the weapon in hand
	energy?: number;
	seated?: boolean;
	wind?: number; // 0..1.5
	windDir?: 1 | -1;
	t: number;
	head?: number; // head tilt deg
	look?: number; // eyes -1..1
	shadowFace?: number; // 0..1 shadow over face
	back?: boolean; // seen from behind (mirrors the figure, hair over the back)
};

/** Local origin = between the feet; ~900 units tall (head top at y = -912). */
export const Indra: React.FC<IndraPose> = ({
	rArm = 14,
	rElbow = 8,
	lArm = 24,
	lElbow = -58,
	vajraAng = 70,
	energy = 0,
	seated = false,
	wind = 0.6,
	windDir = 1,
	t,
	head = 0,
	look = 0,
	shadowFace = 0,
	back = false,
}) => {
	const w = wind * windDir * (back ? -1 : 1);
	const br = Math.sin(t * 1.6) * 0.006; // breathing
	const gust = (k: number) => w * (0.75 + 0.25 * noise(t * 0.9 + k, 41));
	const wave = (k: number, amp: number) => Math.sin(t * 3.1 + k) * amp * Math.abs(wind);

	// --- arms
	const arm = (side: -1 | 1, a: number, b: number) => {
		const sx = side * 148;
		const sy = -712;
		const ux = sx + side * Math.sin(rad(a)) * 165;
		const uy = sy + Math.cos(rad(a)) * 165;
		const fa = a + b;
		const hx = ux + side * Math.sin(rad(fa)) * 150;
		const hy = uy + Math.cos(rad(fa)) * 150;
		return {sx, sy, ux, uy, hx, hy, fa};
	};
	const R = arm(-1, rArm, rElbow);
	const L = arm(1, lArm, lElbow);

	const drawArm = (A: ReturnType<typeof arm>, side: -1 | 1) => (
		<g>
			<path d={limb(A.sx, A.sy, A.ux, A.uy, 40, 42, 30)} fill={C.skin} />
			<path d={limb(A.sx + 8, A.sy + 6, A.ux + 6, A.uy, 18, 22, 14)} fill={C.skinShade} opacity={side === 1 ? 0.55 : 0.25} />
			<path d={limb(A.ux, A.uy, A.hx, A.hy, 29, 31, 21)} fill={C.skin} />
			{/* bronze forearm guard */}
			<path d={limb(A.ux + (A.hx - A.ux) * 0.35, A.uy + (A.hy - A.uy) * 0.35, A.ux + (A.hx - A.ux) * 0.88, A.uy + (A.hy - A.uy) * 0.88, 30, 31, 24)} fill={C.bronze} stroke={C.darkBronze} strokeWidth={3} />
			{/* gold armlet */}
			<path d={limb(A.sx + (A.ux - A.sx) * 0.55, A.sy + (A.uy - A.sy) * 0.55, A.sx + (A.ux - A.sx) * 0.66, A.sy + (A.uy - A.sy) * 0.66, 41, 41, 39)} fill={C.gold} stroke={C.darkBronze} strokeWidth={2} />
			{/* fist */}
			<circle cx={A.hx} cy={A.hy} r={24} fill={C.skin} />
			<circle cx={A.hx + side * 6} cy={A.hy + 4} r={14} fill={C.skinShade} opacity={0.4} />
		</g>
	);

	const hipY = -470;
	const torsoD = smoothPath(
		[
			[0, -768],
			[-36, -762],
			[-108, -744],
			[-176, -716],
			[-170, -668],
			[-140, -640],
			[-122, -582],
			[-92, -500],
			[-96, hipY],
			[96, hipY],
			[92, -500],
			[122, -582],
			[140, -640],
			[170, -668],
			[176, -716],
			[108, -744],
			[36, -762],
		],
		true,
	);

	// hair: long, flowing downwind
	const hairPts: [number, number][] = [
		[-46, -900],
		[-70, -872],
		[-84, -820],
		[-90 + gust(1) * 20, -760],
		[-96 + gust(2) * 50 + wave(1, 6), -690],
		[-80 + gust(3) * 70 + wave(2, 10), -630],
		[-40 + gust(4) * 110 + wave(3, 14), -610],
		[20 + gust(5) * 150 + wave(4, 16), -640],
		[80 + gust(6) * 180 + wave(5, 18), -670],
		[110 + gust(7) * 150 + wave(6, 12), -720],
		[96 + gust(8) * 60, -790],
		[84, -850],
		[56, -895],
		[0, -912],
	];

	// shoulder cloth tail streaming downwind
	const sc = (k: number) => [
		[150, -730],
		[190 + gust(10) * 60 + wave(k, 8), -680],
		[230 + gust(11) * 140 + wave(k + 1, 18), -600],
		[260 + gust(12) * 230 + wave(k + 2, 28), -520],
		[290 + gust(13) * 300 + wave(k + 3, 36), -450],
	];
	const tailTop = sc(0) as [number, number][];
	const tailBot = (sc(0.6) as [number, number][]).map(([x, y], i) => [x - 20 - i * 6, y + 40 + i * 14] as [number, number]).reverse();
	const scarfD = smoothPath([...tailTop, ...tailBot], true);

	const sashSway = gust(20) * 14 + wave(7, 5);

	const legs = seated ? (
		<g>
			<path d={smoothPath([[-104, -480], [-150, -420], [-138, -372], [-60, -380], [0, -420], [60, -380], [138, -372], [150, -420], [104, -480]], true)} fill={C.red} />
			<path d={limb(-112, -392, -122, -190, 38, 36, 22)} fill={C.skin} />
			<path d={limb(112, -392, 122, -190, 38, 36, 22)} fill={C.skin} />
			<path d={limb(116, -380, 124, -200, 14, 14, 10)} fill={C.skinShade} opacity={0.5} />
			<ellipse cx={-130} cy={-180} rx={36} ry={14} fill={C.skinShade} />
			<ellipse cx={130} cy={-180} rx={36} ry={14} fill={C.skinShade} />
			<path d={smoothPath([[-150, -420], [-120, -370], [-70, -376], [-20, -400]])} stroke={C.gold} strokeWidth={6} fill="none" />
			<path d={smoothPath([[150, -420], [120, -370], [70, -376], [20, -400]])} stroke={C.gold} strokeWidth={6} fill="none" />
		</g>
	) : (
		<g>
			{/* lower legs */}
			<path d={limb(-58, -236, -76, -22, 40, 42, 20)} fill={C.skin} />
			<path d={limb(58, -236, 76, -22, 40, 42, 20)} fill={C.skin} />
			<path d={limb(62, -220, 78, -30, 16, 16, 9)} fill={C.skinShade} opacity={0.55} />
			{/* bronze ankle bands */}
			<rect x={-96} y={-52} width={40} height={10} rx={4} fill={C.bronze} />
			<rect x={56} y={-52} width={40} height={10} rx={4} fill={C.bronze} />
			{/* feet */}
			<path d="M-100,-24 C-112,-14 -116,0 -100,2 L-58,2 C-50,-6 -56,-22 -64,-26 Z" fill={C.skinShade} />
			<path d="M100,-24 C112,-14 116,0 100,2 L58,2 C50,-6 56,-22 64,-26 Z" fill={C.skinShade} />
			{/* dhoti: wrapped, tapering to below the knee */}
			<path
				d={smoothPath(
					[
						[-100, -482],
						[-116, -400],
						[-118 - gust(30) * 8, -300],
						[-100 - gust(31) * 12, -196],
						[-30, -184],
						[-6, -262],
						[6, -262],
						[30, -184],
						[100 + gust(32) * 12, -196],
						[118 + gust(33) * 8, -300],
						[116, -400],
						[100, -482],
					],
					true,
				)}
				fill={C.red}
			/>
			<path d={smoothPath([[30, -470], [60, -360], [70, -250], [92, -186]])} stroke={C.deepRed} strokeWidth={14} fill="none" opacity={0.8} />
			<path d={smoothPath([[-30, -470], [-55, -350], [-70, -240]])} stroke={C.deepRed} strokeWidth={8} fill="none" opacity={0.5} />
			<path d={smoothPath([[-100 - gust(31) * 12, -196], [-30, -184]])} stroke={C.gold} strokeWidth={7} fill="none" />
			<path d={smoothPath([[30, -184], [100 + gust(32) * 12, -196]])} stroke={C.gold} strokeWidth={7} fill="none" />
		</g>
	);

	return (
		<g transform={back ? 'scale(-1 1)' : undefined}>
			{/* back layers */}
			<path d={scarfD} fill={C.blue} />
			<path d={smoothPath(tailTop)} stroke={C.steel} strokeWidth={5} fill="none" opacity={0.6} />
			<path d={smoothPath(hairPts, true)} fill={C.hair} />
			{drawArm(R, -1)}
			{legs}
			{/* torso */}
			<g transform={`translate(0 -600) scale(1 ${1 + br}) translate(0 600)`}>
				<path d={torsoD} fill={C.skin} />
				{back ? (
					<g>
						<path d="M0,-760 L0,-500" stroke={C.skinShade} strokeWidth={6} opacity={0.6} />
						<path d="M-30,-720 C-80,-700 -110,-650 -100,-600 C-70,-620 -40,-660 -30,-720 Z M30,-720 C80,-700 110,-650 100,-600 C70,-620 40,-660 30,-720 Z" fill={C.skinShade} opacity={0.55} />
						<path d="M40,-600 C70,-560 80,-520 90,-500 L96,-470 L40,-470 Z" fill={C.skinShade} opacity={0.5} />
					</g>
				) : (
					<g>
						{/* pecs / abs painted shadow shapes */}
						<path d="M-120,-650 C-90,-610 -30,-608 -6,-640 C-30,-622 -90,-624 -120,-650 Z" fill={C.skinShade} opacity={0.6} />
						<path d="M120,-650 C90,-606 30,-606 6,-640 C30,-618 90,-620 120,-650 Z" fill={C.skinShade} opacity={0.75} />
						<path d="M40,-600 C70,-560 80,-520 90,-500 L96,-470 L40,-470 Z" fill={C.skinShade} opacity={0.5} />
						<path d="M0,-630 L0,-500" stroke={C.skinShade} strokeWidth={4} opacity={0.5} />
						<path d="M-30,-566 Q0,-560 30,-566 M-28,-530 Q0,-524 28,-530" stroke={C.skinShade} strokeWidth={3} fill="none" opacity={0.45} />
					</g>
				)}
				{/* belt */}
				<path d="M-98,-500 Q0,-484 98,-500 L100,-468 Q0,-452 -100,-468 Z" fill={C.bronze} stroke={C.darkBronze} strokeWidth={3} />
				<circle cx={0} cy={-478} r={13} fill={C.gold} stroke={C.darkBronze} strokeWidth={2} />
				{/* narrow hanging front sash */}
				{!seated && !back && (
					<path d={`M-18,-468 L18,-468 L${12 + sashSway},-300 L${sashSway},-282 L${-12 + sashSway},-300 Z`} fill={C.deepRed} stroke={C.gold} strokeWidth={4} />
				)}
				{/* deep blue cloth across the chest (left shoulder to right hip) */}
				<path d="M120,-742 C150,-720 160,-690 140,-664 C60,-590 -20,-530 -96,-470 L-104,-500 C-30,-560 40,-630 96,-700 Z" fill={C.blue} />
				<path d="M126,-736 C60,-650 -20,-570 -98,-492" stroke={C.steel} strokeWidth={4} fill="none" opacity={0.7} />
				<path d="M120,-742 C150,-720 160,-690 140,-664" stroke={C.gold} strokeWidth={3} fill="none" opacity={0.6} />
				{/* bronze shoulder discs - signature silhouette */}
				{[-1, 1].map((s) => (
					<g key={s}>
						<ellipse cx={s * 158} cy={-718} rx={44} ry={30} fill={C.bronze} stroke={C.darkBronze} strokeWidth={3} transform={`rotate(${s * 18} ${s * 158} -718)`} />
						<ellipse cx={s * 158} cy={-722} rx={22} ry={13} fill={C.gold} opacity={0.6} transform={`rotate(${s * 18} ${s * 158} -718)`} />
					</g>
				))}
				{/* neck */}
				<path d="M-30,-790 L-34,-750 Q0,-738 34,-750 L30,-790 Z" fill={C.skin} />
				<path d="M8,-786 L30,-790 L34,-752 Q20,-746 10,-748 Z" fill={C.skinShade} opacity={0.6} />
				{/* gold torque */}
				{!back && <path d="M-44,-760 Q0,-722 44,-760" stroke={C.gold} strokeWidth={9} fill="none" strokeLinecap="round" />}
				{!back && <circle cx={0} cy={-741} r={7} fill={C.paleGold} />}
			</g>
			{/* head */}
			<g transform={`rotate(${head} 0 -790)`}>
				{back ? (
					<g>
						<ellipse cx={0} cy={-912} rx={24} ry={20} fill={C.hair} />
						<rect x={-20} y={-902} width={40} height={8} rx={3} fill={C.gold} />
						<circle cx={-50} cy={-806} r={6} stroke={C.gold} strokeWidth={3} fill="none" />
						<circle cx={50} cy={-806} r={6} stroke={C.gold} strokeWidth={3} fill="none" />
						<path d={smoothPath([[-50, -880], [-54, -820], [-40, -770], [-60 + gust(60) * 30 + wave(8, 6), -690], [-40 + gust(61) * 40 + wave(9, 8), -600], [0 + gust(62) * 50 + wave(10, 10), -560], [40 + gust(63) * 40 + wave(11, 8), -600], [60 + gust(64) * 30, -690], [40, -770], [54, -820], [50, -880], [0, -900]], true)} fill={C.hair} />
						<path d="M-48,-864 Q0,-856 48,-864" stroke={C.gold} strokeWidth={5} fill="none" />
						<path d={`M0,-860 L${-10 + gust(65) * 30},-800 M0,-860 L${8 + gust(66) * 34},-806`} stroke={C.gold} strokeWidth={3} />
					</g>
				) : (
					<IndraHead look={look} shadow={shadowFace} />
				)}
			</g>
			{drawArm(L, 1)}
			{/* weapon in the right hand */}
			<g transform={`translate(${R.hx} ${R.hy}) rotate(${-R.fa + vajraAng + 90})`}>
				<Vajra len={250} energy={energy} t={t} />
			</g>
			<path d={`M${R.hx - 18},${R.hy - 8} q18,-10 36,0`} stroke={C.skinShade} strokeWidth={4} fill="none" />
		</g>
	);
};

/** Indra's head in the full figure (small scale). Local: chin ~ -775. */
const IndraHead: React.FC<{look: number; shadow: number}> = ({look, shadow}) => (
	<g>
		{/* topknot */}
		<ellipse cx={0} cy={-912} rx={24} ry={20} fill={C.hair} />
		<rect x={-20} y={-902} width={40} height={8} rx={3} fill={C.gold} />
		{/* face */}
		<path d={smoothPath([[-44, -868], [-48, -832], [-42, -800], [-22, -778], [0, -772], [22, -778], [42, -800], [48, -832], [44, -868], [0, -886]], true)} fill={C.skin} />
		<path d={smoothPath([[8, -884], [44, -868], [48, -832], [42, -800], [22, -778], [6, -774], [18, -820], [14, -860]], true)} fill={C.skinShade} opacity={0.55} />
		{/* hair framing the face */}
		<path d="M-50,-866 C-40,-900 40,-904 50,-866 C30,-884 -30,-884 -50,-866 Z" fill={C.hair} />
		<path d="M-48,-866 L-56,-790 L-46,-800 L-44,-850 Z M48,-866 L56,-790 L46,-800 L44,-850 Z" fill={C.hair} />
		{/* gold band */}
		<path d="M-47,-864 Q0,-880 47,-864" stroke={C.gold} strokeWidth={5} fill="none" />
		<path d="M0,-878 l5,8 l-5,8 l-5,-8 Z" fill={C.paleGold} />
		{/* brows */}
		<path d="M-34,-846 L-8,-842 L-8,-838 L-32,-840 Z M34,-846 L8,-842 L8,-838 L32,-840 Z" fill={C.hair} />
		{/* eyes */}
		<path d="M-30,-832 Q-20,-838 -10,-832 Q-20,-828 -30,-832 Z M10,-832 Q20,-838 30,-832 Q20,-828 10,-832 Z" fill="#e8dcc8" />
		<circle cx={-20 + look * 3} cy={-832} r={3.2} fill="#120c08" />
		<circle cx={20 + look * 3} cy={-832} r={3.2} fill="#120c08" />
		{/* nose */}
		<path d="M-2,-830 L-8,-808 L6,-806 L4,-830 Z" fill={C.skinShade} opacity={0.6} />
		{/* beard + moustache */}
		<path d={smoothPath([[-46, -820], [-42, -796], [-26, -774], [0, -762], [26, -774], [42, -796], [46, -820], [36, -804], [14, -796], [0, -800], [-14, -796], [-36, -804]], true)} fill={C.hair} />
		<path d="M-16,-798 Q0,-806 16,-798" stroke={C.hair} strokeWidth={4} fill="none" />
		<path d="M-8,-788 Q0,-784 8,-788" stroke="#3a2016" strokeWidth={3} fill="none" />
		{/* ear rings */}
		<circle cx={-50} cy={-806} r={6} stroke={C.gold} strokeWidth={3} fill="none" />
		<circle cx={50} cy={-806} r={6} stroke={C.gold} strokeWidth={3} fill="none" />
		{shadow > 0 && <rect x={-70} y={-930} width={140} height={170} fill="#000" opacity={shadow} />}
	</g>
);

// ------------------------------------------------------------------ hero close-up face
/** Portrait bust. Local origin: centre of face. Face ~ 520 tall. */
export const IndraFace: React.FC<{t: number; look?: number; wind?: number; light?: number; brow?: number}> = ({t, look = 0, wind = 0.5, light = 1, brow = 0}) => {
	const g = (k: number) => wind * (0.7 + 0.3 * noise(t * 0.8 + k, 77));
	const wave = (k: number, a: number) => Math.sin(t * 2.4 + k) * a * wind;
	return (
		<g>
			{/* hair mass behind */}
			<path
				d={smoothPath(
					[
						[0, -360],
						[-170, -300],
						[-260 - g(1) * 30, -80],
						[-300 - g(2) * 70 + wave(1, 20), 200],
						[-330 - g(3) * 140 + wave(2, 30), 520],
						[-120, 560],
						[120, 560],
						[340 + g(4) * 160 + wave(3, 30), 520],
						[310 + g(5) * 80 + wave(4, 20), 200],
						[260 + g(6) * 30, -80],
						[170, -300],
					],
					true,
				)}
				fill={C.hair}
			/>
			{/* neck + shoulders */}
			<path d="M-110,140 L-120,330 Q0,380 120,330 L110,140 Z" fill={C.skin} />
			<path d="M30,150 L110,140 L120,330 Q80,350 40,352 Z" fill={C.skinShade} opacity={0.6} />
			<path d="M-480,560 C-420,400 -260,330 -120,320 Q0,360 120,320 C260,330 420,400 480,560 Z" fill={C.skin} />
			<path d="M120,320 C260,330 420,400 480,560 L200,560 C190,470 160,380 120,320 Z" fill={C.skinShade} opacity={0.55} />
			<path d="M260,340 C360,360 430,420 470,520 L360,560 C300,470 200,400 120,330 Z" fill={C.blue} />
			<ellipse cx={-380} cy={430} rx={150} ry={90} fill={C.bronze} stroke={C.darkBronze} strokeWidth={6} transform="rotate(-24 -380 430)" />
			<ellipse cx={-380} cy={422} rx={80} ry={44} fill={C.gold} opacity={0.5} transform="rotate(-24 -380 430)" />
			<path d="M-170,330 Q0,440 170,330" stroke={C.gold} strokeWidth={22} fill="none" strokeLinecap="round" />
			<circle cx={0} cy={384} r={16} fill={C.paleGold} />
			{/* face */}
			<path d={smoothPath([[-150, -230], [-168, -120], [-160, -10], [-140, 80], [-96, 170], [-44, 218], [0, 228], [44, 218], [96, 170], [140, 80], [160, -10], [168, -120], [150, -230], [0, -290]], true)} fill={C.skin} />
			<path d={smoothPath([[30, -290], [150, -230], [168, -120], [160, -10], [140, 80], [96, 170], [44, 218], [16, 226], [50, 120], [62, 20], [44, -60], [56, -160]], true)} fill={C.skinShade} opacity={0.62} />
			<path d="M-140,-10 C-120,-30 -90,-30 -70,-10 C-90,10 -120,20 -140,-10 Z" fill={C.skinLight} opacity={0.45} />
			<path d="M-176,-200 C-150,-330 150,-340 176,-200 C120,-262 40,-270 0,-262 C-40,-270 -120,-262 -176,-200 Z" fill={C.hair} />
			<path d="M-172,-200 L-196,160 L-150,40 L-160,-110 Z M172,-200 L196,160 L150,40 L160,-110 Z" fill={C.hair} />
			<ellipse cx={0} cy={-370} rx={80} ry={60} fill={C.hair} />
			<rect x={-66} y={-336} width={132} height={22} rx={8} fill={C.gold} stroke={C.darkBronze} strokeWidth={3} />
			<path d="M-168,-196 Q0,-250 168,-196" stroke={C.gold} strokeWidth={12} fill="none" />
			<g transform="translate(0 -226) rotate(90) scale(0.32)">
				<Vajra len={220} />
			</g>
			<path d={`M-128,${-122 + brow} C-100,${-138 + brow} -60,${-138 + brow} -22,${-118 + brow} L-26,${-104 + brow} C-60,${-118 + brow} -100,${-118 + brow} -126,${-108 + brow} Z`} fill={C.hair} />
			<path d={`M128,${-122 + brow} C100,${-138 + brow} 60,${-138 + brow} 22,${-118 + brow} L26,${-104 + brow} C60,${-118 + brow} 100,${-118 + brow} 126,${-108 + brow} Z`} fill={C.hair} />
			<path d="M84,-148 L64,-92" stroke="#c4906c" strokeWidth={4} opacity={0.8} />
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={`M${s * 116},-76 Q${s * 76},-104 ${s * 30},-80 Q${s * 72},-60 ${s * 116},-76 Z`} fill="#e6d8c2" />
					<circle cx={s * 72 + look * 14} cy={-79} r={15} fill="#2b1a10" />
					<circle cx={s * 72 + look * 14} cy={-79} r={8} fill="#060404" />
					<circle cx={s * 72 + look * 14 - 5} cy={-85} r={3.5} fill="#fff" opacity={0.8} />
					<path d={`M${s * 122},-74 Q${s * 76},-110 ${s * 26},-80`} stroke="#0a0706" strokeWidth={7} fill="none" strokeLinecap="round" />
				</g>
			))}
			<path d="M-10,-80 C-14,-30 -26,6 -34,24 C-20,36 20,36 34,24 C24,8 14,-30 12,-80 Z" fill={C.skinShade} opacity={0.35} />
			<path d="M12,-80 C14,-30 26,8 36,24 C30,32 20,34 10,32 C14,0 10,-40 12,-80 Z" fill={C.skinShade} opacity={0.6} />
			<path d="M-30,30 Q-18,40 -8,34 M30,30 Q18,40 8,34" stroke="#3a2016" strokeWidth={4} fill="none" />
			<path d="M-70,74 C-40,52 -10,56 0,64 C10,56 40,52 70,74 C40,70 14,74 0,80 C-14,74 -40,70 -70,74 Z" fill={C.hair} />
			<path d={smoothPath([[-160, 0], [-150, 90], [-110, 170], [-50, 230], [0, 246], [50, 230], [110, 170], [150, 90], [160, 0], [132, 70], [90, 120], [40, 110], [0, 118], [-40, 110], [-90, 120], [-132, 70]], true)} fill={C.hair} />
			<path d="M-36,100 Q0,92 36,100 Q0,114 -36,100 Z" fill="#4a2418" />
			<circle cx={-178} cy={40} r={20} stroke={C.gold} strokeWidth={8} fill="none" />
			<circle cx={178} cy={40} r={20} stroke={C.gold} strokeWidth={8} fill="none" />
			{light < 1 && <rect x={-600} y={-600} width={1200} height={1200} fill="#000" opacity={1 - light} />}
		</g>
	);
};

// ------------------------------------------------------------------ fist gripping the weapon (close-up / match cut)
export const IndraFist: React.FC<{t: number; energy: number; grip?: number}> = ({t, energy, grip = 1}) => (
	<g>
		<path d="M-150,900 C-170,600 -150,300 -110,120 L110,120 C150,300 170,600 150,900 Z" fill={C.skin} />
		<path d="M40,120 L110,120 C150,300 170,600 150,900 L60,900 C80,600 70,300 40,120 Z" fill={C.skinShade} opacity={0.55} />
		<path d="M-158,560 C-160,420 -150,320 -126,220 L126,220 C150,320 160,420 158,560 Z" fill={C.bronze} stroke={C.darkBronze} strokeWidth={8} />
		{[280, 360, 440, 520].map((y) => (
			<path key={y} d={`M-150,${y} Q0,${y + 22} 150,${y}`} stroke={C.darkBronze} strokeWidth={6} fill="none" opacity={0.7} />
		))}
		<g transform={`scale(1.9)`}>
			<Vajra len={420} energy={energy} t={t} />
		</g>
		<g transform={`translate(0 ${(1 - grip) * 20})`}>
			<path d="M-120,-70 C-130,-20 -130,60 -110,130 L110,130 C130,60 130,-20 120,-70 C60,-110 -60,-110 -120,-70 Z" fill={C.skin} />
			{[-90, -30, 30, 90].map((x, i) => (
				<g key={x}>
					<path d={`M${x - 28},-60 C${x - 30},-90 ${x + 30},-90 ${x + 28},-60 L${x + 26},20 C${x + 20},40 ${x - 20},40 ${x - 26},20 Z`} fill={i % 2 ? C.skin : '#94603f'} stroke={C.skinShade} strokeWidth={5} />
					<path d={`M${x - 20},-10 Q${x},0 ${x + 20},-10`} stroke={C.skinShade} strokeWidth={4} fill="none" />
				</g>
			))}
			<path d="M-130,30 C-150,80 -120,140 -40,130 C20,124 40,90 30,70 C0,80 -60,90 -100,40 Z" fill="#7e5034" stroke={C.skinShade} strokeWidth={5} />
			<path d="M110,-70 L130,40 L110,130 C140,100 150,0 120,-70 Z" fill={C.skinShade} opacity={0.6} />
		</g>
	</g>
);

// ------------------------------------------------------------------ SAGE (seated, front view) - e.g. Bharadwaja
/** Local origin: ground centre. ~620 tall seated. pray 0..1 raises the hands. */
export const Sage: React.FC<{t: number; pray?: number; wind?: number}> = ({t, pray = 0, wind = 0.3}) => {
	const lift = clamp(pray);
	const sway = Math.sin(t * 1.3) * 2;
	const handY = -300 - lift * 330;
	const handX = 110 + lift * 30;
	const beard = (k: number) => Math.sin(t * 1.8 + k) * 6 * wind;
	const skin = '#7c553d';
	const shade = '#523423';
	return (
		<g transform={`rotate(${sway * 0.2} 0 0)`}>
			<path d="M-230,-20 C-230,-110 -120,-150 0,-150 C120,-150 230,-110 230,-20 C150,10 -150,10 -230,-20 Z" fill={C.cream} />
			<path d="M-200,-40 C-120,-90 -40,-80 20,-60 M200,-40 C120,-90 40,-80 -20,-60" stroke="#b9ab90" strokeWidth={8} fill="none" />
			<path d="M60,-150 C150,-140 220,-100 230,-20 C180,0 120,4 80,-10 Z" fill="#b9ab90" opacity={0.6} />
			<path d={smoothPath([[-92, -150], [-104, -280], [-110, -390], [-70, -430], [0, -440], [70, -430], [110, -390], [104, -280], [92, -150]], true)} fill={skin} />
			<path d="M30,-440 L70,-430 L110,-390 L104,-280 L92,-150 L40,-150 Z" fill={shade} opacity={0.5} />
			<path d="M-60,-340 Q-30,-330 -6,-344 M60,-340 Q30,-330 6,-344 M-50,-300 Q0,-292 50,-300" stroke={shade} strokeWidth={3} fill="none" opacity={0.6} />
			<path d="M60,-436 C120,-420 130,-330 110,-240 C80,-200 30,-180 -96,-150 L-92,-190 C-10,-220 60,-280 60,-436 Z" fill={C.cream} />
			<path d="M60,-436 C70,-330 0,-230 -94,-176" stroke="#b9ab90" strokeWidth={5} fill="none" />
			<path d="M-80,-420 L60,-160" stroke="#efe6d0" strokeWidth={3} />
			{[-1, 1].map((s) => {
				const shX = s * 100;
				const shY = -410;
				const elX = s * (150 + lift * 20);
				const elY = -300 - lift * 130;
				const hx = s * handX;
				const hy = handY;
				return (
					<g key={s}>
						<path d={limb(shX, shY, elX, elY, 24, 24, 18)} fill={skin} />
						<path d={limb(elX, elY, hx, hy, 18, 18, 14)} fill={skin} />
						<path d={`M${hx - 26},${hy + 10} C${hx - 30},${hy - 40} ${hx - 10},${hy - 60} ${hx + s * 4},${hy - 64} C${hx + 22},${hy - 60} ${hx + 30},${hy - 30} ${hx + 26},${hy + 10} Z`} fill={skin} stroke={shade} strokeWidth={3} />
						<path d={`M${hx - 14},${hy - 44} L${hx - 14},${hy - 12} M${hx},${hy - 56} L${hx},${hy - 14} M${hx + 14},${hy - 46} L${hx + 14},${hy - 12}`} stroke={shade} strokeWidth={2} opacity={0.6} />
					</g>
				);
			})}
			<path d="M-56,-436 Q0,-330 56,-436" stroke="#5a2e1c" strokeWidth={9} fill="none" strokeDasharray="1 11" strokeLinecap="round" />
			<g transform={`translate(0 -500)`}>
				<path d="M-46,-80 C-60,-150 -30,-210 0,-220 C30,-210 60,-150 46,-80 Z" fill="#cfc8bb" />
				<path d="M-40,-150 Q0,-136 40,-150 M-44,-110 Q0,-96 44,-110" stroke="#9b9384" strokeWidth={5} fill="none" />
				<path d="M-74,-40 C-70,-110 70,-110 74,-40 L74,30 C40,70 -40,70 -74,30 Z" fill={skin} />
				<path d="M20,-100 C60,-90 74,-60 74,-40 L74,30 C60,50 40,60 20,64 Z" fill={shade} opacity={0.5} />
				<path d="M-78,-50 C-80,-110 80,-110 78,-50 C50,-80 -50,-80 -78,-50 Z" fill="#d8d1c4" />
				<path d="M-50,-30 L-20,-28 M50,-30 L20,-28" stroke="#ddd5c7" strokeWidth={7} strokeLinecap="round" />
				<path d="M-44,-12 Q-32,-6 -20,-12 M44,-12 Q32,-6 20,-12" stroke="#1a100a" strokeWidth={4} fill="none" />
				<path d="M-14,-62 L14,-62 M-14,-54 L14,-54 M-14,-46 L14,-46" stroke="#e8e0d0" strokeWidth={3} />
				<circle cx={0} cy={-54} r={4} fill={C.red} />
				<path d={smoothPath([[-74, 0], [-80, 70], [-60 + beard(1), 160], [-30 + beard(2), 250], [0 + beard(3), 300], [30 + beard(2), 250], [60 + beard(1), 160], [80, 70], [74, 0], [40, 30], [0, 36], [-40, 30]], true)} fill="#e6e0d4" />
				<path d={`M-30,60 Q${-20 + beard(1)},160 ${-6 + beard(3)},260 M30,60 Q${20 + beard(2)},160 ${8 + beard(3)},250 M0,50 L${beard(3)},280`} stroke="#b5ad9e" strokeWidth={3} fill="none" />
				<path d="M-40,26 Q0,10 40,26" stroke="#cfc8bb" strokeWidth={10} fill="none" strokeLinecap="round" />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ MORTAL KING (profile, facing right, standing in chariot) - e.g. Sudas
/** Local origin: feet. ~560 tall. Distinctive: tall red headwrap with a crest, red cloak, grey-streaked beard, bow. */
export const Sudas: React.FC<{t: number; wind?: number; bowUp?: number}> = ({t, wind = 1, bowUp = 0}) => {
	const g = (k: number) => Math.sin(t * 3 + k) * 12 * wind;
	const skin = '#7f5236';
	return (
		<g>
			<path d={smoothPath([[-10, -470], [-90 + g(1), -420], [-170 + g(2), -340], [-230 + g(3), -250], [-150, -230], [-60, -300], [-20, -380]], true)} fill={C.red} />
			<path d={smoothPath([[-10, -470], [-90 + g(1), -420], [-170 + g(2), -340], [-230 + g(3), -250]])} stroke={C.gold} strokeWidth={4} fill="none" opacity={0.7} />
			<path d="M-34,-260 L-40,0 L-10,0 L-4,-260 Z M4,-260 L14,0 L44,0 L34,-260 Z" fill={C.earth} />
			<path d="M-46,-470 C-60,-400 -56,-320 -40,-250 L46,-250 C60,-330 60,-400 40,-470 Z" fill="#5a3b24" />
			<path d="M-40,-420 L46,-420 M-44,-370 L50,-370 M-44,-320 L52,-320" stroke="#3b2516" strokeWidth={5} />
			<path d="M-44,-270 L48,-270 L52,-240 L-48,-240 Z" fill={C.bronze} />
			<path d={limb(30, -450, 110, -380 - bowUp * 60, 18, 18, 14)} fill={skin} />
			<path d={smoothPath([[118, -560 - bowUp * 60], [150, -420 - bowUp * 60], [118, -250 - bowUp * 60]])} stroke="#3b2516" strokeWidth={8} fill="none" />
			<path d={`M118,${-560 - bowUp * 60} L118,${-250 - bowUp * 60}`} stroke="#d8cfbd" strokeWidth={2} />
			<g transform="translate(6 -520)">
				<path d="M-30,-40 C-34,-80 30,-90 40,-50 L46,-30 L58,-16 L46,-10 L48,10 C40,30 10,40 -10,34 C-30,20 -34,0 -30,-40 Z" fill={skin} />
				<path d="M-10,0 C0,30 20,50 44,40 C50,20 48,4 44,-4 C30,8 10,6 -10,0 Z" fill="#3b3430" />
				<path d="M6,20 L30,36 M14,10 L40,22" stroke="#9a948c" strokeWidth={3} />
				<path d="M-38,-40 C-44,-90 -20,-140 10,-150 C40,-130 48,-80 40,-46 Z" fill={C.red} />
				<path d="M-36,-50 Q0,-62 40,-52" stroke={C.gold} strokeWidth={6} fill="none" />
				<path d={`M10,-150 C0,-190 ${-20 + g(5)},-220 ${-50 + g(6)},-226`} stroke={C.paleGold} strokeWidth={7} fill="none" strokeLinecap="round" />
				<circle cx={30} cy={-36} r={4} fill="#160d08" />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ generic warrior silhouette (set fill + style.color on a parent)
export const Warrior: React.FC<{t: number; seed: number; facing?: 1 | -1; shield?: boolean; bob?: number}> = ({t, seed, facing = 1, shield = true, bob = 1}) => {
	const r = rng(seed);
	const h = 0.9 + r() * 0.2;
	const ph = r() * 6;
	const y = Math.sin(t * 2 + ph) * 2 * bob;
	return (
		<g transform={`translate(0 ${y}) scale(${facing * h} ${h})`}>
			<path d="M-14,0 L-10,-60 L-16,-120 L-20,-150 C-20,-170 20,-170 20,-150 L16,-120 L10,-60 L14,0 L4,0 L0,-56 L-4,0 Z" />
			<circle cx={0} cy={-178} r={15} />
			<rect x={-16} y={-190} width={32} height={6} />
			<path d={`M18,-130 L${24},-${250 + r() * 30}`} strokeWidth={4} stroke="currentColor" />
			<path d={`M${24},-${250 + r() * 30} l-6,18 l12,0 Z`} />
			{shield && <ellipse cx={-14} cy={-110} rx={24} ry={32} />}
		</g>
	);
};

// ------------------------------------------------------------------ horse (side view, facing right)
export const Horse: React.FC<{t: number; gallop?: number; phase?: number; fill?: string; mane?: string; rear?: number}> = ({t, gallop = 1, phase = 0, fill = '#2a211b', mane = '#120d0a', rear = 0}) => {
	const cyc = t * 2.6 * gallop + phase;
	const leg = (base: number, off: number) => {
		const a = Math.sin(cyc * Math.PI * 2 + off) * 32 * gallop;
		const b = Math.max(0, Math.sin(cyc * Math.PI * 2 + off + 1.2)) * 60 * gallop;
		const kx = base + Math.sin(rad(a)) * 70;
		const ky = -95 + Math.cos(rad(a)) * 70;
		const fx = kx + Math.sin(rad(a - b)) * 70;
		const fy = ky + Math.cos(rad(a - b)) * 70;
		return (
			<g key={base + off}>
				<path d={limb(base, -110, kx, ky, 14, 15, 9)} fill={fill} />
				<path d={limb(kx, ky, fx, fy, 8, 7, 6)} fill={fill} />
				<rect x={fx - 8} y={fy - 4} width={16} height={9} rx={2} fill={mane} />
			</g>
		);
	};
	const bodyBob = Math.sin(cyc * Math.PI * 4) * 4 * gallop;
	return (
		<g transform={`translate(0 ${bodyBob}) rotate(${-rear * 25} -60 -110)`}>
			{leg(-70, 0.6)}
			{leg(70, 3.6)}
			<path d="M-110,-150 C-130,-190 -60,-205 20,-200 C70,-198 96,-212 120,-250 C134,-276 150,-300 170,-296 L205,-268 C214,-258 210,-248 198,-248 L168,-252 C150,-220 140,-180 120,-150 C100,-110 40,-102 -40,-104 C-90,-106 -110,-120 -110,-150 Z" fill={fill} />
			<path d={`M118,-252 C130,-280 150,-300 168,-298 C150,-280 ${136 + Math.sin(cyc * 6) * 6},-250 128,-226 Z`} fill={mane} />
			<path d={`M-112,-160 C-150,-160 ${-180 + Math.sin(cyc * 6.2) * 10},-130 ${-200 + Math.sin(cyc * 6.2) * 14},-90 C-160,-120 -140,-130 -110,-140 Z`} fill={mane} />
			<circle cx={182} cy={-280} r={3} fill="#000" />
			{leg(-50, 2.1)}
			{leg(90, 5.1)}
		</g>
	);
};

/** Two-wheeled spoked war chariot (side view, facing right). Origin: ground under the axle. */
export const Chariot: React.FC<{t: number; speed?: number; fill?: string; trim?: string; children?: React.ReactNode}> = ({t, speed = 1, fill = '#3a2a1c', trim = C.bronze, children}) => {
	const rot = t * speed * 260;
	return (
		<g>
			<path d="M40,-120 C120,-120 220,-150 300,-170" stroke={fill} strokeWidth={10} fill="none" />
			{children}
			<path d="M-80,-120 L70,-120 L60,-210 C40,-230 -40,-230 -70,-200 Z" fill={fill} />
			<path d="M-74,-200 C-40,-226 40,-226 60,-210" stroke={trim} strokeWidth={6} fill="none" />
			<g transform={`translate(0 -78) rotate(${rot})`}>
				<circle r={78} stroke={fill} strokeWidth={12} fill="none" />
				<circle r={78} stroke={trim} strokeWidth={3} fill="none" opacity={0.7} />
				{Array.from({length: 6}, (_, i) => (
					<line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 3) * 74} y2={Math.sin((i * Math.PI) / 3) * 74} stroke={fill} strokeWidth={6} />
				))}
				<circle r={12} fill={trim} />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ zebu cattle (side view, facing right)
export const Cow: React.FC<{t: number; walk?: number; calf?: boolean; fill?: string; phase?: number; headDown?: number}> = ({t, walk = 0.5, calf = false, fill = '#cdbfa8', phase = 0, headDown = 0}) => {
	const cyc = t * 1.6 * Math.max(walk, 0.0001) + phase;
	const s = calf ? 0.55 : 1;
	const shade = '#7a6a55';
	const leg = (x: number, off: number) => {
		const a = Math.sin(cyc * Math.PI * 2 + off) * 18 * walk;
		return <path key={x + off} d={limb(x, -90, x + Math.sin(rad(a)) * 90, -90 + Math.cos(rad(a)) * 90, 12, 11, 7)} fill={fill} stroke={shade} strokeWidth={2} />;
	};
	return (
		<g transform={`scale(${s})`}>
			{leg(-80, 0)}
			{leg(70, Math.PI)}
			<path d="M-120,-120 C-130,-170 -60,-190 20,-186 C60,-184 70,-196 90,-190 C110,-182 120,-150 116,-110 C100,-80 40,-80 -40,-84 C-100,-86 -120,-100 -120,-120 Z" fill={fill} stroke={shade} strokeWidth={2} />
			{!calf && <path d="M40,-186 C50,-230 90,-226 96,-190 Z" fill={fill} stroke={shade} strokeWidth={2} />}
			<g transform={`rotate(${headDown * 35} 110 -160)`}>
				<path d="M100,-170 C130,-176 160,-160 176,-120 C180,-104 168,-98 156,-104 L120,-120 Z" fill={fill} stroke={shade} strokeWidth={2} />
				{!calf && <path d="M128,-172 C126,-200 140,-214 150,-212 C142,-204 140,-190 140,-172 Z" fill="#3a3028" />}
				<circle cx={146} cy={-142} r={3.5} fill="#1a120c" />
				<path d="M128,-160 L118,-176 L136,-170 Z" fill={shade} />
			</g>
			<path d="M96,-120 C100,-90 110,-80 120,-104 Z" fill={shade} opacity={0.6} />
			{leg(-60, Math.PI)}
			{leg(90, 0)}
			<path d={`M-120,-130 C-140,-120 ${-146 + Math.sin(t * 3) * 6},-80 -140,-50`} stroke={shade} strokeWidth={5} fill="none" />
		</g>
	);
};

// ------------------------------------------------------------------ throne (front view) as shards that crack apart
export const Throne: React.FC<{crack: number; fill?: string; edge?: string}> = ({crack, fill = '#16161a', edge = '#34343c'}) => {
	const shards: {d: string; dx: number; dy: number; rot: number}[] = [
		{d: 'M-260,-1100 L0,-1260 L-30,-900 L-200,-860 Z', dx: -60, dy: -50, rot: -8},
		{d: 'M0,-1260 L260,-1100 L200,-860 L-30,-900 Z', dx: 60, dy: -40, rot: 7},
		{d: 'M-200,-860 L-30,-900 L-10,-560 L-210,-560 Z', dx: -40, dy: 10, rot: -4},
		{d: 'M-30,-900 L200,-860 L210,-560 L-10,-560 Z', dx: 46, dy: 16, rot: 5},
		{d: 'M-330,-560 L-10,-560 L-20,-470 L-330,-470 Z', dx: -50, dy: 30, rot: -3},
		{d: 'M-10,-560 L330,-560 L330,-470 L-20,-470 Z', dx: 50, dy: 34, rot: 3},
		{d: 'M-330,-740 L-250,-740 L-250,-560 L-330,-560 Z', dx: -80, dy: -20, rot: -10},
		{d: 'M250,-740 L330,-740 L330,-560 L250,-560 Z', dx: 80, dy: -16, rot: 10},
		{d: 'M-360,-470 L360,-470 L400,-300 L-400,-300 Z', dx: 0, dy: 50, rot: 1},
		{d: 'M-440,-300 L440,-300 L460,-200 L-460,-200 Z', dx: 0, dy: 70, rot: -1},
	];
	return (
		<g>
			{shards.map((s, i) => (
				<g key={i} transform={`translate(${s.dx * crack} ${s.dy * crack}) rotate(${s.rot * crack})`}>
					<path d={s.d} fill={fill} stroke={edge} strokeWidth={3} />
				</g>
			))}
			<path d="M-200,-880 C-200,-1080 200,-1080 200,-880" stroke={edge} strokeWidth={6} fill="none" opacity={1 - crack} />
		</g>
	);
};
