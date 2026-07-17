// ============================================================
// API layer — the ONLY place that knows Supabase shapes (API_CONTRACTS.md).
// Views v_client_* are the compatibility surface; RLS scopes every read.
// Server-authorized: no client-side trust — the UI never filters for security.
// ============================================================
import { sb } from "./supabase.js";

const rows = (r) => (r.error ? Promise.reject(r.error) : r.data || []);
const one = (r) => (r.error ? Promise.reject(r.error) : r.data);

export const api = {
  // dashboard header (single round-trip)
  summary: () => sb.rpc("portal_summary").then(one),

  projects: () =>
    sb.from("v_client_projects").select("*").order("updated_at", { ascending: false }).then(rows),
  project: (id) =>
    sb.from("v_client_projects").select("*").eq("id", id).maybeSingle().then(one),

  milestones: (projectId) =>
    sb.from("milestones").select("id,title,due_at,status,sort").eq("portal_project_id", projectId)
      .is("deleted_at", null).order("sort").then(rows),

  notes: (projectId) =>
    sb.from("v_client_notes").select("*").eq("portal_project_id", projectId)
      .order("published_at", { ascending: false }).then(rows),

  deliverables: (projectId) => {
    let q = sb.from("v_client_deliverables").select("*").order("created_at", { ascending: false });
    if (projectId) q = q.eq("portal_project_id", projectId);
    return q.then(rows);
  },
  files: () =>
    sb.from("v_client_files").select("*").order("created_at", { ascending: false }).then(rows),

  approvals: (assetId) =>
    sb.from("approvals").select("id,decision,note,decided_at,decided_by").eq("asset_id", assetId)
      .order("decided_at", { ascending: false }).then(rows),
  decide: (assetId, decision, note) =>
    sb.from("approvals").insert({ asset_id: assetId, decision, note: note || null }).then(one),

  invoices: () =>
    sb.from("invoices").select("id,number,issued_at,due_at,amount_cents,currency,status,pdf_path")
      .order("issued_at", { ascending: false }).then(rows),

  // downloads: server-side entitlement check + audit (RPC), then Storage-API signed URL
  // (storage.objects RLS authorizes the signing — see migration 004).
  signDownload: async (asset) => {
    await sb.rpc("log_download", { p_entity: "asset", p_id: asset.id }).then(one);
    const bucket = asset.kind === "file" || asset.file_path ? "assets" : "assets";
    const { data, error } = await sb.storage.from(bucket).createSignedUrl(asset.file_path, 300);
    if (error) throw error;
    return { url: data.signedUrl };
  },
  signInvoice: async (invoice) => {
    await sb.rpc("log_download", { p_entity: "invoice", p_id: invoice.id }).then(one);
    const { data, error } = await sb.storage.from("invoices").createSignedUrl(invoice.pdf_path, 300);
    if (error) throw error;
    return { url: data.signedUrl };
  },

  // native booking
  slots: (from, to) => sb.rpc("list_slots", { p_from: from, p_to: to }).then(rows),
  book: (startsAt, title) => sb.rpc("book_slot", { p_starts_at: startsAt, p_title: title || null }).then(one),
  cancelBooking: (id) => sb.rpc("cancel_booking", { p_id: id }).then(one),
  bookings: () =>
    sb.from("bookings").select("id,title,starts_at,ends_at,status").order("starts_at", { ascending: false }).then(rows),

  // notifications
  notifications: (unreadOnly) => {
    let q = sb.from("notifications").select("id,type,payload,created_at,read_at").order("created_at", { ascending: false }).limit(40);
    if (unreadOnly) q = q.is("read_at", null);
    return q.then(rows);
  },
  markRead: (id) => sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).then(() => true),
  markAllRead: () => sb.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).then(() => true),

  // profile
  updatePrefs: (memberId, prefs) =>
    sb.from("portal_members").update({ notification_prefs: prefs }).eq("id", memberId).then(() => true),
};
