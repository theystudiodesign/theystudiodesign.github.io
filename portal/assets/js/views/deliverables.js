// Module 4 — Deliverables index (approval-carrying artifacts across projects).
import { api } from "../api.js";
import { t } from "../i18n.js";
import { el, esc, fmtDate, statusDot } from "../ui.js";
import { navigate } from "../router.js";

export async function render(outlet) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);
  let items = [];
  try { items = await api.deliverables(); }
  catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load deliverables.</p><p>${esc(e.message)}</p></div>`; return; }

  if (!items.length) { wrap.innerHTML = '<div class="empty rise"><p class="h3">${t("No deliverables yet.")}</p><p>Work shared for your review will appear here.</p></div>'; return; }

  wrap.appendChild(el('<div class="rise"><span class="label section-label">${t("Deliverables")}</span></div>'));
  const grid = el('<div class="grid rise" style="--i:1;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))"></div>');
  items.forEach((d) => {
    const c = el(`<div class="file-card" role="link" tabindex="0"><div class="file-frame">◆</div><div class="file-body"><div><div class="title">${esc(d.title)}</div><div class="mono">${esc(d.version)} · ${esc(fmtDate(d.shared_at || d.created_at))}</div></div><span class="pill"><span class="dot ${statusDot(d.status)}"></span>${esc(d.status.replace("_", " "))}</span></div></div>`);
    const go = () => navigate(`/deliverables/${d.id}`);
    c.addEventListener("click", go);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    grid.appendChild(c);
  });
  wrap.appendChild(grid);
}
