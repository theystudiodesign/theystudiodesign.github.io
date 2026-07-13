/* ============================================================
   TRACE D'EXÉCUTION — build de PRODUCTION téléchargé en direct (v34).
   saveClient() → save() → DataLayer.write() → cloudOnSave() → cloudPush()
   → refresh → load() → DataLayer.read() → cloudPull() → render()
   À chaque étape: DB.clients · localStorage · cloud · rendu.
   RUN 1: une seule instance.  RUN 2: + une 2e instance ouverte.
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createMockSupabase } = require('./mock-supabase');

const PRODROOT = '/tmp/prod-build';
const APP_PORT = 9001, MOCK_PORT = 9002;
const APP = `http://localhost:${APP_PORT}/gestion/`;
const MOCK = `http://localhost:${MOCK_PORT}`;
const VENDOR = path.join(__dirname, 'vendor', 'supabase-esm.js');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function server() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(PRODROOT, p);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(f));
  }).listen(APP_PORT);
}
async function newCtx(browser, slowPull) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: `window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};` }));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(VENDOR, 'utf8') }));
  if (slowPull) await ctx.route(`${MOCK}/rest/v1/clients**`, async r => { if (r.request().method() === 'GET') await sleep(1200); r.continue(); });
  return ctx;
}
const dump = async () => (await fetch(MOCK + '/__dump')).json();
async function snap(page, email, label) {
  const s = await page.evaluate(() => ({
    mem: (typeof DB !== 'undefined' ? (DB.clients || []).map(c => c.name) : ['(DB pas encore chargée)']),
    ls: ((JSON.parse(localStorage.getItem('crm_gestion_clients_v1') || 'null') || { clients: [] }).clients || []).map(c => c.name),
    rendered: (() => { try { go('clients'); renderClients(); return [...document.querySelectorAll('#clientsTable .t-name')].map(e => e.textContent); } catch (e) { return ['(err)']; } })()
  }));
  const d = await dump();
  const u = d.users.find(x => x.email === email);
  const cloud = ((u && d.rows[u.id] && d.rows[u.id].clients) || []).map(r => r.name);
  const short = a => a.map(n => n.split(' ')[0].replace(',', '')).join('+') || '∅';
  console.log(`  ${label.padEnd(46)} | DB:${String(s.mem.length)} [${short(s.mem)}] | LS:${s.ls.length} [${short(s.ls)}] | CLOUD:${cloud.length} [${short(cloud)}] | RENDU:${s.rendered.length}`);
  return { mem: s.mem, ls: s.ls, cloud, rendered: s.rendered };
}
const login = async (page, email, signup) => {
  await page.waitForSelector('#authGate', { timeout: 8000 });
  await page.fill('#ag_email', email); await page.fill('#ag_pass', 'secret123');
  await page.click(signup ? 'text=Créer le compte' : 'text=Se connecter');
  await page.waitForSelector('#authGate', { state: 'detached', timeout: 8000 });
  await sleep(600);
};

async function runChain(browser, email, withSecondInstance) {
  console.log(`\n===== RUN ${withSecondInstance ? '2 — AVEC une 2e instance ouverte (fenêtre PWA/onglet)' : '1 — UNE SEULE instance'} =====`);
  const ctx = await newCtx(browser);
  const page = await ctx.newPage(); await page.goto(APP, { waitUntil: 'networkidle' }); await sleep(400);
  page.on('dialog', d => d.accept());
  await page.evaluate(() => { DB.clients[0].notes = 'réel'; save(); }); // base réelle
  await login(page, email, true);
  let second = null;
  if (withSecondInstance) { second = await ctx.newPage(); await second.goto(APP, { waitUntil: 'networkidle' }); await sleep(900); }
  await snap(page, email, 'ÉTAT INITIAL (synchronisé)');

  /* ---- saveClient() RÉEL (via le modal, comme l'utilisateur) ---- */
  await page.evaluate(() => { openClientModal(); c_name.value = 'NouveauClient'; });
  await page.evaluate(() => saveClient());                       // saveClient → save → DataLayer.write → cloudOnSave
  await snap(page, email, 'APRÈS saveClient()/save()/write()');
  await sleep(2300);                                              // debounce → cloudPush
  await snap(page, email, 'APRÈS cloudPush (debounce 1.5s)');

  /* ---- delClient() RÉEL ---- */
  const victim = await page.evaluate(() => DB.clients.find(c => c.name !== 'NouveauClient').name);
  await page.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, victim);
  await snap(page, email, `APRÈS delClient(${victim.split(' ')[0]})`);
  await sleep(2300);
  await snap(page, email, 'APRÈS cloudPush de la suppression');

  /* ---- l'événement déclencheur: la 2e instance fait UNE sauvegarde ---- */
  if (second) {
    console.log('  >>> la 2e instance (mémoire chargée au boot, jamais rafraîchie) exécute UN save() <<<');
    await second.evaluate(() => { DB.clients[0].notes = 'edit 2e instance'; save(); });
    await sleep(2300); // son debounce cloudPush
    await snap(page, email, '🔴 APRÈS le save() de la 2e instance');
  }

  /* ---- refresh → load() → DataLayer.read() → cloudPull() → render() ---- */
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
  await snap(page, email, 'APRÈS refresh: load()/DataLayer.read()');
  await sleep(1600); // laisse cloudPull finir
  await snap(page, email, 'APRÈS cloudPull()');
  const fin = await snap(page, email, 'RENDER FINAL');
  const okC = fin.mem.includes('NouveauClient'), okD = !fin.mem.includes(victim);
  console.log(`  VERDICT: NouveauClient ${okC ? 'PERSISTE ✓' : 'DISPARU 🔴'} · ${victim.split(' ')[0]} ${okD ? 'reste supprimé ✓' : 'REVENU 🔴'}`);
  await ctx.close();
}

(async () => {
  const srv = server();
  const { server: mock } = createMockSupabase(); mock.listen(MOCK_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });
  await runChain(browser, 'run1@trace.ma', false);
  await fetch(MOCK + '/__reset');
  await runChain(browser, 'run2@trace.ma', true);
  await browser.close(); srv.close(); mock.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
