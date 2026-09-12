# Gym App — diseño

Fecha: 2026-09-12
Usuario: Marco Meschini. Entrenador: Agustín Paz (@aguspazfit).

## Objetivo

Web app instalable en iPhone (Artifact en claude.ai) para consultar en el gym:
qué ejercicios tocan hoy, cómo se hacen (video del entrenador), series/reps/
técnica/descanso, anotar pesos por serie, timer de descanso. Además: biblioteca
de videos, plan de alimentación y glosario de técnicas.

## Fuentes

- `Plan_MarcoMeschini.pdf` — plan de entrenamiento Mes 1, 4 días/semana.
- `Alimentacion_MarcoMeschini.pdf` — 2200 kcal, 3 comidas con opciones, reglas.
- Drive público `1MAW6TTW3q92jAc3gG0ChDHb17AvTya0e` — 47 videos en 8 carpetas
  (abdominales, bíceps, hombros, piernas, tríceps, espalda, pecho, running).
  Árbol guardado en `drive_videos.json`.

## Hosting

Artifact en claude.ai. Privado (requiere sesión). Un solo `index.html`.
Migrable a GitHub Pages sin cambios (mismo HTML; pesos pasarían a localStorage).

## Pantallas

Barra inferior fija: **Rutina · Videos · Comida · Técnicas**.

1. **Rutina** — abre en el día de hoy. Lun/Mar/Mié/Vie → ese día. Jue/Sáb/Dom →
   "Descanso" + los 4 días para elegir. Selector de día siempre visible arriba.
2. **Día** — lista ordenada de ejercicios. Cada ítem: nombre, series, reps/
   técnica, descanso, badges (APROX, BISERIE, SUPERSERIE, GIGANTE, DROPSET,
   FALLO). Biserie/superserie/gigante = un bloque con 2-3 ejercicios. Al final
   el bloque cardio del día (HIIT / cinta inclinada / pasadas), con sus pasos.
3. **Ejercicio** — video embebido (iframe
   `https://drive.google.com/file/d/<id>/preview`), o aviso "sin video" si no
   hay mapeo. Debajo: series/reps/técnica/nota/descanso. Tabla por serie con
   campos **kg** y **reps**; se guarda al salir del campo. Encima: "última vez:
   N kg × R" (última sesión guardada para ese ejercicio). Botón **Descanso**
   con el tiempo del plan → cuenta regresiva grande, beep + flash al terminar.
   En bloques biserie, la pantalla muestra los 2-3 ejercicios apilados con un
   solo timer al final.
4. **Videos** — 47 videos agrupados por carpeta de Drive. Tap → video.
5. **Comida** — resumen macros; desayuno/almuerzo/cena, cada uno con sus
   opciones (kcal, P/G/C, ingredientes); reglas del plan.
6. **Técnicas** — glosario (biserie, superserie, gigante, dropset, fallo, aprox).

## Datos

Todo embebido en `index.html` como objetos JS:

- `PLAN`: `{mes, dias: [{id, nombre, diaSemana, bloques: [...], cardio: {...}}]}`.
  Un bloque es `{tipo: 'simple'|'biserie'|'superserie'|'gigante', series,
  reps, descanso, badges, ejercicios: [{nombre, nota?, videoId?}]}`.
- `VIDEOS`: `[{grupo, titulo, id}]` derivado de `drive_videos.json`.
- `COMIDA`: `{macros, comidas: [{nombre, kcal, opciones: [{kcal, P, G, C,
  items: []}]}], reglas: []}`.
- `TECNICAS`: `[{nombre, texto}]`.

Mapeo ejercicio → `videoId` hecho a mano. Ejercicios sin video conocidos:
peso muerto rumano, estocadas caminando, abductor, gemelos en prensa,
aperturas inclinadas, remo al mentón, press militar Smith, press inclinado
Hammer, remo con barra, fondos tríceps, flexiones, jalón supino con lastre,
todo el cardio.

## Persistencia de pesos

`db` del Artifact, documento por ejercicio y sesión:
`data/users/me/logs/<slug-ejercicio>` → `{sesiones: [{fecha, series: [{kg,
reps}]}]}`. Si `claude.use("db")` resuelve `null` → mismo shape en
`localStorage`. "Última vez" = última sesión con al menos un kg cargado.

## Timer

Guarda `finAt = Date.now() + ms`; el tick calcula restante contra `finAt`, así
sobrevive a que iOS pause la página. Al terminar: beep (Web Audio, creado en
el tap del botón para pasar el gate de autoplay) + flash de pantalla.
Límite conocido: sin aviso con el teléfono bloqueado o la app en fondo.

## Estilo

Dark: fondo `#0b0b0b`, tarjetas `#151515`, acento dorado `#c9a84c` (igual al
PDF). Badges con los colores del PDF (aprox cyan, biserie dorado, superserie
azul, dropset rojo, fallo naranja). Tipografía system. Tap targets ≥ 44px.
`prefers-color-scheme` ignorado: la app es dark siempre.

## Errores

- Sin internet: el iframe de video no carga; se muestra texto "Video necesita
  internet" bajo el iframe. El resto funciona.
- `db` no disponible: fallback localStorage silencioso.
- Video sin mapeo: tarjeta "Sin video del entrenador".

## Check

`check_data.py`: valida que cada `videoId` de `PLAN` exista en
`drive_videos.json`, que cada día tenga ≥1 bloque, que cada comida tenga ≥1
opción, que cada bloque tenga series y descanso. Falla con exit 1 si algo no
cumple.

## Fuera de alcance

Cuenta de usuario, sync entre personas, notificaciones push, gráficos de
progreso, edición del plan desde la app. Mes 2 = actualizar `PLAN` y
republicar.
