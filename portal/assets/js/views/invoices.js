// Module 7 — Invoices: list + status + PDF download (signed URL). Informational (no payment in v1).
import { api } from "../api.js";
import { el, esc, fmtDate, fmtMoney, statusDot, toast } from "../ui.js";

export async function render(outlet) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);
  let invoices = [];
  try { invoices = await api.invoices(); }
  catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load invoices.</p><p>${esc(e.message)}</p></div>`; return; }

  if (!invoices.length) { wrap.innerHTML = '<div class="empty rise"><p class="h3">No invoices yet.</p></div>'; return; }

  const open = invoices.filter((i) => i.status === "sent" || i.status === "overdue").length;
  const paid = invoices.filter((i) => i.status === "paid").length;
  wrap.appendChild(el(`<div class="rise" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><span class="label section-label">Invoices</span><span class="mono">${open} open · ${paid} paid</span></div>`));

  const list = el('<div class="list rise" style="--i:1"></div>');
  invoices.forEach((i) => {
    // overdue derived on the client for STYLE only; server status is source of truth
    const overdue = i.status === "sent" && i.due_at && new Date(i.due_at) < Date.now();
    const shownStatus = overdue ? "overdue" : i.status;
    const row = el(`
      <div class="list-row" style="flex-wrap:wrap">
        <span class="mono" style="min-width:130px">${esc(i.number)}</span>
        <span class="grow tnum">${esc(fmtMoney(i.amount_cents, i.currency))}</span>
        <span class="mono" style="min-width:120px">issued ${esc(fmtDate(i.issued_at))}</span>
        <span class="pill"><span class="dot ${statusDot(shownStatus)}"></span>${shownStatus === "paid" ? "paid" : (shownStatus === "overdue" ? "overdue" : "due " + esc(fmtDate(i.due_at)))}</span>
        <button class="btn btn-ghost btn-sm" data-id="${i.id}">PDF ↓</button>
      </div>`);
    row.querySelector("button").addEventListener("click", async (e) => {
      e.target.disabled = true;
      try { const { url } = await api.signInvoice(i.id); window.open(url, "_blank", "noopener"); }
      catch (err) { toast("The invoice link expired — try again.", "err"); }
      e.target.disabled = false;
    });
    list.appendChild(row);
  });
  wrap.appendChild(list);
}
