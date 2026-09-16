const assert = require('assert');
const { slug, fmtDesc, diaDeHoy, hoyISO, ultimaVez, esc, bloqueHecho, expandirCardio, objetivos } = require('./util.js');
assert.deepEqual(objetivos('10 - 8 - 6 subiendo el peso', 3), [10, 8, 6]);
assert.deepEqual(objetivos('20 - 15 - 12 - 10 subiendo el peso', 4), [20, 15, 12, 10]);
assert.deepEqual(objetivos('10 - 6 · dropset y fallo en la última', 2), [10, 6]);
assert.deepEqual(objetivos('Al fallo en ambos', 2), ['fallo', 'fallo']);
assert.deepEqual(objetivos('10 por pierna', 2), [10, 10]);
assert.deepEqual(objetivos('12 en vuelos · 20 - 15 - 12 en face pull', 3), [12, 12, 12]);
assert.equal(objetivos('15 - 10 - 8 subiendo', 2), null);
assert.equal(objetivos('Fallo diamantes → fallo anchas', 1), null);
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

// bloqueHecho
const b = { series: 2, ejercicios: [{ nombre: 'A' }, { nombre: 'B' }] };
const logs = { a: { sesiones: [{ fecha: 'H', series: [{ done: true }, { done: true }] }] }, b: { sesiones: [{ fecha: 'H', series: [{ done: true }, { kg: 5, done: true }] }] } };
assert.equal(bloqueHecho(logs, 'H', b), true);
assert.equal(bloqueHecho({ ...logs, b: { sesiones: [{ fecha: 'H', series: [{ done: true }] }] } }, 'H', b), false);
assert.equal(bloqueHecho({ ...logs, b: { sesiones: [{ fecha: 'AYER', series: [{ done: true }, { done: true }] }] } }, 'H', b), false);
assert.equal(bloqueHecho({}, 'H', b), false);

// expandirCardio
const hiit = { vueltas: 3, descansoVuelta: 90, pasos: [{ nombre: 'x', reps: 8 }, { nombre: 'y', seg: 40 }, { nombre: 'z', reps: 20 }, { nombre: 'w', seg: 30 }] };
const eh = expandirCardio(hiit);
assert.equal(eh.length, 14);
assert.equal(eh.filter(s => s.tipo === 'desc').length, 2);
assert.equal(eh[4].tipo, 'desc'); assert.equal(eh[4].seg, 90);
assert.equal(eh[13].tipo, 'paso'); assert.equal(eh[5].vuelta, 2); assert.equal(eh[5].de, 3);
const pas = { descansoPaso: 30, pasos: [{ nombre: 'a', seg: 180 }, { nombre: 'b', seg: 40, veces: 2 }, { nombre: 'c', seg: 30 }] };
assert.deepEqual(expandirCardio(pas).map(s => s.tipo), ['paso', 'desc', 'paso', 'desc', 'paso', 'desc', 'paso']);
const cam = { pasos: [{ nombre: 'a', seg: 300 }, { nombre: 'b', seg: 300 }] };
assert.deepEqual(expandirCardio(cam).map(s => s.tipo), ['paso', 'paso']);
// especial
const { especial, pendientes } = require('./util.js');
assert.equal(especial({ badges: ['APROX', 'DROPSET', 'FALLO'], reps: '10 - 6 · dropset y fallo en la última' }), 'dropset + fallo');
assert.equal(especial({ badges: ['DROPSET', 'FALLO'], reps: '15 - 10 - 8 · dropset y fallo en la última' }), 'dropset + fallo');
assert.equal(especial({ badges: ['BISERIE', 'FALLO'], reps: 'Al fallo en ambos' }), null);
assert.equal(especial({ badges: [], reps: '10 - 8 - 6 subiendo el peso' }), null);
// pendientes
const bb = { series: 2, ejercicios: [{ nombre: 'A' }, { nombre: 'B' }] };
assert.deepEqual(pendientes(bb, [[false, false], [false, false]]), [{ ej: 0, n: 0 }, { ej: 1, n: 0 }, { ej: 0, n: 1 }, { ej: 1, n: 1 }]);
assert.deepEqual(pendientes(bb, [[true, false], [false, false]]), [{ ej: 1, n: 0 }, { ej: 0, n: 1 }, { ej: 1, n: 1 }]);
assert.deepEqual(pendientes(bb, [[true, true], [true, true]]), []);
assert.deepEqual(pendientes(bb, []), [{ ej: 0, n: 0 }, { ej: 1, n: 0 }, { ej: 0, n: 1 }, { ej: 1, n: 1 }]);
console.log('OK util');
