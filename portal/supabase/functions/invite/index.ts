// Edge Function: invite — magic-link invite (no passwords). Service role stays here only.
// Studio invites any role; client_owner may invite client_member of their own client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const authz = req.headers.get("Authorization") || "";
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // caller identity (from their JWT)
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: authz } } });
  const { data: u } = await asCaller.auth.getUser();
  if (!u?.user) return json(401, { error: "unauthorized" });

  const { email, client_id, role } = await req.json().catch(() => ({}));
  if (!email || !client_id || !role) return json(400, { error: "missing_fields" });

  // authorize: studio → any; client_owner → client_member of own client only
  const { data: me } = await asCaller.from("portal_members").select("role,client_id,status").eq("status", "active");
  const studio = me?.some((m) => m.role === "studio");
  const ownerHere = me?.some((m) => m.role === "client_owner" && m.client_id === client_id);
  if (!studio && !(ownerHere && role === "client_member")) return json(403, { error: "role_not_allowed" });

  const admin = createClient(url, svc);
  // idempotency: already a member?
  const { data: existing } = await admin.from("portal_members").select("id").eq("client_id", client_id);
  // invite (magic link email); if the user already exists this is a no-op auth-side
  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: (Deno.env.get("PORTAL_URL") || "") + "/" });
  const userId = invited?.user?.id;
  if (invErr && !userId) return json(400, { error: invErr.message });

  const { data: member, error: mErr } = await admin.from("portal_members")
    .upsert({ user_id: userId, client_id, role, status: "invited", invited_by: u.user.id }, { onConflict: "user_id,client_id" })
    .select("id").single();
  if (mErr) return json(409, { error: "already_member" });
  return json(201, { member_id: member.id });
});

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
