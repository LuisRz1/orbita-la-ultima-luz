---
id: tipografia
type: arte
status: aplicada-en-3d
updated: 2026-11-14
tags: [orbita, arte, tipografia, 3d]
---
# Tipografía: Perihelio Mono

Fuente propia del juego, diseñada desde cero para la interfaz 3D. No usa contornos de terceros: se genera por código con [build-font.mjs](../../tools/font/build-font.mjs) y se distribuye con el proyecto en `public/fonts/`.

## Diseño

- **Monoespaciada:** todas las letras miden 600 unidades, así las cifras de telemetría no bailan al cambiar.
- **Trazos sobre una retícula de 4 × 7:** línea base 0, altura de x 5, mayúsculas 7, descendentes −2. Cada trazo se convierte en barras con uniones octogonales.
- **Esquinas cortadas a 45°**, como placas de una nave, en lugar de curvas.
- **Cero con barra**, para no confundirlo con la O.
- **Puntos grandes** (punto, i, j, %), para que se lean en tamaño pequeño.
- **Dos pesos:** 400 (trazo de 76 unidades) para el texto y 700 (124) para los títulos.
- Cubre el alfabeto latino básico, las tildes del español (á é í ó ú ñ ü, ¿ ¡), puntuación, flechas y los símbolos del HUD (■ □ ▮ ▯ ✓ ·).

## Uso

- Toda la interfaz 3D (`src/ui/ui.css`) la usa, con las fuentes monoespaciadas del sistema como respaldo.
- Para cambiar un glifo: editar sus trazos en el objeto `glyphs` del script, ejecutar `pnpm font` y revisar una muestra antes de aplicarlo.
- Los metadatos del archivo indican SIL Open Font License 1.1, para que otros puedan reutilizarla.
