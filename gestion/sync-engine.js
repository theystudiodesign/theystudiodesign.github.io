/* ============================================================
   THE'Y Gestion — sync-engine.js · synchronisation en ARRIÈRE-PLAN.
   Module 4/5. Le cloud n'est JAMAIS la source de vérité.

   Cycle sync() (single-flight):
     1. PULL   : télécharge les lignes distantes (tombstones inclus)
     2. MERGE  : par ligne — effTime = max(updatedAt, deletedAt);
                 le plus récent gagne; à égalité: le tombstone gagne, sinon LOCAL garde.
                 Une ligne locale ABSENTE du cloud n'est JAMAIS supprimée:
                 si aucune op en attente, elle est ré-enfilée (auto-guérison).
     3. PERSIST: écrit les adoptions en IDB, recharge la mémoire, re-render
     4. PUSH   : rejoue la queue (upsert de l'état COURANT de chaque ligne,
                 tombstones compris — AUCUN DELETE physique, jamais).
   Déclencheurs: après save (débounce), event online, retour d'onglet, login, boot.
   ============================================================ */
'use strict';
(function () {
  const ENTS = ['clients', 'projets', 'taches', 'paiements', 'events'];
  /* mapping colonnes app (camelCase) ↔ SQL (snake_case) */
  const COLS = {
    clients:  { plain: ['id', 'name', 'type', 'statut', 'devise', 'salaire', 'email', 'phone', 'ice', 'societe', 'website', 'adresse', 'khedma', 'notes'], map: {} },
    projets:  { plain: ['id', 'name', 'type', 'statut', 'prix', 'deadline', 'notes'], map: { clientId: 'client_id' } },
    taches:   { plain: ['id', 'label', 'statut', 'priorite', 'deadline', 'details'], map: { clientId: 'client_id', projetId: 'projet_id' } },
    paiements:{ plain: ['id', 'label', 'type', 'montant', 'devise', 'statut', 'date', 'methode', 'notes'], map: { clientId: 'client_id', projetId: 'projet_id', factureNum: 'facture_num', blNum: 'bl_num' } },
    events:   { plain: ['id', 'title', 'type', 'date', 'notes'], map: { clientId: 'client_id' } }
  };
  const SYNC_COLS = { updatedAt: 'updated_at', deletedAt: 'deleted_at', version: 'version', deviceId: 'device_id' };

  function toRow(ent, o) {
    const c = COLS[ent], row = {};
    c.plain.forEach(k => { if (o[k] !== undefined) row[k] = o[k] === '' ? null : o[k]; });
    Object.entries(c.map).forEach(([a, b]) => { row[b] = o[a] === '' ? null : (o[a] ?? null); });
    Object.entries(SYNC_COLS).forEach(([a, b]) => { if (o[a] !== undefined) row[b] = o[a] ?? null; });
    ['deadline', 'date'].forEach(k => { if (row[k] === '') row[k] = null; });
    if (!row.updated_at) row.updated_at = new Date().toISOString();
    if (row.version == null) row.version = 1;
    return row;
  }
  function fromRow(ent, r) {
    const c = COLS[ent], o = {};
    c.plain.forEach(k => { if (r[k] != null) o[k] = r[k]; });
    Object.entries(c.map).forEach(([a, b]) => { if (r[b] != null) o[a] = r[b]; });
    Object.entries(SYNC_COLS).forEach(([a, b]) => { if (r[b] != null) o[a] = r[b]; });
    ['montant', 'prix', 'salaire', 'version'].forEach(k => { if (o[k] != null) o[k] = +o[k]; });
    return o;
  }
  const eff = r => { const u = r.updatedAt || '', d = r.deletedAt || ''; return u > d ? u : d; };

  const SyncEngine = {
    TOMBSTONE_TTL_MS: 30 * 24 * 3600 * 1000, // 30 jours
    status: 'local', _running: null, _timer: null, _cbs: [],
    onStatus(cb) { this._cbs.push(cb); },
    _set(s, detail) { this.status = s; this.lastDetail = detail || ''; this._cbs.forEach(cb => { try { cb(s, detail); } catch (e) {} }); },

    schedule(ms) { clearTimeout(this._timer); this._timer = setTimeout(() => this.sync().catch(() => {}), ms == null ? 1200 : ms); },

    async sync() {
      if (this._running) return this._running;
      this._running = this._sync().finally(() => { this._running = null; });
      return this._running;
    },

    async _sync() {
      const A = window.AuthSync;
      if (!A || !A.client || !A.user) { this._set(A && A.client ? 'off' : 'local'); return; }
      this._set('pending');
      try {
        /* ---------- 1 · PULL (tombstones inclus) ---------- */
        const remote = {};
        for (const ent of ENTS) {
          const { data, error } = await A.client.from(ent).select('*');
          if (error) throw Object.assign(error, { __ent: ent, __op: 'pull' });
          remote[ent] = (data || []).map(r => fromRow(ent, r));
        }
        const { data: meta } = await A.client.from('meta').select('*').maybeSingle();

        /* ---------- 2 · MERGE (le local n'est JAMAIS écrasé par plus ancien) ---------- */
        const pendingIds = {};
        (await Queue.all()).forEach(o => { (pendingIds[o.entity] = pendingIds[o.entity] || new Set()).add(o.entityId); });
        for (const ent of ENTS) {
          const local = new Map((await Storage.rowsWithTombstones(ent)).map(r => [r.id, r]));
          const adopt = [];
          for (const r of remote[ent]) {
            const l = local.get(r.id);
            if (!l) { adopt.push(r); continue; }                       // inconnu ici → adopté (vivant OU tombstone)
            const re = eff(r), le = eff(l);
            if (re > le) adopt.push(r);                                 // distant strictement plus récent
            else if (re === le && r.deletedAt && !l.deletedAt) adopt.push(r); // égalité: le tombstone gagne
            /* sinon: le LOCAL garde — jamais d'écrasement par de l'ancien */
          }
          if (adopt.length) await Storage.applyMerged(ent, adopt);
          /* auto-guérison: ligne locale vivante absente du cloud et sans op en attente → ré-enfilée */
          const remoteIds = new Set(remote[ent].map(r => r.id));
          for (const [id, l] of local) {
            if (!l.deletedAt && !remoteIds.has(id) && !(pendingIds[ent] && pendingIds[ent].has(id))) {
              await Queue.add(ent, id, 'CREATE', null);
            }
          }
        }
        if (meta && window.DB) {
          window.DB.factureCounter = Math.max(+window.DB.factureCounter || 0, +meta.facture_counter || 0);
          window.DB.blCounter = Math.max(+window.DB.blCounter || 0, +meta.bl_counter || 0);
          await Storage.setCounters(window.DB.factureCounter, window.DB.blCounter);
        }
        /* recharger la mémoire depuis la vérité locale mergée + re-render (callbacks fournis par l'app) */
        if (window.__afterMerge) await window.__afterMerge();

        /* ---------- 3 · PUSH — rejoue la queue (état COURANT de chaque ligne) ---------- */
        const ops = await Queue.all();
        for (const op of ops) {
          const row = await Storage.getRow(op.entity, op.entityId);
          if (!row) { await Queue.remove(op.id); continue; }
          const { error } = await A.client.from(op.entity).upsert([toRow(op.entity, row)]);
          if (error) { await Queue.bump(op.id, error); throw Object.assign(error, { __ent: op.entity, __op: op.op }); }
          await Queue.remove(op.id);
        }
        const { error: em } = await A.client.from('meta').upsert({
          user_id: A.user.id,
          facture_counter: (window.DB && window.DB.factureCounter) || 0,
          bl_counter: (window.DB && window.DB.blCounter) || 0
        });
        if (em) throw Object.assign(em, { __ent: 'meta', __op: 'upsert' });
        await Storage.setSyncState('lastSync', new Date().toISOString());
        /* nettoyage permanent: tombstone local purgé UNIQUEMENT si (a) le serveur le
           confirme (même suppression visible au pull) et (b) il a dépassé le TTL. */
        const cutoff = new Date(Date.now() - SyncEngine.TOMBSTONE_TTL_MS).toISOString();
        for (const ent of ENTS) {
          const confirmed = new Map(remote[ent].filter(r => r.deletedAt).map(r => [r.id, r.deletedAt]));
          for (const l of await Storage.rowsWithTombstones(ent)) {
            if (l.deletedAt && l.deletedAt < cutoff && confirmed.has(l.id)) await Storage.purgeTombstone(ent, l.id);
          }
        }
        this._set((await Queue.count()) ? 'pending' : 'ok');
      } catch (e) {
        const missingCol = /deleted_at|version|device_id/.test(String(e && e.message)) && /column|schema/i.test(String(e && e.message));
        this._set('err', missingCol
          ? 'Migration SQL requise: exécuter supabase/migration-tombstones.sql dans Supabase (SQL Editor)'
          : ((e && e.__ent ? e.__ent + ' · ' : '') + String(e && e.message || e).slice(0, 160)));
        /* retry automatique avec backoff borné (2s → 4s → 8s … max 60s) */
        this._fails = (this._fails || 0) + 1;
        this.schedule(Math.min(60000, 2000 * Math.pow(2, Math.min(this._fails, 5))));
        return;
      }
      this._fails = 0;
    },

    start() {
      window.addEventListener('online', () => this.sync().catch(() => {}));
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.sync().catch(() => {}); });
      this.sync().catch(() => {});
    }
  };
  window.SyncEngine = SyncEngine;
})();
