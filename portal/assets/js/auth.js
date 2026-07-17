// ============================================================
// Auth — MAGIC LINK ONLY (ratified decision #3). No passwords.
// Invite-only: signup surface does not exist.
// ============================================================
import { sb } from "./supabase.js";

let _session = null;
let _member = null; // { user_id, client_id, role, status, ... } for the active client

export async function loadSession() {
  const { data } = await sb.auth.getSession();
  _session = data.session || null;
  return _session;
}

export function session() { return _session; }
export function user() { return _session ? _session.user : null; }

/** Membership row(s) for the signed-in user. First active row = active client (multi-client = v2). */
export async function loadMembership() {
  if (!_session) return null;
  const { data, error } = await sb
    .from("portal_members")
    .select("id, client_id, role, status")
    .eq("status", "active");
  if (error) return null;
  _member = (data && data[0]) || null;
  return _member;
}

export function member() { return _member; }
export function role() { return _member ? _member.role : null; }
export function clientId() { return _member ? _member.client_id : null; }
export function isOwner() { return _member && (_member.role === "client_owner" || _member.role === "studio"); }

/** Send a magic link to an (invited) email. Generic result — never reveal whether the email exists. */
export async function sendMagicLink(email) {
  const redirectTo = location.origin + "/";
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false }, // invite-only
  });
  return { ok: !error, error };
}

export async function signOut() {
  await sb.auth.signOut();
  _session = null; _member = null;
}

/** react to auth changes (magic-link return, token refresh, logout) */
export function onAuthChange(cb) {
  return sb.auth.onAuthStateChange((_evt, s) => { _session = s; cb(s); });
}
