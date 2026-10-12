// Headless Chromium frame capture: node capture.js <scene> <frames> <outdir> [dur] [fps]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [scene, frames, outdir, durArg, fpsArg, startArg] = process.argv.slice(2);
  const fps = +(fpsArg || 24), n = +frames, dur = +(durArg || n / fps), start = +(startArg || 0);
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
  await page.exposeFunction('savePlate', (key, c, d) => {
    fs.writeFileSync(path.join(__dirname, 'plates', key + '_c.png'), Buffer.from(c.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(__dirname, 'plates', key + '_d.png'), Buffer.from(d.split(',')[1], 'base64'));
    console.log('saved plate', key);
  });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  await page.evaluate(([s, d, o]) => window.setupScene(s, d, o), [scene, dur, JSON.parse(process.env.OPTS || '{}')]);
  for (const p of await page.evaluate(() => window.exportPlates ? window.exportPlates() : [])) {
    fs.writeFileSync(path.join(__dirname, 'plates', p.key + '_c.png'), Buffer.from(p.c.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(__dirname, 'plates', p.key + '_d.png'), Buffer.from(p.d.split(',')[1], 'base64'));
  }

  const t0 = Date.now();
  for (let i = start; i < n; i++) {
    const url = await page.evaluate(([i, fps]) => window.renderFrame(i / fps), [i, fps]);
    fs.writeFileSync(path.join(outdir, String(i).padStart(5, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
    if (i % 48 === 0) console.log(scene, i, '/', n, ((Date.now() - t0) / (i - start + 1)).toFixed(0) + 'ms/f');
  }
  await browser.close();
})();
