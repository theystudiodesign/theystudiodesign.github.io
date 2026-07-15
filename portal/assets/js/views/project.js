// Modules 2+3+8 — Project detail: progress, TIMELINE (milestones), NOTES, deliverables strip.
import { api } from "../api.js";
import { el, esc, fmtDate, relTime, statusDot, mdInline } from "../ui.js";
import { navigate } from "../router.js";

export async function render(outlet, { id }) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);

  let project, milestones = [], notes = [], deliverables = [];
  try {
    project = await api.project(id);
    if (!project) { wrap.innerHTML = '<div class="empty"><p class="h3">Project not found.</p><p>It may not be published yet.</p></div>'; return; }
    [milestones, notes, deliverables] = await Promise.all([
      api.milestones(id).catch(() => []),
      api.notes(id).catch(() => []),
      api.deliverables(id).catch(() => []),
    ]);
  } catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load this project.</p><p>${esc(e.message)}</p></div>`; return; }

  wrap.appendChild(el(`
    <div class="rise" style="margin-bottom:32px">
      <span class="label"><span class="dot ${statusDot(project.status)}"></span> ${esc(project.status)}</span>
      <h1 class="h1" style="margin:10px 0 16px">${esc(project.name)}</h1>
      <p class="muted" style="max-width:60ch">${esc(project.summary || "")}</p>
      <div class="meter" style="max-width:420px;margin-top:20px"><i style="width:${project.progress}%"></i></div>
      <p class="mono" style="margin-top:10px">${project.progress}% ${project.due_at ? "· due " + esc(fmtDate(project.due_at)) : ""}</p>
    </div>`));

  const cols = el('<div class="grid g-2 rise" style="--i:1"></div>');

  // Timeline
  const tl = el('<div><span class="label section-label">Timeline</span><div class="timeline"></div></div>');
  const tlBox = tl.querySelector(".timeline");
  if (!milestones.length) tlBox.appendChild(el('<p class="muted">Milestones appear as the project takes shape.</p>'));
  else milestones.forEach((m) => tlBox.appendChild(el(
    `<div class="tl-item ${m.status}"><div class="title">${esc(m.title)}</div><span class="mono when">${m.status === "done" ? "done" : m.status === "doing" ? "in progress" : "planned"}${m.due_at ? " · " + esc(fmtDate(m.due_at)) : ""}</span></div>`)));

  // Notes
  const nt = el('<div><span class="label section-label">Notes</span><div id="notes"></div></div>');
  const nb = nt.querySelector("#notes");
  if (!notes.length) nb.appendChild(el('<p class="muted">No notes yet.</p>'));
  else notes.forEach((n) => {
    const card = el(`<div class="card" style="margin-bottom:14px"><div class="title" style="margin-bottom:4px">${esc(n.title)}</div><div class="mono" style="margin-bottom:10px">${relTime(n.published_at)}</div><div class="note-body"></div></div>`);
    card.querySelector(".note-body").innerHTML = mdInline(n.body_md);
    nb.appendChild(card);
  });

  cols.appendChild(tl); cols.appendChild(nt);
  wrap.appendChild(cols);

  // Deliverables strip
  const del = el('<div class="rise" style="--i:2;margin-top:36px"><span class="label section-label">Deliverables</span><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))"></div></div>');
  const dg = del.querySelector(".grid");
  if (!deliverables.length) dg.appendChild(el('<p class="muted">Nothing shared yet.</p>'));
  else deliverables.forEach((d) => {
    const c = el(`<div class="file-card" role="link" tabindex="0"><div class="file-frame">${d.preview_path ? "" : "◆"}</div><div class="file-body"><div><div class="title">${esc(d.title)}</div><div class="mono">${esc(d.version)}</div></div><span class="pill"><span class="dot ${statusDot(d.status)}"></span>${esc(d.status.replace("_", " "))}</span></div></div>`);
    const go = () => navigate(`/deliverables/${d.id}`);
    c.addEventListener("click", go);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    dg.appendChild(c);
  });
  wrap.appendChild(del);
}
