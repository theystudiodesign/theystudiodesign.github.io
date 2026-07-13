/* ============================================================
   Sprint 18 — Capture d'écrans systématique (audit design + non-régression visuelle).

   Usage:
     node screenshots.js diff  <outdir>   → set réduit PNG déterministe (pixel-diff avant/après)
     node screenshots.js audit <outdir>   → set complet JPEG (desktop/tablet/mobile × light/dark + overlays)

   Horloge figée + polices bloquées + fixtures stables → rendu déterministe.
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 8951;
const APP = `http://localhost:${APP_PORT}/gestion/`;
const CHROME = process.env.CHROME_PATH ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

const MODE = process.argv[2] || 'diff';
const OUT = process.argv[3] || path.join('/tmp', 'shots-' + MODE);
fs.mkdirSync(OUT, { recursive: true });

const FIXED_TIME = new Date('2026-07-13T12:00:00+01:00');
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet:  { width: 834,  height: 1112 },
  mobile:  { width: 390,  height: 844 }
};
const TABS = ['dash', 'clients', 'taches', 'projets', 'paiements', 'calendrier'];

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

async function newPage(browser, { theme = 'light', viewport = 'desktop', locked = false } = {}) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[viewport], timezoneId: 'Africa/Casablanca' });
  await ctx.addInitScript(([theme, locked]) => {
    if (!locked) sessionStorage.setItem('they_unlocked', '1');
    localStorage.setItem('they_theme', theme);
    localStorage.setItem('they_last_backup', String(Date.now())); // pas de bannière/download backup
    localStorage.setItem('they_notif_seen', '99'); // pas de toast notifications au boot
  }, [theme, locked]);
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/supabase-config.js*', r => r.fulfill({
    status: 200, contentType: 'text/javascript', body: 'window.SUPABASE_CONFIG={url:"",anonKey:""};'
  }));
  const page = await ctx.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(APP, { waitUntil: 'networkidle' });
  /* rendu déterministe: aucune animation/transition en cours pendant la capture */
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  if (!locked) await page.evaluate(() => document.getElementById('toast').classList.remove('show'));
  if (!locked) {
    /* fixtures stables pour couvrir les états: événement du jour + paiement en retard */
    await page.evaluate(() => {
      if (!DB.events.some(e => e.title === 'Réunion brief — Atlas Café')) {
        DB.events.push({ id: uid(), title: 'Réunion brief — Atlas Café', type: 'Réunion', date: '2026-07-13', notes: '' });
        DB.paiements.push({ id: uid(), clientId: DB.clients[0] ? DB.clients[0].id : '', projetId: '', label: 'Solde site vitrine', type: 'Solde final', montant: 1500, devise: 'DH', statut: 'En attente', date: '2026-07-08', methode: 'Virement', notes: '' });
        save();
      }
      renderAll();
    });
  }
  return { ctx, page };
}

const shot = (page, file, opts = {}) =>
  page.screenshot({ path: path.join(OUT, file), ...(MODE === 'audit' ? { type: 'jpeg', quality: 60 } : { type: 'png' }), ...opts });

(async () => {
  const app = staticServer().listen(APP_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });
  const themes = ['light', 'dark'];

  /* ---- onglets ---- */
  const viewports = MODE === 'audit' ? Object.keys(VIEWPORTS) : ['desktop'];
  for (const vp of viewports) {
    for (const theme of themes) {
      const { ctx, page } = await newPage(browser, { theme, viewport: vp });
      for (const tab of TABS) {
        await page.evaluate(t => go(t), tab);
        await page.waitForTimeout(120);
        await shot(page, `${vp}-${theme}-${tab}.${MODE === 'audit' ? 'jpg' : 'png'}`, { fullPage: true });
      }
      /* vue semaine du calendrier */
      await page.evaluate(() => { go('calendrier'); calView('semaine'); });
      await page.waitForTimeout(120);
      await shot(page, `${vp}-${theme}-calendrier-semaine.${MODE === 'audit' ? 'jpg' : 'png'}`, { fullPage: true });
      await ctx.close();
    }
  }

  /* ---- overlays & états (audit uniquement, desktop) ---- */
  if (MODE === 'audit') {
    for (const theme of themes) {
      const { ctx, page } = await newPage(browser, { theme });
      const ov = async (name, fn) => {
        await page.evaluate(fn);
        await page.waitForTimeout(150);
        await shot(page, `overlay-${theme}-${name}.jpg`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(80);
      };
      await ov('modal-client', () => openClientModal());
      await ov('modal-paiement', () => openPayModal());
      await ov('modal-event', () => openEventModal());
      await ov('modal-rapports', () => openReports());
      await ov('modal-restore', () => openRestore());
      await ov('search', () => openSearch());
      await ov('notifications', () => toggleNotifs());
      await ov('fiche-client', () => openClientFiche(DB.clients[0].id));
      await page.evaluate(() => { go('calendrier'); openDayPanel('2026-07-13'); });
      await page.waitForTimeout(150);
      await shot(page, `overlay-${theme}-day-panel.jpg`);
      await page.evaluate(() => closeDayPanel());
      await page.evaluate(() => openFacture(DB.paiements[0].id));
      await page.waitForTimeout(200);
      await shot(page, `overlay-${theme}-facture.jpg`, { fullPage: true });
      await page.evaluate(() => closeFacture());
      await page.evaluate(() => openBL(DB.paiements[0].id));
      await page.waitForTimeout(200);
      await shot(page, `overlay-${theme}-bon-livraison.jpg`, { fullPage: true });
      await ctx.close();
    }
    /* écran PIN */
    const { ctx, page } = await newPage(browser, { locked: true });
    await shot(page, 'overlay-lockscreen.jpg');
    await ctx.close();
  }

  await browser.close(); app.close();
  const n = fs.readdirSync(OUT).length;
  console.log(`${MODE}: ${n} captures → ${OUT}`);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
