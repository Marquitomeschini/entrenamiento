# Entrenamiento

PWA con la rutina de Agustín Paz (@aguspazfit). En el iPhone: Safari → Compartir → Agregar a pantalla de inicio.
URL: https://marquitomeschini.github.io/entrenamiento/

## Uso en el gym

- Tildá cada serie con ✓: se guarda y arranca solo el descanso (en biseries, al tildar el último ejercicio).
- "Empezar cardio" recorre el HIIT / caminata / pasadas con cuenta regresiva y "Hecho" en los pasos por reps.
- Notas libres por ejercicio (banco, polea, agarre). Pesos, tildes y notas quedan en ese teléfono.
- Funciona sin señal: la app se guarda al primer uso; cada video queda guardado después de verlo una vez.

## Mantenimiento

- `data.js` — plan, videos, comida, técnicas. Plan nuevo: editar y correr `node check_data.js`.
- `encode_videos.sh` — baja los videos del Drive y los deja en `videos/` (720p H.264).
- Checks: `node check_data.js && node test.js && node test_sw.js`.
- Preview local: `python3 -m http.server 8765` → http://127.0.0.1:8765
- Deploy: push a `main` (GitHub Pages). El service worker usa network-first para el shell: no hace falta bumpear versión.
