// Timer de descanso simple (start) y secuenciador de cardio (run). Un solo overlay #timer.
const Timer = (() => {
  const el = document.getElementById('timer'), num = el.querySelector('b'), label = document.getElementById('t-label'), nxt = document.getElementById('t-next'), main = document.getElementById('timer-main'), skip = document.getElementById('timer-skip');
  let steps = [], i = 0, finAt = 0, tick = 0, ctx;
  const api = { start, run, close, activo: () => !el.hidden, onClose: null };
  const audio = () => { try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume?.(); } catch {} return ctx; };
  const beep = () => {
    const c = audio(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = 880;
    g.gain.setValueAtTime(.4, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .8);
    o.start(); o.stop(c.currentTime + .8);
  };
  const fmt = r => `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
  const titulo = s => s.tipo === 'desc' ? s.nombre : `${s.nombre}${s.de > 1 ? ` · vuelta ${s.vuelta}/${s.de}` : ''}`;
  const dosis = s => s.seg ? fmt(s.seg) : `${s.reps} reps`;
  const stop = () => { clearInterval(tick); tick = 0; };
  function paint() {
    const r = Math.max(0, Math.ceil((finAt - Date.now()) / 1000));
    num.textContent = fmt(r);
    if (!r) { stop(); beep(); i + 1 < steps.length ? avanzar() : terminar(); }
  }
  function avanzar() { i++; mostrar(); }
  function terminar() {
    stop(); el.classList.add('done'); el.classList.remove('reps');
    label.textContent = steps.length > 1 ? 'Cardio terminado' : 'Descanso terminado';
    num.textContent = '0:00'; nxt.textContent = ''; main.textContent = 'Listo'; main.onclick = close; skip.hidden = true;
  }
  function mostrar() {
    const s = steps[i], n = steps[i + 1];
    stop(); el.classList.remove('done'); el.classList.toggle('reps', !s.seg);
    label.textContent = titulo(s);
    nxt.textContent = n ? `Después: ${titulo(n)} · ${dosis(n)}` : (steps.length > 1 ? 'Último paso' : '');
    if (s.seg) {
      finAt = Date.now() + s.seg * 1000;
      main.textContent = steps.length > 1 ? 'Terminar' : 'Listo'; main.onclick = close;
      skip.hidden = !n; skip.onclick = avanzar;
      paint(); tick = setInterval(paint, 250);
    } else {
      num.textContent = `${s.reps} reps`;
      main.textContent = 'Hecho ✓'; main.onclick = () => { beep(); n ? avanzar() : terminar(); };
      skip.hidden = true;
    }
  }
  function run(list) { audio(); steps = list; i = 0; el.hidden = false; mostrar(); }
  function start(seg) { run([{ tipo: 'desc', seg, nombre: 'Descanso' }]); }
  function close() { stop(); el.hidden = true; api.onClose?.(); }
  // ponytail: si iOS pausa la página, al volver se repinta con la hora real pero solo avanza un paso; sin aviso en fondo.
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !el.hidden && tick) paint(); });
  return api;
})();
