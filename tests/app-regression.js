/* ============================================================
   RÉGRESSIONS APPLICATIVES (non-cloud) — re-branchées sur SyncEngine v2.
   Couvre les fixes historiques dont le code est conservé:
   timezone (isoLocal), intégrité référentielle (sweepOrphans),
   seed anti-réinjection, snapshots/restore, multi-onglets (BroadcastChannel).

   Usage: node app-regression.js
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const PORT = 8941, APP = `http://localhost:${PORT}/gestion/`;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
let passed = 0, failed = 0;
const ok = (c, l) => { if (c) { passed++; console.log('  ✓ ' + l); } else { failed++; console.log('  ✗ FAIL ' + l); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(fs.readFileSync(f));
}).listen(PORT);

async function newPage(browser, { tz = 'Africa/Casablanca', init } = {}) {
  const ctx = await browser.newContext({ timezoneId: tz });
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  if (init) await ctx.addInitScript(init);
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.SUPABASE_CONFIG={url:"",anonKey:""};' }));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  page.on('dialog', d => d.accept());
  await page.goto(APP, { waitUntil: 'networkidle' }); await sleep(600);
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });

  console.log('\n[R1] Timezone (fix Sprint 17) — dates calendaires LOCALES, garde Maroc + UTC');
  {
    const { ctx, page } = await newPage(browser);
    await page.clock.setFixedTime(new Date('2026-07-13T12:00:00+01:00'));
    const c13 = await page.evaluate(() => monthCells(2026, 6).find(c => c.day === 13 && !c.out));
    ok(c13 && c13.iso === '2026-07-13', 'monthCells: cellule 13 → iso 2026-07-13 (Casablanca)');
    ok((await page.evaluate(() => weekCells(new Date())))[0] === '2026-07-13', 'weekCells: la semaine commence lundi 13');
    await page.clock.setFixedTime(new Date('2026-07-13T00:30:00+01:00'));
    ok((await page.evaluate(() => CAL_TODAY())) === '2026-07-13', 'CAL_TODAY à 00h30 locale = date LOCALE');
    ok((await page.evaluate(() => isOverdue({ statut: 'En attente', date: '2026-07-12' }))) === true, 'isOverdue: dû hier (local) = retard');
    const bucket = await page.evaluate(() => {
      DB.paiements.push({ id: uid(), clientId: DB.clients[0].id, projetId: '', label: 'TZ', montant: 500, devise: 'DH', statut: 'Payé', date: '2026-07-05', methode: 'Cash', notes: '' });
      save(); const m = monthlyRevenue('DH'); return m[m.length - 1];
    });
    ok(bucket.key === '2026-07', 'monthlyRevenue: bucket du mois courant correct');
    await ctx.close();
    const U = await newPage(browser, { tz: 'UTC' });
    await U.page.clock.setFixedTime(new Date('2026-07-13T12:00:00Z'));
    ok((await U.page.evaluate(() => CAL_TODAY())) === '2026-07-13', 'garde UTC: comportement inchangé');
    await U.ctx.close();
  }

  console.log('\n[R2] Intégrité référentielle (sweepOrphans) — cascade + purge au boot');
  {
    const { ctx, page } = await newPage(browser);
    await page.evaluate(() => {
      const c1 = DB.clients[0];
      DB.events.push({ id: uid(), title: 'EvLié', type: 'Réunion', date: '2026-07-20', clientId: c1.id, notes: '' });
      DB.events.push({ id: uid(), title: 'EvPerso', type: 'Personnel', date: '2026-07-21', clientId: '', notes: '' });
      save();
    });
    await page.evaluate(() => delClient(DB.clients[0].id)); await sleep(200);
    let d = await page.evaluate(() => ({ ev: DB.events.map(e => e.title), t: DB.taches.length }));
    ok(!d.ev.includes('EvLié') && d.ev.includes('EvPerso'), 'delClient: cascade complète (events liés supprimés, personnels gardés)');
    /* orphelins injectés directement en base → purgés au chargement suivant */
    await page.evaluate(async () => {
      await IDB.putAll('paiements', [{ id: 'orph1', clientId: 'ghost', label: 'Fantôme', montant: 999, devise: 'DH', statut: 'Payé', date: '2026-07-01', updatedAt: new Date().toISOString(), version: 1 }]);
    });
    await page.reload({ waitUntil: 'networkidle' }); await sleep(700);
    ok(!(await page.evaluate(() => DB.paiements.some(p => p.label === 'Fantôme'))), 'orphelin (client inexistant) purgé au boot');
    await ctx.close();
  }

  console.log('\n[R3] Seed anti-réinjection — reset volontaire = base vide, jamais re-seedée');
  {
    const { ctx, page } = await newPage(browser);
    ok((await page.evaluate(() => DB.clients.length)) === 2, 'premier lancement: seed 2 clients');
    await page.evaluate(async () => { DB.clients = []; DB.projets = []; DB.taches = []; DB.paiements = []; DB.events = []; save(); await new Promise(r => setTimeout(r, 300)); });
    await page.reload({ waitUntil: 'networkidle' }); await sleep(700);
    ok((await page.evaluate(() => DB.clients.length)) === 0, 'reset + reload → base VIDE (démo jamais réinjectée)');
    await ctx.close();
  }

  console.log('\n[R4] Snapshots & Restore — restaure les données réelles, jamais la démo');
  {
    const { ctx, page } = await newPage(browser);
    await page.evaluate(() => {
      DB.clients = [{ id: uid(), name: 'RealCo', type: 'projet', statut: 'Actif', devise: 'DH' }];
      DB.projets = []; DB.taches = []; DB.paiements = []; DB.events = []; save(); takeSnapshot();
    });
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem('they_snap_1')).db.clients[0].name === 'RealCo'), 'snapshot des données réelles pris');
    await page.evaluate(() => { DB.clients = []; save(); }); await sleep(300);
    await page.evaluate(() => restoreSnapshot(0)); await sleep(700);
    ok(await page.evaluate(() => DB.clients.length === 1 && DB.clients[0].name === 'RealCo'), 'restore → données réelles');
    ok(await page.evaluate(async () => (await Storage.dump()).clients.some(c => c.name === 'RealCo' && !c.deletedAt)), 'restore écrit en IDB (vivant)');
    await page.reload({ waitUntil: 'networkidle' }); await sleep(800);
    ok(await page.evaluate(() => DB.clients.length === 1 && DB.clients[0].name === 'RealCo'), 'restore persisté (IDB) après refresh');
    await ctx.close();
  }

  console.log('\n[R5] Multi-onglets (BroadcastChannel) — convergence en direct, zéro écrasement');
  {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/supabase-config.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.SUPABASE_CONFIG={url:"",anonKey:""};' }));
    const t1 = await ctx.newPage(); await t1.goto(APP, { waitUntil: 'networkidle' }); await sleep(600);
    const t2 = await ctx.newPage(); await t2.goto(APP, { waitUntil: 'networkidle' }); await sleep(600);
    t1.on('dialog', d => d.accept()); t2.on('dialog', d => d.accept());
    await t1.evaluate(() => { DB.clients.push({ id: uid(), name: 'Tab1-New', type: 'projet', statut: 'Actif', devise: 'DH' }); save(); }); await sleep(600);
    ok(await t2.evaluate(() => DB.clients.some(c => c.name === 'Tab1-New')), 'création t1 → visible dans t2 en direct');
    const victim = await t2.evaluate(() => DB.clients[0].name);
    await t2.evaluate(() => delClient(DB.clients[0].id)); await sleep(600);
    ok(!(await t1.evaluate(n => DB.clients.some(c => c.name === n), victim)), 'suppression t2 → appliquée dans t1');
    await t1.evaluate(() => { DB.clients[0].notes = 'edit-t1'; save(); }); await sleep(600);
    const st = await t2.evaluate(async () => (await Storage.dump()).clients.filter(c => !c.deletedAt).map(c => c.name));
    ok(st.includes('Tab1-New') && !st.includes(victim), 'après saves croisés: état IDB cohérent (rien ne revient, rien ne disparaît)');
    await ctx.close();
  }

  await browser.close(); srv.close();
  console.log(`\n========== RÉGRESSIONS APP: ${passed} ✓ / ${failed} ✗ ==========`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
