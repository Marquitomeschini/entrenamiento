const view = document.getElementById('view');
const badge = b => `<i class="b b-${slug(b)}">${esc(b)}</i>`;
const video = id => `<div class="vid"><iframe src="https://drive.google.com/file/d/${encodeURIComponent(id)}/preview" allow="autoplay; fullscreen" loading="lazy" title="Video del ejercicio"></iframe></div>`;
const serTxt = b => b.aprox ? `${b.aprox}+${b.series}` : String(b.series);
const dia = id => DATA.plan.dias.find(x => x.id === id);

function renderRutina() {
  const hoy = diaDeHoy(DATA.plan.dias), d = new Date();
  const prox = DATA.plan.dias.find(x => x.dia > d.getDay()) || DATA.plan.dias[0];
  const hero = hoy
    ? `<a class="hero" href="#/dia/${hoy.id}"><span class="eyebrow">Hoy · ${DIAS[hoy.dia]}</span><h1>${esc(hoy.titulo)}</h1><span class="cta">Empezar ›</span></a>`
    : `<div class="hero rest"><span class="eyebrow">Hoy · ${DIAS[d.getDay()]}</span><h1>Descanso</h1><p>Próximo: ${DIAS[prox.dia]} · ${esc(prox.titulo)}</p></div>`;
  const rows = DATA.plan.dias.map(x => `<a class="row" href="#/dia/${x.id}"><div class="names"><b>${DIAS[x.dia]} · ${esc(x.titulo)}</b><span class="eyebrow">${x.bloques.length} bloques${x.cardio ? ' + cardio' : ''}</span></div><span class="play">›</span></a>`).join('');
  return `<header class="top"><span class="eyebrow">Mes ${DATA.plan.mes} · 4 días por semana · @aguspazfit</span></header>${hero}<h2>Semana</h2><div class="list">${rows}</div>`;
}

function renderDia(id) {
  const d = dia(id); if (!d) return renderRutina();
  const rows = d.bloques.map((b, i) => `<a class="row${b.ejercicios.length > 1 ? ' multi' : ''}" href="#/ej/${d.id}/${i}">
    <div class="names">${b.ejercicios.map(e => `<b>${esc(e.nombre)}</b>`).join('<span class="con">+</span>')}${b.badges.length ? `<div class="badges">${b.badges.map(badge).join('')}</div>` : ''}</div>
    <div class="nums"><span class="ser">${serTxt(b)}</span><span class="reps">${esc(b.reps)}</span><span class="desc">${fmtDesc(b.descanso)}</span></div></a>`).join('');
  const c = d.cardio;
  const cardio = c ? `<section class="cardio"><h2>${esc(c.titulo)}</h2><p class="sub">${esc(c.sub)}</p><ol>${c.pasos.map(p => `<li><b>${esc(p.nombre)}</b><span class="dosis">${esc(p.dosis)}</span>${p.nota ? `<small>${esc(p.nota)}</small>` : ''}</li>`).join('')}</ol>${c.video ? `<a class="btn ghost" href="#/video/${c.video}" style="margin-top:12px">Ver técnica de running</a>` : ''}</section>` : '';
  return `<header class="top"><a class="back" href="#/rutina">‹ Rutina</a><span class="eyebrow">${DIAS[d.dia]}</span><h1>${esc(d.titulo)}</h1></header><div class="list">${rows}</div>${cardio}`;
}

const routes = { rutina: renderRutina, dia: renderDia };
const TAB = { dia: 'rutina', ej: 'rutina', video: 'videos' };

async function route() {
  const [name = 'rutina', ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const fn = routes[name] || renderRutina;
  view.innerHTML = await fn(...args);
  window.scrollTo(0, 0);
  const tab = TAB[name] || name;
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
}
window.addEventListener('hashchange', route);
route();
