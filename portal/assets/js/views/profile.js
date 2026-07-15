// Module 10 — Profile: identity, theme, notification preferences, sign out.
import { el, esc, toast } from "../ui.js";
import { user, member, role, signOut } from "../auth.js";
import { api } from "../api.js";

const TYPES = [
  ["note_published", "New notes"],
  ["deliverable_shared", "Deliverables to review"],
  ["invoice_sent", "New invoices"],
  ["booking_confirmed", "Meeting confirmations"],
];

export async function render(outlet) {
  const wrap = el('<div class="content" style="max-width:640px"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);
  const u = user(), m = member();
  const prefs = (m && m.notification_prefs) || {};

  wrap.appendChild(el(`
    <div class="rise">
      <span class="label section-label">Profile</span>
      <div class="card">
        <div class="h3">${esc(u.email)}</div>
        <p class="mono" style="margin-top:6px">${esc(role() || "member")} access</p>
      </div>
    </div>`));

  // theme
  const themeCard = el(`
    <div class="card rise" style="--i:1;margin-top:20px">
      <span class="label section-label">Appearance</span>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost btn-sm" data-theme="dark">Dark</button>
        <button class="btn btn-ghost btn-sm" data-theme="light">Light</button>
        <button class="btn btn-ghost btn-sm" data-theme="system">System</button>
      </div>
    </div>`);
  themeCard.querySelectorAll("[data-theme]").forEach((b) => b.addEventListener("click", () => {
    const v = b.getAttribute("data-theme");
    try {
      if (v === "system") { localStorage.removeItem("they_theme"); const light = matchMedia("(prefers-color-scheme: light)").matches; light ? document.documentElement.setAttribute("data-theme", "light") : document.documentElement.removeAttribute("data-theme"); }
      else { localStorage.setItem("they_theme", v); v === "light" ? document.documentElement.setAttribute("data-theme", "light") : document.documentElement.removeAttribute("data-theme"); }
    } catch (e) {}
    toast("Appearance updated.");
  }));
  wrap.appendChild(themeCard);

  // notification preferences
  const notif = el('<div class="card rise" style="--i:2;margin-top:20px"><span class="label section-label">Email notifications</span><div class="list"></div><button class="btn btn-primary btn-sm" id="save" style="margin-top:16px">Save preferences</button></div>');
  const list = notif.querySelector(".list");
  const state = {};
  TYPES.forEach(([key, label]) => {
    const on = prefs[key] !== false;
    state[key] = on;
    const row = el(`<div class="list-row"><span class="grow title">${esc(label)}</span><button class="pill" aria-pressed="${on}" data-k="${key}">${on ? "On" : "Off"}</button></div>`);
    row.querySelector("button").addEventListener("click", (e) => {
      const btn = e.currentTarget; const next = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", next); btn.textContent = next ? "On" : "Off"; state[key] = next;
    });
    list.appendChild(row);
  });
  notif.querySelector("#save").addEventListener("click", async (e) => {
    e.target.disabled = true;
    try { await api.updatePrefs(m.id, state); toast("Preferences saved."); }
    catch (err) { toast("Couldn\u2019t save. " + err.message, "err"); }
    e.target.disabled = false;
  });
  wrap.appendChild(notif);

  const out = el('<div class="rise" style="--i:3;margin-top:28px"><button class="btn btn-ghost" id="signout">Sign out</button></div>');
  out.querySelector("#signout").addEventListener("click", async () => { await signOut(); location.href = "/login"; });
  wrap.appendChild(out);
}
