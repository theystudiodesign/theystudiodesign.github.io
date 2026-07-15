// App bootstrap: theme guard already ran inline; here we gate on auth, build the shell, mount the router.
import { ICON, $, el, esc } from "./ui.js";
import { t } from "./i18n.js";
import { loadSession, loadMembership, user, role, signOut, onAuthChange } from "./auth.js";
import { initRouter, navigate } from "./router.js";
import { applyLangAttrs } from "./i18n.js";
import { api } from "./api.js";

const NAV = [
  { href: "/", label: t("Overview"), icon: "grid", match: (p) => p === "/" },
  { href: "/projects", label: t("Projects"), icon: "layers", match: (p) => p.startsWith("/projects") },
  { href: "/deliverables", label: t("Deliverables"), icon: "layers", match: (p) => p.startsWith("/deliverables") },
  { href: "/files", label: t("Files"), icon: "file", match: (p) => p === "/files" },
  { href: "/notes", label: t("Notes"), icon: "note", match: (p) => p === "/notes" },
  { href: "/invoices", label: t("Invoices"), icon: "invoice", match: (p) => p === "/invoices" },
  { href: "/meetings", label: t("Meetings"), icon: "calendar", match: (p) => p === "/meetings" },
];
const TABBAR = [
  { href: "/", label: t("Home"), icon: "grid", match: (p) => p === "/" },
  { href: "/files", label: t("Files"), icon: "file", match: (p) => p === "/files" },
  { href: "/meetings", label: t("Meet"), icon: "calendar", match: (p) => p === "/meetings" },
  { href: "/invoices", label: t("Invoices"), icon: "invoice", match: (p) => p === "/invoices" },
  { href: "/profile", label: t("You"), icon: "user", match: (p) => p === "/profile" },
];

function themeToggleEl() {
  const b = el(`<button class="icon-btn" aria-label="Toggle theme" data-theme-toggle>${ICON.sun}${ICON.moon}</button>`);
  const sun = b.children[0], moon = b.children[1];
  const sync = () => { const light = document.documentElement.getAttribute("data-theme") === "light"; sun.hidden = light; moon.hidden = !light; };
  sync();
  b.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    try { localStorage.setItem("they_theme", next); } catch (e) {}
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    sync();
  });
  return b;
}

function shell(u) {
  const navLinks = NAV.map((n) => `<a class="nav-link" data-link href="${n.href}">${ICON[n.icon]}<span>${n.label}</span></a>`).join("");
  const tabs = TABBAR.map((n) => `<a data-link href="${n.href}">${ICON[n.icon]}<span>${n.label}</span></a>`).join("");
  const root = el(`
    <div class="shell">
      <aside class="sidebar" aria-label="Portal navigation">
        <div class="brand">THE\u2019<b>Y</b></div>
        ${navLinks}
        <div class="nav-spacer"></div>
        <div class="nav-sep"></div>
        <a class="nav-link" data-link href="/profile">${ICON.user}<span>${t("Profile")}</span></a>
        <button class="nav-link" id="signout" style="width:100%">${ICON.user}<span>${t("Sign out")}</span></button>
      </aside>
      <div class="main">
        <header class="topbar">
          <div style="display:flex;align-items:center;gap:12px">
            <button class="icon-btn menu-btn" aria-label="Menu">${ICON.menu}</button>
            <span class="topbar-title" id="page-title">Overview</span>
          </div>
          <div class="topbar-actions">
            <button class="icon-btn" id="bell" aria-label="Notifications">${ICON.bell}</button>
            <span id="theme-slot"></span>
          </div>
        </header>
        <div id="outlet"></div>
      </div>
      <nav class="mobile-tabbar" aria-label="Primary">${tabs}</nav>
    </div>`);
  $(".topbar-actions", root).insertBefore(themeToggleEl(), $("#theme-slot", root));
  $("#signout", root).addEventListener("click", async () => { await signOut(); location.href = "/login/"; });
  $(".menu-btn", root).addEventListener("click", () => document.body.classList.toggle("nav-open"));
  root.addEventListener("click", (e) => { if (e.target.closest("a[data-link]")) document.body.classList.remove("nav-open"); });
  return root;
}

function highlightNav(path) {
  document.querySelectorAll(".nav-link[href], .mobile-tabbar a").forEach((a) => a.removeAttribute("aria-current"));
  [...NAV, ...TABBAR].forEach((n) => { if (n.match(path)) document.querySelectorAll(`[href="${n.href}"]`).forEach((a) => a.setAttribute("aria-current", "page")); });
  const title = (NAV.find((n) => n.match(path)) || { label: path === "/profile" ? "Profile" : "" }).label;
  const t = document.getElementById("page-title"); if (t && title) t.textContent = title;
}

async function refreshBell() {
  try {
    const unread = await api.notifications(true);
    const bell = document.getElementById("bell");
    if (!bell) return;
    bell.querySelector(".bell-dot")?.remove();
    if (unread.length) bell.appendChild(el(`<span class="bell-dot">${unread.length > 9 ? "9+" : unread.length}</span>`));
  } catch (e) {}
}

async function boot() {
  applyLangAttrs();
  await loadSession();
  if (!user()) { location.href = "/login/"; return; }
  const member = await loadMembership();
  const app = document.getElementById("app");
  if (!member) {
    app.innerHTML = `<div class="content" style="max-width:560px;margin:0 auto"><div class="empty"><p class="h3">Your access isn\u2019t active yet.</p><p>If you were invited, open the link in your email. Otherwise reach us at hello@theystudiodesign.com.</p></div></div>`;
    return;
  }
  app.innerHTML = "";
  app.appendChild(shell(user()));
  document.getElementById("bell").addEventListener("click", () => import("./notifications-panel.js").then((m) => m.openPanel(refreshBell)));
  initRouter(document.getElementById("outlet"), (path) => { highlightNav(path); refreshBell(); });
  onAuthChange((s) => { if (!s) location.href = "/login/"; });
  refreshBell();
  setInterval(refreshBell, 60000);

  /* offline: calm banner, retry on focus (server-state-first — nothing to reconcile) */
  const offBanner = el('<div role="status" style="position:fixed;top:0;inset-inline:0;z-index:200;background:var(--surface-card);border-bottom:1px solid var(--line);text-align:center;padding:8px;font-size:13px" hidden>${t("You’re offline — reconnecting…")}</div>');
  document.body.appendChild(offBanner);
  window.addEventListener("offline", () => (offBanner.hidden = false));
  window.addEventListener("online", () => { offBanner.hidden = true; refreshBell(); });
}

boot();
