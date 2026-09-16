const view = document.getElementById('view');
const badge = b => `<i class="b b-${slug(b)}" data-tec="${esc(b)}" role="button" tabindex="0">${esc(b)}</i>`;
const video = id => `<div class="vid"><video src="videos/${encodeURIComponent(id)}.mp4" controls playsinline preload="metadata"></video></div>`;
const serTxt = b => b.aprox ? `${b.aprox}+${b.series}` : String(b.series);
const dia = id => DATA.plan.dias.find(x => x.id === id);
const logsDe = d => Object.fromEntries(d.bloques.flatMap(b => b.ejercicios).map(e => [slug(e.nombre), Store.get(slug(e.nombre))]));
const hechosHoy = d => { const logs = logsDe(d), hoy = hoyISO(); return d.bloques.filter(b => bloqueHecho(logs, hoy, b)).length; };

// Pantalla encendida mientras se entrena. ponytail: sin soporte (< iOS 16.4) no hace nada.
let wl = null, wantWake = false;
async function wake(on) {
  wantWake = on;
  if (!navigator.wakeLock) return;
  if (on) { try { wl ||= await navigator.wakeLock.request('screen'); } catch {} }
  else { wl?.release(); wl = null; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && wantWake) { wl = null; wake(true); } });

function renderRutina() {
  const hoy = diaDeHoy(DATA.plan.dias), d = new Date();
  const prox = DATA.plan.dias.find(x => x.dia > d.getDay()) || DATA.plan.dias[0];
  const n = hoy ? hechosHoy(hoy) : 0;
  const hero = hoy
    ? `<a class="hero" href="#/dia/${hoy.id}"><span class="eyebrow">Hoy · ${DIAS[hoy.dia]}${n ? ` · ${n}/${hoy.bloques.length} bloques` : ''}</span><h1>${esc(hoy.titulo)}</h1><span class="cta">${n ? 'Seguir' : 'Empezar'} ›</span></a>`
    : `<div class="hero rest"><span class="eyebrow">Hoy · ${DIAS[d.getDay()]}</span><h1>Descanso</h1><p>Próximo: ${DIAS[prox.dia]} · ${esc(prox.titulo)}</p></div>`;
  const rows = DATA.plan.dias.map(x => `<a class="row" href="#/dia/${x.id}"><div class="names"><b>${DIAS[x.dia]} · ${esc(x.titulo)}</b><span class="eyebrow">${x.bloques.length} bloques${x.cardio ? ' + cardio' : ''}</span></div><span class="play">›</span></a>`).join('');
  return `<header class="top"><span class="eyebrow">Mes ${DATA.plan.mes} · 4 días por semana · @aguspazfit</span></header>${hero}<h2>Semana</h2><div class="list">${rows}</div>`;
}

function renderDia(id) {
  const d = dia(id); if (!d) return renderRutina();
  const logs = logsDe(d), hoy = hoyISO();
  const rows = d.bloques.map((b, i) => { const ok = bloqueHecho(logs, hoy, b); return `<a id="b-${i}" class="row${b.ejercicios.length > 1 ? ' multi' : ''}${ok ? ' hecho' : ''}" href="#/ej/${d.id}/${i}">
    <div class="names">${b.ejercicios.map(e => `<b>${esc(e.nombre)}</b>`).join('<span class="con">+</span>')}${b.badges.length ? `<div class="badges">${b.badges.map(badge).join('')}</div>` : ''}</div>
    ${ok ? '<span class="play">✓</span>' : `<div class="nums"><span class="ser">${serTxt(b)}</span><span class="reps">${esc(b.reps)}</span><span class="desc">${fmtDesc(b.descanso)}</span></div>`}</a>`; }).join('');
  const c = d.cardio;
  const cardio = c ? `<section class="cardio"><h2>${esc(c.titulo)}</h2><p class="sub">${esc(c.sub)}</p><ol>${c.pasos.map(p => `<li><b>${esc(p.nombre)}</b><span class="dosis">${esc(p.dosis)}</span>${p.nota ? `<small>${esc(p.nota)}</small>` : ''}</li>`).join('')}</ol>
    <div class="actions"><button class="btn" data-cardio="${d.id}">Empezar cardio</button>${c.video ? `<a class="btn ghost" href="#/video/${c.video}">Ver técnica de running</a>` : ''}</div></section>` : '';
  return `<header class="top"><a class="back" href="#/rutina">‹ Rutina</a><span class="eyebrow">${DIAS[d.dia]}</span><h1>${esc(d.titulo)}</h1></header><div class="list">${rows}</div>${cardio}`;
}

// Estado del bloque abierto (para la guía de biserie): dones[ej][n].
let actual = null;
const nombreSerie = (b, p) => `<b>${esc(b.ejercicios[p.ej].nombre)}</b> · serie ${p.n + 1}`;
const guiaHtml = (b, dones) => { const [a, s] = pendientes(b, dones); return a ? `Ahora: ${nombreSerie(b, a)}${s ? `<br>Después: ${nombreSerie(b, s)}` : ''}` : 'Bloque completo ✓'; };
function marcarAhora() {
  if (!actual) return;
  view.querySelectorAll('tr.ahora').forEach(t => t.classList.remove('ahora'));
  const [a] = pendientes(actual.b, actual.dones);
  if (a) document.getElementById(`r-${a.ej}-${a.n}`)?.classList.add('ahora');
  const g = document.getElementById('guia'); if (g) g.innerHTML = guiaHtml(actual.b, actual.dones);
}

function renderEjercicio(id, i) {
  const d = dia(id), b = d?.bloques[+i]; if (!b) return renderRutina();
  const hoy = hoyISO(), esp = especial(b), dones = [];
  const parts = b.ejercicios.map((e, idx) => {
    const k = slug(e.nombre), log = Store.get(k), ult = ultimaVez(log, hoy), last = idx === b.ejercicios.length - 1;
    const sh = log?.sesiones?.find(s => s.fecha === hoy), obj = objetivos(e.reps || b.reps, b.series);
    dones[idx] = Array.from({ length: b.series }, (_, n) => !!sh?.series?.[n]?.done);
    const inp = (f, ph, mode, n, a, v) => `<input type="number" inputmode="${mode}"${mode === 'decimal' ? ' step="0.5"' : ''} placeholder="${esc(ph)}" value="${esc(v ?? '')}" data-k="${k}" data-n="${n}"${a ? ' data-a="1"' : ''} data-f="${f}" aria-label="${f} ${a ? 'aproximación' : 'serie'} ${n + 1}">`;
    const chk = (n, a, on) => `<button class="chk${on ? ' on' : ''}" data-chk data-k="${k}" data-n="${n}" data-ej="${idx}"${a ? ' data-a="1"' : ''} data-last="${last}" aria-label="${a ? 'Aproximación' : 'Serie'} ${n + 1} hecha">✓</button>`;
    const aprox = (b.aproxReps || []).map((r, n) => { const s = sh?.aprox?.[n] || {}, u = ult?.aprox?.[n] || {};
      return `<tr class="aprox${s.done ? ' done' : ''}"><td>A${n + 1}<small>${r} reps · ligero</small></td><td>${inp('kg', u.kg ?? 'kg', 'decimal', n, 1, s.kg)}</td><td>${inp('reps', 'reps', 'numeric', n, 1, s.reps ?? r)}</td><td>${chk(n, 1, s.done)}</td></tr>`; }).join('');
    const filas = Array.from({ length: b.series }, (_, n) => {
      const s = sh?.series?.[n] || {}, u = ult?.series?.[n] || {}, o = obj?.[n], ultima = n === b.series - 1 && esp;
      const lbl = ultima ? esp : o == null ? '' : o === 'fallo' ? 'al fallo' : `${o} reps`;
      return `<tr id="r-${idx}-${n}" class="${s.done ? 'done' : ''}${ultima ? ' especial' : ''}"><td>${n + 1}${lbl ? `<small>${esc(lbl)}</small>` : ''}</td><td>${inp('kg', u.kg ?? 'kg', 'decimal', n, 0, s.kg)}</td><td>${inp('reps', u.reps ?? 'reps', 'numeric', n, 0, s.reps ?? (typeof o === 'number' ? o : ''))}</td><td>${chk(n, 0, s.done)}</td></tr>`
        + (ultima && b.badges.includes('DROPSET') ? `<tr class="drop"><td>↓ drop</td><td>${inp('dropKg', u.dropKg ?? 'kg', 'decimal', n, 0, s.dropKg)}</td><td>${inp('dropReps', 'reps', 'numeric', n, 0, s.dropReps)}</td><td></td></tr>` : '');
    }).join('');
    const ultTxt = ult ? `Última vez (${ult.fecha.slice(5).split('-').reverse().join('/')}): ${ult.series.filter(s => s?.kg).map(s => `${s.kg}×${s.reps ?? '?'}`).join(' · ')}` : 'Sin registro previo';
    return `<article class="ej">${e.video ? video(e.video) : '<div class="novideo">Sin video del entrenador para este ejercicio</div>'}
      <h2>${esc(e.nombre)}</h2>${e.nota ? `<p class="nota">${esc(e.nota)}</p>` : ''}<p class="ult">${ultTxt}</p>
      <table class="log"><thead><tr><th>Serie</th><th>kg</th><th>reps</th><th></th></tr></thead><tbody>${aprox}${filas}</tbody></table>
      <textarea class="nota-libre" data-nota="${k}" placeholder="Notas: banco, polea, agarre…" rows="1">${esc(Store.get('nota:' + k) || '')}</textarea></article>`;
  });
  actual = { b, dones };
  const next = d.bloques[+i + 1] ? `<a class="btn ghost" href="#/ej/${d.id}/${+i + 1}">Siguiente ›</a>` : `<a class="btn ghost" href="#/dia/${d.id}">Fin · volver al día</a>`;
  return `<header class="top"><a class="back" href="#/dia/${d.id}">‹ ${esc(d.titulo)}</a>
    <div class="prog"><span>Bloque ${+i + 1} de ${d.bloques.length}</span><i><b style="width:${Math.round((+i + 1) / d.bloques.length * 100)}%"></b></i></div>
    <div class="spec"><span><b>${serTxt(b)}</b> series</span><span>${esc(b.reps)}</span><span>desc. <b>${fmtDesc(b.descanso)}</b></span></div>
    ${b.badges.length ? `<div class="badges">${b.badges.map(badge).join('')}</div>` : ''}</header>
    ${b.ejercicios.length > 1 ? `<div class="guia" id="guia">${guiaHtml(b, dones)}</div>` : ''}${parts.join('')}
    <div class="actions">${b.descanso ? `<button class="btn" data-timer="${b.descanso}">Descanso ${fmtDesc(b.descanso)}</button>` : ''}${next}</div>`;
}

function renderVideos() {
  const grupos = [...new Set(DATA.videos.map(v => v.grupo))];
  return `<header class="top"><span class="eyebrow">${DATA.videos.length} videos · @aguspazfit</span><h1>Videos</h1></header>` +
    grupos.map(g => `<h2>${esc(g)}</h2><div class="list">${DATA.videos.filter(v => v.grupo === g).map(v => `<a class="row" href="#/video/${v.id}"><b>${esc(v.titulo)}</b><span class="play">▶</span></a>`).join('')}</div>`).join('');
}
function renderVideo(id) {
  const v = DATA.videos.find(x => x.id === id); if (!v) return renderVideos();
  return `<header class="top"><a class="back" href="#/videos">‹ Videos</a><span class="eyebrow">${esc(v.grupo)}</span><h1>${esc(v.titulo)}</h1></header>${video(v.id)}`;
}
function renderComida() {
  const c = DATA.comida;
  return `<header class="top"><span class="eyebrow">${c.kcal} kcal · 3 comidas · pesos crudos</span><h1>Alimentación</h1></header>
  <div class="macros"><div><small>Proteína</small><b>~${c.macros.P}g</b></div><div><small>Grasas</small><b>~${c.macros.G}g</b></div><div><small>Carbos</small><b>~${c.macros.C}g</b></div></div>
  ${c.comidas.map(m => `<section class="meal m-${slug(m.nombre)}"><h2>${esc(m.nombre)}<small>${esc(m.kcal)}</small></h2>
    ${m.opciones.map((o, i) => `<details${i ? '' : ' open'}><summary><b>${esc(o.nombre)}</b><span>~${o.kcal} kcal</span><small>P ${o.P} g · G ${o.G} g · C ${o.C} g</small></summary><ul>${o.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
    ${m.nota ? `<p class="nota">${esc(m.nota)}</p>` : ''}</section>`).join('')}
  <h2>Reglas</h2><dl class="reglas">${c.reglas.map(r => `<dt>${esc(r.titulo)}</dt><dd>${esc(r.texto)}</dd>`).join('')}</dl>`;
}
const renderTecnicas = () => `<header class="top"><span class="eyebrow">Referencia rápida</span><h1>Técnicas</h1></header><dl class="reglas">${DATA.tecnicas.map(t => `<dt>${badge(t.nombre)}</dt><dd>${esc(t.texto)}</dd>`).join('')}</dl>`;

const routes = { rutina: renderRutina, dia: renderDia, ej: renderEjercicio, videos: renderVideos, video: renderVideo, comida: renderComida, tecnicas: renderTecnicas };
const TAB = { dia: 'rutina', ej: 'rutina', video: 'videos' };

// Al volver atrás, la pantalla queda donde estabas: posición guardada por ruta, y al salir de un ejercicio se centra su fila.
const scrollPos = {};
let prevHash = location.hash;
function route() {
  scrollPos[prevHash] = window.scrollY;
  const [name = 'rutina', ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const fn = routes[name] || renderRutina;
  actual = null;
  view.innerHTML = fn(...args);
  if (name === 'ej') marcarAhora();
  const fila = name === 'dia' && prevHash.startsWith('#/ej/') && document.getElementById('b-' + prevHash.split('/')[3]);
  if (fila) fila.scrollIntoView({ block: 'center' }); else window.scrollTo(0, scrollPos[location.hash] ?? 0);
  prevHash = location.hash;
  const tab = TAB[name] || name;
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  wake(name === 'ej' || Timer.activo());
}
window.addEventListener('hashchange', route);
route();
Timer.onClose = () => wake(location.hash.startsWith('#/ej'));

// Sesión de hoy para un ejercicio (la crea si no existe). Devuelve [log, sesion].
function sesionHoy(k) {
  const hoy = hoyISO(), log = Store.get(k) || { sesiones: [] };
  let s = log.sesiones.find(x => x.fecha === hoy);
  if (!s) { s = { fecha: hoy, series: [] }; log.sesiones.push(s); }
  log.sesiones = log.sesiones.slice(-30);
  return [log, s];
}
const num = v => v === '' || v == null ? null : +v;
view.addEventListener('change', ev => {
  const el = ev.target;
  if (el.dataset.nota !== undefined) { const v = el.value.trim(); v ? Store.set('nota:' + el.dataset.nota, v) : localStorage.removeItem('gym:nota:' + el.dataset.nota); return; }
  if (!el.dataset.k) return;
  const [log, s] = sesionHoy(el.dataset.k), n = +el.dataset.n, arr = el.dataset.a ? (s.aprox ||= []) : s.series;
  arr[n] = { ...(arr[n] || {}), [el.dataset.f]: num(el.value) };
  Store.set(el.dataset.k, log);
});

// Definición de una técnica al tocar su etiqueta.
const tec = document.getElementById('tec');
function mostrarTec(nombre) {
  const t = DATA.tecnicas.find(x => x.nombre === nombre); if (!t) return;
  const b = document.getElementById('tec-b'); b.className = `b b-${slug(t.nombre)}`; b.textContent = t.nombre;
  document.getElementById('tec-t').textContent = t.texto; tec.hidden = false;
}
tec.addEventListener('click', () => { tec.hidden = true; });
view.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.dataset.tec) mostrarTec(ev.target.dataset.tec); });

view.addEventListener('click', ev => {
  const e = ev.target.closest('[data-tec]'); if (e) { ev.preventDefault(); ev.stopPropagation(); return mostrarTec(e.dataset.tec); }
  const t = ev.target.closest('[data-timer]'); if (t) { wake(true); return Timer.start(+t.dataset.timer); }
  const c = ev.target.closest('[data-cardio]'); if (c) { wake(true); return Timer.run(expandirCardio(dia(c.dataset.cardio).cardio)); }
  const b = ev.target.closest('[data-chk]'); if (!b) return;
  const [log, s] = sesionHoy(b.dataset.k), n = +b.dataset.n, a = !!b.dataset.a, arr = a ? (s.aprox ||= []) : s.series, done = !(arr[n]?.done), tr = b.closest('tr');
  const drop = tr.nextElementSibling?.classList.contains('drop') ? tr.nextElementSibling : null;
  const val = (root, f) => num(root?.querySelector(`[data-f="${f}"]`)?.value);
  // El ✓ guarda lo que haya en la fila (incluido el objetivo precargado y el drop si hay).
  arr[n] = { kg: val(tr, 'kg'), reps: val(tr, 'reps'), ...(drop ? { dropKg: val(drop, 'dropKg'), dropReps: val(drop, 'dropReps') } : {}), done };
  Store.set(b.dataset.k, log);
  b.classList.toggle('on', done); tr.classList.toggle('done', done);
  if (a) return; // aproximación: sin timer ni guía
  if (actual) { actual.dones[+b.dataset.ej][n] = done; marcarAhora(); }
  if (done && b.dataset.last === 'true') { const seg = +document.querySelector('[data-timer]')?.dataset.timer; if (seg) { wake(true); Timer.start(seg); } }
});
