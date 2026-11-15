---
id: guia-colaboradores-3d
type: guia
status: vigente
updated: 2026-11-14
tags: [orbita, produccion, 3d, equipo, agentes]
---
# Guía para colaborar en el juego 3D

Para quien llega al código por primera vez, con o sin agentes. Lee antes [AGENTS.md](../../AGENTS.md): sus reglas mandan (sin commits ajenos, sin pagos, sin secretos, la historia y la cadena AUR-E01–E07 no se rompen).

## 1. Arrancar en 5 minutos

Node 24 y pnpm 12.4.1. Con mise:

```
mise exec node@24.22.1 -- corepack pnpm@12.4.1 install --frozen-lockfile
mise exec node@24.22.1 -- corepack pnpm@12.4.1 dev
```

| URL | Qué abre |
| --- | --- |
| `/` | Portada 3D con campaña y expedición lunar de referencia |
| `/?campana` | Campaña de Aurora desde la Tierra y reanudación por tramo |
| `/?debug` | Más panel de render, ajuste de movimiento en vivo y `window.__orbita` |
| `/?level=<id>` | Un nivel del [registro](../../src/levels/registry.ts) |
| `/?quality=low\|medium\|high` | Fuerza la calidad gráfica |
| `/?legacy` | El juego 2D anterior (Phaser); `/?legacy&world=orbit` abre el capítulo 1 |

Comprobaciones, siempre antes de entregar:

```
corepack pnpm build        # tipos + bundle
corepack pnpm test         # lógica pura (node --test)
ORBITA_BROWSER=/usr/bin/brave corepack pnpm test:e2e   # recorridos en navegador (cualquier Chromium instalado)
```

## 2. Mapa del código

```
src/core/      lógica pura, sin three ni React: se prueba con node --test
  movement.ts    salto, doble salto, dash, pendientes, sólidos
  suit.ts        catálogo del traje, masa, costes   ←  el diseño de misión (reto NASA)
  sortie.ts      energía, interacción, informe que explica cada fallo
  session.ts     zonas, enlace, ecos
  achievements.ts, heightfield.ts, contract/level-v2.ts (contrato de nivel + checkLevel)
  orbit/, worlds/, contract/grid-v1.ts   capítulo 1 y kit 2D (se conservan)
src/engine/    three.js: game.ts (bucle y fases), world-view.ts (escena), models.ts (traje, LUMA, props),
               style.ts (paleta del bioma, toon, contorno, texturas por código), audio.ts (música y efectos
               procedurales), quality.ts, input.ts, loop.ts, debug.ts
src/levels/    un módulo por destino: terrain.ts (forma), level.ts (datos), dialogue.ts (líneas); registry.ts
src/ui/        React: app.tsx, hud.tsx, screens/ (menú, consola del traje, informe), i18n.ts (ES/EN), prefs.ts
src/legacy/    vista Phaser anterior, solo con ?legacy
tools/font/    genera la tipografía Perihelio Mono
tests/core, tests/engine, tests/e2e
```

Regla de capas: `core` no importa three ni React; `engine` no importa React; `ui` habla con el motor solo por `ui/store.ts` (estado que publica el motor y `commands` que la interfaz invoca).

La [integración de campaña](CAMPANA-3D.md) fija entradas, salidas, anclajes, traducciones y clips de voz. El estándar de mundo abierto acotado, cámara, controles y pantalla completa es obligatorio. Para cambiar terrenos, usa los módulos de destino y conserva el contrato de misión.

## 3. Crear un nivel nuevo (por ejemplo Marte)

1. Copia `src/levels/moon/` a `src/levels/mars/`.
2. `terrain.ts`: escribe la función de alturas (x al este, z al sur, metros). Debe ser determinista.
3. `level.ts`: puntos con las reglas del mundo v1 (`src/core/worlds/mars.ts`), zonas, props, ecos, sol, enlace. Lee [niveles](../02-Diseno/NIVELES.md).
4. `dialogue.ts`: líneas ES/EN que no revelen destinos ni pruebas posteriores ([historia](../02-Diseno/HISTORIA-PRINCIPAL.md)).
5. Regístralo en `src/levels/registry.ts` y ábrelo con `/?level=mars`.
6. Añade una prueba como `tests/core/level.test.ts`: `checkLevel` debe devolver `[]` (todo lo obligatorio alcanzable a pie, dentro del enlace).
7. Usa `biome` del nivel para elegir las paletas del motor. Nácar conserva su paleta, Marte usa terracota y Bennu gris carbón con guías ámbar. Integra el nivel al registro de campaña y comprueba el informe y la siguiente etapa.

## 4. Trabajar con agentes

Funciona bien así (es como se construyó lo que hay):

- **Un agente, una tarea con criterio de aceptación.** Ejemplo: «Crea el nivel Marte en `src/levels/mars/` siguiendo GUIA-COLABORADORES-3D §3; `checkLevel` sin problemas; captura de 3 zonas revisada; no toques `src/core`».
- **Pide que mire lo que hizo.** Los agentes pueden jugar con Playwright y `window.__orbita` (teletransporte, pasos de tiempo fijos) y sacar capturas: que las lea antes de decir «listo».
- **Audio:** el agente no oye. Se renderiza a WAV (`renderWav` en audio.ts) y se analiza con [earshot](https://github.com/Leonxlnx/earshot) vía `uvx`. Ver [audio](../05-Arte/AUDIO.md).
- **Roles útiles en paralelo:** diseñador (especificación concreta con coordenadas y colores), implementador, playtester (juega y critica), revisor (lee el diff).
- **No le pidas commits**: los hace una persona.

## 5. Estado y siguientes pasos

- Estado verificado: [ESTADO-ACTUAL](../00-Inicio/ESTADO-ACTUAL.md). Plan por tandas: [tandas](TANDAS.md).
- Bloques pendientes de la [especificación Nácar](../02-Diseno/LUNA-NACAR.md): interior de la nave con puestos de equipamiento (sustituye la consola de dos paneles), ruinas con botín, atlas de rocas, misiones secundarias y peligros suaves.
- Mecánicas y valores: [mecánicas](../02-Diseno/MECANICAS.md), [logros](../02-Diseno/LOGROS.md). Arte: [guía visual 3D](../05-Arte/GUIA-VISUAL-3D.md), [tipografía](../05-Arte/TIPOGRAFIA.md).
- Decisión de motor: [ADR 006](../03-Arquitectura/ADR/ADR-006.md).
