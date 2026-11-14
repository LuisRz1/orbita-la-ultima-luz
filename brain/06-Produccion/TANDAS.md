---
id: tandas-3d
type: produccion
status: tanda-0-cerrada
updated: 2026-11-14
tags: [orbita, produccion, 3d]
---
# Tandas de la reconstrucción 3D

Plan de trabajo de la reconstrucción decidida en [ADR 006](../03-Arquitectura/ADR/ADR-006.md). Cada tanda termina con build y pruebas en verde y algo jugable. Los commits los hace el propietario.

## El juego en una frase

Diseñas la salida en una terminal → eso define tu traje y lo que puedes hacer a pie → exploras una zona acotada con LUMA → vuelves antes de agotar la reserva → el informe une cada decisión con su resultado → rediseñas y repites. Es la respuesta al reto [Space Mission Design Game](../04-Ciencia/REQUISITOS-NASA.md).

## Estado

| # | Tanda | Entrega | Cómo se comprueba | Estado |
| --- | --- | --- | --- | --- |
| 0 | Cimientos | Lógica en `src/core`, Phaser tras `/?legacy`, motor three con bucle fijo y regulador, ADR 006 | `pnpm build`, `pnpm test`, `pnpm test:e2e` | Cerrada |
| 1 | Luna en gris | Terreno, controlador, cámara, 6 puntos, títulos de zona, límite de enlace, panel `?debug`, NIVELES.md | Recorrer los 6 puntos; ms por cuadro en Iris Xe | Pendiente |
| 2 | Bucle de misión | Traje, consola de diseño → salida → informe → rediseño, guardado | Fallar con un diseño y completar con otro | Pendiente |
| 3 | Interfaz y LUMA | HUD terminal, menú, diálogos, LUMA, logros, ES/EN | Recorrido completo en ambos idiomas | Pendiente |
| 4 | Look | Luz horneada, toon, contornos, cielo, props | 30 fps o más en Iris Xe a 720p | Pendiente |
| 5 | Audio | ZzFX y efectos generados | Volumen en ajustes | Pendiente |
| 6 | Capítulo 1 en 3D | Estación y vuelo; se retira Phaser | Capítulo 1 hasta la llegada a la Luna | Pendiente |
| 7 | Marte y Bennu | Mismo molde; Bennu con gravedad radial | Nivel nuevo solo con datos y horneado | Pendiente |
| 8 | Entrega | Despliegue, README, fuentes, vídeo | URL abierta en otro equipo | Pendiente |

Mínimo entregable: tandas 0 a 3, la luz horneada del terreno y la tanda 8. El 2D en `/?legacy` es la red de seguridad. Orden de recorte: tanda 7, audio generado, vuelo en 3D, cámara del menú, contornos.

## Decisiones cerradas

- Jugador a pie en tercera persona; LUMA acompaña flotando.
- Controles: `WASD`, ratón para la cámara, `Espacio` salto y doble salto, `Shift` dash, `E` interactuar, `R` escanear, `Tab` registro, `/` consola, `Esc` pausa.
- Interfaz: fondo `#0b0f14`, texto `#d7dee6`, acento `#7fe3e0`, aviso `#ffaf68`; tipografía monoespaciada del sistema.
- Personaje y props geométricos generados por código hasta la tanda 4.
- Guardado del 3D en una base Dexie nueva (`orbita-3d`).

## Cómo ejecutar

Node 24 y pnpm 12.4.1 (ver [entorno](ENTORNO.md)). En un equipo con mise:

```
mise exec node@24.22.1 -- corepack pnpm@12.4.1 install --frozen-lockfile
mise exec node@24.22.1 -- corepack pnpm@12.4.1 dev
```

- `/` abre el juego 3D; `/?debug` añade el panel de render y `window.__orbita`; `/?quality=low|medium|high` fuerza la calidad.
- `/?legacy` abre el kit 2D; `/?legacy&world=orbit` abre Primera luz.
- Pruebas de navegador con un Chromium instalado: `ORBITA_BROWSER=/usr/bin/brave pnpm test:e2e`.
