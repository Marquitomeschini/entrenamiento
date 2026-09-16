// Prueba de partial() de sw.js (respuestas 206 por rango) sin browser: carga sw.js con stubs.
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const ctx = { self: { addEventListener() {} }, caches: {}, location: { origin: 'http://x' }, Response, Request, URL, console };
vm.runInNewContext(fs.readFileSync(__dirname + '/sw.js', 'utf8') + ';this.partial = partial;', ctx);
(async () => {
  const body = new Uint8Array(1000).map((_, i) => i % 256);
  const full = () => new Response(body, { headers: { 'Content-Type': 'video/mp4' } });
  let r = await ctx.partial(full(), 'bytes=0-1');
  assert.equal(r.status, 206); assert.equal(r.headers.get('Content-Range'), 'bytes 0-1/1000'); assert.equal(r.headers.get('Content-Length'), '2');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [0, 1]);
  r = await ctx.partial(full(), 'bytes=990-');
  assert.equal(r.headers.get('Content-Range'), 'bytes 990-999/1000'); assert.equal((await r.arrayBuffer()).byteLength, 10);
  r = await ctx.partial(full(), 'bytes=100-5000');
  assert.equal(r.headers.get('Content-Range'), 'bytes 100-999/1000');
  assert.equal(r.headers.get('Content-Type'), 'video/mp4');
  console.log('OK sw partial');
})().catch(e => { console.error(e); process.exit(1); });
