// The storm mountain where the hero is revealed and, at the end, left alone (bookend scene).
import React from 'react';
import {CharFX, Indra, IndraPose} from '../characters';
import {C, lerp} from '../lib';
import {Bolt, Cam, CloudCrawl, Clouds, Crag, Dust, Layer, Ridge, Scene, Sky} from '../world';

type Props = {
	t: number;
	cam: Partial<Cam>;
	pose: Omit<IndraPose, 't'>;
	lit: number; // lightning illumination 0..1
	bolts: {seed: number; v: number; x0: number; x1: number}[];
	crawl?: number;
	dark?: number; // 0 = reveal palette, 1 = the final near-dark palette
	faceLit?: number;
};

export const MountainWorld: React.FC<Props> = ({t, cam, pose, lit, bolts, crawl = 0, dark = 0, faceLit = 0}) => {
	const mix = (a: string, b: string) => (dark > 0.5 ? b : a);
	const skyTop = mix('#0e1726', '#04060b');
	const skyMid = mix('#2a3d57', '#0b1220');
	const skyBot = mix('#7d8aa0', '#1a2433');
	const cloudDark = mix('#1b2534', '#070a10');
	const cloudLight = mix('#56657c', '#1a2333');
	const ridgeFar = mix('#3a4a60', '#111a26');
	const ridgeMid = mix('#243246', '#0b121c');
	const rock = mix('#151c27', '#06090e');
	const rim = mix('#d6e2ff', '#9fb5d8');
	return (
		<Scene cam={cam} bg={skyTop}>
			<Layer depth={0.08}>
				<Sky top={skyTop} mid={skyMid} bottom={skyBot} glow={mix('#a7b6cc', '#2a3a52')} glowY={1250} glowR={1000} />
			</Layer>
			<Layer depth={0.15}>
				<Clouds t={t} seed={11} y={250} spread={420} count={12} size={380} dark={cloudDark} light={cloudLight} drift={14} lit={lit} />
				{bolts.map((b) => (
					<Bolt key={b.seed} seed={b.seed} x0={b.x0} y0={-200} x1={b.x1} y1={1300} v={b.v} width={6} />
				))}
				<CloudCrawl seed={77} x={-100} y={420} len={1300} v={crawl} ang={0.12} />
				<CloudCrawl seed={78} x={1200} y={150} len={900} v={crawl * 0.8} ang={Math.PI - 0.2} />
			</Layer>
			<Layer depth={0.3}>
				<Clouds t={t} seed={12} y={760} spread={260} count={10} size={300} dark={mix('#2b3a50', '#0a0f18')} light={mix('#6f7f96', '#1e2a3c')} drift={22} lit={lit * 0.7} opacity={0.85} />
				<Ridge seed={2} base={1330} amp={260} freq={0.003} fill={ridgeFar} fill2={mix('#5d6c82', '#16202e')} rim={lit > 0.2 ? '#cfdcf5' : undefined} />
			</Layer>
			<Layer depth={0.55}>
				<Ridge seed={5} base={1500} amp={300} freq={0.0035} fill={ridgeMid} fill2={mix('#3d4c62', '#0f1722')} />
				<Clouds t={t} seed={14} y={1380} spread={120} count={9} size={200} dark={mix('#4a5870', '#111a26')} light={mix('#8695ab', '#26334a')} drift={30} opacity={0.55} />
			</Layer>
			<Layer depth={1}>
				<Crag x={540} y={1000} w={760} h={320} fill={rock} rim={lerp(0, 1, lit) > 0.15 ? rim : undefined} />
				<g transform="translate(540 1002) scale(0.2)">
					<CharFX dark={dark > 0.5 ? 0.92 - faceLit * 0.6 : 0.55 - lit * 0.4} rim={rim} rimA={0.6 + lit * 0.4} rimDir={[0.8, -0.5]} rimW={10}>
						<Indra t={t} {...pose} />
					</CharFX>
				</g>
				<Dust t={t} seed={3} count={50} color={mix('#c9d2e0', '#5a6a82')} vx={60} vy={-4} size={2} opacity={0.5} area={[-200, 700, 1480, 900]} />
			</Layer>
			<Layer depth={1.6}>
				<Ridge seed={9} base={2150} amp={260} freq={0.006} fill={C.ink} />
			</Layer>
		</Scene>
	);
};
