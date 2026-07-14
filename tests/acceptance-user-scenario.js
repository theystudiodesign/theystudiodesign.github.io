/* ============================================================
   ACCEPTATION — SCÉNARIO UTILISATEUR RÉEL (reproduction exacte)

   Le bug réel rapporté en production:
     1. créer un client        → refresh (IMMÉDIAT, sans attendre)
     2. créer un autre client  → refresh
     3. supprimer le premier   → refresh
     4. supprimer le second    → refresh
     5. REDÉMARRER LE NAVIGATEUR
     6. répéter avec Cloud Sync activé
     7. répéter avec DEUX ONGLETS ouverts

   Réalisme clé (ce que les anciens tests ne reproduisaient pas):
   - le refresh arrive ~350 ms après l'action — l'utilisateur réel
     n'attend jamais le debounce de push de 1,5 s de l'ancien moteur;
   - le navigateur est réellement redémarré (contexte persistant
     fermé puis relancé: localStorage + IndexedDB survivent,
     la mémoire et les timers meurent);
   - le PROFIL DE STOCKAGE RÉEL de la production: localStorage
     saturé par les images de facture en base64 (they_fact_logo /
     they_fact_stamp / they_fact_ae) + documents accumulés — des clés
     NON sacrifiables pour l'auto-récupération de l'ancien moteur
     (EXPENDABLE ne couvre que journaux/snapshots/secours).

   Ce test DOIT échouer sur l'ancienne implémentation (16b867e,
   dernier build de production) et passer sur SyncEngine v2.

   Usage:
     node acceptance-user-scenario.js              → build ACTUEL (SyncEngine v2)
     node acceptance-user-scenario.js <old-root>   → ANCIEN build (doit échouer)
       où <old-root> contient gestion/ extrait de 16b867e
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright-core');
const { createMockSupabase } = require('./mock-supabase');

const ROOT = path.join(__dirname, '..');
const OLD_ROOT = process.argv[2] ? path.resolve(process.argv[2]) : null;
const APP_ROOT = OLD_ROOT || ROOT;
const LABEL = OLD_ROOT ? 'ANCIEN moteur (' + OLD_ROOT + ')' : 'SyncEngine v2 (build actuel)';
const APP_PORT = 9071, MOCK_PORT = 9072;
const APP = `http://localhost:${APP_PORT}/gestion/`;
const MOCK = `http://localhost:${MOCK_PORT}`;
const VENDOR = path.join(__dirname, 'vendor', 'supabase-esm.js');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

/* Le tempo réel de l'utilisateur: il ne laisse JAMAIS 1,5 s au debounce. */
const USER_TEMPO = 350;      // délai action → refresh
const SETTLE = 1800;         // délai après boot pour laisser pull/merge/render finir

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (c, l) => { if (c) { pass++; console.log('    ✓ ' + l); } else { fail++; console.log('    ✗ ÉCHEC ' + l); } };

function server() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(APP_ROOT, p);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(fs.readFileSync(f));
  }).listen(APP_PORT);
}

async function wireContext(ctx, cloud) {
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({
    status: 200, contentType: 'text/javascript',
    body: cloud ? `window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};` : 'window.SUPABASE_CONFIG={url:"",anonKey:""};'
  }));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(VENDOR, 'utf8') }));
}

/* Contexte PERSISTANT: fermer + relancer = vrai redémarrage navigateur. */
async function launchBrowser(userDataDir, cloud) {
  const ctx = await chromium.launchPersistentContext(userDataDir, { executablePath: CHROME, headless: true });
  await wireContext(ctx, cloud);
  return ctx;
}

const names = p => p.evaluate(() => DB.clients.map(c => c.name));

async function openApp(ctx) {
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  await page.goto(APP, { waitUntil: 'networkidle' });
  await sleep(SETTLE);
  return page;
}

async function createClient(page, name) {
  await page.evaluate(n => { openClientModal(); c_name.value = n; saveClient(); }, name);
}
async function deleteClient(page, name) {
  await page.evaluate(n => { const c = DB.clients.find(x => x.name === n); if (c) delClient(c.id); }, name);
}
async function quickRefresh(page) {
  await sleep(USER_TEMPO);                       // l'utilisateur réel
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(SETTLE);
}

async function login(page, email) {
  await page.evaluate(() => { DB.clients.forEach(c => c.notes = 'réel'); save(); });
  await page.waitForSelector('#authGate');
  await page.fill('#ag_email', email);
  await page.fill('#ag_pass', 'secret123');
  await page.click('text=Créer le compte');
  await page.waitForSelector('#authGate', { state: 'detached' });
  await sleep(1200);
}

/* Le profil de stockage RÉEL de la production (PR #21/#23):
   images de facture base64 + documents — clés NON sacrifiables —
   jusqu'à saturation totale du localStorage (~5 Mo). */
async function saturateStorage(page) {
  await page.evaluate(() => {
    const MB = n => 'X'.repeat(Math.floor(n * 1024 * 1024));
    try { localStorage.setItem('they_fact_logo', MB(1.5)); } catch (e) {}
    try { localStorage.setItem('they_fact_stamp', MB(1)); } catch (e) {}
    try { localStorage.setItem('they_fact_ae', MB(0.5)); } catch (e) {}
    for (const size of [256 * 1024, 32 * 1024, 4 * 1024, 512, 64]) {
      const C = 'X'.repeat(size);
      for (let i = 0; i < 200; i++) {
        try { localStorage.setItem('they_doc_' + size + '_' + i, C); } catch (e) { break; }
      }
    }
  });
}

/* Le scénario EXACT de l'utilisateur, sur une page donnée.
   secondTab: fonction appelée après chaque étape (onglet 2 qui vit sa vie). */
async function userScenario(env, page, ctx, { secondTab } = {}) {
  const A = env + '-CLIENT-1', B = env + '-CLIENT-2';

  /* 1. créer le 1er client → refresh */
  await createClient(page, A);
  if (secondTab) await secondTab('après création de ' + A);
  await quickRefresh(page);
  let n = await names(page);
  check(n.includes(A), `créer « ${A} » → refresh → il existe`);

  /* 2. créer le 2e client → refresh */
  await createClient(page, B);
  if (secondTab) await secondTab('après création de ' + B);
  await quickRefresh(page);
  n = await names(page);
  check(n.includes(A) && n.includes(B), `créer « ${B} » → refresh → les deux existent`);

  /* 3. supprimer le 1er → refresh */
  await deleteClient(page, A);
  if (secondTab) await secondTab('après suppression de ' + A);
  await quickRefresh(page);
  n = await names(page);
  check(!n.includes(A), `supprimer « ${A} » → refresh → il est toujours supprimé`);
  check(n.includes(B), `… et « ${B} » est toujours là`);

  /* 4. supprimer le 2e → refresh */
  await deleteClient(page, B);
  if (secondTab) await secondTab('après suppression de ' + B);
  await quickRefresh(page);
  n = await names(page);
  check(!n.includes(B), `supprimer « ${B} » → refresh → il est toujours supprimé`);

  return { A, B };
}

/* NOUVEL APPAREIL (profil vierge, même compte): les fantômes du cloud
   ressuscitent ici — c'est exactement « le client supprimé qui revient ». */
async function signInExisting(page, email) {
  await page.evaluate(() => { DB.clients.forEach(c => c.notes = 'réel'); save(); });
  await page.waitForSelector('#authGate');
  await page.fill('#ag_email', email);
  await page.fill('#ag_pass', 'secret123');
  await page.click('text=Se connecter');
  await page.waitForSelector('#authGate', { state: 'detached' });
  await sleep(2500); // laisser le pull initial se faire
}

/* Après REDÉMARRAGE navigateur: rien ne doit ressusciter. */
async function assertAfterRestart(page, A, B, extraSettle) {
  if (extraSettle) await sleep(extraSettle);
  const n = await names(page);
  check(!n.includes(A) && !n.includes(B), `redémarrage navigateur → « ${A} » et « ${B} » toujours supprimés (état: [${n.join(', ')}])`);
}

(async () => {
  console.log('CIBLE: ' + LABEL);
  const srv = server();
  const { server: mock } = createMockSupabase(); mock.listen(MOCK_PORT);

  /* ============ [S1] LOCAL — une instance ============ */
  console.log('\n[S1] LOCAL — scénario exact, refresh immédiats, puis redémarrage navigateur');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'they-s1-'));
    let ctx = await launchBrowser(dir, false);
    let page = await openApp(ctx);
    await saturateStorage(page);               // profil de stockage réel
    const { A, B } = await userScenario('S1', page, ctx);
    await ctx.close();                          // ← redémarrage navigateur
    ctx = await launchBrowser(dir, false);
    page = await openApp(ctx);
    await assertAfterRestart(page, A, B);
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }

  /* ============ [S2] CLOUD SYNC activé ============ */
  console.log('\n[S2] CLOUD — même scénario, Cloud Sync activé (mock Supabase)');
  {
    await fetch(MOCK + '/__reset');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'they-s2-'));
    let ctx = await launchBrowser(dir, true);
    let page = await openApp(ctx);
    await login(page, 'scenario@test.ma');
    await saturateStorage(page);               // profil de stockage réel
    const { A, B } = await userScenario('S2', page, ctx);
    await ctx.close();                          // ← redémarrage navigateur
    ctx = await launchBrowser(dir, true);
    page = await openApp(ctx);
    /* laisser le pull cloud se faire — c'est LÀ que les fantômes revenaient */
    await assertAfterRestart(page, A, B, 2500);
    /* et le cloud lui-même doit converger: plus aucun des deux */
    await sleep(2500);
    const dump = await (await fetch(MOCK + '/__dump')).json();
    const cloudNames = [];
    for (const uid of Object.keys(dump.rows || {})) {
      for (const r of (dump.rows[uid].clients || [])) {
        if (!r.deleted_at) cloudNames.push(r.name);
      }
    }
    check(!cloudNames.includes(A) && !cloudNames.includes(B),
      `le cloud a convergé: ni « ${A} » ni « ${B} » actifs côté serveur (cloud: [${cloudNames.join(', ')}])`);
    await ctx.close();
    /* nouvel appareil, même compte — le bug réel: les supprimés reviennent */
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'they-s2b-'));
    ctx = await launchBrowser(dir2, true);
    page = await openApp(ctx);
    await signInExisting(page, 'scenario@test.ma');
    const nd = await names(page);
    check(!nd.includes(A) && !nd.includes(B),
      `nouvel appareil (même compte) → aucun supprimé ne revient (état: [${nd.join(', ')}])`);
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(dir2, { recursive: true, force: true });
  }

  /* ============ [S3] CLOUD + DEUX ONGLETS ============ */
  console.log('\n[S3] CLOUD + 2 ONGLETS — le 2e onglet reste ouvert et sauvegarde après CHAQUE étape');
  {
    await fetch(MOCK + '/__reset');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'they-s3-'));
    let ctx = await launchBrowser(dir, true);
    let page = await openApp(ctx);
    await login(page, 'twotabs@test.ma');
    await saturateStorage(page);               // profil de stockage réel
    const tab2 = await openApp(ctx);            // 2e onglet, même session, reste ouvert
    const secondTab = async (moment) => {
      await tab2.evaluate(() => { try { if (DB.clients[0]) { DB.clients[0].notes = 'tab2-' + Date.now(); } save(); } catch (e) {} });
      console.log('    (onglet 2: save() ' + moment + ')');
      await sleep(300);
    };
    const { A, B } = await userScenario('S3', page, ctx, { secondTab });
    /* le 2e onglet, resté ouvert, refresh à son tour — il ne doit rien ressusciter */
    await tab2.reload({ waitUntil: 'networkidle' }); await sleep(SETTLE);
    const n2 = await names(tab2);
    check(!n2.includes(A) && !n2.includes(B), `l'onglet 2 refreshé ne ressuscite rien (état: [${n2.join(', ')}])`);
    await ctx.close();                          // ← redémarrage navigateur (les 2 onglets meurent)
    ctx = await launchBrowser(dir, true);
    page = await openApp(ctx);
    await assertAfterRestart(page, A, B, 2500);
    await ctx.close();
    /* nouvel appareil, même compte */
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'they-s3b-'));
    ctx = await launchBrowser(dir2, true);
    page = await openApp(ctx);
    await signInExisting(page, 'twotabs@test.ma');
    const nd = await names(page);
    check(!nd.includes(A) && !nd.includes(B),
      `nouvel appareil (même compte) → aucun supprimé ne revient (état: [${nd.join(', ')}])`);
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(dir2, { recursive: true, force: true });
  }

  await new Promise(r => srv.close(r)); await new Promise(r => mock.close(r));
  console.log(`\n========== SCÉNARIO UTILISATEUR [${LABEL}]: ${pass} ✓ / ${fail} ✗ ==========`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
