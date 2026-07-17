// Mock Supabase for portal QA — implements the exact endpoints api.js / auth.js call.
// Seeded with one client, owner + member, projects, milestones, notes, assets, invoices, slots.
const http = require("http");
const SEED = require("./seed.json");

function createMockPortal() {
  const db = JSON.parse(JSON.stringify(SEED));
  let role = "client_owner"; // switch via /__role
  const send = (res, code, body) => {
    res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" });
    res.end(body === undefined ? "" : JSON.stringify(body));
  };
  const read = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b ? JSON.parse(b) : {})); });

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://x"); const p = u.pathname;
    if (req.method === "OPTIONS") return send(res, 204);

    // test controls
    if (p === "/__role") { role = u.searchParams.get("r") || "client_owner"; return send(res, 200, { role }); }
    if (p === "/__reset") { Object.assign(db, JSON.parse(JSON.stringify(SEED))); return send(res, 200, { ok: true }); }
    if (p === "/__dump") return send(res, 200, db);

    // ---- AUTH ----
    if (p === "/auth/v1/health") return send(res, 200, { name: "GoTrue" });
    if (p === "/auth/v1/otp" && req.method === "POST") return send(res, 200, {}); // magic link requested
    if (p === "/auth/v1/user" || p === "/auth/v1/session") return send(res, 200, mockUser());
    if (p === "/auth/v1/token") return send(res, 200, { access_token: "mock", refresh_token: "mock", user: mockUser().user, expires_in: 3600 });
    if (p === "/auth/v1/logout") return send(res, 204);

    // ---- REST ----
    if (p.startsWith("/storage/v1/object/sign/")) return send(res, 200, { signedURL: "/storage/v1/object/sign/mock?token=x", signedUrl: "http://localhost:0/signed.pdf" });
    if (p.startsWith("/rest/v1/rpc/")) return rpc(res, p.split("/").pop(), await read(req));
    if (p.startsWith("/rest/v1/")) return rest(req, res, p.slice("/rest/v1/".length), u, await read(req));
    send(res, 404, { error: "not_found" });
  });

  function mockUser() { return { user: { id: "u_owner", email: "sara@atlascapital.co" }, access_token: "mock", refresh_token: "mock", expires_at: Date.now() / 1000 + 3600 }; }

  function rest(req, res, table, u, body) {
    table = table.split("?")[0];
    if (table === "portal_members") {
      if (req.method === "PATCH") return send(res, 200, []);
      return send(res, 200, [{ id: "m1", client_id: "c_atlas", role, status: "active", notification_prefs: {} }]);
    }
    if (table === "notifications") {
      if (req.method === "PATCH") { db.notifications.forEach((n) => (n.read_at = new Date().toISOString())); return send(res, 200, []); }
      let rows = db.notifications;
      if ((u.searchParams.get("read_at") || "") === "is.null") rows = rows.filter((n) => !n.read_at);
      return send(res, 200, rows);
    }
    if (table === "approvals") {
      if (req.method === "POST") { const d = { id: "ap" + db.approvals.length, ...body, decided_at: new Date().toISOString() };
        db.approvals.push(d); const a = db.assets.find((x) => x.id === body.asset_id); if (a) a.status = body.decision; return send(res, 201, d); }
      const aid = (u.searchParams.get("asset_id") || "").replace("eq.", "");
      return send(res, 200, db.approvals.filter((a) => a.asset_id === aid));
    }
    if (table === "bookings") return send(res, 200, db.bookings);
    if (table === "availability_rules") return send(res, 200, db.availability_rules);
    // views + simple tables
    const map = {
      v_client_projects: db.projects, v_client_notes: db.notes,
      v_client_deliverables: db.assets.filter((a) => a.kind === "deliverable" && a.status !== "draft"),
      v_client_files: db.assets.filter((a) => a.kind === "file" && a.status === "shared"),
      milestones: db.milestones, invoices: db.invoices,
    };
    let rows = map[table] || [];
    // primitive eq filters
    for (const [k, v] of u.searchParams.entries()) {
      if (v.startsWith("eq.")) rows = rows.filter((r) => String(r[k]) === v.slice(3));
    }
    return send(res, 200, rows);
  }

  function rpc(res, fn, body) {
    if (fn === "portal_summary") return send(res, 200, { projects: db.projects.length, unread: db.notifications.filter((n) => !n.read_at).length, invoices_due: db.invoices.filter((i) => i.status === "sent").length, next_meeting: null });
    if (fn === "log_download") return send(res, 200, { ok: true });
    if (fn === "list_slots") return send(res, 200, db.slots);
    if (fn === "book_slot") {
      const taken = db.bookings.some((b) => b.status === "confirmed" && b.starts_at === body.p_starts_at);
      if (taken) return send(res, 400, { code: "P0003", message: "slot_taken" });
      const b = { id: "bk" + db.bookings.length, title: body.p_title || "Project check-in", starts_at: body.p_starts_at, ends_at: body.p_starts_at, status: "confirmed" };
      db.bookings.push(b); db.slots = db.slots.filter((s) => s.starts_at !== body.p_starts_at);
      return send(res, 200, { booking_id: b.id, starts_at: b.starts_at, ends_at: b.ends_at });
    }
    if (fn === "cancel_booking") { const b = db.bookings.find((x) => x.id === body.p_id); if (b) b.status = "canceled"; return send(res, 200, { ok: true }); }
    send(res, 404, { message: "unknown_rpc" });
  }

  return { server };
}
module.exports = { createMockPortal };
