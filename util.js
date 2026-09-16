const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmtDesc = s => !s ? '—' : s % 60 ? `${Math.floor(s / 60)}'${String(s % 60).padStart(2, '0')}"` : `${s / 60}'`;
const diaDeHoy = (dias, d = new Date()) => dias.find(x => x.dia === d.getDay()) || null;
const hoyISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ultimaVez = (log, hoy) => {
  const s = (log?.sesiones || []).filter(x => x.fecha !== hoy && (x.series || []).some(y => y?.kg));
  return s.length ? s[s.length - 1] : null;
};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// logs: { [slug]: log }. Bloque hecho = todas las series de todos sus ejercicios con done hoy.
const bloqueHecho = (logs, hoy, b) => b.ejercicios.every(e => {
  const s = logs[slug(e.nombre)]?.sesiones?.find(x => x.fecha === hoy);
  return !!s && Array.from({ length: b.series }, (_, n) => s.series?.[n]?.done).every(Boolean);
});
// Secuencia ejecutable de un bloque de cardio: pasos (con vuelta/de) y descansos intercalados.
const expandirCardio = c => {
  const out = [], V = c.vueltas || 1;
  for (let v = 1; v <= V; v++) {
    for (const p of c.pasos) for (let k = 0; k < (p.veces || 1); k++) out.push({ tipo: 'paso', nombre: p.nombre, seg: p.seg, reps: p.reps, vuelta: v, de: V });
    if (v < V && c.descansoVuelta) out.push({ tipo: 'desc', seg: c.descansoVuelta, nombre: 'Descanso entre vueltas' });
  }
  if (c.descansoPaso) for (let i = out.length - 1; i > 0; i--) if (out[i].tipo === 'paso' && out[i - 1].tipo === 'paso') out.splice(i, 0, { tipo: 'desc', seg: c.descansoPaso, nombre: 'Descanso' });
  return out;
};
if (typeof module !== 'undefined') module.exports = { DIAS, slug, fmtDesc, diaDeHoy, hoyISO, ultimaVez, esc, bloqueHecho, expandirCardio };
