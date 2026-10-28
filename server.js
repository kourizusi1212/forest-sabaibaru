const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000, MAX = 4;
const rooms = new Map();
const page = () => fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
const server = http.createServer((req, res) => {
  if (req.url === '/healthz') return res.end('ok');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page());
});
const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => A[Math.random() * A.length | 0]).join(''); } while (rooms.has(c)); return c; };
const seedOf = c => { let h = 2166136261; for (const ch of c) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const send = (ws, o) => ws.readyState === 1 && ws.send(JSON.stringify(o));
const bcast = (r, o) => r.clients.forEach(c => send(c, o));

wss.on('connection', ws => {
  ws.alive = true; ws.on('pong', () => ws.alive = true);
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.k === 'join' && !ws.room) {
      let code = m.create ? newCode() : String(m.code || '').toUpperCase().slice(0, 4);
      if (m.create) rooms.set(code, { code, t0: Date.now(), clients: new Set(), p: {}, dirty: false });
      const r = rooms.get(code);
      if (!r) return send(ws, { k: 'err', m: '部屋が見つかりません' });
      if (r.clients.size >= MAX) return send(ws, { k: 'err', m: '満員です(最大4人)' });
      ws.room = r; ws.id = Math.random().toString(36).slice(2, 10); r.clients.add(ws);
      send(ws, { k: 'joined', id: ws.id, code, seed: seedOf(code), t0: r.t0, now: Date.now() });
    } else if (!ws.room) return;
    else if (m.k === 'p' && m.p && typeof m.p === 'object') { ws.room.p[ws.id] = m.p; ws.room.dirty = true; }
    else if (m.k === 'ev' && ['fuel', 'revive', 'gift'].includes(m.t)) bcast(ws.room, { k: 'ev', t: m.t, d: m.d, from: ws.id });
  });
  ws.on('close', () => {
    const r = ws.room; if (!r) return;
    r.clients.delete(ws); delete r.p[ws.id]; r.dirty = true;
    if (!r.clients.size) rooms.delete(r.code);
  });
});
setInterval(() => rooms.forEach(r => { if (r.dirty) { r.dirty = false; bcast(r, { k: 'peers', p: r.p }); } }), 100);
setInterval(() => wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; ws.ping(); }), 30000);
server.listen(PORT, () => console.log('listening on ' + PORT));
