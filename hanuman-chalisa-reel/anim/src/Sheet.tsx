import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CharFX} from './characters';
import {Anjani, Hanuman, Ram, Ravan, RingHands, Sita} from './hanuman';
import {Defs} from './world';

export const Sheet: React.FC = () => (
	<AbsoluteFill style={{background: '#777'}}>
		<Defs />
		<svg width={2400} height={1400} viewBox="0 0 2400 1400">
			<g transform="translate(180 650) scale(0.55)"><CharFX rim="#ffd79a" dark={0.15}><Hanuman t={1} /></CharFX></g>
			<g transform="translate(480 650) scale(0.55)"><CharFX rim="#ffd79a" dark={0.15}><Hanuman t={1} pose="kneel" anjali={1} gada="none" tailFire={0} /></CharFX></g>
			<g transform="translate(800 650) scale(0.55)"><CharFX rim="#ffd79a" dark={0.15}><Hanuman t={1} rArm={150} rElbow={20} lArm={40} lElbow={-30} gadaGlow={1} tailFire={1} tailUp={1} legSpread={1} /></CharFX></g>
			<g transform="translate(1100 650) scale(0.55)"><CharFX rim="#ffd79a" dark={0.15}><Hanuman t={1} back /></CharFX></g>
			<g transform="translate(1380 650) scale(0.55)"><CharFX rim="#ffd79a" dark={0.15}><Sita t={1} reach={1} /></CharFX></g>
			<g transform="translate(1650 650) scale(0.55)"><CharFX rim="#ffd79a" dark={0.15}><Anjani t={1} /></CharFX></g>
			<g transform="translate(1950 650) scale(0.55)"><CharFX rim="#ffd79a" dark={0.15}><Ram t={1} /></CharFX></g>
			<g transform="translate(2250 650) scale(0.55)"><CharFX rim="#ffb070" dark={0.15}><Ravan t={1} point={1} /></CharFX></g>
			<g transform="translate(600 1100) scale(0.6)"><RingHands t={1} give={1} glow={1} /></g>
			<g transform="translate(1500 2850) scale(2.6)"><CharFX rim="#ffd79a" dark={0.1}><Hanuman t={1} /></CharFX></g><g transform="translate(2050 3500) scale(3.2)"><Sita t={1} bow={0.3} /></g>
		</svg>
	</AbsoluteFill>
);
