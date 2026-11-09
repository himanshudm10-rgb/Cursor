// Shared props for the Hanuman film: palette, the gada, tapered ribbons.
import React from 'react';
import {C} from './lib';

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
