/* ============================================================
   THE'Y Gestion — idb.js · wrapper IndexedDB minimal (Promises).
   Module 1/5 du SyncEngine v2. Zéro dépendance.
   ============================================================ */
'use strict';
(function () {
  const DB_NAME = 'THEY_STUDIO_DB', DB_VERSION = 1;
  const STORES = ['clients', 'projets', 'taches', 'paiements', 'events', 'queue', 'settings', 'sync_state'];
  let _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of STORES) {
          if (!db.objectStoreNames.contains(s)) {
            db.createObjectStore(s, { keyPath: (s === 'settings' || s === 'sync_state') ? 'k' : 'id' });
          }
        }
      };
      req.onsuccess = () => { _db = req.result; _db.onversionchange = () => { try { _db.close(); } catch (e) {} _db = null; }; resolve(_db); };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB bloquée'));
    });
  }
  function tx(store, mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const os = t.objectStore(store);
      let out;
      try { out = fn(os); } catch (e) { reject(e); return; }
      t.oncomplete = () => resolve(out && out.__reqs ? out.__reqs.map(r => r.result) : (out && out.result !== undefined ? out.result : out));
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('tx abort'));
    }));
  }
  const IDB = {
    open,
    getAll(store) { return tx(store, 'readonly', os => os.getAll()); },
    get(store, key) { return tx(store, 'readonly', os => os.get(key)); },
    put(store, row) { return tx(store, 'readwrite', os => os.put(row)); },
    putAll(store, rows) { return tx(store, 'readwrite', os => { const reqs = rows.map(r => os.put(r)); return { __reqs: reqs }; }); },
    del(store, key) { return tx(store, 'readwrite', os => os.delete(key)); },
    clear(store) { return tx(store, 'readwrite', os => os.clear()); },
    async wipe() { for (const s of STORES) await IDB.clear(s); },
    STORES
  };
  window.IDB = IDB;
})();
