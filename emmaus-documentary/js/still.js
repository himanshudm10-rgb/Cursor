// node still.js <scene> <dur> <out.jpg> t1 t2 ...  -> contact sheet (2 columns)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [scene, dur, out, ...ts] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
  page.on('console', m => console.log('[page]', m.text()));
  await page.exposeFunction('savePlate', (key, c, d) => {
    fs.writeFileSync(path.join(__dirname, 'plates', key + '_c.png'), Buffer.from(c.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(__dirname, 'plates', key + '_d.png'), Buffer.from(d.split(',')[1], 'base64'));
    console.log('saved plate', key);
  });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.READY === true);
  let t0 = Date.now();
  await page.evaluate(([s, d, o]) => window.setupScene(s, +d, o), [scene, dur, JSON.parse(process.env.OPTS || '{}')]);
  for (const p of await page.evaluate(() => window.exportPlates ? window.exportPlates() : [])) {
    fs.writeFileSync(path.join(__dirname, 'plates', p.key + '_c.png'), Buffer.from(p.c.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(__dirname, 'plates', p.key + '_d.png'), Buffer.from(p.d.split(',')[1], 'base64'));
  }

  console.log('setup ms', Date.now() - t0);
  const urls = [];
  for (const t of ts) { t0 = Date.now(); urls.push(await page.evaluate(t => window.renderFrame(+t, 0.85), t)); console.log('frame', t, Date.now() - t0, 'ms'); }
  const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:${ts.length > 1 ? '1fr 1fr' : '1fr'};gap:4px">${urls.map((u, i) => `<div style="position:relative"><img src="${u}" style="width:100%;display:block"><span style="position:absolute;left:6px;top:4px;color:#ff0;font:20px sans-serif">${ts[i]}</span></div>`).join('')}</body>`;
  const p2 = await browser.newPage({ viewport: { width: 1600, height: ts.length > 1 ? 450 * Math.ceil(ts.length / 2) : 900 } });
  await p2.setContent(html); await p2.screenshot({ path: out, type: 'jpeg', quality: 80, fullPage: true });
  await browser.close();
})();
