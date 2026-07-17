// Module 8 — Notes (standalone): all published notes across projects, newest first.
import { api } from "../api.js";
import { t } from "../i18n.js";
import { el, esc, relTime, mdInline } from "../ui.js";

export async function render(outlet) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);
  let projects = [];
  try { projects = await api.projects(); }
  catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load notes.</p><p>${esc(e.message)}</p></div>`; return; }

  const all = [];
  for (const p of projects) {
    const ns = await api.notes(p.id).catch(() => []);
    ns.forEach((n) => all.push({ ...n, project: p.name }));
  }
  all.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  if (!all.length) { wrap.innerHTML = '<div class="empty rise"><p class="h3">${t("No notes yet.")}</p><p>Project updates from the studio appear here.</p></div>'; return; }

  wrap.appendChild(el('<div class="rise"><span class="label section-label">${t("Notes")}</span></div>'));
  const box = el('<div class="rise" style="--i:1;max-width:70ch"></div>');
  all.forEach((n) => {
    const card = el(`<div class="card" style="margin-bottom:16px"><div class="mono" style="margin-bottom:6px">${esc(n.project)} · ${relTime(n.published_at)}</div><div class="h3" style="margin-bottom:10px">${esc(n.title)}</div><div class="note-body"></div></div>`);
    card.querySelector(".note-body").innerHTML = mdInline(n.body_md);
    box.appendChild(card);
  });
  wrap.appendChild(box);
}
