// Portal QA — serves the app against the mock, drives every module, asserts + screenshots.
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const { createMockPortal } = require("./mock-portal");

const ROOT = path.join(__dirname, "..");
const APP_PORT = 8600, MOCK_PORT = 8601;
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const MOCK = `http://localhost:${MOCK_PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (c, l) => { c ? (pass++, console.log("  \u2713 " + l)) : (fail++, console.log("  \u2717 FAIL " + l)); };

// static file server
const app = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/" || p === "/login") p = p === "/login" ? "/login.html" : "/index.html";
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, "index.html"); // SPA fallback
  const ext = path.extname(f);
  res.writeHead(200, { "Content-Type": ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/html" });
  res.end(fs.readFileSync(f));
}).listen(APP_PORT);

  async function proxySupabase(route) {
    const req = route.request();
    const u = new URL(req.url());
    const target = MOCK + u.pathname + u.search;
    const method = req.method();
    const headers = req.headers();
    let body = req.postData();
    try {
      const r = await fetch(target, { method, headers: { "Content-Type": "application/json" }, body: (method === "GET" || method === "HEAD") ? undefined : body });
      const text = await r.text();
      route.fulfill({ status: r.status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: text });
    } catch (e) { route.fulfill({ status: 502, body: "{}" }); }
  }

(async () => {
  const { server: mock } = createMockPortal(); mock.listen(MOCK_PORT);
  const browser = await chromium.launch({ executablePath: CHROME });
  const shots = path.join(__dirname, "..", "docs-qa"); fs.mkdirSync(shots, { recursive: true });
  const errors = [];

  async function ctxPage(theme) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    // point config + supabase at the mock, and pre-auth a session
    await ctx.addInitScript((mock) => {
      const sess = { access_token: "mock", refresh_token: "mock", expires_at: Date.now() / 1000 + 3600, token_type: "bearer", user: { id: "u_owner", email: "sara@atlascapital.co" } };
      // supabase-js reads its session from localStorage key sb-<ref>-auth-token
      localStorage.setItem("sb-tychqyohodvjwafzfycg-auth-token", JSON.stringify(sess));
      window.__MOCK = mock;
    }, MOCK);
    // rewrite the real supabase URL → mock at network level
    await ctx.route("**/tychqyohodvjwafzfycg.supabase.co/**", proxySupabase);
    await ctx.route("**/api.fontshare.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
    await ctx.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
    if (theme === "light") await ctx.addInitScript(() => localStorage.setItem("they_theme", "light"));
    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("net::")) errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push("JSERR " + e.message));
    return { ctx, page };
  }

  const B = `http://localhost:${APP_PORT}`;
  const { ctx, page } = await ctxPage("dark");

  // Module 1 — Dashboard
  await page.goto(B + "/", { waitUntil: "networkidle" }); await sleep(500);
  ok(await page.$(".shell"), "shell renders (auth gate passed)");
  ok((await page.textContent("body")).includes("72%"), "M1 Dashboard: hero progress 72%");
  ok((await page.textContent("body")).includes("Logo v3"), "M1 Dashboard: attention item (approve Logo v3)");
  await page.screenshot({ path: shots + "/01-dashboard.jpg", quality: 60, type: "jpeg" });

  // Module 2 — Projects
  await page.click('[data-link][href="/projects"]'); await sleep(400);
  ok((await page.textContent(".content")).includes("Website"), "M2 Projects: both projects listed");
  await page.screenshot({ path: shots + "/02-projects.jpg", quality: 60, type: "jpeg" });

  // Module 3 — Project + Timeline + Notes
  await page.click('.card[href="/projects/p_rebrand"], a[href="/projects/p_rebrand"]'); await sleep(500);
  const proj = await page.textContent(".content");
  ok(proj.includes("Timeline") && proj.includes("Identity design"), "M3 Timeline: milestones render");
  ok(proj.includes("Direction B retired"), "M8 Notes: note renders (markdown)");
  ok(await page.$(".note-body strong"), "M8 Notes: markdown bold parsed");
  await page.screenshot({ path: shots + "/03-project.jpg", quality: 60, type: "jpeg" });

  // Module 4 + 9 — Deliverables + Approval
  await page.goto(B + "/deliverables", { waitUntil: "networkidle" }); await sleep(400);
  ok((await page.textContent(".content")).includes("Logo v3"), "M4 Deliverables: list renders");
  await page.goto(B + "/deliverables/a_logo3", { waitUntil: "networkidle" }); await sleep(400);
  ok(await page.$(".approve-bar"), "M9 Approvals: approve bar visible for owner on shared");
  await page.screenshot({ path: shots + "/04-deliverable.jpg", quality: 60, type: "jpeg" });
  await page.click("#approve"); await sleep(500);
  ok((await page.textContent(".content")).includes("Approved") || !(await page.$(".approve-bar")), "M9 Approvals: approve records + bar clears");

  // member role hides approve bar
  await fetch(`${MOCK}/__role?r=client_member`);
  await page.goto(B + "/deliverables/a_logo3", { waitUntil: "networkidle" }); await sleep(400);
  ok(!(await page.$(".approve-bar")), "M9 Approvals: member sees NO approve bar (authz)");
  await fetch(`${MOCK}/__role?r=client_owner`); await fetch(`${MOCK}/__reset`);

  // Module 5 — Files
  await page.goto(B + "/files", { waitUntil: "networkidle" }); await sleep(400);
  ok((await page.textContent(".content")).includes("Creative brief"), "M5 Files: shared files render (no approval UI)");
  ok(!(await page.$(".content .approve-bar")), "M5 Files: no approval workflow present");
  await page.screenshot({ path: shots + "/05-files.jpg", quality: 60, type: "jpeg" });

  // Module 6 — Meetings (native booking)
  await page.goto(B + "/meetings", { waitUntil: "networkidle" }); await sleep(500);
  ok((await page.$$(".slot")).length > 0, "M6 Meetings: native slots listed");
  await page.click(".slot"); await sleep(200);
  ok(!(await page.$("#slotpick .btn-primary[disabled]")), "M6 Meetings: selecting a slot enables confirm");
  await page.click("#slotpick .btn-primary"); await sleep(600);
  ok((await page.textContent(".content")).includes("Upcoming"), "M6 Meetings: booking confirmed → upcoming");
  await page.screenshot({ path: shots + "/06-meetings.jpg", quality: 60, type: "jpeg" });

  // Module 7 — Invoices
  await page.goto(B + "/invoices", { waitUntil: "networkidle" }); await sleep(400);
  const inv = await page.textContent(".content");
  ok(inv.includes("THEY-2026-014") && inv.includes("MAD"), "M7 Invoices: list + money format");
  await page.screenshot({ path: shots + "/07-invoices.jpg", quality: 60, type: "jpeg" });

  // Module 8 — Notes (standalone)
  await page.goto(B + "/notes", { waitUntil: "networkidle" }); await sleep(400);
  ok((await page.textContent(".content")).includes("typography locked"), "M8 Notes page: aggregated notes");
  await page.screenshot({ path: shots + "/08-notes.jpg", quality: 60, type: "jpeg" });

  // Module 10 — Profile
  await page.goto(B + "/profile", { waitUntil: "networkidle" }); await sleep(400);
  ok((await page.textContent(".content")).includes("sara@atlascapital.co"), "M10 Profile: identity");
  ok((await page.$$('.content [data-theme]')).length === 3, "M10 Profile: appearance controls");
  await page.screenshot({ path: shots + "/10-profile.jpg", quality: 60, type: "jpeg" });

  // Notifications shell
  await page.goto(B + "/", { waitUntil: "networkidle" }); await sleep(400);
  ok(await page.$(".bell-dot"), "Shell: unread bell badge");
  await page.click("#bell"); await sleep(400);
  ok(await page.$(".notif-panel"), "Shell: notifications panel opens");
  await page.screenshot({ path: shots + "/11-notifications.jpg", quality: 60, type: "jpeg" });

  // Theme + login + mobile
  const { page: lp } = await ctxPage("light");
  await lp.goto(B + "/", { waitUntil: "networkidle" }); await sleep(500);
  ok((await lp.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(248, 248, 246)", "Theme: light token applied");
  await lp.screenshot({ path: shots + "/12-dashboard-light.jpg", quality: 60, type: "jpeg" });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mobile.route("**/tychqyohodvjwafzfycg.supabase.co/**", proxySupabase);
  await mobile.route("**/api.fontshare.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await mobile.route("**/fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await mobile.addInitScript(() => localStorage.setItem("sb-tychqyohodvjwafzfycg-auth-token", JSON.stringify({ access_token: "mock", refresh_token: "mock", expires_at: Date.now() / 1000 + 3600, user: { id: "u_owner", email: "sara@atlascapital.co" } })));
  const mp = await mobile.newPage();
  await mp.goto(B + "/", { waitUntil: "networkidle" }); await sleep(500);
  ok(await mp.$(".mobile-tabbar"), "Mobile: tab bar present");
  await mp.screenshot({ path: shots + "/13-mobile.jpg", quality: 60, type: "jpeg" });

  // login page
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  await ap.goto(B + "/login", { waitUntil: "networkidle" }); await sleep(300);
  ok((await ap.textContent("body")).includes("magic link") && !(await ap.$('input[type=password]')), "Login: magic-link only, no password field");
  await ap.screenshot({ path: shots + "/00-login.jpg", quality: 60, type: "jpeg" });

  console.log("\n  console/JS errors:", errors.length ? errors.slice(0, 6).join(" | ") : "ZERO");
  ok(errors.length === 0, "No console/JS errors across all modules");

  await browser.close(); app.close(); mock.close();
  console.log(`\n========== PORTAL QA: ${pass} \u2713 / ${fail} \u2717 ==========`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(2); });
