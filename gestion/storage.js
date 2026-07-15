/* ============================================================
   THE'Y Gestion — storage.js · la base LOCALE est LA source de vérité.
   Module 3/5. IndexedDB (THEY_STUDIO_DB), soft-delete (deletedAt),
   version + deviceId + updatedAt sur chaque ligne, diff automatique,
   migration one-shot depuis localStorage, BroadcastChannel multi-onglets.

   Contrat avec l'app (inchangé côté UI):
   - Storage.init()          → ouvre la base + migration éventuelle
   - Storage.loadDB()        → {clients,projets,taches,paiements,events,factureCounter,blCounter}
                                (lignes VIVANTES uniquement — l'UI ne voit jamais les tombstones)
   - Storage.persist(DB)     → diff vs dernier instantané de CET onglet:
                                stamp (updatedAt/version/deviceId), tombstones pour les
                                suppressions, écriture IDB, enfilage des ops, broadcast.
   - Storage.applyMerged(rows,tombstones) → écrit le résultat d'un merge cloud (SyncEngine)
   - Storage.onRemoteWrite(cb) → un AUTRE onglet a écrit → recharger + re-render
   ============================================================ */
'use strict';
(function () {
  const ENTS = ['clients', 'projets', 'taches', 'paiements', 'events'];
  const LEGACY_KEY = 'crm_gestion_clients_v1';
  const now = () => new Date().toISOString();
  const sig = o => { const c = { ...o }; delete c.updatedAt; delete c.version; delete c.deviceId; delete c.deletedAt; return JSON.stringify(c); };

  /* identifiant stable de CE navigateur (pour tracer l'origine des écritures) */
  let DEVICE_ID;
  try {
    DEVICE_ID = localStorage.getItem('they_device_id');
    if (!DEVICE_ID) { DEVICE_ID = 'dev-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); localStorage.setItem('they_device_id', DEVICE_ID); }
  } catch (e) { DEVICE_ID = 'dev-mem'; }

  /* instantané par-onglet: ce que CET onglet sait de la base (id → sig) — sert au diff des saves */
  const SNAP = {};            // ent -> Map(id -> sig)  (lignes vivantes)
  const KNOWN_DEAD = {};      // ent -> Set(id)         (tombstones connus)
  ENTS.forEach(e => { SNAP[e] = new Map(); KNOWN_DEAD[e] = new Set(); });

  let bc = null; try { bc = new BroadcastChannel('they-sync'); } catch (e) {}
  let remoteCb = null;

  const Storage = {
    ENTS, DEVICE_ID,

    async init() {
      await IDB.open();
      if (bc) bc.onmessage = m => { if (m && m.data && m.data.type === 'write' && m.data.dev !== undefined && remoteCb) remoteCb(); };
    },

    /* migration one-shot localStorage → IndexedDB (idempotente, gardée par un flag localStorage).
       Retourne true si des données legacy ont été importées. */
    async migrateFromLegacy() {
      let done = false; try { done = localStorage.getItem('they_idb_migrated') === '1'; } catch (e) {}
      if (done) return false;
      const already = (await IDB.getAll('clients')).length || (await IDB.getAll('paiements')).length;
      let legacy = null; try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch (e) {}
      let imported = false;
      if (!already && legacy && Array.isArray(legacy.clients)) {
        const t = now();
        for (const ent of ENTS) {
          const rows = (legacy[ent] || []).filter(r => r && r.id).map(r => ({ ...r, updatedAt: r.updatedAt || t, version: 1, deviceId: DEVICE_ID }));
          if (rows.length) { await IDB.putAll(ent, rows); imported = true; }
        }
        await IDB.put('settings', { k: 'factureCounter', v: +legacy.factureCounter || 0 });
        await IDB.put('settings', { k: 'blCounter', v: +legacy.blCounter || 0 });
      }
      try { localStorage.setItem('they_idb_migrated', '1'); } catch (e) {}
      return imported;
    },

    async loadDB() {
      const db = {};
      for (const ent of ENTS) {
        const all = await IDB.getAll(ent);
        SNAP[ent] = new Map(); KNOWN_DEAD[ent] = new Set();
        db[ent] = [];
        for (const r of all) {
          if (r.deletedAt) { KNOWN_DEAD[ent].add(r.id); continue; }
          SNAP[ent].set(r.id, sig(r));
          db[ent].push(r);
        }
      }
      db.factureCounter = ((await IDB.get('settings', 'factureCounter')) || {}).v || 0;
      db.blCounter = ((await IDB.get('settings', 'blCounter')) || {}).v || 0;
      return db;
    },

    /* Diff + stamp + persist + queue. Appelé par save() — fire-and-forget côté UI. */
    async persist(DB) {
      const t = now();
      const toPut = {}; const ops = [];
      for (const ent of ENTS) {
        toPut[ent] = [];
        const seen = new Set();
        for (const r of (DB[ent] || [])) {
          if (!r || !r.id) continue;
          seen.add(r.id);
          const prev = SNAP[ent].get(r.id);
          const cur = sig(r);
          if (prev === undefined) {                     // création (ou résurrection volontaire)
            r.updatedAt = t; r.version = (r.version || 0) + 1; r.deviceId = DEVICE_ID; delete r.deletedAt;
            toPut[ent].push({ ...r });
            ops.push([ent, r.id, KNOWN_DEAD[ent].has(r.id) ? 'UPDATE' : 'CREATE']);
            KNOWN_DEAD[ent].delete(r.id);
          } else if (prev !== cur) {                     // modification
            r.updatedAt = t; r.version = (r.version || 0) + 1; r.deviceId = DEVICE_ID;
            toPut[ent].push({ ...r });
            ops.push([ent, r.id, 'UPDATE']);
          }
          SNAP[ent].set(r.id, cur);
        }
        for (const [id] of [...SNAP[ent]]) {            // suppressions faites dans CET onglet
          if (seen.has(id)) continue;
          SNAP[ent].delete(id);
          KNOWN_DEAD[ent].add(id);
          const old = await IDB.get(ent, id);
          const dead = { ...(old || { id }), deletedAt: t, updatedAt: t, version: ((old && old.version) || 0) + 1, deviceId: DEVICE_ID };
          toPut[ent].push(dead);
          ops.push([ent, id, 'DELETE']);
        }
        if (toPut[ent].length) await IDB.putAll(ent, toPut[ent]);
      }
      await IDB.put('settings', { k: 'factureCounter', v: +DB.factureCounter || 0 });
      await IDB.put('settings', { k: 'blCounter', v: +DB.blCounter || 0 });
      for (const [ent, id, op] of ops) await Queue.add(ent, id, op, null);
      if (ops.length && bc) { try { bc.postMessage({ type: 'write', dev: DEVICE_ID }); } catch (e) {} }
      return ops.length;
    },

    /* écrit le résultat d'un merge cloud (lignes gagnantes, vivantes ou tombstones) */
    async applyMerged(ent, rows) {
      if (!rows.length) return;
      await IDB.putAll(ent, rows);
      for (const r of rows) {
        if (r.deletedAt) { SNAP[ent].delete(r.id); KNOWN_DEAD[ent].add(r.id); }
        else { SNAP[ent].set(r.id, sig(r)); KNOWN_DEAD[ent].delete(r.id); }
      }
      if (bc) { try { bc.postMessage({ type: 'write', dev: DEVICE_ID }); } catch (e) {} }
    },

    async rowsWithTombstones(ent) { return IDB.getAll(ent); },
    async getRow(ent, id) { return IDB.get(ent, id); },
    async setCounters(fc, bl) { await IDB.put('settings', { k: 'factureCounter', v: fc }); await IDB.put('settings', { k: 'blCounter', v: bl }); },
    async syncState(k) { return ((await IDB.get('sync_state', k)) || {}).v; },
    async setSyncState(k, v) { await IDB.put('sync_state', { k, v }); },
    onRemoteWrite(cb) { remoteCb = cb; },

    /* purge PERMANENTE d'un tombstone — uniquement après confirmation serveur (SyncEngine) */
    async purgeTombstone(ent, id) {
      await IDB.del(ent, id);
      KNOWN_DEAD[ent].delete(id);
    },

    /* outillage tests / reset volontaire */
    async dump() { const out = {}; for (const ent of ENTS) out[ent] = (await IDB.getAll(ent)); return out; },
    async wipeData() { for (const ent of ENTS) await IDB.clear(ent); await IDB.clear('queue'); ENTS.forEach(e => { SNAP[e] = new Map(); KNOWN_DEAD[e] = new Set(); }); }
  };
  window.Storage = Storage;
})();
