// 8.92 - 12.30  "But that is not the real Indra of the Vedas."
// The dark frame splits open; the hero on the storm mountain; he lifts the weapon and the sky answers.
import React from 'react';
import {flash, keys, ramp} from '../lib';
import {MountainWorld} from './MountainWorld';

export const Reveal: React.FC<{t: number}> = ({t}) => {
	const lit = flash(t, [0, 1.78, 2.68], 8);
	const raise = ramp(t, 1.45, 2.3);
	return (
		<MountainWorld
			t={t}
			cam={{zoom: keys(t, [[0, 0.92], [3.6, 2.35]], (x) => x * x * (3 - 2 * x)), y: keys(t, [[0, 60], [3.6, -10]])}}
			pose={{
				rArm: 14 + raise * 52,
				rElbow: 8 - raise * 58,
				vajraAng: 70 - raise * 40,
				lArm: 24,
				lElbow: -58,
				wind: keys(t, [[0, 0.7], [1.5, 1.1], [3.5, 1.35]]),
				energy: ramp(t, 2.1, 2.8) * 0.55,
				head: -2 * raise,
			}}
			lit={lit}
			bolts={[
				{seed: 21, v: flash(t, [0], 7), x0: 800, x1: 860},
				{seed: 22, v: flash(t, [1.78], 9), x0: 220, x1: 150},
				{seed: 23, v: flash(t, [2.68], 9) * 0.8, x0: 900, x1: 980},
			]}
			crawl={flash(t, [2.35, 2.55], 4) * 0.9}
		/>
	);
};
