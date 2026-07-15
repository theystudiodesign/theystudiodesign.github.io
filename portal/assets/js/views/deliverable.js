// Modules 4+9 — Deliverable detail: preview, download (signed URL), APPROVE / request changes.
import { api } from "../api.js";
import { el, esc, fmtDate, relTime, statusDot, toast } from "../ui.js";
import { isOwner } from "../auth.js";

export async function render(outlet, { id }) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);

  let d, decisions = [];
  try {
    const all = await api.deliverables();
    d = all.find((x) => x.id === id);
    if (!d) { wrap.innerHTML = '<div class="empty"><p class="h3">Deliverable not found.</p></div>'; return; }
    decisions = await api.approvals(id).catch(() => []);
  } catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load this deliverable.</p><p>${esc(e.message)}</p></div>`; return; }

  wrap.appendChild(el(`
    <div class="rise" style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px">
      <div><span class="label"><span class="dot ${statusDot(d.status)}"></span>${esc(d.status.replace("_", " "))}</span>
      <h1 class="h2" style="margin-top:8px">${esc(d.title)} <span class="mono">${esc(d.version)}</span></h1></div>
      <button class="btn btn-ghost" id="dl">Download <span class="arrow">↓</span></button>
    </div>`));

  wrap.appendChild(el(`<div class="rise" style="--i:1"><div class="file-frame" style="aspect-ratio:16/9;border:1px solid var(--line);border-radius:var(--r-md)">${d.preview_path ? "" : "◆ preview"}</div></div>`));

  // decision history
  if (decisions.length) {
    const h = el('<div class="rise" style="--i:1;margin-top:20px"><span class="label section-label">Decisions</span><div class="list"></div></div>');
    decisions.forEach((x) => h.querySelector(".list").appendChild(el(
      `<div class="list-row"><span class="dot ${x.decision === "approved" ? "ok" : "err"}"></span><span class="grow title">${x.decision === "approved" ? "Approved" : "Changes requested"}${x.note ? " — " + esc(x.note) : ""}</span><span class="mono">${relTime(x.decided_at)}</span></div>`)));
    wrap.appendChild(h);
  }

  // approve bar — only client_owner, only while shared
  if (isOwner() && d.status === "shared") {
    const bar = el(`
      <div class="approve-bar rise" style="--i:2;margin-top:28px">
        <span><span class="label">Your decision</span></span>
        <span style="display:flex;gap:10px">
          <button class="btn btn-ghost" id="changes">Request changes…</button>
          <button class="btn btn-primary" id="approve">Approve <span class="arrow">✓</span></button>
        </span>
      </div>`);
    wrap.appendChild(bar);

    bar.querySelector("#approve").addEventListener("click", () => decide("approved"));
    bar.querySelector("#changes").addEventListener("click", () => openChangesDialog());
  } else if (!isOwner() && d.status === "shared") {
    wrap.appendChild(el('<p class="muted rise" style="--i:2;margin-top:24px">Only the project owner can approve. You\u2019ll see the decision here once made.</p>'));
  }

  wrap.querySelector("#dl").addEventListener("click", async (e) => {
    e.target.disabled = true;
    try { const { url } = await api.signDownload(id); window.open(url, "_blank", "noopener"); }
    catch (err) { toast("This download link expired — try again.", "err"); }
    e.target.disabled = false;
  });

  async function decide(decision, note) {
    try {
      await api.decide(id, decision, note);
      toast(decision === "approved" ? "Approved — thank you." : "Change request sent.");
      render(outlet, { id }); // reflect new state
    } catch (err) { toast("Couldn\u2019t record your decision. " + err.message, "err"); }
  }

  function openChangesDialog() {
    const dlg = el(`
      <dialog>
        <span class="label section-label">Request changes</span>
        <div class="field"><label for="note">What should change?</label><textarea id="note" rows="3" required></textarea></div>
        <div style="display:flex;justify-content:flex-end;gap:10px">
          <button class="btn btn-ghost" value="cancel">Cancel</button>
          <button class="btn btn-primary" id="send">Send request</button>
        </div>
      </dialog>`);
    document.body.appendChild(dlg); dlg.showModal();
    dlg.querySelector('[value="cancel"]').addEventListener("click", () => dlg.close());
    dlg.querySelector("#send").addEventListener("click", () => {
      const note = dlg.querySelector("#note").value.trim();
      if (!note) { dlg.querySelector("#note").focus(); return; } // note required
      dlg.close(); decide("changes_requested", note);
    });
    dlg.addEventListener("close", () => dlg.remove());
  }
}
