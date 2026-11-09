// Shared timing, easing, noise and palette helpers.
export const FPS = 30;
export const W = 1080;
export const H = 1920;
// Total length = last spoken word + ~0.7 s to the cut to black + ~1 s of black. Set per project.
export const END_SEC = 60.66;
export const sec = (s: number) => Math.round(s * FPS);

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const inCubic = (t: number) => t * t * t;
export const sine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** 0..1 progress of t between a and b (seconds), eased. */
export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = sine) =>
	ease(clamp((t - a) / (b - a)));

/** Piecewise keyframes [[t, v], ...] with sine easing between keys. */
export const keys = (t: number, k: [number, number][], ease: (x: number) => number = sine) => {
	if (t <= k[0][0]) return k[0][1];
	for (let i = 1; i < k.length; i++) {
		if (t <= k[i][0]) {
			const [t0, v0] = k[i - 1];
			const [t1, v1] = k[i];
			return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
		}
	}
	return k[k.length - 1][1];
};

export const rng = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const hash = (i: number, seed: number) => {
	const r = rng(i * 374761393 + seed * 668265263);
	return r();
};
/** Smooth 1-D value noise in [-1, 1]. */
export const noise = (x: number, seed = 0) => {
	const i = Math.floor(x);
	const f = x - i;
	const u = f * f * (3 - 2 * f);
	return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1;
};
/** Fractal noise. */
export const fbm = (x: number, seed = 0, oct = 4) => {
	let v = 0;
	let amp = 0.5;
	let fr = 1;
	for (let o = 0; o < oct; o++) {
		v += amp * noise(x * fr, seed + o * 17);
		amp *= 0.5;
		fr *= 2.03;
	}
	return v;
};

/** Lightning flash envelope: sum of sharp decays with a flicker echo. */
export const flash = (t: number, at: number[], k = 9) => {
	let v = 0;
	for (const a of at) {
		if (t >= a) v += Math.exp(-(t - a) * k);
		if (t >= a + 0.09) v += 0.6 * Math.exp(-(t - a - 0.09) * k * 1.3);
	}
	return Math.min(1, v);
};

export const C = {
	ink: '#07090d',
	night: '#0b1220',
	deepBlue: '#14233d',
	blue: '#1f3a5f',
	steel: '#3e5573',
	storm: '#56677d',
	mist: '#9fb0c2',
	gold: '#b8934a',
	paleGold: '#e2c88a',
	bronze: '#8a5a2b',
	darkBronze: '#5c3a1c',
	red: '#6e1f1a',
	deepRed: '#4a1411',
	earth: '#4a3626',
	sand: '#a88a62',
	paper: '#e3d3b0',
	skin: '#8d5b3d',
	skinShade: '#5e3624',
	skinLight: '#b07a52',
	hair: '#0d0b0b',
	cream: '#e8dcc4',
	ash: '#cfc6b6',
	green: '#55623a',
	warmSky: '#e9b874',
};

/** Path through points using Catmull-Rom -> cubic beziers. */
export const smoothPath = (pts: [number, number][], closed = false) => {
	if (pts.length < 2) return '';
	const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
	let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
	for (let i = 1; i < p.length - 2; i++) {
		const [x0, y0] = p[i - 1];
		const [x1, y1] = p[i];
		const [x2, y2] = p[i + 1];
		const [x3, y3] = p[i + 2];
		const c1x = x1 + (x2 - x0) / 6;
		const c1y = y1 + (y2 - y0) / 6;
		const c2x = x2 - (x3 - x1) / 6;
		const c2y = y2 - (y3 - y1) / 6;
		d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
	}
	return closed ? d + ' Z' : d;
};
