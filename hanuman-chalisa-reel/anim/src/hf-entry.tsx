// HyperFrames entry: exposes HanumanFilm.mount(el) and HanumanFilm.draw(seconds).
// The composition's GSAP timeline calls draw() on every seek, so each frame is a pure function of time.
import React from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
type Root = {render: (n: React.ReactNode) => void};
import {setFrame} from './hf-remotion-shim';
import {FPS} from './lib';
import {Main} from './Main';

let root: Root | null = null;
let last = -1;
(window as any).HanumanFilm = {
	mount(el: HTMLElement) {
		root = createRoot(el);
	},
	draw(t: number) {
		if (!root) return;
		const f = Math.round(t * FPS);
		if (f === last) return;
		last = f;
		setFrame(f);
		flushSync(() => root!.render(<Main hf />));
	},
};
