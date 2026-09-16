# Gym App v2 — diseño

Fecha: 2026-09-16. Extiende `2026-09-12-gym-app-design.md`.

## Alcance

1. Plan nuevo (`docs/fuentes/Plan_MarcoMeschini_v2.pdf`, sigue siendo "Mes 1").
2. Tilde por serie + timer automático + progreso del día.
3. Pantalla encendida (Wake Lock) en Ejercicio y timers.
4. Timers de cardio encadenados.
5. Notas libres por ejercicio.
6. Funciona sin señal (service worker).

## Datos

- Días: lun `Torso + HIIT`, mar `Piernas + caminata`, mie `Torso + pasadas`,
  vie `Torso + HIIT`. Técnicas: solo BISERIE, DROPSET, FALLO, APROX.
- Cardio pasa a ser ejecutable:
  `{ titulo, sub, vueltas?, descansoVuelta?, descansoPaso?, video?, pasos: [
  { nombre, nota?, dosis, seg? | reps?, veces? }] }`.
  HIIT: `vueltas: 3, descansoVuelta: 90` (sin descanso entre pasos).
  Caminata: 4 pasos `seg: 300`. Pasadas: `descansoPaso: 30`, `veces: 2` en
  las "×2". `dosis` es solo texto para mostrar; `seg`/`reps` mandan.
- Registro por serie gana `done: true|false`:
  `series: [{ kg, reps, done } | null]`.
- Nota libre: `localStorage` clave `gym:nota:<slug>` → string.
- Mapeo de videos: mismo criterio (mismo patrón de movimiento). Se mapea
  "Cruces con polea banco 90° (emulando pect deck)" → video Pect deck porque el
  propio plan lo dice.

## Tilde por serie

- Columna extra en la tabla: botón ✓ (44×44) con `data-k`, `data-n`. Toggle
  `done`; fila con clase `done` (atenuada, ✓ dorado).
- Al marcar (no al desmarcar): si el ejercicio es el **último** del bloque y
  `descanso > 0` → `Timer.start(descanso)`. En biserie, tildar en el primer
  ejercicio no arranca timer.
- Bloque hecho = todas las series de todos sus ejercicios con `done` hoy
  (`bloqueHecho(logs, hoy, b)` puro en `util.js`). Lista del día: fila con
  clase `hecho` (✓ dorado a la derecha, texto atenuado). Rutina: "Hoy · 3/9
  bloques" en el hero cuando hay al menos uno hecho.

## Wake Lock

`wake(on)` en `app.js`: `navigator.wakeLock.request('screen')` si existe;
guarda el sentinel; `release()` al apagar. Encendido al entrar a `#/ej/...`
y cuando un timer está visible; apagado en cualquier otra ruta con timer
oculto. `visibilitychange` re-pide el lock si `wantWake` y la página vuelve
a estar visible (iOS lo suelta al ocultar). Sin soporte (< iOS 16.4) → no
hace nada.

## Timers de cardio

- Botón "Empezar cardio" en la sección cardio del día → `Timer.run(steps)`.
- `expandirCardio(c)` puro en `util.js` devuelve la secuencia:
  por vuelta v: por paso p, `veces` veces: `{ tipo: 'paso', nombre, seg?,
  reps?, vuelta: v, de: vueltas }` y, si `descansoPaso` y no es el último
  ítem global, `{ tipo: 'desc', seg: descansoPaso, nombre: 'Descanso' }`;
  entre vueltas `{ tipo: 'desc', seg: descansoVuelta, nombre: 'Descanso entre
  vueltas' }`.
- Overlay `#timer` gana `#t-label` (nombre del paso + "vuelta 2/3"), `#t-next`
  ("Siguiente: Jumping jacks 40 seg"), botón secundario `#timer-skip`
  ("Saltar", visible solo en cardio). Paso con `seg` → cuenta regresiva y al
  llegar a 0 beep + pasa solo. Paso con `reps` → muestra "8 reps" grande, el
  botón principal dice "Hecho" y avanza. Fin → "Cardio terminado", botón
  "Listo" cierra.
- `Timer.start(seg)` = `Timer.run([{ tipo: 'desc', seg, nombre: 'Descanso' }])`
  con comportamiento actual (rojo + beep al final, Listo cierra).

## Notas

`<textarea>` bajo la tabla de cada ejercicio, placeholder "Notas: banco,
polea, agarre…", `data-nota="<slug>"`. Guarda en `change`. Vacío → borra la
clave.

## Sin señal

`sw.js` registrado desde `index.html`. Estrategias:
- Shell (mismo origen, no `videos/`): **network-first**, guarda en cache la
  respuesta buena, cae a cache sin red. Así las actualizaciones llegan sin
  bumpear versión.
- `videos/*.mp4` y `fonts.googleapis.com` / `fonts.gstatic.com`:
  **cache-first**; se guardan al primer uso (respuestas opacas incluidas).
- Peticiones con `Range` (Safari para video): se busca/obtiene la respuesta
  completa sin `Range` y se responde `206` con el slice pedido y
  `Content-Range`. Sin esto Safari no reproduce desde cache.
- `install` precachea el shell; `activate` borra caches con otro nombre;
  `skipWaiting` + `clients.claim`. Nombre de cache `gym-v1`, solo se bumpea
  para purgar.
Límite: iOS puede vaciar el cache tras semanas sin uso; se vuelve a llenar.

## Checks

- `check_data.js`: además, cada paso de cardio tiene `seg` o `reps` (número
  > 0) y `dosis`; `vueltas`/`descansoVuelta`/`descansoPaso`/`veces` numéricos
  si existen; `sw.js` lista en `SHELL` exactamente los archivos del shell que
  existen en disco.
- `test.js`: `bloqueHecho` (todas hechas / falta una / sin registro),
  `expandirCardio` (HIIT 3 vueltas → 12 pasos + 2 descansos; pasadas ×2 →
  descansos intercalados y ninguno al final; caminata → 4 pasos sin descansos).

## Fuera de alcance

Historial gráfico, resumen semanal, sync, notificaciones.
