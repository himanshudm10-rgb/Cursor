// Characters for "Hanuman Chalisa - Part 2". Built with the house toolkit (limb, smoothPath, C palette, CharFX).
// Every character appears only through these components, with the same proportions in every shot.
//
// HANUMAN signature silhouette (readable as a black shape):
//   1. tall tiered gold crown (mukut) with a finial
//   2. the gada (round fluted mace on a long handle)
//   3. the long S-curved tail that rises behind him and ends in a curl
// Accent colour: muted saffron (dhoti + sash). Skin: warm vermilion-ochre (sindoor), muzzle lighter.
import React from 'react';
import {limb} from './characters';
import {C, clamp, noise, rng, smoothPath} from './lib';
import {Fire} from './world';

const rad = (d: number) => (d * Math.PI) / 180;

export const HC = {
	skin: '#9a5638',
	shade: '#5f2f1d',
	light: '#bd7a52',
	muzzle: '#c49a74',
	muzzleShade: '#8e6446',
	saffron: '#b0662c',
	saffronShade: '#7a3f1a',
	sash: '#c49a4a',
	gold: C.gold,
	paleGold: C.paleGold,
	darkBronze: C.darkBronze,
};

/** Tapered ribbon along a smooth centre line (used for the tail). */
export const ribbon = (pts: [number, number][], w0: number, w1: number) => {
	// resample with Catmull-Rom for a smooth centre line
	const P: [number, number][] = [];
	const p = [pts[0], ...pts, pts[pts.length - 1]];
	for (let i = 1; i < p.length - 2; i++) {
		for (let k = 0; k < 8; k++) {
			const u = k / 8;
			const [x0, y0] = p[i - 1];
			const [x1, y1] = p[i];
			const [x2, y2] = p[i + 1];
			const [x3, y3] = p[i + 2];
			const u2 = u * u;
			const u3 = u2 * u;
			const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
			P.push([f(x0, x1, x2, x3), f(y0, y1, y2, y3)]);
		}
	}
	P.push(pts[pts.length - 1]);
	const L: [number, number][] = [];
	const R: [number, number][] = [];
	P.forEach((q, i) => {
		const a = P[Math.max(0, i - 1)];
		const b = P[Math.min(P.length - 1, i + 1)];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const len = Math.hypot(dx, dy) || 1;
		const w = w0 + (w1 - w0) * (i / (P.length - 1));
		L.push([q[0] - (dy / len) * w, q[1] + (dx / len) * w]);
		R.push([q[0] + (dy / len) * w, q[1] - (dx / len) * w]);
	});
	const all = [...L, ...R.reverse()];
	return {d: 'M' + all.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L') + ' Z', tip: P[P.length - 1], line: P};
};

// ------------------------------------------------------------------ the gada (mace)
/** Grip at the origin, head up along -y. glow 0..1 adds a warm aura. */
export const Gada: React.FC<{len?: number; glow?: number}> = ({len = 560, glow = 0}) => {
	const s = len / 560;
	return (
		<g transform={`scale(${s})`}>
			<defs>
				<radialGradient id="gadaHead" cx="0.38" cy="0.35" r="0.75">
					<stop offset="0" stopColor="#ecd08e" />
					<stop offset="0.5" stopColor="#b8893f" />
					<stop offset="1" stopColor="#5a3a16" />
				</radialGradient>
				<linearGradient id="gadaShaft" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#d6b06a" />
					<stop offset="0.5" stopColor="#9a6c2e" />
					<stop offset="1" stopColor="#4e3214" />
				</linearGradient>
			</defs>
			{glow > 0.02 && <circle cx={0} cy={-470} r={170} fill="#ffcf7a" opacity={0.35 * glow} filter="url(#b24)" />}
			{/* shaft */}
			<rect x={-13} y={-400} width={26} height={470} rx={10} fill="url(#gadaShaft)" stroke={C.darkBronze} strokeWidth={3} />
			{[-330, -250, -40, 30].map((y) => (
				<rect key={y} x={-17} y={y} width={34} height={12} rx={4} fill={C.gold} stroke={C.darkBronze} strokeWidth={2} />
			))}
			<circle cx={0} cy={82} r={20} fill="#b8893f" stroke={C.darkBronze} strokeWidth={3} />
			{/* collar */}
			<path d="M-40,-380 L40,-380 L28,-410 L-28,-410 Z" fill="#9a6c2e" stroke={C.darkBronze} strokeWidth={3} />
			{/* fluted head */}
			<ellipse cx={0} cy={-480} rx={96} ry={104} fill="url(#gadaHead)" stroke={C.darkBronze} strokeWidth={4} />
			{[-60, -30, 0, 30, 60].map((x) => (
				<path key={x} d={`M${x},-578 Q${x * 1.45},-480 ${x},-382`} stroke={C.darkBronze} strokeWidth={3} fill="none" opacity={0.55} />
			))}
			<path d="M-94,-480 Q0,-452 94,-480" stroke={C.paleGold} strokeWidth={8} fill="none" opacity={0.8} />
			<path d="M-88,-520 Q0,-496 88,-520" stroke={C.darkBronze} strokeWidth={3} fill="none" opacity={0.5} />
			<path d="M30,-560 C70,-540 90,-500 88,-470 C70,-500 50,-530 30,-560 Z" fill="#000" opacity={0.25} />
			{/* finial */}
			<path d="M-16,-582 L0,-640 L16,-582 Z" fill={C.gold} stroke={C.darkBronze} strokeWidth={3} />
			<circle cx={0} cy={-588} r={12} fill={C.paleGold} stroke={C.darkBronze} strokeWidth={2} />
		</g>
	);
};

// ------------------------------------------------------------------ Hanuman's head (local: chin ~ -772, crown tip ~ -1000)
const HanumanHead: React.FC<{look: number; brow: number; t: number}> = ({look, brow, t}) => {
	const blink = noise(t * 0.7, 9) > 0.93 ? 0.2 : 1;
	return (
		<g>
			{/* crown (mukut): band + three tiers + finial */}
			<path d="M-52,-868 L-46,-912 L46,-912 L52,-868 Z" fill={HC.gold} stroke={HC.darkBronze} strokeWidth={3} />
			<path d="M-44,-912 L-34,-950 L34,-950 L44,-912 Z" fill="#a67a36" stroke={HC.darkBronze} strokeWidth={3} />
			<path d="M-32,-950 L-20,-982 L20,-982 L32,-950 Z" fill={HC.gold} stroke={HC.darkBronze} strokeWidth={3} />
			<path d="M-14,-982 L0,-1024 L14,-982 Z" fill={HC.paleGold} stroke={HC.darkBronze} strokeWidth={3} />
			<path d="M8,-912 L46,-912 L52,-868 L14,-868 Z M6,-950 L34,-950 L44,-912 L10,-912 Z" fill="#000" opacity={0.18} />
			<circle cx={0} cy={-892} r={10} fill={C.red} stroke={HC.paleGold} strokeWidth={3} />
			<path d="M-52,-870 L-66,-884 L-56,-900 Z M52,-870 L66,-884 L56,-900 Z" fill={HC.gold} stroke={HC.darkBronze} strokeWidth={2} />
			{/* ears */}
			<ellipse cx={-56} cy={-832} rx={14} ry={20} fill={HC.skin} />
			<ellipse cx={56} cy={-832} rx={14} ry={20} fill={HC.shade} />
			<circle cx={-60} cy={-806} r={9} stroke={HC.gold} strokeWidth={4} fill="none" />
			<circle cx={60} cy={-806} r={9} stroke={HC.gold} strokeWidth={4} fill="none" />
			{/* skull / face */}
			<path d={smoothPath([[-48, -868], [-54, -830], [-48, -796], [-30, -774], [0, -766], [30, -774], [48, -796], [54, -830], [48, -868], [0, -876]], true)} fill={HC.skin} />
			<path d={smoothPath([[10, -876], [48, -868], [54, -830], [48, -796], [30, -774], [8, -768], [22, -812], [18, -850]], true)} fill={HC.shade} opacity={0.55} />
			{/* fur tufts at the jaw (vanara) */}
			<path d="M-50,-812 L-64,-794 L-50,-796 L-58,-778 L-40,-786 Z M50,-812 L64,-794 L50,-796 L58,-778 L40,-786 Z" fill={HC.shade} />
			{/* muzzle */}
			<path d={smoothPath([[-34, -826], [-40, -800], [-26, -776], [0, -768], [26, -776], [40, -800], [34, -826], [0, -834]], true)} fill={HC.muzzle} />
			<path d={smoothPath([[6, -832], [34, -826], [40, -800], [26, -776], [6, -770], [18, -800]], true)} fill={HC.muzzleShade} opacity={0.55} />
			{/* brow ridge + eyes */}
			<path d={`M-40,${-852 + brow} Q-20,${-862 + brow} -4,${-850 + brow} L-4,${-845 + brow} Q-20,${-854 + brow} -40,${-846 + brow} Z M40,${-852 + brow} Q20,${-862 + brow} 4,${-850 + brow} L4,${-845 + brow} Q20,${-854 + brow} 40,${-846 + brow} Z`} fill="#2a140c" />
			<g transform={`translate(0 -840) scale(1 ${blink}) translate(0 840)`}>
				<path d="M-32,-840 Q-21,-847 -10,-840 Q-21,-835 -32,-840 Z M10,-840 Q21,-847 32,-840 Q21,-835 10,-840 Z" fill="#eadcc0" />
				<circle cx={-21 + look * 3} cy={-840} r={3.6} fill="#120a06" />
				<circle cx={21 + look * 3} cy={-840} r={3.6} fill="#120a06" />
			</g>
			{/* tilak */}
			<path d="M-8,-866 L-6,-848 L0,-842 L6,-848 L8,-866" stroke="#e6dccb" strokeWidth={3} fill="none" />
			<path d="M0,-866 L0,-846" stroke={C.red} strokeWidth={5} />
			{/* nose + mouth */}
			<path d="M-9,-820 Q0,-826 9,-820 Q0,-814 -9,-820 Z" fill="#3a1a10" />
			<path d="M-20,-794 Q0,-786 20,-794" stroke="#5a2e1c" strokeWidth={3.5} fill="none" />
		</g>
	);
};

export type HanumanPose = {
	t: number;
	pose?: 'stand' | 'kneel';
	rArm?: number; // right shoulder angle (deg, 0 = hanging, outward +)
	rElbow?: number;
	lArm?: number;
	lElbow?: number;
	anjali?: number; // 0..1 blend both hands to joined palms at the chest
	gada?: 'hand' | 'none';
	gadaAng?: number; // extra rotation of the mace in the right hand
	gadaGlow?: number;
	wind?: number;
	windDir?: 1 | -1;
	head?: number;
	look?: number;
	brow?: number;
	tailFire?: number; // 0..1 flame on the tail tip
	tailUp?: number; // 0..1 tail raised high
	back?: boolean;
	legSpread?: number; // 0..1 wider, stronger stance
};

/** Local origin = between the feet; ~900 tall to the top of the head (crown tip ~ -1024). */
export const Hanuman: React.FC<HanumanPose> = ({
	t,
	pose = 'stand',
	rArm = 12,
	rElbow = 10,
	lArm = 18,
	lElbow = -20,
	anjali = 0,
	gada = 'hand',
	gadaAng = 0,
	gadaGlow = 0,
	wind = 0.5,
	windDir = 1,
	head = 0,
	look = 0,
	brow = 0,
	tailFire = 0,
	tailUp = 0,
	back = false,
	legSpread = 0,
}) => {
	const w = wind * windDir * (back ? -1 : 1);
	const br = Math.sin(t * 1.6) * 0.006;
	const gust = (k: number) => w * (0.75 + 0.25 * noise(t * 0.9 + k, 53));
	const wave = (k: number, amp: number) => Math.sin(t * 3.1 + k) * amp * Math.abs(wind);
	const kneel = pose === 'kneel';
	const drop = kneel ? 250 : 0; // upper body lowered when kneeling

	// arms (same system as the reference hero)
	const arm = (side: -1 | 1, a: number, b: number) => {
		const sx = side * 150;
		const sy = -712;
		let ux = sx + side * Math.sin(rad(a)) * 165;
		let uy = sy + Math.cos(rad(a)) * 165;
		const fa = a + b;
		let hx = ux + side * Math.sin(rad(fa)) * 150;
		let hy = uy + Math.cos(rad(fa)) * 150;
		// anjali: elbows out, palms joined at the chest
		const k = clamp(anjali);
		ux += (side * 196 - ux) * k;
		uy += (-566 - uy) * k;
		hx += (side * 16 - hx) * k;
		hy += (-650 - hy) * k;
		return {sx, sy, ux, uy, hx, hy, fa};
	};
	const R = arm(-1, rArm, rElbow);
	const L = arm(1, lArm, lElbow);

	const drawArm = (A: ReturnType<typeof arm>, side: -1 | 1) => (
		<g>
			<path d={limb(A.sx, A.sy, A.ux, A.uy, 44, 46, 32)} fill={HC.skin} />
			<path d={limb(A.sx + side * 10, A.sy + 6, A.ux + side * 6, A.uy, 18, 22, 14)} fill={HC.shade} opacity={side === 1 ? 0.6 : 0.25} />
			<path d={limb(A.ux, A.uy, A.hx, A.hy, 31, 33, 22)} fill={HC.skin} />
			{/* gold armlet + wrist band */}
			<path d={limb(A.sx + (A.ux - A.sx) * 0.5, A.sy + (A.uy - A.sy) * 0.5, A.sx + (A.ux - A.sx) * 0.62, A.sy + (A.uy - A.sy) * 0.62, 45, 45, 43)} fill={HC.gold} stroke={HC.darkBronze} strokeWidth={2} />
			<path d={limb(A.ux + (A.hx - A.ux) * 0.78, A.uy + (A.hy - A.uy) * 0.78, A.ux + (A.hx - A.ux) * 0.88, A.uy + (A.hy - A.uy) * 0.88, 26, 26, 25)} fill={HC.gold} stroke={HC.darkBronze} strokeWidth={2} />
			{anjali < 0.5 && (
				<g>
					<circle cx={A.hx} cy={A.hy} r={25} fill={HC.skin} />
					<circle cx={A.hx + side * 6} cy={A.hy + 4} r={14} fill={HC.shade} opacity={0.4} />
				</g>
			)}
		</g>
	);

	const hipY = -470;
	const torsoD = smoothPath(
		[
			[0, -770],
			[-40, -764],
			[-116, -746],
			[-184, -716],
			[-178, -664],
			[-150, -636],
			[-128, -578],
			[-96, -500],
			[-100, hipY],
			[100, hipY],
			[96, -500],
			[128, -578],
			[150, -636],
			[178, -664],
			[184, -716],
			[116, -746],
			[40, -764],
		],
		true,
	);

	// ---- tail: from the lower back, out to the right, rising in an S to a curl above the head
	const tw = (k: number, a: number) => Math.sin(t * 1.7 + k) * a + gust(70 + k) * a * 0.6;
	const up = clamp(tailUp);
	const tailPts: [number, number][] = [
		[70, -500],
		[200 + tw(0, 6), -470 + tw(1, 4)],
		[300 + tw(1, 12), -540 + tw(2, 8)],
		[320 + tw(2, 18), -680 - up * 60],
		[280 + tw(3, 24), -820 - up * 120],
		[320 + tw(4, 30), -960 - up * 170],
		[400 + tw(5, 34), -1010 - up * 190],
		[440 + tw(6, 30), -960 - up * 180],
		[410 + tw(7, 26), -920 - up * 170],
	];
	const tail = ribbon(tailPts, 22, 8);
	const tailTip = tail.tip;

	// ---- legs
	const legs = kneel ? (
		<g>
			{/* left (screen right) knee up, foot forward */}
			<path d={limb(70, -220, 120, -130, 46, 48, 36)} fill={HC.skin} />
			<path d={limb(120, -130, 110, -18, 36, 34, 20)} fill={HC.skin} />
			<path d={limb(130, -128, 118, -24, 14, 14, 9)} fill={HC.shade} opacity={0.55} />
			<path d="M84,-22 C76,-10 80,2 96,2 L136,2 C142,-8 136,-22 126,-26 Z" fill={HC.shade} />
			<rect x={90} y={-52} width={42} height={10} rx={4} fill={HC.gold} />
			{/* right knee on the ground */}
			<path d={limb(-70, -220, -110, -30, 46, 48, 34)} fill={HC.skin} />
			<ellipse cx={-112} cy={-18} rx={42} ry={20} fill={HC.shade} />
			{/* dhoti over the folded legs */}
			<path d={smoothPath([[-110, -232], [-150, -150], [-140, -60], [-70, -50], [-10, -110], [60, -150], [150, -170], [150, -232]], true)} fill={HC.saffron} />
			<path d={smoothPath([[-150, -150], [-140, -60], [-70, -50]])} stroke={HC.gold} strokeWidth={7} fill="none" />
			<path d={smoothPath([[40, -220], [70, -170], [150, -170]])} stroke={HC.saffronShade} strokeWidth={10} fill="none" opacity={0.7} />
		</g>
	) : (
		<g>
			<path d={limb(-60 - legSpread * 30, -250, -82 - legSpread * 60, -22, 44, 46, 22)} fill={HC.skin} />
			<path d={limb(60 + legSpread * 30, -250, 82 + legSpread * 60, -22, 44, 46, 22)} fill={HC.skin} />
			<path d={limb(66 + legSpread * 30, -236, 86 + legSpread * 60, -30, 16, 16, 9)} fill={HC.shade} opacity={0.55} />
			<rect x={-104 - legSpread * 60} y={-54} width={44} height={11} rx={4} fill={HC.gold} />
			<rect x={60 + legSpread * 60} y={-54} width={44} height={11} rx={4} fill={HC.gold} />
			<path d={`M${-106 - legSpread * 60},-24 C${-118 - legSpread * 60},-14 ${-122 - legSpread * 60},0 ${-106 - legSpread * 60},2 L${-62 - legSpread * 60},2 C${-54 - legSpread * 60},-6 ${-60 - legSpread * 60},-22 ${-68 - legSpread * 60},-26 Z`} fill={HC.shade} />
			<path d={`M${106 + legSpread * 60},-24 C${118 + legSpread * 60},-14 ${122 + legSpread * 60},0 ${106 + legSpread * 60},2 L${62 + legSpread * 60},2 C${54 + legSpread * 60},-6 ${60 + legSpread * 60},-22 ${68 + legSpread * 60},-26 Z`} fill={HC.shade} />
			{/* saffron dhoti, knee length, kachha folds */}
			<path
				d={smoothPath(
					[
						[-104, -482],
						[-122 - legSpread * 10, -400],
						[-126 - gust(30) * 8 - legSpread * 20, -300],
						[-108 - gust(31) * 12 - legSpread * 40, -206],
						[-34, -196],
						[-6, -276],
						[6, -276],
						[34, -196],
						[108 + gust(32) * 12 + legSpread * 40, -206],
						[126 + gust(33) * 8 + legSpread * 20, -300],
						[122 + legSpread * 10, -400],
						[104, -482],
					],
					true,
				)}
				fill={HC.saffron}
			/>
			<path d={smoothPath([[34, -470], [64, -360], [76, -260], [98, -200]])} stroke={HC.saffronShade} strokeWidth={14} fill="none" opacity={0.8} />
			<path d={smoothPath([[-30, -470], [-58, -350], [-74, -240]])} stroke={HC.saffronShade} strokeWidth={8} fill="none" opacity={0.5} />
			<path d={smoothPath([[-108 - gust(31) * 12 - legSpread * 40, -206], [-34, -196]])} stroke={HC.gold} strokeWidth={7} fill="none" />
			<path d={smoothPath([[34, -196], [108 + gust(32) * 12 + legSpread * 40, -206]])} stroke={HC.gold} strokeWidth={7} fill="none" />
		</g>
	);

	const sashSway = gust(20) * 16 + wave(7, 6);
	// sash (angavastram) tail streaming downwind from the left shoulder
	const sc = (k: number) => [
		[150, -720],
		[196 + gust(10) * 50 + wave(k, 8), -660],
		[236 + gust(11) * 120 + wave(k + 1, 16), -590],
		[262 + gust(12) * 200 + wave(k + 2, 26), -520],
		[284 + gust(13) * 260 + wave(k + 3, 32), -460],
	];
	const sTop = sc(0) as [number, number][];
	const sBot = (sc(0.6) as [number, number][]).map(([x, y], i) => [x - 8 - i * 3, y + 18 + i * 5] as [number, number]).reverse();

	const gadaEl =
		gada === 'hand' ? (
			<g transform={`translate(${R.hx} ${R.hy + drop}) rotate(${gadaAng - 8})`}>
				<Gada len={560} glow={gadaGlow} />
			</g>
		) : null;

	return (
		<g transform={back ? 'scale(-1 1)' : undefined}>
			{/* tail behind everything */}
			<g transform={`translate(0 ${drop * 0.6})`}>
				<path d={tail.d} fill={HC.skin} />
				<path d={smoothPath(tail.line.filter((_, i) => i % 3 === 0) as [number, number][])} stroke={HC.shade} strokeWidth={8} fill="none" opacity={0.45} transform="translate(6 4)" />
				<path d={`M${tailTip[0] - 10},${tailTip[1]} q10,-26 20,0 q-10,12 -20,0 Z`} fill={HC.shade} />
				{tailFire > 0.02 && (
					<g transform={`translate(${tailTip[0]} ${tailTip[1] + 10}) scale(${0.55 + tailFire * 0.9})`} opacity={clamp(tailFire * 2)}>
						<Fire t={t} x={0} y={0} s={1} seed={17} glow={0.9} />
					</g>
				)}
			</g>
			<path d={smoothPath([...sTop, ...sBot], true)} fill={HC.saffronShade} transform={`translate(0 ${drop})`} />
			{legs}
			<g transform={`translate(0 ${drop})`}>
				{drawArm(R, -1)}
				{!back && gadaEl}
				<g transform={`translate(0 -600) scale(1 ${1 + br}) translate(0 600)`}>
					<path d={torsoD} fill={HC.skin} />
					{back ? (
						<g>
							<path d="M0,-760 L0,-500" stroke={HC.shade} strokeWidth={6} opacity={0.6} />
							<path d="M-30,-720 C-80,-700 -116,-650 -104,-600 C-70,-620 -40,-660 -30,-720 Z M30,-720 C80,-700 116,-650 104,-600 C70,-620 40,-660 30,-720 Z" fill={HC.shade} opacity={0.55} />
						</g>
					) : (
						<g>
							<path d="M-128,-654 C-96,-606 -32,-604 -6,-640 C-32,-620 -96,-622 -128,-654 Z" fill={HC.shade} opacity={0.6} />
							<path d="M128,-654 C96,-602 32,-602 6,-640 C32,-616 96,-618 128,-654 Z" fill={HC.shade} opacity={0.75} />
							<path d="M44,-600 C74,-560 84,-520 94,-500 L100,-470 L44,-470 Z" fill={HC.shade} opacity={0.5} />
							<path d="M0,-630 L0,-500" stroke={HC.shade} strokeWidth={4} opacity={0.5} />
							<path d="M-32,-566 Q0,-560 32,-566 M-30,-530 Q0,-524 30,-530" stroke={HC.shade} strokeWidth={3} fill="none" opacity={0.45} />
							{/* sacred thread */}
							<path d="M120,-740 C60,-650 -20,-560 -96,-482" stroke="#e8dcc4" strokeWidth={4} fill="none" opacity={0.85} />
						</g>
					)}
					{/* belt */}
					<path d="M-102,-502 Q0,-486 102,-502 L104,-468 Q0,-452 -104,-468 Z" fill={HC.gold} stroke={HC.darkBronze} strokeWidth={3} />
					{!back && <path d={`M-18,-468 L18,-468 L${12 + sashSway},-300 L${sashSway},-282 L${-12 + sashSway},-300 Z`} fill={HC.saffronShade} stroke={HC.gold} strokeWidth={4} />}
					{/* sash across the chest (left shoulder) */}
					<path d="M128,-744 C158,-722 168,-692 150,-664 C130,-640 112,-640 96,-660 C104,-690 112,-720 128,-744 Z" fill={HC.sash} />
					{/* neck */}
					<path d="M-32,-792 L-36,-752 Q0,-740 36,-752 L32,-792 Z" fill={HC.skin} />
					<path d="M8,-788 L32,-792 L36,-754 Q20,-748 10,-750 Z" fill={HC.shade} opacity={0.6} />
					{/* heavy gold necklace with pendant */}
					{!back && (
						<g>
							<path d="M-60,-758 Q0,-700 60,-758" stroke={HC.gold} strokeWidth={10} fill="none" strokeLinecap="round" />
							<path d="M-80,-752 Q0,-660 80,-752" stroke="#8a6a2a" strokeWidth={6} fill="none" strokeDasharray="2 10" strokeLinecap="round" />
							<path d="M0,-712 l14,18 l-14,22 l-14,-22 Z" fill={HC.paleGold} stroke={HC.darkBronze} strokeWidth={2} />
						</g>
					)}
				</g>
				<g transform={`rotate(${head} 0 -790)`}>
					{back ? (
						<g>
							<path d="M-52,-868 L-46,-912 L46,-912 L52,-868 Z" fill={HC.gold} stroke={HC.darkBronze} strokeWidth={3} />
							<path d="M-44,-912 L-34,-950 L34,-950 L44,-912 Z" fill="#a67a36" stroke={HC.darkBronze} strokeWidth={3} />
							<path d="M-32,-950 L-20,-982 L20,-982 L32,-950 Z" fill={HC.gold} stroke={HC.darkBronze} strokeWidth={3} />
							<path d="M-14,-982 L0,-1024 L14,-982 Z" fill={HC.paleGold} stroke={HC.darkBronze} strokeWidth={3} />
							<path d={smoothPath([[-50, -868], [-56, -820], [-44, -776], [0, -766], [44, -776], [56, -820], [50, -868]], true)} fill={HC.shade} />
							<ellipse cx={-56} cy={-832} rx={14} ry={20} fill={HC.skin} />
							<ellipse cx={56} cy={-832} rx={14} ry={20} fill={HC.skin} />
						</g>
					) : (
						<HanumanHead look={look} brow={brow} t={t} />
					)}
				</g>
				{drawArm(L, 1)}
				{back && gadaEl}
				{/* joined palms */}
				{anjali > 0.5 && (
					<g opacity={clamp((anjali - 0.5) * 2)}>
						<path d="M-24,-604 C-30,-650 -16,-712 0,-722 C16,-712 30,-650 24,-604 Z" fill={HC.skin} stroke={HC.shade} strokeWidth={3} />
						<path d="M0,-720 L0,-608" stroke={HC.shade} strokeWidth={3} />
						<path d="M2,-718 C14,-704 24,-660 22,-610 L2,-610 Z" fill={HC.shade} opacity={0.45} />
					</g>
				)}
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ SITA (seated under the Ashoka tree)
// Faded yellow-ochre saree with a muted red border, pallu over the head, one long braid. Local origin: ground centre, ~600 tall.
export const Sita: React.FC<{t: number; bow?: number; reach?: number; look?: number; glow?: number}> = ({t, bow = 0.6, reach = 0, look = 0, glow = 0}) => {
	const skin = '#b07e5a';
	const shade = '#7a5038';
	const saree = '#b89a5c';
	const sareeShade = '#7e6638';
	const border = '#7a2a1e';
	const br = Math.sin(t * 1.4) * 2;
	const hx = 120 + reach * 80;
	const hy = -250 - reach * 70;
	return (
		<g>
			{glow > 0.02 && <ellipse cx={0} cy={-330} rx={260} ry={300} fill="#ffe2a0" opacity={0.25 * glow} filter="url(#b40)" />}
			{/* folded legs / saree pool */}
			<path d={smoothPath([[-230, -10], [-210, -110], [-120, -160], [0, -170], [120, -160], [210, -110], [230, -10], [0, 14]], true)} fill={saree} />
			<path d={smoothPath([[40, -168], [150, -150], [220, -90], [230, -10], [120, 8], [60, -60]], true)} fill={sareeShade} opacity={0.55} />
			<path d={smoothPath([[-230, -10], [0, 14], [230, -10]])} stroke={border} strokeWidth={10} fill="none" />
			<path d="M-160,-60 C-100,-110 -20,-100 30,-80 M160,-60 C110,-100 60,-110 10,-96" stroke={sareeShade} strokeWidth={6} fill="none" opacity={0.6} />
			{/* torso */}
			<g transform={`translate(0 ${br * 0.5})`}>
				<path d={smoothPath([[-80, -170], [-92, -280], [-96, -380], [-60, -430], [0, -440], [60, -430], [96, -380], [92, -280], [80, -170]], true)} fill={saree} />
				<path d={smoothPath([[20, -440], [60, -430], [96, -380], [92, -280], [80, -170], [30, -170]], true)} fill={sareeShade} opacity={0.5} />
				{/* pallu diagonal with border */}
				<path d="M-96,-400 C-40,-330 30,-250 84,-180 L60,-170 C10,-240 -60,-320 -100,-370 Z" fill="#a88a4e" />
				<path d="M-96,-404 C-40,-334 30,-254 86,-184" stroke={border} strokeWidth={7} fill="none" />
				{/* arms */}
				<path d={limb(-86, -400, -130, -270, 24, 22, 17)} fill={skin} />
				<path d={limb(-130, -270, -60, -200, 17, 16, 13)} fill={skin} />
				<path d={limb(86, -400, 130, -290, 24, 22, 17)} fill={skin} />
				<path d={limb(130, -290, hx, hy, 17, 16, 13)} fill={skin} />
				<circle cx={-60} cy={-200} r={16} fill={skin} />
				<path d={`M${hx - 18},${hy - 6} Q${hx},${hy - 22} ${hx + 18},${hy - 4} Q${hx + 4},${hy + 14} ${hx - 18},${hy - 6} Z`} fill={skin} stroke={shade} strokeWidth={2} />
				{/* bangles */}
				<path d="M-72,-216 l18,10 M-76,-208 l18,10" stroke={C.gold} strokeWidth={4} />
				<path d={`M${hx - 30},${hy + 14} l-10,-14 M${hx - 38},${hy + 18} l-10,-14`} stroke={C.gold} strokeWidth={4} />
				{/* head (bowed) */}
				<g transform={`rotate(${bow * 14} 0 -440) translate(0 ${bow * 18})`}>
					<path d="M-26,-470 L-28,-436 Q0,-428 28,-436 L26,-470 Z" fill={skin} />
					<path d={smoothPath([[-50, -560], [-54, -520], [-46, -488], [-26, -468], [0, -462], [26, -468], [46, -488], [54, -520], [50, -560], [0, -580]], true)} fill={skin} />
					<path d={smoothPath([[8, -578], [50, -560], [54, -520], [46, -488], [26, -468], [8, -464], [20, -510], [16, -550]], true)} fill={shade} opacity={0.5} />
					{/* hair parting + bindi */}
					<path d="M-52,-552 C-40,-590 40,-590 52,-552 C30,-574 -30,-574 -52,-552 Z" fill="#120c0a" />
					<circle cx={0} cy={-540} r={4} fill={C.red} />
					{/* lowered eyes */}
					<path d={`M-30,-522 Q-20,${-516 + bow * 2} -10,-522 M10,-522 Q20,${-516 + bow * 2} 30,-522`} stroke="#1a0e08" strokeWidth={3.5} fill="none" />
					{look !== 0 && <circle cx={-20 + look * 4} cy={-520} r={2.5} fill="#1a0e08" />}
					<path d="M-4,-516 L-6,-500 L4,-498" stroke={shade} strokeWidth={3} fill="none" />
					<path d="M-10,-484 Q0,-480 10,-484" stroke="#5a2a20" strokeWidth={3} fill="none" />
					{/* nose ring + earrings */}
					<circle cx={8} cy={-496} r={5} stroke={C.gold} strokeWidth={2} fill="none" />
					<circle cx={-54} cy={-506} r={7} fill={C.gold} />
					<circle cx={54} cy={-506} r={7} fill={C.gold} />
					{/* pallu over the head */}
					<path d={smoothPath([[-70, -520], [-66, -582], [-20, -612], [30, -612], [70, -580], [76, -520], [90, -440], [100, -380], [70, -420], [56, -500], [46, -560], [0, -588], [-46, -560], [-56, -500], [-80, -420], [-100, -360], [-90, -440]], true)} fill="#a88a4e" />
					<path d={smoothPath([[-90, -440], [-70, -520], [-66, -582], [-20, -612], [30, -612], [70, -580], [76, -520], [90, -440]])} stroke={border} strokeWidth={7} fill="none" />
				</g>
				{/* long braid over the shoulder */}
				<path d={smoothPath([[-50, -470], [-74, -400], [-80, -320], [-72, -240], [-60, -190]])} stroke="#120c0a" strokeWidth={22} fill="none" strokeLinecap="round" />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ ANJANI (Hanuman's mother, standing, praying to the wind)
// Deep green-ochre saree, hair loose in the wind. Distinct from Sita by colour, posture and open hair. Origin between the feet, ~860 tall.
export const Anjani: React.FC<{t: number; pray?: number; wind?: number}> = ({t, pray = 1, wind = 1}) => {
	const skin = '#a8744e';
	const shade = '#6e4a32';
	const saree = '#55623a';
	const sareeShade = '#384226';
	const g = (k: number, a: number) => (Math.sin(t * 2.2 + k) * 0.5 + 0.8 + 0.3 * noise(t + k, 7)) * a * wind;
	const lift = clamp(pray);
	const hy = -760 - lift * 170;
	return (
		<g>
			{/* hair streaming right */}
			<path d={smoothPath([[-40, -860], [40 + g(1, 40), -880], [140 + g(2, 90), -830], [240 + g(3, 140), -780], [180 + g(4, 110), -730], [90 + g(5, 60), -740], [40, -760], [-30, -780]], true)} fill="#140d0a" />
			{/* pallu flying */}
			<path d={smoothPath([[60, -700], [160 + g(6, 60), -680], [280 + g(7, 120), -620], [380 + g(8, 170), -540], [300 + g(9, 120), -500], [190 + g(10, 60), -560], [80, -600]], true)} fill="#6a7446" />
			{/* saree body */}
			<path d={smoothPath([[-80, -560], [-110, -400], [-130 - g(11, 10), -200], [-140 - g(12, 16), 0], [140 + g(13, 30), 0], [130 + g(14, 20), -200], [110, -400], [80, -560]], true)} fill={saree} />
			<path d={smoothPath([[20, -560], [80, -560], [110, -400], [130 + g(14, 20), -200], [140 + g(13, 30), 0], [40, 0], [60, -300]], true)} fill={sareeShade} opacity={0.6} />
			<path d={`M-140,${-6 - g(12, 4)} L140,${-6 + g(13, 4)}`} stroke={C.gold} strokeWidth={8} />
			<path d="M-60,-520 C-20,-400 10,-240 0,0 M40,-500 C70,-360 80,-200 90,0" stroke={sareeShade} strokeWidth={6} fill="none" opacity={0.5} />
			{/* torso */}
			<path d={smoothPath([[-80, -560], [-96, -660], [-90, -730], [0, -760], [90, -730], [96, -660], [80, -560]], true)} fill={saree} />
			<path d="M-90,-730 C-20,-660 40,-600 82,-560 L60,-556 C20,-600 -40,-650 -94,-700 Z" fill="#6a7446" />
			{/* arms raised, palms joined above the head */}
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={limb(s * 86, -720, s * (140 - lift * 30), -620 - lift * 220, 22, 21, 16)} fill={skin} />
					<path d={limb(s * (140 - lift * 30), -620 - lift * 220, s * 14, hy, 16, 15, 12)} fill={skin} />
					<path d={`M${s * 100},${-660 - lift * 200} l${-s * 10},-12`} stroke={C.gold} strokeWidth={5} />
				</g>
			))}
			<path d={`M-16,${hy + 20} C-20,${hy - 20} -8,${hy - 56} 0,${hy - 62} C8,${hy - 56} 20,${hy - 20} 16,${hy + 20} Z`} fill={skin} stroke={shade} strokeWidth={2} />
			{/* head, turned up to the sky */}
			<g transform="rotate(-10 0 -790)">
				<path d="M-24,-800 L-26,-764 Q0,-756 26,-764 L24,-800 Z" fill={skin} />
				<path d={smoothPath([[-46, -880], [-50, -844], [-42, -812], [-24, -794], [0, -788], [24, -794], [42, -812], [50, -844], [46, -880], [0, -896]], true)} fill={skin} />
				<path d={smoothPath([[8, -894], [46, -880], [50, -844], [42, -812], [24, -794], [8, -790], [20, -836], [16, -872]], true)} fill={shade} opacity={0.5} />
				<path d="M-48,-872 C-36,-910 36,-910 48,-872 C28,-892 -28,-892 -48,-872 Z" fill="#140d0a" />
				<circle cx={0} cy={-866} r={4} fill={C.red} />
				<path d="M-30,-846 Q-20,-852 -10,-846 M10,-846 Q20,-852 30,-846" stroke="#1a0e08" strokeWidth={3.5} fill="none" />
				<path d="M-10,-806 Q0,-802 10,-806" stroke="#5a2a20" strokeWidth={3} fill="none" />
				<circle cx={-50} cy={-826} r={6} fill={C.gold} />
				<circle cx={50} cy={-826} r={6} fill={C.gold} />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ RAM (seen from behind, as a backlit silhouette with his bow)
// Blue-grey skin, yellow pitambar, tall crown, bow held upright, quiver on the back. Origin between the feet, ~920 tall.
export const Ram: React.FC<{t: number; wind?: number}> = ({t, wind = 0.6}) => {
	const skin = '#3e5672';
	const g = (k: number) => Math.sin(t * 2.4 + k) * 10 * wind;
	return (
		<g>
			{/* bow (held in the left hand, upright) */}
			<path d={smoothPath([[-196, -1040], [-250, -800], [-262, -560], [-246, -320], [-196, -110]])} stroke="#3a2614" strokeWidth={14} fill="none" strokeLinecap="round" />
			<path d="M-196,-1040 L-196,-110" stroke="#d8cfbd" strokeWidth={2.5} />
			{/* uttariya streaming */}
			<path d={smoothPath([[120, -720], [200 + g(1), -640], [280 + g(2) * 2, -540], [340 + g(3) * 3, -440], [260 + g(4) * 2, -460], [180 + g(5), -560], [110, -620]], true)} fill="#c4a24a" />
			{/* legs + pitambar */}
			<path d={limb(-52, -240, -70, -20, 40, 40, 20)} fill={skin} />
			<path d={limb(52, -240, 70, -20, 40, 40, 20)} fill={skin} />
			<path d={smoothPath([[-100, -480], [-118, -380], [-120, -240], [-100, -170], [100, -170], [120, -240], [118, -380], [100, -480]], true)} fill="#c49a3a" />
			<path d="M-100,-176 L100,-176" stroke={C.red} strokeWidth={8} />
			{/* back */}
			<path d={smoothPath([[0, -770], [-110, -746], [-176, -712], [-170, -660], [-130, -590], [-96, -490], [96, -490], [130, -590], [170, -660], [176, -712], [110, -746]], true)} fill={skin} />
			{/* quiver across the back with arrow fletchings */}
			<path d="M-40,-520 L90,-820 L120,-806 L-6,-506 Z" fill="#5a3a1a" stroke="#2a1a0a" strokeWidth={3} />
			{[0, 1, 2, 3].map((i) => (
				<path key={i} d={`M${92 + i * 8},${-818 - i * 4} l${10 + i * 2},-60 l8,4 Z`} fill={C.paleGold} />
			))}
			{/* arms */}
			<path d={limb(-150, -712, -190, -560, 36, 36, 26)} fill={skin} />
			<path d={limb(-190, -560, -200, -420, 26, 26, 20)} fill={skin} />
			<circle cx={-200} cy={-420} r={22} fill={skin} />
			<path d={limb(150, -712, 180, -560, 36, 36, 26)} fill={skin} />
			<path d={limb(180, -560, 170, -420, 26, 26, 20)} fill={skin} />
			{/* head from behind, hair to the shoulders, tall crown */}
			<path d="M-30,-790 L-34,-750 L34,-750 L30,-790 Z" fill={skin} />
			<path d={smoothPath([[-50, -870], [-58, -800], [-60, -730], [-20, -720], [20, -720], [60, -730], [58, -800], [50, -870], [0, -890]], true)} fill="#0e0a0a" />
			<path d="M-52,-868 L-40,-960 L-20,-1000 L0,-1030 L20,-1000 L40,-960 L52,-868 Z" fill={C.gold} stroke={C.darkBronze} strokeWidth={3} />
			<path d="M-46,-900 L46,-900 M-40,-950 L40,-950" stroke={C.darkBronze} strokeWidth={3} />
		</g>
	);
};

// ------------------------------------------------------------------ RAVAN (ten heads, seated on his throne; mostly seen as a dark presence)
// Origin between the feet, ~980 tall incl. the heads.
export const Ravan: React.FC<{t: number; point?: number}> = ({t, point = 0}) => {
	const skin = '#3a2a2a';
	const sh = '#1e1414';
	const heads = Array.from({length: 10}, (_, i) => {
		const k = i - 4.5;
		return {x: k * 62, y: -880 + Math.abs(k) * Math.abs(k) * 5, s: 1 - Math.abs(k) * 0.05};
	}).sort((a, b) => Math.abs(b.x) - Math.abs(a.x));
	const br = Math.sin(t * 1.2) * 4;
	return (
		<g>
			{/* legs */}
			<path d={limb(-70, -240, -90, -20, 50, 50, 26)} fill={skin} />
			<path d={limb(70, -240, 90, -20, 50, 50, 26)} fill={skin} />
			<path d={smoothPath([[-130, -500], [-150, -380], [-140, -240], [140, -240], [150, -380], [130, -500]], true)} fill="#3a1010" />
			{/* torso */}
			<path d={smoothPath([[0, -790], [-130, -760], [-210, -720], [-200, -650], [-150, -570], [-120, -500], [120, -500], [150, -570], [200, -650], [210, -720], [130, -760]], true)} fill={skin} />
			<path d="M-120,-500 L120,-500 L124,-470 L-124,-470 Z" fill={C.gold} />
			<path d="M-70,-770 Q0,-690 70,-770" stroke={C.gold} strokeWidth={10} fill="none" />
			{/* arms: left rests, right points */}
			<path d={limb(-180, -710, -230, -540, 44, 42, 30)} fill={skin} />
			<path d={limb(-230, -540, -180, -400, 30, 28, 22)} fill={skin} />
			<path d={limb(180, -710, 250 + point * 80, -580 - point * 140, 44, 42, 30)} fill={skin} />
			<path d={limb(250 + point * 80, -580 - point * 140, 300 + point * 170, -470 - point * 330, 30, 28, 20)} fill={skin} />
			{/* ten crowned heads */}
			{heads.map((h, i) => (
				<g key={i} transform={`translate(${h.x} ${h.y + br * (i % 2 ? 1 : -1) * 0.5}) scale(${h.s})`}>
					<path d={smoothPath([[-40, -40], [-46, 0], [-36, 34], [0, 48], [36, 34], [46, 0], [40, -40], [0, -54]], true)} fill={skin} />
					<path d="M-40,-36 L-34,-96 L-14,-80 L0,-118 L14,-80 L34,-96 L40,-36 Z" fill={C.gold} stroke={C.darkBronze} strokeWidth={3} />
					<path d="M-24,-6 L-8,-2 M24,-6 L8,-2" stroke="#ffb070" strokeWidth={4} strokeLinecap="round" />
					<path d="M-20,26 Q0,20 20,26" stroke={sh} strokeWidth={8} fill="none" />
				</g>
			))}
		</g>
	);
};

// ------------------------------------------------------------------ close-up: Hanuman's hand gives Shri Ram's ring to Sita's hand
export const RingHands: React.FC<{t: number; give: number; glow: number}> = ({t, give, glow}) => {
	const hx = -140 + give * 120;
	const sx = 260 - give * 60;
	const ringX = hx + 70 + give * 30;
	const r = rng(3);
	return (
		<g>
			{/* Sita's hand (from the right, palm up, bangles) */}
			<g transform={`translate(${sx} 60)`}>
				<path d="M560,140 C420,120 300,90 200,70 L170,10 C260,10 380,20 560,40 Z" fill="#b07e5a" />
				<path d="M200,70 C140,64 60,50 0,30 C-30,20 -40,0 -20,-6 C20,-10 80,0 120,4 C80,-20 40,-30 20,-44 C10,-60 30,-66 60,-56 L180,10 Z" fill="#b07e5a" stroke="#7a5038" strokeWidth={4} />
				<path d="M20,-20 Q80,-6 150,10" stroke="#7a5038" strokeWidth={3} fill="none" opacity={0.6} />
				{[0, 1, 2].map((i) => (
					<ellipse key={i} cx={250 + i * 26} cy={70} rx={12} ry={58} fill={i === 1 ? C.red : C.gold} stroke={C.darkBronze} strokeWidth={2} />
				))}
			</g>
			{/* Hanuman's hand (from the left, offering, gold wrist band) */}
			<g transform={`translate(${hx} -40)`}>
				<path d="M-600,120 C-420,90 -260,40 -120,20 L-100,-60 C-260,-50 -420,-30 -600,-10 Z" fill={HC.skin} />
				<path d="M-600,90 C-420,70 -260,30 -140,14 L-130,0 C-260,10 -420,40 -600,60 Z" fill={HC.shade} opacity={0.4} />
				<path d="M-170,-70 L-150,40 L-110,36 L-130,-74 Z" fill={HC.gold} stroke={HC.darkBronze} strokeWidth={3} />
				<path d="M-120,-60 C-40,-80 40,-60 90,-30 C110,-14 100,6 80,4 L20,0 C60,20 70,40 50,50 L-110,30 Z" fill={HC.skin} stroke={HC.shade} strokeWidth={4} />
				<path d="M-40,-40 Q20,-40 70,-20 M-60,10 Q0,14 40,30" stroke={HC.shade} strokeWidth={3} fill="none" opacity={0.6} />
			</g>
			{/* the ring */}
			<g transform={`translate(${ringX} ${-62 + give * 30})`}>
				<circle r={110 * glow + 30} fill="#ffd27a" opacity={0.3 * glow} filter="url(#b24)" />
				<ellipse rx={30} ry={13} fill="none" stroke="#e9c77e" strokeWidth={9} />
				<ellipse rx={30} ry={13} fill="none" stroke={C.darkBronze} strokeWidth={2} />
				<path d="M-8,-14 L0,-30 L8,-14 Z" fill="#f4e2b0" stroke={C.darkBronze} strokeWidth={2} />
				{Array.from({length: 6}, (_, i) => {
					const a = r() * Math.PI * 2;
					const d = 40 + ((t * 40 + i * 30) % 90);
					return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.6} r={2.5} fill="#ffe7b0" opacity={glow * (1 - d / 130)} />;
				})}
			</g>
		</g>
	);
};
