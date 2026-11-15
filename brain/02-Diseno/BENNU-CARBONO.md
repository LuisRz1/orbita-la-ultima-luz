---
id: bennu-carbono
type: diseno
status: nivel-3d-jugable
updated: 2026-11-15
tags: [orbita, diseno, bennu, 3d, capitulo-4, spoilers]
---
# Bennu «Carbono»: nivel 3D del capítulo 4

**SPOILERS del capítulo 4.** Es la salida a pie de [Lo que queda de la luz](CAPITULOS/C4-LO-QUE-QUEDA.md). Cubre C4-M02 «Un mundo sin suelo» y C4-M03 «Memoria del Sistema Solar», cerrada al validar AUR-E06 en persona en el refugio. La aproximación (M01), la evacuación (M04), el incidente y el sacrificio de LUMA (M05) y el regreso (M06) **no** forman parte de esta salida: necesitan secuencias propias y siguen el [arco de LUMA](ARCO-LUMA-SPOILERS.md).

Se abre con `/?level=bennu`; desde el menú, al completar Marte. Código: [level.ts](../../src/levels/bennu/level.ts), [terrain.ts](../../src/levels/bennu/terrain.ts) y [dialogue.ts](../../src/levels/bennu/dialogue.ts).

## Ciencia: qué es dato y qué es juego

Fuente: [NASA · Bennu Facts](https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/).

| Elemento | Tipo | Nota |
| --- | --- | --- |
| Medio kilómetro de ancho, una vuelta cada 4,3 h | Observación | Ficha del menú. |
| Superficie suelta, poco cohesionada, con bloques de hasta 22 m | Observación | El campo de bloques «inestable» y el gran bloque central. |
| Sin gravedad suficiente para tener atmósfera | Observación | El HUD muestra 0,00 m/s²; el movimiento es estilizado. |
| De −73 °C a +116 °C | Observación | La cara diurna gasta batería (`hazard: 'sun'`). |
| Polvo rico en carbono | Observación | Suelo carbón oscuro; la muestra de contexto. |
| Curvatura del horizonte | Simplificación | El suelo cae d²/2R con R = 260 m para que se lea el tamaño. |
| Saltos lentos de unos 4 m y línea de anclaje a 6 m | Simplificación | La gravedad real haría escapar al jugador; la línea lo evita. |
| Refugio, módulo de servicio, visita humana | Ficción | Hipotéticos. |

## Misión

Orden: anclaje → enlace de voz → (acceso este, acceso oeste, muestra, archivo en cualquier orden) → refugio. El refugio exige todos los obligatorios. El mirador del gran bloque es opcional. Manifiesto escrito: **cuatro supervivientes**, entre ellos la hermana (decisión de contenido, 15-nov).

La hermana habla solo en la secuencia `complete`, después de validar AUR-E06 (hablante `AURORA`). Ninguna línea anticipa el incidente ni el sacrificio; una prueba lo comprueba.

## Look

Bioma `carbono`: suelo carbón con luces arena, sombras azul profundo, cielo negro con muchas estrellas, la Tierra como un punto azul (`sky: 'deep'`) y LUMA en su fase blanco-azulada. Admite el cielo pintado (azul y lavanda).

## Pendiente

- M01, M04, M05 y M06 como secuencias.
- Contenido secundario: 8 encargos y hallazgos del capítulo. Hecho: atlas de 5 rocas con la ficha NASA (`src/levels/bennu/atlas.ts`).
- Voces de LUMA para Bennu.
