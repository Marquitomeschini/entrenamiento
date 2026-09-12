# Gym App — diseño

Fecha: 2026-09-12
Usuario: Marco Meschini. Entrenador: Agustín Paz (@aguspazfit).

## Objetivo

Web app instalable en iPhone (PWA en GitHub Pages) para consultar en el gym:
qué ejercicios tocan hoy, cómo se hacen (video del entrenador), series/reps/
técnica/descanso, anotar pesos por serie, timer de descanso. Además: biblioteca
de videos, plan de alimentación y glosario de técnicas.

## Fuentes

- `docs/fuentes/Plan_MarcoMeschini.pdf` — plan Mes 1, 4 días/semana (no se
  commitea: `.gitignore`).
- `docs/fuentes/Alimentacion_MarcoMeschini.pdf` — 2200 kcal, 3 comidas con
  opciones, reglas (no se commitea).
- Drive público `1MAW6TTW3q92jAc3gG0ChDHb17AvTya0e` — 47 videos en 8 carpetas
  (abdominales, bíceps, hombros, piernas, tríceps, espalda, pecho, running).
  Árbol guardado en `drive_videos.json`.

## Hosting

GitHub Pages desde la rama `main` del repo público
`Marquitomeschini/entrenamiento`. URL: `https://marquitomeschini.github.io/entrenamiento/`.
Motivo: el Artifact de claude.ai bloquea iframes externos (CSP), así que los
videos de Drive no se pueden embeber ahí. GitHub Pages no tiene esa
restricción y además da PWA real (ícono, pantalla completa).

Sin service worker: la app requiere internet igual (videos). Límite conocido;
upgrade: SW cache-first de los 6 archivos estáticos.

## Videos

El preview de Drive (`/file/d/<id>/preview`) falla en browsers embebidos y con
cookies de terceros bloqueadas (Safari). Decisión: los 47 videos se bajan del
Drive público y se re-encodean a H.264 720p (lado corto, CRF 27, AAC mono)
con `encode_videos.sh` → `videos/<id de Drive>.mp4`, servidos desde el mismo
repo (~0,3-1 MB cada uno). La app usa `<video playsinline controls
preload="metadata">`. `check_data.js` exige que exista el `.mp4` de cada id.

## Archivos

- `index.html` — shell: metas PWA, fuente, `<style>` inline, `<main id=view>`,
  overlay del timer, `<nav>`, scripts.
- `data.js` — `window.DATA = {plan, videos, comida, tecnicas}`.
- `util.js` — helpers puros (`slug`, `fmtDesc`, `diaDeHoy`, `hoyISO`,
  `ultimaVez`); exporta con `module.exports` cuando corre en node.
- `store.js` — `Store.get(k)` / `Store.set(k, v)` sobre localStorage, API
  async para poder cambiar backend sin tocar `app.js`.
- `timer.js` — `Timer.start(seg)` / `Timer.close()`.
- `app.js` — router por hash + funciones `render*`.
- `manifest.json`, `icon-512.png`, `apple-touch-icon.png`.
- `check_data.js` (node) — valida `data.js`. `test.js` (node) — prueba `util.js`.
- `.claude/launch.json` — `python3 -m http.server 8765` para preview local.

## Pantallas

Barra inferior fija: **Rutina · Videos · Comida · Técnicas**.

1. **Rutina** (`#/rutina`) — hero con el día de hoy (Lun/Mar/Mié/Vie → ese
   día, link a `#/dia/<id>`; Jue/Sáb/Dom → "Descanso" + próximo día). Debajo,
   los 4 días como filas.
2. **Día** (`#/dia/<id>`) — lista ordenada de bloques. Cada fila: nombre(s),
   badges (APROX, BISERIE, SUPERSERIE, SERIE GIGANTE, DROPSET, FALLO), series,
   reps/técnica, descanso. Bloque con 2-3 ejercicios = una sola fila con los
   nombres apilados. Al final el bloque cardio del día (HIIT / cinta inclinada
   / pasadas) con sus pasos y, si hay, link al video de técnica de running.
3. **Ejercicio** (`#/ej/<id>/<índice de bloque>`) — cabecera con series/reps/
   descanso/badges. Por cada ejercicio del bloque: `<video>` local
   (`videos/<id>.mp4`) o "Sin video del entrenador"; nombre; nota; "Última
   vez (dd/mm): 20×10 · 22×8"; tabla por
   serie con inputs **kg** y **reps** (placeholder = valor de la última vez).
   Se guarda en `change`. Abajo: botón **Descanso N** (si descanso > 0) y
   **Siguiente ›** (o "Fin · volver al día").
4. **Videos** (`#/videos`, `#/video/<id>`) — 47 videos agrupados por carpeta.
5. **Comida** (`#/comida`) — macros; desayuno/almuerzo/cena con opciones
   colapsables (`<details>`, la primera abierta); reglas.
6. **Técnicas** (`#/tecnicas`) — glosario.

## Datos (`data.js`)

```js
window.DATA = {
  plan: { mes: 1, dias: [ { id, dia /* getDay(): Lun=1 */, titulo, bloques: [
    { aprox /* opcional, nº series de aproximación */, series /* efectivas */,
      reps /* texto */, descanso /* segundos, 0 = sin descanso */,
      badges: [], ejercicios: [ { nombre, nota?, video? /* id Drive */ } ] } ],
    cardio?: { titulo, sub, pasos: [ { nombre, nota?, dosis } ], video? } } ] },
  videos: [ { grupo, titulo, id } ],
  comida: { kcal, macros: { P, G, C }, comidas: [ { nombre, kcal, opciones: [
    { nombre, kcal, P, G, C, items: [] } ], nota? } ], reglas: [ { titulo, texto } ] },
  tecnicas: [ { nombre, texto } ],
};
```

Mapeo ejercicio → `video` a mano. Se mapea cuando el patrón de movimiento es el
mismo aunque cambie unilateral/bilateral o el agarre de polea; no se mapea
cuando cambia el implemento (barra Z vs mancuerna vs máquina).

## Persistencia de pesos

`Store.get/set` síncronos (evita carrera entre dos `change` seguidos).
`localStorage` clave `gym:<slug ejercicio>` →
`{ sesiones: [ { fecha: 'YYYY-MM-DD', series: [ { kg, reps } | null ] } ] }`.
Máximo 30 sesiones por ejercicio (se recortan las viejas). Sesión de hoy =
la que tiene `fecha === hoyISO()`; se crea al primer input. "Última vez" =
última sesión con `fecha !== hoy` y algún `kg` cargado.
Límite conocido: se pierde al borrar datos de Safari; sin sync entre
dispositivos. Upgrade: backend detrás de la misma API `Store`.

## Timer

`finAt = Date.now() + s*1000`; tick cada 250 ms calcula restante contra
`finAt` (sobrevive a que iOS pause la página; `visibilitychange` repinta al
volver). AudioContext creado/resumido en el tap del botón; al llegar a 0:
beep 880 Hz 0,8 s + overlay en rojo. Límite conocido: sin aviso con el
teléfono bloqueado o la app en fondo; el switch de silencio de iOS mutea el
beep.

## Estilo

Dark siempre (un solo tema, fondo pintado explícito). Fondo `#0c0b09`,
superficie `#161410`, línea `#2a261d`, texto `#f2eee6`, apagado `#a39c8c`,
acento dorado `#c9a84c` (del PDF). Badges con los colores del PDF: APROX
`#1fb6c9`, BISERIE `#c9a84c`, SUPERSERIE `#3b82f6`, SERIE GIGANTE `#e6d28a`,
DROPSET `#d33b3b`, FALLO `#e58a1f`. Comidas: desayuno dorado, almuerzo
`#3b82f6`, cena `#b06cf5`. Display: Barlow Condensed (Google Fonts) para
títulos en mayúsculas; cuerpo: system-ui. Tap targets ≥ 44 px. Barra inferior
con `padding-bottom: env(safe-area-inset-bottom)`.

## Errores

- Sin internet: el iframe no carga; el resto funciona.
- localStorage inaccesible (modo privado): los inputs funcionan pero no
  persisten; sin error visible.
- Video sin mapeo: tarjeta "Sin video del entrenador".
- Ruta desconocida: cae en Rutina.

## Check

- `node check_data.js`: cada `video` de `plan`/`cardio`/`videos` existe en
  `drive_videos.json`; 4 días; cada bloque tiene `series > 0`, `descanso`
  numérico y ≥1 ejercicio; `videos.length` == cantidad en Drive; cada comida
  tiene ≥1 opción; `tecnicas` no vacío. Exit 1 si falla.
- `node test.js`: `slug`, `fmtDesc`, `diaDeHoy`, `hoyISO` (fecha local, no
  UTC), `ultimaVez` (ignora hoy y sesiones sin kg, tolera `null`).

## Fuera de alcance

Cuenta de usuario, sync, notificaciones push, gráficos de progreso, edición
del plan desde la app, service worker. Mes 2 = actualizar `data.js`,
`node check_data.js`, push.
