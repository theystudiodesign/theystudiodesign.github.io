// Notifications — shell capability (bell + slide-over panel), not a route (per ratified scope).
import { api } from "./api.js";
import { t } from "./i18n.js";
import { el, esc, relTime, toast } from "./ui.js";
import { navigate } from "./router.js";

const LABEL = {
  note_published: "New note", deliverable_shared: "Deliverable shared",
  approval_decided: "Approval recorded", invoice_sent: "New invoice", booking_confirmed: "Meeting confirmed",
};

export async function openPanel(onChange) {
  document.querySelector(".notif-panel")?.remove();
  const panel = el(`
    <div class="notif-panel" role="dialog" aria-label="Notifications" style="position:fixed;top:0;inset-inline-end:0;bottom:0;width:min(380px,90vw);z-index:80;background:var(--surface-raised);border-inline-start:1px solid var(--line);box-shadow:var(--shadow-1);display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid var(--line)">
        <span class="label" style="margin:0">${t("Notifications")}</span>
        <span><button class="btn btn-ghost btn-sm" id="readall">${t("Mark all read")}</button> <button class="icon-btn" id="close" aria-label="Close">✕</button></span>
      </div>
      <div id="feed" style="overflow:auto;flex:1;padding:8px 20px 20px"></div>
    </div>`);
  const backdrop = el('<div style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:79"></div>');
  document.body.append(backdrop, panel);
  panel.querySelector("#close").focus();
  const close = () => { panel.remove(); backdrop.remove(); if (onChange) onChange(); };
  backdrop.addEventListener("click", close);
  panel.querySelector("#close").addEventListener("click", close);
  document.addEventListener("keydown", function esc2(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc2); } });

  const feed = panel.querySelector("#feed");
  let items = [];
  try { items = await api.notifications(false); }
  catch (e) { feed.innerHTML = `<p class="muted">Couldn\u2019t load notifications.</p>`; return; }

  if (!items.length) { feed.innerHTML = '<p class="muted" style="padding-top:16px">${t("You’re all caught up.")}</p>'; }
  else items.forEach((n) => {
    const url = (n.payload && n.payload.url) || "/";
    const row = el(`<div class="list-row" style="cursor:pointer"><span class="dot ${n.read_at ? "" : "accent"}"></span><div class="grow"><div class="title" style="font-size:14px">${esc(LABEL[n.type] || n.type)}${n.payload && n.payload.title ? " — " + esc(n.payload.title) : ""}</div><div class="mono">${relTime(n.created_at)}</div></div></div>`);
    row.addEventListener("click", async () => { if (!n.read_at) await api.markRead(n.id).catch(() => {}); close(); navigate(url); });
    feed.appendChild(row);
  });

  panel.querySelector("#readall").addEventListener("click", async () => {
    try { await api.markAllRead(); toast("All marked read."); close(); } catch (e) { toast("Couldn\u2019t update.", "err"); }
  });
}
