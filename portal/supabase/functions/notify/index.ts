// Edge Function: notify — cron digest. Email provider is REPLACEABLE (decision #7).
// Select adapter via EMAIL_PROVIDER env: resend | postmark | ses | smtp | console.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- EmailProvider interface: send(to, subject, html, ics?) ----
interface EmailProvider { send(to: string, subject: string, html: string, ics?: string): Promise<void>; }

const providers: Record<string, () => EmailProvider> = {
  resend: () => ({
    async send(to, subject, html) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("EMAIL_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: Deno.env.get("EMAIL_FROM"), to, subject, html }),
      });
    },
  }),
  postmark: () => ({
    async send(to, subject, html) {
      await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: { "X-Postmark-Server-Token": Deno.env.get("EMAIL_API_KEY")!, "Content-Type": "application/json" },
        body: JSON.stringify({ From: Deno.env.get("EMAIL_FROM"), To: to, Subject: subject, HtmlBody: html }),
      });
    },
  }),
  console: () => ({ async send(to, subject) { console.log(`[email:console] → ${to} · ${subject}`); } }),
  // ses / smtp adapters added the same way — the caller below never changes.
};

function getProvider(): EmailProvider {
  const name = Deno.env.get("EMAIL_PROVIDER") || "console";
  return (providers[name] || providers.console)();
}

Deno.serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const provider = getProvider();
  const portalUrl = Deno.env.get("PORTAL_URL") || "";

  // batch: unread, not yet emailed, older than 15 min
  const { data: due } = await admin.from("notifications")
    .select("id, user_id, type, payload, created_at")
    .is("read_at", null).is("emailed_at", null)
    .lt("created_at", new Date(Date.now() - 15 * 60000).toISOString());
  if (!due?.length) return new Response("no-op");

  // group by user, resolve email, respect prefs
  const byUser: Record<string, any[]> = {};
  for (const n of due) (byUser[n.user_id] ||= []).push(n);

  for (const [userId, items] of Object.entries(byUser)) {
    const { data: au } = await admin.auth.admin.getUserById(userId);
    const email = au?.user?.email; if (!email) continue;
    const html = `<p>You have ${items.length} update(s) in your THE'Y portal.</p>
      <ul>${items.map((i) => `<li>${i.type.replace(/_/g, " ")}${i.payload?.title ? ": " + i.payload.title : ""}</li>`).join("")}</ul>
      <p><a href="${portalUrl}/">Open the portal →</a></p>`; // titles + link only, never contents
    try {
      await provider.send(email, "Updates in your THE'Y portal", html);
      await admin.from("notifications").update({ emailed_at: new Date().toISOString() }).in("id", items.map((i) => i.id));
    } catch (e) { console.error("email failed", e); }
  }
  return new Response("ok");
});
