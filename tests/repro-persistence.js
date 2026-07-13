/* ============================================================
   AUDIT — reproduction du bug de persistance (clients qui reviennent /
   nouveaux clients qui disparaissent). AUCUN FIX — instrumentation seule.

   Scénarios:
   [A] Témoin — 1 seul onglet, local: create/delete + reload  → attendu SAIN
   [B] Témoin — 1 seul onglet, cloud: create/delete + reload (avant ET après
       le debounce du push)                                   → attendu SAIN
   [C] 2 onglets, MÊME navigateur, mode local                 → suspicion CLOBBER
   [D] 2 onglets, MÊME navigateur, cloud                      → suspicion CLOBBER + amplification cloud

   Usage: node repro-persistence.js
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createMockSupabase } = require('./mock-supabase');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 8971, MOCK_PORT = 8972;
const APP = `http://localhost:${APP_PORT}/gestion/`;
const MOCK = `http://localhost:${MOCK_PORT}`;
const VENDOR = path.join(__dirname, 'vendor', 'supabase-esm.js');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

let passed = 0, failed = 0;
const ok = (c, l) => { if (c) { passed++; console.log('  ✓ ' + l); } else { failed++; console.log('  ✗ ' + l); } };
const repro = (c, l) => { console.log((c ? '  🔴 REPRODUIT: ' : '  ⚪ non reproduit: ') + l); };
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
async function newCtx(browser, { cloud = false } = {}) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({
    status: 200, contentType: 'text/javascript',
    body: cloud ? `window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};`
                : `window.SUPABASE_CONFIG={url:"",anonKey:""};`
  }));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', r => r.fulfill({
    status: 200, contentType: 'text/javascript', body: fs.readFileSync(VENDOR, 'utf8')
  }));
  return ctx;
}
const openPage = async (ctx) => { const p = await ctx.newPage(); await p.goto(APP, { waitUntil: 'networkidle' }); await sleep(500); return p; };
const names = p => p.evaluate(() => DB.clients.map(c => c.name));
const lsNames = p => p.evaluate(() => (JSON.parse(localStorage.getItem('crm_gestion_clients_v1')) || { clients: [] }).clients.map(c => c.name));
const addClient = (p, n) => p.evaluate(n => { DB.clients.push({ id: uid(), name: n, type: 'projet', statut: 'Actif', devise: 'DH' }); save(); renderAll(); }, n);
const delByName = (p, n) => p.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, n);
const login = async (page, email, pass, signup = false) => {
  await page.waitForSelector('#authGate', { timeout: 5000 });
  await page.fill('#ag_email', email); await page.fill('#ag_pass', pass);
  await page.click(signup ? 'text=Créer le compte' : 'text=Se connecter');
  await page.waitForSelector('#authGate', { state: 'detached', timeout: 5000 });
  await sleep(500);
};
const dump = async () => (await fetch(MOCK + '/__dump')).json();
const cloudClients = (d, email) => { const u = d.users.find(x => x.email === email); return ((u && d.rows[u.id] && d.rows[u.id].clients) || []).map(r => r.name); };

(async () => {
  const app = staticServer().listen(APP_PORT);
  const { server: mock } = createMockSupabase(); mock.listen(MOCK_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });

  /* ============ [A] TÉMOIN — 1 onglet, local ============ */
  console.log('\n[A] Témoin — 1 onglet, mode local');
  {
    const ctx = await newCtx(browser); const p = await openPage(ctx);
    p.on('dialog', d => d.accept());
    await addClient(p, 'Solo-New');
    await p.reload({ waitUntil: 'networkidle' }); await sleep(400);
    ok((await names(p)).includes('Solo-New'), 'create + reload → le client persiste');
    await delByName(p, 'Solo-New'); await sleep(150);
    await p.reload({ waitUntil: 'networkidle' }); await sleep(400);
    ok(!(await names(p)).includes('Solo-New'), 'delete + reload → le client reste supprimé');
    await ctx.close();
  }

  /* ============ [B] TÉMOIN — 1 onglet, cloud (reload AVANT et APRÈS debounce) ============ */
  console.log('\n[B] Témoin — 1 onglet, cloud (y compris reload pendant la fenêtre de debounce 1.5s)');
  {
    const ctx = await newCtx(browser, { cloud: true }); const p = await openPage(ctx);
    p.on('dialog', d => d.accept());
    await login(p, 'solo@test.ma', 'secret123', true);
    await addClient(p, 'Cloud-Fast');
    await p.reload({ waitUntil: 'networkidle' }); await sleep(1200); // reload AVANT le push (débounce non écoulé)
    ok((await names(p)).includes('Cloud-Fast'), 'create + reload IMMÉDIAT (push pas encore parti) → persiste');
    await sleep(2400);
    ok(cloudClients(await dump(), 'solo@test.ma').includes('Cloud-Fast'), 'le push de rattrapage a bien poussé au cloud');
    await delByName(p, 'Cloud-Fast'); await sleep(120);
    await p.reload({ waitUntil: 'networkidle' }); await sleep(1200); // reload AVANT le push de suppression
    ok(!(await names(p)).includes('Cloud-Fast'), 'delete + reload IMMÉDIAT → reste supprimé');
    await sleep(2400);
    ok(!cloudClients(await dump(), 'solo@test.ma').includes('Cloud-Fast'), 'suppression propagée au cloud au rattrapage');
    await ctx.close();
  }

  /* ============ [C] 2 ONGLETS, même navigateur, mode LOCAL ============ */
  console.log('\n[C] 2 onglets ouverts en même temps — mode local (PWA installée + onglet navigateur, par ex.)');
  {
    const ctx = await newCtx(browser);
    const tabStale = await openPage(ctx);            // onglet "oublié" — garde une COPIE MÉMOIRE de DB
    const tabActive = await openPage(ctx);           // onglet où l'utilisateur travaille
    tabActive.on('dialog', d => d.accept());
    const victim = (await names(tabActive))[1];      // client existant qui sera supprimé
    await addClient(tabActive, 'Fresh-C');           // 2. création
    await delByName(tabActive, victim);              // 1. suppression
    await sleep(150);
    ok((await lsNames(tabActive)).includes('Fresh-C') && !(await lsNames(tabActive)).includes(victim),
      'onglet actif: storage correct après create+delete');
    /* l'utilisateur retourne dans le vieil onglet et fait N'IMPORTE QUELLE sauvegarde */
    await tabStale.evaluate(() => { DB.clients[0].notes = 'edit-depuis-vieil-onglet'; save(); });
    await sleep(150);
    const after = await lsNames(tabStale);
    repro(after.includes(victim), `le client SUPPRIMÉ « ${victim} » est REVENU dans le storage (symptômes 1 & 3)`);
    repro(!after.includes('Fresh-C'), 'le client CRÉÉ « Fresh-C » a DISPARU du storage (symptôme 2)');
    await tabActive.reload({ waitUntil: 'networkidle' }); await sleep(400);
    const seen = await names(tabActive);
    repro(seen.includes(victim) && !seen.includes('Fresh-C'),
      'après refresh, l’utilisateur voit l’état corrompu (symptôme 4 — incohérence)');
    await ctx.close();
  }

  /* ============ [D] 2 ONGLETS, même navigateur, CLOUD — amplification ============ */
  console.log('\n[D] 2 onglets + cloud — le vieil onglet POUSSE l’état périmé (suppression de la création au cloud)');
  {
    await fetch(MOCK + '/__reset');
    const ctx = await newCtx(browser, { cloud: true });
    const tab1 = await openPage(ctx);
    await tab1.evaluate(() => { DB.clients[0].notes = 'vraie donnée'; save(); }); // base réelle (retire le drapeau démo)
    await login(tab1, 'clobber@test.ma', 'secret123', true);   // session partagée via localStorage
    await sleep(500);
    const tab2 = await openPage(ctx); await sleep(1000);        // tab2 récupère la session, pull
    tab2.on('dialog', d => d.accept());
    const victim = (await names(tab2))[1];
    await addClient(tab2, 'Cloud-Fresh');
    await delByName(tab2, victim);
    await sleep(2400);                                          // push debounce de tab2 passé
    let cn = cloudClients(await dump(), 'clobber@test.ma');
    ok(cn.includes('Cloud-Fresh') && !cn.includes(victim), 'cloud correct après le travail de tab2');
    /* tab1 (mémoire périmée: victim présent, Cloud-Fresh absent) fait une sauvegarde anodine */
    await tab1.evaluate(() => { DB.clients[0].notes = 'stale'; save(); });
    await sleep(2400);                                          // push debounce de tab1
    cn = cloudClients(await dump(), 'clobber@test.ma');
    repro(cn.includes(victim), `CLOUD: le client supprimé « ${victim} » RESSUSCITÉ par le push de tab1 (upsert de sa mémoire périmée)`);
    repro(!cn.includes('Cloud-Fresh'), 'CLOUD: « Cloud-Fresh » SUPPRIMÉ par tab1 — diff baseIds(partagé, à jour) − DB(mémoire périmée)');
    await tab2.reload({ waitUntil: 'networkidle' }); await sleep(1500);
    const seen = await names(tab2);
    repro(seen.includes(victim) && !seen.includes('Cloud-Fresh'),
      'refresh de l’onglet actif → pull → l’utilisateur voit revenir le supprimé et disparaître le créé');
    await ctx.close();
  }

  await browser.close(); app.close(); mock.close();
  console.log(`\n===== témoins: ${passed} ✓ / ${failed} ✗ =====`);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
