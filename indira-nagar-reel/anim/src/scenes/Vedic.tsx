// 14.70 - 18.30  "In the Rigveda, Indra is the most praised god."
// 18.30 - 20.70  "He is called the king of the gods."
import React from 'react';
import {CharFX, Chariot, Horse, Indra, Sage, Warrior} from '../characters';
import {flash, keys, ramp, rng} from '../lib';
import {Bolt, CloudCrawl, Clouds, Crag, Dust, Fire, Layer, Ridge, Scene, Sky, Smoke} from '../world';

export const Hut: React.FC<{x: number; y: number; s?: number; tone?: string}> = ({x, y, s = 1, tone = '#5a4430'}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<rect x={-50} y={-60} width={100} height={60} fill={tone} />
		<path d="M-70,-56 L0,-130 L70,-56 Z" fill="#3a2a1a" />
		<path d="M-70,-56 L0,-130" stroke="#7a6040" strokeWidth={3} />
		<rect x={-12} y={-40} width={24} height={40} fill="#1a120a" />
	</g>
);

export const Rigveda: React.FC<{t: number}> = ({t}) => {
	const camY = keys(t, [[0, 0], [1.2, -60], [3.6, -1500]]);
	const lit = flash(t, [2.85, 3.3], 7);
	const indraIn = ramp(t, 2.3, 3.0);
	const storm = ramp(t, 1.6, 3.2);
	const sages = [
		{x: 410, y: 1520, s: 0.22},
		{x: 680, y: 1520, s: 0.22},
		{x: 300, y: 1640, s: 0.3},
		{x: 790, y: 1640, s: 0.3},
	];
	return (
		<Scene cam={{y: camY, zoom: keys(t, [[0, 1.05], [3.6, 1.0]])}} bg="#18263c">
			<Layer depth={0.12}>
				<Sky top="#0e1626" mid="#3c4458" bottom="#d6a466" glow="#f0c27a" glowY={1250} glowR={700} />
			</Layer>
			{/* the far sacred mountain, crowned by storm and by the hero */}
			<Layer depth={0.6}>
				<Clouds t={t} seed={71} y={-80} spread={400} count={12} size={360} dark="#141c2a" light="#4b5870" drift={10} lit={lit} opacity={storm} />
				<Bolt seed={72} x0={860} y0={-700} x1={700} y1={240} v={flash(t, [2.85], 8) * 0.9} width={5} />
				<CloudCrawl seed={73} x={-80} y={60} len={1200} v={flash(t, [3.3], 5) * 0.8} ang={-0.08} />
				<Ridge seed={74} base={1000} amp={300} freq={0.003} peaks={[{x: 540, h: 780, w: 260}]} fill="#2a3346" fill2="#56607a" />
				<ellipse cx={540} cy={-300} rx={520} ry={700} fill="#c8d6f0" opacity={(0.12 + 0.5 * lit) * indraIn} filter="url(#b70)" />
				<g transform="translate(540 236) scale(1.0)" opacity={indraIn}>
					<CharFX dark={0.5 - lit * 0.3} rim="#eef3ff" rimA={0.7 + 0.3 * lit} rimDir={[0.6, -0.6]} rimW={10}>
						<Indra t={t} wind={1.2} rArm={18} rElbow={4} vajraAng={80} />
					</CharFX>
				</g>
				<Clouds t={t} seed={75} y={400} spread={120} count={10} size={260} dark="#1e2738" light="#5a6680" drift={-14} lit={lit * 0.6} opacity={storm * 0.9} />
			</Layer>
			<Layer depth={0.8}>
				<Ridge seed={76} base={1320} amp={160} freq={0.004} fill="#4a4048" fill2="#8a7466" />
			</Layer>
			<Layer depth={1}>
				<rect x={-600} y={1300} width={2400} height={1400} fill="#5a4632" />
				<path d="M-300,1380 C200,1340 600,1420 1400,1360 L1400,1420 C700,1470 200,1400 -300,1440 Z" fill="#8fa3b4" opacity={0.75} />
				<Hut x={110} y={1420} s={0.55} />
				<Hut x={200} y={1440} s={0.7} />
				<Hut x={960} y={1430} s={0.6} />
				<Smoke t={t} x={540} y={1560} rise={2800} seed={9} color="#8b8b92" count={22} size={50} spread={0.7} opacity={0.55} />
				<rect x={490} y={1560} width={100} height={26} fill="#6a4a2a" stroke="#3a2412" strokeWidth={3} />
				<Fire t={t} x={540} y={1566} s={0.55} seed={2} />
				{sages.map((s, i) => (
					<g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.s})`}>
						<CharFX dark={0.45} rim="#ffb35c" rimA={0.9} rimDir={[s.x < 540 ? 1 : -1, -0.3]} rimW={8}>
							<Sage t={t + i} pray={0.15 + 0.15 * Math.sin(t * 1.5 + i)} />
						</CharFX>
					</g>
				))}
				{/* smoke thickening into cloud at the hero's feet */}
				<Clouds t={t} seed={77} y={-420} spread={200} count={10} size={300} dark="#2a3142" light="#6a7488" drift={12} opacity={storm * 0.9} lit={lit * 0.5} />
			</Layer>
			<Layer depth={1.3}>
				<Dust t={t} seed={31} count={50} color="#ffd59a" vx={14} vy={-30} size={2} opacity={0.5} area={[0, 900, 1080, 1100]} />
			</Layer>
		</Scene>
	);
};

export const King: React.FC<{t: number}> = ({t}) => {
	const lit = flash(t, [0, 1.6], 6) * 0.8;
	const crowd = Array.from({length: 46}, (_, i) => {
		const r = rng(400 + i);
		return {x: -100 + r() * 1300, y: 1560 + r() * 330, kind: r(), seed: i};
	}).sort((a, b) => a.y - b.y);
	return (
		<Scene cam={{y: keys(t, [[0, 640], [2.6, -60]]), zoom: keys(t, [[0, 1.0], [2.6, 1.42]])}} bg="#121a28">
			<Layer depth={0.1}>
				<Sky top="#0c1320" mid="#3a4560" bottom="#c9965a" glow="#f2c27a" glowY={700} glowR={800} />
			</Layer>
			<Layer depth={0.25}>
				<g opacity={0.35} filter="url(#b14)">
					{[-38, -22, -8, 8, 22, 38].map((a, i) => (
						<path key={i} d={`M540,640 L${540 + Math.tan((a * Math.PI) / 180) * 2400 - 60},-1800 L${540 + Math.tan((a * Math.PI) / 180) * 2400 + 60},-1800 Z`} fill="#f5d59a" opacity={0.5 + 0.3 * Math.sin(t * 1.5 + i)} />
					))}
				</g>
				<Clouds t={t} seed={81} y={240} spread={380} count={12} size={340} dark="#1a2232" light="#6a7488" drift={12} lit={lit} />
			</Layer>
			<Layer depth={0.5}>
				<Ridge seed={82} base={1500} amp={300} freq={0.003} fill="#2c3446" fill2="#6a6672" />
			</Layer>
			<Layer depth={0.85}>
				<Ridge seed={83} base={1700} amp={200} freq={0.002} peaks={[{x: 540, h: 900, w: 330}]} fill="#1a1f2a" fill2="#3a3a44" rim="#e9c68a" rimW={3} />
				<Crag x={540} y={782} w={300} h={140} fill="#141820" rim="#f0cf90" />
				<g transform="translate(540 784) scale(0.5)">
					<CharFX dark={0.3 - lit * 0.2} rim="#ffe0a6" rimA={0.95} rimDir={[0, -1]} rimW={8}>
						<Indra t={t} wind={0.9} rArm={12} rElbow={6} vajraAng={78} lArm={26} lElbow={-60} head={-3} />
					</CharFX>
				</g>
			</Layer>
			<Layer depth={1.15}>
				<rect x={-600} y={1520} width={2400} height={1400} fill="#2a241e" />
				{crowd.map((c, i) => (
					<g key={i} transform={`translate(${c.x} ${c.y}) scale(${0.32 + (c.y - 1560) / 1600})`} fill="#100c09" style={{color: '#100c09'}}>
						{c.kind < 0.12 ? (
							<g transform="scale(0.5)">
								<Horse t={t} gallop={0.05} phase={i} fill="#100c09" mane="#000" />
							</g>
						) : c.kind < 0.18 ? (
							<g transform="scale(0.45)">
								<Chariot t={0} fill="#100c09" trim="#5a4026" />
							</g>
						) : c.kind < 0.3 ? (
							<g transform="scale(0.28)">
								<CharFX dark={0.85} rim="#e9c68a" rimDir={[0, -1]}>
									<Sage t={t + i} pray={0.4 + 0.3 * Math.sin(t + i)} />
								</CharFX>
							</g>
						) : (
							<Warrior t={t} seed={i} shield={c.kind > 0.6} />
						)}
					</g>
				))}
			</Layer>
			<Layer depth={1.4}>
				<Dust t={t} seed={33} count={40} color="#f2d29a" vx={20} vy={-6} size={2} opacity={0.4} area={[0, 1200, 1080, 800]} />
			</Layer>
		</Scene>
	);
};
