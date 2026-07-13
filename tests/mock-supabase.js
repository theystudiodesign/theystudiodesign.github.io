/* ============================================================
   Mock Supabase — serveur local pour la suite d'intégration Sprint 12.
   Émule le sous-ensemble Auth (GoTrue) + REST (PostgREST) utilisé
   par l'app, avec isolation par utilisateur (équivalent RLS).
   Zéro dépendance — node http natif.
   ============================================================ */
'use strict';
const http = require('http');
const crypto = require('crypto');

const TABLES = ['clients', 'projets', 'taches', 'paiements', 'events', 'meta'];

function createMockSupabase({ schemaMissing = false } = {}) {
  // état: users par email; data par userId puis table puis pk
  const state = {
    users: new Map(),      // email -> {id, email, password}
    tokens: new Map(),     // access_token -> userId
    refresh: new Map(),    // refresh_token -> userId
    rows: new Map(),       // userId -> {table -> Map(pk -> row)}
    schemaMissing,
    log: []
  };

  const uid = () => crypto.randomUUID();
  const tok = () => crypto.randomBytes(24).toString('hex');

  function userRows(userId, table) {
    if (!state.rows.has(userId)) state.rows.set(userId, {});
    const u = state.rows.get(userId);
    if (!u[table]) u[table] = new Map();
    return u[table];
  }

  function session(user) {
    const access_token = tok(), refresh_token = tok();
    state.tokens.set(access_token, user.id);
    state.refresh.set(refresh_token, user.id);
    return {
      access_token, refresh_token, token_type: 'bearer',
      expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: user.id, email: user.email, aud: 'authenticated', role: 'authenticated',
              created_at: new Date().toISOString(), app_metadata: {}, user_metadata: {} }
    };
  }

  function send(res, status, body, headers = {}) {
    const h = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Expose-Headers': '*',
      ...headers
    };
    res.writeHead(status, h);
    res.end(body === undefined ? '' : JSON.stringify(body));
  }

  function readBody(req) {
    return new Promise(resolve => {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => { try { resolve(b ? JSON.parse(b) : null) } catch (e) { resolve(null) } });
    });
  }

  // parse un filtre PostgREST: id=in.(a,b) | id=eq.x | id=neq.x | id=not.in.(a,b)
  function rowMatches(row, params) {
    for (const [col, raw] of params) {
      if (['select', 'limit', 'offset', 'order', 'on_conflict', 'columns'].includes(col)) continue;
      const negated = raw.startsWith('not.');
      const expr = negated ? raw.slice(4) : raw;
      let ok;
      if (expr.startsWith('in.(')) {
        const list = expr.slice(4, -1).split(',').map(s => s.replace(/^"(.*)"$/, '$1'));
        ok = list.includes(String(row[col]));
      } else if (expr.startsWith('eq.')) {
        ok = String(row[col]) === expr.slice(3);
      } else if (expr.startsWith('neq.')) {
        ok = String(row[col]) !== expr.slice(4);
      } else { ok = true; }
      if (negated) ok = !ok;
      if (!ok) return false;
    }
    return true;
  }

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const path = u.pathname;
    state.log.push(req.method + ' ' + path + u.search);

    if (req.method === 'OPTIONS') return send(res, 204);

    /* ===== outils de test ===== */
    if (path === '/__reset') {
      state.users.clear(); state.tokens.clear(); state.refresh.clear(); state.rows.clear();
      return send(res, 200, { ok: true });
    }
    if (path === '/__dump') { // état complet (pour assertions)
      const out = {};
      for (const [userId, tables] of state.rows) {
        out[userId] = {};
        for (const t of Object.keys(tables)) out[userId][t] = [...tables[t].values()];
      }
      return send(res, 200, { users: [...state.users.values()].map(x => ({ id: x.id, email: x.email })), rows: out });
    }
    if (path === '/__schema') { // bascule "schema.sql non exécuté"
      state.schemaMissing = u.searchParams.get('missing') === '1';
      return send(res, 200, { schemaMissing: state.schemaMissing });
    }

    /* ===== AUTH (GoTrue) ===== */
    if (path === '/auth/v1/health') return send(res, 200, { version: 'mock', name: 'GoTrue' });

    if (path === '/auth/v1/signup' && req.method === 'POST') {
      const b = await readBody(req) || {};
      if (!b.email || !b.password) return send(res, 400, { error_code: 'validation_failed', msg: 'email and password required' });
      if (state.users.has(b.email)) return send(res, 422, { error_code: 'user_already_exists', code: 422, msg: 'User already registered' });
      const user = { id: uid(), email: b.email, password: b.password };
      state.users.set(b.email, user);
      return send(res, 200, session(user)); // autoconfirm: session directe
    }

    if (path === '/auth/v1/token' && req.method === 'POST') {
      const grant = u.searchParams.get('grant_type');
      const b = await readBody(req) || {};
      if (grant === 'password') {
        const user = state.users.get(b.email);
        if (!user || user.password !== b.password)
          return send(res, 400, { error_code: 'invalid_credentials', code: 400, msg: 'Invalid login credentials' });
        return send(res, 200, session(user));
      }
      if (grant === 'refresh_token') {
        const userId = state.refresh.get(b.refresh_token);
        if (!userId) return send(res, 400, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
        const user = [...state.users.values()].find(x => x.id === userId);
        return send(res, 200, session(user));
      }
      return send(res, 400, { msg: 'unsupported grant' });
    }

    if (path === '/auth/v1/user' && req.method === 'GET') {
      const t = (req.headers.authorization || '').replace(/^Bearer /, '');
      const userId = state.tokens.get(t);
      if (!userId) return send(res, 401, { msg: 'invalid token' });
      const user = [...state.users.values()].find(x => x.id === userId);
      return send(res, 200, { id: user.id, email: user.email, aud: 'authenticated', role: 'authenticated' });
    }

    if (path === '/auth/v1/logout') return send(res, 204);

    /* ===== REST (PostgREST) ===== */
    const m = path.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (m) {
      const table = m[1];
      if (state.schemaMissing || !TABLES.includes(table))
        return send(res, 404, { code: 'PGRST205', message: `Could not find the table 'public.${table}' in the schema cache`, hint: null, details: null });
      const t = (req.headers.authorization || '').replace(/^Bearer /, '');
      const userId = state.tokens.get(t);
      // clé anon sans session: RLS => aucune ligne visible, mais la table répond
      if (!userId) {
        if (req.method === 'GET') return send(res, 200, []);
        return send(res, 401, { code: '42501', message: 'permission denied (RLS)' });
      }
      const rows = userRows(userId, table);
      const params = [...u.searchParams.entries()];
      const pk = table === 'meta' ? 'user_id' : 'id';

      if (req.method === 'GET') {
        const out = [...rows.values()].filter(r => rowMatches(r, params));
        return send(res, 200, out);
      }
      if (req.method === 'POST') { // insert / upsert (Prefer: resolution=merge-duplicates)
        const prefer = req.headers.prefer || '';
        const merge = prefer.includes('merge-duplicates');
        let body = await readBody(req);
        if (!Array.isArray(body)) body = [body];
        for (const r of body) {
          const key = r[pk] != null ? String(r[pk]) : (table === 'meta' ? userId : null);
          if (key == null) return send(res, 400, { code: '23502', message: 'null value in primary key' });
          if (rows.has(key) && !merge)
            return send(res, 409, { code: '23505', message: 'duplicate key value violates unique constraint' });
          const prev = rows.get(key) || {};
          const next = { ...prev, ...r, user_id: userId };
          // trigger LWW: bump updated_at seulement si le client ne l'a pas changé
          if (next.updated_at === undefined || (rows.has(key) && prev.updated_at === next.updated_at))
            next.updated_at = new Date().toISOString();
          rows.set(key, next);
        }
        return send(res, prefer.includes('return=representation') ? 201 : 201,
          prefer.includes('return=representation') ? body : undefined,
          { 'Content-Type': 'application/json' });
      }
      if (req.method === 'DELETE') {
        const dead = [...rows.values()].filter(r => rowMatches(r, params));
        dead.forEach(r => rows.delete(String(r[pk])));
        return send(res, 204);
      }
      if (req.method === 'PATCH') {
        const b = await readBody(req);
        for (const r of rows.values()) if (rowMatches(r, params)) Object.assign(r, b, { updated_at: new Date().toISOString() });
        return send(res, 204);
      }
    }

    send(res, 404, { message: 'not found: ' + path });
  });

  return { server, state };
}

module.exports = { createMockSupabase };

if (require.main === module) {
  const port = +(process.argv[2] || 9899);
  createMockSupabase().server.listen(port, () => console.log('mock supabase on :' + port));
}
