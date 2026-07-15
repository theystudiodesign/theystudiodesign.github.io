// Module 5 — Files: simple shared files, no approval workflow.
import { api } from "../api.js";
import { el, esc, fmtDate, toast, ICON } from "../ui.js";

export async function render(outlet) {
  const wrap = el('<div class="content"></div>');
  outlet.innerHTML = ""; outlet.appendChild(wrap);
  let files = [];
  try { files = await api.files(); }
  catch (e) { wrap.innerHTML = `<div class="empty"><p class="h3">Couldn\u2019t load files.</p><p>${esc(e.message)}</p></div>`; return; }

  if (!files.length) { wrap.innerHTML = '<div class="empty rise"><p class="h3">No files yet.</p><p>Shared documents and assets will appear here.</p></div>'; return; }

  wrap.appendChild(el('<div class="rise"><span class="label section-label">Files</span></div>'));
  const list = el('<div class="list rise" style="--i:1"></div>');
  files.forEach((f) => {
    const row = el(`<div class="list-row">${ICON.file}<div class="grow"><div class="title">${esc(f.title)}</div><div class="mono">${esc(f.mime || "file")} · ${esc(fmtDate(f.created_at))}${f.size_bytes ? " · " + fmtSize(f.size_bytes) : ""}</div></div><button class="btn btn-ghost btn-sm" data-id="${f.id}">Download ↓</button></div>`);
    row.querySelector("button").addEventListener("click", async (e) => {
      e.target.disabled = true;
      try { const { url } = await api.signDownload(f.id); window.open(url, "_blank", "noopener"); }
      catch (err) { toast("This link expired — try again.", "err"); }
      e.target.disabled = false;
    });
    list.appendChild(row);
  });
  wrap.appendChild(list);
}
const fmtSize = (b) => b > 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB";
