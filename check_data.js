const fs = require('fs'), vm = require('vm');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(__dirname + '/data.js', 'utf8'), ctx);
const { plan, videos, comida, tecnicas } = ctx.window.DATA;
const ids = new Set(JSON.parse(fs.readFileSync(__dirname + '/drive_videos.json', 'utf8')).flatMap(f => (f.children || []).map(c => c.id)));
const errs = [];
if (plan.dias.length !== 4) errs.push('plan: se esperan 4 días');
for (const d of plan.dias) {
  if (!d.bloques?.length) errs.push(`${d.id}: sin bloques`);
  for (const b of d.bloques || []) {
    const n = b.ejercicios?.[0]?.nombre;
    if (!(b.series > 0)) errs.push(`${d.id}: series inválidas (${n})`);
    if (typeof b.descanso !== 'number') errs.push(`${d.id}: descanso no numérico (${n})`);
    if (!Array.isArray(b.badges)) errs.push(`${d.id}: badges no es array (${n})`);
    if (b.aprox && (b.aproxReps?.length !== b.aprox)) errs.push(`${d.id}: aproxReps debe tener ${b.aprox} valores (${n})`);
    if (!b.ejercicios?.length) errs.push(`${d.id}: bloque sin ejercicios`);
    for (const e of b.ejercicios || []) if (e.video && !ids.has(e.video)) errs.push(`${d.id}: video inexistente: ${e.nombre} → ${e.video}`);
  }
  const c = d.cardio;
  if (c) {
    if (c.video && !ids.has(c.video)) errs.push(`${d.id}: video cardio inexistente`);
    for (const k of ['vueltas', 'descansoVuelta', 'descansoPaso']) if (c[k] != null && typeof c[k] !== 'number') errs.push(`${d.id}: cardio.${k} no numérico`);
    for (const p of c.pasos || []) {
      if (!p.dosis) errs.push(`${d.id}: paso sin dosis (${p.nombre})`);
      if (!(p.seg > 0) && !(p.reps > 0)) errs.push(`${d.id}: paso sin seg/reps (${p.nombre})`);
      if (p.veces != null && !(p.veces > 0)) errs.push(`${d.id}: veces inválido (${p.nombre})`);
    }
  }
}
if (videos.length !== ids.size) errs.push(`videos: ${videos.length} en data.js vs ${ids.size} en Drive`);
for (const v of videos) if (!ids.has(v.id)) errs.push(`videos: id inexistente ${v.titulo}`);
for (const id of ids) if (!fs.existsSync(`${__dirname}/videos/${id}.mp4`)) errs.push(`videos/${id}.mp4 no existe (correr ./encode_videos.sh)`);
for (const m of comida.comidas) if (!m.opciones?.length) errs.push(`comida: ${m.nombre} sin opciones`);
if (!tecnicas.length) errs.push('tecnicas vacío');
// sw.js: SHELL lista archivos que existen y cubre el shell mínimo
if (fs.existsSync(__dirname + '/sw.js')) {
  const m = /SHELL\s*=\s*\[([^\]]*)\]/.exec(fs.readFileSync(__dirname + '/sw.js', 'utf8'));
  const shell = m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
  if (!shell.length) errs.push('sw.js: SHELL no encontrado');
  for (const f of shell) if (f !== './' && !fs.existsSync(`${__dirname}/${f}`)) errs.push(`sw.js: SHELL incluye ${f} que no existe`);
  for (const f of ['index.html', 'data.js', 'util.js', 'store.js', 'timer.js', 'app.js', 'manifest.json']) if (!shell.includes(f)) errs.push(`sw.js: SHELL no incluye ${f}`);
}
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`OK · ${plan.dias.length} días · ${videos.length} videos · ${comida.comidas.length} comidas · ${tecnicas.length} técnicas`);
