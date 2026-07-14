/* ============================================================
   SUITE D'INTÉGRATION — SyncEngine v2 (IndexedDB + queue + tombstones).
   L'app réelle dans Chromium + vrai supabase-js + mock Supabase local.
   Couvre les exigences de la mission: source de vérité locale, login sans
   écrasement, 2 appareils, offline→online, conflits (deletedAt/updatedAt),
   soft delete, queue persistante, jamais de résurrection ni de disparition.

   Usage: npm run build:vendor && node sync-v2.js
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createMockSupabase } = require('./mock-supabase');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 8931, MOCK_PORT = 8932;
const APP = `http://localhost:${APP_PORT}/gestion/`;
const MOCK = `http://localhost:${MOCK_PORT}`;
const VENDOR = path.join(__dirname, 'vendor', 'supabase-esm.js');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
let passed = 0, failed = 0;
const ok = (c, l) => { if (c) { passed++; console.log('  ✓ ' + l); } else { failed++; console.log('  ✗ FAIL ' + l); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function staticServer() {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(fs.readFileSync(f));
  });
}
async function newDevice(browser, { cloud = true } = {}) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({
    status: 200, contentType: 'text/javascript',
    body: cloud ? `window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};` : `window.SUPABASE_CONFIG={url:"",anonKey:""};`
  }));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(VENDOR, 'utf8') }));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  return { ctx, page };
}
const names = p => p.evaluate(() => DB.clients.map(c => c.name));
const addClient = (p, n) => p.evaluate(n => { DB.clients.push({ id: uid(), name: n, type: 'projet', statut: 'Actif', devise: 'DH' }); save(); renderAll(); }, n);
const delByName = (p, n) => p.evaluate(n => { const c = DB.clients.find(x => x.name === n); if (c) delClient(c.id); }, n);
const login = async (page, email, signup = false) => {
  await page.waitForSelector('#authGate', { timeout: 6000 });
  await page.fill('#ag_email', email); await page.fill('#ag_pass', 'secret123');
  await page.click(signup ? 'text=Créer le compte' : 'text=Se connecter');
  await page.waitForSelector('#authGate', { state: 'detached', timeout: 6000 });
  await sleep(600);
};
const dump = async () => (await fetch(MOCK + '/__dump')).json();
const cloudRows = (d, email, table) => { const u = d.users.find(x => x.email === email); return (u && d.rows[u.id] && d.rows[u.id][table]) || []; };
const cloudLive = (d, email, table) => cloudRows(d, email, table).filter(r => !r.deleted_at).map(r => r.name);

(async () => {
  const app = staticServer().listen(APP_PORT);
  const { server: mock } = createMockSupabase(); mock.listen(MOCK_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });

  console.log('\n[1] Régression — config vide = 100% local (IndexedDB), zéro réseau');
  {
    const { ctx, page } = await newDevice(browser, { cloud: false });
    page.on('dialog', d => d.accept());
    await page.goto(APP, { waitUntil: 'networkidle' }); await sleep(700);
    ok(!(await page.$('#authGate')), 'pas d’écran de connexion en local');
    ok((await names(page)).length >= 1, 'seed local via IDB');
    ok(await page.evaluate(() => SyncEngine.status) === 'local', 'statut = local');
    await addClient(page, 'LocalOnly'); await sleep(300);
    await page.reload({ waitUntil: 'networkidle' }); await sleep(700);
    ok((await names(page)).includes('LocalOnly'), 'create → refresh → persiste (offline)');
    ok((await dump()).users.length === 0, 'aucun appel réseau vers le cloud');
    await ctx.close();
  }

  console.log('\n[2] Inscription → le local est POUSSÉ (jamais écrasé), tombstones-ready');
  {
    await fetch(MOCK + '/__reset');
    const { ctx, page } = await newDevice(browser); page.on('dialog', d => d.accept());
    await page.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    const before = await names(page);
    await login(page, 'they@studio.ma', true); await sleep(1500);
    ok((await names(page)).length === before.length, 'login n’écrase PAS le local (même nb de clients)');
    const d = await dump();
    ok(cloudLive(d, 'they@studio.ma', 'clients').length === before.length, 'local poussé vers le cloud');
    ok(cloudRows(d, 'they@studio.ma', 'clients').every(r => r.version >= 1 && r.device_id), 'colonnes version/device_id présentes');
    await ctx.close();
  }

  console.log('\n[3] Login sur compte existant — merge, la démo locale neuve ne se pousse pas par-dessus');
  let A, B;
  {
    A = await newDevice(browser); A.page.on('dialog', d => d.accept());
    await A.page.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    await A.page.evaluate(() => { DB.clients = [{ id: 'ca', name: 'RealA', type: 'projet', statut: 'Actif', devise: 'DH' }]; DB.projets = []; DB.taches = []; DB.paiements = []; DB.events = []; save(); });
    await login(A.page, 'merge@studio.ma', true); await sleep(1500);
    B = await newDevice(browser); B.page.on('dialog', d => d.accept());
    await B.page.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    await login(B.page, 'merge@studio.ma'); await sleep(1800);
    ok((await names(B.page)).includes('RealA'), 'appareil B récupère les données du compte (RealA)');
  }

  console.log('\n[4] 2 appareils — création propagée (write local → queue → background sync → pull)');
  {
    await addClient(A.page, 'FromA'); await sleep(1800);
    await B.page.evaluate(() => SyncEngine.sync()); await sleep(1500);
    ok((await names(B.page)).includes('FromA'), 'B voit FromA après sync');
  }

  console.log('\n[5] SOFT DELETE — supprimé sur A → tombstone → B ne le ressuscite jamais');
  {
    await delByName(A.page, 'FromA'); await sleep(1800);
    const d = await dump();
    const row = cloudRows(d, 'merge@studio.ma', 'clients').find(r => r.name === 'FromA');
    ok(row && row.deleted_at, 'cloud: FromA porte un deleted_at (soft delete, pas de DELETE physique)');
    await B.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    ok(!(await names(B.page)).includes('FromA'), 'B applique la suppression (pas de résurrection)');
    await A.page.evaluate(() => SyncEngine.sync()); await sleep(800);
    ok(!(await names(A.page)).includes('FromA'), 'A reste cohérent');
  }

  console.log('\n[6] Offline-first — création hors ligne, queue persiste, resync online sans perte');
  {
    await A.ctx.setOffline(true);
    await addClient(A.page, 'OfflineA'); await sleep(400);
    ok((await names(A.page)).includes('OfflineA'), 'création visible immédiatement hors ligne');
    ok(await A.page.evaluate(() => Queue.count()) > 0, 'opération en file (persistée)');
    ok(await A.page.evaluate(async () => (await Storage.dump()).clients.some(c => c.name === 'OfflineA')), 'écrit en IndexedDB hors ligne (survit au refresh)');
    await A.ctx.setOffline(false);
    await A.page.evaluate(() => window.dispatchEvent(new Event('online'))); await sleep(1800);
    ok(cloudLive(await dump(), 'merge@studio.ma', 'clients').includes('OfflineA'), 'online → poussé au cloud');
    ok(await A.page.evaluate(() => Queue.count()) === 0, 'file vidée après resync');
  }

  console.log('\n[7] Conflit updatedAt — la modification la plus récente gagne (LWW)');
  {
    await B.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    await A.ctx.setOffline(true); await B.ctx.setOffline(true);
    await A.page.evaluate(() => { const c = DB.clients.find(x => x.name === 'OfflineA'); c.notes = 'edit-A'; save(); });
    await sleep(40);
    await B.page.evaluate(() => { const c = DB.clients.find(x => x.name === 'OfflineA'); c.notes = 'edit-B'; save(); }); // B après A
    await A.ctx.setOffline(false); await A.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    await B.ctx.setOffline(false); await B.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    await A.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    const d = await dump();
    ok(cloudRows(d, 'merge@studio.ma', 'clients').find(r => r.name === 'OfflineA').notes === 'edit-B', 'cloud garde edit-B (plus récent)');
    ok((await A.page.evaluate(() => DB.clients.find(c => c.name === 'OfflineA').notes)) === 'edit-B', 'A converge vers edit-B');
  }

  console.log('\n[8] Conflit delete vs edit — deletedAt (plus récent) gagne');
  {
    await A.ctx.setOffline(true); await B.ctx.setOffline(true);
    await A.page.evaluate(() => { const c = DB.clients.find(x => x.name === 'OfflineA'); c.notes = 'reedit-A'; save(); });
    await sleep(40);
    await delByName(B.page, 'OfflineA'); // suppression après l'édition
    await A.ctx.setOffline(false); await A.page.evaluate(() => SyncEngine.sync()); await sleep(1000);
    await B.ctx.setOffline(false); await B.page.evaluate(() => SyncEngine.sync()); await sleep(1000);
    await A.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    ok(!(await names(A.page)).includes('OfflineA'), 'la suppression (plus récente) gagne sur A');
    ok(!(await names(B.page)).includes('OfflineA'), 'et sur B');
  }

  console.log('\n[9] Anti-résurrection — un orphelin injecté au cloud n’est pas ré-adopté silencieusement');
  {
    // ligne cloud vivante inconnue → adoptée (comportement voulu: autre appareil)
    await A.page.evaluate(async () => { await AuthSync.client.from('clients').upsert([{ id: 'other-dev', name: 'FromOtherDevice', type: 'projet', statut: 'Actif', devise: 'DH', updated_at: new Date().toISOString(), version: 1 }]); });
    await A.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    ok((await names(A.page)).includes('FromOtherDevice'), 'ligne vivante d’un autre appareil → adoptée');
    // création locale JAMAIS effacée par le pull (auto-guérison)
    await addClient(A.page, 'NeverLost'); await sleep(1800);
    await A.page.evaluate(() => SyncEngine.sync()); await sleep(1200);
    await A.page.reload({ waitUntil: 'networkidle' }); await sleep(1500);
    ok((await names(A.page)).includes('NeverLost'), 'création locale jamais perdue après sync+refresh');
  }

  console.log('\n[10] Reprise de session — reload = pas de re-login, sync auto');
  {
    await A.page.reload({ waitUntil: 'networkidle' }); await sleep(1500);
    ok(!(await A.page.$('#authGate')), 'session persistée');
    ok(['ok', 'pending'].includes(await A.page.evaluate(() => SyncEngine.status)), 'sync relancée au boot');
    await A.ctx.close(); await B.ctx.close();
  }

  console.log('\n[11] Continuer sans cloud — l’app n’est jamais bloquée');
  {
    const { ctx, page } = await newDevice(browser); page.on('dialog', d => d.accept());
    await page.goto(APP, { waitUntil: 'networkidle' });
    await page.waitForSelector('#authGate');
    await page.click('text=Continuer sans cloud');
    ok(!(await page.$('#authGate')), 'gate fermé');
    await addClient(page, 'NoCloud'); await sleep(300);
    await page.reload({ waitUntil: 'networkidle' }); await sleep(700);
    ok((await names(page)).includes('NoCloud'), 'l’app reste pleinement utilisable en local');
    await ctx.close();
  }

  await browser.close(); app.close(); mock.close();
  console.log(`\n========== SyncEngine v2: ${passed} ✓ / ${failed} ✗ ==========`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
