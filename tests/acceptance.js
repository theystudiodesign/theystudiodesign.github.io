/* ============================================================
   TEST D'ACCEPTATION PRODUCTION — critères exacts:
   1. créer un client · 2. refresh · 3. il existe toujours
   4. le supprimer   · 5. refresh · 6. il est toujours supprimé
   × 3 fois consécutives.

   Environnements:
   [E1] local, une instance
   [E2] cloud, une instance
   [E3] HOSTILE: cloud + fenêtre ZOMBIE (build de production ACTUEL, sans le fix)
        qui exécute un save() périmé après CHAQUE étape.

   Usage: node acceptance.js <chemin-build-zombie>
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createMockSupabase } = require('./mock-supabase');

const ROOT = path.join(__dirname, '..');
const ZOMBIE = process.argv[2];
const APP_PORT = 9061, MOCK_PORT = 9062;
const APP = `http://localhost:${APP_PORT}/gestion/`;
const OLDAPP = `http://localhost:${APP_PORT}/gestion-old/`;
const MOCK = `http://localhost:${MOCK_PORT}`;
const VENDOR = path.join(__dirname, 'vendor', 'supabase-esm.js');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (c, l) => { if (c) { pass++; console.log('    ✓ ' + l); } else { fail++; console.log('    ✗ ÉCHEC ' + l); } };

function server() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let f;
    if (ZOMBIE && p.startsWith('/gestion-old/')) f = path.join(ZOMBIE, 'gestion', p.slice('/gestion-old/'.length));
    else f = path.join(ROOT, p);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(fs.readFileSync(f));
  }).listen(APP_PORT);
}
async function newCtx(browser, cloud) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({
    status: 200, contentType: 'text/javascript',
    body: cloud ? `window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};` : 'window.SUPABASE_CONFIG={url:"",anonKey:""};'
  }));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(VENDOR, 'utf8') }));
  return ctx;
}
const names = p => p.evaluate(() => DB.clients.map(c => c.name));

async function acceptance(page, iter, hostileHit) {
  const NAME = 'ACCEPT-' + iter;
  console.log(`  — Itération ${iter}/3 —`);
  /* 1. créer */
  await page.evaluate(n => { openClientModal(); c_name.value = n; saveClient(); }, NAME);
  if (hostileHit) await hostileHit('après création');
  await sleep(2400); // laisser partir le push (et celui du zombie)
  /* 2. refresh */
  await page.reload({ waitUntil: 'networkidle' }); await sleep(1600);
  /* 3. il existe toujours */
  check((await names(page)).includes(NAME), `créé → refresh → « ${NAME} » existe toujours`);
  /* 4. supprimer */
  await page.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, NAME);
  if (hostileHit) await hostileHit('après suppression');
  await sleep(2400);
  /* 5. refresh */
  await page.reload({ waitUntil: 'networkidle' }); await sleep(1600);
  /* 6. toujours supprimé */
  check(!(await names(page)).includes(NAME), `supprimé → refresh → « ${NAME} » toujours supprimé`);
}

(async () => {
  const srv = server();
  const { server: mock } = createMockSupabase(); mock.listen(MOCK_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });

  /* ===== [E1] local, une instance ===== */
  console.log('\n[E1] LOCAL — une instance');
  {
    const ctx = await newCtx(browser, false);
    const page = await ctx.newPage(); page.on('dialog', d => d.accept());
    await page.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    for (let i = 1; i <= 3; i++) await acceptance(page, i, null);
    await ctx.close();
  }

  /* ===== [E2] cloud, une instance ===== */
  console.log('\n[E2] CLOUD — une instance');
  {
    const ctx = await newCtx(browser, true);
    const page = await ctx.newPage(); page.on('dialog', d => d.accept());
    await page.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    await page.evaluate(() => { DB.clients[0].notes = 'réel'; save(); });
    await page.waitForSelector('#authGate'); await page.fill('#ag_email', 'accept@test.ma'); await page.fill('#ag_pass', 'secret123');
    await page.click('text=Créer le compte'); await page.waitForSelector('#authGate', { state: 'detached' }); await sleep(800);
    for (let i = 1; i <= 3; i++) await acceptance(page, i, null);
    await ctx.close();
  }

  /* ===== [E3] HOSTILE — cloud + zombie (build de production ACTUEL) ===== */
  if (ZOMBIE) {
    console.log('\n[E3] HOSTILE — cloud + fenêtre ZOMBIE (build prod actuel, save() périmé après CHAQUE étape)');
    await fetch(MOCK + '/__reset');
    const ctx = await newCtx(browser, true);
    const page = await ctx.newPage(); page.on('dialog', d => d.accept());
    await page.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    await page.evaluate(() => { DB.clients[0].notes = 'réel'; save(); });
    await page.waitForSelector('#authGate'); await page.fill('#ag_email', 'hostile@test.ma'); await page.fill('#ag_pass', 'secret123');
    await page.click('text=Créer le compte'); await page.waitForSelector('#authGate', { state: 'detached' }); await sleep(800);
    const zombie = await ctx.newPage();
    await zombie.goto(OLDAPP, { waitUntil: 'networkidle' }); await sleep(1200); // mémoire figée MAINTENANT
    const hostileHit = async (moment) => {
      await zombie.evaluate(() => { try { DB.clients[0].notes = 'zombie-' + Date.now(); save(); } catch (e) {} });
      console.log(`    (zombie: save() périmé ${moment})`);
      await sleep(700); // laisse la réparation se déclencher
    };
    for (let i = 1; i <= 3; i++) await acceptance(page, i, hostileHit);
    await ctx.close();
  }

  await browser.close(); srv.close(); mock.close();
  console.log(`\n========== ACCEPTATION: ${pass} ✓ / ${fail} ✗ ==========`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
