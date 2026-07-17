// Module 2 — Projects list (progress across all published projects).
import { api } from "../api.js";
import { t } from "../i18n.js";
import { el, esc, fmtDate, statusDot } from "../ui.js";

export async function render(outlet) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);
  let projects = [];
  try { projects = await api.projects(); }
  catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load projects.</p><p>${esc(e.message)}</p></div>`; return; }

  if (!projects.length) { wrap.innerHTML = '<div class="empty rise"><p class="h3">${t("No projects yet.")}</p><p>They appear here once published.</p></div>'; return; }

  const head = el('<div class="rise"><span class="label section-label">${t("Your projects")}</span></div>');
  wrap.appendChild(head);
  const grid = el('<div class="grid rise" style="--i:1;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))"></div>');
  projects.forEach((p) => {
    grid.appendChild(el(`
      <a class="card" data-link href="/projects/${p.id}" style="display:block">
        <span class="label"><span class="dot ${statusDot(p.status)}"></span> ${esc(p.status)}</span>
        <div class="h3" style="margin:12px 0 6px">${esc(p.name)}</div>
        <p class="muted" style="font-size:14px;margin-bottom:18px">${esc(p.summary || "")}</p>
        <div class="meter"><i style="width:${p.progress}%"></i></div>
        <p class="mono" style="margin-top:12px">${p.progress}% ${p.due_at ? "· due " + esc(fmtDate(p.due_at)) : ""}</p>
      </a>`));
  });
  wrap.appendChild(grid);
}
