// Module 1 — Dashboard: progress, attention items, latest notes. One calm morning mirror.
import { api } from "../api.js";
import { el, esc, fmtDate, relTime, statusDot, mdInline } from "../ui.js";
import { isOwner } from "../auth.js";

export async function render(outlet) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);

  let projects = [], summary = {}, notes = [], deliverables = [], invoices = [];
  try {
    [projects, summary] = await Promise.all([api.projects(), api.summary().catch(() => ({}))]);
    // latest notes + attention items pulled from the first few projects
    const first = projects[0];
    if (first) notes = await api.notes(first.id).catch(() => []);
    deliverables = await api.deliverables().catch(() => []);
    invoices = await api.invoices().catch(() => []);
  } catch (e) {
    wrap.innerHTML = `<div class="empty"><p class="h3">We couldn\u2019t load your dashboard.</p><p>${esc(e.message)}</p></div>`;
    return;
  }

  if (!projects.length) {
    wrap.innerHTML = `<div class="empty rise"><p class="h3">Nothing published yet.</p><p>Your first project appears here the day we press publish.</p></div>`;
    return;
  }

  const pendingApprovals = deliverables.filter((d) => d.status === "shared");
  const dueInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");

  const hero = projects[0];
  wrap.appendChild(el(`
    <div class="grid g-2 rise">
      <a class="card" data-link href="/projects/${hero.id}" style="display:block">
        <span class="label"><span class="dot ${statusDot(hero.status)}"></span> ${esc(hero.name)} · ${esc(hero.status)}</span>
        <div class="h1 tnum" style="margin:14px 0 18px">${hero.progress}%</div>
        <div class="meter"><i style="width:${hero.progress}%"></i></div>
        <p class="mono" style="margin-top:14px">${hero.due_at ? "due " + esc(fmtDate(hero.due_at)) : ""} ${notes[0] ? "· latest note " + relTime(notes[0].published_at) : ""}</p>
      </a>
      <div class="card">
        <span class="label section-label">Needs your attention</span>
        <div class="list" id="attention"></div>
      </div>
    </div>`));

  const attention = wrap.querySelector("#attention");
  if (!pendingApprovals.length && !dueInvoices.length) {
    attention.appendChild(el('<p class="muted" style="padding-top:12px">You\u2019re all caught up.</p>'));
  } else {
    pendingApprovals.forEach((d) =>
      attention.appendChild(el(`<div class="list-row"><span class="dot accent"></span><a class="grow title" data-link href="/deliverables/${d.id}">${esc(d.title)} — ${isOwner() ? "approve" : "review"}</a><span class="mono">${esc(d.version)}</span></div>`)));
    dueInvoices.forEach((i) =>
      attention.appendChild(el(`<div class="list-row"><span class="dot ${i.status === "overdue" ? "err" : "warn"}"></span><a class="grow title" data-link href="/invoices">Invoice ${esc(i.number)} ${i.status === "overdue" ? "overdue" : "due"}</a><span class="mono">${esc(fmtDate(i.due_at))}</span></div>`)));
  }

  // more projects
  if (projects.length > 1) {
    const more = el('<div class="card rise" style="--i:1;margin-top:24px"><span class="label section-label">Projects</span><div class="list"></div></div>');
    const list = more.querySelector(".list");
    projects.slice(1).forEach((p) =>
      list.appendChild(el(`<div class="list-row"><span class="dot ${statusDot(p.status)}"></span><a class="grow title" data-link href="/projects/${p.id}">${esc(p.name)}</a><span class="mono tnum">${p.progress}%</span></div>`)));
    wrap.appendChild(more);
  }

  // latest notes
  const notesCard = el('<div class="card rise" style="--i:2;margin-top:24px"><span class="label section-label">Latest notes</span><div id="notes"></div></div>');
  const nc = notesCard.querySelector("#notes");
  if (!notes.length) nc.appendChild(el('<p class="muted">No notes yet.</p>'));
  else notes.slice(0, 3).forEach((n) => nc.appendChild(el(`<div class="list-row"><div class="grow"><div class="title">${esc(n.title)}</div><div class="mono">${relTime(n.published_at)}</div></div><a class="btn btn-ghost btn-sm" data-link href="/projects/${n.portal_project_id}">Read</a></div>`)));
  wrap.appendChild(notesCard);
}
