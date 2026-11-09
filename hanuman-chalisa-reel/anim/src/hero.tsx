// HANUMAN — detailed build. Same construction and proportions as the house hero (origin between the feet,
// shoulders at +/-150,-712, chin ~ -770, crown tip ~ -1030), now with full anatomy, face, jewellery and cloth.
// Signature silhouette: tiered jewelled crown, the gada, the S-curved tail ending in a curl.
import React from 'react';
import {limb} from './characters';
import {Beads, Border, Foot, Fur, Hand, Jewel, Pleats, Skin} from './detail';
import {C, clamp, noise, smoothPath} from './lib';
import {Fire} from './world';
import {Gada, HC, ribbon} from './props';

const rad = (d: number) => (d * Math.PI) / 180;
export const HSK: Skin = {base: HC.skin, shade: HC.shade, light: HC.light, line: '#4a2416'};
const GOLD = C.gold;
const DB = C.darkBronze;

// ------------------------------------------------------------------ head
const Crown: React.FC = () => (
	<g>
		{/* pearl strings hanging from the band */}
		{[-1, 1].map((s) => (
			<g key={s}>
				<Beads pts={[[s * 50, -872], [s * 62, -846], [s * 64, -818]]} n={7} r={3.2} fill="#efe6d2" stroke="#9a8a6a" />
				<Jewel x={s * 64} y={-812} r={4.5} stone="#3a6a5a" />
			</g>
		))}
		{/* side flares (kirita wings) */}
		{[-1, 1].map((s) => (
			<g key={s}>
				<path d={`M${s * 50},-882 C${s * 70},-880 ${s * 80},-866 ${s * 76},-846 C${s * 70},-852 ${s * 62},-858 ${s * 52},-860 Z`} fill={GOLD} stroke={DB} strokeWidth={2.5} />
				<path d={`M${s * 56},-874 C${s * 66},-872 ${s * 72},-864 ${s * 72},-856`} stroke={DB} strokeWidth={1.2} fill="none" />
				<circle cx={s * 64} cy={-868} r={2.6} fill={C.red} />
			</g>
		))}
		{/* band */}
		<path d="M-54,-866 L-48,-914 L48,-914 L54,-866 Q0,-856 -54,-866 Z" fill={GOLD} stroke={DB} strokeWidth={3} />
		<path d="M-52,-876 Q0,-866 52,-876" stroke={DB} strokeWidth={1.6} fill="none" />
		<path d="M-50,-904 L50,-904" stroke={DB} strokeWidth={1.6} />
		{Array.from({length: 11}, (_, i) => (
			<circle key={i} cx={-45 + i * 9} cy={-909} r={2} fill={C.paleGold} stroke={DB} strokeWidth={0.6} />
		))}
		<Jewel x={-28} y={-890} r={6} stone="#2e5a4a" />
		<Jewel x={28} y={-890} r={6} stone="#2e5a4a" />
		<Jewel x={0} y={-891} r={10} stone={C.red} />
		{/* tier 2 with petals */}
		<path d="M-46,-914 L-36,-956 L36,-956 L46,-914 Z" fill="#a67a36" stroke={DB} strokeWidth={3} />
		{Array.from({length: 7}, (_, i) => {
			const x = -33 + i * 11;
			return <path key={i} d={`M${x - 5},-916 Q${x},-944 ${x + 5},-916 Z`} fill={GOLD} stroke={DB} strokeWidth={1.4} />;
		})}
		<path d="M-38,-948 L38,-948" stroke={DB} strokeWidth={1.5} />
		{/* tier 3 */}
		<path d="M-34,-956 L-22,-990 L22,-990 L34,-956 Z" fill={GOLD} stroke={DB} strokeWidth={3} />
		{Array.from({length: 5}, (_, i) => (
			<circle key={i} cx={-18 + i * 9} cy={-972} r={3} fill={C.red} stroke={DB} strokeWidth={1} />
		))}
		{/* lotus bud finial */}
		<path d="M-18,-990 C-20,-1006 -10,-1020 0,-1032 C10,-1020 20,-1006 18,-990 Z" fill={C.paleGold} stroke={DB} strokeWidth={2.5} />
		<path d="M0,-1030 L0,-994 M-10,-1004 Q0,-998 10,-1004" stroke={DB} strokeWidth={1.4} fill="none" />
		<circle cx={0} cy={-1038} r={5} fill="#efe6d2" stroke="#9a8a6a" />
		{/* shading on the far side */}
		<path d="M10,-914 L48,-914 L54,-866 L16,-862 Z M8,-956 L36,-956 L46,-914 L12,-914 Z M6,-990 L22,-990 L34,-956 L10,-956 Z" fill="#000" opacity={0.17} />
	</g>
);

const HanumanHead: React.FC<{look: number; brow: number; t: number; mouth?: number}> = ({look, brow, t, mouth = 0}) => {
	const blink = noise(t * 0.7, 9) > 0.93 ? 0.15 : 1;
	return (
		<g>
			{/* dark locks behind the ears */}
			<path d="M-54,-870 C-74,-840 -76,-800 -64,-770 L-50,-786 C-58,-812 -56,-842 -46,-866 Z M54,-870 C74,-840 76,-800 64,-770 L50,-786 C58,-812 56,-842 46,-866 Z" fill="#1a0e0a" />
			{/* ears with inner shading and kundal earrings */}
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={`M${s * 50},-850 C${s * 70},-858 ${s * 74},-830 ${s * 66},-812 C${s * 60},-806 ${s * 52},-810 ${s * 50},-818 Z`} fill={s < 0 ? HC.skin : HC.shade} stroke={HSK.line} strokeWidth={1.5} />
					<path d={`M${s * 54},-842 C${s * 64},-844 ${s * 66},-830 ${s * 60},-820`} stroke={HSK.line} strokeWidth={2} fill="none" opacity={0.7} />
					<circle cx={s * 64} cy={-800} r={11} stroke={GOLD} strokeWidth={5} fill="none" />
					<circle cx={s * 64} cy={-800} r={11} stroke={DB} strokeWidth={1} fill="none" />
					<Jewel x={s * 64} y={-786} r={5} stone={C.red} />
				</g>
			))}
			{/* face base with the fur fringe (vanara) */}
			<path d={smoothPath([[-50, -868], [-58, -830], [-54, -796], [-36, -772], [0, -762], [36, -772], [54, -796], [58, -830], [50, -868], [0, -878]], true)} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
			<path d={smoothPath([[10, -878], [50, -868], [58, -830], [54, -796], [36, -772], [8, -764], [24, -810], [20, -852]], true)} fill={HC.shade} opacity={0.5} />
			{/* jaw and cheek fur tufts */}
			{[-1, 1].map((s) => (
				<path
					key={s}
					d={`M${s * 52},-826 L${s * 70},-812 L${s * 56},-808 L${s * 68},-792 L${s * 50},-792 L${s * 58},-776 L${s * 40},-780 L${s * 42},-764 L${s * 26},-772 Z`}
					fill={s < 0 ? '#7a4028' : '#5a2c1a'}
					stroke={HSK.line}
					strokeWidth={1.2}
				/>
			))}
			<Fur pts={[[-50, -830], [-40, -790], [0, -770], [40, -790], [50, -830]]} n={26} len={8} color="#4a2416" seed={4} ang={1.2} w={1.4} opacity={0.6} />
			{/* muzzle */}
			<path d={smoothPath([[-36, -828], [-44, -800], [-30, -774], [0, -764], [30, -774], [44, -800], [36, -828], [16, -834], [0, -830], [-16, -834]], true)} fill={HC.muzzle} stroke={HSK.line} strokeWidth={1.4} />
			<path d={smoothPath([[8, -832], [36, -828], [44, -800], [30, -774], [8, -766], [20, -800]], true)} fill={HC.muzzleShade} opacity={0.5} />
			<path d="M-30,-806 Q-36,-796 -28,-786 M30,-806 Q36,-796 28,-786" stroke={HC.muzzleShade} strokeWidth={2} fill="none" />
			{/* brow ridge with fur strokes */}
			<path d={`M-44,${-850 + brow} Q-24,${-866 + brow} -4,${-852 + brow} L-4,${-845 + brow} Q-24,${-856 + brow} -44,${-844 + brow} Z M44,${-850 + brow} Q24,${-866 + brow} 4,${-852 + brow} L4,${-845 + brow} Q24,${-856 + brow} 44,${-844 + brow} Z`} fill="#2a140c" />
			<Fur pts={[[-42, -852 + brow], [-6, -856 + brow]]} n={8} len={6} color="#2a140c" seed={7} ang={-0.9} w={1.3} />
			<Fur pts={[[6, -856 + brow], [42, -852 + brow]]} n={8} len={6} color="#2a140c" seed={8} ang={-2.2} w={1.3} />
			{/* eyes: white, amber iris, pupil, highlight, kohl upper lid, lower lid */}
			<g transform={`translate(0 -840) scale(1 ${blink}) translate(0 840)`}>
				{[-1, 1].map((s) => (
					<g key={s}>
						<path d={`M${s * 34},-839 Q${s * 22},-849 ${s * 9},-840 Q${s * 22},-833 ${s * 34},-839 Z`} fill="#eee2c8" />
						<circle cx={s * 21 + look * 3} cy={-840} r={5} fill="#7a4414" />
						<circle cx={s * 21 + look * 3} cy={-840} r={2.6} fill="#120a06" />
						<circle cx={s * 21 + look * 3 - 1.6} cy={-841.8} r={1.2} fill="#fff" />
						<path d={`M${s * 35},-838 Q${s * 22},-851 ${s * 8},-840`} stroke="#120a06" strokeWidth={2.6} fill="none" strokeLinecap="round" />
						<path d={`M${s * 32},-836 Q${s * 22},-831 ${s * 11},-837`} stroke={HSK.line} strokeWidth={1.2} fill="none" opacity={0.7} />
					</g>
				))}
			</g>
			{/* Vaishnava tilak */}
			<path d="M-9,-866 L-7,-847 Q0,-840 7,-847 L9,-866" stroke="#efe6d6" strokeWidth={3.4} fill="none" />
			<path d="M0,-867 L0,-845" stroke={C.red} strokeWidth={5} strokeLinecap="round" />
			{/* nose bridge, nostrils, philtrum */}
			<path d="M-5,-842 Q-8,-830 -6,-822 M5,-842 Q8,-830 6,-822" stroke={HC.muzzleShade} strokeWidth={1.6} fill="none" />
			<path d="M-12,-820 Q0,-830 12,-820 Q6,-812 0,-815 Q-6,-812 -12,-820 Z" fill="#4a2214" />
			<ellipse cx={-6} cy={-818} rx={3} ry={2} fill="#1a0a06" />
			<ellipse cx={6} cy={-818} rx={3} ry={2} fill="#1a0a06" />
			<path d="M0,-813 L0,-800" stroke={HC.muzzleShade} strokeWidth={1.6} />
			{/* lips: a calm, kind mouth */}
			<path d={`M-22,-798 Q-11,${-794 + mouth * 3} 0,-797 Q11,${-794 + mouth * 3} 22,-798`} stroke="#5a2a1c" strokeWidth={3} fill="none" strokeLinecap="round" />
			<path d={`M-14,-794 Q0,${-786 + mouth * 4} 14,-794`} stroke="#8a5a40" strokeWidth={2} fill="none" />
			<path d="M-8,-781 Q0,-778 8,-781" stroke={HC.muzzleShade} strokeWidth={1.5} fill="none" />
			<Crown />
		</g>
	);
};

const HanumanHeadBack: React.FC = () => (
	<g>
		<path d={smoothPath([[-52, -868], [-60, -820], [-50, -774], [0, -762], [50, -774], [60, -820], [52, -868], [0, -878]], true)} fill="#1e100a" />
		<Fur pts={[[-50, -860], [-54, -800], [0, -770], [54, -800], [50, -860]]} n={30} len={12} color="#3a2014" seed={12} ang={1.4} w={2} />
		{[-1, 1].map((s) => (
			<g key={s}>
				<path d={`M${s * 52},-850 C${s * 72},-858 ${s * 76},-830 ${s * 68},-812 C${s * 62},-806 ${s * 54},-810 ${s * 52},-818 Z`} fill={HC.skin} stroke={HSK.line} strokeWidth={1.5} />
				<circle cx={s * 64} cy={-800} r={11} stroke={GOLD} strokeWidth={5} fill="none" />
			</g>
		))}
		<Crown />
	</g>
);

// ------------------------------------------------------------------ the figure
export type HanumanPose = {
	t: number;
	pose?: 'stand' | 'kneel';
	rArm?: number;
	rElbow?: number;
	lArm?: number;
	lElbow?: number;
	anjali?: number;
	gada?: 'hand' | 'none';
	gadaAng?: number;
	gadaGlow?: number;
	rHand?: 'fist' | 'grip' | 'open' | 'relaxed' | 'point' | 'offer';
	lHand?: 'fist' | 'grip' | 'open' | 'relaxed' | 'point' | 'offer';
	wind?: number;
	windDir?: 1 | -1;
	head?: number;
	look?: number;
	brow?: number;
	tailFire?: number;
	tailUp?: number;
	back?: boolean;
	legSpread?: number;
};

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
	rHand,
	lHand = 'relaxed',
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
	const drop = kneel ? 250 : 0;
	const rH = rHand ?? (gada === 'hand' ? 'grip' : 'relaxed');

	const arm = (side: -1 | 1, a: number, b: number) => {
		const sx = side * 150;
		const sy = -712;
		let ux = sx + side * Math.sin(rad(a)) * 165;
		let uy = sy + Math.cos(rad(a)) * 165;
		const fa = a + b;
		let hx = ux + side * Math.sin(rad(fa)) * 140;
		let hy = uy + Math.cos(rad(fa)) * 140;
		const k = clamp(anjali);
		ux += (side * 196 - ux) * k;
		uy += (-566 - uy) * k;
		hx += (side * 20 - hx) * k;
		hy += (-626 - hy) * k;
		const dx = hx - ux;
		const dy = hy - uy;
		const L = Math.hypot(dx, dy) || 1;
		return {sx, sy, ux, uy, hx, hy, fa, dir: [dx / L, dy / L] as [number, number], rot: (Math.atan2(-dx, dy) * 180) / Math.PI};
	};
	const R = arm(-1, rArm, rElbow);
	const L = arm(1, lArm, lElbow);

	const drawArm = (A: ReturnType<typeof arm>, side: -1 | 1) => {
		const mid = (f: number): [number, number] => [A.sx + (A.ux - A.sx) * f, A.sy + (A.uy - A.sy) * f];
		const fm = (f: number): [number, number] => [A.ux + (A.hx - A.ux) * f, A.uy + (A.hy - A.uy) * f];
		const [b0x, b0y] = mid(0.52);
		const [b1x, b1y] = mid(0.59);
		const [w0x, w0y] = fm(0.8);
		const [w1x, w1y] = fm(0.94);
		return (
			<g>
				{/* upper arm with biceps highlight and triceps shadow */}
				<path d={limb(A.sx, A.sy, A.ux, A.uy, 46, 48, 32)} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
				<path d={limb(A.sx + side * 12, A.sy + 8, A.ux + side * 8, A.uy, 18, 24, 12)} fill={HC.shade} opacity={side === 1 ? 0.65 : 0.3} />
				<path d={limb(A.sx - side * 8, A.sy + 30, A.ux - side * 6, A.uy - 20, 8, 12, 6)} fill={HC.light} opacity={0.45} />
				{/* deltoid cap */}
				<path d={`M${A.sx - 40},${A.sy - 8} C${A.sx - 30},${A.sy - 44} ${A.sx + 30},${A.sy - 44} ${A.sx + 40},${A.sy - 8} C${A.sx + 30},${A.sy + 34} ${A.sx - 30},${A.sy + 34} ${A.sx - 40},${A.sy - 8} Z`} fill={HC.skin} stroke={HSK.line} strokeWidth={1.4} />
				<path d={`M${A.sx + side * 6},${A.sy - 30} C${A.sx + side * 34},${A.sy - 20} ${A.sx + side * 38},${A.sy + 10} ${A.sx + side * 22},${A.sy + 28} Z`} fill={HC.shade} opacity={0.5} />
				<path d={`M${A.sx - side * 20},${A.sy - 26} Q${A.sx},${A.sy - 36} ${A.sx + side * 12},${A.sy - 30}`} stroke={HC.light} strokeWidth={4} fill="none" opacity={0.6} strokeLinecap="round" />
				{/* forearm + fur */}
				<path d={limb(A.ux, A.uy, A.hx, A.hy, 33, 34, 22)} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
				<path d={limb(A.ux + side * 8, A.uy + 6, A.hx + side * 5, A.hy, 12, 13, 7)} fill={HC.shade} opacity={0.5} />
				<Fur pts={[fm(0.15), fm(0.7)]} n={10} len={9} color={HC.shade} seed={side * 7 + 20} ang={side * 0.5} w={1.4} opacity={0.55} />
				<circle cx={A.ux} cy={A.uy} r={6} fill={HC.shade} opacity={0.35} />
				{/* bajuband (armlet) with jewel and tassel */}
				<path d={limb(b0x, b0y, b1x, b1y, 44, 44, 43)} fill={GOLD} stroke={DB} strokeWidth={2} />
				<path d={`M${b0x - 40},${(b0y + b1y) / 2} Q${(b0x + b1x) / 2},${(b0y + b1y) / 2 + 6} ${b1x + 40},${(b0y + b1y) / 2}`} stroke={C.paleGold} strokeWidth={1.2} fill="none" strokeDasharray="3 5" />
				<Jewel x={(b0x + b1x) / 2 - side * 30} y={(b0y + b1y) / 2} r={8} stone={C.red} />
				<path d={`M${(b0x + b1x) / 2 - side * 30},${(b0y + b1y) / 2 + 8} q${-side * 4},18 ${-side * 2},34`} stroke={C.red} strokeWidth={4} fill="none" />
				<circle cx={(b0x + b1x) / 2 - side * 32} cy={(b0y + b1y) / 2 + 44} r={4} fill={GOLD} />
				{/* kada stack at the wrist */}
				<path d={limb(w0x, w0y, w1x, w1y, 26, 26, 25)} fill={GOLD} stroke={DB} strokeWidth={2} />
				<path d={`M${(w0x + w1x) / 2 - 24},${(w0y + w1y) / 2} L${(w0x + w1x) / 2 + 24},${(w0y + w1y) / 2}`} stroke={DB} strokeWidth={1.4} opacity={0.6} />
			</g>
		);
	};
	const drawHand = (A: ReturnType<typeof arm>, side: -1 | 1, pose: NonNullable<HanumanPose['rHand']>) =>
		anjali > 0.5 ? null : (
			<g transform={`translate(${A.hx} ${A.hy}) rotate(${A.rot})`}>
				<Hand skin={HSK} pose={pose} side={side} s={0.78} nails="#d8a888" />
			</g>
		);

	const hipY = -470;
	const torsoD = smoothPath([[0, -770], [-40, -764], [-116, -746], [-184, -716], [-178, -664], [-150, -636], [-128, -578], [-96, -500], [-100, hipY], [100, hipY], [96, -500], [128, -578], [150, -636], [178, -664], [184, -716], [116, -746], [40, -764]], true);

	// tail: from the lower back out to the right, rising in an S to a curl
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
	const tail = ribbon(tailPts, 22, 9);
	const tailTip = tail.tip;

	const ls = legSpread;
	const legs = kneel ? (
		<g>
			{/* raised knee (screen right) */}
			<path d={limb(70, -220, 122, -130, 48, 50, 38)} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
			<path d={limb(122, -130, 112, -46, 38, 34, 22)} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
			<path d={limb(134, -128, 120, -50, 14, 15, 9)} fill={HC.shade} opacity={0.55} />
			<ellipse cx={120} cy={-136} rx={20} ry={16} fill={HC.light} opacity={0.5} />
			<g transform="translate(112 0)">
				<Foot skin={HSK} side={1} s={0.9} anklet />
			</g>
			{/* knee on the ground (screen left) */}
			<path d={limb(-70, -220, -112, -34, 48, 50, 34)} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
			<ellipse cx={-114} cy={-20} rx={44} ry={20} fill={HC.shade} stroke={HSK.line} strokeWidth={1.4} />
			{/* dhoti over the folded legs */}
			<path d={smoothPath([[-112, -236], [-152, -150], [-146, -54], [-70, -44], [-10, -110], [60, -150], [156, -174], [154, -236]], true)} fill={HC.saffron} stroke={HSK.line} strokeWidth={1.4} />
			<path d="M-120,-200 C-100,-150 -90,-110 -96,-60 M-60,-210 C-50,-160 -40,-120 -30,-90 M80,-220 C100,-200 120,-190 150,-182" stroke={HC.saffronShade} strokeWidth={5} fill="none" opacity={0.7} />
			<Border d={smoothPath([[-152, -150], [-146, -54], [-70, -44]])} w={12} band={GOLD} motif={C.red} />
			<Border d={smoothPath([[40, -214], [70, -174], [154, -176]])} w={12} band={GOLD} motif={C.red} />
		</g>
	) : (
		<g>
			{[-1, 1].map((s) => {
				const kx = s * (60 + ls * 30);
				const fx = s * (84 + ls * 60);
				return (
					<g key={s}>
						<path d={limb(kx, -250, fx, -46, 46, 48, 24)} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
						{/* calf muscle + shin */}
						<path d={limb(kx + s * 10, -236, fx + s * 4, -60, 16, 20, 8)} fill={HC.shade} opacity={s > 0 ? 0.6 : 0.3} />
						<path d={`M${kx - s * 4},-230 L${fx - s * 8},-70`} stroke={HC.light} strokeWidth={3} opacity={0.5} />
						<ellipse cx={kx} cy={-236} rx={22} ry={18} fill={HC.light} opacity={0.4} />
						<g transform={`translate(${fx} 0)`}>
							<Foot skin={HSK} side={s as 1 | -1} s={1.0} anklet />
						</g>
					</g>
				);
			})}
			{/* saffron dhoti, knee length, with kachha folds, front pleats and a woven border */}
			<path
				d={smoothPath([[-104, -482], [-124 - ls * 10, -400], [-128 - gust(30) * 8 - ls * 20, -300], [-110 - gust(31) * 12 - ls * 40, -206], [-36, -196], [-6, -276], [6, -276], [36, -196], [110 + gust(32) * 12 + ls * 40, -206], [128 + gust(33) * 8 + ls * 20, -300], [124 + ls * 10, -400], [104, -482]], true)}
				fill={HC.saffron}
				stroke={HSK.line}
				strokeWidth={1.6}
			/>
			<path d={smoothPath([[36, -470], [66, -360], [78, -260], [100, -206]])} stroke={HC.saffronShade} strokeWidth={14} fill="none" opacity={0.75} />
			<path d={smoothPath([[-30, -470], [-60, -350], [-78, -240]])} stroke={HC.saffronShade} strokeWidth={8} fill="none" opacity={0.5} />
			<path d="M-90,-420 Q-70,-380 -84,-330 M80,-430 Q96,-380 86,-330 M-40,-300 Q-50,-260 -60,-220 M50,-300 Q56,-260 66,-220" stroke={HC.saffronShade} strokeWidth={3} fill="none" opacity={0.6} />
			<Border d={smoothPath([[-110 - gust(31) * 12 - ls * 40, -206], [-36, -196]])} w={13} band={GOLD} motif={C.red} />
			<Border d={smoothPath([[36, -196], [110 + gust(32) * 12 + ls * 40, -206]])} w={13} band={GOLD} motif={C.red} />
			{/* front pleat fan */}
			<Pleats x={0} y0={-468} y1={-300} w0={40} w1={70} n={6} fill={HC.saffron} shade={HC.saffronShade} sway={gust(20) * 10 + wave(7, 4)} />
			<Border d={`M${-35 + gust(20) * 10},-300 L${35 + gust(20) * 10},-300`} w={10} band={GOLD} motif={C.red} />
		</g>
	);

	// angavastram: draped over the left shoulder, a short end lifting in the wind
	const sc = (k: number) => [[150, -720], [196 + gust(10) * 40 + wave(k, 6), -666], [226 + gust(11) * 80 + wave(k + 1, 10), -606], [246 + gust(12) * 120 + wave(k + 2, 14), -548]];
	const sTop = sc(0) as [number, number][];
	const sBot = (sc(0.6) as [number, number][]).map(([x, y], i) => [x - 10 - i * 4, y + 22 + i * 6] as [number, number]).reverse();

	const gp: [number, number] = [R.hx + R.dir[0] * 34, R.hy + R.dir[1] * 34];
	const gadaEl =
		gada === 'hand' ? (
			<g transform={`translate(${gp[0]} ${gp[1]}) rotate(${gadaAng - 8})`}>
				<Gada len={560} glow={gadaGlow} />
			</g>
		) : null;

	return (
		<g transform={back ? 'scale(-1 1)' : undefined}>
			{/* tail behind everything: base, underside shading, fur, tuft */}
			<g transform={`translate(0 ${drop * 0.6})`}>
				<path d={tail.d} fill={HC.skin} stroke={HSK.line} strokeWidth={1.6} />
				<path d={smoothPath(tail.line.filter((_, i) => i % 3 === 0) as [number, number][])} stroke={HC.shade} strokeWidth={9} fill="none" opacity={0.5} transform="translate(6 4)" />
				<path d={smoothPath(tail.line.filter((_, i) => i % 3 === 0) as [number, number][])} stroke={HC.light} strokeWidth={3} fill="none" opacity={0.5} transform="translate(-6 -3)" />
				<Fur pts={tail.line.filter((_, i) => i % 4 === 0) as [number, number][]} n={44} len={10} color={HSK.line} seed={31} ang={0.7} w={1.4} opacity={0.5} />
				<path d={`M${tailTip[0] - 12},${tailTip[1] + 2} q4,-30 14,-34 q8,10 10,30 q-12,10 -24,4 Z`} fill={HC.shade} stroke={HSK.line} strokeWidth={1.2} />
				{tailFire > 0.02 && (
					<g transform={`translate(${tailTip[0]} ${tailTip[1] + 10}) scale(${0.55 + tailFire * 0.9})`} opacity={clamp(tailFire * 2)}>
						<Fire t={t} x={0} y={0} s={1} seed={17} glow={0.9} />
					</g>
				)}
			</g>
			<g transform={`translate(0 ${drop})`}>
				<path d={smoothPath([...sTop, ...sBot], true)} fill={HC.sash} stroke={HSK.line} strokeWidth={1.2} />
				<Border d={smoothPath(sTop)} w={8} band={C.red} motif={GOLD} />
			</g>
			{legs}
			<g transform={`translate(0 ${drop})`}>
				{drawArm(R, -1)}
				{!back && gadaEl}
				{!back && drawHand(R, -1, rH)}
				<g transform={`translate(0 -600) scale(1 ${1 + br}) translate(0 600)`}>
					<path d={torsoD} fill={HC.skin} stroke={HSK.line} strokeWidth={1.8} />
					{back ? (
						<g>
							<path d="M0,-760 L0,-500" stroke={HC.shade} strokeWidth={6} opacity={0.6} />
							<path d="M-30,-720 C-80,-700 -116,-650 -104,-600 C-70,-620 -40,-660 -30,-720 Z M30,-720 C80,-700 116,-650 104,-600 C70,-620 40,-660 30,-720 Z" fill={HC.shade} opacity={0.55} />
							<path d="M-110,-700 C-120,-660 -116,-620 -100,-590 M110,-700 C120,-660 116,-620 100,-590" stroke={HC.light} strokeWidth={4} fill="none" opacity={0.4} />
							<path d="M-60,-560 Q0,-540 60,-560 M-50,-520 Q0,-505 50,-520" stroke={HC.shade} strokeWidth={3} fill="none" opacity={0.5} />
						</g>
					) : (
						<g>
							{/* pectorals: plate, lower shadow, upper highlight */}
							<path d="M-6,-742 C-50,-748 -110,-736 -150,-700 C-150,-664 -120,-628 -70,-622 C-36,-620 -10,-634 -6,-650 Z" fill={HC.skin} stroke={HSK.line} strokeWidth={1.2} />
							<path d="M6,-742 C50,-748 110,-736 150,-700 C150,-664 120,-628 70,-622 C36,-620 10,-634 6,-650 Z" fill={HC.skin} stroke={HSK.line} strokeWidth={1.2} />
							<path d="M-140,-668 C-110,-628 -40,-618 -8,-648 C-40,-630 -100,-636 -140,-668 Z" fill={HC.shade} opacity={0.7} />
							<path d="M140,-668 C110,-628 40,-618 8,-648 C40,-630 100,-636 140,-668 Z" fill={HC.shade} opacity={0.85} />
							<path d="M-120,-718 Q-70,-736 -24,-728" stroke={HC.light} strokeWidth={6} fill="none" opacity={0.45} strokeLinecap="round" />
							<path d="M40,-690 C90,-700 130,-690 146,-676 L146,-660 C120,-640 70,-632 30,-646 Z" fill={HC.shade} opacity={0.35} />
							{/* serratus */}
							{[0, 1, 2].map((i) => (
								<g key={i}>
									<path d={`M${-128 + i * 6},${-616 + i * 22} l22,-10`} stroke={HC.shade} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
									<path d={`M${128 - i * 6},${-616 + i * 22} l-22,-10`} stroke={HC.shade} strokeWidth={4} strokeLinecap="round" opacity={0.75} />
								</g>
							))}
							{/* abdominals */}
							{[0, 1, 2].map((r) =>
								[-1, 1].map((s) => (
									<path key={`${r}${s}`} d={`M${s * 4},${-614 + r * 36} C${s * 34},${-618 + r * 36} ${s * 44},${-604 + r * 36} ${s * 42},${-586 + r * 36} C${s * 30},${-582 + r * 36} ${s * 10},${-582 + r * 36} ${s * 4},${-586 + r * 36} Z`} fill={s > 0 ? HC.shade : HC.light} opacity={s > 0 ? 0.35 : 0.25} stroke={HC.shade} strokeWidth={1.4} />
								)),
							)}
							<path d="M0,-640 L0,-500" stroke={HC.shade} strokeWidth={3} opacity={0.6} />
							<path d="M-70,-560 C-80,-530 -86,-505 -92,-490 M70,-560 C80,-530 86,-505 92,-490" stroke={HC.shade} strokeWidth={3} fill="none" opacity={0.55} />
							<ellipse cx={0} cy={-506} rx={4} ry={6} fill={HC.shade} />
							<path d="M44,-600 C74,-560 84,-520 94,-500 L100,-470 L44,-470 Z" fill={HC.shade} opacity={0.35} />
							{/* janeu: three-strand sacred thread */}
							{[0, 3, 6].map((o) => (
								<path key={o} d={`M${122 + o},${-742 + o} C${62 + o},-652 ${-18 + o},-562 ${-94 + o},${-484 + o * 0.5}`} stroke={o === 3 ? '#d8ccb4' : '#efe6d2'} strokeWidth={2} fill="none" opacity={0.9} />
							))}
						</g>
					)}
					{/* engraved belt with plates, medallion and hip chains */}
					<path d="M-104,-504 Q0,-488 104,-504 L106,-466 Q0,-450 -106,-466 Z" fill={GOLD} stroke={DB} strokeWidth={3} />
					{Array.from({length: 9}, (_, i) => (
						<path key={i} d={`M${-92 + i * 23},${-500 + Math.abs(i - 4) * 0.8} l0,30`} stroke={DB} strokeWidth={1.6} opacity={0.7} />
					))}
					<path d="M-104,-486 Q0,-470 104,-486" stroke={C.paleGold} strokeWidth={1.4} fill="none" strokeDasharray="2 6" />
					{!back && (
						<g>
							<Jewel x={0} y={-484} r={14} stone={C.red} />
							{[-1, 1].map((s) => (
								<g key={s}>
									<path d={`M${s * 30},-466 Q${s * 60},-430 ${s * 96},-462`} stroke={GOLD} strokeWidth={3} fill="none" />
									<path d={`M${s * 40},-464 Q${s * 66},-416 ${s * 100},-450`} stroke={GOLD} strokeWidth={2} fill="none" opacity={0.8} />
									<circle cx={s * 64} cy={-438} r={4} fill={C.red} stroke={DB} />
								</g>
							))}
						</g>
					)}
					{/* sash crossing the chest from the left shoulder */}
					<path d="M128,-744 C160,-722 170,-690 152,-660 C132,-636 112,-636 96,-656 C104,-688 112,-718 128,-744 Z" fill={HC.sash} stroke={HSK.line} strokeWidth={1.2} />
					<path d="M136,-738 C160,-716 164,-690 150,-664" stroke={C.red} strokeWidth={4} fill="none" />
					{/* neck with tendons */}
					<path d="M-34,-794 L-38,-752 Q0,-740 38,-752 L34,-794 Z" fill={HC.skin} stroke={HSK.line} strokeWidth={1.4} />
					<path d="M8,-790 L34,-794 L38,-756 Q20,-750 10,-752 Z" fill={HC.shade} opacity={0.6} />
					<path d="M-20,-788 L-10,-752 M20,-788 L10,-752" stroke={HC.shade} strokeWidth={2} opacity={0.5} />
					{/* necklaces: torque collar, pearl string, rudraksha mala with pendant */}
					{!back && (
						<g>
							<path d="M-62,-758 Q0,-706 62,-758" stroke={GOLD} strokeWidth={12} fill="none" strokeLinecap="round" />
							<path d="M-62,-758 Q0,-706 62,-758" stroke={DB} strokeWidth={1.4} fill="none" strokeDasharray="1 5" />
							<Beads pts={[[-76, -752], [-40, -706], [0, -690], [40, -706], [76, -752]]} n={22} r={3.4} fill="#efe6d2" stroke="#9a8a6a" />
							<Beads pts={[[-92, -748], [-60, -660], [0, -626], [60, -660], [92, -748]]} n={26} r={5.2} fill="#5a2a18" stroke="#2a1008" />
							<path d="M0,-724 l16,20 l-16,26 l-16,-26 Z" fill={C.paleGold} stroke={DB} strokeWidth={2} />
							<Jewel x={0} y={-702} r={7} stone={C.red} />
							<circle cx={0} cy={-674} r={4} fill="#efe6d2" stroke="#9a8a6a" />
						</g>
					)}
				</g>
				<g transform={`rotate(${head} 0 -790)`}>{back ? <HanumanHeadBack /> : <HanumanHead look={look} brow={brow} t={t} />}</g>
				{drawArm(L, 1)}
				{!back && drawHand(L, 1, lHand)}
				{back && gadaEl}
				{back && drawHand(R, -1, rH)}
				{/* joined palms (anjali) with fingers */}
				{anjali > 0.5 && (
					<g opacity={clamp((anjali - 0.5) * 2)}>
						<path d="M-26,-598 C-34,-640 -22,-706 -4,-726 L4,-726 C22,-706 34,-640 26,-598 Z" fill={HC.skin} stroke={HSK.line} strokeWidth={2} />
						<path d="M0,-724 L0,-602" stroke={HSK.line} strokeWidth={2} />
						{[-1, 1].map((s) => (
							<g key={s}>
								<path d={`M${s * 4},-700 l${s * 16},4 M${s * 4},-680 l${s * 20},4 M${s * 4},-660 l${s * 22},4`} stroke={HC.shade} strokeWidth={1.6} opacity={0.7} />
								<path d={`M${s * 22},-640 C${s * 34},-652 ${s * 36},-626 ${s * 26},-612`} stroke={HSK.line} strokeWidth={1.8} fill={HC.skin} />
							</g>
						))}
						<path d="M4,-722 C20,-704 28,-660 26,-604 L6,-604 Z" fill={HC.shade} opacity={0.4} />
					</g>
				)}
			</g>
		</g>
	);
};
