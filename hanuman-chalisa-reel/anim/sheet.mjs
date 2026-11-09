import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id: 'Sheet'});
await renderStill({serveUrl, composition: comp, frame: 0, output: 'out/charsheet.png'});
console.log('ok');
