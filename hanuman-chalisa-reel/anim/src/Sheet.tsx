import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CharFX} from './characters';
import {Akshay, Anjani, Rakshasa, Ram, Ravan, RingHands, Sita, Tulsidas} from './hanuman';
import {Defs} from './world';

export const Sheet: React.FC = () => (
	<AbsoluteFill style={{background: '#777'}}>
		<Defs />
		<svg width={2400} height={1400} viewBox="0 0 2400 1400">
			<g transform="translate(170 760) scale(0.62)"><CharFX rim="#ffd79a" dark={0.08}><Sita t={1} bow={0.3} reach={1} /></CharFX></g>
			<g transform="translate(470 760) scale(0.62)"><CharFX rim="#ffd79a" dark={0.08}><Anjani t={1} /></CharFX></g>
			<g transform="translate(830 760) scale(0.62)"><CharFX rim="#ffd79a" dark={0.08}><Ram t={1} /></CharFX></g>
			<g transform="translate(1250 760) scale(0.62)"><CharFX rim="#ffb070" dark={0.08}><Ravan t={1} point={1} /></CharFX></g>
			<g transform="translate(1700 760) scale(0.62)"><CharFX rim="#ffd79a" dark={0.08}><Tulsidas t={1} write={1} /></CharFX></g>
			<g transform="translate(2000 760) scale(0.62)"><CharFX rim="#ffd79a" dark={0.08}><Rakshasa t={1} /></CharFX></g>
			<g transform="translate(2250 760) scale(0.8)"><CharFX rim="#ffd79a" dark={0.08}><Akshay t={1} /></CharFX></g>
			<g transform="translate(700 1120) scale(0.5)"><RingHands t={1} give={1} glow={1} /></g>
			<g transform="translate(1250 1880) scale(1.6)"><CharFX rim="#ffb070" dark={0.05}><Ravan t={1} /></CharFX></g>
			<g transform="translate(1950 1700) scale(1.6)"><CharFX rim="#ffd79a" dark={0.05}><Sita t={1} bow={0.2} /></CharFX></g>
		</svg>
	</AbsoluteFill>
);
