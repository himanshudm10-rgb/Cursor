// The supporting cast, built with the same detail kit as Hanuman (hero.tsx).
// Each character appears only through its component so proportions and costume stay identical in every shot.
import React from 'react';
import {limb} from './characters';
import {Beads, Border, Foot, Fur, Hand, Jewel, Pleats, Skin} from './detail';
import {C, clamp, noise, rng, smoothPath} from './lib';
import {HC} from './props';
import {HSK} from './hero';

const GOLD = C.gold;
const DB = C.darkBronze;

/** Almond eye with kohl, lashes, iris and highlight. open 0..1 (0 = lowered / closed). */
const Eye: React.FC<{x: number; y: number; s: number; side: 1 | -1; open?: number; look?: number; iris?: string}> = ({x, y, s, side, open = 1, look = 0, iris = '#3a2214'}) => {
	const h = 7 * open;
	return (
		<g transform={`translate(${x} ${y}) scale(${s})`}>
			{open > 0.15 && (
				<g>
					<path d={`M${-13 * side},1 Q0,${-h - 2} ${13 * side},0 Q0,${h * 0.6 + 2} ${-13 * side},1 Z`} fill="#efe4cc" />
					<circle cx={look * 3} cy={0} r={Math.min(5.4, 2 + h * 0.5)} fill={iris} />
					<circle cx={look * 3} cy={0} r={2.4} fill="#0a0604" />
					<circle cx={look * 3 - 1.5} cy={-1.6} r={1.1} fill="#fff" />
				</g>
			)}
			<path d={`M${-14 * side},1 Q0,${-h - 3} ${15 * side},-1`} stroke="#0e0806" strokeWidth={2.6} fill="none" strokeLinecap="round" />
			{[0.3, 0.55, 0.8].map((k) => (
				<path key={k} d={`M${(-14 + 29 * k) * side},${-h * Math.sin(Math.PI * k) - 2} l${3 * side},-4`} stroke="#0e0806" strokeWidth={1.3} />
			))}
			<path d={`M${-12 * side},3 Q0,${h * 0.5 + 5} ${12 * side},2`} stroke="#3a2214" strokeWidth={1.1} fill="none" opacity={0.7} />
		</g>
	);
};

// ------------------------------------------------------------------ SITA (seated)
const SSK: Skin = {base: '#b07e5a', shade: '#7a5038', light: '#c8966e', line: '#5a3624'};
export const Sita: React.FC<{t: number; bow?: number; reach?: number; look?: number; glow?: number}> = ({t, bow = 0.6, reach = 0, look = 0, glow = 0}) => {
	const saree = '#b89a5c';
	const sareeShade = '#7e6638';
	const pallu = '#a88a4e';
	const border = '#7a2a1e';
	const blouse = '#6e2418';
	const br = Math.sin(t * 1.4) * 2;
	const hx = 128 + reach * 70;
	const hy = -250 - reach * 80;
	const open = clamp(1 - bow * 1.1);
	return (
		<g>
			{glow > 0.02 && <ellipse cx={0} cy={-330} rx={260} ry={300} fill="#ffe2a0" opacity={0.25 * glow} filter="url(#b40)" />}
			{/* seated: saree pooled over the folded legs, pleats fanned in front, woven hem */}
			<path d={smoothPath([[-236, -8], [-214, -112], [-124, -164], [0, -172], [124, -164], [214, -112], [236, -8], [0, 16]], true)} fill={saree} stroke={SSK.line} strokeWidth={1.6} />
			<path d={smoothPath([[40, -170], [150, -152], [224, -90], [236, -8], [120, 10], [60, -60]], true)} fill={sareeShade} opacity={0.5} />
			<path d="M-170,-70 C-110,-116 -30,-108 20,-86 M170,-66 C116,-108 66,-114 10,-100 M-200,-40 C-140,-60 -90,-58 -60,-46 M200,-36 C150,-54 110,-56 80,-46" stroke={sareeShade} strokeWidth={4} fill="none" opacity={0.6} />
			<Pleats x={-20} y0={-170} y1={6} w0={70} w1={150} n={8} fill={saree} shade={sareeShade} />
			<Border d={smoothPath([[-236, -8], [0, 16], [236, -8]])} w={14} band={border} motif={GOLD} />
			{/* torso */}
			<g transform={`translate(0 ${br * 0.5})`}>
				<path d={smoothPath([[-82, -170], [-94, -282], [-98, -382], [-62, -432], [0, -442], [62, -432], [98, -382], [94, -282], [82, -170]], true)} fill={blouse} stroke={SSK.line} strokeWidth={1.6} />
				{/* neck + mangalsutra */}
				<path d="M-26,-472 L-30,-434 Q0,-424 30,-434 L26,-472 Z" fill={SSK.base} stroke={SSK.line} strokeWidth={1.2} />
				<Beads pts={[[-34, -436], [0, -404], [34, -436]]} n={14} r={2.6} fill="#1a1412" stroke="#000" />
				<Jewel x={0} y={-400} r={5} stone={GOLD} />
				{/* pallu: across the chest, border on both edges, gathered pleats at the shoulder */}
				<path d="M-100,-406 C-40,-336 30,-252 88,-178 L50,-166 C0,-232 -60,-312 -104,-360 Z" fill={pallu} stroke={SSK.line} strokeWidth={1.4} />
				<path d="M-60,-370 C-20,-320 20,-260 60,-190 M-80,-380 C-40,-330 0,-270 40,-200" stroke={sareeShade} strokeWidth={3} fill="none" opacity={0.6} />
				<Border d="M-100,-408 C-40,-338 30,-254 90,-180" w={10} band={border} motif={GOLD} />
				<Border d="M-104,-358 C-60,-310 0,-232 50,-166" w={8} band={border} motif={GOLD} />
				{/* arms: blouse sleeves with gold trim, forearms, bangle stacks, hands */}
				{[-1, 1].map((s) => {
					const ex = s * 132;
					const ey = s < 0 ? -272 : -292;
					const hx2 = s < 0 ? -64 : hx;
					const hy2 = s < 0 ? -196 : hy;
					const dx = hx2 - ex;
					const dy = hy2 - ey;
					const rot = (Math.atan2(-dx, dy) * 180) / Math.PI;
					return (
						<g key={s}>
							<path d={limb(s * 88, -402, ex, ey, 25, 23, 18)} fill={SSK.base} stroke={SSK.line} strokeWidth={1.4} />
							<path d={limb(s * 88, -402, s * 108, -352, 28, 28, 26)} fill={blouse} stroke={SSK.line} strokeWidth={1.4} />
							<path d={`M${s * 86},-352 L${s * 128},-356`} stroke={GOLD} strokeWidth={4} />
							<path d={limb(ex, ey, hx2, hy2, 18, 17, 13)} fill={SSK.base} stroke={SSK.line} strokeWidth={1.4} />
							<path d={limb(ex + s * 4, ey + 4, hx2 + s * 2, hy2, 7, 7, 5)} fill={SSK.shade} opacity={0.4} />
							{[0.62, 0.68, 0.74, 0.8].map((f, i) => {
								const x = ex + dx * f;
								const y = ey + dy * f;
								return <ellipse key={i} cx={x} cy={y} rx={17} ry={4} fill={i % 2 ? C.red : GOLD} stroke={DB} strokeWidth={1} transform={`rotate(${rot} ${x} ${y})`} />;
							})}
							<g transform={`translate(${hx2} ${hy2}) rotate(${rot})`}>
								<Hand skin={SSK} pose={s < 0 ? 'relaxed' : reach > 0.3 ? 'offer' : 'relaxed'} side={s as 1 | -1} s={0.55} nails="#c88a6a" rings />
							</g>
						</g>
					);
				})}
				{/* head (bowed) */}
				<g transform={`rotate(${bow * 14} 0 -440) translate(0 ${bow * 18})`}>
					{/* braid behind */}
					<path d={smoothPath([[-48, -500], [-74, -420], [-84, -330], [-78, -250], [-66, -196]])} stroke="#120c0a" strokeWidth={24} fill="none" strokeLinecap="round" />
					{Array.from({length: 9}, (_, i) => (
						<path key={i} d={`M${-62 - i * 2},${-470 + i * 30} l-12,14`} stroke="#3a2a22" strokeWidth={2} />
					))}
					<path d="M-70,-198 l-8,30 l16,0 Z" fill={GOLD} stroke={DB} />
					<path d={smoothPath([[-52, -562], [-56, -522], [-48, -488], [-28, -468], [0, -460], [28, -468], [48, -488], [56, -522], [52, -562], [0, -584]], true)} fill={SSK.base} stroke={SSK.line} strokeWidth={1.6} />
					<path d={smoothPath([[8, -582], [52, -562], [56, -522], [48, -488], [28, -468], [8, -462], [22, -510], [18, -552]], true)} fill={SSK.shade} opacity={0.42} />
					<ellipse cx={-28} cy={-500} rx={10} ry={6} fill="#c87a6a" opacity={0.25} />
					{/* hair with sindoor parting, maang tikka */}
					<path d="M-54,-552 C-44,-594 44,-594 54,-552 C34,-578 4,-580 0,-572 C-4,-580 -34,-578 -54,-552 Z" fill="#120c0a" />
					<path d="M0,-588 L0,-574" stroke={C.red} strokeWidth={3} />
					<path d="M0,-580 L0,-560" stroke={GOLD} strokeWidth={1.6} />
					<Jewel x={0} y={-556} r={5} stone={C.red} />
					<circle cx={0} cy={-540} r={3.6} fill={C.red} />
					{/* brows, eyes (lowered while she grieves) */}
					<path d="M-38,-536 Q-24,-544 -10,-538 M38,-536 Q24,-544 10,-538" stroke="#1a0e08" strokeWidth={2.6} fill="none" strokeLinecap="round" />
					<Eye x={-22} y={-522} s={0.9} side={-1} open={open} look={look} />
					<Eye x={22} y={-522} s={0.9} side={1} open={open} look={look} />
					{/* nose, nath with chain, lips */}
					<path d="M-2,-516 Q-6,-504 -7,-498 Q0,-494 7,-498" stroke={SSK.shade} strokeWidth={2} fill="none" />
					<circle cx={9} cy={-494} r={6} stroke={GOLD} strokeWidth={2} fill="none" />
					<Beads pts={[[14, -492], [34, -500], [52, -510]]} n={6} r={1.6} fill={C.paleGold} />
					<path d="M-12,-482 Q-6,-486 0,-483 Q6,-486 12,-482 Q6,-476 0,-477 Q-6,-476 -12,-482 Z" fill="#8a4a40" />
					<path d="M-11,-482 Q0,-480 11,-482" stroke="#5a2a20" strokeWidth={1.2} fill="none" />
					{/* jhumka earrings */}
					{[-1, 1].map((s) => (
						<g key={s}>
							<circle cx={s * 56} cy={-512} r={5} fill={GOLD} />
							<path d={`M${s * 56 - 9},-494 Q${s * 56},-512 ${s * 56 + 9},-494 Z`} fill={GOLD} stroke={DB} strokeWidth={1} />
							{[-6, 0, 6].map((d) => (
								<circle key={d} cx={s * 56 + d} cy={-490} r={2} fill="#efe6d2" />
							))}
						</g>
					))}
					{/* pallu over the head with border */}
					<path d={smoothPath([[-72, -520], [-68, -584], [-22, -616], [30, -616], [72, -584], [78, -520], [92, -440], [102, -380], [72, -420], [58, -500], [48, -560], [0, -590], [-48, -560], [-58, -500], [-82, -420], [-102, -360], [-92, -440]], true)} fill={pallu} stroke={SSK.line} strokeWidth={1.4} />
					<path d="M-60,-540 C-62,-500 -74,-450 -90,-410 M60,-540 C62,-500 74,-450 88,-420" stroke={sareeShade} strokeWidth={3} fill="none" opacity={0.6} />
					<Border d={smoothPath([[-92, -440], [-72, -520], [-68, -584], [-22, -616], [30, -616], [72, -584], [78, -520], [92, -440]])} w={10} band={border} motif={GOLD} />
				</g>
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ ANJANI (standing, praying to the wind)
const ASK: Skin = {base: '#a8744e', shade: '#6e4a32', light: '#c08a62', line: '#4e3220'};
export const Anjani: React.FC<{t: number; pray?: number; wind?: number}> = ({t, pray = 1, wind = 1}) => {
	const saree = '#55623a';
	const sareeShade = '#384226';
	const g = (k: number, a: number) => (Math.sin(t * 2.2 + k) * 0.5 + 0.8 + 0.3 * noise(t + k, 7)) * a * wind;
	const lift = clamp(pray);
	const hy = -770 - lift * 170;
	return (
		<g>
			{/* long open hair lifting in the wind, with strands */}
			<path d={smoothPath([[-44, -862], [30 + g(1, 30), -884], [120 + g(2, 60), -846], [200 + g(3, 90), -790], [160 + g(4, 70), -740], [80 + g(5, 40), -740], [30, -760], [-36, -790]], true)} fill="#140d0a" />
			{Array.from({length: 10}, (_, i) => (
				<path key={i} d={`M${-10 + i * 8},${-860 + i * 4} Q${60 + i * 6 + g(i, 30)},${-850 + i * 6} ${130 + i * 8 + g(i + 3, 60)},${-810 + i * 7}`} stroke="#3a2a20" strokeWidth={1.4} fill="none" opacity={0.8} />
			))}
			{/* pallu hanging behind from the shoulder, stirring slightly */}
			<path d={smoothPath([[70, -720], [116 + g(6, 6), -640], [138 + g(7, 10), -520], [146 + g(8, 14), -400], [112 + g(9, 10), -390], [104 + g(10, 6), -520], [84, -640]], true)} fill="#6a7446" stroke={ASK.line} strokeWidth={1.2} />
			<path d="M96,-660 Q120,-560 126,-420" stroke="#384226" strokeWidth={3} fill="none" />
			<Border d={`M${146 + g(8, 14)},-400 L${112 + g(9, 10)},-390`} w={10} band={GOLD} motif={C.red} />
			{/* feet */}
			<g transform="translate(-50 0)">
				<Foot skin={ASK} side={-1} s={0.8} anklet />
			</g>
			<g transform="translate(50 0)">
				<Foot skin={ASK} side={1} s={0.8} anklet />
			</g>
			{/* saree body with pleats and border */}
			<path d={smoothPath([[-82, -560], [-112, -400], [-130 - g(11, 8), -200], [-138 - g(12, 12), -40], [138 + g(13, 20), -40], [130 + g(14, 14), -200], [112, -400], [82, -560]], true)} fill={saree} stroke={ASK.line} strokeWidth={1.6} />
			<path d={smoothPath([[20, -560], [82, -560], [112, -400], [130 + g(14, 14), -200], [138 + g(13, 20), -40], [40, -40], [60, -300]], true)} fill={sareeShade} opacity={0.55} />
			<Pleats x={-20} y0={-470} y1={-40} w0={50} w1={150} n={9} fill={saree} shade={sareeShade} sway={g(15, 8)} />
			<Border d={`M${-138 - g(12, 12)},-44 L${138 + g(13, 20)},-44`} w={16} band={GOLD} motif={C.red} />
			{/* blouse + torso + pallu diagonal */}
			<path d={smoothPath([[-82, -560], [-98, -660], [-92, -732], [0, -762], [92, -732], [98, -660], [82, -560]], true)} fill="#6e2418" stroke={ASK.line} strokeWidth={1.6} />
			<path d="M-60,-600 Q0,-586 60,-600 L60,-560 L-60,-560 Z" fill={ASK.base} />
			<path d="M-92,-732 C-22,-664 38,-604 84,-560 L56,-552 C16,-598 -44,-650 -96,-700 Z" fill="#6a7446" stroke={ASK.line} strokeWidth={1.2} />
			<Border d="M-92,-734 C-22,-666 38,-606 86,-562" w={9} band={GOLD} motif={C.red} />
			<Beads pts={[[-36, -760], [0, -722], [36, -760]]} n={13} r={3} fill={C.paleGold} />
			{/* arms raised, palms joined above the head */}
			{[-1, 1].map((s) => {
				const ex = s * (138 - lift * 30);
				const ey = -630 - lift * 220;
				return (
					<g key={s}>
						<path d={limb(s * 86, -720, ex, ey, 23, 22, 17)} fill={ASK.base} stroke={ASK.line} strokeWidth={1.4} />
						<path d={limb(ex, ey, s * 16, hy + 30, 17, 16, 12)} fill={ASK.base} stroke={ASK.line} strokeWidth={1.4} />
						<path d={limb(ex + s * 4, ey, s * 18, hy + 30, 6, 6, 4)} fill={ASK.shade} opacity={0.4} />
						{[0.55, 0.62, 0.69].map((f, i) => (
							<circle key={i} cx={ex + (s * 16 - ex) * f} cy={ey + (hy + 30 - ey) * f} r={10} fill="none" stroke={i % 2 ? C.red : GOLD} strokeWidth={3} />
						))}
						<path d={limb(s * 86, -720, s * 110, -680, 24, 24, 22)} fill="#6e2418" />
					</g>
				);
			})}
			<path d={`M-18,${hy + 34} C-24,${hy - 6} -12,${hy - 50} -2,${hy - 62} L2,${hy - 62} C12,${hy - 50} 24,${hy - 6} 18,${hy + 34} Z`} fill={ASK.base} stroke={ASK.line} strokeWidth={1.6} />
			<path d={`M0,${hy - 60} L0,${hy + 30}`} stroke={ASK.line} strokeWidth={1.4} />
			{[-1, 1].map((s) => (
				<path key={s} d={`M${s * 2},${hy - 40} l${s * 14},4 M${s * 2},${hy - 24} l${s * 16},4 M${s * 2},${hy - 8} l${s * 17},4`} stroke={ASK.shade} strokeWidth={1.3} />
			))}
			{/* head, turned up to the sky, eyes closed in prayer */}
			<g transform="rotate(-10 0 -790)">
				<path d="M-24,-804 L-26,-764 Q0,-756 26,-764 L24,-804 Z" fill={ASK.base} stroke={ASK.line} strokeWidth={1.2} />
				<path d={smoothPath([[-46, -880], [-50, -844], [-42, -812], [-24, -794], [0, -786], [24, -794], [42, -812], [50, -844], [46, -880], [0, -898]], true)} fill={ASK.base} stroke={ASK.line} strokeWidth={1.6} />
				<path d={smoothPath([[8, -896], [46, -880], [50, -844], [42, -812], [24, -794], [8, -788], [20, -836], [16, -872]], true)} fill={ASK.shade} opacity={0.45} />
				<path d="M-50,-872 C-38,-912 38,-912 50,-872 C30,-892 4,-894 0,-886 C-4,-894 -30,-892 -50,-872 Z" fill="#140d0a" />
				<circle cx={0} cy={-866} r={3.6} fill={C.red} />
				<path d="M-36,-856 Q-22,-864 -8,-858 M36,-856 Q22,-864 8,-858" stroke="#1a0e08" strokeWidth={2.4} fill="none" />
				<Eye x={-21} y={-843} s={0.85} side={-1} open={0} />
				<Eye x={21} y={-843} s={0.85} side={1} open={0} />
				<path d="M-2,-838 Q-6,-824 -6,-818 Q0,-814 6,-818" stroke={ASK.shade} strokeWidth={2} fill="none" />
				<circle cx={8} cy={-815} r={5} stroke={GOLD} strokeWidth={2} fill="none" />
				<path d="M-11,-804 Q0,-808 11,-804 Q0,-798 -11,-804 Z" fill="#8a4a40" />
				{[-1, 1].map((s) => (
					<g key={s}>
						<circle cx={s * 50} cy={-830} r={4} fill={GOLD} />
						<path d={`M${s * 50 - 8},-814 Q${s * 50},-830 ${s * 50 + 8},-814 Z`} fill={GOLD} stroke={DB} strokeWidth={1} />
					</g>
				))}
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ SHRI RAM (from behind, backlit, with his bow)
const RSK: Skin = {base: '#3e5672', shade: '#2a3c52', light: '#5a7494', line: '#1a2638'};
export const Ram: React.FC<{t: number; wind?: number}> = ({t, wind = 0.6}) => {
	const g = (k: number) => Math.sin(t * 2.4 + k) * 8 * wind;
	const pit = '#c49a3a';
	const pitS = '#8a6a22';
	return (
		<g>
			{/* bow: laminated stave with gold grip wrap and curled tips */}
			<path d={smoothPath([[-196, -1060], [-252, -820], [-266, -580], [-250, -330], [-196, -100]])} stroke="#3a2614" strokeWidth={16} fill="none" strokeLinecap="round" />
			<path d={smoothPath([[-196, -1060], [-252, -820], [-266, -580], [-250, -330], [-196, -100]])} stroke="#6a4a24" strokeWidth={5} fill="none" />
			<path d="M-196,-1060 q-14,-6 -16,-24 q10,4 16,10 M-196,-100 q-14,6 -16,24 q10,-4 16,-10" stroke={GOLD} strokeWidth={5} fill="none" />
			<path d="M-196,-1060 L-196,-100" stroke="#d8cfbd" strokeWidth={2.5} />
			{[-610, -590, -570, -550].map((y) => (
				<path key={y} d={`M-276,${y} l26,6`} stroke={GOLD} strokeWidth={4} />
			))}
			{/* uttariya over the shoulders, ends lifting a little */}
			<path d={smoothPath([[-170, -716], [-200 + g(1) * 0.5, -620], [-212 + g(2), -520], [-196 + g(3), -470], [-176, -540], [-150, -640]], true)} fill="#c4a24a" stroke={RSK.line} strokeWidth={1.2} />
			<path d={smoothPath([[170, -716], [204 + g(4), -620], [232 + g(5) * 1.4, -520], [222 + g(6) * 1.6, -460], [196, -530], [150, -640]], true)} fill="#c4a24a" stroke={RSK.line} strokeWidth={1.2} />
			{/* legs + heels */}
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={limb(s * 52, -240, s * 70, -40, 42, 42, 22)} fill={RSK.base} stroke={RSK.line} strokeWidth={1.4} />
					<path d={limb(s * 58, -226, s * 72, -60, 14, 18, 8)} fill={RSK.shade} opacity={0.6} />
					<g transform={`translate(${s * 70} 0)`}>
						<Foot skin={RSK} side={s as 1 | -1} s={0.95} anklet />
					</g>
				</g>
			))}
			{/* pitambar with pleats and border */}
			<path d={smoothPath([[-102, -482], [-120, -380], [-122, -240], [-104, -170], [104, -170], [122, -240], [120, -380], [102, -482]], true)} fill={pit} stroke={RSK.line} strokeWidth={1.6} />
			<path d="M-80,-460 Q-90,-360 -84,-200 M-30,-470 Q-40,-340 -40,-190 M30,-470 Q36,-340 40,-190 M80,-460 Q90,-360 86,-200" stroke={pitS} strokeWidth={4} fill="none" opacity={0.7} />
			<Border d="M-104,-176 L104,-176" w={14} band={C.red} motif={GOLD} />
			{/* back: lats, spine, shoulder blades */}
			<path d={smoothPath([[0, -772], [-112, -748], [-178, -714], [-172, -660], [-132, -592], [-98, -492], [98, -492], [132, -592], [172, -660], [178, -714], [112, -748]], true)} fill={RSK.base} stroke={RSK.line} strokeWidth={1.6} />
			<path d="M0,-760 L0,-500" stroke={RSK.shade} strokeWidth={5} opacity={0.7} />
			<path d="M-34,-724 C-84,-704 -118,-654 -106,-604 C-72,-624 -44,-664 -34,-724 Z M34,-724 C84,-704 118,-654 106,-604 C72,-624 44,-664 34,-724 Z" fill={RSK.shade} opacity={0.55} />
			<path d="M-112,-700 C-124,-660 -120,-620 -104,-590 M112,-700 C124,-660 120,-620 104,-590" stroke={RSK.light} strokeWidth={4} fill="none" opacity={0.5} />
			<path d="M-102,-500 Q0,-484 102,-500 L104,-472 Q0,-458 -104,-472 Z" fill={GOLD} stroke={DB} strokeWidth={2} />
			{/* quiver with strap, buckle and fletched arrows */}
			<path d="M180,-740 L-90,-470" stroke="#5a3a1a" strokeWidth={14} />
			<Jewel x={44} y={-606} r={8} stone={C.red} />
			<path d="M-40,-520 L92,-826 L124,-812 L-6,-506 Z" fill="#5a3a1a" stroke="#2a1a0a" strokeWidth={2.5} />
			<path d="M-30,-524 L100,-818 M-14,-516 L114,-812" stroke="#7a5a2a" strokeWidth={2} />
			{[0, 1, 2].map((i) => (
				<path key={i} d={`M${-28 + i * 6},${-540 - i * 90} l40,14`} stroke={GOLD} strokeWidth={4} />
			))}
			{[0, 1, 2, 3, 4].map((i) => (
				<g key={i} transform={`translate(${96 + i * 6} ${-822 - i * 3}) rotate(23)`}>
					<path d="M0,0 L0,-50" stroke="#d8cfbd" strokeWidth={2} />
					<path d="M0,-50 l-7,-24 l7,8 l7,-8 Z" fill={i % 2 ? C.paleGold : '#e8e0d0'} stroke="#8a7a5a" strokeWidth={0.8} />
				</g>
			))}
			{/* arms: armlets, the left hand grips the bow, the right hangs relaxed */}
			<path d={limb(-150, -712, -192, -566, 38, 38, 27)} fill={RSK.base} stroke={RSK.line} strokeWidth={1.4} />
			<path d={limb(-192, -566, -208, -440, 27, 27, 20)} fill={RSK.base} stroke={RSK.line} strokeWidth={1.4} />
			<path d={limb(-168, -650, -176, -630, 40, 40, 39)} fill={GOLD} stroke={DB} strokeWidth={1.6} />
			<path d={limb(-204, -472, -207, -456, 22, 22, 22)} fill={GOLD} stroke={DB} strokeWidth={1.4} />
			<g transform="translate(-208 -440) rotate(-5)">
				<Hand skin={RSK} pose="grip" side={-1} s={0.7} />
			</g>
			<path d={limb(150, -712, 182, -566, 38, 38, 27)} fill={RSK.base} stroke={RSK.line} strokeWidth={1.4} />
			<path d={limb(182, -566, 176, -440, 27, 27, 20)} fill={RSK.base} stroke={RSK.line} strokeWidth={1.4} />
			<path d={limb(162, -650, 168, -630, 40, 40, 39)} fill={GOLD} stroke={DB} strokeWidth={1.6} />
			<g transform="translate(176 -440) rotate(3)">
				<Hand skin={RSK} pose="relaxed" side={1} s={0.7} />
			</g>
			{/* head from behind: neck, wavy hair to the shoulders, earrings, tall crown */}
			<path d="M-30,-794 L-36,-752 L36,-752 L30,-794 Z" fill={RSK.base} />
			{/* rounded head of hair with wavy locks falling to the shoulders */}
			<path d={smoothPath([[-50, -876], [-56, -830], [-54, -786], [-62, -756], [-50, -740], [-40, -752], [-26, -738], [-12, -750], [0, -736], [12, -750], [26, -738], [40, -752], [50, -740], [62, -756], [54, -786], [56, -830], [50, -876], [0, -892]], true)} fill="#120c0c" stroke="#000" strokeWidth={1.4} />
			{Array.from({length: 9}, (_, i) => {
				const x = -40 + i * 10;
				return <path key={i} d={`M${x * 0.7},-874 Q${x + Math.sin(i * 1.7) * 8},-820 ${x * 1.2},-750`} stroke="#3a302c" strokeWidth={1.8} fill="none" />;
			})}
			<path d="M-40,-860 Q0,-874 40,-860" stroke="#3a302c" strokeWidth={2} fill="none" />
			{[-1, 1].map((s) => (
				<g key={s}>
					<circle cx={s * 58} cy={-806} r={10} stroke={GOLD} strokeWidth={4} fill="none" />
					<Jewel x={s * 58} y={-792} r={4} stone={C.red} />
				</g>
			))}
			<path d="M-54,-866 L-42,-962 L-22,-1004 L0,-1040 L22,-1004 L42,-962 L54,-866 Z" fill={GOLD} stroke={DB} strokeWidth={3} />
			<path d="M-48,-904 L48,-904 M-42,-954 L42,-954 M-26,-1000 L26,-1000" stroke={DB} strokeWidth={2} />
			{[-30, -10, 10, 30].map((x) => (
				<Jewel key={x} x={x} y={-884} r={5} stone={x % 20 === 0 ? '#2e5a4a' : C.red} />
			))}
			{Array.from({length: 5}, (_, i) => (
				<path key={i} d={`M${-24 + i * 12},-952 Q${-18 + i * 12},-930 ${-12 + i * 12},-952`} stroke={DB} strokeWidth={1.4} fill="none" />
			))}
			<circle cx={0} cy={-1046} r={6} fill="#efe6d2" stroke="#9a8a6a" />
		</g>
	);
};

// ------------------------------------------------------------------ RAVAN (ten crowned heads, armoured)
const VSK: Skin = {base: '#5a3c34', shade: '#34221c', light: '#7a5448', line: '#1e120e'};
const RavanFace: React.FC<{s: number; t: number; k: number; main?: boolean}> = ({s, t, k, main}) => {
	const glare = 0.6 + 0.4 * Math.sin(t * 2 + k);
	return (
		<g transform={`scale(${s})`}>
			<path d={smoothPath([[-42, -44], [-48, -4], [-38, 32], [-16, 48], [0, 52], [16, 48], [38, 32], [48, -4], [42, -44], [0, -58]], true)} fill={VSK.base} stroke={VSK.line} strokeWidth={1.6} />
			<path d={smoothPath([[8, -56], [42, -44], [48, -4], [38, 32], [16, 48], [6, 50], [20, 0], [16, -40]], true)} fill={VSK.shade} opacity={0.5} />
			{/* crown with spikes and a jewel */}
			<path d="M-44,-38 L-40,-92 L-26,-72 L-14,-110 L0,-80 L14,-110 L26,-72 L40,-92 L44,-38 Q0,-48 -44,-38 Z" fill={GOLD} stroke={DB} strokeWidth={2.4} />
			<path d="M-42,-50 Q0,-60 42,-50" stroke={DB} strokeWidth={1.4} fill="none" />
			<Jewel x={0} y={-62} r={main ? 9 : 6} stone={C.red} />
			{/* brows, glaring eyes, curled moustache, short beard, earrings */}
			<path d="M-34,-20 L-8,-10 L-8,-4 L-34,-12 Z M34,-20 L8,-10 L8,-4 L34,-12 Z" fill="#0e0806" />
			{[-1, 1].map((d) => (
				<g key={d}>
					<path d={`M${d * 30},-2 Q${d * 18},-10 ${d * 6},-2 Q${d * 18},4 ${d * 30},-2 Z`} fill="#efd8b8" />
					<circle cx={d * 18} cy={-2} r={4} fill="#c0401a" opacity={glare} />
					<circle cx={d * 18} cy={-2} r={2} fill="#0a0604" />
				</g>
			))}
			<path d="M-4,0 L-8,16 L8,16 L4,0" stroke={VSK.shade} strokeWidth={2} fill="none" />
			<path d="M-30,30 C-20,20 -6,22 0,26 C6,22 20,20 30,30 C34,22 40,18 44,22 C40,32 30,36 20,32 C10,30 4,32 0,34 C-4,32 -10,30 -20,32 C-30,36 -40,32 -44,22 C-40,18 -34,22 -30,30 Z" fill="#0e0806" />
			<path d={smoothPath([[-30, 34], [-22, 48], [0, 58], [22, 48], [30, 34], [0, 44]], true)} fill="#1a0e0a" />
			<circle cx={-48} cy={10} r={7} stroke={GOLD} strokeWidth={3} fill="none" />
			<circle cx={48} cy={10} r={7} stroke={GOLD} strokeWidth={3} fill="none" />
		</g>
	);
};

export const Ravan: React.FC<{t: number; point?: number}> = ({t, point = 0}) => {
	const heads = Array.from({length: 10}, (_, i) => {
		const k = i - 4.5;
		return {i, x: k * 82, y: -900 + Math.abs(k) * Math.abs(k) * 7, s: 1.5 - Math.abs(k) * 0.07};
	}).sort((a, b) => Math.abs(b.x) - Math.abs(a.x));
	const br = Math.sin(t * 1.2) * 3;
	const px = 300 + point * 170;
	const py = -470 - point * 330;
	const ex = 250 + point * 80;
	const ey = -580 - point * 140;
	const rot = (Math.atan2(-(px - ex), py - ey) * 180) / Math.PI;
	return (
		<g>
			{/* cape behind */}
			<path d="M-230,-740 C-300,-500 -320,-240 -300,-10 L300,-10 C320,-240 300,-500 230,-740 Z" fill="#4a1010" stroke={VSK.line} strokeWidth={1.6} />
			<path d="M-200,-700 C-240,-500 -250,-260 -240,-20 M200,-700 C240,-500 250,-260 240,-20 M-120,-600 C-140,-400 -150,-200 -140,-20 M120,-600 C140,-400 150,-200 140,-20" stroke="#2a0808" strokeWidth={5} fill="none" opacity={0.7} />
			<Border d="M-300,-14 L300,-14" w={16} band={GOLD} motif="#2a0808" />
			{/* legs: armoured greaves, feet */}
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={limb(s * 70, -250, s * 92, -40, 52, 52, 28)} fill={VSK.base} stroke={VSK.line} strokeWidth={1.4} />
					<path d={limb(s * 76, -200, s * 90, -60, 40, 40, 32)} fill="#7a5a30" stroke={DB} strokeWidth={2} />
					{[-170, -140, -110, -80].map((y) => (
						<path key={y} d={`M${s * 52},${y} q${s * 30},8 ${s * 62},0`} stroke={DB} strokeWidth={1.6} fill="none" />
					))}
					<g transform={`translate(${s * 92} 0)`}>
						<Foot skin={VSK} side={s as 1 | -1} s={1.1} anklet />
					</g>
				</g>
			))}
			{/* dark red dhoti with gold border */}
			<path d={smoothPath([[-134, -500], [-156, -380], [-146, -230], [146, -230], [156, -380], [134, -500]], true)} fill="#4a1010" stroke={VSK.line} strokeWidth={1.6} />
			<Pleats x={0} y0={-490} y1={-232} w0={50} w1={90} n={6} fill="#5a1414" shade="#3a0a0a" />
			<Border d="M-146,-236 L146,-236" w={14} band={GOLD} motif="#2a0808" />
			{/* torso + engraved breastplate */}
			<g transform={`translate(0 ${br * 0.3})`}>
				<path d={smoothPath([[0, -796], [-134, -766], [-214, -724], [-204, -652], [-154, -572], [-124, -500], [124, -500], [154, -572], [204, -652], [214, -724], [134, -766]], true)} fill={VSK.base} stroke={VSK.line} strokeWidth={1.8} />
				<path d="M-150,-740 C-120,-760 120,-760 150,-740 L140,-560 C80,-520 -80,-520 -140,-560 Z" fill="#8a6430" stroke={DB} strokeWidth={2.4} />
				{Array.from({length: 6}, (_, r) => (
					<path key={r} d={`M${-130 + r * 4},${-720 + r * 28} Q0,${-700 + r * 30} ${130 - r * 4},${-720 + r * 28}`} stroke={DB} strokeWidth={1.6} fill="none" opacity={0.8} />
				))}
				<path d="M0,-750 L0,-530" stroke={DB} strokeWidth={2} />
				<Jewel x={0} y={-680} r={16} stone={C.red} />
				<path d="M20,-748 C80,-740 130,-720 140,-700 L136,-570 C100,-540 60,-532 20,-530 Z" fill="#000" opacity={0.22} />
				{/* pauldrons */}
				{[-1, 1].map((s) => (
					<g key={s}>
						<path d={`M${s * 150},-760 C${s * 200},-780 ${s * 250},-740 ${s * 248},-690 C${s * 220},-700 ${s * 180},-704 ${s * 150},-700 Z`} fill="#8a6430" stroke={DB} strokeWidth={2.4} />
						<path d={`M${s * 160},-744 C${s * 200},-756 ${s * 232},-730 ${s * 236},-704`} stroke={C.paleGold} strokeWidth={2} fill="none" />
					</g>
				))}
				<path d="M-124,-504 Q0,-486 124,-504 L126,-468 Q0,-452 -126,-468 Z" fill={GOLD} stroke={DB} strokeWidth={2.4} />
				<Jewel x={0} y={-484} r={10} stone={C.red} />
				{/* left arm resting, right arm pointing */}
				<path d={limb(-190, -712, -238, -540, 46, 44, 32)} fill={VSK.base} stroke={VSK.line} strokeWidth={1.4} />
				<path d={limb(-238, -540, -190, -404, 32, 30, 23)} fill={VSK.base} stroke={VSK.line} strokeWidth={1.4} />
				<path d={limb(-212, -640, -218, -620, 46, 46, 45)} fill={GOLD} stroke={DB} strokeWidth={1.6} />
				<g transform={`translate(-190 -404) rotate(${(Math.atan2(48, 136) * 180) / Math.PI})`}>
					<Hand skin={VSK} pose="fist" side={-1} s={0.75} rings />
				</g>
				<path d={limb(190, -712, ex, ey, 46, 44, 32)} fill={VSK.base} stroke={VSK.line} strokeWidth={1.4} />
				<path d={limb(ex, ey, px, py, 32, 30, 22)} fill={VSK.base} stroke={VSK.line} strokeWidth={1.4} />
				<path d={limb(200 + (ex - 190) * 0.4, -712 + (ey + 712) * 0.4, 200 + (ex - 190) * 0.48, -712 + (ey + 712) * 0.48, 46, 46, 45)} fill={GOLD} stroke={DB} strokeWidth={1.6} />
				<g transform={`translate(${px} ${py}) rotate(${rot})`}>
					<Hand skin={VSK} pose={point > 0.3 ? 'point' : 'relaxed'} side={1} s={0.75} rings />
				</g>
				<path d="M-36,-806 L-40,-760 Q0,-748 40,-760 L36,-806 Z" fill={VSK.base} />
				<Beads pts={[[-70, -770], [0, -716], [70, -770]]} n={18} r={5} fill={GOLD} />
			</g>
			{/* ten crowned heads */}
			{heads.map((h) => (
				<g key={h.i} transform={`translate(${h.x} ${h.y + br * (h.i % 2 ? 1 : -1) * 0.5})`}>
					<RavanFace s={h.s} t={t} k={h.i} main={h.i === 4 || h.i === 5} />
				</g>
			))}
		</g>
	);
};

// ------------------------------------------------------------------ TULSIDAS (seated poet-saint writing)
const TSK: Skin = {base: '#a87a58', shade: '#6e4c36', light: '#c4966e', line: '#4a3020'};
export const Tulsidas: React.FC<{t: number; write?: number; lookUp?: number; pray?: number}> = ({t, write = 1, lookUp = 0, pray = 0}) => {
	const cloth = '#e6dcc4';
	const clothS = '#b9ab90';
	const pen = Math.sin(t * 7) * 6 * write;
	const lift = clamp(pray);
	return (
		<g>
			{/* mat */}
			<path d="M-300,4 L300,4 L270,-24 L-270,-24 Z" fill="#6a4a24" stroke="#3a2a14" strokeWidth={2} />
			{Array.from({length: 14}, (_, i) => (
				<path key={i} d={`M${-280 + i * 40},-22 L${-284 + i * 41},2`} stroke="#4a3418" strokeWidth={2} />
			))}
			{/* crossed legs under the dhoti */}
			<path d="M-236,-24 C-236,-110 -126,-152 0,-152 C126,-152 236,-110 236,-24 C156,4 -156,4 -236,-24 Z" fill={cloth} stroke={TSK.line} strokeWidth={1.6} />
			<path d="M-200,-44 C-120,-94 -40,-84 20,-64 M200,-44 C120,-94 40,-84 -20,-64 M-140,-30 Q-60,-50 0,-40" stroke={clothS} strokeWidth={5} fill="none" />
			<g transform="translate(150 -26) rotate(-90)">
				<Foot skin={TSK} side={1} s={0.8} />
			</g>
			{/* torso (bare chest, thin), sacred thread, tulsi mala, shawl over one shoulder */}
			<path d={smoothPath([[-94, -152], [-106, -280], [-110, -390], [-72, -432], [0, -442], [72, -432], [110, -390], [106, -280], [94, -152]], true)} fill={TSK.base} stroke={TSK.line} strokeWidth={1.6} />
			<path d="M30,-440 L72,-432 L110,-390 L106,-280 L94,-152 L40,-152 Z" fill={TSK.shade} opacity={0.45} />
			<path d="M-60,-350 Q-30,-340 -6,-354 M60,-350 Q30,-340 6,-354 M-40,-300 L-36,-290 M40,-300 L36,-290 M-44,-270 L-40,-260 M44,-270 L40,-260" stroke={TSK.shade} strokeWidth={2.4} fill="none" opacity={0.7} />
			<path d="M-80,-420 C-20,-330 30,-250 70,-160" stroke="#efe6d2" strokeWidth={3} fill="none" />
			<Beads pts={[[-50, -430], [-30, -360], [0, -330], [30, -360], [50, -430]]} n={24} r={3.4} fill="#7a5a30" stroke="#3a2a14" />
			<path d="M60,-436 C124,-420 136,-330 116,-240 C86,-200 36,-180 -98,-150 L-94,-192 C-12,-222 58,-282 60,-436 Z" fill={cloth} stroke={TSK.line} strokeWidth={1.4} />
			<path d="M60,-436 C70,-330 0,-230 -96,-178" stroke={clothS} strokeWidth={5} fill="none" />
			<Border d="M62,-432 C122,-418 134,-330 114,-242" w={8} band="#a07a3a" motif="#e6dcc4" />
			{/* arms: left holds a palm leaf, right writes with a reed pen (or both rise in prayer) */}
			{[-1, 1].map((s) => {
				const ex = s * (148 + lift * 20);
				const ey = -300 - lift * 130;
				const hx = s < 0 ? -40 + lift * 30 : 70 - lift * 46;
				const hy = s < 0 ? -230 - lift * 380 : -236 - lift * 374 + (s > 0 ? pen * 0.3 : 0);
				const rot = (Math.atan2(-(hx - ex), hy - ey) * 180) / Math.PI;
				return (
					<g key={s}>
						<path d={limb(s * 100, -410, ex, ey, 25, 24, 18)} fill={TSK.base} stroke={TSK.line} strokeWidth={1.4} />
						<path d={limb(ex, ey, hx, hy, 18, 17, 13)} fill={TSK.base} stroke={TSK.line} strokeWidth={1.4} />
						<g transform={`translate(${hx} ${hy}) rotate(${rot})`}>
							<Hand skin={TSK} pose={lift > 0.5 ? 'open' : s < 0 ? 'offer' : 'grip'} side={s as 1 | -1} s={0.55} />
						</g>
					</g>
				);
			})}
			{lift < 0.5 && (
				<g opacity={1 - lift * 2}>
					{/* palm leaf with lines of script appearing */}
					<g transform="translate(-130 -214) rotate(-6)">
						<rect x={0} y={0} width={200} height={40} rx={18} fill="#d8c49a" stroke="#6b5434" strokeWidth={2} />
						{[0, 1, 2].map((r) => (
							<path key={r} d={`M16,${10 + r * 10} L${16 + (168 * clamp(write * 1.2 - r * 0.2))},${10 + r * 10}`} stroke="#3a2614" strokeWidth={2} strokeDasharray="6 3 2 3" />
						))}
						<circle cx={60} cy={20} r={4} fill="#2a1d10" />
						<circle cx={140} cy={20} r={4} fill="#2a1d10" />
					</g>
					<path d={`M${78 + pen},-246 L${30 + pen * 0.6},-206`} stroke="#3a2614" strokeWidth={4} strokeLinecap="round" />
				</g>
			)}
			{/* head: shaved with a shikha, Vaishnava tilak, white beard, kind eyes */}
			<g transform={`translate(0 -500) rotate(${-lookUp * 10})`}>
				<path d="M-30,30 L-34,70 Q0,80 34,70 L30,30 Z" fill={TSK.base} />
				<path d={smoothPath([[-70, -50], [-76, 0], [-66, 40], [-40, 66], [0, 76], [40, 66], [66, 40], [76, 0], [70, -50], [40, -96], [0, -106], [-40, -96]], true)} fill={TSK.base} stroke={TSK.line} strokeWidth={1.6} />
				<path d={smoothPath([[14, -104], [70, -50], [76, 0], [66, 40], [40, 66], [12, 74], [32, 10], [30, -60]], true)} fill={TSK.shade} opacity={0.42} />
				<path d="M-6,-104 C-16,-130 -4,-150 10,-160 C4,-140 8,-122 6,-104 Z" fill="#d8d2c6" />
				<path d="M-12,-46 L-8,-6 Q0,2 8,-6 L12,-46" stroke="#efe6d6" strokeWidth={4} fill="none" />
				<path d="M0,-48 L0,-6" stroke={C.red} strokeWidth={5} strokeLinecap="round" />
				<path d="M-58,-14 Q-40,-22 -20,-16 M58,-14 Q40,-22 20,-16" stroke="#d8d2c6" strokeWidth={6} strokeLinecap="round" fill="none" />
				<Eye x={-34} y={2} s={1} side={-1} open={0.35 + lookUp * 0.6} look={0} />
				<Eye x={34} y={2} s={1} side={1} open={0.35 + lookUp * 0.6} look={0} />
				<path d="M-4,8 Q-10,28 -8,36 Q0,40 8,36" stroke={TSK.shade} strokeWidth={2.4} fill="none" />
				{[-1, 1].map((s) => (
					<path key={s} d={`M${s * 72},-10 C${s * 86},-14 ${s * 88},14 ${s * 74},22`} fill={TSK.base} stroke={TSK.line} strokeWidth={1.4} />
				))}
				{/* beard and moustache with strands */}
				<path d={smoothPath([[-68, 20], [-62, 90], [-40, 160], [0, 196], [40, 160], [62, 90], [68, 20], [40, 50], [16, 46], [0, 52], [-16, 46], [-40, 50]], true)} fill="#e6e0d4" stroke="#9a9284" strokeWidth={1.4} />
				<Fur pts={[[-50, 60], [-20, 150], [0, 186], [20, 150], [50, 60]]} n={30} len={22} color="#b5ad9e" seed={9} ang={1.5} w={1.4} opacity={0.8} />
				<path d="M-40,44 Q-18,34 0,42 Q18,34 40,44" stroke="#d8d2c6" strokeWidth={8} fill="none" strokeLinecap="round" />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ RAKSHASA guard (horned, fanged, armoured)
const KSK: Skin = {base: '#4a5244', shade: '#2e342a', light: '#66705e', line: '#161a14'};
export const Rakshasa: React.FC<{t: number; seed?: number; weapon?: 'spear' | 'torch' | 'none'; facing?: 1 | -1}> = ({t, seed = 1, weapon = 'spear', facing = 1}) => {
	const r = rng(seed);
	const bob = Math.sin(t * 1.4 + r() * 6) * 3;
	const horn = 0.8 + r() * 0.5;
	return (
		<g transform={`translate(0 ${bob}) scale(${facing} 1)`}>
			{weapon === 'spear' && (
				<g>
					<path d="M150,-80 L170,-980" stroke="#3a2a1a" strokeWidth={10} />
					<path d="M170,-980 l-18,-70 l18,-30 l18,30 Z" fill="#8a8a86" stroke="#2a2a28" strokeWidth={2} />
					<path d="M156,-944 l28,0" stroke={C.red} strokeWidth={8} />
				</g>
			)}
			{[-1, 1].map((s) => (
				<g key={s}>
					<path d={limb(s * 56, -260, s * 80, -40, 46, 48, 24)} fill={KSK.base} stroke={KSK.line} strokeWidth={1.4} />
					<g transform={`translate(${s * 80} 0)`}>
						<Foot skin={KSK} side={s as 1 | -1} s={1} />
					</g>
				</g>
			))}
			<path d={smoothPath([[-110, -480], [-130, -360], [-120, -240], [120, -240], [130, -360], [110, -480]], true)} fill="#3a2a22" stroke={KSK.line} strokeWidth={1.6} />
			{Array.from({length: 7}, (_, i) => (
				<path key={i} d={`M${-110 + i * 36},-470 L${-116 + i * 38},-250`} stroke="#5a4232" strokeWidth={4} />
			))}
			<path d={smoothPath([[0, -780], [-130, -750], [-190, -712], [-180, -650], [-134, -580], [-110, -490], [110, -490], [134, -580], [180, -650], [190, -712], [130, -750]], true)} fill={KSK.base} stroke={KSK.line} strokeWidth={1.8} />
			<path d="M-120,-660 C-80,-620 -20,-620 -4,-650 M120,-660 C80,-620 20,-620 4,-650" stroke={KSK.shade} strokeWidth={5} fill="none" />
			<path d="M-110,-740 L110,-740 L94,-560 L-94,-560 Z" fill="#5a4a3a" stroke="#1e1610" strokeWidth={2} opacity={0.9} />
			{Array.from({length: 4}, (_, i) => (
				<path key={i} d={`M-100,${-714 + i * 40} L100,${-714 + i * 40}`} stroke="#2a1e14" strokeWidth={3} />
			))}
			<path d="M-110,-500 L110,-500 L112,-468 L-112,-468 Z" fill="#6a5030" stroke="#1e1610" />
			<path d={limb(-160, -712, -200, -560, 44, 42, 30)} fill={KSK.base} stroke={KSK.line} strokeWidth={1.4} />
			<path d={limb(-200, -560, -170, -420, 30, 28, 22)} fill={KSK.base} stroke={KSK.line} strokeWidth={1.4} />
			<g transform={`translate(-170 -420) rotate(${(Math.atan2(-30, 140) * 180) / Math.PI})`}>
				<Hand skin={KSK} pose="fist" side={-1} s={0.75} nails="#d8d0b8" />
			</g>
			<path d={limb(160, -712, 190, -600, 44, 42, 30)} fill={KSK.base} stroke={KSK.line} strokeWidth={1.4} />
			<path d={limb(190, -600, 158, -520, 30, 28, 22)} fill={KSK.base} stroke={KSK.line} strokeWidth={1.4} />
			<g transform="translate(158 -520) rotate(150)">
				<Hand skin={KSK} pose="grip" side={1} s={0.75} nails="#d8d0b8" />
			</g>
			{weapon === 'torch' && (
				<g>
					<path d="M150,-500 L190,-760" stroke="#2a1a10" strokeWidth={12} />
					<g transform="translate(190 -760) scale(0.5)">
						<path d="M-30,0 C-30,-20 30,-20 30,0 Z" fill="#4a3420" />
					</g>
				</g>
			)}
			{/* head: wild hair, horns, heavy brow, fangs */}
			<g transform="translate(0 -800)">
				<path d={smoothPath([[-70, -40], [-96, -10], [-90, 40], [-70, 20], [-60, -60], [0, -90], [60, -60], [70, 20], [90, 40], [96, -10], [70, -40], [0, -100]], true)} fill="#140e0c" />
				<path d={`M-40,-70 C-60,${-110 * horn} -90,${-130 * horn} -110,${-120 * horn} C-90,${-108 * horn} -70,-90 -54,-60 Z M40,-70 C60,${-110 * horn} 90,${-130 * horn} 110,${-120 * horn} C90,${-108 * horn} 70,-90 54,-60 Z`} fill="#d8ccb0" stroke="#4a4030" strokeWidth={2} />
				<path d={smoothPath([[-54, -60], [-60, -10], [-50, 30], [-24, 52], [0, 58], [24, 52], [50, 30], [60, -10], [54, -60], [0, -76]], true)} fill={KSK.base} stroke={KSK.line} strokeWidth={1.6} />
				<path d="M-46,-26 L-8,-14 L-8,-6 L-46,-16 Z M46,-26 L8,-14 L8,-6 L46,-16 Z" fill="#0a0806" />
				<circle cx={-24} cy={-4} r={5} fill="#d0a030" />
				<circle cx={24} cy={-4} r={5} fill="#d0a030" />
				<circle cx={-24} cy={-4} r={2} fill="#000" />
				<circle cx={24} cy={-4} r={2} fill="#000" />
				<path d="M-8,4 L-12,20 L12,20 L8,4" fill={KSK.shade} />
				<path d="M-26,32 Q0,44 26,32 Q0,54 -26,32 Z" fill="#2a0e0a" />
				<path d="M-18,34 l4,14 l4,-12 M18,34 l-4,14 l-4,-12" fill="#efe6d2" />
				<circle cx={-58} cy={10} r={8} stroke={GOLD} strokeWidth={3} fill="none" />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ AKSHAY KUMAR (Ravan's son, profile, standing in the chariot)
const AKS: Skin = {base: '#6a4a3a', shade: '#40281e', light: '#8a6450', line: '#24140e'};
export const Akshay: React.FC<{t: number; draw?: number}> = ({t, draw = 0.6}) => {
	const g = (k: number) => Math.sin(t * 4 + k) * 10;
	return (
		<g>
			<path d={smoothPath([[-10, -470], [-90 + g(1), -420], [-170 + g(2), -350], [-210 + g(3), -270], [-140, -250], [-60, -310], [-20, -380]], true)} fill="#4a1010" stroke={AKS.line} strokeWidth={1.2} />
			<path d="M-36,-260 L-42,0 L-12,0 L-6,-260 Z M4,-260 L12,0 L42,0 L34,-260 Z" fill={AKS.base} stroke={AKS.line} strokeWidth={1.2} />
			<path d="M-48,-472 C-62,-400 -58,-320 -42,-250 L48,-250 C62,-330 62,-400 42,-472 Z" fill="#8a6430" stroke={DB} strokeWidth={2} />
			{Array.from({length: 5}, (_, i) => (
				<path key={i} d={`M-46,${-450 + i * 42} Q0,${-440 + i * 42} 50,${-450 + i * 42}`} stroke={DB} strokeWidth={1.6} fill="none" />
			))}
			<Jewel x={6} y={-400} r={9} stone={C.red} />
			<path d="M-46,-270 L50,-270 L54,-240 L-50,-240 Z" fill={GOLD} stroke={DB} />
			{/* bow arm forward, string hand drawing back */}
			<path d={limb(30, -452, 120, -420, 18, 18, 14)} fill={AKS.base} stroke={AKS.line} strokeWidth={1.2} />
			<g transform="translate(120 -420) rotate(-90)">
				<Hand skin={AKS} pose="grip" side={1} s={0.4} />
			</g>
			<path d={smoothPath([[124, -560], [158, -430], [124, -290]])} stroke="#3b2516" strokeWidth={8} fill="none" />
			<path d={`M124,-560 L${124 - draw * 70},-430 L124,-290`} stroke="#d8cfbd" strokeWidth={2} fill="none" />
			<path d={`M${124 - draw * 70},-430 L190,-430`} stroke="#d8cfbd" strokeWidth={3} />
			<path d="M190,-430 l-14,-6 l0,12 Z" fill="#8a8a86" />
			<path d={limb(10, -440, 124 - draw * 70, -432, 16, 16, 12)} fill={AKS.base} stroke={AKS.line} strokeWidth={1.2} />
			{/* head in profile: young face, crown, earring */}
			<g transform="translate(6 -520)">
				<path d="M-30,-40 C-34,-80 30,-90 40,-50 L46,-30 L58,-16 L46,-10 L48,10 C40,30 10,38 -10,32 C-30,20 -34,0 -30,-40 Z" fill={AKS.base} stroke={AKS.line} strokeWidth={1.4} />
				<path d="M20,-6 L44,-2" stroke={AKS.shade} strokeWidth={2} />
				<path d="M24,-30 Q32,-34 40,-30" stroke="#0e0806" strokeWidth={3} fill="none" />
				<circle cx={32} cy={-24} r={3} fill="#0e0806" />
				<path d="M36,14 Q42,16 46,12" stroke="#5a2a20" strokeWidth={2} fill="none" />
				<path d="M-34,-40 C-40,-90 -16,-140 12,-150 C40,-132 48,-84 42,-48 Z" fill={GOLD} stroke={DB} strokeWidth={2} />
				<path d="M-34,-54 Q0,-66 42,-54 M-26,-90 Q4,-100 36,-90" stroke={DB} strokeWidth={1.6} fill="none" />
				<Jewel x={6} y={-74} r={6} stone={C.red} />
				<path d="M-36,-40 C-50,-10 -46,20 -30,30" stroke="#120c0a" strokeWidth={14} fill="none" strokeLinecap="round" />
				<circle cx={-8} cy={6} r={6} stroke={GOLD} strokeWidth={3} fill="none" />
			</g>
		</g>
	);
};

// ------------------------------------------------------------------ close-up: Hanuman's hand gives Shri Ram's ring to Sita
export const RingHands: React.FC<{t: number; give: number; glow: number}> = ({t, give, glow}) => {
	const hx = -150 + give * 110;
	const sx = 250 - give * 50;
	const r = rng(3);
	return (
		<g>
			{/* Sita's forearm from the right, bangles, open palm */}
			<g transform={`translate(${sx} 40)`}>
				<path d="M600,150 C440,120 300,80 150,46 L140,-14 C300,10 440,30 600,40 Z" fill={SSK.base} stroke={SSK.line} strokeWidth={2} />
				<path d="M600,120 C440,100 300,70 160,40 L156,26 C300,50 440,80 600,96 Z" fill={SSK.shade} opacity={0.35} />
				{Array.from({length: 7}, (_, i) => (
					<ellipse key={i} cx={200 + i * 20} cy={20 + i * 3} rx={10} ry={52} fill={i % 2 ? C.red : GOLD} stroke={DB} strokeWidth={1.4} />
				))}
				<g transform="translate(150 16) rotate(90)">
					<Hand skin={SSK} pose="offer" side={1} s={1.9} nails="#c88a6a" rings />
				</g>
			</g>
			{/* Hanuman's forearm from the left, kada, fingers offering */}
			<g transform={`translate(${hx} -40)`}>
				<path d="M-620,120 C-440,90 -280,40 -140,16 L-130,-56 C-280,-44 -440,-24 -620,-6 Z" fill={HC.skin} stroke={HSK.line} strokeWidth={2} />
				<path d="M-620,90 C-440,70 -280,30 -150,8 L-146,-6 C-280,14 -440,44 -620,62 Z" fill={HC.shade} opacity={0.4} />
				<Fur pts={[[-560, 20], [-200, -10]]} n={26} len={14} color={HC.shade} seed={5} ang={-0.4} w={1.6} />
				<path d="M-200,-60 L-180,40 L-150,36 L-170,-64 Z" fill={GOLD} stroke={DB} strokeWidth={2.4} />
				<path d="M-226,-58 L-206,44" stroke={DB} strokeWidth={6} />
				<g transform="translate(-140 -20) rotate(-90)">
					<Hand skin={HSK} pose="offer" side={-1} s={1.9} nails="#d8a888" />
				</g>
			</g>
			{/* the ring: engraved band, a raised seal, glow and motes */}
			<g transform={`translate(${hx - 20 + give * 40} ${-70 + give * 50})`}>
				<circle r={110 * glow + 30} fill="#ffd27a" opacity={0.3 * glow} filter="url(#b24)" />
				<ellipse rx={34} ry={15} fill="none" stroke="#e9c77e" strokeWidth={11} />
				<ellipse rx={34} ry={15} fill="none" stroke={DB} strokeWidth={2} />
				<ellipse rx={34} ry={15} fill="none" stroke={C.paleGold} strokeWidth={2} strokeDasharray="3 5" />
				<path d="M-12,-14 L-6,-34 L6,-34 L12,-14 Z" fill="#e9c77e" stroke={DB} strokeWidth={2} />
				<Jewel x={0} y={-36} r={7} stone="#2e4a6a" />
				{Array.from({length: 8}, (_, i) => {
					const a = r() * Math.PI * 2;
					const d = 40 + ((t * 40 + i * 30) % 90);
					return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.6} r={2.5} fill="#ffe7b0" opacity={glow * (1 - d / 130)} />;
				})}
			</g>
		</g>
	);
};
