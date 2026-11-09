// Detail kit shared by every character: articulated hands, feet with toes, jewellery, fabric borders,
// fur texture. Painted-vector look: flat fills + painted shadow shapes + fine line work.
import React from 'react';
import {C, rng, smoothPath} from './lib';

export type Skin = {base: string; shade: string; light: string; line: string};

/**
 * Hand at the wrist (origin), pointing along +y. side: which arm (-1 = figure's right, on screen left).
 * pose: fist | grip (closed around a shaft running along x) | open | anjali-half | point | relaxed.
 * s: scale (1 = an adult hand ~ 110 units long).
 */
export const Hand: React.FC<{skin: Skin; pose?: 'fist' | 'grip' | 'open' | 'relaxed' | 'point' | 'offer'; side?: 1 | -1; s?: number; nails?: string; rings?: boolean}> = ({
	skin,
	pose = 'relaxed',
	side = -1,
	s = 1,
	nails,
	rings,
}) => {
	const {base, shade, light, line} = skin;
	const finger = (x: number, len: number, w: number, curl: number, key: string) => {
		// a finger with two creases; curl 0 = straight, 1 = fully curled (shown as a short knuckle stub)
		const L = len * (1 - curl * 0.62);
		return (
			<g key={key}>
				<path d={`M${x - w},44 C${x - w},${44 + L * 0.5} ${x - w * 0.9},${44 + L} ${x},${44 + L + w * 0.6} C${x + w * 0.9},${44 + L} ${x + w},${44 + L * 0.5} ${x + w},44 Z`} fill={base} stroke={line} strokeWidth={1.6} />
				<path d={`M${x - w * 0.7},${44 + L * 0.42} q${w * 0.7},${w * 0.35} ${w * 1.4},0 M${x - w * 0.6},${44 + L * 0.75} q${w * 0.6},${w * 0.3} ${w * 1.2},0`} stroke={shade} strokeWidth={1.4} fill="none" opacity={0.8} />
				<path d={`M${x + w * 0.35},48 L${x + w * 0.5},${44 + L * 0.9}`} stroke={shade} strokeWidth={w * 0.5} opacity={0.35} strokeLinecap="round" />
				{curl < 0.5 && <path d={`M${x - w * 0.55},${44 + L - w * 0.2} q${w * 0.55},${w * 0.9} ${w * 1.1},0`} fill={nails ?? light} stroke={line} strokeWidth={1} />}
			</g>
		);
	};
	const palm = (
		<g>
			<path d="M-24,0 C-30,14 -32,30 -30,46 L30,46 C32,30 30,12 24,0 Z" fill={base} stroke={line} strokeWidth={1.8} />
			<path d="M8,6 C20,14 26,28 28,44 L14,44 C14,30 12,18 8,6 Z" fill={shade} opacity={0.45} />
			<path d="M-12,30 Q0,34 12,28" stroke={shade} strokeWidth={1.4} fill="none" opacity={0.7} />
		</g>
	);
	let body: React.ReactNode;
	if (pose === 'fist' || pose === 'grip') {
		body = (
			<g>
				{palm}
				{/* curled fingers seen from the back: four knuckle rolls */}
				{[-21, -7, 7, 21].map((x, i) => (
					<g key={i}>
						<rect x={x - 7.5} y={40} width={15} height={pose === 'grip' ? 30 : 26} rx={7} fill={i % 2 ? base : light} stroke={line} strokeWidth={1.6} />
						<path d={`M${x - 5},${52} q5,3 10,0`} stroke={shade} strokeWidth={1.3} fill="none" />
						<circle cx={x} cy={43} r={3} fill={light} opacity={0.7} />
					</g>
				))}
				{/* thumb wrapping across */}
				<path d="M-30,28 C-36,46 -26,62 -6,64 C6,64 12,58 10,52 C-4,54 -16,48 -18,34 Z" fill={base} stroke={line} strokeWidth={1.8} />
				<path d="M-2,55 q6,-2 9,2" stroke={shade} strokeWidth={1.3} fill="none" />
				{nails !== undefined && <ellipse cx={4} cy={57} rx={5} ry={3.5} fill={nails} stroke={line} strokeWidth={0.8} />}
			</g>
		);
	} else {
		const conf: Record<string, number[]> = {open: [0, 0, 0, 0], relaxed: [0.35, 0.25, 0.3, 0.45], point: [0, 0.95, 0.95, 0.95], offer: [0.15, 0.1, 0.15, 0.25]};
		const c = conf[pose];
		body = (
			<g>
				{finger(-20, 34, 6.5, c[3], 'p')}
				{finger(-7, 44, 7, c[2], 'r')}
				{finger(7, 48, 7, c[1], 'm')}
				{finger(20, 42, 7, c[0], 'i')}
				{palm}
				{/* thumb */}
				<path d={pose === 'open' ? 'M24,10 C40,16 50,30 52,44 C52,50 46,52 42,46 C38,34 32,28 22,26 Z' : 'M24,12 C36,22 40,36 36,50 C34,56 28,56 26,50 C26,40 24,32 18,26 Z'} fill={base} stroke={line} strokeWidth={1.8} />
				<path d={pose === 'open' ? 'M38,32 q4,3 6,7' : 'M28,36 q3,4 3,8'} stroke={shade} strokeWidth={1.3} fill="none" />
			</g>
		);
	}
	return (
		<g transform={`scale(${s * -side} ${s})`}>
			{body}
			{rings && <rect x={8} y={58} width={14} height={5} rx={2} fill={C.gold} stroke={C.darkBronze} strokeWidth={1} />}
		</g>
	);
};

/** Bare foot, front view, origin at the heel/ground centre. side flips the big toe inward. */
export const Foot: React.FC<{skin: Skin; side: 1 | -1; s?: number; anklet?: boolean}> = ({skin, side, s = 1, anklet}) => (
	<g transform={`scale(${s * side} ${s})`}>
		<path d="M-22,-46 C-26,-26 -30,-10 -34,-2 C-34,4 -26,6 -16,6 L26,6 C34,6 36,0 32,-8 C26,-18 22,-32 20,-46 Z" fill={skin.base} stroke={skin.line} strokeWidth={1.6} />
		<path d="M6,-44 C10,-28 20,-14 30,-6 L32,4 L12,4 C14,-12 10,-30 6,-44 Z" fill={skin.shade} opacity={0.5} />
		{[-28, -16, -4, 8, 20].map((x, i) => (
			<g key={i}>
				<ellipse cx={x} cy={1} rx={i === 0 ? 7.5 : 5.5} ry={i === 0 ? 6 : 5} fill={skin.base} stroke={skin.line} strokeWidth={1.2} />
				<ellipse cx={x} cy={-1} rx={i === 0 ? 4 : 2.8} ry={2.2} fill={skin.light} opacity={0.7} />
			</g>
		))}
		<path d="M-16,-22 q10,6 22,2" stroke={skin.shade} strokeWidth={1.4} fill="none" opacity={0.7} />
		{anklet && (
			<g>
				<path d="M-24,-50 Q0,-40 22,-50" stroke={C.gold} strokeWidth={6} fill="none" />
				{[-18, -9, 0, 9, 17].map((x) => (
					<circle key={x} cx={x} cy={-42 + Math.abs(x) * 0.12} r={3.4} fill={C.paleGold} stroke={C.darkBronze} strokeWidth={1} />
				))}
			</g>
		)}
	</g>
);

/** A jewel: gold setting with a coloured stone and a highlight. */
export const Jewel: React.FC<{x: number; y: number; r?: number; stone?: string}> = ({x, y, r = 8, stone = C.red}) => (
	<g>
		<circle cx={x} cy={y} r={r} fill={C.gold} stroke={C.darkBronze} strokeWidth={Math.max(1, r * 0.18)} />
		<circle cx={x} cy={y} r={r * 0.62} fill={stone} />
		<circle cx={x - r * 0.22} cy={y - r * 0.24} r={r * 0.2} fill="#fff" opacity={0.75} />
	</g>
);

/** Row of beads along a smooth path through pts (necklaces, malas). */
export const Beads: React.FC<{pts: [number, number][]; n: number; r: number; fill: string; stroke?: string}> = ({pts, n, r, fill, stroke = C.darkBronze}) => {
	// sample a polyline approximation of the Catmull-Rom curve
	const P: [number, number][] = [];
	const p = [pts[0], ...pts, pts[pts.length - 1]];
	for (let i = 1; i < p.length - 2; i++)
		for (let k = 0; k < 12; k++) {
			const u = k / 12;
			const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
			P.push([f(p[i - 1][0], p[i][0], p[i + 1][0], p[i + 2][0]), f(p[i - 1][1], p[i][1], p[i + 1][1], p[i + 2][1])]);
		}
	P.push(pts[pts.length - 1]);
	const seg: number[] = [0];
	for (let i = 1; i < P.length; i++) seg.push(seg[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
	const L = seg[seg.length - 1];
	const at = (d: number): [number, number] => {
		let i = 1;
		while (i < seg.length - 1 && seg[i] < d) i++;
		const k = (d - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
		return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k];
	};
	return (
		<g>
			{Array.from({length: n}, (_, i) => {
				const [x, y] = at((L * (i + 0.5)) / n);
				return (
					<g key={i}>
						<circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={Math.max(0.8, r * 0.22)} />
						<circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.3} fill="#fff" opacity={0.45} />
					</g>
				);
			})}
		</g>
	);
};

/** Woven border along a path: a band with a repeating motif (zigzag + dots). */
export const Border: React.FC<{d: string; w: number; band: string; motif: string; dash?: number}> = ({d, w, band, motif, dash = 14}) => (
	<g>
		<path d={d} stroke={band} strokeWidth={w} fill="none" strokeLinecap="round" />
		<path d={d} stroke={motif} strokeWidth={w * 0.36} fill="none" strokeDasharray={`${dash * 0.45} ${dash * 0.55}`} strokeLinecap="round" />
		<path d={d} stroke={motif} strokeWidth={1.2} fill="none" opacity={0.6} transform={`translate(0 ${-w * 0.42})`} />
		<path d={d} stroke={motif} strokeWidth={1.2} fill="none" opacity={0.6} transform={`translate(0 ${w * 0.42})`} />
	</g>
);

/** Short fur strokes scattered along a path (tail, brow, jaw fringe, forearms). */
export const Fur: React.FC<{pts: [number, number][]; n: number; len: number; color: string; seed?: number; ang?: number; w?: number; opacity?: number}> = ({pts, n, len, color, seed = 1, ang = 0.6, w = 2, opacity = 0.7}) => {
	const r = rng(seed);
	const out: React.ReactNode[] = [];
	for (let i = 0; i < n; i++) {
		const k = (i + r() * 0.8) / n;
		const f = k * (pts.length - 1);
		const j = Math.min(pts.length - 2, Math.floor(f));
		const u = f - j;
		const x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u + (r() - 0.5) * len;
		const y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u + (r() - 0.5) * len;
		const a = Math.atan2(pts[j + 1][1] - pts[j][1], pts[j + 1][0] - pts[j][0]) + ang + (r() - 0.5) * 0.6;
		const l = len * (0.6 + r() * 0.6);
		out.push(<path key={i} d={`M${x.toFixed(1)},${y.toFixed(1)} q${(Math.cos(a) * l * 0.5).toFixed(1)},${(Math.sin(a) * l * 0.5 - 2).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)},${(Math.sin(a) * l).toFixed(1)}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />);
	}
	return <g opacity={opacity}>{out}</g>;
};

/** Pleated cloth fan (dhoti / saree front pleats). */
export const Pleats: React.FC<{x: number; y0: number; y1: number; w0: number; w1: number; n: number; fill: string; shade: string; sway?: number}> = ({x, y0, y1, w0, w1, n, fill, shade, sway = 0}) => (
	<g>
		{Array.from({length: n}, (_, i) => {
			const a0 = x - w0 / 2 + (w0 * i) / n;
			const a1 = x - w1 / 2 + (w1 * i) / n + sway;
			const b0 = a0 + w0 / n;
			const b1 = a1 + w1 / n;
			return (
				<g key={i}>
					<path d={`M${a0},${y0} L${b0},${y0} C${b0},${(y0 + y1) / 2} ${b1},${(y0 + y1) / 2} ${b1},${y1} L${a1},${y1} C${a1},${(y0 + y1) / 2} ${a0},${(y0 + y1) / 2} ${a0},${y0} Z`} fill={i % 2 ? fill : shade} />
					<path d={`M${b0},${y0} C${b0},${(y0 + y1) / 2} ${b1},${(y0 + y1) / 2} ${b1},${y1}`} stroke="#000" strokeWidth={1.2} opacity={0.25} fill="none" />
				</g>
			);
		})}
	</g>
);

export const outline = (pts: [number, number][], closed = true) => smoothPath(pts, closed);
