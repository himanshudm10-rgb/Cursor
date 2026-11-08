// Subtitles from the voiceover's word timings, in an inscription-style serif (Cinzel).
// Medium-small, short phrases, the spoken word lit gold, above the reel UI zone.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {continueRender, delayRender} from 'remotion';
import {CINZEL_600} from './cinzelFont';
import raw from './words.json';
import {clamp} from './lib';

// Cinzel 600 embedded as a data URL; a fallback timer guarantees the frame is never blocked.
const fontFamily = 'CinzelLocal';
if (typeof document !== 'undefined' && !(window as unknown as {__cinzel?: boolean}).__cinzel) {
	(window as unknown as {__cinzel?: boolean}).__cinzel = true;
	const h = delayRender('cinzel', {timeoutInMilliseconds: 60000});
	let done = false;
	const finish = () => {
		if (!done) {
			done = true;
			continueRender(h);
		}
	};
	const ff = new FontFace(fontFamily, `url(${CINZEL_600}) format('woff2')`, {weight: '600'});
	ff.load()
		.then((f) => document.fonts.add(f))
		.catch(() => undefined)
		.finally(finish);
	setTimeout(finish, 8000);
}

type Word = {s: number; e: number; w: string};
const WORDS: Word[] = (raw as [number, number, string][]).map(([s, e, w]) => ({s, e, w: w.trim()}));

// phrases: break after punctuation, on pauses, or at 5 words
const PHRASES: Word[][] = [];
{
	let cur: Word[] = [];
	WORDS.forEach((w, i) => {
		cur.push(w);
		const next = WORDS[i + 1];
		const punct = /[.,?!]$/.test(w.w);
		const gap = next ? next.s - w.e > 0.3 : true;
		if (punct || gap || cur.length >= 5 || !next) {
			PHRASES.push(cur);
			cur = [];
		}
	});
}

export const Captions: React.FC<{T: number}> = ({T}) => {
	const idx = PHRASES.findIndex((p, i) => {
		const a = p[0].s - 0.08;
		const b = PHRASES[i + 1] ? Math.min(PHRASES[i + 1][0].s - 0.08, p[p.length - 1].e + 0.6) : p[p.length - 1].e + 0.6;
		return T >= a && T < b;
	});
	if (idx < 0) return null;
	const p = PHRASES[idx];
	const appear = clamp((T - (p[0].s - 0.08)) / 0.14);
	return (
		<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 1330}}>
			<div
				style={{
					maxWidth: 760,
					textAlign: 'center',
					fontFamily,
					fontWeight: 600,
					fontSize: 48,
					lineHeight: 1.3,
					letterSpacing: '0.04em',
					opacity: appear,
					transform: `translateY(${(1 - appear) * 8}px)`,
					textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 22px rgba(0,0,0,0.75)',
				}}
			>
				{p.map((w, i) => {
					const spoken = T >= w.s - 0.02;
					const active = T >= w.s - 0.02 && T < w.e + 0.05;
					return (
						<span key={i} style={{color: active ? '#e9c77e' : spoken ? '#f1e6cc' : 'rgba(241,230,204,0.55)', marginRight: i < p.length - 1 ? '0.32em' : 0}}>
							{w.w}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
