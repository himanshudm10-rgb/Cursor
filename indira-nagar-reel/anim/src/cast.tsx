// The cast of "Drona and Karna". Built with the same toolkit as characters.tsx
// (limb(), smoothPath(), the C palette, CharFX for light) so the world stays consistent.
// Full figures: origin between the feet, ~900 units tall, head top at y = -912, front view.
// Signature silhouettes:
//   Drona       - tall grey-white jata bun + long white beard, saffron shawl, great bow staff
//   Karna       - golden scaled kavacha fused to the chest + sun-disc kundala earrings + sun bow, loose black hair
//   Parashurama - towering jata with rudraksha, deerskin over one shoulder, ash tripundra, the crescent axe (parashu)
//   Arjuna      - tall gold kirita crown, indigo sash, the giant Gandiva bow
import React from 'react';
import {C, clamp, noise, rng, smoothPath} from './lib';
import {limb} from './characters';

const rad = (d: number) => (d * Math.PI) / 180;

// ------------------------------------------------------------------ props
/** Recurve bow, vertical, origin at the grip. pull 0..1 draws the string toward (-pull*len*0.42) on x (string side = -x). */
export const Bow: React.FC<{len?: number; pull?: number; wood?: string; trim?: string; glow?: number; stringTo?: [number, number]}> = ({len = 520, pull = 0, wood = '#3b2414', trim = C.gold, glow = 0, stringTo}) => {
	const h = len / 2;
	const bend = 46 + pull * 30;
	const limbD = smoothPath([
		[-18, -h],
		[-6, -h * 0.86],
		[bend * 0.5, -h * 0.55],
		[bend, -h * 0.22],
		[bend * 0.92, 0],
		[bend, h * 0.22],
		[bend * 0.5, h * 0.55],
		[-6, h * 0.86],
		[-18, h],
	]);
	const sx = stringTo ? stringTo[0] : -pull * len * 0.42 - 14;
	const sy = stringTo ? stringTo[1] : 0;
	return (
		<g>
			{glow > 0.02 && <path d={limbD} stroke={C.paleGold} strokeWidth={40} fill="none" opacity={glow * 0.5} filter="url(#b14)" />}
			<path d={`M-18,${-h} L${sx},${sy} L-18,${h}`} stroke="#d8cfbd" strokeWidth={2.4} fill="none" opacity={0.85} />
			<path d={limbD} stroke={wood} strokeWidth={15} fill="none" strokeLinecap="round" />
			<path d={limbD} stroke={trim} strokeWidth={3} fill="none" opacity={0.55} strokeDasharray="30 60" />
			<rect x={bend * 0.92 - 11} y={-26} width={22} height={52} rx={6} fill={trim} stroke="#2a1a0c" strokeWidth={2} />
			<circle cx={-18} cy={-h} r={7} fill={trim} />
			<circle cx={-18} cy={h} r={7} fill={trim} />
		</g>
	);
};

/** Arrow lying along +x, nock at origin. */
export const Arrow: React.FC<{len?: number; glow?: number; head?: string}> = ({len = 420, glow = 0, head = '#a9b0b8'}) => (
	<g>
		{glow > 0.02 && <path d={`M0,0 L${len},0`} stroke={C.paleGold} strokeWidth={30} opacity={glow * 0.6} filter="url(#b14)" />}
		<path d={`M0,0 L${len - 30},0`} stroke="#5a3a1c" strokeWidth={6} />
		<path d={`M${len - 36},-11 L${len},0 L${len - 36},11 Z`} fill={head} stroke="#2a2a2a" strokeWidth={1.5} />
		<path d="M4,0 L-22,-16 L14,-2 Z M4,0 L-22,16 L14,2 Z" fill={C.cream} />
	</g>
);

/** Parashurama's axe: long haft along +y from the grip, crescent blade at the top (-y). */
export const Parashu: React.FC<{len?: number; glow?: number}> = ({len = 760, glow = 0}) => (
	<g>
		<rect x={-9} y={-len * 0.62} width={18} height={len} rx={8} fill="#4a2e18" stroke="#24150a" strokeWidth={2} />
		{[0.1, 0.25, 0.4].map((k) => (
			<rect key={k} x={-11} y={-len * 0.62 + len * k} width={22} height={10} rx={3} fill={C.bronze} />
		))}
		<g transform={`translate(0 ${-len * 0.55})`}>
			{glow > 0.02 && <ellipse cx={70} cy={0} rx={150} ry={130} fill="#ffd79a" opacity={glow * 0.45} filter="url(#b24)" />}
			<path d="M6,-46 C70,-120 170,-110 190,-10 C196,30 180,90 150,120 C130,60 90,30 6,40 Z" fill="#8f99a3" stroke="#2f343a" strokeWidth={3} />
			<path d="M150,120 C180,90 196,30 190,-10 C186,-40 176,-66 160,-82 C178,-40 180,40 150,120 Z" fill="#dfe6ee" opacity={0.75} />
			<path d="M6,-30 C60,-70 110,-70 130,-20" stroke="#5d656e" strokeWidth={4} fill="none" />
			<path d="M6,-46 L-40,-30 L-40,24 L6,40 Z" fill="#6f7882" stroke="#2f343a" strokeWidth={3} />
			<circle cx={-16} cy={-3} r={9} fill={C.gold} />
		</g>
	</g>
);

// ------------------------------------------------------------------ shared body construction
export type Pose = {
	t: number;
	rArm?: number; // screen-left arm: shoulder angle (deg from hanging down, outward +)
	rElbow?: number;
	lArm?: number; // screen-right arm
	lElbow?: number;
	rHand?: 'fist' | 'palm' | 'grip';
	lHand?: 'fist' | 'palm' | 'grip';
	wind?: number;
	windDir?: 1 | -1;
	head?: number; // tilt deg
	look?: number;
	back?: boolean;
	kneel?: number; // 0..1, sinks the figure onto one knee
	oneLeg?: boolean; // penance: one leg folded against the other knee
};

type Look = {
	skin: string;
	shade: string;
	shoulder: number; // shoulder half-width
	waist: number;
	armW: number;
	dhoti: string;
	dhotiShade: string;
	trim: string;
};

const arm = (side: -1 | 1, sh: number, a: number, b: number) => {
	const sx = side * sh;
	const sy = -712;
	const ux = sx + side * Math.sin(rad(a)) * 165;
	const uy = sy + Math.cos(rad(a)) * 165;
	const fa = a + b;
	const hx = ux + side * Math.sin(rad(fa)) * 150;
	const hy = uy + Math.cos(rad(fa)) * 150;
	// screen angle of the forearm direction (for orienting hands/props)
	const dir = Math.atan2(Math.cos(rad(fa)), side * Math.sin(rad(fa)));
	return {sx, sy, ux, uy, hx, hy, fa, dir, side};
};
type Arm = ReturnType<typeof arm>;

const Hand: React.FC<{A: Arm; kind: 'fist' | 'palm' | 'grip'; skin: string; shade: string}> = ({A, kind, skin, shade}) => {
	const deg = (A.dir * 180) / Math.PI - 90; // local +y along the forearm
	if (kind === 'palm') {
		return (
			<g transform={`translate(${A.hx} ${A.hy}) rotate(${deg})`}>
				<path d="M-24,-6 C-28,20 -26,44 -20,62 L-14,96 C-12,104 -4,104 -4,96 L-2,70 L2,108 C4,116 12,116 13,108 L14,72 L20,102 C22,110 30,108 30,100 L26,66 L32,86 C34,94 42,92 40,84 L34,40 C32,20 30,4 26,-8 Z" fill={skin} />
				<path d="M-24,-6 C-40,10 -46,30 -40,40 C-34,44 -28,36 -24,26 Z" fill={skin} />
				<path d="M6,30 C14,40 22,44 30,40 M-2,70 L-4,52 M14,72 L12,52" stroke={shade} strokeWidth={2.5} fill="none" opacity={0.6} />
				<path d="M10,-8 L26,-8 L34,40 L22,60 Z" fill={shade} opacity={0.35} />
			</g>
		);
	}
	return (
		<g>
			<circle cx={A.hx} cy={A.hy} r={kind === 'grip' ? 22 : 24} fill={skin} />
			<circle cx={A.hx + A.side * 6} cy={A.hy + 4} r={13} fill={shade} opacity={0.4} />
			<path d={`M${A.hx - 16},${A.hy - 6} q16,-10 32,0`} stroke={shade} strokeWidth={3} fill="none" opacity={0.7} />
		</g>
	);
};

const drawArm = (A: Arm, L: Look, extra?: (A: Arm) => React.ReactNode) => (
	<g>
		<path d={limb(A.sx, A.sy, A.ux, A.uy, L.armW, L.armW + 2, L.armW * 0.75)} fill={L.skin} />
		<path d={limb(A.sx + 8, A.sy + 6, A.ux + 6, A.uy, L.armW * 0.45, L.armW * 0.55, L.armW * 0.35)} fill={L.shade} opacity={A.side === 1 ? 0.55 : 0.25} />
		<path d={limb(A.ux, A.uy, A.hx, A.hy, L.armW * 0.72, L.armW * 0.78, L.armW * 0.52)} fill={L.skin} />
		{extra?.(A)}
	</g>
);

const along = (A: Arm, k: number, upper = false): [number, number] =>
	upper ? [A.sx + (A.ux - A.sx) * k, A.sy + (A.uy - A.sy) * k] : [A.ux + (A.hx - A.ux) * k, A.uy + (A.hy - A.uy) * k];

/** Torso + legs shared by every adult hero. Returns pieces to compose in the right z-order. */
const body = (p: Pose, L: Look) => {
	const w = (p.wind ?? 0.5) * (p.windDir ?? 1) * (p.back ? -1 : 1);
	const gust = (k: number) => w * (0.75 + 0.25 * noise(p.t * 0.9 + k, 41));
	const sh = L.shoulder;
	const wa = L.waist;
	const hipY = -470;
	const torsoD = smoothPath(
		[
			[0, -768],
			[-36, -762],
			[-sh * 0.73, -744],
			[-sh * 1.19, -716],
			[-sh * 1.15, -668],
			[-sh * 0.95, -640],
			[-wa * 1.3, -582],
			[-wa, -500],
			[-wa * 1.04, hipY],
			[wa * 1.04, hipY],
			[wa, -500],
			[wa * 1.3, -582],
			[sh * 0.95, -640],
			[sh * 1.15, -668],
			[sh * 1.19, -716],
			[sh * 0.73, -744],
			[36, -762],
		],
		true,
	);
	const kneel = clamp(p.kneel ?? 0);
	let legs: React.ReactNode;
	if (p.oneLeg) {
		legs = (
			<g>
				<path d={limb(-40, -236, -46, -22, 40, 42, 20)} fill={L.skin} />
				<path d="M-70,-24 C-82,-14 -86,0 -70,2 L-28,2 C-20,-6 -26,-22 -34,-26 Z" fill={L.shade} />
				{/* folded leg: thigh out to the side, foot pressed to the standing knee */}
				<path d={limb(60, -400, 190, -270, 42, 42, 30)} fill={L.skin} />
				<path d={limb(190, -270, -10, -250, 30, 30, 20)} fill={L.skin} />
				<path d={limb(186, -280, 40, -262, 12, 12, 8)} fill={L.shade} opacity={0.5} />
				<path d={smoothPath([[-100, -482], [-110, -380], [-90, -300], [10, -300], [120, -360], [100, -482]], true)} fill={L.dhoti} />
				<path d={smoothPath([[-90, -300], [10, -300], [120, -360]])} stroke={L.trim} strokeWidth={6} fill="none" />
			</g>
		);
	} else {
		const ky = kneel * 200;
		legs = (
			<g>
				{kneel > 0.02 ? (
					<g>
						{/* back knee on the ground, front shin vertical */}
						<path d={limb(-58, -236 + ky, -130, -22, 40, 40, 22)} fill={L.skin} />
						<path d={limb(-130, -30, -250, -10, 22, 20, 16)} fill={L.shade} />
						<path d={limb(70, -236 + ky * 0.4, 96, -22, 40, 42, 20)} fill={L.skin} />
						<path d="M120,-24 C132,-14 136,0 120,2 L78,2 C70,-6 76,-22 84,-26 Z" fill={L.shade} />
					</g>
				) : (
					<g>
						<path d={limb(-58, -236, -76, -22, 40, 42, 20)} fill={L.skin} />
						<path d={limb(58, -236, 76, -22, 40, 42, 20)} fill={L.skin} />
						<path d={limb(62, -220, 78, -30, 16, 16, 9)} fill={L.shade} opacity={0.55} />
						<path d="M-100,-24 C-112,-14 -116,0 -100,2 L-58,2 C-50,-6 -56,-22 -64,-26 Z" fill={L.shade} />
						<path d="M100,-24 C112,-14 116,0 100,2 L58,2 C50,-6 56,-22 64,-26 Z" fill={L.shade} />
					</g>
				)}
				<rect x={-96} y={-52} width={40} height={10} rx={4} fill={L.trim} opacity={kneel > 0.02 ? 0 : 0.9} />
				<rect x={56} y={-52} width={40} height={10} rx={4} fill={L.trim} opacity={kneel > 0.02 ? 0 : 0.9} />
				<path
					d={smoothPath(
						[
							[-100, -482],
							[-116, -400],
							[-118 - gust(30) * 8, -300 + ky * 0.5],
							[-100 - gust(31) * 12, -196 + ky * 0.6],
							[-30, -184 + ky * 0.4],
							[-6, -262 + ky * 0.3],
							[6, -262 + ky * 0.3],
							[30, -184 + ky * 0.2],
							[100 + gust(32) * 12, -196 + ky * 0.2],
							[118 + gust(33) * 8, -300],
							[116, -400],
							[100, -482],
						],
						true,
					)}
					fill={L.dhoti}
				/>
				<path d={smoothPath([[30, -470], [60, -360], [70, -250], [92, -186]])} stroke={L.dhotiShade} strokeWidth={14} fill="none" opacity={0.8} />
				<path d={smoothPath([[-30, -470], [-55, -350], [-70, -240]])} stroke={L.dhotiShade} strokeWidth={8} fill="none" opacity={0.5} />
				<path d={smoothPath([[-100 - gust(31) * 12, -196 + ky * 0.6], [-30, -184 + ky * 0.4]])} stroke={L.trim} strokeWidth={7} fill="none" />
				<path d={smoothPath([[30, -184 + ky * 0.2], [100 + gust(32) * 12, -196 + ky * 0.2]])} stroke={L.trim} strokeWidth={7} fill="none" />
			</g>
		);
	}
	const torso = (
		<g>
			<path d={torsoD} fill={L.skin} />
			{p.back ? (
				<g>
					<path d="M0,-760 L0,-500" stroke={L.shade} strokeWidth={6} opacity={0.6} />
					<path d="M-30,-720 C-80,-700 -110,-650 -100,-600 C-70,-620 -40,-660 -30,-720 Z M30,-720 C80,-700 110,-650 100,-600 C70,-620 40,-660 30,-720 Z" fill={L.shade} opacity={0.55} />
				</g>
			) : (
				<g>
					<path d="M-120,-650 C-90,-610 -30,-608 -6,-640 C-30,-622 -90,-624 -120,-650 Z" fill={L.shade} opacity={0.55} />
					<path d="M120,-650 C90,-606 30,-606 6,-640 C30,-618 90,-620 120,-650 Z" fill={L.shade} opacity={0.7} />
					<path d="M40,-600 C70,-560 80,-520 90,-500 L96,-470 L40,-470 Z" fill={L.shade} opacity={0.5} />
					<path d="M0,-630 L0,-500" stroke={L.shade} strokeWidth={4} opacity={0.45} />
				</g>
			)}
			<path d="M-30,-790 L-34,-750 Q0,-738 34,-750 L30,-790 Z" fill={L.skin} />
			<path d="M8,-786 L30,-790 L34,-752 Q20,-746 10,-748 Z" fill={L.shade} opacity={0.6} />
		</g>
	);
	const breathe = (n: React.ReactNode) => {
		const br = Math.sin(p.t * 1.6) * 0.006;
		return <g transform={`translate(0 -600) scale(1 ${1 + br}) translate(0 600)`}>{n}</g>;
	};
	return {torso, legs, breathe, gust, kneelY: kneel * 150};
};

const wrap = (p: Pose, kneelY: number, children: React.ReactNode) => (
	<g transform={`${p.back ? 'scale(-1 1) ' : ''}translate(0 ${kneelY})`}>{children}</g>
);

// ------------------------------------------------------------------ DRONA
const DRONA: Look = {skin: '#86573b', shade: '#573421', shoulder: 132, waist: 88, armW: 34, dhoti: '#9a5226', dhotiShade: '#6a3416', trim: C.gold};
const beardC = '#d9d2c4';
const beardS = '#a9a194';

/** Matted grey locks coiled into a knot on the crown, tied with rudraksha; two loose locks fall behind. */
const DronaJata: React.FC = () => (
	<g>
		<path d="M-44,-880 C-60,-860 -66,-820 -58,-770 L-46,-772 C-50,-820 -46,-850 -36,-872 Z M44,-880 C60,-860 66,-820 58,-770 L46,-772 C50,-820 46,-850 36,-872 Z" fill="#bdb5a7" />
		<path d="M-46,-884 C-40,-912 40,-916 46,-884 Z" fill="#cfc8bb" />
		<ellipse cx={0} cy={-918} rx={40} ry={22} fill="#cfc8bb" />
		<ellipse cx={-4} cy={-944} rx={30} ry={18} fill="#c4bdaf" />
		<ellipse cx={2} cy={-964} rx={20} ry={13} fill="#cfc8bb" />
		<path d="M-36,-924 C-20,-934 10,-936 36,-922 M-26,-948 C-10,-956 14,-956 28,-944 M-30,-910 C-12,-900 14,-900 34,-912" stroke="#9b9384" strokeWidth={3} fill="none" />
		<path d="M14,-960 C30,-950 40,-930 40,-906 L26,-900 Z" fill="#9b9384" opacity={0.5} />
		<path d="M-40,-904 Q0,-892 40,-904" stroke="#5a2e1c" strokeWidth={7} strokeDasharray="1 9" strokeLinecap="round" fill="none" />
	</g>
);

const DronaHead: React.FC<{t: number; look: number; wind: number; stern?: number}> = ({t, look, wind, stern = 0}) => {
	const bw = (k: number) => Math.sin(t * 1.8 + k) * 5 * wind;
	return (
		<g>
			{/* tall jata bun, wrapped with rudraksha */}
			<DronaJata />
			{/* face */}
			<path d={smoothPath([[-42, -868], [-46, -832], [-40, -800], [-22, -780], [0, -774], [22, -780], [40, -800], [46, -832], [42, -868], [0, -884]], true)} fill={DRONA.skin} />
			<path d={smoothPath([[8, -882], [42, -868], [46, -832], [40, -800], [22, -780], [6, -776], [18, -820], [14, -860]], true)} fill={DRONA.shade} opacity={0.55} />
			{/* hairline + grey locks at the temples */}
			<path d="M-48,-866 C-40,-896 40,-900 48,-866 C30,-882 -30,-882 -48,-866 Z" fill="#cfc8bb" />
			<path d="M-46,-866 L-54,-800 L-44,-808 L-42,-852 Z M46,-866 L54,-800 L44,-808 L42,-852 Z" fill="#bdb5a7" />
			{/* tripundra (ash) + red dot */}
			<path d="M-22,-868 L22,-868 M-24,-861 L24,-861 M-22,-854 L22,-854" stroke="#ece4d4" strokeWidth={3} />
			<circle cx={0} cy={-861} r={3.4} fill={C.red} />
			{/* heavy grey brows (stern lowers them) */}
			<path d={`M-34,${-846 + stern * 3} L-8,${-842 + stern * 5} L-8,${-838 + stern * 5} L-32,${-840 + stern * 2} Z M34,${-846 + stern * 3} L8,${-842 + stern * 5} L8,${-838 + stern * 5} L32,${-840 + stern * 2} Z`} fill="#e3ddd0" />
			<path d="M-30,-832 Q-20,-837 -10,-832 Q-20,-829 -30,-832 Z M10,-832 Q20,-837 30,-832 Q20,-829 10,-832 Z" fill="#e8dcc8" />
			<circle cx={-20 + look * 3} cy={-832} r={3} fill="#120c08" />
			<circle cx={20 + look * 3} cy={-832} r={3} fill="#120c08" />
			<path d="M-32,-826 Q-20,-822 -10,-826 M10,-826 Q20,-822 32,-826" stroke={DRONA.shade} strokeWidth={2} fill="none" opacity={0.8} />
			<path d="M-2,-830 L-8,-808 L6,-806 L4,-830 Z" fill={DRONA.shade} opacity={0.6} />
			{/* long white beard (moves in the wind) */}
			<path d={smoothPath([[-46, -822], [-50, -780], [-40 + bw(1), -720], [-24 + bw(2), -660], [0 + bw(3), -630], [24 + bw(2), -660], [40 + bw(1), -720], [50, -780], [46, -822], [34, -806], [14, -798], [0, -802], [-14, -798], [-34, -806]], true)} fill={beardC} />
			<path d={`M-22,-790 Q${-16 + bw(1)},-720 ${-6 + bw(3)},-650 M22,-790 Q${16 + bw(2)},-720 ${6 + bw(3)},-656 M0,-796 L${bw(3)},-640`} stroke={beardS} strokeWidth={2.5} fill="none" />
			<path d="M-20,-800 Q0,-810 20,-800" stroke="#e8e2d6" strokeWidth={7} fill="none" strokeLinecap="round" />
			{/* rudraksha ear studs */}
			<circle cx={-48} cy={-812} r={5} fill="#5a2e1c" />
			<circle cx={48} cy={-812} r={5} fill="#5a2e1c" />
		</g>
	);
};

export const Drona: React.FC<Pose & {bow?: boolean; stern?: number; shawl?: string}> = (p) => {
	const {t, rArm = 10, rElbow = 6, lArm = 22, lElbow = -40, rHand = 'grip', lHand = 'fist', look = 0, head = 0, bow = true, stern = 0, shawl = '#b8642a'} = p;
	const b = body(p, DRONA);
	const R = arm(-1, DRONA.shoulder, rArm, rElbow);
	const L = arm(1, DRONA.shoulder, lArm, lElbow);
	const g = b.gust;
	const bracelet = (A: Arm) => {
		const [x1, y1] = along(A, 0.82);
		const [x2, y2] = along(A, 0.9);
		return <path d={limb(x1, y1, x2, y2, 26, 26, 24)} fill="#5a2e1c" />;
	};
	return wrap(
		p,
		b.kneelY,
		<g>
			{/* shawl tail behind, streaming downwind */}
			<path d={smoothPath([[120, -740], [180 + g(10) * 60, -660], [210 + g(11) * 140, -540], [230 + g(12) * 200, -430], [160 + g(13) * 140, -420], [120, -560], [90, -690]], true)} fill={shawl} />
			<path d={smoothPath([[180 + g(10) * 60, -660], [210 + g(11) * 140, -540], [230 + g(12) * 200, -430]])} stroke="#7a3a14" strokeWidth={5} fill="none" opacity={0.6} />
			{drawArm(R, DRONA, bracelet)}
			<Hand A={R} kind={rHand} skin={DRONA.skin} shade={DRONA.shade} />
			{bow && (
				<g transform={`translate(${R.hx} ${R.hy}) scale(-1 1)`}>
					{/* the great bow held upright like a staff */}
					<Bow len={760} wood="#2e1c10" trim={C.gold} />
				</g>
			)}
			{b.legs}
			{b.breathe(
				<g>
					{b.torso}
					{/* sacred thread (janeu) */}
					{!p.back && <path d="M-100,-742 C-40,-660 30,-560 92,-476" stroke="#efe6d0" strokeWidth={4} fill="none" />}
					{/* rudraksha mala */}
					{!p.back && <path d="M-60,-756 Q0,-640 60,-756" stroke="#5a2e1c" strokeWidth={10} strokeDasharray="1 12" strokeLinecap="round" fill="none" />}
					{/* saffron shawl across the chest (left shoulder) */}
					<path d="M-150,-740 C-110,-760 -60,-756 -30,-736 C20,-680 60,-600 104,-500 L60,-470 C20,-560 -40,-640 -96,-690 C-130,-700 -150,-716 -150,-740 Z" fill={shawl} />
					<path d="M-30,-736 C20,-680 60,-600 104,-500" stroke={C.gold} strokeWidth={4} fill="none" opacity={0.7} />
					<path d="M-120,-720 C-70,-690 -20,-620 30,-540" stroke="#7a3a14" strokeWidth={6} fill="none" opacity={0.5} />
					{/* waist cloth knot */}
					<path d="M-92,-500 Q0,-486 92,-500 L96,-470 Q0,-456 -96,-470 Z" fill="#6a3416" />
					<path d="M-92,-500 Q0,-486 92,-500" stroke={C.gold} strokeWidth={3} fill="none" />
				</g>,
			)}
			<g transform={`rotate(${head} 0 -790)`}>
				{p.back ? (
					<g>
						<DronaJata />
						<path d={smoothPath([[-46, -880], [-50, -820], [-30, -770], [0, -760], [30, -770], [50, -820], [46, -880], [0, -900]], true)} fill="#bdb5a7" />
					</g>
				) : (
					<DronaHead t={t} look={look} wind={p.wind ?? 0.4} stern={stern} />
				)}
			</g>
			{drawArm(L, DRONA, bracelet)}
			<Hand A={L} kind={lHand} skin={DRONA.skin} shade={DRONA.shade} />
		</g>,
	);
};

/** Drona close-up bust. Origin: centre of face, face ~520 tall. */
export const DronaFace: React.FC<{t: number; look?: number; wind?: number; stern?: number; eyesClosed?: number}> = ({t, look = 0, wind = 0.4, stern = 0, eyesClosed = 0}) => {
	const bw = (k: number) => Math.sin(t * 1.6 + k) * 12 * wind;
	const skin = DRONA.skin;
	const shade = DRONA.shade;
	const lid = clamp(eyesClosed);
	return (
		<g>
			{/* jata */}
			{/* matted locks falling behind the shoulders */}
			<path d={smoothPath([[-160, -260], [-210 - bw(1), -60], [-230 - bw(2), 200], [-200 - bw(3), 420], [-150, 300], [-150, 0]], true)} fill="#b3ab9d" />
			<path d={smoothPath([[160, -260], [210 + bw(1), -60], [230 + bw(2), 200], [200 + bw(3), 420], [150, 300], [150, 0]], true)} fill="#a39b8d" />
			<ellipse cx={0} cy={-330} rx={150} ry={74} fill="#cfc8bb" />
			<ellipse cx={-10} cy={-420} rx={112} ry={60} fill="#c4bdaf" />
			<ellipse cx={6} cy={-494} rx={74} ry={44} fill="#cfc8bb" />
			<path d="M-130,-350 C-60,-390 60,-392 130,-344 M-96,-436 C-40,-466 50,-466 100,-424 M-110,-300 C-40,-268 50,-268 120,-306 M-50,-500 C-10,-524 30,-522 60,-494" stroke="#9b9384" strokeWidth={9} fill="none" />
			<path d="M50,-530 C110,-500 150,-430 150,-330 L100,-280 Z" fill="#9b9384" opacity={0.45} />
			<path d="M-150,-300 Q0,-262 150,-300" stroke="#5a2e1c" strokeWidth={24} strokeDasharray="1 30" strokeLinecap="round" fill="none" />
			{/* shoulders, saffron shawl, mala */}
			<path d="M-480,560 C-420,400 -260,330 -120,320 Q0,360 120,320 C260,330 420,400 480,560 Z" fill={skin} />
			<path d="M120,320 C260,330 420,400 480,560 L200,560 C190,470 160,380 120,320 Z" fill={shade} opacity={0.55} />
			<path d="M-480,560 C-440,420 -330,350 -220,334 C-120,400 -20,470 60,560 Z" fill="#b8642a" />
			<path d="M-220,334 C-120,400 -20,470 60,560" stroke={C.gold} strokeWidth={8} fill="none" opacity={0.7} />
			<path d="M-160,330 Q0,520 160,330" stroke="#5a2e1c" strokeWidth={22} strokeDasharray="1 30" strokeLinecap="round" fill="none" />
			<path d="M-300,360 C-120,420 80,480 300,560" stroke="#efe6d0" strokeWidth={7} fill="none" />
			<path d="M-110,140 L-120,330 Q0,380 120,330 L110,140 Z" fill={skin} />
			{/* face */}
			<path d={smoothPath([[-150, -230], [-166, -120], [-158, -10], [-138, 80], [-96, 170], [-44, 218], [0, 228], [44, 218], [96, 170], [138, 80], [158, -10], [166, -120], [150, -230], [0, -286]], true)} fill={skin} />
			<path d={smoothPath([[30, -286], [150, -230], [166, -120], [158, -10], [138, 80], [96, 170], [44, 218], [16, 226], [50, 120], [62, 20], [44, -60], [56, -160]], true)} fill={shade} opacity={0.6} />
			{/* age lines */}
			<path d="M-90,-170 Q0,-186 90,-170 M-80,-148 Q0,-160 80,-148" stroke={shade} strokeWidth={4} fill="none" opacity={0.55} />
			<path d="M-118,-40 Q-130,-20 -126,0 M118,-40 Q130,-20 126,0" stroke={shade} strokeWidth={4} fill="none" opacity={0.5} />
			{/* tripundra + dot */}
			<path d="M-84,-222 L84,-222 M-90,-202 L90,-202 M-84,-182 L84,-182" stroke="#ece4d4" strokeWidth={10} strokeLinecap="round" />
			<circle cx={0} cy={-202} r={11} fill={C.red} />
			{/* grey hair at temples */}
			<path d="M-172,-200 C-150,-320 150,-330 172,-200 C120,-256 40,-262 0,-256 C-40,-262 -120,-256 -172,-200 Z" fill="#cfc8bb" />
			<path d="M-170,-200 L-196,120 L-150,20 L-158,-110 Z M170,-200 L196,120 L150,20 L158,-110 Z" fill="#bdb5a7" />
			{/* brows */}
			<path d={`M-128,${-118 + stern * 10} C-100,${-138 + stern * 6} -50,${-136 + stern * 14} -22,${-112 + stern * 16} L-26,${-100 + stern * 14} C-60,${-118 + stern * 10} -100,${-116 + stern * 6} -126,${-100 + stern * 8} Z`} fill="#e3ddd0" />
			<path d={`M128,${-118 + stern * 10} C100,${-138 + stern * 6} 50,${-136 + stern * 14} 22,${-112 + stern * 16} L26,${-100 + stern * 14} C60,${-118 + stern * 10} 100,${-116 + stern * 6} 126,${-100 + stern * 8} Z`} fill="#e3ddd0" />
			{/* eyes */}
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={`M${s * 112},-70 Q${s * 72},-${96 - lid * 26} ${s * 32},-70 Q${s * 72},-${50 + lid * 6} ${s * 112},-70 Z`} fill="#e6dac4" />
					{lid < 0.8 && <circle cx={s * 72 + look * 10} cy={-71} r={13 * (1 - lid * 0.6)} fill="#1a100a" />}
					{lid < 0.8 && <circle cx={s * 72 + look * 10 - 4} cy={-76} r={3} fill="#e8dcc4" opacity={0.7} />}
					<path d={`M${s * 116},-72 Q${s * 72},-${100 - lid * 30} ${s * 28},-72`} stroke={shade} strokeWidth={6} fill="none" />
					<path d={`M${s * 110},-48 Q${s * 72},-36 ${s * 36},-50`} stroke={shade} strokeWidth={3} fill="none" opacity={0.6} />
				</g>
			))}
			{/* nose */}
			<path d="M-6,-66 L-30,40 Q0,60 30,40 L10,-66 Z" fill={shade} opacity={0.45} />
			<path d="M-34,40 Q0,62 34,40" stroke={shade} strokeWidth={5} fill="none" />
			{/* moustache + long white beard */}
			<path d={smoothPath([[-150, 30], [-160, 160], [-120 + bw(1), 330], [-70 + bw(2), 470], [0 + bw(3), 560], [70 + bw(2), 470], [120 + bw(1), 330], [160, 160], [150, 30], [110, 90], [40, 104], [0, 96], [-40, 104], [-110, 90]], true)} fill={beardC} />
			{Array.from({length: 7}, (_, i) => {
				const x = -96 + i * 32;
				return <path key={i} d={`M${x},110 Q${x * 0.8 + bw(i)},300 ${x * 0.4 + bw(i + 1)},${480 - Math.abs(x)}`} stroke={beardS} strokeWidth={4} fill="none" opacity={0.7} />;
			})}
			<path d="M-110,78 C-60,56 -20,60 0,74 C20,60 60,56 110,78 C80,96 30,92 0,84 C-30,92 -80,96 -110,78 Z" fill="#ece6da" />
			<path d="M-24,110 Q0,116 24,110" stroke="#3a2016" strokeWidth={6} fill="none" opacity={0.7} />
		</g>
	);
};

// ------------------------------------------------------------------ KARNA
const KARNA: Look = {skin: '#8f5c3c', shade: '#5c3523', shoulder: 146, waist: 94, armW: 39, dhoti: '#6e1f1a', dhotiShade: '#4a1411', trim: C.gold};
const KAV = {base: '#b48a3e', light: '#e2c27a', dark: '#6a4a1c'};

/** Golden scale armour fused to the torso. */
const Kavacha: React.FC<{back?: boolean; glint?: number}> = ({back, glint = 0}) => {
	const rows: React.ReactNode[] = [];
	for (let r = 0; r < 8; r++) {
		const y = -740 + r * 34;
		const half = 150 - r * 7 - (r > 3 ? (r - 3) * 6 : 0);
		const n = Math.round((half * 2) / 34);
		for (let i = 0; i < n; i++) {
			const x = -half + (i + (r % 2) * 0.5) * ((half * 2) / n);
			if (Math.abs(x) > half - 6) continue;
			rows.push(<path key={`${r}-${i}`} d={`M${x - 16},${y} Q${x},${y + 30} ${x + 16},${y} Z`} fill={(i + r) % 3 === 0 ? KAV.light : KAV.base} stroke={KAV.dark} strokeWidth={2} />);
		}
	}
	return (
		<g>
			<path d={smoothPath([[0, -760], [-120, -748], [-166, -718], [-150, -650], [-120, -590], [-96, -500], [-98, -478], [98, -478], [96, -500], [120, -590], [150, -650], [166, -718], [120, -748]], true)} fill={KAV.dark} />
			{rows}
			{!back && (
				<g>
					{/* sun disc at the heart */}
					<circle cx={0} cy={-650} r={34} fill={KAV.light} stroke={KAV.dark} strokeWidth={4} />
					{Array.from({length: 12}, (_, i) => {
						const a = (i / 12) * Math.PI * 2;
						return <path key={i} d={`M${Math.cos(a) * 38},${-650 + Math.sin(a) * 38} L${Math.cos(a) * 54},${-650 + Math.sin(a) * 54}`} stroke={KAV.light} strokeWidth={5} strokeLinecap="round" />;
					})}
					<circle cx={0} cy={-650} r={14} fill="#fff1c8" opacity={0.8} />
				</g>
			)}
			{/* painted shadow on the far side */}
			<path d="M40,-750 C120,-740 166,-718 150,-650 C130,-590 100,-530 96,-480 L40,-480 Z" fill="#000" opacity={0.22} />
			{glint > 0.02 && <ellipse cx={-50} cy={-690} rx={70} ry={40} fill="#fff4d0" opacity={glint * 0.7} filter="url(#b14)" />}
		</g>
	);
};

const Kundala: React.FC<{x: number; y: number; s?: number; glow?: number}> = ({x, y, s = 1, glow = 0.4}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<circle r={22} fill="#ffd98a" opacity={glow * 0.6} filter="url(#b8)" />
		<circle r={11} fill="#e8c46a" stroke="#6a4a1c" strokeWidth={2} />
		{Array.from({length: 8}, (_, i) => {
			const a = (i / 8) * Math.PI * 2;
			return <path key={i} d={`M${Math.cos(a) * 12},${Math.sin(a) * 12} L${Math.cos(a) * 18},${Math.sin(a) * 18}`} stroke="#e8c46a" strokeWidth={3} strokeLinecap="round" />;
		})}
		<circle r={4} fill="#fff1c8" />
	</g>
);

const KarnaHead: React.FC<{t: number; look: number; gust: (k: number) => number; disguise: boolean}> = ({t, look, gust, disguise}) => {
	const wave = (k: number, a: number) => Math.sin(t * 3 + k) * a;
	return (
		<g>
			{/* long black hair behind (tied up in a Brahmin's knot when disguised) */}
			{disguise ? (
				<g>
					<ellipse cx={0} cy={-918} rx={30} ry={24} fill={C.hair} />
					<path d="M-26,-908 Q0,-900 26,-908" stroke="#efe6d0" strokeWidth={4} fill="none" />
				</g>
			) : (
				<path
					d={smoothPath([[-46, -900], [-72, -860], [-86, -800], [-92 + gust(1) * 20, -740], [-80 + gust(2) * 50 + wave(1, 6), -670], [-30 + gust(3) * 80 + wave(2, 10), -650], [30 + gust(4) * 110 + wave(3, 12), -670], [90 + gust(5) * 110 + wave(4, 10), -720], [94 + gust(6) * 50, -800], [82, -856], [50, -896], [0, -912]], true)}
					fill={C.hair}
				/>
			)}
			{/* face: young, clean jaw, thin moustache */}
			<path d={smoothPath([[-42, -868], [-46, -832], [-40, -800], [-24, -780], [0, -772], [24, -780], [40, -800], [46, -832], [42, -868], [0, -886]], true)} fill={KARNA.skin} />
			<path d={smoothPath([[8, -884], [42, -868], [46, -832], [40, -800], [24, -780], [6, -774], [18, -820], [14, -860]], true)} fill={KARNA.shade} opacity={0.55} />
			<path d="M-48,-864 C-40,-902 40,-906 48,-864 C30,-884 -30,-884 -48,-864 Z" fill={C.hair} />
			{!disguise && (
				<g>
					{/* thin gold sun band */}
					<path d="M-46,-866 Q0,-882 46,-866" stroke={C.gold} strokeWidth={5} fill="none" />
					<circle cx={0} cy={-878} r={6} fill={KAV.light} />
				</g>
			)}
			{disguise && (
				<g>
					<path d="M-20,-866 L20,-866 M-22,-859 L22,-859 M-20,-852 L20,-852" stroke="#ece4d4" strokeWidth={3} />
					<circle cx={0} cy={-859} r={3} fill={C.red} />
				</g>
			)}
			<path d="M-34,-844 L-8,-842 L-8,-838 L-32,-839 Z M34,-844 L8,-842 L8,-838 L32,-839 Z" fill={C.hair} />
			<path d="M-30,-830 Q-20,-836 -10,-830 Q-20,-826 -30,-830 Z M10,-830 Q20,-836 30,-830 Q20,-826 10,-830 Z" fill="#e8dcc8" />
			<circle cx={-20 + look * 3} cy={-830} r={3.2} fill="#120c08" />
			<circle cx={20 + look * 3} cy={-830} r={3.2} fill="#120c08" />
			<path d="M-2,-828 L-8,-806 L6,-804 L4,-828 Z" fill={KARNA.shade} opacity={0.6} />
			<path d="M-16,-798 Q0,-804 16,-798" stroke={C.hair} strokeWidth={3} fill="none" />
			<path d="M-8,-788 Q0,-785 8,-788" stroke="#3a2016" strokeWidth={3} fill="none" />
			{/* kundala - the sun earrings he was born with */}
			<Kundala x={-50} y={-800} glow={disguise ? 0.15 : 0.6} />
			<Kundala x={50} y={-800} glow={disguise ? 0.15 : 0.6} />
		</g>
	);
};

export type KarnaProps = Pose & {
	bow?: 'none' | 'hold' | 'draw';
	pull?: number;
	disguise?: number; // 0..1 white Brahmin's shawl + thread over the armour
	glint?: number;
	young?: boolean;
	arrowGlow?: number;
	aim?: number; // raises the drawn bow (deg)
};

export const Karna: React.FC<KarnaProps> = (p) => {
	const {t, look = 0, head = 0, bow = 'none', pull = 0, disguise = 0, glint = 0, arrowGlow = 0, aim = 0} = p;
	let {rArm = 12, rElbow = 8, lArm = 20, lElbow = -30, rHand = 'fist', lHand = 'fist'} = p;
	if (bow === 'draw') {
		// bow arm (screen-right) straight out, string hand pulled to the chest
		lArm = 88 + aim;
		lElbow = 2;
		rArm = 92 + pull * 14 + aim * 0.8;
		rElbow = -120 - pull * 62;
		lHand = 'grip';
		rHand = 'grip';
	}
	const b = body(p, KARNA);
	const R = arm(-1, KARNA.shoulder, rArm, rElbow);
	const L = arm(1, KARNA.shoulder, lArm, lElbow);
	const dis = clamp(disguise) > 0.5;
	const guard = (A: Arm) => {
		const [x1, y1] = along(A, 0.35);
		const [x2, y2] = along(A, 0.88);
		const [u1, v1] = along(A, 0.55, true);
		const [u2, v2] = along(A, 0.66, true);
		return (
			<g>
				<path d={limb(x1, y1, x2, y2, 30, 31, 24)} fill={KAV.base} stroke={KAV.dark} strokeWidth={3} />
				<path d={limb(u1, v1, u2, v2, 41, 41, 39)} fill={C.gold} stroke={KAV.dark} strokeWidth={2} />
			</g>
		);
	};
	const bowNode =
		bow !== 'none' ? (
			<g transform={`translate(${L.hx} ${L.hy})`}>
				<Bow len={600} pull={bow === 'draw' ? pull : 0} wood="#3a2212" trim={KAV.light} glow={arrowGlow * 0.6} stringTo={bow === 'draw' ? [R.hx - L.hx, R.hy - L.hy] : undefined} />
			</g>
		) : null;
	const arrowNode =
		bow === 'draw' ? (
			<g transform={`translate(${R.hx} ${R.hy}) rotate(${(Math.atan2(L.hy - R.hy, L.hx - R.hx) * 180) / Math.PI})`}>
				<Arrow len={Math.hypot(L.hx - R.hx, L.hy - R.hy) + 120} glow={arrowGlow} />
			</g>
		) : null;
	return wrap(
		p,
		b.kneelY,
		<g>
			{/* sun halo (faint) */}
			{!dis && <circle cx={0} cy={-840} r={150} fill={KAV.light} opacity={0.12 + glint * 0.2} filter="url(#b24)" />}
			{drawArm(R, KARNA, guard)}
			<Hand A={R} kind={rHand} skin={KARNA.skin} shade={KARNA.shade} />
			{b.legs}
			{b.breathe(
				<g>
					{b.torso}
					<Kavacha back={p.back} glint={glint} />
					<path d="M-98,-500 Q0,-484 98,-500 L100,-468 Q0,-452 -100,-468 Z" fill={C.deepRed} stroke={KAV.dark} strokeWidth={3} />
					<circle cx={0} cy={-478} r={12} fill={KAV.light} stroke={KAV.dark} strokeWidth={2} />
					{!p.back && !dis && <path d="M-18,-468 L18,-468 L12,-300 L0,-282 L-12,-300 Z" fill={C.red} stroke={C.gold} strokeWidth={4} />}
					{/* disguise: white shawl over the left shoulder + sacred thread; gold still glints at the edges */}
					{disguise > 0.02 && (
						<g opacity={clamp(disguise * 1.6)}>
							<path d="M-176,-724 C-130,-770 -40,-770 10,-744 C70,-680 110,-590 120,-470 L-100,-470 C-120,-560 -150,-640 -176,-724 Z" fill="#e6ddc9" />
							<path d="M10,-744 C70,-680 110,-590 120,-470" stroke="#b9ab90" strokeWidth={6} fill="none" />
							<path d="M-140,-700 C-90,-640 -60,-560 -40,-480 M-80,-730 C-30,-660 0,-570 20,-480" stroke="#c9bda4" strokeWidth={4} fill="none" opacity={0.7} />
							<path d="M-110,-746 C-40,-660 30,-560 96,-476" stroke="#fffaf0" strokeWidth={4} fill="none" />
						</g>
					)}
					{!p.back && <path d="M-44,-760 Q0,-724 44,-760" stroke={KAV.light} strokeWidth={8} fill="none" strokeLinecap="round" />}
				</g>,
			)}
			{bowNode}
			<g transform={`rotate(${head} 0 -790)`}>
				{p.back ? (
					<g>
						<path d={smoothPath([[-50, -890], [-60, -820], [-56 + b.gust(60) * 30, -700], [-20 + b.gust(61) * 50, -620], [20 + b.gust(62) * 60, -620], [56 + b.gust(63) * 40, -700], [60, -820], [50, -890], [0, -914]], true)} fill={C.hair} />
						<path d="M-46,-866 Q0,-882 46,-866" stroke={C.gold} strokeWidth={5} fill="none" />
						<Kundala x={-52} y={-800} glow={0.6} />
						<Kundala x={52} y={-800} glow={0.6} />
					</g>
				) : (
					<KarnaHead t={t} look={look} gust={b.gust} disguise={dis} />
				)}
			</g>
			{drawArm(L, KARNA, guard)}
			<Hand A={L} kind={lHand} skin={KARNA.skin} shade={KARNA.shade} />
			{arrowNode}
		</g>,
	);
};

/** Karna close-up bust (three-quarter front). Origin: centre of face. */
export const KarnaFace: React.FC<{t: number; look?: number; wind?: number; glow?: number; brow?: number}> = ({t, look = 0, wind = 0.5, glow = 0.5, brow = 0}) => {
	const g = (k: number) => wind * (0.7 + 0.3 * noise(t * 0.8 + k, 91));
	const wave = (k: number, a: number) => Math.sin(t * 2.4 + k) * a * wind;
	const skin = KARNA.skin;
	const shade = KARNA.shade;
	return (
		<g>
			<circle cx={0} cy={-40} r={420} fill={KAV.light} opacity={0.12 * glow} filter="url(#b40)" />
			<path d={smoothPath([[0, -350], [-170, -300], [-250 - g(1) * 30, -80], [-290 - g(2) * 70 + wave(1, 20), 200], [-320 - g(3) * 140 + wave(2, 30), 520], [-120, 560], [120, 560], [330 + g(4) * 160 + wave(3, 30), 520], [300 + g(5) * 80 + wave(4, 20), 200], [250 + g(6) * 30, -80], [170, -300]], true)} fill={C.hair} />
			<path d="M-110,140 L-120,330 Q0,380 120,330 L110,140 Z" fill={skin} />
			<path d="M30,150 L110,140 L120,330 Q80,350 40,352 Z" fill={shade} opacity={0.6} />
			{/* kavacha shoulders and chest */}
			<path d="M-480,560 C-420,400 -260,330 -120,320 Q0,360 120,320 C260,330 420,400 480,560 Z" fill={KAV.dark} />
			{Array.from({length: 3}, (_, r) =>
				Array.from({length: 14}, (_, i) => {
					const x = -420 + i * 64 + (r % 2) * 32;
					const y = 400 + r * 56 - Math.max(0, 260 - Math.abs(x)) * 0.25;
					if (Math.abs(x) > 440 - r * 20) return null;
					return <path key={`${r}-${i}`} d={`M${x - 30},${y} Q${x},${y + 54} ${x + 30},${y} Z`} fill={(i + r) % 3 === 0 ? KAV.light : KAV.base} stroke={KAV.dark} strokeWidth={3} />;
				}),
			)}
			<path d="M120,320 C260,330 420,400 480,560 L200,560 C190,470 160,380 120,320 Z" fill="#000" opacity={0.25} />
			<path d="M-170,330 Q0,440 170,330" stroke={KAV.light} strokeWidth={20} fill="none" strokeLinecap="round" />
			{/* face */}
			<path d={smoothPath([[-146, -230], [-162, -120], [-154, -10], [-134, 80], [-92, 166], [-44, 212], [0, 222], [44, 212], [92, 166], [134, 80], [154, -10], [162, -120], [146, -230], [0, -288]], true)} fill={skin} />
			<path d={smoothPath([[30, -288], [146, -230], [162, -120], [154, -10], [134, 80], [92, 166], [44, 212], [16, 220], [50, 120], [62, 20], [44, -60], [56, -160]], true)} fill={shade} opacity={0.6} />
			<path d="M-136,-10 C-116,-30 -86,-30 -66,-10 C-86,10 -116,20 -136,-10 Z" fill={C.skinLight} opacity={0.4} />
			<path d="M-172,-200 C-150,-330 150,-340 172,-200 C120,-262 40,-270 0,-262 C-40,-270 -120,-262 -172,-200 Z" fill={C.hair} />
			<path d="M-168,-200 L-192,150 L-146,40 L-156,-110 Z M168,-200 L192,150 L146,40 L156,-110 Z" fill={C.hair} />
			<path d="M-166,-206 Q0,-262 166,-206" stroke={C.gold} strokeWidth={14} fill="none" />
			<circle cx={0} cy={-238} r={18} fill={KAV.light} stroke={KAV.dark} strokeWidth={3} />
			{/* brows */}
			<path d={`M-126,${-116 + brow * 8} C-96,${-136 + brow * 4} -50,${-134 + brow * 12} -22,${-110 + brow * 14} L-26,${-100 + brow * 12} C-60,${-118 + brow * 8} -98,${-116 + brow * 4} -124,${-102 + brow * 6} Z`} fill={C.hair} />
			<path d={`M126,${-116 + brow * 8} C96,${-136 + brow * 4} 50,${-134 + brow * 12} 22,${-110 + brow * 14} L26,${-100 + brow * 12} C60,${-118 + brow * 8} 98,${-116 + brow * 4} 124,${-102 + brow * 6} Z`} fill={C.hair} />
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={`M${s * 110},-70 Q${s * 72},-98 ${s * 32},-70 Q${s * 72},-50 ${s * 110},-70 Z`} fill="#e6dac4" />
					<circle cx={s * 72 + look * 10} cy={-71} r={14} fill="#1a100a" />
					<circle cx={s * 72 + look * 10 - 4} cy={-76} r={3.5} fill="#f4e6c8" opacity={0.8} />
					<path d={`M${s * 114},-72 Q${s * 72},-102 ${s * 28},-72`} stroke={shade} strokeWidth={6} fill="none" />
				</g>
			))}
			<path d="M-6,-66 L-28,40 Q0,58 28,40 L10,-66 Z" fill={shade} opacity={0.45} />
			<path d="M-60,96 C-30,84 30,84 60,96 C30,104 -30,104 -60,96 Z" fill={C.hair} />
			<path d="M-40,130 Q0,144 40,130" stroke="#4a2418" strokeWidth={7} fill="none" strokeLinecap="round" />
			<path d="M-70,180 Q0,214 70,180" stroke={shade} strokeWidth={4} fill="none" opacity={0.5} />
			{/* the sun earrings */}
			<Kundala x={-178} y={40} s={2.6} glow={glow} />
			<Kundala x={178} y={40} s={2.6} glow={glow} />
		</g>
	);
};

// ------------------------------------------------------------------ PARASHURAMA
const PARA: Look = {skin: '#7a4e34', shade: '#4c2c1c', shoulder: 168, waist: 100, armW: 46, dhoti: '#8a5a30', dhotiShade: '#5c3a1c', trim: '#c8b48a'};
const ash = '#d4cdbf';

export const Parashurama: React.FC<Pose & {axeGlow?: number; axeUp?: number}> = (p) => {
	const {t, look = 0, head = 0, axeGlow = 0} = p;
	const {rArm = 30, rElbow = -120, lArm = 18, lElbow = -20, rHand = 'grip', lHand = 'palm'} = p;
	const b = body(p, PARA);
	const R = arm(-1, PARA.shoulder, rArm, rElbow);
	const L = arm(1, PARA.shoulder, lArm, lElbow);
	const g = b.gust;
	const wv = (k: number) => Math.sin(t * 1.5 + k) * 6 * (p.wind ?? 0.4);
	const ashArm = (A: Arm) => {
		const [x1, y1] = along(A, 0.3, true);
		const [x2, y2] = along(A, 0.55, true);
		const [r1, s1] = along(A, 0.4);
		const [r2, s2] = along(A, 0.62);
		return (
			<g>
				<path d={`M${x1},${y1} L${x2},${y2}`} stroke={ash} strokeWidth={5} opacity={0.8} transform={`translate(-8 0)`} />
				<path d={`M${x1},${y1} L${x2},${y2}`} stroke={ash} strokeWidth={5} opacity={0.8} transform={`translate(8 0)`} />
				<path d={limb(r1, s1, r2, s2, 36, 36, 34)} fill="none" stroke="#5a2e1c" strokeWidth={9} strokeDasharray="1 12" strokeLinecap="round" />
			</g>
		);
	};
	return wrap(
		p,
		b.kneelY,
		<g>
			{/* the axe rests over the right shoulder */}
			<g transform={`translate(${R.hx} ${R.hy}) rotate(${-14})`}>
				<Parashu len={820} glow={axeGlow} />
			</g>
			{drawArm(R, PARA, ashArm)}
			<Hand A={R} kind={rHand} skin={PARA.skin} shade={PARA.shade} />
			{b.legs}
			{b.breathe(
				<g>
					{b.torso}
					{/* ash tripundra across the chest */}
					{!p.back && <path d="M-110,-690 Q0,-670 110,-690 M-114,-668 Q0,-648 114,-668 M-110,-646 Q0,-626 110,-646" stroke={ash} strokeWidth={7} fill="none" opacity={0.85} />}
					{/* deerskin over the left shoulder */}
					<path d={smoothPath([[-190, -730], [-120, -770], [-40, -760], [20, -700], [60, -600], [90, -480], [20, -470], [-60, -560], [-130, -640], [-180, -680]], true)} fill="#8a6a44" />
					{rng(7) && Array.from({length: 9}, (_, i) => {
						const r = rng(300 + i);
						return <ellipse key={i} cx={-130 + r() * 180} cy={-720 + r() * 220} rx={9 + r() * 6} ry={6 + r() * 4} fill="#e2d2b0" opacity={0.75} />;
					})}
					<path d="M20,-700 C60,-600 90,-480 90,-480" stroke="#5a3e22" strokeWidth={6} fill="none" />
					{/* rudraksha malas */}
					{!p.back && <path d="M-70,-760 Q0,-610 70,-760" stroke="#5a2e1c" strokeWidth={12} strokeDasharray="1 13" strokeLinecap="round" fill="none" />}
					{!p.back && <path d="M-50,-764 Q0,-680 50,-764" stroke="#5a2e1c" strokeWidth={10} strokeDasharray="1 11" strokeLinecap="round" fill="none" />}
					{/* sacred thread */}
					{!p.back && <path d="M-110,-740 C-40,-660 30,-560 96,-476" stroke="#efe6d0" strokeWidth={4} fill="none" />}
					<path d="M-102,-500 Q0,-484 102,-500 L104,-468 Q0,-452 -104,-468 Z" fill="#5c3a1c" />
					<path d={`M-24,-468 L24,-468 L${16 + g(20) * 10},-300 L${-16 + g(20) * 10},-300 Z`} fill="#8a6a44" />
				</g>,
			)}
			<g transform={`rotate(${head} 0 -790)`}>
				{/* towering jata with rudraksha bands */}
				<path d={smoothPath([[-50, -870], [-66, -950], [-56, -1040], [-20, -1090], [20, -1090], [56, -1040], [66, -950], [50, -870]], true)} fill="#1a1410" />
				<path d="M-64,-950 Q0,-934 64,-950 M-58,-1020 Q0,-1006 58,-1020" stroke="#5a2e1c" strokeWidth={10} strokeDasharray="1 12" strokeLinecap="round" fill="none" />
				<path d={`M40,-1060 C70,-1020 ${100 + g(70) * 40},-960 ${110 + g(71) * 60},-880 L70,-900 Z`} fill="#1a1410" />
				<path d={`M-40,-1060 C-70,-1020 ${-90 + g(72) * 30},-960 ${-96 + g(73) * 40},-880 L-60,-900 Z`} fill="#1a1410" />
				{p.back ? null : (
					<g>
						<path d={smoothPath([[-46, -868], [-50, -830], [-44, -798], [-24, -778], [0, -772], [24, -778], [44, -798], [50, -830], [46, -868], [0, -886]], true)} fill={PARA.skin} />
						<path d={smoothPath([[8, -884], [46, -868], [50, -830], [44, -798], [24, -778], [6, -774], [18, -820], [14, -860]], true)} fill={PARA.shade} opacity={0.55} />
						<path d="M-50,-864 C-40,-898 40,-902 50,-864 C30,-882 -30,-882 -50,-864 Z" fill="#1a1410" />
						{/* ash tripundra + red vertical mark */}
						<path d="M-26,-866 L26,-866 M-28,-859 L28,-859 M-26,-852 L26,-852" stroke={ash} strokeWidth={3.4} />
						<path d="M0,-874 L0,-848" stroke={C.red} strokeWidth={4} />
						<path d="M-36,-848 L-8,-840 L-8,-835 L-34,-840 Z M36,-848 L8,-840 L8,-835 L34,-840 Z" fill="#1a1410" />
						<path d="M-30,-830 Q-20,-835 -10,-830 Q-20,-827 -30,-830 Z M10,-830 Q20,-835 30,-830 Q20,-827 10,-830 Z" fill="#e8dcc8" />
						<circle cx={-20 + look * 3} cy={-830} r={3} fill="#120c08" />
						<circle cx={20 + look * 3} cy={-830} r={3} fill="#120c08" />
						<path d="M-2,-828 L-9,-806 L7,-804 L4,-828 Z" fill={PARA.shade} opacity={0.6} />
						{/* full dark beard */}
						<path d={smoothPath([[-50, -822], [-52, -780], [-36 + wv(1), -716], [0 + wv(2), -690], [36 + wv(1), -716], [52, -780], [50, -822], [36, -804], [14, -796], [0, -800], [-14, -796], [-36, -804]], true)} fill="#1a1410" />
						<path d="M-18,-798 Q0,-806 18,-798" stroke="#1a1410" strokeWidth={5} fill="none" />
						<circle cx={-52} cy={-810} r={6} fill="#5a2e1c" />
						<circle cx={52} cy={-810} r={6} fill="#5a2e1c" />
					</g>
				)}
			</g>
			{drawArm(L, PARA, ashArm)}
			<Hand A={L} kind={lHand} skin={PARA.skin} shade={PARA.shade} />
		</g>,
	);
};

// ------------------------------------------------------------------ ARJUNA
const ARJ: Look = {skin: '#6b4636', shade: '#432a1f', shoulder: 142, waist: 92, armW: 38, dhoti: '#e0d4b8', dhotiShade: '#a89a7c', trim: C.gold};
const indigo = '#2c3a6a';

export const Arjuna: React.FC<Pose & {bow?: 'hold' | 'none'; tapas?: boolean}> = (p) => {
	const {t, look = 0, head = 0, bow = 'hold', tapas = false} = p;
	const {rArm = 14, rElbow = 6, lArm = 22, lElbow = -20, rHand = 'grip', lHand = 'fist'} = p;
	const b = body(p, tapas ? {...ARJ, dhoti: '#7a5a3a', dhotiShade: '#4e3622', trim: '#a08060'} : ARJ);
	const R = arm(-1, ARJ.shoulder, rArm, rElbow);
	const L = arm(1, ARJ.shoulder, lArm, lElbow);
	const g = b.gust;
	const band = (A: Arm) => {
		const [u1, v1] = along(A, 0.55, true);
		const [u2, v2] = along(A, 0.66, true);
		return tapas ? null : <path d={limb(u1, v1, u2, v2, 40, 40, 38)} fill={C.gold} stroke={C.darkBronze} strokeWidth={2} />;
	};
	return wrap(
		p,
		b.kneelY,
		<g>
			{!tapas && (
				<path d={smoothPath([[130, -740], [190 + g(10) * 60, -660], [240 + g(11) * 150, -560], [270 + g(12) * 240, -460], [200 + g(13) * 200, -450], [150, -600], [110, -700]], true)} fill={indigo} />
			)}
			{drawArm(R, ARJ, band)}
			<Hand A={R} kind={rHand} skin={ARJ.skin} shade={ARJ.shade} />
			{bow === 'hold' && !tapas && (
				<g transform={`translate(${R.hx} ${R.hy}) scale(-1 1)`}>
					{/* Gandiva: taller than its archer */}
					<Bow len={900} wood="#1e2236" trim={C.gold} />
				</g>
			)}
			{b.legs}
			{b.breathe(
				<g>
					{b.torso}
					{!tapas && (
						<g>
							<path d="M-150,-740 C-110,-756 -60,-750 -30,-730 C20,-670 60,-590 100,-490 L60,-470 C20,-560 -40,-640 -96,-690 C-130,-700 -150,-716 -150,-740 Z" fill={indigo} />
							<path d="M-30,-730 C20,-670 60,-590 100,-490" stroke={C.gold} strokeWidth={4} fill="none" />
							<path d="M-44,-760 Q0,-722 44,-760" stroke={C.gold} strokeWidth={9} fill="none" strokeLinecap="round" />
							<path d="M-98,-500 Q0,-484 98,-500 L100,-468 Q0,-452 -100,-468 Z" fill={C.gold} stroke={C.darkBronze} strokeWidth={3} />
						</g>
					)}
					{tapas && <path d="M-98,-500 Q0,-484 98,-500 L100,-468 Q0,-452 -100,-468 Z" fill="#4e3622" />}
				</g>,
			)}
			<g transform={`rotate(${head} 0 -790)`}>
				{tapas ? (
					<path d={smoothPath([[-40, -870], [-54, -940], [-30, -990], [30, -990], [54, -940], [40, -870]], true)} fill={C.hair} />
				) : (
					<g>
						{/* kirita: tall tiered crown */}
						<path d="M-50,-872 L-44,-930 L-30,-990 L-14,-1040 L0,-1070 L14,-1040 L30,-990 L44,-930 L50,-872 Z" fill={C.gold} stroke={C.darkBronze} strokeWidth={3} />
						<path d="M-46,-930 L46,-930 M-34,-990 L34,-990" stroke={C.darkBronze} strokeWidth={3} />
						<circle cx={0} cy={-900} r={9} fill={C.red} />
						<path d="M-50,-872 L-74,-900 L-56,-872 Z M50,-872 L74,-900 L56,-872 Z" fill={C.gold} />
					</g>
				)}
				{p.back ? null : (
					<g>
						<path d={smoothPath([[-42, -868], [-46, -832], [-40, -800], [-24, -780], [0, -772], [24, -780], [40, -800], [46, -832], [42, -868], [0, -884]], true)} fill={ARJ.skin} />
						<path d={smoothPath([[8, -882], [42, -868], [46, -832], [40, -800], [24, -780], [6, -774], [18, -820], [14, -860]], true)} fill={ARJ.shade} opacity={0.55} />
						<path d="M-48,-864 C-40,-900 40,-904 48,-864 C30,-882 -30,-882 -48,-864 Z" fill={C.hair} />
						<path d="M-46,-864 L-52,-790 L-44,-800 L-42,-850 Z M46,-864 L52,-790 L44,-800 L42,-850 Z" fill={C.hair} />
						<path d="M-34,-844 L-8,-842 L-8,-838 L-32,-839 Z M34,-844 L8,-842 L8,-838 L32,-839 Z" fill={C.hair} />
						{tapas ? (
							<path d="M-30,-830 Q-20,-826 -10,-830 M10,-830 Q20,-826 30,-830" stroke="#120c08" strokeWidth={3} fill="none" />
						) : (
							<g>
								<path d="M-30,-830 Q-20,-836 -10,-830 Q-20,-826 -30,-830 Z M10,-830 Q20,-836 30,-830 Q20,-826 10,-830 Z" fill="#e8dcc8" />
								<circle cx={-20 + look * 3} cy={-830} r={3.2} fill="#120c08" />
								<circle cx={20 + look * 3} cy={-830} r={3.2} fill="#120c08" />
							</g>
						)}
						<path d="M-2,-828 L-8,-806 L6,-804 L4,-828 Z" fill={ARJ.shade} opacity={0.6} />
						{tapas ? (
							<path d={smoothPath([[-46, -820], [-42, -790], [-20, -760], [0, -752], [20, -760], [42, -790], [46, -820], [20, -800], [0, -804], [-20, -800]], true)} fill={C.hair} />
						) : (
							<path d="M-16,-798 Q0,-804 16,-798" stroke={C.hair} strokeWidth={3} fill="none" />
						)}
						{!tapas && <circle cx={-48} cy={-806} r={7} stroke={C.gold} strokeWidth={3} fill="none" />}
						{!tapas && <circle cx={48} cy={-806} r={7} stroke={C.gold} strokeWidth={3} fill="none" />}
					</g>
				)}
			</g>
			{drawArm(L, ARJ, band)}
			<Hand A={L} kind={lHand} skin={ARJ.skin} shade={ARJ.shade} />
		</g>,
	);
};

// ------------------------------------------------------------------ STUDENT (young archer, ~0.8 scale adult)
/** A pupil in Drona's school. tone/cloth vary by seed. drawing 0..1 animates the draw. */
export const Student: React.FC<{t: number; seed: number; draw?: number; back?: boolean}> = ({t, seed, draw = 1, back = true}) => {
	const r = rng(seed);
	const cloths = ['#7a4a2a', '#5a5a3a', '#6e3a2a', '#4a4a5a', '#8a6a3a'];
	const cloth = cloths[Math.floor(r() * cloths.length)];
	const look: Look = {skin: r() > 0.5 ? '#7c5038' : '#8a5a3e', shade: '#523323', shoulder: 128, waist: 84, armW: 32, dhoti: cloth, dhotiShade: '#2a1a10', trim: '#b8a070'};
	const sway = Math.sin(t * 1.4 + r() * 6) * 0.5;
	const p: Pose = {t, back, wind: 0.3};
	const b = body(p, look);
	const L = arm(1, look.shoulder, 88, 2);
	const R = arm(-1, look.shoulder, 92 + draw * 14, -120 - draw * 62);
	return (
		<g transform={`scale(0.82) rotate(${sway})`}>
			{wrap(
				p,
				0,
				<g>
					{drawArm(R, look)}
					<Hand A={R} kind="grip" skin={look.skin} shade={look.shade} />
					{b.legs}
					{b.breathe(
						<g>
							{b.torso}
							<path d="M-100,-742 C-40,-660 30,-560 92,-476" stroke="#efe6d0" strokeWidth={4} fill="none" opacity={back ? 0.6 : 1} />
							<path d="M-92,-500 Q0,-486 92,-500 L96,-470 Q0,-456 -96,-470 Z" fill={cloth} />
						</g>,
					)}
					<ellipse cx={0} cy={-920} rx={26} ry={22} fill={C.hair} />
					<path d={smoothPath([[-44, -880], [-46, -820], [-30, -778], [0, -770], [30, -778], [46, -820], [44, -880], [0, -900]], true)} fill={back ? C.hair : look.skin} />
					<g transform={`translate(${L.hx} ${L.hy})`}>
						<Bow len={480} pull={draw} wood="#3a2414" trim="#8a7050" stringTo={[R.hx - L.hx, R.hy - L.hy]} />
					</g>
					<g transform={`translate(${R.hx} ${R.hy}) rotate(${(Math.atan2(L.hy - R.hy, L.hx - R.hx) * 180) / Math.PI})`}>
						<Arrow len={Math.hypot(L.hx - R.hx, L.hy - R.hy) + 90} />
					</g>
					{drawArm(L, look)}
					<Hand A={L} kind="grip" skin={look.skin} shade={look.shade} />
				</g>,
			)}
		</g>
	);
};

/** Straw archery target on a post. */
export const Target: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<rect x={-8} y={-80} width={16} height={80} fill="#3a2414" />
		<circle cx={0} cy={-130} r={60} fill="#b89a62" stroke="#6a5030" strokeWidth={4} />
		<circle cx={0} cy={-130} r={40} fill="none" stroke="#6e1f1a" strokeWidth={8} />
		<circle cx={0} cy={-130} r={14} fill="#6e1f1a" />
	</g>
);
