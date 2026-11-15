---
id: marte-terracota
type: diseno
status: nivel-3d-jugable
updated: 2026-11-14
tags: [orbita, diseno, marte, 3d, capitulo-3, spoilers]
---
# Marte «Terracota»: nivel 3D del capítulo 3

**SPOILERS del capítulo 3.** Es la salida a pie de [El mundo rojo](CAPITULOS/C3-EL-MUNDO-ROJO.md) en el juego 3D. Cubre C3-M03 (hábitat), M04 (valle) y M05 (relé). El terminal cierra la parte de M06 que autentica AUR-E04 y AUR-E05 juntas. El crucero, el descenso pilotado (M01–M02), el ascenso y el reabastecimiento en el nodo (resto de M06) siguen en la ficha del capítulo y dependen de la tanda 6 (vuelo 3D).

Se abre con `/?level=mars`. Desde el menú o el informe, se desbloquea al completar la Luna ([progresión](#progresión)). Código: [level.ts](../../src/levels/mars/level.ts), [terrain.ts](../../src/levels/mars/terrain.ts) y [dialogue.ts](../../src/levels/mars/dialogue.ts).

## Lugar

El valle es un cráter erosionado con sedimentos en capas. La referencia real es el cráter Gale y su montículo estratificado, que estudia Curiosity. Este valle concreto es **inventado**: no es un producto de MOLA ni de HiRISE.

Las coordenadas están en metros: x crece hacia el este y z hacia el sur. El terreno mide 256 m de lado.

| Zona | Centro | Qué hay | Cómo se llega |
| --- | --- | --- | --- |
| Campamento de Aurora | (−8, 62) | Módulo propio (0, 76), hábitat de Aurora (−18, 56), terminal (−10, 62), rover aparcado (14, 54) | Inicio en (0, 67) |
| Cauce seco | z = 22 + 5·sen(x/23) | Cauce de 7 m de hondo con paredes de más de 40° | Salto y dash por el centro, o a pie por los vados de x ≈ −60 y x ≈ +62, señalados con balizas |
| Campo de dunas | (−4, −16), r 22 | Ondas de arena; zona de polvo | A pie |
| Meseta estratificada | (52, −8) | Acantilado de 8 m y estratos visibles; mirador opcional en la cima | Rampa por el suroeste, o doble salto por el acantilado |
| Colina del relé | (−52, −34) | Relé del valle con mástil de 9 m | A pie, pendiente suave |
| Cabecera del valle | (6, −80) | Equipo de campo de Aurora | A pie |

El borde del cráter (r 98–114 m) supera los 40°. El enlace cae entre 100 y 120 m del centro.

## Misión `c3-surface`

| Punto | Acción | Coste (u.) | Requisito | Misión | Qué registra |
| --- | --- | --- | --- | --- | --- |
| `habitat` Hábitat de Aurora | reparar | 12 (6 con kit) | — | M03 | Energía y soporte vital |
| `logbook` Bitácora de tu hermana | escanear | 4 | hábitat | M03 | Registro base de AUR-E04: detección de una baliza desconocida |
| `outcrop` Afloramiento estratificado | escanear | 8 | — | M04 | Capas depositadas por agua antigua |
| `field-kit` Equipo de campo | recuperar | 12 | — | M04 | Copia de navegación anterior al desvío |
| `relay` Relé del valle | reparar | 20 (10 con kit) | — | M05 | Mensaje de emergencia almacenado, sin interpretar |
| `mesa` Mirador (opcional) | escanear | 4 | — | C3-R05 | Muestra las dos rutas de vuelta |
| `terminal` Terminal del hábitat | transmitir | 0 | todo lo obligatorio | M06 (parte) | Autentica AUR-E04 + AUR-E05 |

- **Coste total de lo obligatorio:** 40 u. con la propuesta ligera y 56 u. con la científica. Una prueba exige que, en Luna y Marte, ambas propuestas cubran los objetivos, la reserva y tres minutos de soporte vital.
- **Orden libre:** M04 (`outcrop` y `field-kit`) y M05 (`relay`) se pueden hacer en cualquier orden. Las pruebas comprueban los dos órdenes.
- **Sin revelaciones parciales:** ningún texto de un punto nombra el destino.
- **Revelación final:** Bennu, los supervivientes y la hermana aparecen solo en el resultado (`outcome`) del informe y en el diálogo `complete`, al autenticar todo junto.

## Contingencia de energía

La reparación del relé levanta un frente de polvo sobre las dunas. Es ficción de juego; los remolinos de polvo sí son reales y los han observado los rovers.

- **Antes del relé:** las dunas gastan 0,3 u./s.
- **Después del relé:** gastan 1,6 u./s.
- **Mecanismo:** el contrato v2 lo expresa con `surge` en la zona (`after: 'relay'`). `zoneDrain` calcula el gasto, y la simulación lo anota en la línea «Polvo y viento» del informe.

El jugador elige entre dos opciones:

- **Cruzar rápido**, más caro.
- **Rodear por los vados**, más largo y más barato. Las balizas marcan el camino.

LUMA lo sugiere y Control avisa del frente. El informe atribuye el gasto y recomienda rodear. La contingencia no bloquea nada: siempre hay una vía a pie.

## Paleta, cielo y sonido

El bioma `terracota` está en [style.ts](../../src/engine/style.ts) y se elige por nivel con `setBiome`. La Luna sigue con `nacar` y sus valores originales.

| Uso | Color |
| --- | --- |
| Suelo con luz / medio / sombra / profunda | `#f0a77a` / `#c46b4e` / `#6b3b4f` / `#4a2638` |
| Tinta | `#2a141c` |
| Cielo cenit / horizonte / niebla | `#a8694d` / `#e9b98c` / `#d9a07a` |
| Halo del Sol | `#8fb7e6` (real: el polvo fino dispersa el azul hacia delante cerca del Sol) |
| Rocas | `#d98f68` / `#8f4f45` |
| LUMA, fase roja | pelaje `#e8553f`, núcleo `#ffd2b8` |

- **Cielo:**
  - Sol más pequeño con halo azul.
  - Fobos y Deimos, oscuros y con un tamaño exagerado para que se lean en pantalla.
  - Sin estrellas de día.
- **Atmósfera:**
  - Niebla más cercana, porque Marte sí tiene atmósfera.
  - El polvo del suelo cae con 3,71 m/s² y se frena con el aire.
  - El polvo en suspensión viaja con el viento.
  - Las dunas tienen remolinos, que crecen durante la tormenta.
- **Sonido:** una capa de viento procedural (ruido filtrado con ráfagas) que solo suena en Marte y sube con la tormenta. Marte transmite sonido (lo grabaron los micrófonos de Perseverance); la Luna, no. Ver [audio](../05-Arte/AUDIO.md).

## Modelos nuevos

Los dos se generan por código, en [models.ts](../../src/engine/models.ts):

- **`habitat`:** dos módulos presurizados semienterrados, un nodo, un panel solar polvoriento, una escotilla iluminada al oeste (donde se lee la bitácora) y polvo acumulado contra las paredes.
- **`rover`:** el rover presurizado de Aurora, aparcado. Su techo sirve de apoyo para un eco.

## Progresión

El orden de la ruta está en [registry.ts](../../src/levels/registry.ts): Luna → Marte.

- **Desbloqueo:** un destino se desbloquea cuando el anterior tiene un intento completo en su propio guardado.
- **Informe lunar:** un informe completo en la Luna ofrece «Continuar a Marte».
- **Menú:** lista los destinos abiertos («Viajar a…») y los bloqueados.
- **Guardado separado:** cada destino conserva su guardado (`orbita-3d`, clave por nivel).
- **Datos del menú:** la tarjeta y la premisa salen de [facts.ts](../../src/levels/facts.ts), con fuente NASA Mars Facts.

## Ecos y logros

- **Ocho ecos:**
  - techo del hábitat;
  - techo del rover;
  - dos chimeneas de roca;
  - un peñasco;
  - la cima de la meseta;
  - el fondo del cauce;
  - la colina del relé.
- **Logro nuevo:** «Entre remolinos», por cruzar las dunas. «Todas sus huellas» y «Transmisión recibida» pasan a valer para cualquier destino.

## Ficción y simplificaciones

- **Ficción:**
  - Aurora, su campamento, la baliza y el contenedor de LUMA.
  - La tormenta que provoca el relé.
  - El valle concreto.
- **Simplificación:**
  - Coste del polvo en batería.
  - Gravedad de juego estilizada; el HUD muestra la real, 3,71 m/s².
  - Tamaño de Fobos y Deimos.
- **Observado, con fuente en los créditos:**
  - Gravedad, temperatura y atmósfera.
  - Halo azul junto al Sol.
  - Capas sedimentarias de agua antigua.
  - Remolinos de polvo y sonido en Marte.

## Pendiente

- Vuelo 3D:
  - Crucero con demora de comunicaciones y descenso pilotado (M01–M02).
  - Ascenso, acople y reabastecimiento con validación de plazas (resto de M06).
- Secundarias del capítulo (12 encargos, 45 hallazgos) y cuidados de LUMA como mecánica.
- Medir los fps en Iris Xe y equilibrar con partidas reales.

## Atlas de rocas (15-nov)

Cinco rocas en menta, catalogables con la cámara por 1 u. ([atlas.ts](../../src/levels/mars/atlas.ts)). Todas citan [NASA · Mars Facts](https://science.nasa.gov/mars/facts/): regolito oxidado (20, 40), huella de agua (26, −2), polvo de tormenta (−26, −8), roca volcánica (60, −40) y escarcha (−40, −70). La escarcha está marcada como simplificación: el hielo observado está en las regiones polares.
