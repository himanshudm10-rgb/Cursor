// Set pieces for the Hanuman film: the sea, golden Lanka on Trikuta, the Ashoka tree, rope, torches.
import React from 'react';
import {C, W, clamp, lerp, noise, rng, smoothPath} from '../lib';
import {Fire, Smoke, ridgeY} from '../world';

/** Painted sea: bands of swells from the horizon down, with drifting foam strokes and a light column. */
export const Sea: React.FC<{t: number; y: number; deep: string; mid: string; light: string; glowX?: number; glow?: string; speed?: number; x0?: number; x1?: number}> = ({
	t,
	y,
	deep,
	mid,
	light,
	glowX = 540,
	glow,
	speed = 1,
	x0 = -900,
	x1 = W + 900,
}) => {
	const bands = 11;
	return (
		<g>
			<rect x={x0} y={y} width={x1 - x0} height={3000} fill={deep} />
			{Array.from({length: bands}, (_, i) => {
				const k = i / (bands - 1);
				const by = y + Math.pow(k, 1.7) * 1400;
				const amp = 4 + k * 26;
				const wl = 80 + k * 260;
				const ph = t * (0.6 + k * 1.4) * speed + i * 1.3;
				const pts: string[] = [];
				for (let x = x0; x <= x1; x += 24) pts.push(`${x},${(by + Math.sin(x / wl + ph) * amp + noise(x * 0.004 + i, 5) * amp).toFixed(1)}`);
				return (
					<g key={i}>
						<path d={`M${x0},${by + 2000} L${pts.join(' L')} L${x1},${by + 2000} Z`} fill={i % 2 ? mid : deep} opacity={0.55 + k * 0.4} />
						<path d={`M${pts.join(' L')}`} stroke={light} strokeWidth={1 + k * 3} fill="none" opacity={0.18 + k * 0.25} strokeDasharray={`${20 + k * 90} ${60 + k * 160}`} strokeDashoffset={-t * 40 * speed * (1 + k)} />
					</g>
				);
			})}
			{glow && (
				<g filter="url(#b14)">
					{Array.from({length: 26}, (_, i) => {
						const r = rng(i * 7 + 3);
						const yy = y + 6 + Math.pow(i / 26, 1.6) * 900;
						const w = 30 + (i / 26) * 240 * (0.6 + r());
						return <rect key={i} x={glowX - w / 2 + Math.sin(t * 2 + i) * 14} y={yy} width={w} height={3 + i * 0.5} fill={glow} opacity={0.5 * (1 - i / 30) * (0.6 + 0.4 * Math.sin(t * 3 + i * 2))} />;
					})}
				</g>
			)}
		</g>
	);
};

/** One palace tower: stepped base + curved spire or onion dome, lit windows. */
const Tower: React.FC<{x: number; base: number; w: number; h: number; tone: string; trim: string; seed: number; dome?: boolean; lit: number; burn: number}> = ({x, base, w, h, tone, trim, seed, dome, lit, burn}) => {
	const r = rng(seed);
	const top = base - h;
	const wins: React.ReactNode[] = [];
	for (let yy = top + 40; yy < base - 30; yy += 46)
		for (let xx = x - w / 2 + 14; xx < x + w / 2 - 18; xx += 30)
			if (r() < 0.55) wins.push(<path key={`${xx}-${yy}`} d={`M${xx},${yy + 20} L${xx},${yy + 6} Q${xx + 7},${yy - 4} ${xx + 14},${yy + 6} L${xx + 14},${yy + 20} Z`} fill={r() < lit ? '#f0c878' : '#2a1c12'} opacity={0.9} />);
	return (
		<g>
			<rect x={x - w / 2} y={top} width={w} height={h} fill={tone} />
			<rect x={x + w * 0.1} y={top} width={w * 0.4} height={h} fill="#000" opacity={0.18} />
			{[0.0, 0.33, 0.66].map((f) => (
				<rect key={f} x={x - w / 2 - 6} y={top + h * f} width={w + 12} height={8} fill={trim} />
			))}
			{wins}
			{dome ? (
				<g>
					<path d={`M${x - w * 0.55},${top} C${x - w * 0.62},${top - w * 0.5} ${x - w * 0.2},${top - w * 0.7} ${x},${top - w * 1.05} C${x + w * 0.2},${top - w * 0.7} ${x + w * 0.62},${top - w * 0.5} ${x + w * 0.55},${top} Z`} fill={trim} />
					<path d={`M${x + w * 0.05},${top - w * 0.95} C${x + w * 0.25},${top - w * 0.6} ${x + w * 0.58},${top - w * 0.45} ${x + w * 0.55},${top} L${x + w * 0.2},${top} Z`} fill="#000" opacity={0.22} />
				</g>
			) : (
				<g>
					<path d={`M${x - w * 0.5},${top} C${x - w * 0.48},${top - h * 0.35} ${x - w * 0.2},${top - h * 0.55} ${x},${top - h * 0.62} C${x + w * 0.2},${top - h * 0.55} ${x + w * 0.48},${top - h * 0.35} ${x + w * 0.5},${top} Z`} fill={tone} />
					{[0.15, 0.3, 0.45].map((f) => (
						<path key={f} d={`M${x - w * (0.5 - f * 0.55)},${top - h * f} L${x + w * (0.5 - f * 0.55)},${top - h * f}`} stroke={trim} strokeWidth={5} />
					))}
					<path d={`M${x + w * 0.05},${top - h * 0.6} C${x + w * 0.22},${top - h * 0.5} ${x + w * 0.46},${top - h * 0.3} ${x + w * 0.5},${top} L${x + w * 0.15},${top} Z`} fill="#000" opacity={0.2} />
				</g>
			)}
			<path d={`M${x},${top - (dome ? w * 1.05 : h * 0.62)} l0,-40`} stroke={trim} strokeWidth={5} />
			<circle cx={x} cy={top - (dome ? w * 1.05 : h * 0.62) - 44} r={7} fill={C.paleGold} />
			{burn > 0.05 && r() < 0.8 && <ellipse cx={x} cy={top + h * 0.2} rx={w} ry={h * 0.5} fill="#e0742c" opacity={0.35 * burn} filter="url(#b24)" />}
		</g>
	);
};

/** Golden Lanka on the three peaks of Trikuta. burn 0..1 sets roofs on fire. */
export const LankaCity: React.FC<{t: number; base: number; s?: number; burn?: number; lit?: number; tone?: string; trim?: string; rock?: string; glow?: number}> = ({
	t,
	base,
	s = 1,
	burn = 0,
	lit = 0.55,
	tone = '#6a4a26',
	trim = '#b8934a',
	rock = '#1c1714',
	glow = 0.5,
}) => {
	const peaks = [
		{x: 260, h: 420, w: 300},
		{x: 560, h: 560, w: 340},
		{x: 860, h: 400, w: 280},
	];
	const pts: [number, number][] = [];
	for (let x = -700; x <= W + 700; x += 14) pts.push([x, ridgeY(x, 71, base, 90, 0.004, peaks)]);
	const ground = (x: number) => ridgeY(x, 71, base, 90, 0.004, peaks);
	const r = rng(91);
	const towers = Array.from({length: 26}, (_, i) => {
		const x = 60 + i * 37 + (r() - 0.5) * 20;
		const big = Math.abs(x - 560) < 120;
		return {x, w: 46 + r() * 40 + (big ? 30 : 0), h: 140 + r() * 200 + (big ? 220 : 0), dome: r() < 0.45, seed: 300 + i, z: r()};
	}).sort((a, b) => b.h - a.h);
	return (
		<g transform={`translate(${W / 2} ${base}) scale(${s}) translate(${-W / 2} ${-base})`}>
			{glow > 0 && <ellipse cx={560} cy={base - 520} rx={700} ry={380} fill={burn > 0.2 ? '#d86a28' : '#d8a050'} opacity={(0.18 + burn * 0.3) * glow} filter="url(#b70)" />}
			{/* city walls + towers sit on the peaks */}
			<g>
				{towers.map((tw, i) => (
					<Tower key={i} x={tw.x} base={ground(tw.x) + 40} w={tw.w} h={tw.h} tone={tone} trim={trim} seed={tw.seed} dome={tw.dome} lit={lit} burn={burn} />
				))}
			</g>
			<path d={`M-700,${base + 1600} ` + pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${W + 700},${base + 1600} Z`} fill={rock} />
			{/* crenellated outer wall along the ridge */}
			<path d={pts.filter((p) => p[0] > 20 && p[0] < 1080).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1] + 30}`).join(' ')} stroke={trim} strokeWidth={6} fill="none" opacity={0.7} />
			{/* painted rock planes */}
			<path d={`M560,${ground(560) + 40} L700,${base + 200} L620,${base + 400} Z M260,${ground(260) + 40} L180,${base + 220} L300,${base + 380} Z`} fill="#000" opacity={0.25} />
			{burn > 0.02 && (
				<g>
					{Array.from({length: 9}, (_, i) => {
						const rr = rng(500 + i);
						const x = 120 + i * 105 + rr() * 30;
						const on = clamp((burn - rr() * 0.6) * 3);
						if (on < 0.02) return null;
						return (
							<g key={i}>
								<Smoke t={t + i} x={x} y={ground(x) - 120} rise={1400} seed={40 + i} color="#3a2a22" count={10} size={50} spread={0.7} opacity={0.6 * on} />
								<Fire t={t} x={x} y={ground(x) - 40 - rr() * 180} s={(0.7 + rr() * 0.7) * on} seed={60 + i} glow={0.8} />
							</g>
						);
					})}
				</g>
			)}
		</g>
	);
};

/** The Ashoka tree: dark trunk, layered drooping foliage, red-orange flower clusters. fall 0..1 topples it. */
export const AshokaTree: React.FC<{x: number; y: number; s: number; seed?: number; t: number; fall?: number; dir?: 1 | -1; tone?: string; leaf?: string; leafLight?: string; flower?: string}> = ({
	x,
	y,
	s,
	seed = 1,
	t,
	fall = 0,
	dir = 1,
	tone = '#2a1a12',
	leaf = '#2e3a22',
	leafLight = '#55623a',
	flower = '#c0572a',
}) => {
	const r = rng(seed);
	const sway = Math.sin(t * 0.9 + seed) * 1.2;
	const clusters = Array.from({length: 14}, () => ({cx: (r() - 0.5) * 420, cy: -380 - r() * 420, rx: 90 + r() * 80, ry: 60 + r() * 50}));
	return (
		<g transform={`translate(${x} ${y}) scale(${s}) rotate(${dir * fall * 78 + sway})`}>
			<path d="M-34,0 C-30,-120 -40,-240 -18,-380 L18,-380 C30,-240 30,-120 40,0 Z" fill={tone} />
			<path d="M0,-260 C-60,-320 -120,-360 -190,-420 M0,-300 C60,-360 110,-420 180,-470 M0,-360 C-10,-440 10,-520 0,-600" stroke={tone} strokeWidth={22} fill="none" strokeLinecap="round" />
			{fall > 0.02 && <path d="M-60,0 C-40,30 40,30 60,0 L40,40 L-40,40 Z" fill={tone} opacity={0.8} />}
			{clusters.map((c, i) => (
				<g key={i}>
					<ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={leaf} />
					<ellipse cx={c.cx - c.rx * 0.2} cy={c.cy - c.ry * 0.35} rx={c.rx * 0.6} ry={c.ry * 0.35} fill={leafLight} opacity={0.5} />
					{/* drooping leaf tips */}
					<path d={`M${c.cx - c.rx * 0.8},${c.cy + c.ry * 0.4} l-6,${c.ry * 0.6} M${c.cx},${c.cy + c.ry * 0.8} l4,${c.ry * 0.5} M${c.cx + c.rx * 0.7},${c.cy + c.ry * 0.5} l8,${c.ry * 0.55}`} stroke={leaf} strokeWidth={10} strokeLinecap="round" />
				</g>
			))}
			{clusters.map((c, i) =>
				i % 2 ? (
					<g key={'f' + i}>
						<circle cx={c.cx + c.rx * 0.3} cy={c.cy + c.ry * 0.1} r={8} fill={flower} /><circle cx={c.cx + c.rx * 0.2} cy={c.cy + c.ry * 0.2} r={6} fill={flower} />
						<circle cx={c.cx + c.rx * 0.45} cy={c.cy - c.ry * 0.05} r={6} fill="#d07038" />
						<circle cx={c.cx - c.rx * 0.4} cy={c.cy + c.ry * 0.3} r={7} fill={flower} />
					</g>
				) : null,
			)}
		</g>
	);
};

/** Falling leaves and petals (deterministic). */
export const Leaves: React.FC<{t: number; seed: number; count?: number; color?: string; color2?: string; vx?: number; vy?: number; area?: [number, number, number, number]; size?: number; opacity?: number}> = ({
	t,
	seed,
	count = 40,
	color = '#55623a',
	color2 = '#c0572a',
	vx = 80,
	vy = 140,
	area = [-200, -200, 1480, 2300],
	size = 1,
	opacity = 0.9,
}) => {
	const [ax, ay, aw, ah] = area;
	return (
		<g opacity={opacity}>
			{Array.from({length: count}, (_, i) => {
				const r = rng(seed * 31 + i);
				const sp = 0.6 + r() * 0.8;
				const px = ax + ((((r() * aw + t * vx * sp + Math.sin(t * 2 + i) * 30) % aw) + aw) % aw);
				const py = ay + ((((r() * ah + t * vy * sp) % ah) + ah) % ah);
				const rot = t * 140 * (r() - 0.5) + r() * 360;
				const s = size * (0.6 + r() * 0.8);
				return <ellipse key={i} cx={0} cy={0} rx={12 * s} ry={5 * s} fill={r() < 0.3 ? color2 : color} transform={`translate(${px} ${py}) rotate(${rot})`} />;
			})}
		</g>
	);
};

/** Wind streams (Vayu): long luminous ribbons spiralling around a centre. */
export const WindStreams: React.FC<{t: number; cx: number; cy: number; n?: number; color?: string; opacity?: number; radius?: number}> = ({t, cx, cy, n = 7, color = '#f2dcae', opacity = 0.6, radius = 380}) => (
	<g opacity={opacity}>
		{Array.from({length: n}, (_, i) => {
			const r = rng(70 + i);
			const R = radius * (0.6 + r() * 0.8);
			const a0 = t * (0.9 + r() * 0.5) + r() * 6.28;
			const pts: [number, number][] = Array.from({length: 9}, (_, k) => {
				const a = a0 + k * 0.22;
				const rr = R * (1 - k * 0.03);
				return [cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * 0.45 - k * 14];
			});
			return (
				<g key={i}>
					<path d={smoothPath(pts)} stroke={color} strokeWidth={14} fill="none" opacity={0.35} filter="url(#b8)" strokeLinecap="round" />
					<path d={smoothPath(pts)} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="160 60" strokeDashoffset={-t * 300} />
				</g>
			);
		})}
	</g>
);

/** Rope coils binding a figure (drawn over the character). */
export const Ropes: React.FC<{y0: number; n?: number; w?: number; tone?: string}> = ({y0, n = 4, w = 220, tone = '#8a7350'}) => (
	<g>
		{Array.from({length: n}, (_, i) => (
			<g key={i}>
				<path d={`M${-w},${y0 + i * 58} Q0,${y0 + i * 58 + 34} ${w},${y0 + i * 58 - 6}`} stroke="#3a2a18" strokeWidth={18} fill="none" />
				<path d={`M${-w},${y0 + i * 58} Q0,${y0 + i * 58 + 34} ${w},${y0 + i * 58 - 6}`} stroke={tone} strokeWidth={12} fill="none" strokeDasharray="10 6" />
			</g>
		))}
	</g>
);

/** A torch held aloft (for the rakshasas). */
export const Torch: React.FC<{t: number; x: number; y: number; s?: number; seed?: number}> = ({t, x, y, s = 1, seed = 1}) => (
	<g>
		<path d={`M${x},${y} l${-8 * s},${180 * s}`} stroke="#2a1a10" strokeWidth={10 * s} />
		<Fire t={t} x={x} y={y + 6} s={0.45 * s} seed={seed} glow={0.6} />
	</g>
);

export const mixColor = (a: string, b: string, k: number) => {
	const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const A = p(a);
	const B = p(b);
	return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join('');
};
