// Subtitles from the voiceover's word timings, in an inscription-style serif (Cinzel).
// Medium-small, short phrases, the spoken word lit gold, above the reel UI zone.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import raw from './words.json';
import {clamp} from './lib';

// Cinzel 600, embedded as base64 (headless Chrome can't reach Google Fonts through the sandbox proxy,
// and fetching it per render tab under load timed out). No delayRender: background render tabs throttle timers/promises.
import {CINZEL_WOFF2_B64} from './cinzelFont';
const fontFamily = 'CinzelLocal';
if (typeof document !== 'undefined' && !document.getElementById('cinzel-face')) {
	// inline @font-face: the data URI decodes locally, no network involved
	const st = document.createElement('style');
	st.id = 'cinzel-face';
	st.textContent = `@font-face{font-family:'${fontFamily}';font-weight:600;font-style:normal;font-display:block;src:url(data:font/woff2;base64,${CINZEL_WOFF2_B64}) format('woff2');}`;
	document.head.appendChild(st);
}

// Instagram Reels safe zone (1080x1920): keep clear of the top ~220 px, the bottom ~420 px (caption/audio row)
// and the right-hand action column (~140 px). Text block: x 130..890, top y 1240, max two lines -> ends by ~1370.
const SAFE = {top: 1240, centerX: 510, maxWidth: 760};

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
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					top: SAFE.top,
					left: SAFE.centerX - SAFE.maxWidth / 2,
					width: SAFE.maxWidth,
					textAlign: 'center',
					fontFamily,
					fontWeight: 600,
					fontSize: 48,
					lineHeight: 1.3,
					letterSpacing: '0.04em',
					opacity: appear,
					transform: `translateY(${(1 - appear) * 8}px)`,
					textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 18px rgba(0,0,0,0.8), 0 0 36px rgba(0,0,0,0.55)',
				}}
			>
				{p.map((w, i) => {
					const spoken = T >= w.s - 0.02;
					const active = T >= w.s - 0.02 && T < w.e + 0.05;
					return (
						<span key={i} style={{display: 'inline-block', color: active ? '#e9c77e' : spoken ? '#f1e6cc' : 'rgba(241,230,204,0.55)', margin: '0 0.16em'}}>
							{w.w}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
