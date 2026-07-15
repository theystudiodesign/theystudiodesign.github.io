/* ============================================================
   THE'Y Gestion — queue.js · file d'opérations persistante (survit au refresh).
   Module 2/5. Opérations: CREATE / UPDATE / DELETE.
   Chaque op: {id, entity, entityId, op, payload, createdAt, retryCount, status}.
   Coalescing par (entity, entityId):
     CREATE+UPDATE→CREATE · UPDATE+UPDATE→UPDATE · CREATE+DELETE→(rien, jamais parti)
     UPDATE+DELETE→DELETE · DELETE+CREATE→UPDATE (recréation même id)
   ============================================================ */
'use strict';
(function () {
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const Queue = {
    async all() {
      const ops = await IDB.getAll('queue');
      return ops.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    },
    async count() { return (await IDB.getAll('queue')).length; },
    async add(entity, entityId, op, payload) {
      const existing = (await IDB.getAll('queue')).filter(o => o.entity === entity && o.entityId === entityId);
      const prev = existing[0]; // au plus 1 par (entity, entityId) grâce au coalescing
      if (prev) {
        if (prev.op === 'CREATE' && op === 'DELETE') { await IDB.del('queue', prev.id); return null; } // jamais parti → rien à faire côté serveur
        if (prev.op === 'CREATE') { prev.payload = payload; prev.createdAt = new Date().toISOString(); await IDB.put('queue', prev); return prev; } // CREATE absorbe les updates
        if (prev.op === 'DELETE' && op === 'CREATE') { op = 'UPDATE'; }
        const merged = { ...prev, op: op === 'DELETE' ? 'DELETE' : prev.op === 'DELETE' ? 'DELETE' : 'UPDATE', payload, createdAt: new Date().toISOString(), retryCount: 0, status: 'pending' };
        if (op === 'DELETE') merged.op = 'DELETE';
        await IDB.put('queue', merged);
        return merged;
      }
      const rec = { id: uid(), entity, entityId, op, payload, createdAt: new Date().toISOString(), retryCount: 0, status: 'pending' };
      await IDB.put('queue', rec);
      return rec;
    },
    async remove(id) { await IDB.del('queue', id); },
    async bump(id, err) {
      const o = await IDB.get('queue', id);
      if (!o) return;
      o.retryCount = (o.retryCount || 0) + 1;
      o.status = 'error';
      o.lastError = String(err && err.message || err).slice(0, 200);
      await IDB.put('queue', o);
    },
    async clear() { await IDB.clear('queue'); }
  };
  window.Queue = Queue;
})();
