/* ============================================================
   Suite d'intégration Sprint 12 — Cloud Sync Supabase.
   Lance: un serveur statique (l'app), le mock Supabase (auth+REST),
   puis pilote l'app dans Chromium (Playwright) avec le VRAI client
   supabase-js (bundle local injecté à la place du CDN).

   Usage:  npm install && npm run build:vendor && npm test
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
const CHROME = process.env.CHROME_PATH ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✓ ' + label); }
  else { failed++; console.log('  ✗ FAIL ' + label); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* serveur statique minimal */
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

/* contexte navigateur = "un appareil" */
async function newDevice(browser, { cloud = true } = {}) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1')); // bypass PIN (testé à part)
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js', r => r.fulfill({
    status: 200, contentType: 'text/javascript',
    body: cloud
      ? `window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};`
      : `window.SUPABASE_CONFIG={url:"",anonKey:""};`
  }));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', r => r.fulfill({
    status: 200, contentType: 'text/javascript', body: fs.readFileSync(VENDOR, 'utf8')
  }));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  return { ctx, page };
}

const login = async (page, email, pass, signup = false) => {
  await page.waitForSelector('#authGate', { timeout: 5000 });
  await page.fill('#ag_email', email);
  await page.fill('#ag_pass', pass);
  await page.click(signup ? 'text=Créer le compte' : 'text=Se connecter');
  await page.waitForSelector('#authGate', { state: 'detached', timeout: 5000 });
  await sleep(400); // laisse finir pull/push initial
};
const db = (page) => page.evaluate(() => DB);
const lsdb = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('crm_gestion_clients_v1')));
const syncSt = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('they_sync_v1') || 'null'));
const addClient = (page, name) => page.evaluate(n => {
  DB.clients.push({ id: uid(), name: n, type: 'projet', statut: 'Actif', devise: 'DH' }); save();
}, name);
const dump = async () => (await fetch(MOCK + '/__dump')).json();
const cloudRowsFor = (d, email, table) => {
  const u = d.users.find(x => x.email === email);
  return (u && d.rows[u.id] && d.rows[u.id][table]) || [];
};

(async () => {
  const app = staticServer().listen(APP_PORT);
  const { server: mock, state } = createMockSupabase();
  mock.listen(MOCK_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });

  /* ================================================================ */
  console.log('\n[1] Régression — config vide = 100% local, rien ne change');
  {
    const { ctx, page } = await newDevice(browser, { cloud: false });
    await page.goto(APP, { waitUntil: 'networkidle' });
    await sleep(600);
    ok(!(await page.$('#authGate')), 'pas d’écran de connexion en mode local');
    ok((await db(page)).clients.length >= 1, 'seed local chargé');
    ok(await page.evaluate(() => Cloud.status) === 'local', 'statut = local');
    ok(await page.evaluate(() => document.getElementById('cloudStatus').style.display) === 'none', 'indicateur ☁ caché');
    await addClient(page, 'LocalOnly Co');
    const d = await lsdb(page);
    ok(d.clients.some(c => c.name === 'LocalOnly Co'), 'save() → LocalStorage OK');
    ok(d.clients.every(c => c.updatedAt), 'updatedAt stampé même en local');
    ok((await dump()).users.length === 0, 'aucun appel réseau vers le cloud');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[2] Inscription (registration) + premier push local → cloud');
  {
    const { ctx, page } = await newDevice(browser);
    await page.goto(APP, { waitUntil: 'networkidle' });
    ok(!!(await page.waitForSelector('#authGate')), 'auth gate affiché quand config remplie sans session');
    await login(page, 'they@studio.ma', 'secret123', true);
    ok(await page.evaluate(() => Cloud.user && Cloud.user.email) === 'they@studio.ma', 'inscription → session active');
    const d = await dump();
    ok(d.users.length === 1, 'compte créé côté serveur');
    const localClients = (await db(page)).clients;
    const cloudClients = cloudRowsFor(d, 'they@studio.ma', 'clients');
    ok(cloudClients.length === localClients.length && cloudClients.length > 0,
      `premier login: données locales poussées vers le cloud (${cloudClients.length} clients)`);
    ok(cloudClients.every(r => r.user_id === d.users[0].id), 'user_id posé sur chaque ligne (RLS)');
    ok((await syncSt(page)).dirty === false, 'dirty=false après push réussi');
    ok(await page.evaluate(() => Cloud.status) === 'ok', 'statut = ok');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[3] Login mauvais mot de passe → message clair');
  {
    const { ctx, page } = await newDevice(browser);
    await page.goto(APP, { waitUntil: 'networkidle' });
    await page.waitForSelector('#authGate');
    await page.fill('#ag_email', 'they@studio.ma');
    await page.fill('#ag_pass', 'wrongpass');
    await page.click('text=Se connecter');
    await sleep(400);
    const msg = await page.textContent('#ag_msg');
    ok(/ghalat/i.test(msg), 'erreur traduite: "' + msg + '"');
    ok(await page.$('#authGate') !== null, 'gate reste affiché');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[4] Deuxième appareil — persistance des données entre appareils');
  let deviceA, deviceB;
  {
    deviceB = await newDevice(browser);
    const { page } = deviceB;
    await page.goto(APP, { waitUntil: 'networkidle' });
    await login(page, 'they@studio.ma', 'secret123');
    const d = await db(page);
    ok(d.clients.some(c => c.name.includes('DATA FUNNEL PRO')), 'appareil B récupère les clients de l’appareil A');
    const cache = await lsdb(page);
    ok(cache.clients.length === d.clients.length, 'LocalStorage = cache du cloud sur l’appareil B');
  }

  /* ================================================================ */
  console.log('\n[5] Sync automatique A → cloud → B (debounce + pull visibilité)');
  {
    deviceA = await newDevice(browser);
    await deviceA.page.goto(APP, { waitUntil: 'networkidle' });
    await login(deviceA.page, 'they@studio.ma', 'secret123');
    await addClient(deviceA.page, 'SyncTest SARL');
    await sleep(2200); // debounce 1.5s + marge
    const d = await dump();
    ok(cloudRowsFor(d, 'they@studio.ma', 'clients').some(r => r.name === 'SyncTest SARL'),
      'push automatique après save() (debounce)');
    await deviceB.page.evaluate(() => cloudPull());
    await sleep(300);
    ok((await db(deviceB.page)).clients.some(c => c.name === 'SyncTest SARL'),
      'pull sur l’appareil B → nouvelle ligne visible');
  }

  /* ================================================================ */
  console.log('\n[6] Offline-first — édition hors ligne, resync au retour du réseau');
  {
    const { ctx, page } = deviceA;
    await ctx.setOffline(true);
    await addClient(page, 'OfflineAdd SARL');
    await sleep(2200); // le push échoue
    ok((await syncSt(page)).dirty === true, 'dirty=true persiste après push raté');
    ok(await page.evaluate(() => Cloud.status) === 'pending', 'statut = en attente');
    ok((await lsdb(page)).clients.some(c => c.name === 'OfflineAdd SARL'), 'donnée sauvée localement hors ligne');
    let d = await dump();
    ok(!cloudRowsFor(d, 'they@studio.ma', 'clients').some(r => r.name === 'OfflineAdd SARL'), 'cloud pas encore au courant');
    await ctx.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await sleep(600);
    d = await dump();
    ok(cloudRowsFor(d, 'they@studio.ma', 'clients').some(r => r.name === 'OfflineAdd SARL'),
      'event online → push automatique du travail hors ligne');
    ok((await syncSt(page)).dirty === false, 'dirty=false après resync');
  }

  /* ================================================================ */
  console.log('\n[7] Conflits — LWW par ligne (la modification la plus récente gagne)');
  {
    // A et B synchronisés; les deux éditent le même client hors ligne
    await deviceB.page.evaluate(() => cloudPull()); await sleep(300);
    const target = 'SyncTest SARL';
    await deviceA.ctx.setOffline(true);
    await deviceB.ctx.setOffline(true);
    await deviceA.page.evaluate(n => { DB.clients.find(c => c.name === n).notes = 'edit-A'; save(); }, target);
    await sleep(30); // B édite APRÈS A → B doit gagner
    await deviceB.page.evaluate(n => { DB.clients.find(c => c.name === n).notes = 'edit-B'; save(); }, target);
    await deviceA.ctx.setOffline(false);
    await deviceA.page.evaluate(() => window.dispatchEvent(new Event('online')));
    await sleep(500);
    let d = await dump();
    ok(cloudRowsFor(d, 'they@studio.ma', 'clients').find(r => r.name === target).notes === 'edit-A',
      'A (plus ancien) pousse en premier');
    await deviceB.ctx.setOffline(false);
    await deviceB.page.evaluate(() => window.dispatchEvent(new Event('online')));
    await sleep(500);
    await deviceB.page.evaluate(() => cloudPull()); await sleep(400);
    d = await dump();
    ok(cloudRowsFor(d, 'they@studio.ma', 'clients').find(r => r.name === target).notes === 'edit-B',
      'B (plus récent) gagne le conflit sur le cloud (LWW)');
    await deviceA.page.evaluate(() => cloudPull()); await sleep(400);
    ok((await db(deviceA.page)).clients.find(c => c.name === target).notes === 'edit-B',
      'A converge vers la version gagnante');
  }

  /* ================================================================ */
  console.log('\n[8] Suppressions sûres — jamais d’effacement des lignes des autres appareils');
  {
    // A supprime "OfflineAdd SARL" hors ligne, B ajoute "NewFromB" en ligne
    await deviceA.ctx.setOffline(true);
    await deviceA.page.evaluate(() => { DB.clients = DB.clients.filter(c => c.name !== 'OfflineAdd SARL'); save(); });
    await addClient(deviceB.page, 'NewFromB SA');
    await sleep(2200);
    let d = await dump();
    ok(cloudRowsFor(d, 'they@studio.ma', 'clients').some(r => r.name === 'NewFromB SA'), 'B a poussé sa nouvelle ligne');
    await deviceA.ctx.setOffline(false);
    // A revient: pull-merge doit garder NewFromB (créée ailleurs) ET supprimer OfflineAdd (tombstone)
    await deviceA.page.evaluate(() => cloudPull()); await sleep(500);
    d = await dump();
    const names = cloudRowsFor(d, 'they@studio.ma', 'clients').map(r => r.name);
    ok(!names.includes('OfflineAdd SARL'), 'suppression locale propagée au cloud');
    ok(names.includes('NewFromB SA'), 'la ligne créée par B a survécu au push de A (bug Sprint 11 corrigé)');
    const dbA = await db(deviceA.page);
    ok(dbA.clients.some(c => c.name === 'NewFromB SA'), 'A voit la ligne de B');
    ok(!dbA.clients.some(c => c.name === 'OfflineAdd SARL'), 'A ne voit plus la ligne supprimée');
    await deviceB.page.evaluate(() => cloudPull()); await sleep(400);
    ok(!(await db(deviceB.page)).clients.some(c => c.name === 'OfflineAdd SARL'), 'suppression propagée à B');
  }

  /* ================================================================ */
  console.log('\n[9] Round-trip complet des champs (tâche avec projetId + details)');
  {
    await deviceA.page.evaluate(() => {
      const p = DB.projets[0];
      DB.taches.push({ id: uid(), label: 'RT test', clientId: DB.clients[0].id, projetId: p ? p.id : '', statut: 'À faire', priorite: '🔴 Urgent', deadline: '2026-08-01', details: 'détails précieux' });
      save();
    });
    await sleep(2200);
    await deviceB.page.evaluate(() => cloudPull()); await sleep(400);
    const t = (await db(deviceB.page)).taches.find(x => x.label === 'RT test');
    ok(!!t, 'tâche synchronisée vers B');
    ok(t && t.details === 'détails précieux', 'champ details préservé (colonne ajoutée au schéma)');
    ok(t && !!t.projetId, 'champ projetId préservé');
  }

  /* ================================================================ */
  console.log('\n[10] Isolation par utilisateur (RLS) — un autre compte ne voit rien');
  {
    const { ctx, page } = await newDevice(browser);
    await page.goto(APP, { waitUntil: 'networkidle' });
    // ce navigateur a un seed local à lui; il crée un compte différent
    await login(page, 'autre@compte.ma', 'secret456', true);
    const d = await db(page);
    ok(!d.clients.some(c => c.name === 'SyncTest SARL'), 'le compte B ne voit pas les données du compte A');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[11] Compteurs facture/BL (meta) — max des deux côtés');
  {
    await deviceA.page.evaluate(() => { DB.factureCounter = 7; save(); });
    await sleep(2200);
    await deviceB.page.evaluate(() => { DB.factureCounter = 3; return cloudPull(); });
    await sleep(400);
    ok(await deviceB.page.evaluate(() => DB.factureCounter) === 7, 'merge des compteurs: max(3,7)=7');
  }

  /* ================================================================ */
  console.log('\n[12] Reprise de session — reload = pas de re-login, sync directe');
  {
    await deviceA.page.reload({ waitUntil: 'networkidle' });
    await sleep(800);
    ok(!(await deviceA.page.$('#authGate')), 'session persistée (pas d’écran de connexion)');
    ok(await deviceA.page.evaluate(() => Cloud.status) === 'ok', 'sync relancée au boot');
  }

  /* ================================================================ */
  console.log('\n[13] "Continuer sans cloud" — l’app n’est jamais bloquée');
  {
    const { ctx, page } = await newDevice(browser);
    await page.goto(APP, { waitUntil: 'networkidle' });
    await page.waitForSelector('#authGate');
    await page.click('text=Continuer sans cloud');
    ok(!(await page.$('#authGate')), 'gate fermé');
    await addClient(page, 'NoCloud Co');
    ok((await lsdb(page)).clients.some(c => c.name === 'NoCloud Co'), 'l’app reste utilisable en local');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[14] Diagnostic auto — schéma SQL non exécuté détecté + explication');
  {
    await fetch(MOCK + '/__schema?missing=1');
    const { ctx, page } = await newDevice(browser);
    await page.goto(APP, { waitUntil: 'networkidle' });
    await page.waitForSelector('#authGate');
    const checks = await page.evaluate(() => cloudDiagChecks());
    const schemaCheck = checks.find(c => /introuvable|Tables/i.test(c.label));
    ok(!!schemaCheck && !schemaCheck.ok, 'tables manquantes détectées');
    ok(!!schemaCheck && /schema\.sql/.test(schemaCheck.fix), 'fix exact proposé: exécuter supabase/schema.sql');
    await page.evaluate(() => openCloudDiag());
    await sleep(500);
    ok(!!(await page.$('#cloudDiag')), 'panneau de diagnostic affiché');
    await fetch(MOCK + '/__schema?missing=0');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[15] Diagnostic — config vide et mauvaise URL expliquées');
  {
    const { ctx, page } = await newDevice(browser, { cloud: false });
    await page.goto(APP, { waitUntil: 'networkidle' });
    const c1 = await page.evaluate(() => cloudDiagChecks());
    ok(c1.length === 1 && /SUPABASE_SETUP/.test(c1[0].fix), 'config vide → renvoie vers SUPABASE_SETUP.md');
    const c2 = await page.evaluate(() => {
      window.SUPABASE_CONFIG = { url: 'pas-une-url', anonKey: 'x' };
      return cloudDiagChecks();
    });
    ok(c2.some(c => !c.ok && /URL/.test(c.label)), 'URL invalide détectée');
    await ctx.close();
  }

  /* ================================================================ */
  await deviceA.ctx.close(); await deviceB.ctx.close();
  await browser.close(); app.close(); mock.close();
  console.log(`\n========== RÉSULTAT: ${passed} ✓ / ${failed} ✗ ==========`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
