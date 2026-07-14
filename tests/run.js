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

/* contexte navigateur = "un appareil" (timezoneId: fuseau horaire simulé — Sprint 17) */
async function newDevice(browser, { cloud = true, timezoneId } = {}) {
  const ctx = await browser.newContext(timezoneId ? { timezoneId } : {});
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1')); // bypass PIN (testé à part)
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({
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
  console.log('\n[16] Seed anti-réinjection — la démo ne revient JAMAIS après un reset');
  {
    const { ctx, page } = await newDevice(browser, { cloud: false });
    await page.goto(APP, { waitUntil: 'networkidle' });
    await sleep(400);
    ok((await db(page)).clients.some(c => c.name.includes('Client Exemple')), 'premier lancement: seed créé une fois');
    ok(await page.evaluate(() => localStorage.getItem('they_seeded_v1')) === '1', 'marqueur persistant posé');
    // reset volontaire: l'utilisateur supprime toutes ses données (la clé DB disparaît)
    await page.evaluate(() => localStorage.removeItem('crm_gestion_clients_v1'));
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(400);
    const d1 = await db(page);
    ok(d1.clients.length === 0, 'après reset: base VIDE — seed non réinjecté');
    ok(!(await lsdb(page)) || (await lsdb(page)).clients.every(c => !c.name.includes('Client Exemple')), 'aucune démo recréée en storage');
    // suppression manuelle de tous les clients (DB existe mais vide) + reload
    await page.evaluate(() => { DB.clients = []; DB.projets = []; DB.taches = []; DB.paiements = []; save(); });
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(400);
    ok((await db(page)).clients.length === 0, 'tout supprimé manuellement + reload: toujours vide');
    // corruption du JSON: ne doit PAS écraser par la démo
    await page.evaluate(() => localStorage.setItem('crm_gestion_clients_v1', '{corrompu'));
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(400);
    ok(!(await db(page)).clients.some(c => c.name.includes('Client Exemple')), 'données corrompues: pas de réinjection de démo');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[17] Restore — ne rend JAMAIS la démo, uniquement les données choisies');
  {
    const { ctx, page } = await newDevice(browser, { cloud: false });
    page.on('dialog', d => d.accept()); // confirm() de restoreSnapshot
    await page.goto(APP, { waitUntil: 'networkidle' });
    await sleep(400);
    // 17.a — au premier boot (démo intacte): AUCUN snapshot n'est pris
    ok(await page.evaluate(() => localStorage.getItem('they_demo_v1')) === '1', 'drapeau "démo intacte" posé au premier boot');
    ok(await page.evaluate(() => localStorage.getItem('they_snap_1')) === null, 'la démo intacte n’est JAMAIS snapshotée');
    // 17.b — purge des snapshots pollués par l'ancien bug (snapshot de démo hérité)
    await page.evaluate(() => localStorage.setItem('they_snap_1', JSON.stringify({ date: '2026-07-10', db: DB })));
    await page.reload({ waitUntil: 'networkidle' }); await sleep(400);
    ok(await page.evaluate(() => localStorage.getItem('they_snap_1')) === null, 'snapshot de démo hérité purgé au boot');
    // 17.b2 — snapshot de démo DUPLIQUÉE (4 clients — fusion v21/v22) : purgé aussi
    await page.evaluate(() => {
      const dup = JSON.parse(JSON.stringify(DB));
      dup.clients = [...dup.clients, ...dup.clients.map(c => ({ ...c, id: c.id + 'x' }))];       // 4 clients
      dup.paiements = [...dup.paiements, ...dup.paiements.map(p => ({ ...p, id: p.id + 'x' }))]; // 8 paiements
      dup.taches = [...dup.taches, ...dup.taches.map(t => ({ ...t, id: t.id + 'x' }))];           // 6 tâches
      dup.projets = [...dup.projets, ...dup.projets.map(p => ({ ...p, id: p.id + 'x' }))];        // 2 projets
      localStorage.setItem('they_snap_1', JSON.stringify({ date: '2026-07-11', db: dup }));
      localStorage.setItem('they_snap_2', JSON.stringify({ date: '2026-07-10', db: dup }));
    });
    await page.reload({ waitUntil: 'networkidle' }); await sleep(400);
    ok(await page.evaluate(() => localStorage.getItem('they_snap_1')) === null
      && await page.evaluate(() => localStorage.getItem('they_snap_2')) === null,
      'snapshot de démo DUPLIQUÉE (4 clients) purgé au boot — bug "Restore rend 4 démos" corrigé');
    // 17.b3 — même si un snapshot démo dupliquée réapparaissait, restoreSnapshot le refuse
    await page.evaluate(() => {
      const dup = JSON.parse(JSON.stringify(DB));
      dup.clients = [...dup.clients, ...dup.clients.map(c => ({ ...c, id: c.id + 'y' }))];
      localStorage.setItem('they_snap_1', JSON.stringify({ date: '2026-07-11', db: dup }));
      return restoreSnapshot(0);
    });
    await sleep(200);
    ok((await db(page)).clients.length === 2 && await page.evaluate(() => localStorage.getItem('they_snap_1')) === null,
      'restoreSnapshot REFUSE et supprime un snapshot de démo dupliquée (données actuelles intactes)');
    // 17.c — restore d'un VRAI backup → seules les données réelles reviennent
    await page.evaluate(() => {
      DB.clients = [{ id: uid(), name: 'RealCo SARL', type: 'projet', statut: 'Actif', devise: 'DH' }];
      DB.projets = []; DB.taches = []; DB.paiements = []; DB.events = []; save();
      takeSnapshot();
      localStorage.setItem('they_snap_2', localStorage.getItem('they_snap_1')); // copie pour 17.e
    });
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem('they_snap_1')).db.clients[0].name) === 'RealCo SARL', 'snapshot des données réelles pris après 1ère modif');
    await page.evaluate(() => { DB.clients = []; save(); return restoreSnapshot(0); });
    await sleep(200);
    let d = await db(page);
    ok(d.clients.length === 1 && d.clients[0].name === 'RealCo SARL', 'restore réel → uniquement les données réelles');
    ok(!d.clients.some(c => /Mouhamed K\.|Client Exemple/.test(c.name)), 'aucune démo après restore réel');
    // 17.d — restore d'un backup VIDE → la base reste VIDE
    await page.evaluate(() => {
      localStorage.setItem('they_snap_1', JSON.stringify({ date: '2026-07-12', db: { clients: [], projets: [], taches: [], paiements: [], events: [] } }));
      return restoreSnapshot(0);
    });
    await sleep(200);
    d = await db(page);
    ok(d.clients.length === 0, 'restore d’un backup vide → base vide, rien d’injecté');
    // 17.e — restore APRÈS reset → seed ne tourne jamais
    await page.evaluate(() => localStorage.removeItem('crm_gestion_clients_v1'));
    await page.reload({ waitUntil: 'networkidle' }); await sleep(400);
    ok((await db(page)).clients.length === 0, 'après reset: base vide (pas de seed)');
    await page.evaluate(() => restoreSnapshot(1)); await sleep(200);
    d = await db(page);
    ok(d.clients.length === 1 && d.clients[0].name === 'RealCo SARL', 'restore après reset → données réelles, jamais la démo');
    // 17.f — backup corrompu → erreur propre, données actuelles intactes, zéro démo
    await page.evaluate(() => { localStorage.setItem('they_snap_1', '{corrompu'); return restoreSnapshot(0); });
    await sleep(200);
    d = await db(page);
    ok(d.clients.length === 1 && d.clients[0].name === 'RealCo SARL', 'backup corrompu: données actuelles préservées, pas de démo');
    await ctx.close();
  }

  /* ================================================================ */
  console.log('\n[18] Restore depuis le cloud — la démo locale intacte n’est jamais fusionnée ni poussée');
  {
    // appareil X: compte neuf avec UNIQUEMENT des données réelles
    const X = await newDevice(browser);
    await X.page.goto(APP, { waitUntil: 'networkidle' });
    await X.page.evaluate(() => {
      DB.clients = [{ id: uid(), name: 'CloudReal SARL', type: 'projet', statut: 'Actif', devise: 'DH' }];
      DB.projets = []; DB.taches = []; DB.paiements = []; DB.events = []; save();
    });
    await login(X.page, 'restore@test.ma', 'secret789', true);
    // appareil Y: navigateur neuf → seed démo intact, puis login sur le compte existant
    const Y = await newDevice(browser);
    await Y.page.goto(APP, { waitUntil: 'networkidle' });
    ok((await db(Y.page)).clients.length === 2, 'appareil Y: démo locale avant login (navigateur neuf)');
    await login(Y.page, 'restore@test.ma', 'secret789');
    await sleep(400);
    const dy = await db(Y.page);
    ok(dy.clients.length === 1 && dy.clients[0].name === 'CloudReal SARL', 'après login: UNIQUEMENT les données du cloud, démo jetée');
    const dump18 = await dump();
    const cloudNames = cloudRowsFor(dump18, 'restore@test.ma', 'clients').map(r => r.name);
    ok(cloudNames.length === 1 && cloudNames[0] === 'CloudReal SARL', 'cloud: aucune démo poussée — données réelles intactes');
    await X.ctx.close(); await Y.ctx.close();
  }

  /* ================================================================ */
  console.log('\n[19] Timezone (Sprint 17) — dates locales, jamais UTC (Maroc UTC+1 + garde UTC)');
  {
    /* 19.a — Maroc (UTC+1), midi local: grille du mois, semaine, chart revenus */
    const { ctx, page } = await newDevice(browser, { cloud: false, timezoneId: 'Africa/Casablanca' });
    await page.goto(APP, { waitUntil: 'networkidle' });
    await page.clock.setFixedTime(new Date('2026-07-13T12:00:00+01:00'));
    const cell13 = await page.evaluate(() => monthCells(2026, 6).find(c => c.day === 13 && !c.out));
    ok(cell13 && cell13.iso === '2026-07-13', `monthCells: cellule 13 → iso 2026-07-13 (obtenu ${cell13 && cell13.iso})`);
    ok((await page.evaluate(() => monthCells(2026, 6)[0].iso)) === '2026-06-29', 'monthCells: 1ère cellule = lundi 29 juin');
    ok((await page.evaluate(() => weekCells(new Date())))[0] === '2026-07-13', 'weekCells: la semaine commence lundi 13');
    ok((await page.evaluate(() => CAL_TODAY())) === '2026-07-13', 'CAL_TODAY = date locale');
    const todayLbl = await page.evaluate(() => {
      go('calendrier'); Cal.cur = new Date(); Cal.view = 'mois'; renderCalendar();
      const el = document.querySelector('.cal-cell.today .dnum'); return el ? el.textContent : '';
    });
    ok(todayLbl === '13', `vue mois: pastille "today" sur la cellule 13 (obtenu ${todayLbl})`);
    const evCell = await page.evaluate(() => {
      DB.events.push({ id: uid(), title: 'RDV-TZ', type: 'Réunion', date: '2026-07-13', notes: '' });
      save(); renderCalendar();
      const chip = [...document.querySelectorAll('.cal-ev')].find(e => e.textContent.includes('RDV-TZ'));
      return chip ? chip.closest('.cal-cell').querySelector('.dnum').textContent : '';
    });
    ok(evCell === '13', `vue mois: événement du 13 dans la cellule 13 (obtenu ${evCell})`);
    const wkCol = await page.evaluate(() => {
      calView('semaine');
      const chip = [...document.querySelectorAll('.cal-ev')].find(e => e.textContent.includes('RDV-TZ'));
      return chip ? chip.closest('.cal-wday').querySelector('h5').textContent : '';
    });
    ok(/13/.test(wkCol), `vue semaine: événement du 13 dans la colonne "13" (obtenu "${wkCol}")`);
    const bucket = await page.evaluate(() => {
      DB.paiements.push({ id: uid(), clientId: DB.clients[0] ? DB.clients[0].id : '', projetId: '', label: 'TZ pay', type: 'Acompte', montant: 500, devise: 'DH', statut: 'Payé', date: '2026-07-05', methode: 'Cash', notes: '' });
      save(); const m = monthlyRevenue('DH'); return m[m.length - 1];
    });
    ok(bucket.key === '2026-07' && bucket.sum >= 500, `monthlyRevenue: bucket courant 2026-07 (obtenu ${bucket.key})`);
    await ctx.close();

    /* 19.b — Maroc, 00h30 locale (fenêtre critique: date UTC = veille) */
    const B = await newDevice(browser, { cloud: false, timezoneId: 'Africa/Casablanca' });
    await B.page.goto(APP, { waitUntil: 'networkidle' });
    await B.page.clock.setFixedTime(new Date('2026-07-13T00:30:00+01:00')); // = 2026-07-12T23:30Z
    ok((await B.page.evaluate(() => CAL_TODAY())) === '2026-07-13', 'CAL_TODAY à 00h30 locale = 13 (pas la date UTC 12)');
    ok((await B.page.evaluate(() => isOverdue({ statut: 'En attente', date: '2026-07-12' }))) === true, 'isOverdue: dû hier (local) = en retard');
    const kpi = await B.page.evaluate(() => {
      DB.paiements.push({ id: uid(), clientId: DB.clients[0] ? DB.clients[0].id : '', projetId: '', label: 'TZ today', type: 'Acompte', montant: 777, devise: 'DH', statut: 'Payé', date: '2026-07-13', methode: 'Cash', notes: '' });
      save(); go('dash'); renderDash();
      const card = [...document.querySelectorAll('#statCards .stat')].find(s => s.querySelector('.lbl').textContent === "Aujourd'hui");
      return card.querySelector('.val').textContent.trim();
    });
    ok(/777/.test(kpi), `KPI "Aujourd'hui" compte le paiement du jour local (obtenu "${kpi}")`);
    await B.ctx.close();

    /* 19.c — garde de régression: en UTC pur, comportement inchangé */
    const C = await newDevice(browser, { cloud: false, timezoneId: 'UTC' });
    await C.page.goto(APP, { waitUntil: 'networkidle' });
    await C.page.clock.setFixedTime(new Date('2026-07-13T12:00:00Z'));
    const uc = await C.page.evaluate(() => monthCells(2026, 6).find(c => c.day === 13 && !c.out));
    ok(uc && uc.iso === '2026-07-13', 'UTC: monthCells cellule 13 inchangée');
    ok((await C.page.evaluate(() => weekCells(new Date())))[0] === '2026-07-13', 'UTC: weekCells inchangé');
    ok((await C.page.evaluate(() => CAL_TODAY())) === '2026-07-13', 'UTC: CAL_TODAY inchangé');
    const ub = await C.page.evaluate(() => {
      DB.paiements.push({ id: uid(), clientId: '', projetId: '', label: 'TZ utc', type: 'Acompte', montant: 300, devise: 'DH', statut: 'Payé', date: '2026-07-05', methode: 'Cash', notes: '' });
      save(); const m = monthlyRevenue('DH'); return m[m.length - 1];
    });
    ok(ub.key === '2026-07', 'UTC: monthlyRevenue bucket courant inchangé');
    await C.ctx.close();
  }

  /* ================================================================ */
  console.log('\n[20] Intégrité référentielle — cascade delete, orphelins (fix critique)');
  {
    /* 20.a — delClient doit supprimer TOUTES les entités dépendantes, y compris events */
    const { ctx, page } = await newDevice(browser, { cloud: false });
    page.on('dialog', d => d.accept());
    await page.goto(APP, { waitUntil: 'networkidle' });
    await sleep(400);
    await page.evaluate(() => {
      const c1 = DB.clients[0];
      DB.events.push({ id: uid(), title: 'Ev lié', type: 'Réunion', date: '2026-07-20', clientId: c1.id, notes: '' });
      DB.events.push({ id: uid(), title: 'Ev perso', type: 'Personnel', date: '2026-07-21', clientId: '', notes: '' });
      save();
    });
    await page.evaluate(() => delClient(DB.clients[0].id));
    await sleep(150);
    let d = await db(page);
    ok(!d.events.some(e => e.title === 'Ev lié'), 'delClient supprime aussi les events du client');
    ok(d.events.some(e => e.title === 'Ev perso'), 'les events SANS client (personnels) survivent');
    await page.evaluate(() => delClient(DB.clients[0].id));
    await sleep(150);
    d = await db(page);
    ok(d.clients.length === 0 && d.projets.length === 0 && d.taches.length === 0 && d.paiements.length === 0,
      `suppression de tous les clients → zéro dépendant (obtenu p=${d.projets.length} t=${d.taches.length} y=${d.paiements.length})`);
    /* 20.b — delProjet ne laisse pas de projetId pendant sur les tâches */
    await page.evaluate(() => {
      const c = { id: uid(), name: 'IntegCo', type: 'projet', statut: 'Actif', devise: 'DH' };
      const p = { id: uid(), clientId: c.id, name: 'Proj', statut: 'En cours', prix: 100 };
      DB.clients.push(c); DB.projets.push(p);
      DB.taches.push({ id: uid(), clientId: c.id, projetId: p.id, label: 'T-dangling', statut: 'À faire' });
      save(); delProjet(p.id);
    });
    await sleep(150);
    d = await db(page);
    ok(d.taches.length === 1 && !d.taches[0].projetId, 'delProjet nettoie projetId des tâches (référence pendante)');
    await ctx.close();

    /* 20.c — état réel du bug: orphelins hérités en storage → purgés au boot, KPIs à zéro */
    const ORPHANS = {
      clients: [],
      projets: [{ id: 'p1', clientId: 'ghost1', name: 'Orphan Proj', statut: 'En cours', prix: 600 }],
      taches: [{ id: 't1', clientId: 'ghost1', label: 'T1', statut: 'À faire' }, { id: 't2', clientId: 'ghost1', label: 'T2', statut: 'À faire' }, { id: 't3', clientId: 'ghost2', label: 'T3', statut: 'En cours' }],
      paiements: [{ id: 'y1', clientId: 'ghost1', label: 'Acompte', montant: 300, devise: 'DH', statut: 'Payé', date: '2026-06-20' }, { id: 'y2', clientId: 'ghost1', label: 'Solde', montant: 300, devise: 'DH', statut: 'En attente', date: '2026-07-20' }, { id: 'y3', clientId: 'ghost2', label: 'Salaire', montant: 800, devise: 'DH', statut: 'Payé', date: '2026-07-01' }, { id: 'y4', clientId: 'ghost2', label: 'Bonus', montant: 2000, devise: 'DH', statut: 'Payé', date: '2026-07-05' }],
      events: []
    };
    const C = await newDevice(browser, { cloud: false });
    await C.ctx.addInitScript(o => {
      localStorage.setItem('crm_gestion_clients_v1', JSON.stringify(o));
      localStorage.setItem('they_seeded_v1', '1');
    }, ORPHANS);
    const pageC = await C.ctx.newPage();
    await pageC.goto(APP, { waitUntil: 'networkidle' });
    await sleep(400);
    d = await db(pageC);
    ok(d.projets.length === 0 && d.taches.length === 0 && d.paiements.length === 0,
      `boot: orphelins hérités purgés (obtenu p=${d.projets.length} t=${d.taches.length} y=${d.paiements.length})`);
    const kpi = await pageC.evaluate(() => {
      go('dash'); renderDash();
      return [...document.querySelectorAll('#statCards .stat')].find(s => s.querySelector('.lbl').textContent === 'Total encaissé').querySelector('.val').textContent.trim();
    });
    ok(/^0\s?DH$/.test(kpi), `dashboard: Total encaissé = 0 DH après purge (obtenu "${kpi}")`);
    ok(await pageC.evaluate(() => { const r = JSON.parse(localStorage.getItem('they_rescue_orphans') || 'null'); return r && r.rows.paiements.length === 4 }),
      'filet de sécurité: les orphelins purgés au boot sont conservés dans they_rescue_orphans');
    await C.ctx.close();

    /* 20.d — Import JSON contenant des orphelins → nettoyé à l'entrée */
    const D = await newDevice(browser, { cloud: false });
    await D.page.goto(APP, { waitUntil: 'networkidle' });
    await sleep(300);
    const importPayload = {
      clients: [{ id: 'c9', name: 'RealImport', type: 'projet', statut: 'Actif', devise: 'DH' }],
      projets: [], taches: [],
      paiements: [
        { id: 'k1', clientId: 'c9', label: 'Légitime', montant: 100, devise: 'DH', statut: 'Payé', date: '2026-07-01' },
        { id: 'k2', clientId: 'ghostX', label: 'Orphelin', montant: 999, devise: 'DH', statut: 'Payé', date: '2026-07-02' }],
      events: []
    };
    fs.writeFileSync('/tmp/import-orphans.json', JSON.stringify(importPayload));
    await D.page.setInputFiles('#importFile', '/tmp/import-orphans.json');
    await sleep(300);
    d = await db(D.page);
    ok(d.paiements.length === 1 && d.paiements[0].label === 'Légitime', 'import: orphelin rejeté, ligne légitime conservée');
    /* 20.e — Restore d'un snapshot contenant des orphelins → nettoyé */
    D.page.on('dialog', x => x.accept());
    await D.page.evaluate(o => {
      o.clients = [{ id: 'c9', name: 'RealImport', type: 'projet', statut: 'Actif', devise: 'DH' }];
      localStorage.setItem('they_snap_1', JSON.stringify({ date: '2026-07-12', db: o }));
      return restoreSnapshot(0);
    }, importPayload);
    await sleep(200);
    d = await db(D.page);
    ok(d.paiements.length === 1 && d.paiements[0].label === 'Légitime', 'restore: orphelins du snapshot purgés, données réelles restaurées');
    await D.ctx.close();

    /* 20.f — Cloud: la suppression cascade se propage; le pull ne ressuscite pas d'orphelins */
    await fetch(MOCK + '/__reset');
    const A2 = await newDevice(browser);
    A2.page.on('dialog', x => x.accept());
    await A2.page.goto(APP, { waitUntil: 'networkidle' });
    await A2.page.evaluate(() => {
      const c = { id: 'cc1', name: 'CloudCascade', type: 'projet', statut: 'Actif', devise: 'DH' };
      DB.clients = [c]; DB.projets = []; DB.events = [{ id: 'ee1', title: 'EvCloud', type: 'Réunion', date: '2026-07-20', clientId: 'cc1', notes: '' }];
      DB.taches = [{ id: 'tt1', clientId: 'cc1', label: 'TCloud', statut: 'À faire' }]; DB.paiements = []; save();
    });
    await login(A2.page, 'cascade@test.ma', 'secret123', true);
    const B2 = await newDevice(browser);
    await B2.page.goto(APP, { waitUntil: 'networkidle' });
    await login(B2.page, 'cascade@test.ma', 'secret123');
    ok((await db(B2.page)).events.some(e => e.id === 'ee1'), 'B a reçu l’event du client (pré-condition)');
    await A2.page.evaluate(() => delClient('cc1'));
    await sleep(2200); // push debounce
    let dumpF = await dump();
    const rowsF = t => cloudRowsFor(dumpF, 'cascade@test.ma', t);
    ok(rowsF('clients').length === 0 && rowsF('taches').length === 0 && rowsF('events').length === 0,
      'cloud: cascade complète propagée (client + tâches + events supprimés)');
    await B2.page.evaluate(() => cloudPull()); await sleep(400);
    d = await db(B2.page);
    ok(d.clients.length === 0 && d.taches.length === 0 && d.events.length === 0, 'B converge: zéro orphelin après pull');
    /* orphelin injecté au cloud (simule un historique sale) → le pull le refuse */
    await B2.page.evaluate(async () => {
      await Cloud.client.from('taches').upsert([{ id: 'ttX', client_id: 'ghost-cloud', label: 'OrphCloud', statut: 'À faire', updated_at: new Date().toISOString() }]);
      return cloudPull();
    });
    await sleep(400);
    d = await db(B2.page);
    ok(!d.taches.some(t => t.id === 'ttX'), 'pull: un orphelin présent au cloud n’est pas adopté localement');
    await A2.ctx.close(); await B2.ctx.close();
  }

  /* ================================================================ */
  console.log('\n[21] Multi-instance — onglets/PWA simultanés + offline→online (fix critique)');
  {
    /* 21.a — 2 onglets même navigateur (= PWA installée + onglet), mode LOCAL */
    const { ctx, page: tabStale } = await newDevice(browser, { cloud: false });
    await tabStale.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    const tabActive = await ctx.newPage();
    await tabActive.goto(APP, { waitUntil: 'networkidle' }); await sleep(500);
    tabActive.on('dialog', d => d.accept());
    const victim = await tabActive.evaluate(() => DB.clients[1].name);
    await addClient(tabActive, 'MT-Fresh');
    await tabActive.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, victim);
    await sleep(300);
    /* sync active: l'onglet "oublié" a déjà adopté les changements via l'event storage */
    let staleView = await db(tabStale);
    ok(staleView.clients.some(c => c.name === 'MT-Fresh') && !staleView.clients.some(c => c.name === victim),
      'storage event → l’autre onglet adopte immédiatement (création visible, suppression appliquée)');
    /* relire-avant-d'écrire: un save() de l'onglet 1 n'écrase plus rien */
    await tabStale.evaluate(() => { DB.clients[0].notes = 'edit-tab1'; save(); });
    await sleep(200);
    const disk = await lsdb(tabActive);
    ok(disk.clients.some(c => c.name === 'MT-Fresh'), 'la création de l’onglet actif SURVIT au save de l’autre onglet');
    ok(!disk.clients.some(c => c.name === victim), 'la suppression reste appliquée (pas de résurrection locale)');
    ok(disk.clients.some(c => c.notes === 'edit-tab1'), 'l’édition de l’onglet 1 est fusionnée (LWW), pas perdue');
    await tabActive.reload({ waitUntil: 'networkidle' }); await sleep(400);
    const seen = await db(tabActive);
    ok(seen.clients.some(c => c.name === 'MT-Fresh') && !seen.clients.some(c => c.name === victim),
      'après refresh: état cohérent (bug impossible à reproduire en local)');
    await ctx.close();

    /* 21.b — 2 onglets + CLOUD: le cloud reste intact */
    await fetch(MOCK + '/__reset');
    const C2 = await newDevice(browser);
    await C2.page.goto(APP, { waitUntil: 'networkidle' }); await sleep(400);
    await C2.page.evaluate(() => { DB.clients[0].notes = 'base réelle'; save(); });
    await login(C2.page, 'mt@test.ma', 'secret123', true);
    const tab2 = await C2.ctx.newPage();
    await tab2.goto(APP, { waitUntil: 'networkidle' }); await sleep(1000);
    tab2.on('dialog', d => d.accept());
    const victim2 = await tab2.evaluate(() => DB.clients[1].name);
    await addClient(tab2, 'MT-CloudFresh');
    await tab2.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, victim2);
    await sleep(2300); // push debounce tab2
    await C2.page.evaluate(() => { DB.clients[0].notes = 'edit-après'; save(); });
    await sleep(2300); // push debounce tab1
    let cn = cloudRowsFor(await dump(), 'mt@test.ma', 'clients').map(r => r.name);
    ok(cn.includes('MT-CloudFresh'), 'CLOUD: la création n’est plus supprimée par le diff baseIds d’un onglet périmé');
    ok(!cn.includes(victim2), 'CLOUD: le client supprimé n’est plus ressuscité par l’upsert d’un onglet périmé');
    await C2.ctx.close();

    /* 21.c — DEUX APPAREILS, offline→online: pas de résurrection (nécessité du pull-avant-push) */
    await fetch(MOCK + '/__reset');
    const X = await newDevice(browser);
    await X.page.goto(APP, { waitUntil: 'networkidle' }); await sleep(400);
    X.page.on('dialog', d => d.accept());
    await X.page.evaluate(() => { DB.clients[0].notes = 'base'; save(); });
    await login(X.page, 'resur@test.ma', 'secret123', true);
    const Y = await newDevice(browser);
    await Y.page.goto(APP, { waitUntil: 'networkidle' });
    await login(Y.page, 'resur@test.ma', 'secret123');
    const victimX = await X.page.evaluate(() => DB.clients[1].name);
    await Y.ctx.setOffline(true);
    await Y.page.evaluate(() => { DB.clients[0].notes = 'y-edit-offline'; save(); }); // Y devient dirty, mémoire périmée
    await X.page.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, victimX);
    await sleep(2300); // suppression poussée au cloud par X
    ok(!cloudRowsFor(await dump(), 'resur@test.ma', 'clients').map(r => r.name).includes(victimX), 'pré-condition: suppression de X au cloud');
    await Y.ctx.setOffline(false);
    await Y.page.evaluate(() => window.dispatchEvent(new Event('online')));
    await sleep(1200);
    cn = cloudRowsFor(await dump(), 'resur@test.ma', 'clients').map(r => r.name);
    ok(!cn.includes(victimX), 'online: le client supprimé ailleurs n’est PAS ressuscité par l’appareil qui revient');
    const yState = await db(Y.page);
    ok(!yState.clients.some(c => c.name === victimX), 'l’appareil qui revient converge (suppression adoptée)');
    ok(cloudRowsFor(await dump(), 'resur@test.ma', 'clients').some(r => r.notes === 'y-edit-offline'),
      'offline-first préservé: l’édition hors ligne de Y est bien poussée après le pull');
    ok((await syncSt(Y.page)).dirty === false, 'dirty=false après le cycle pull→push');

    /* 21.d — course online + visibilitychange simultanés: un seul pull (réentrance), état final cohérent */
    await Y.ctx.setOffline(true);
    await Y.page.evaluate(() => { DB.clients[0].notes = 'race-edit'; save(); });
    await Y.ctx.setOffline(false);
    await Y.page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange')); // co-déclenchement volontaire
    });
    await sleep(1200);
    cn = cloudRowsFor(await dump(), 'resur@test.ma', 'clients');
    ok(cn.filter(r => r.notes === 'race-edit').length === 1 && (await syncSt(Y.page)).dirty === false,
      'co-déclenchement online+visibilitychange: pas de doublon, pas de corruption, dirty résolu');

    /* 21.e — un save() PENDANT un pull en vol n'est pas perdu */
    const kept = await Y.page.evaluate(async () => {
      const pr = cloudPull(); // pull en vol
      DB.clients.push({ id: uid(), name: 'MidPull SARL', type: 'projet', statut: 'Actif', devise: 'DH' }); save();
      await pr; return DB.clients.some(c => c.name === 'MidPull SARL');
    });
    await sleep(2300);
    ok(kept && cloudRowsFor(await dump(), 'resur@test.ma', 'clients').some(r => r.name === 'MidPull SARL'),
      'création pendant un pull en vol: conservée localement ET poussée au cloud');
    await X.ctx.close(); await Y.ctx.close();
  }

  /* ================================================================ */
  await deviceA.ctx.close(); await deviceB.ctx.close();
  await browser.close(); app.close(); mock.close();
  console.log(`\n========== RÉSULTAT: ${passed} ✓ / ${failed} ✗ ==========`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
