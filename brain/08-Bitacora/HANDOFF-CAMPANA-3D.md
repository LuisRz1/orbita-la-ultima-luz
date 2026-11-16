---
id: handoff-campana-3d
type: handoff
status: integracion-local
updated: 2026-11-15
tags: [orbita, 3d, continuidad, campana]
---
# Handoff de campaña 3D

## Cómo continuar

La carpeta de entrega es D:/PROYECTOS/Orbita-Entrega, rama codex/entrega-juego. Inicia con pnpm dev. La portada abre ajustes y Primera luz. La ruta /?campana reanuda toda la campaña. Las expediciones de referencia se conservan en /?level=moon y /?demo.

`/?campana&primera-luz` empieza o reanuda una partida dedicada al primer capítulo. Las escenas usan los IDs y prerequisitos de [Primera luz](../02-Diseno/CAPITULOS/C1-PRIMERA-LUZ.md). La pauta del movimiento está en [models.ts](../../src/engine/models.ts) y los eventos se disparan desde el bucle fijo en [game.ts](../../src/engine/game.ts). Si se incorpora un modelo final, conserva los pivotes de cadera, rodilla, tobillo, torso, codo y casco y verifica los gestos de terminal y escaneo.

## Puntos de entrada

| Trabajo | Código y evidencia |
| --- | --- |
| Secuencia, validación y retorno | [campaign.ts](../../src/core/campaign.ts), [escritura por checkpoint](../../src/core/save/campaign.ts) y [cinemáticas](../../src/ui/screens/campaign-scenes.tsx). |
| Terreno, posiciones y diálogos | [registro](../../src/levels/registry.ts), [composición de destinos](../../src/levels/campaign.ts) y [reglas obligatorias](../../AGENTS.md). |
| Complejo terrestre | [Plano y colisiones](../../src/levels/orbit/earth-port.ts) y [modelos](../../src/engine/earth-props.ts). Recorre patio, plataforma y mirador si cambias sus dimensiones. |
| Pilotaje | [modelo de vuelo](../../src/core/orbit/flight.ts), [visor 3D](../../src/engine/flight-view.ts), [pantalla de vuelo](../../src/ui/screens/flight.tsx). |
| LUMA y tus clips | [modelo](../../src/engine/models.ts), [reproductor](../../src/engine/voice.ts) y [manifiesto](../../public/assets/voice/luma/clips.json). Lleva tus modelos y clips a la escena y al idioma indicado en [la guía](../06-Produccion/CAMPANA-3D.md). |
| Pruebas | [reglas y terreno](../../tests/core/campaign.test.ts) y [recorrido de Chrome](../../tests/e2e/campaign.spec.ts). |

## Reglas al revisar

- La partida empieza de civil con la hermana en el patio. Tras el prólogo, entra por Control y sigue estación y EVA, Luna Nácar, Marte, Bennu y retorno con Aurora. Abre el compartimento de LUMA solo después del cotejo de la cápsula. Protege la progresión en español e inglés y las validaciones de evidencias.
- La compuerta de C4 tiene bloqueo físico y una apertura coordinada desde el conducto. El cierre del sacrificio y la recepción en la Tierra son eventos distintos. Las expediciones posteriores solo reciben comunicación nueva de Control.
- Verifica cada reemplazo de modelo en el destino y a escala del astronauta. Anota las colisiones o cuadrículas que deban ajustar los modelos de un compañero.
- La aceptación extensa necesita una partida manual sin herramientas de depuración, mediciones en Iris Xe y selección final de rutas, encargos y coleccionables. El reproductor de clips puede verificarse después de añadir los archivos del propietario.
