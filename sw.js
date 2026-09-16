// Shell: network-first (actualiza solo, funciona sin red). Videos y fuentes: cache-first al primer uso.
const V = 'gym-v1';
const SHELL = ['./', 'index.html', 'data.js', 'util.js', 'store.js', 'timer.js', 'app.js', 'manifest.json', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const mine = u.origin === location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!mine && !font) return;
  e.respondWith((font || u.pathname.includes('/videos/')) ? cacheFirst(req) : networkFirst(req));
});

async function networkFirst(req) {
  const c = await caches.open(V);
  try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
  catch { return (await c.match(req)) || (await c.match('./')) || Response.error(); }
}

async function cacheFirst(req) {
  const c = await caches.open(V), range = req.headers.get('range');
  let res = await c.match(req.url);
  if (!res) {
    res = await fetch(range ? new Request(req.url) : req); // pedir completo, nunca cachear un 206
    if (res.ok || res.type === 'opaque') c.put(req.url, res.clone());
  }
  return range && res.ok ? partial(res, range) : res;
}

// Safari pide video por rangos; una respuesta completa desde cache no le sirve.
async function partial(res, range) {
  const buf = await res.clone().arrayBuffer(), m = /bytes=(\d+)-(\d*)/.exec(range);
  const start = m ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': res.headers.get('Content-Type') || 'video/mp4',
    'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes',
  } });
}
