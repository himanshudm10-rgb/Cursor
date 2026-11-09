// Minimal stand-in for the few `remotion` APIs the scenes use, so the same scene code runs inside a
// HyperFrames composition (bundled by hf/build.mjs with `remotion` aliased to this file).
import React from 'react';

let FRAME = 0;
export const setFrame = (f: number) => {
	FRAME = f;
};
export const useCurrentFrame = () => FRAME;
export const AbsoluteFill: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; className?: string}> = ({style, children, className}) => (
	<div className={className} style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ...style}}>
		{children}
	</div>
);
export const Audio: React.FC<{src: string}> = () => null;
export const staticFile = (p: string) => `assets/${p}`;
export const delayRender = (_label?: string, _opts?: unknown) => 0;
export const continueRender = (_h: number) => undefined;
export const Composition: React.FC<Record<string, unknown>> = () => null;
