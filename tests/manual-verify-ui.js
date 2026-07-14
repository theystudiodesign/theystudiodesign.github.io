/* MANUAL VERIFICATION — the exact user scenario, driven through the REAL UI
   (buttons, modal, trash icons, confirm dialogs), with screenshots.
   Cloud = mock Supabase. Browser genuinely restarted via persistent context. */
'use strict';
/* REAL=1 → Supabase RÉEL (gestion/supabase-config.js), compte de test unique, purge à la fin. */
const http = require('http'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { chromium } = require('playwright-core');
const { createMockSupabase } = require('./mock-supabase');
const REAL = process.env.REAL === '1';
const ROOT = path.join(__dirname, '..');
const CFG = (() => {
  const t = fs.readFileSync(path.join(ROOT, 'gestion', 'supabase-config.js'), 'utf8');
  return { url: (t.match(/url:\s*"([^"]+)"/) || [])[1], anonKey: (t.match(/anonKey:\s*"([^"]+)"/) || [])[1] };
})();
const QA = process.env.QA_EMAIL ? { email: process.env.QA_EMAIL, pass: process.env.QA_PASS || 'secret123-QA' } : null;
const EMAIL = QA ? QA.email : (REAL ? `they.manualqa.${Date.now()}@gmail.com` : 'manual@test.ma');
const PASS = QA ? QA.pass : 'secret123-QA';
const SHOTS = path.join(ROOT, 'docs/qa-gestion');
const APP_PORT = 9081, MOCK_PORT = 9082;
const APP = `http://localhost:${APP_PORT}/gestion/`;
const MOCK = `http://localhost:${MOCK_PORT}`;
const VENDOR = path.join(ROOT, 'tests/vendor/supabase-esm.js');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let step = 0, ok = 0, ko = 0;
const shot = async (p, name) => p.screenshot({ path: path.join(SHOTS, String(++step).padStart(2,'0') + '-' + name + '.jpg'), quality: 65, type: 'jpeg' });
const check = (c, l) => { c ? (ok++, console.log('  ✓ ' + l)) : (ko++, console.log('  ✗ ' + l)); };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(fs.readFileSync(f));
}).listen(APP_PORT);

async function launch(dir) {
  const ctx = await chromium.launchPersistentContext(dir, { executablePath: CHROME, headless: true, viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => sessionStorage.setItem('they_unlocked', '1'));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript',
    body: REAL ? `window.SUPABASE_CONFIG={url:"${CFG.url}",anonKey:"${CFG.anonKey}"};`
               : `window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};` }));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(VENDOR, 'utf8') }));
  return ctx;
}
const open = async ctx => { const p = await ctx.newPage(); p.on('dialog', d => d.accept()); await p.goto(APP, { waitUntil: 'networkidle' }); await sleep(1800); return p; };
const names = p => p.evaluate(() => DB.clients.map(c => c.name));

/* through the REAL UI */
async function uiCreate(page, name) {
  await page.click('[data-tab="clients"]');          // onglet Clients
  await page.click('text=Zid client');               // bouton réel
  await page.fill('#c_name', name);
  await page.click('#clientModal >> text=Sauvegarder');
  await sleep(300);
}
async function uiDelete(page, name) {
  await page.click('[data-tab="clients"]');           // onglet Clients
  const id = await page.evaluate(n => DB.clients.find(c => c.name === n).id, name);
  await page.click(`[onclick="delClient('${id}')"]`); // icône corbeille; confirm auto-accepté
  await sleep(300);
}
const refresh = async page => { await sleep(350); await page.reload({ waitUntil: 'networkidle' }); await sleep(1800); };

(async () => {
  if (REAL) {
    const r = await fetch(CFG.url + '/rest/v1/clients?select=deleted_at&limit=1',
      { headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey } });
    const b = await r.json().catch(() => ({}));
    if (b && b.code === '42703') { console.error('⛔ migration-tombstones.sql pas exécutée sur ' + CFG.url); process.exit(3); }
    console.log('pré-vol: schéma v2 présent ✓ · cible: ' + CFG.url);
  }
  let mock = null;
  if (!REAL) { mock = createMockSupabase().server; mock.listen(MOCK_PORT); }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'they-manual-'));
  let ctx = await launch(dir);
  let page = await open(ctx);

  console.log('— Connexion Cloud Sync (mock) —');
  await page.evaluate(() => { DB.clients.forEach(c => c.notes = 'réel'); save(); });
  await page.waitForSelector('#authGate');
  await page.fill('#ag_email', EMAIL); await page.fill('#ag_pass', PASS);
  await page.click(QA ? 'text=Se connecter' : 'text=Créer le compte');
  try { await page.waitForSelector('#authGate', { state: 'detached', timeout: 15000 }); }
  catch (e) {
    const msg = await page.evaluate(() => (document.getElementById('ag_err') || {}).textContent || '');
    throw new Error('SIGNUP BLOQUÉ (confirmation email exigée ?) — ' + msg);
  }
  await sleep(REAL ? 3000 : 1200);
  await shot(page, 'cloud-connecte');

  /* second tab open the whole time */
  const tab2 = await open(ctx);
  const tab2save = async () => { await tab2.evaluate(() => { try { DB.clients[0].notes = 't2-' + Date.now(); save(); } catch(e){} }); await sleep(300); };

  console.log('— Scénario exact, via la vraie UI —');
  await uiCreate(page, 'MANUEL-CLIENT-1'); await tab2save(); await shot(page, 'client1-cree'); await refresh(page);
  check((await names(page)).includes('MANUEL-CLIENT-1'), 'créer client 1 → refresh → il existe');
  await shot(page, 'client1-apres-refresh');

  await uiCreate(page, 'MANUEL-CLIENT-2'); await tab2save(); await refresh(page);
  check((await names(page)).includes('MANUEL-CLIENT-2'), 'créer client 2 → refresh → il existe');
  await shot(page, 'client2-apres-refresh');

  await uiDelete(page, 'MANUEL-CLIENT-1'); await tab2save(); await refresh(page);
  check(!(await names(page)).includes('MANUEL-CLIENT-1'), 'supprimer client 1 → refresh → toujours supprimé');
  await shot(page, 'client1-supprime');

  await uiDelete(page, 'MANUEL-CLIENT-2'); await tab2save(); await refresh(page);
  check(!(await names(page)).includes('MANUEL-CLIENT-2'), 'supprimer client 2 → refresh → toujours supprimé');
  await shot(page, 'client2-supprime');

  console.log('— Redémarrage du navigateur —');
  await ctx.close();
  ctx = await launch(dir);
  page = await open(ctx); await sleep(2500);
  const n = await names(page);
  check(!n.includes('MANUEL-CLIENT-1') && !n.includes('MANUEL-CLIENT-2'), 'redémarrage navigateur → rien ne ressuscite (état: [' + n.join(', ') + '])');
  await shot(page, 'apres-redemarrage');
  if (REAL) {
    const sess = await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('sb-') && k.includes('auth-token')) {
        try { const v = JSON.parse(localStorage.getItem(k)); return { token: v.access_token, uid: (v.user || {}).id }; } catch (e) {}
      }
      return null;
    });
    if (sess) for (const t of ['paiements', 'taches', 'events', 'projets', 'clients'])
      await fetch(`${CFG.url}/rest/v1/${t}?user_id=eq.${sess.uid}`, { method: 'DELETE', headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + sess.token } }).catch(() => {});
    console.log('(nettoyage serveur: lignes du compte de test purgées)');
  }
  await ctx.close();
  fs.rmSync(dir, { recursive: true, force: true });
  await new Promise(r => srv.close(r)); if (mock) await new Promise(r => mock.close(r));
  console.log(`\nVÉRIFICATION MANUELLE (UI réelle): ${ok} ✓ / ${ko} ✗`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
