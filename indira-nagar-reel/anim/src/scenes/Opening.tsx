// 0.00 - 8.92  "Indra is lustful, insecure, and arrogant. ... loses his power."
// The popular, diminished image. Frame 0 already shows the hero (never open on black in a reel):
// a seated figure on a throne that cracks; the storm dies; the figure sinks into silhouette.
import React from 'react';
import {CharFX, Indra, Throne} from '../characters';
import {C, flash, keys, ramp} from '../lib';
import {Bolt, Clouds, Dust, Layer, Scene, Sky} from '../world';

export const Opening: React.FC<{t: number}> = ({t: raw}) => {
	const t = Math.min(raw, 8.1); // everything stops at 8.1 s
	const crack = ramp(t, 2.0, 3.6);
	const zoom = keys(t, [[0, 1.12], [4.1, 1.3], [8.1, 0.62]]);
	const camY = keys(t, [[0, 60], [4.1, 0], [8.1, -80]]);
	const fl = flash(t, [4.55, 5.5, 6.6], 7) * keys(t, [[4, 1], [5.4, 0.55], [6.6, 0.25], [7.5, 0]]);
	const storm = keys(t, [[0, 0.6], [4.2, 1], [7.6, 0]]);
	const throneFade = keys(t, [[0, 1], [5.6, 1], [8.0, 0.08]]);
	const lightShaft = keys(t, [[0, 0.9], [4.1, 0.7], [7.5, 0.05]]);
	const shadow = 0.5 + 0.5 * Math.sin(t * 1.3);
	const fade = keys(raw, [[0, 1], [8.1, 1], [8.45, 0]]);
	return (
		<div style={{position: 'absolute', inset: 0, opacity: fade, background: '#030406'}}>
			<Scene cam={{zoom, y: camY}} bg="#030406">
				<Layer depth={0.4}>
					<defs>
						<clipPath id="archClip">
							<path d="M300,1500 L300,700 C300,380 780,380 780,700 L780,1500 Z" />
						</clipPath>
					</defs>
					<g clipPath="url(#archClip)" opacity={storm}>
						<Sky top="#0a0f18" mid="#1c2636" bottom="#323e50" />
						<Clouds t={t} seed={41} y={760} spread={200} count={8} size={220} dark="#121925" light="#3a475a" drift={-12} lit={fl} />
						<Bolt seed={4} x0={480} y0={380} x1={620} y1={1300} v={fl * 0.9} width={4} />
					</g>
					<path d="M300,1500 L300,700 C300,380 780,380 780,700 L780,1500" stroke="#2d3038" strokeWidth={22} fill="none" opacity={throneFade} />
				</Layer>
				<Layer depth={0.7}>
					<path d="M470,-200 L610,-200 L760,1900 L330,1900 Z" fill="#9fb3d0" opacity={0.07 * lightShaft} filter="url(#b40)" />
				</Layer>
				<Layer depth={1}>
					<g transform="translate(540 1640) scale(0.95)" opacity={throneFade}>
						<Throne crack={crack} />
						{crack > 0.05 && (
							<g stroke="#9fb3d0" strokeWidth={3} opacity={crack * 0.8 * throneFade}>
								<path d="M0,-1260 L-30,-900 L-10,-560 L-20,-470" fill="none" />
								<path d="M-200,-860 L-30,-900 L200,-860" fill="none" />
							</g>
						)}
						<g transform="translate(0 -90)">
							<CharFX dark={keys(t, [[0, 0.55], [3.5, 0.7], [7.5, 0.93]])} rim="#b8cae6" rimA={0.9} rimDir={[-0.7, -0.6]} rimW={6}>
								<Indra t={t} seated rArm={18} rElbow={-46} lArm={34} lElbow={-6} vajraAng={10} wind={0.08} head={7} shadowFace={0.35 + 0.3 * shadow} />
							</CharFX>
						</g>
					</g>
					<rect x={-300 + ((t * 160) % 1600)} y={600} width={260} height={700} fill="#000" opacity={0.45} filter="url(#b40)" />
				</Layer>
				<Layer depth={1.2}>
					<Dust t={t} seed={8} count={40} color="#8796ad" vx={6} vy={10} size={1.6} opacity={0.35 * lightShaft} area={[300, 300, 500, 1500]} />
				</Layer>
			</Scene>
			<div style={{position: 'absolute', inset: 0, background: C.ink, opacity: keys(t, [[6.8, 0], [8.1, 0.55]])}} />
		</div>
	);
};
