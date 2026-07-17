// Module 6 — Meetings: NATIVE booking (provider-agnostic). list_slots → book_slot (atomic).
import { api } from "../api.js";
import { t } from "../i18n.js";
import { el, esc, fmtDay, fmtTime, toast } from "../ui.js";

export async function render(outlet) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);

  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 42 * 864e5).toISOString().slice(0, 10); // 6-week horizon

  let slots = [], bookings = [];
  try { [slots, bookings] = await Promise.all([api.slots(from, to).catch(() => []), api.bookings().catch(() => [])]); }
  catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load meetings.</p><p>${esc(e.message)}</p></div>`; return; }

  const cols = el('<div class="grid rise" style="grid-template-columns:1.4fr 1fr;gap:32px"></div>');

  // booking picker
  const picker = el('<div><span class="label section-label">${t("Book a check-in · 30 min · GMT+1")}</span><div id="slotpick"></div></div>');
  const pick = picker.querySelector("#slotpick");
  if (!slots.length) {
    pick.appendChild(el('<p class="muted">No open slots in the next six weeks. Reach us at hello@theystudiodesign.com and we\u2019ll make room.</p>'));
  } else {
    // group by day
    const byDay = {};
    slots.forEach((s) => { const k = s.starts_at.slice(0, 10); (byDay[k] = byDay[k] || []).push(s); });
    const grid = el('<div class="slot-grid"></div>');
    let selected = null;
    Object.keys(byDay).slice(0, 8).forEach((day) => {
      const dayEl = el(`<div class="slot-day"><h4>${esc(fmtDay(day))}</h4></div>`);
      byDay[day].forEach((s) => {
        const b = el(`<button class="slot" aria-pressed="false">${esc(fmtTime(s.starts_at))}</button>`);
        b.addEventListener("click", () => {
          grid.querySelectorAll(".slot").forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true"); selected = s; confirmBtn.disabled = false;
          confirmBtn.textContent = `Confirm ${fmtDay(s.starts_at)} · ${fmtTime(s.starts_at)}`;
        });
        dayEl.appendChild(b);
      });
      grid.appendChild(dayEl);
    });
    pick.appendChild(grid);
    const confirmBtn = el('<button class="btn btn-primary" style="margin-top:20px" disabled>${t("Select a time")}</button>');
    pick.appendChild(confirmBtn);
    confirmBtn.addEventListener("click", async () => {
      if (!selected) return;
      confirmBtn.disabled = true;
      try {
        await api.book(selected.starts_at);
        toast(t("Meeting confirmed — a calendar invite is on its way."));
        render(outlet); // refresh slots + upcoming
      } catch (err) {
        const code = (err && err.message) || "";
        toast(code.includes("slot_taken") || code.includes("P0003") ? t("That time was just taken — pick another.") : "Couldn\u2019t book. " + code, "err");
        render(outlet);
      }
    });
  }

  // upcoming + past
  const side = el('<div><span class="label section-label">${t("Upcoming")}</span><div id="up"></div><span class="label section-label" style="margin-top:24px">${t("Past")}</span><div id="past"></div></div>');
  const now = Date.now();
  const up = bookings.filter((b) => b.status === "confirmed" && new Date(b.starts_at) >= now);
  const past = bookings.filter((b) => b.status !== "confirmed" || new Date(b.starts_at) < now);
  const upBox = side.querySelector("#up"), pastBox = side.querySelector("#past");
  if (!up.length) upBox.appendChild(el('<p class="muted" style="font-size:14px">${t("Nothing scheduled.")}</p>'));
  else up.forEach((b) => {
    const card = el(`<div class="card" style="margin-bottom:12px;padding:16px"><div class="title">${esc(fmtDay(b.starts_at))} · ${esc(fmtTime(b.starts_at))}</div><div class="mono" style="margin:6px 0 10px">${esc(b.title)}</div><button class="btn btn-ghost btn-sm" data-id="${b.id}">${t("Cancel")}</button></div>`);
    card.querySelector("button").addEventListener("click", async (e) => {
      e.target.disabled = true;
      try { await api.cancelBooking(b.id); toast(t("Meeting canceled.")); render(outlet); }
      catch (err) { toast("Cancel within 24h isn\u2019t possible online — email us.", "err"); e.target.disabled = false; }
    });
    upBox.appendChild(card);
  });
  if (!past.length) pastBox.appendChild(el('<p class="muted" style="font-size:14px">—</p>'));
  else past.slice(0, 5).forEach((b) => pastBox.appendChild(el(`<div class="list-row" style="opacity:.7"><span class="grow title">${esc(fmtDay(b.starts_at))}</span><span class="mono">${esc(b.status)}</span></div>`)));

  cols.appendChild(picker); cols.appendChild(side);
  wrap.appendChild(cols);
}
