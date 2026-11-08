// 33.05 - 38.80  "In the seventh mandala, Indra helps King Sudas defeat a group of ten tribes near the river Ravi."
// 38.80 - 40.80  "The hymns say he scattered the enemies..."
// 40.80 - 42.65  "...and protected Sudas' chariots."
// 42.65 - 45.90  "He acts like a divine general."  (hero shot)
import React from 'react';
import {CharFX, Chariot, Horse, Indra, Sudas, Warrior} from '../characters';
import {C, clamp, flash, keys, ramp, rng, smoothPath} from '../lib';
import {Bolt, CloudCrawl, Clouds, Crag, Dust, DustBank, Layer, Ridge, Scene, Sky} from '../world';
import {Hut} from './Vedic';

const TRIBE_COLORS = ['#7a2a20', '#5a4a2a', '#3a4a6a', '#6a5a3a', '#4a2a3a', '#5a6a4a', '#7a5a3a', '#3a3a4a', '#6a3a2a', '#4a5a5a'];

/** Tiny formation of units seen from high above (graphic battle map language). */
export const Formation: React.FC<{x: number; y: number; cols: number; rows: number; gap: number; color: string; banner?: string; t: number; seed: number; scatter?: (ux: number, uy: number) => [number, number, number]}> = ({x, y, cols, rows, gap, color, banner, t, seed, scatter}) => {
	const r = rng(seed);
	const units = [];
	for (let j = 0; j < rows; j++)
		for (let i = 0; i < cols; i++) {
			const ux = x + (i - cols / 2) * gap + (r() - 0.5) * 3;
			const uy = y + (j - rows / 2) * gap * 1.1 + Math.sin(t * 3 + i + j) * 0.8;
			const [dx, dy, rot] = scatter ? scatter(ux, uy) : [0, 0, 0];
			units.push(<rect key={`${i}-${j}`} x={-2.2} y={-5} width={4.4} height={10} rx={2} fill={color} transform={`translate(${ux + dx} ${uy + dy}) rotate(${rot})`} />);
		}
	return (
		<g>
			{units}
			{banner && (
				<g transform={`translate(${x} ${y - (rows / 2) * gap * 1.1 - 16})`}>
					<line x1={0} y1={0} x2={0} y2={-26} stroke="#120d09" strokeWidth={2} />
					<path d={`M0,-26 L${18 + Math.sin(t * 5 + seed) * 3},-22 L0,-15 Z`} fill={banner} />
				</g>
			)}
		</g>
	);
};

export const River: React.FC<{t: number; d: string; width: number; color?: string}> = ({t, d, width, color = '#7d93a6'}) => (
	<g>
		<path d={d} stroke="#3a4a58" strokeWidth={width + 18} fill="none" strokeLinecap="round" opacity={0.6} />
		<path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />
		<path d={d} stroke="#dbe6ee" strokeWidth={3} fill="none" strokeDasharray="40 90" strokeDashoffset={-t * 120} opacity={0.6} />
		<path d={d} stroke="#dbe6ee" strokeWidth={2} fill="none" strokeDasharray="20 140" strokeDashoffset={-t * 80 + 50} opacity={0.4} transform="translate(14 0)" />
	</g>
);

const RAVI = smoothPath([[640, 440], [600, 640], [700, 860], [540, 1100], [600, 1380], [460, 1700], [520, 2100]]);

export const Geography: React.FC<{t: number}> = ({t}) => {
	const adv = ramp(t, 0, 2.6);
	const darken = ramp(t, 0.5, 2.4) * 0.35;
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.25], [2.4, 1.1]]), y: keys(t, [[0, 120], [2.4, 0]])}} bg="#2a2a2e">
			<Layer depth={0.15}>
				<Sky top="#1a2030" mid="#5a5e6a" bottom="#a39478" />
				<Clouds t={t} seed={131} y={160} spread={200} count={10} size={260} dark="#2a3040" light="#7a8090" drift={14} />
			</Layer>
			<Layer depth={0.3}>
				<Ridge seed={132} base={470} amp={160} freq={0.004} fill="#3a3e4c" fill2="#6a6a70" />
			</Layer>
			<Layer depth={1}>
				<defs>
					<linearGradient id="plain" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#8a7a5c" />
						<stop offset="1" stopColor="#4a3a28" />
					</linearGradient>
				</defs>
				<rect x={-600} y={430} width={2300} height={2000} fill="url(#plain)" />
				{Array.from({length: 14}, (_, i) => (
					<path key={i} d={`M-200,${520 + i * 110} C300,${500 + i * 112} 700,${540 + i * 108} 1300,${510 + i * 114}`} stroke="#3a2e20" strokeWidth={1.5} opacity={0.25} fill="none" />
				))}
				<River t={t} d={RAVI} width={64} />
				{[[220, 700, 0.18], [260, 740, 0.22], [880, 620, 0.16], [920, 660, 0.2], [180, 1300, 0.3], [960, 1180, 0.28]].map(([x, y, s], i) => (
					<Hut key={i} x={x} y={y} s={s} tone="#4a3a28" />
				))}
				<Formation x={300 + adv * 90} y={1560 - adv * 200} cols={10} rows={5} gap={14} color="#1d1612" banner={C.gold} t={t} seed={1} />
				<Formation x={170 + adv * 90} y={1680 - adv * 180} cols={7} rows={4} gap={14} color="#1d1612" banner={C.gold} t={t} seed={2} />
				{TRIBE_COLORS.map((c, i) => (
					<Formation key={i} x={760 + (i % 3) * 110 - adv * 90} y={760 + Math.floor(i / 3) * 120 + adv * 120} cols={7} rows={4} gap={12} color="#1a1410" banner={c} t={t} seed={10 + i} />
				))}
			</Layer>
			<Layer depth={0}>
				<rect x={-100} y={-100} width={1300} height={2200} fill="#05070c" opacity={darken} />
			</Layer>
		</Scene>
	);
};

/** Side-on tracking charge. fast+storm = the "protected chariots" beat. */
export const SudasCharge: React.FC<{t: number; fast?: boolean; storm?: number}> = ({t, fast = false, storm = 0}) => {
	const speed = fast ? 900 : 520;
	const cx = t * speed;
	const lit = storm > 0 ? flash(t, [0.25, 0.85, 1.45], 8) : 0;
	return (
		<Scene cam={{x: cx, zoom: 1, y: 0}} bg="#2a2a30">
			<Layer depth={0}>
				<Sky top={storm ? '#0e121c' : '#20242e'} mid={storm ? '#2e3442' : '#5a5a62'} bottom={storm ? '#6a6458' : '#b0946a'} />
			</Layer>
			<Layer depth={0.08}>
				<Clouds t={t} seed={141} y={360} spread={360} count={16} size={320} dark={storm ? '#141a26' : '#2a3040'} light={storm ? '#4a5468' : '#7a7a84'} drift={0} lit={lit} x0={-400} x1={3000} />
				{storm > 0 && (
					<>
						<Bolt seed={142} x0={cx * 0.08 + 300} y0={-100} x1={cx * 0.08 + 220} y1={1180} v={flash(t, [0.25], 9)} width={5} />
						<Bolt seed={143} x0={cx * 0.08 + 900} y0={-100} x1={cx * 0.08 + 1000} y1={1200} v={flash(t, [0.85], 9)} width={5} />
						<Bolt seed={144} x0={cx * 0.08 + 1400} y0={-100} x1={cx * 0.08 + 1300} y1={1190} v={flash(t, [1.45], 9)} width={5} />
					</>
				)}
			</Layer>
			<Layer depth={0.25}>
				<Ridge seed={145} base={1150} amp={180} freq={0.004} fill="#3a3a44" fill2="#6a645c" />
			</Layer>
			<Layer depth={0.5}>
				<rect x={-2000} y={1140} width={8000} height={300} fill="#6a5a44" />
				<path d={`M-2000,1210 L8000,1210`} stroke="#8fa2b0" strokeWidth={40} opacity={0.7} />
				<g fill="#2a2420" style={{color: '#2a2420'}}>
					{Array.from({length: 60}, (_, i) => (
						<g key={i} transform={`translate(${i * 70 - 400} ${1180 + (i % 3) * 8}) scale(0.28 0.28)`}>
							<Warrior t={t} seed={i} shield={i % 2 === 0} facing={storm && i % 4 === 0 ? -1 : 1} />
						</g>
					))}
				</g>
				{storm > 0 && (
					<g transform={`translate(${cx * 0.5} 0)`}>
						<DustBank t={t} y={1190} color="#9a8668" opacity={0.6} seed={9} speed={40} height={90} />
					</g>
				)}
			</Layer>
			<Layer depth={1}>
				<rect x={-2000} y={1420} width={9000} height={800} fill="#3a2e22" />
				{[{dx: -560, dy: -60, s: 0.62, ph: 1.3}, {dx: -980, dy: -30, s: 0.55, ph: 2.1}].map((c, i) => (
					<g key={i} transform={`translate(${540 + cx + c.dx} ${1560 + c.dy}) scale(${c.s})`}>
						<CharFX dark={0.55} rim="#f0cf98" rimDir={[0.3, -1]} rimW={5}>
							<Chariot t={t} speed={fast ? 2.2 : 1.4} fill="#2a1e14" trim="#7a5430">
								<g transform="translate(300 -30)">
									<Horse t={t} gallop={1.2} phase={c.ph} fill="#2a1e16" />
								</g>
								<g transform="translate(380 -10)">
									<Horse t={t} gallop={1.2} phase={c.ph + 0.3} fill="#20160f" />
								</g>
								<g transform="translate(-6 -120) scale(0.95)" fill="#1a1410" style={{color: '#1a1410'}}>
									<g transform="scale(2.3)">
										<Warrior t={t} seed={70 + i} shield={false} />
									</g>
								</g>
							</Chariot>
						</CharFX>
					</g>
				))}
				<g transform={`translate(${470 + cx} 1640) scale(0.95)`}>
					<CharFX dark={0.2} rim="#ffd79a" rimA={0.95} rimDir={[0.4, -1]} rimW={6}>
						<Chariot t={t} speed={fast ? 2.2 : 1.4} fill="#3a2a1c" trim={C.gold}>
							<g transform="translate(320 -30)">
								<Horse t={t} gallop={1.2} phase={0.2} fill="#3a2a20" />
							</g>
							<g transform="translate(400 -10)">
								<Horse t={t} gallop={1.2} phase={0.5} fill="#2a1e16" />
							</g>
							<g transform="translate(-8 -120)">
								<Sudas t={t} wind={1.3} bowUp={keys(t, [[0, 0], [1.2, 1]])} />
							</g>
						</Chariot>
					</CharFX>
				</g>
				<g transform={`translate(${cx} 0)`}>
					<DustBank t={t} y={1650} color="#a48c66" opacity={0.65} seed={12} speed={-80} height={120} />
				</g>
			</Layer>
			<Layer depth={1.5}>
				<Dust t={t} seed={71} count={60} color="#e0c79a" vx={-260} vy={-10} size={2.6} opacity={0.6} area={[cx * 1.5 - 200, 1100, 1500, 900]} />
			</Layer>
		</Scene>
	);
};

export const Ridgewatch: React.FC<{t: number}> = ({t}) => {
	const raise = ramp(t, 0.9, 1.45);
	const crawl = ramp(t, 1.3, 1.6) * (1 - ramp(t, 1.75, 1.9) * 0.4);
	const lit = flash(t, [1.45], 4) * 0.8 + crawl * 0.3;
	const dark = ramp(t, 0, 1.4);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.0], [1.9, 1.12]]), x: keys(t, [[0, -40], [1.9, 30]])}} bg="#121620">
			<Layer depth={0.1}>
				<Sky top="#0a0d14" mid={dark > 0.5 ? '#1e2432' : '#2e3442'} bottom="#5a5448" />
			</Layer>
			<Layer depth={0.2}>
				<Clouds t={t} seed={151} y={380} spread={520} count={14} size={360} dark="#10141e" light="#3a4254" drift={18} lit={lit} />
				<CloudCrawl seed={152} x={700} y={540} len={1100} v={crawl} ang={Math.PI + 0.15} />
				<CloudCrawl seed={153} x={700} y={540} len={900} v={crawl * 0.9} ang={-0.35} />
				<CloudCrawl seed={154} x={700} y={540} len={800} v={crawl * 0.8} ang={Math.PI * 1.25} />
			</Layer>
			<Layer depth={0.45}>
				<rect x={-600} y={1150} width={2400} height={900} fill="#4a3e30" />
				<River t={t} d={smoothPath([[-200, 1300], [300, 1250], [600, 1330], [1300, 1280]])} width={40} />
				<Formation x={300} y={1420} cols={16} rows={5} gap={9} color="#1a1410" banner={C.gold} t={t} seed={3} />
				{TRIBE_COLORS.map((c, i) => (
					<Formation key={i} x={560 + (i % 5) * 110} y={1180 + Math.floor(i / 5) * 60} cols={7} rows={3} gap={8} color="#1a1410" banner={c} t={t} seed={30 + i} />
				))}
			</Layer>
			<Layer depth={1}>
				<Crag x={760} y={1560} w={700} h={260} fill="#0c0e14" rim={lit > 0.1 ? '#cfdcf5' : undefined} />
				<g transform="translate(760 1562) scale(0.42)">
					<CharFX dark={0.55 - lit * 0.3} rim="#dfe8ff" rimA={0.8} rimDir={[-0.4, -1]} rimW={8}>
						<Indra t={t} back wind={1.2} rArm={14 + raise * 140} rElbow={8 - raise * 20} vajraAng={70 - raise * 60} energy={raise * 0.8} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.5}>
				<Ridge seed={155} base={2050} amp={200} freq={0.006} fill="#05060a" />
			</Layer>
		</Scene>
	);
};

export const Scatter: React.FC<{t: number}> = ({t}) => {
	const strikes = [
		{at: 0.55, x: 620, y: 700},
		{at: 0.82, x: 820, y: 980},
		{at: 1.4, x: 560, y: 1040},
		{at: 1.7, x: 900, y: 620},
	];
	const scatter = (ux: number, uy: number): [number, number, number] => {
		let dx = 0;
		let dy = 0;
		let rot = 0;
		for (const s of strikes) {
			if (t < s.at) continue;
			const age = t - s.at;
			const vx = ux - s.x;
			const vy = uy - s.y;
			const d = Math.hypot(vx, vy) + 1;
			const k = Math.max(0, 1 - d / 420) * (1 - Math.exp(-age * 2.5)) * 180;
			dx += (vx / d) * k;
			dy += (vy / d) * k;
			rot += k * 1.5 * (ux % 2 ? 1 : -1);
		}
		return [dx, dy, rot];
	};
	const flashV = flash(t, strikes.map((s) => s.at), 8);
	return (
		<Scene cam={{zoom: keys(t, [[0, 1.3], [2.1, 1.05]]), rot: keys(t, [[0, -6], [2.1, 4]])}} bg="#3a3024">
			<Layer depth={1}>
				<rect x={-600} y={-600} width={2300} height={3200} fill="#5a4a36" />
				{Array.from({length: 30}, (_, i) => {
					const r = rng(500 + i);
					return <ellipse key={i} cx={r() * 1080} cy={r() * 1920} rx={60 + r() * 120} ry={30 + r() * 60} fill="#4a3c2c" opacity={0.5} />;
				})}
				<River t={t} d={smoothPath([[260, -300], [200, 500], [300, 1100], [180, 2200]])} width={110} />
				{TRIBE_COLORS.map((c, i) => (
					<Formation key={i} x={560 + (i % 3) * 170} y={520 + Math.floor(i / 3) * 170} cols={9} rows={5} gap={13} color="#1a1410" banner={c} t={t} seed={60 + i} scatter={scatter} />
				))}
				<Formation x={640} y={1520} cols={16} rows={6} gap={13} color="#2a1e12" banner={C.gold} t={t} seed={80} />
				<rect x={430} y={1460} width={420} height={2} fill={C.gold} opacity={0.6} />
				{strikes.map((s, i) => {
					const age = t - s.at;
					if (age < 0) return null;
					const v = Math.exp(-age * 6);
					const dust = clamp(age / 1.2);
					const r = rng(900 + i);
					return (
						<g key={i}>
							<circle cx={s.x} cy={s.y} r={60 + dust * 260} fill="#b8a07a" opacity={0.55 * (1 - dust)} filter="url(#b24)" />
							<circle cx={s.x} cy={s.y} r={130} fill="#eef3ff" opacity={v * 0.8} filter="url(#b40)" />
							{Array.from({length: 7}, (_, k) => {
								const a = (k / 7) * Math.PI * 2 + r();
								const L = 90 + r() * 140;
								return <path key={k} d={`M${s.x},${s.y} L${s.x + Math.cos(a) * L * 0.5 + (r() - 0.5) * 30},${s.y + Math.sin(a) * L * 0.5 + (r() - 0.5) * 30} L${s.x + Math.cos(a) * L},${s.y + Math.sin(a) * L}`} stroke="#ffffff" strokeWidth={3} fill="none" opacity={v} />;
							})}
							<path d={`M${s.x - 40},${s.y - 20} l30,10 l-6,22`} stroke="#1a120a" strokeWidth={4} fill="none" opacity={dust * 0.7} />
						</g>
					);
				})}
			</Layer>
			<Layer depth={0}>
				<rect x={-200} y={-200} width={1500} height={2400} fill="#dfe8ff" opacity={flashV * 0.18} />
				<ellipse cx={500 + t * 80} cy={700} rx={700} ry={500} fill="#0a0d14" opacity={0.35} filter="url(#b70)" />
			</Layer>
		</Scene>
	);
};

export const General: React.FC<{t: number}> = ({t}) => {
	const lit = flash(t, [0, 1.4, 2.6], 6);
	const crawl = flash(t, [0.6, 2.0], 3) * 0.9;
	const orbit = keys(t, [[0, -1], [3.3, 1]], (x) => x);
	const r = rng(77);
	const host = Array.from({length: 130}, () => ({x: -500 + r() * 2100, y: 1240 + r() * 300, ph: r() * 6}));
	return (
		<Scene cam={{x: orbit * 230, rot: orbit * 2.2, zoom: keys(t, [[0, 1.0], [3.3, 1.14]])}} bg="#0d121c">
			<Layer depth={0.08}>
				<Sky top="#070a12" mid="#26324a" bottom="#8c7c64" glow="#cfa86a" glowY={1250} glowR={800} />
			</Layer>
			<Layer depth={0.15}>
				<Clouds t={t} seed={161} y={300} spread={560} count={16} size={400} dark="#0d121c" light="#46526a" drift={20} lit={lit} />
				<Bolt seed={162} x0={180} y0={-300} x1={260} y1={1220} v={flash(t, [0], 7)} width={7} />
				<Bolt seed={163} x0={950} y0={-300} x1={860} y1={1240} v={flash(t, [1.4], 7)} width={6} />
				<Bolt seed={164} x0={420} y0={-300} x1={340} y1={1230} v={flash(t, [2.6], 7) * 0.8} width={5} />
				<CloudCrawl seed={165} x={-200} y={500} len={1500} v={crawl} ang={0.05} />
			</Layer>
			<Layer depth={0.35}>
				<Ridge seed={166} base={1240} amp={140} freq={0.003} fill="#2a3040" fill2="#5a5650" />
			</Layer>
			<Layer depth={0.55}>
				<rect x={-900} y={1220} width={2900} height={900} fill="#5a4a38" />
				<River t={t} d={smoothPath([[-800, 1300], [-100, 1260], [300, 1330], [700, 1270], [1200, 1340], [1900, 1290]])} width={46} />
				<g fill="#1a1410" style={{color: '#1a1410'}}>
					{host.map((h, i) => (
						<g key={i} transform={`translate(${h.x + Math.sin(t * 0.6 + h.ph) * 12 + t * (i % 2 ? 14 : -10)} ${h.y}) scale(${0.12 + (h.y - 1240) / 2400})`}>
							<Warrior t={t} seed={i} shield={i % 2 === 0} />
						</g>
					))}
				</g>
				<DustBank t={t} y={1300} color="#a08a68" opacity={0.4} seed={21} speed={24} height={60} />
			</Layer>
			<Layer depth={1}>
				<Crag x={540} y={1520} w={900} h={320} fill="#0b0d12" rim={lit > 0.15 ? '#dfe8ff' : '#7a6a54'} />
				<g transform="translate(150 1556) scale(0.5)">
					<CharFX dark={0.75 - lit * 0.3} rim="#dfe8ff" rimA={0.6 + lit * 0.4} rimDir={[0.3, -1]} rimW={6}>
						<Chariot t={0} fill="#20160e" trim={C.gold}>
							<g transform="translate(320 -30)">
								<Horse t={t} gallop={0.1} phase={0.4} fill="#20160e" rear={Math.max(0, Math.sin(t * 2.2)) * flash(t, [1.4], 2) * 0.6} />
							</g>
							<g transform="translate(400 -10)">
								<Horse t={t} gallop={0.08} phase={1.4} fill="#18100a" />
							</g>
						</Chariot>
					</CharFX>
				</g>
				<g transform="translate(560 1524) scale(0.78)">
					<CharFX dark={0.6 - lit * 0.4} rim="#e6eeff" rimA={0.7 + lit * 0.3} rimDir={[-0.2, -1]} rimW={8}>
						<Indra t={t} back wind={1.3} rArm={28} rElbow={-12} vajraAng={50} energy={0.25 + lit * 0.5} lArm={22} lElbow={-50} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.6}>
				<Ridge seed={167} base={2100} amp={260} freq={0.005} fill="#030407" />
				<Dust t={t} seed={81} count={60} color="#d8e0ee" vx={90} vy={-8} size={2.2} opacity={0.5} />
			</Layer>
		</Scene>
	);
};
