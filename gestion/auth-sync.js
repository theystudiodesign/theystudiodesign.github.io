/* ============================================================
   THE'Y Gestion — auth-sync.js · authentification Supabase.
   Module 5/5. Le login ne touche JAMAIS aux données locales:
   il ne fait que démarrer SyncEngine (pull→merge→push queue).
   ============================================================ */
'use strict';
(function () {
  const SUPA_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  const ERR_MAP = [
    [/invalid login credentials/i, 'Email wla mot de passe ghalat'],
    [/email not confirmed/i, 'Confirme l’email li wslek 3ad 3awd dkhol'],
    [/already registered|user_already_exists/i, 'Compte déjà créé — utilise "Se connecter"'],
    [/rate limit/i, 'Bzzaf de tentatives — tsenna chwiya o 3awd'],
    [/failed to fetch|network/i, 'Serveur injoignable — chouf le Diagnostic']
  ];

  const AuthSync = {
    client: null, user: null,
    enabled() { return !!(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey); },
    errMsg(m) { for (const [re, fr] of ERR_MAP) if (re.test(m || '')) return fr; return m || 'Erreur inconnue'; },

    async init() {
      if (!this.enabled()) { SyncEngine._set('local'); return 'local'; }
      try {
        const { createClient } = await import(SUPA_LIB);
        this.client = createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
        this.client.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') { this.user = null; SyncEngine._set('off'); } });
        const { data: { session } } = await this.client.auth.getSession();
        if (!session) { SyncEngine._set('off'); return 'gate'; }
        this.user = session.user;
        SyncEngine.start();
        return 'session';
      } catch (e) {
        SyncEngine._set('err', String(e && e.message || e).slice(0, 160));
        return 'err';
      }
    },

    /* le login N'ÉCRASE JAMAIS le local: succès → SyncEngine.sync() (merge only) */
    async login(email, pass, signup) {
      const fn = signup ? this.client.auth.signUp : this.client.auth.signInWithPassword;
      const { data, error } = await fn.call(this.client.auth, { email, password: pass });
      if (error) return { error: this.errMsg(error.message) };
      if (signup && !data.session) return { error: 'Compte créé — confirme l’email puis reconnecte-toi' };
      this.user = data.session.user;
      SyncEngine.start();
      return { ok: true };
    },

    async logout() {
      try { if (this.client) await this.client.auth.signOut(); } catch (e) {}
      this.user = null;
      SyncEngine._set('off');
    }
  };
  window.AuthSync = AuthSync;
})();
