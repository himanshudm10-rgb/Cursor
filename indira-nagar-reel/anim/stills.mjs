// Render review stills: node stills.mjs 2.6 9.2 15.5 ...  -> out/stills/s_<t>.jpg
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
const times = process.argv.slice(2).map(Number);
fs.mkdirSync('out/stills', {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id: 'Film'});
for (const t of times) {
	await renderStill({serveUrl, composition: comp, frame: Math.round(t * 30), output: `out/stills/s_${t.toFixed(2)}.jpg`, imageFormat: 'jpeg', jpegQuality: 80});
}
console.log('done');
