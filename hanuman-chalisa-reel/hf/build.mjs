// Bundles the scene code (anim/src) into hf/film/assets/film.js for the HyperFrames composition,
// and writes the subtitle clips into hf/film/index.html from anim/src/words.json.
import {build} from 'esbuild';
import fs from 'fs';
import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
const anim = path.resolve(here, '../anim');
await build({
	entryPoints: [path.join(anim, 'src/hf-entry.tsx')],
	bundle: true,
	format: 'iife',
	minify: true,
	jsx: 'automatic',
	outfile: path.join(here, 'film/assets/film.js'),
	alias: {remotion: path.join(anim, 'src/hf-remotion-shim.tsx')},
	nodePaths: [path.join(anim, 'node_modules')],
	define: {'process.env.NODE_ENV': '"production"'},
	logLevel: 'warning',
});
console.log('bundled film.js', (fs.statSync(path.join(here, 'film/assets/film.js')).size / 1024).toFixed(0), 'KB');

// ---------------------------------------------------------------- composition (index.html)
const END = 60.66; // last word 58.86 + 0.7 s to black + ~1.1 s
const words = JSON.parse(fs.readFileSync(path.join(anim, 'src/words.json'), 'utf8')).map(([s, e, w]) => ({s, e, w: w.trim()}));
const phrases = [];
{
	let cur = [];
	words.forEach((w, i) => {
		cur.push(w);
		const next = words[i + 1];
		if (/[.,?!]$/.test(w.w) || (next ? next.s - w.e > 0.3 : true) || cur.length >= 5 || !next) {
			phrases.push(cur);
			cur = [];
		}
	});
}
const r2 = (x) => Math.round(x * 1000) / 1000;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let capHtml = '';
let capJs = '';
phrases.forEach((p, i) => {
	const a = p[0].s - 0.08;
	const b = phrases[i + 1] ? Math.min(phrases[i + 1][0].s - 0.08, p[p.length - 1].e + 0.6) : p[p.length - 1].e + 0.6;
	capHtml += `      <div id="cap${i}" class="clip cap" data-start="${r2(a)}" data-duration="${r2(b - a)}" data-track-index="2">${p.map((w, j) => `<span id="w${i}_${j}">${esc(w.w)}</span>`).join(' ')}</div>\n`;
	capJs += `      tl.fromTo("#cap${i}", {opacity: 0, y: 8}, {opacity: 1, y: 0, duration: 0.14, ease: "power1.out"}, ${r2(a)});\n`;
	p.forEach((w, j) => {
		capJs += `      tl.set("#w${i}_${j}", {color: GOLD}, ${r2(w.s - 0.02)}); tl.set("#w${i}_${j}", {color: SPOKEN}, ${r2(w.e + 0.05)});\n`;
	});
});
const html = `<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Hanuman Chalisa Part 2</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Cinzel"; font-weight: 600; font-style: normal; font-display: block; src: url("assets/Cinzel-600.woff2") format("woff2"); }
      :root { --ground: #000; --ink: #f1e6cc; --font-display: "Cinzel", serif; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: var(--ground); }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--ground); }
      #stage { position: absolute; inset: 0; width: 1080px; height: 1920px; overflow: hidden; }
      /* Subtitles: Cinzel 600 48px, inside the Instagram Reels safe zone (clear of the top ~220 px,
         the bottom ~420 px caption/audio row and the right-hand action column): x 130..890, from y 1240. */
      .cap { position: absolute; top: 1240px; left: 130px; width: 760px; height: 140px; text-align: center; font-family: var(--font-display); font-weight: 600; font-size: 48px; line-height: 1.3;
        letter-spacing: 0.04em; color: rgba(241, 230, 204, 0.55);
        text-shadow: 0 2px 4px rgba(0,0,0,0.95), 0 0 18px rgba(0,0,0,0.8), 0 0 36px rgba(0,0,0,0.55); }
      .cap span { display: inline-block; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${END}" data-width="1080" data-height="1920" data-fps="30">
      <div id="stage" class="clip" data-start="0" data-duration="${END}" data-track-index="0"></div>
${capHtml}      <audio id="vo" src="assets/vo.wav" data-start="0" data-duration="${END}" data-volume="1" data-track-index="3"></audio>
      <audio id="music" src="assets/music.wav" data-start="0" data-duration="${END}" data-volume="0.5" data-track-index="4"></audio>
      <audio id="sfx" src="assets/sfx.wav" data-start="0" data-duration="${END}" data-volume="0.28" data-track-index="5"></audio>
    </div>
    <script src="assets/film.js"></script>
    <script>
      const GOLD = "#e9c77e", SPOKEN = "#f1e6cc";
      // The painted film: every seek re-draws the frame for that time (pure function of time).
      HanumanFilm.mount(document.getElementById("stage"));
      const clock = { t: 0 };
      const tl = gsap.timeline({ paused: true });
      tl.to(clock, { t: ${END}, duration: ${END}, ease: "none", onUpdate: () => HanumanFilm.draw(clock.t) }, 0);
      // Word-synced subtitles: phrase fades in, the spoken word lights gold, then settles to parchment.
${capJs}      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      HanumanFilm.draw(0);
      tl.seek(0);
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(here, 'film/index.html'), html);
for (const f of ['Cinzel-600.woff2', 'music.wav', 'sfx.wav']) {
	const src = path.join(anim, 'public', f);
	if (fs.existsSync(src)) fs.copyFileSync(src, path.join(here, 'film/assets', f));
}
console.log('wrote index.html with', phrases.length, 'subtitle phrases');
