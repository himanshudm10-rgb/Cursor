import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CharFX} from './characters';
import {Arjuna, Drona, DronaFace, Karna, KarnaFace, Parashurama, Student} from './cast';
import {Defs} from './world';

// Character test sheet (frame selects the page).
export const Sheet: React.FC = () => {
	const f = useCurrentFrame();
	const t = 1;
	const fx = (n: React.ReactNode, x: number, y: number, s: number) => (
		<g transform={`translate(${x} ${y}) scale(${s})`}>
			<CharFX dark={0.15} rim="#ffd79a" rimDir={[-0.8, -0.4]} rimW={6}>
				{n}
			</CharFX>
		</g>
	);
	return (
		<AbsoluteFill style={{background: '#6a6a6a'}}>
			<Defs />
			<svg width={1080} height={1920}>
				{f === 0 && (
					<g>
						{fx(<Drona t={t} />, 270, 920, 0.8)}
						{fx(<Drona t={t} rArm={10} rElbow={6} lArm={40} lElbow={115} lHand="palm" stern={1} />, 800, 920, 0.8)}
						{fx(<Drona t={t} back />, 270, 1880, 0.8)}
						{fx(<Karna t={t} bow="hold" />, 800, 1880, 0.8)}
					</g>
				)}
				{f === 1 && (
					<g>
						{fx(<Karna t={t} bow="draw" pull={1} arrowGlow={1} />, 300, 920, 0.75)}
						{fx(<Karna t={t} disguise={1} kneel={1} rArm={30} rElbow={-140} lArm={30} lElbow={-140} rHand="palm" lHand="palm" />, 800, 920, 0.8)}
						{fx(<Parashurama t={t} />, 300, 1880, 0.75)}
						{fx(<Arjuna t={t} />, 800, 1880, 0.8)}
					</g>
				)}
				{f === 2 && (
					<g>
						{fx(<DronaFace t={t} stern={1} />, 540, 520, 0.8)}
						{fx(<KarnaFace t={t} />, 540, 1400, 0.8)}
					</g>
				)}
				{f === 3 && (
					<g>
						{fx(<Arjuna t={t} tapas oneLeg rArm={170} rElbow={0} lArm={170} lElbow={0} rHand="palm" lHand="palm" />, 300, 1000, 0.8)}
						{fx(<Student t={t} seed={3} />, 800, 1000, 0.9)}
						{fx(<Karna t={t} back bow="draw" pull={1} />, 300, 1880, 0.8)}
						{fx(<Parashurama t={t} rArm={40} rElbow={-130} lArm={70} lElbow={-150} lHand="palm" axeGlow={1} />, 800, 1880, 0.75)}
					</g>
				)}
			</svg>
		</AbsoluteFill>
	);
};
