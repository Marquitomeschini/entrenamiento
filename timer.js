const Timer = (() => {
  const el = document.getElementById('timer'), num = el.querySelector('b');
  let finAt = 0, tick = 0, ctx;
  const audio = () => { try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume?.(); } catch {} return ctx; };
  const beep = () => {
    const c = audio(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = 880;
    g.gain.setValueAtTime(.4, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .8);
    o.start(); o.stop(c.currentTime + .8);
  };
  const paint = () => {
    const r = Math.max(0, Math.ceil((finAt - Date.now()) / 1000));
    num.textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
    if (!r) { clearInterval(tick); tick = 0; el.classList.add('done'); beep(); }
  };
  // ponytail: sin aviso con la pantalla bloqueada (iOS pausa la página); al volver, visibilitychange repinta con la hora real.
  function start(seg) { audio(); finAt = Date.now() + seg * 1000; el.classList.remove('done'); el.hidden = false; clearInterval(tick); paint(); tick = setInterval(paint, 250); }
  function close() { clearInterval(tick); tick = 0; el.hidden = true; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !el.hidden && tick) paint(); });
  document.getElementById('timer-close').addEventListener('click', close);
  return { start, close };
})();
