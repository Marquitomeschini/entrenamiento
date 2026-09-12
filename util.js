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
if (typeof module !== 'undefined') module.exports = { DIAS, slug, fmtDesc, diaDeHoy, hoyISO, ultimaVez, esc };
