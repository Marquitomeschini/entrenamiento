// ponytail: solo localStorage, síncrono — se pierde al borrar datos de Safari, sin sync entre dispositivos. Upgrade: backend (haría get/set async y serializar escrituras).
const Store = {
  get: k => { try { return JSON.parse(localStorage.getItem('gym:' + k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem('gym:' + k, JSON.stringify(v)); } catch {} },
};
