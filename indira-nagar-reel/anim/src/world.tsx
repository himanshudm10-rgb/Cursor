// Environment primitives: camera/parallax layers, sky, clouds, mountains,
// lightning, fire, smoke, particles, film texture. All share one painted style.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill} from 'remotion';
import {C, H, W, clamp, fbm, lerp, noise, rng} from './lib';

export type Cam = {x: number; y: number; zoom: number; rot: number};
const CamCtx = createContext<Cam>({x: 0, y: 0, zoom: 1, rot: 0});

/** A scene is one SVG; children are Layers at different depths. */
export const Scene: React.FC<{cam?: Partial<Cam>; children: React.ReactNode; bg?: string}> = ({cam, children, bg}) => {
	const c = {x: 0, y: 0, zoom: 1, rot: 0, ...cam};
	return (
		<AbsoluteFill style={{background: bg ?? C.ink}}>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
				<CamCtx.Provider value={c}>{children}</CamCtx.Provider>
			</svg>
		</AbsoluteFill>
	);
};

/** depth 0 = fixed to screen (sky), 1 = character plane, >1 = foreground. */
export const Layer: React.FC<{depth: number; children: React.ReactNode; opacity?: number}> = ({depth, children, opacity}) => {
	const cam = useContext(CamCtx);
	const z = Math.max(0.05, 1 + (cam.zoom - 1) * depth);
	const tr = `translate(${W / 2} ${H / 2}) rotate(${cam.rot * depth}) scale(${z}) translate(${-W / 2 - cam.x * depth} ${-H / 2 - cam.y * depth})`;
	return (
		<g transform={tr} opacity={opacity}>
			{children}
		</g>
	);
};

/** Global filter/gradient defs (referenced by url(#id) from every scene). */
export const Defs: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			{[2, 4, 8, 14, 24, 40, 70].map((b) => (
				<filter key={b} id={`b${b}`} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={b} />
				</filter>
			))}
			<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="10" result="g" />
				<feMerge>
					<feMergeNode in="g" />
					<feMergeNode in="g" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
			<filter id="paint" x="-5%" y="-5%" width="110%" height="110%">
				<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="4" result="n" />
				<feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" />
			</filter>
			<filter id="cloudy" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="4" seed="9" result="n" />
				<feDisplacementMap in="SourceGraphic" in2="n" scale="80" xChannelSelector="R" yChannelSelector="G" result="d" />
				<feGaussianBlur in="d" stdDeviation="6" />
			</filter>
		</defs>
	</svg>
);

// ------------------------------------------------------------------ sky
export const Sky: React.FC<{top: string; mid: string; bottom: string; glowX?: number; glowY?: number; glow?: string; glowR?: number}> = ({
	top,
	mid,
	bottom,
	glowX = 540,
	glowY = 1200,
	glow,
	glowR = 900,
}) => {
	const id = `sky${top}${mid}${bottom}`.replace(/#/g, '');
	return (
		<g>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={top} />
					<stop offset="0.55" stopColor={mid} />
					<stop offset="1" stopColor={bottom} />
				</linearGradient>
				{glow && (
					<radialGradient id={id + 'g'} cx={glowX} cy={glowY} r={glowR} gradientUnits="userSpaceOnUse">
						<stop offset="0" stopColor={glow} stopOpacity="0.85" />
						<stop offset="1" stopColor={glow} stopOpacity="0" />
					</radialGradient>
				)}
			</defs>
			<rect x={-2000} y={-3000} width={W + 4000} height={H + 6000} fill={`url(#${id})`} />
			{glow && <rect x={-2000} y={-3000} width={W + 4000} height={H + 6000} fill={`url(#${id}g)`} />}
		</g>
	);
};

// ------------------------------------------------------------------ clouds
type CloudProps = {
	t: number;
	seed: number;
	y: number;
	spread?: number;
	count?: number;
	size?: number;
	dark: string;
	light: string;
	drift?: number;
	lit?: number; // lightning illumination 0..1
	litColor?: string;
	opacity?: number;
	x0?: number;
	x1?: number;
};
/** Painted cloud bank: overlapping soft masses with a lit upper edge. */
export const Clouds: React.FC<CloudProps> = ({t, seed, y, spread = 300, count = 14, size = 260, dark, light, drift = 10, lit = 0, litColor = '#dfe8ff', opacity = 1, x0 = -400, x1 = W + 400}) => {
	const r = rng(seed);
	const blobs = Array.from({length: count}, (_, i) => {
		const bx = lerp(x0, x1, (i + r() * 0.8) / count);
		const by = y + (r() - 0.5) * spread;
		const s = size * (0.6 + r() * 0.8);
		const sp = drift * (0.6 + r() * 0.8);
		return {bx, by, s, sp, ph: r() * 10};
	});
	return (
		<g opacity={opacity}>
			<g filter="url(#cloudy)">
				{blobs.map((b, i) => {
					const x = b.bx + t * b.sp + Math.sin(t * 0.2 + b.ph) * 12;
					return <ellipse key={i} cx={x} cy={b.by} rx={b.s * 1.3} ry={b.s * 0.62} fill={dark} />;
				})}
				{blobs.map((b, i) => {
					const x = b.bx + t * b.sp + Math.sin(t * 0.2 + b.ph) * 12;
					return <ellipse key={'l' + i} cx={x - b.s * 0.15} cy={b.by - b.s * 0.32} rx={b.s * 0.85} ry={b.s * 0.3} fill={light} opacity={0.55} />;
				})}
			</g>
			{lit > 0.01 && (
				<g filter="url(#b40)" opacity={lit}>
					{blobs.map((b, i) => (
						<ellipse key={i} cx={b.bx + t * b.sp} cy={b.by} rx={b.s * 1.1} ry={b.s * 0.5} fill={litColor} opacity={0.7} />
					))}
				</g>
			)}
		</g>
	);
};

// ------------------------------------------------------------------ mountains
export type Peak = {x: number; h: number; w: number};

/** Ridge height at x: broad shape + jagged crags (painted, not smooth cones). */
export function ridgeY(x: number, seed: number, base: number, amp: number, freq = 0.004, peaks: Peak[] = []) {
	let yy = base - amp * (0.5 + 0.5 * fbm(x * freq, seed, 5)) - amp * 0.12 * fbm(x * 0.03, seed + 9, 3);
	for (const p of peaks) {
		const d = (x - p.x) / p.w;
		const shape = Math.exp(-Math.abs(d) * 1.9) * (1 - 0.18 * Math.abs(noise(x * 0.018, seed + 3)));
		yy -= p.h * shape + p.h * 0.07 * fbm(x * 0.045, seed + 5, 3) * shape;
	}
	return yy;
}

export const ridgePoints = (seed: number, base: number, amp: number, freq = 0.004, peaks: Peak[] = [], x0 = -800, x1 = W + 800) => {
	const pts: [number, number][] = [];
	for (let x = x0; x <= x1; x += 12) {
		pts.push([x, ridgeY(x, seed, base, amp, freq, peaks)]);
	}
	return pts;
};

export const Ridge: React.FC<{seed: number; base: number; amp: number; freq?: number; fill: string; fill2?: string; peaks?: Peak[]; rim?: string; rimW?: number; bottom?: number}> = ({
	seed,
	base,
	amp,
	freq,
	fill,
	fill2,
	peaks,
	rim,
	rimW = 3,
	bottom = H + 2000,
}) => {
	const pts = ridgePoints(seed, base, amp, freq, peaks);
	const top = Math.min(...pts.map((p) => p[1]));
	const id = `rg${seed}${fill}${fill2}`.replace(/#/g, '');
	const d = `M${pts[0][0]},${bottom} ` + pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1][0]},${bottom} Z`;
	return (
		<g>
			{fill2 && (
				<defs>
					<linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={base + 300}>
						<stop offset="0" stopColor={fill} />
						<stop offset="1" stopColor={fill2} />
					</linearGradient>
				</defs>
			)}
			<path d={d} fill={fill2 ? `url(#${id})` : fill} />
			{rim && <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={rim} strokeWidth={rimW} opacity={0.7} />}
		</g>
	);
};

/** A rocky crag (for a hero to stand on). Flat-ish top centre at (x, y). */
export const Crag: React.FC<{x: number; y: number; w: number; h: number; fill: string; rim?: string; seed?: number}> = ({x, y, w, h, fill, rim, seed = 3}) => {
	const r = rng(seed);
	// silhouette: a flat ledge that breaks into stepped, jagged shoulders and falls away
	const top: [number, number][] = [];
	const n = 40;
	for (let i = 0; i <= n; i++) {
		const u = i / n - 0.5;
		const a = Math.abs(u) * 2;
		const ledge = a < 0.16 ? 0 : Math.pow((a - 0.16) / 0.84, 1.3) * h * 1.6;
		const step = Math.floor(a * 5) * h * 0.08;
		const jag = a < 0.16 ? (r() - 0.5) * 4 : (r() - 0.5) * h * 0.18;
		top.push([x + u * w * 2, y + ledge + step + jag]);
	}
	const d = `M${x - w * 1.3},${y + h * 6} L${x - w * 1.1},${y + h * 2.2} ` + top.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${x + w * 1.1},${y + h * 2.2} L${x + w * 1.3},${y + h * 6} Z`;
	return (
		<g>
			<path d={d} fill={fill} />
			{/* painted planes */}
			<path d={`M${x - w * 0.15},${y + 4} L${x - w * 0.55},${y + h * 1.2} L${x - w * 0.2},${y + h * 3} L${x + w * 0.05},${y + h * 1.4} Z`} fill="#000" opacity={0.28} />
			<path d={`M${x + w * 0.2},${y + 6} L${x + w * 0.7},${y + h * 1.6} L${x + w * 0.4},${y + h * 3.4} Z`} fill="#000" opacity={0.2} />
			<path d={`M${x - w * 0.9},${y + h * 1.4} L${x - w * 0.6},${y + h * 1.1} L${x - w * 0.7},${y + h * 2.6} Z M${x + w * 0.75},${y + h * 1.3} L${x + w * 0.95},${y + h * 1.8} L${x + w * 0.82},${y + h * 3} Z`} fill="#fff" opacity={0.05} />
			{Array.from({length: 8}, (_, i) => {
				const cx = x - w * 0.8 + i * w * 0.23;
				return <path key={i} d={`M${cx},${y + h * (0.5 + (i % 3) * 0.3)} l${(i % 2 ? 1 : -1) * 22},${h * 0.6} l${(i % 2 ? -1 : 1) * 14},${h * 0.7}`} stroke="#000" strokeWidth={3} opacity={0.3} fill="none" />;
			})}
			{rim && <path d={top.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={rim} strokeWidth={3} opacity={0.75} />}
		</g>
	);
};

// ------------------------------------------------------------------ lightning
/** Midpoint-displacement bolt. Branches are generated only at the top level (nBranch=0 for sub-branches). */
export const boltPath = (seed: number, x0: number, y0: number, x1: number, y1: number, rough = 0.22, depth = 6, nBranch = 4): {main: string; branches: string[]} => {
	const r = rng(seed);
	let pts: [number, number][] = [
		[x0, y0],
		[x1, y1],
	];
	let disp = Math.hypot(x1 - x0, y1 - y0) * rough;
	for (let d = 0; d < depth; d++) {
		const np: [number, number][] = [pts[0]];
		for (let i = 1; i < pts.length; i++) {
			const [ax, ay] = pts[i - 1];
			const [bx, by] = pts[i];
			np.push([(ax + bx) / 2 + (r() - 0.5) * disp, (ay + by) / 2 + (r() - 0.5) * disp * 0.3]);
			np.push(pts[i]);
		}
		pts = np;
		disp *= 0.52;
	}
	const toD = (p: [number, number][]) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
	const branches: string[] = [];
	for (let b = 0; b < nBranch; b++) {
		const i = Math.floor(pts.length * (0.15 + r() * 0.55));
		const [sx, sy] = pts[i];
		const len = Math.hypot(x1 - x0, y1 - y0) * (0.15 + r() * 0.25);
		const ang = Math.atan2(y1 - y0, x1 - x0) + (r() - 0.5) * 1.6;
		const sub = boltPath(seed + 100 + b, sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len, 0.3, 4, 0);
		branches.push(sub.main);
	}
	return {main: toD(pts), branches};
};

export const Bolt: React.FC<{seed: number; x0: number; y0: number; x1: number; y1: number; v: number; color?: string; width?: number}> = ({seed, x0, y0, x1, y1, v, color = '#e9f0ff', width = 5}) => {
	if (v < 0.02) return null;
	const {main, branches} = boltPath(seed, x0, y0, x1, y1);
	return (
		<g opacity={clamp(v)}>
			<path d={main} stroke={color} strokeWidth={width * 6} fill="none" filter="url(#b24)" opacity={0.6} />
			{branches.map((b, i) => (
				<path key={i} d={b} stroke={color} strokeWidth={width * 0.45} fill="none" opacity={0.8} />
			))}
			<path d={main} stroke="#ffffff" strokeWidth={width} fill="none" strokeLinejoin="round" />
		</g>
	);
};

/** Sheet lightning crawling through clouds (no ground strike). */
export const CloudCrawl: React.FC<{seed: number; x: number; y: number; len: number; v: number; ang?: number}> = ({seed, x, y, len, v, ang = 0}) => {
	if (v < 0.02) return null;
	const {main, branches} = boltPath(seed, x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, 0.35, 6);
	return (
		<g opacity={v}>
			<path d={main} stroke="#cfe0ff" strokeWidth={22} fill="none" filter="url(#b14)" opacity={0.7} />
			<path d={main} stroke="#fff" strokeWidth={3} fill="none" />
			{branches.map((b, i) => (
				<path key={i} d={b} stroke="#eef3ff" strokeWidth={1.6} fill="none" />
			))}
		</g>
	);
};

// ------------------------------------------------------------------ fire & smoke
export const Fire: React.FC<{t: number; x: number; y: number; s?: number; seed?: number; glow?: number}> = ({t, x, y, s = 1, seed = 1, glow = 1}) => {
	const tongues = [
		{c: C.deepRed, w: 70, h: 150, o: 0},
		{c: '#b8471c', w: 56, h: 128, o: 1.3},
		{c: '#e08a2c', w: 40, h: 100, o: 2.1},
		{c: '#f5d58a', w: 22, h: 62, o: 3.7},
	];
	const sp = (pts: [number, number][]) => {
		// local smooth path (avoid import cycle)
		let d = `M${pts[0][0]},${pts[0][1]}`;
		const p = [pts[0], ...pts, pts[pts.length - 1]];
		for (let i = 1; i < p.length - 2; i++) {
			const [x0, y0] = p[i - 1];
			const [x1, y1] = p[i];
			const [x2, y2] = p[i + 1];
			const [x3, y3] = p[i + 2];
			d += ` C${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`;
		}
		return d;
	};
	return (
		<g transform={`translate(${x} ${y}) scale(${s})`}>
			<ellipse cx={0} cy={-40} rx={260 * glow} ry={200 * glow} fill="#e07a2c" opacity={0.22 + 0.05 * Math.sin(t * 17)} filter="url(#b40)" />
			{tongues.map((tg, i) => {
				const f = (k: number) => noise(t * 3.2 + k * 1.7 + tg.o, seed + i);
				const hh = tg.h * (1 + 0.18 * f(0));
				const pts: [number, number][] = [
					[-tg.w, 0],
					[-tg.w * 0.75, -hh * 0.35 + f(1) * 8],
					[-tg.w * 0.3 + f(2) * 14, -hh * 0.7],
					[f(3) * 22, -hh],
					[tg.w * 0.35 + f(4) * 14, -hh * 0.62],
					[tg.w * 0.8, -hh * 0.3 + f(5) * 8],
					[tg.w, 0],
				];
				return <path key={i} d={sp(pts) + ' Z'} fill={tg.c} opacity={0.95} />;
			})}
			{/* embers */}
			{Array.from({length: 10}, (_, i) => {
				const r = rng(seed * 31 + i);
				const life = (t * (0.5 + r() * 0.4) + r()) % 1;
				return <circle key={i} cx={(r() - 0.5) * 80 + Math.sin(t * 2 + i) * 20 * life} cy={-60 - life * 320} r={2.5 * (1 - life) + 0.5} fill="#ffcf7a" opacity={1 - life} />;
			})}
		</g>
	);
};

/** Soft, broad, curling smoke (many overlapping blurred puffs). */
export const Smoke: React.FC<{t: number; x: number; y: number; rise?: number; seed?: number; color?: string; count?: number; spread?: number; size?: number; opacity?: number}> = ({
	t,
	x,
	y,
	rise = 900,
	seed = 2,
	color = '#8d8a86',
	count = 16,
	spread = 1,
	size = 60,
	opacity = 0.5,
}) => (
	<g filter="url(#b40)" opacity={opacity}>
		{Array.from({length: count * 2}, (_, i) => {
			const r = rng(seed * 97 + i);
			const life = (t * 0.1 + i / (count * 2) + r() * 0.03) % 1;
			const curl = Math.sin(life * 4 + r() * 6) * 90 * life * spread + Math.sin(life * 11 + i) * 20 * life;
			const px = x + curl + life * 160 * spread * (r() - 0.3);
			const py = y - life * rise;
			return <ellipse key={i} cx={px} cy={py} rx={size * (0.5 + life * 3.2)} ry={size * (0.4 + life * 2.4)} fill={color} opacity={Math.sin(Math.PI * Math.min(1, life * 1.4)) * 0.35} />;
		})}
	</g>
);

// ------------------------------------------------------------------ particles
export const Dust: React.FC<{t: number; seed: number; count?: number; color?: string; vx?: number; vy?: number; size?: number; opacity?: number; area?: [number, number, number, number]}> = ({
	t,
	seed,
	count = 60,
	color = '#d9c9a8',
	vx = 30,
	vy = -6,
	size = 2.2,
	opacity = 0.6,
	area = [0, 0, W, H],
}) => {
	const [ax, ay, aw, ah] = area;
	return (
		<g opacity={opacity}>
			{Array.from({length: count}, (_, i) => {
				const r = rng(seed * 13 + i);
				const sp = 0.5 + r();
				const px = ax + ((((r() * aw + t * vx * sp) % aw) + aw) % aw);
				const py = ay + ((((r() * ah + t * vy * sp + Math.sin(t * 0.7 + i) * 10) % ah) + ah) % ah);
				const s = size * (0.5 + r() * 1.5);
				return <circle key={i} cx={px} cy={py} r={s} fill={color} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i))} />;
			})}
		</g>
	);
};

/** Big rolling ground dust band. (In a tracking scene, wrap it in translate(cam.x*depth) so it stays on screen.) */
export const DustBank: React.FC<{t: number; y: number; color?: string; opacity?: number; seed?: number; speed?: number; height?: number}> = ({t, y, color = '#a8916c', opacity = 0.6, seed = 5, speed = 20, height = 120}) => {
	const r = rng(seed);
	return (
		<g filter="url(#b24)" opacity={opacity}>
			{Array.from({length: 18}, (_, i) => {
				const bx = -300 + i * 100 + ((t * speed * (0.7 + r() * 0.6)) % 200);
				return <ellipse key={i} cx={bx} cy={y + (r() - 0.5) * height * 0.5} rx={140 + r() * 120} ry={height * (0.5 + r() * 0.5)} fill={color} />;
			})}
		</g>
	);
};

// ------------------------------------------------------------------ film finish
export const Finish: React.FC<{frame: number; vignette?: number}> = ({frame, vignette = 0.75}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<AbsoluteFill style={{background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`}} />
		<svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'overlay', opacity: 0.22}}>
			<filter id="grainf">
				<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 7} />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width={W} height={H} filter="url(#grainf)" />
		</svg>
		<svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'multiply', opacity: 0.16}}>
			<filter id="paperf">
				<feTurbulence type="fractalNoise" baseFrequency="0.018 0.04" numOctaves="4" seed="11" />
				<feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.66  0 0 0 0.9 0" />
			</filter>
			<rect width={W} height={H} filter="url(#paperf)" />
		</svg>
	</AbsoluteFill>
);

export const Flash: React.FC<{v: number; color?: string}> = ({v, color = '#dfe8ff'}) =>
	v > 0.01 ? <AbsoluteFill style={{background: color, opacity: v * 0.55, mixBlendMode: 'screen'}} /> : null;

export const Black: React.FC<{v: number}> = ({v}) => (v > 0.001 ? <AbsoluteFill style={{background: '#000', opacity: clamp(v)}} /> : null);
