/* ============================================================
   AUDIT 2 — reproduction du scénario production + chasse au "stale write" restant.

   [P1] Build PRODUCTION (v33, sans fix) — 1 SEUL onglet: create/refresh, delete/refresh
        → attendu SAIN (prouve qu'une 2e instance participe au bug observé en prod)
   [P2] Build PRODUCTION — 2 instances → REPRODUIT (état des lieux prod actuel)
   [P3] BUILD MIXTE — le piège post-déploiement:
        onglet A = build CORRIGÉ (v34) · onglet B = build v33 (fenêtre PWA restée ouverte,
        jamais rechargée) — MÊME origine → MÊME localStorage.
        Question: le save() v33 de B peut-il encore corrompre, et par quel chemin exact
        l'onglet corrigé se rend-il ?

   Usage: node repro-mixed-version.js <chemin-build-v33>
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');            // build CORRIGÉ (branche fix)
const OLD = process.argv[2];                        // build v33 (worktree main)
const APP_PORT = 8991;
const NEW_URL = `http://localhost:${APP_PORT}/gestion/`;
const OLD_URL = `http://localhost:${APP_PORT}/gestion-old/`;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

const repro = (c, l) => console.log((c ? '  🔴 REPRODUIT: ' : '  ⚪ non reproduit: ') + l);
const ok = (c, l) => console.log((c ? '  ✓ ' : '  ✗ ') + l);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function server() {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let f;
    if (p.startsWith('/gestion-old/')) f = path.join(OLD, 'gestion', p.slice('/gestion-old/'.length));
    else f = path.join(ROOT, p);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(fs.readFileSync(f));
  });
}
async function newCtx(browser) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.SUPABASE_CONFIG={url:"",anonKey:""};' }));
  return ctx;
}
const names = p => p.evaluate(() => DB.clients.map(c => c.name));
const lsNames = p => p.evaluate(() => (JSON.parse(localStorage.getItem('crm_gestion_clients_v1')) || { clients: [] }).clients.map(c => c.name));

(async () => {
  const srv = server().listen(APP_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });

  /* ===== [P1] build v33, UN SEUL onglet — le scénario exact rapporté ===== */
  console.log('\n[P1] Build PRODUCTION v33 — 1 seul onglet (scénario rapporté tel quel)');
  {
    const ctx = await newCtx(browser);
    const p = await ctx.newPage(); await p.goto(OLD_URL, { waitUntil: 'networkidle' }); await sleep(400);
    p.on('dialog', d => d.accept());
    await p.evaluate(() => { DB.clients.push({ id: uid(), name: 'Prod-New', type: 'projet', statut: 'Actif', devise: 'DH' }); save(); });
    await p.reload({ waitUntil: 'networkidle' }); await sleep(400);
    ok((await names(p)).includes('Prod-New'), 'create + refresh → persiste (1 onglet, v33)');
    await p.evaluate(() => { const c = DB.clients.find(x => x.name === 'Prod-New'); delClient(c.id); });
    await sleep(150); await p.reload({ waitUntil: 'networkidle' }); await sleep(400);
    ok(!(await names(p)).includes('Prod-New'), 'delete + refresh → reste supprimé (1 onglet, v33)');
    await ctx.close();
  }

  /* ===== [P2] build v33, DEUX instances — l'état réel de la production ===== */
  console.log('\n[P2] Build PRODUCTION v33 — 2 instances (PWA restée ouverte + onglet)');
  {
    const ctx = await newCtx(browser);
    const stale = await ctx.newPage(); await stale.goto(OLD_URL, { waitUntil: 'networkidle' }); await sleep(400);
    const active = await ctx.newPage(); await active.goto(OLD_URL, { waitUntil: 'networkidle' }); await sleep(400);
    active.on('dialog', d => d.accept());
    const victim = (await names(active))[1];
    await active.evaluate(() => { DB.clients.push({ id: uid(), name: 'Prod-Fresh', type: 'projet', statut: 'Actif', devise: 'DH' }); save(); });
    await active.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, victim);
    await sleep(200);
    await stale.evaluate(() => { DB.clients[0].notes = 'stale-save'; save(); });
    await sleep(200);
    await active.reload({ waitUntil: 'networkidle' }); await sleep(400);
    const seen = await names(active);
    repro(seen.includes(victim) && !seen.includes('Prod-Fresh'),
      'v33 (SANS fix): le supprimé revient, le créé disparaît — ce que la production sert AUJOURD’HUI');
    await ctx.close();
  }

  /* ===== [P3] BUILD MIXTE — onglet corrigé (v34) + fenêtre v33 jamais rechargée ===== */
  console.log('\n[P3] MIXTE — onglet corrigé v34 + instance v33 encore ouverte (post-déploiement)');
  {
    const ctx = await newCtx(browser);
    const oldTab = await ctx.newPage(); await oldTab.goto(OLD_URL, { waitUntil: 'networkidle' }); await sleep(400); // PWA v33 "oubliée"
    const newTab = await ctx.newPage(); await newTab.goto(NEW_URL, { waitUntil: 'networkidle' }); await sleep(400); // onglet CORRIGÉ
    newTab.on('dialog', d => d.accept());
    ok(await newTab.evaluate(() => typeof mergeFromDisk === 'function'), 'l’onglet actif exécute bien le build corrigé');
    const victim = (await names(newTab))[1];
    await newTab.evaluate(() => { DB.clients.push({ id: uid(), name: 'Mix-Fresh', type: 'projet', statut: 'Actif', devise: 'DH' }); save(); });
    await newTab.evaluate(n => { const c = DB.clients.find(x => x.name === n); delClient(c.id); }, victim);
    await sleep(250);
    ok((await lsNames(newTab)).includes('Mix-Fresh') && !(await lsNames(newTab)).includes(victim), 'storage correct après le travail dans l’onglet corrigé');
    /* la fenêtre v33 (aucun mergeFromDisk, aucun listener actif) fait une sauvegarde anodine */
    await oldTab.evaluate(() => { DB.clients[0].notes = 'v33-stale-save'; save(); });
    await sleep(400); // laisse l'event storage se propager vers l'onglet corrigé
    const disk = await lsNames(newTab);
    repro(disk.includes(victim), `STORAGE: « ${victim} » RESSUSCITÉ par le save() v33 (DataLayer.write inconditionnel du build v33)`);
    repro(!disk.includes('Mix-Fresh'), 'STORAGE: « Mix-Fresh » EFFACÉ par le save() v33');
    /* et voici le point clé: l'onglet CORRIGÉ adopte-t-il la corruption via son handler storage ? */
    const memAfter = await names(newTab);
    repro(memAfter.includes(victim), 'MÉMOIRE de l’onglet corrigé: victim ADOPTÉ par mergeFromDisk (branche « inconnu → adopté »)');
    repro(!memAfter.includes('Mix-Fresh'), 'MÉMOIRE de l’onglet corrigé: Mix-Fresh ABANDONNÉ (branche « connu+absent → supprimé ailleurs »)');
    await newTab.reload({ waitUntil: 'networkidle' }); await sleep(400);
    const seen = await names(newTab);
    repro(seen.includes(victim) && !seen.includes('Mix-Fresh'), 'après refresh: exactement les symptômes rapportés — MALGRÉ le fix dans l’onglet actif');
    await ctx.close();
  }

  await browser.close(); srv.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
