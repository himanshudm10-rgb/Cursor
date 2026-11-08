// node sheetstills.mjs <compId> <frame...>  -> out/stills/<comp>_<f>.jpg
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
const [id, ...fr] = process.argv.slice(2);
fs.mkdirSync('out/stills', {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id});
for (const f of fr.map(Number)) await renderStill({serveUrl, composition: comp, frame: f, output: `out/stills/${id}_${f}.jpg`, imageFormat: 'jpeg', jpegQuality: 80});
console.log('done');
