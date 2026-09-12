const assert = require('assert');
const { slug, fmtDesc, diaDeHoy, hoyISO, ultimaVez, esc } = require('./util.js');
assert.equal(slug('Jalón en dorsalera agarre neutro'), 'jalon-en-dorsalera-agarre-neutro');
assert.equal(fmtDesc(90), `1'30"`);
assert.equal(fmtDesc(60), `1'`);
assert.equal(fmtDesc(150), `2'30"`);
assert.equal(fmtDesc(0), '—');
const dias = [{ id: 'lun', dia: 1 }, { id: 'vie', dia: 5 }];
assert.equal(diaDeHoy(dias, new Date(2026, 8, 14)).id, 'lun'); // lunes
assert.equal(diaDeHoy(dias, new Date(2026, 8, 13)), null);      // domingo
assert.equal(hoyISO(new Date(2026, 8, 12, 23, 30)), '2026-09-12'); // local, no UTC
const log = { sesiones: [
  { fecha: '2026-09-07', series: [{ kg: 20, reps: 10 }] },
  { fecha: '2026-09-10', series: [null, { kg: 22, reps: 8 }] },
  { fecha: '2026-09-11', series: [{ reps: 8 }] },
  { fecha: '2026-09-12', series: [{ kg: 24, reps: 6 }] },
] };
assert.equal(ultimaVez(log, '2026-09-12').fecha, '2026-09-10');
assert.equal(ultimaVez({ sesiones: [] }, '2026-09-12'), null);
assert.equal(ultimaVez(null, '2026-09-12'), null);
assert.equal(esc('<b>&"'), '&lt;b&gt;&amp;&quot;');
console.log('OK util');
