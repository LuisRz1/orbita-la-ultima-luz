---
id: estacion-quirofano
type: diseno
status: nivel-3d-jugable
updated: 2026-11-14
tags: [orbita, diseno, orbita-baja, 3d, capitulo-1]
---
# Estación «Quirófano azul»: nivel 3D del capítulo 1

Es la salida a pie de [Primera luz](CAPITULOS/C1-PRIMERA-LUZ.md) en el juego 3D y **el primer nivel del juego**: `/` lo abre. Cubre C1-M03 (acople, suministros y cotejo de la cápsula), M04 (encuentro con LUMA y traductor) y M05 (EVA con elección de iluminación y registrador exterior). La esclusa autentica AUR-E01 y AUR-E02 juntas.

El diseño de la nave antes de despegar, el ascenso pilotado (M01–M02) y el crucero al nodo lunar (M06) siguen en la versión 2D completa (`/?legacy&world=orbit`) hasta que exista el vuelo 3D (tanda 6).

Código: [level.ts](../../src/levels/orbit/level.ts), [terrain.ts](../../src/levels/orbit/terrain.ts) y [dialogue.ts](../../src/levels/orbit/dialogue.ts).

## Lugar

La estación de recepción es **ficción**. Su referencia es la Estación Espacial Internacional, en órbita baja a unos 400 km. El jugador camina con botas magnéticas por cubiertas y pasarelas sobre el vacío, con la Tierra debajo. Si sale de la cubierta, el **cable de seguridad** detiene la caída (`fallLimit`) y lo devuelve al acople; cuenta como un repliegue.

Las coordenadas están en metros: x crece hacia el este y z hacia el sur.

| Zona | Dónde | Qué hay |
| --- | --- | --- |
| Puerto de acople | (0, 62) | Tu nave (0, 76), suministros (−9, 60), esclusa (9, 64) y la medición de luz (0, 47) |
| Cuna de recepción | (−36, 37) | Cápsula de Aurora (−36, 46), módulo del compartimento protegido (−36, 30), traductor y parche de la hermana |
| Armadura al sol | (0, −15), r 30 | Camino directo al registrador; zona `sun` con 0,6 u./s de refrigeración |
| Baranda en sombra | x ≈ −37 y cruce en z ≈ −72 | Camino largo, balizado y sin gasto extra |
| Brazo de antena | (0, −85) | Registrador exterior y mástil con baliza, visible desde toda la estación |

Las alas solares cuelgan sobre el vacío a la altura de la cubierta. La cubierta se dibuja como una losa de 1,5 m: por debajo, el shader no pinta el terreno.

## Misión `c1-station`

| Punto | Acción | Coste (u.) | Requisito | Misión |
| --- | --- | --- | --- | --- |
| `supplies` Transferir suministros | reparar | 8 (4 con kit) | — | M03 |
| `capsule` Cotejar cápsula y recepción | escanear | 8 | suministros | M03: parte documental de AUR-E01 |
| `protected-bay` Abrir compartimento protegido | reparar | 4 (2 con kit) | cápsula | M04: **aparece LUMA** |
| `translator` Calibrar el traductor | escanear | 4 | compartimento | M04 |
| `keepsake` Objeto de tu hermana (opcional) | escanear | 0 | traductor | M04 |
| `sun-record` Archivar iluminación | escanear | 8 | — | M05 |
| `recorder` Recuperar registrador exterior | recuperar | 12 | iluminación | M05 |
| `airlock` Esclusa | transmitir | 0 | todo lo obligatorio | Autentica AUR-E01 + AUR-E02 |

- **Coste total:** 38 u. con la propuesta ligera y 44 u. con la científica; la prueba de viabilidad incluye este nivel.
- **Elegir ruta** (la decisión de M05):
  - La armadura al sol es más corta y cuesta refrigeración.
  - La baranda en sombra es más larga y no tiene gasto extra.
  - El informe atribuye el gasto en la línea «Refrigeración al sol».
- **LUMA** se une al abrir el compartimento (`companionAfter`). Antes, sus avisos los da el sistema del traje, los repliegues los guía Control y no se dibuja LUMA. En el capítulo 1 su color es blanco cálido y dorado (`#ffe2a0`).

## Paleta y cielo

El bioma `quirofano` está en [style.ts](../../src/engine/style.ts):

- **Colores:** chapa blanca `#eef2f8`, sombras azules `#6f83a8` iluminadas por el reflejo de la Tierra, tinta `#141b2e` y espacio negro con estrellas y Vía Láctea.
- **Tierra:** grande bajo las cubiertas, con un borde azul de atmósfera.
- **Superficie:** sin rocas, sin huellas sobre el metal y con muy poco polvo en suspensión.
- **Shader de chapa:** juntas cada 3 m, remaches y variación entre paneles.
- **Modelos nuevos** (generados por código en [models.ts](../../src/engine/models.ts)):
  - `capsule`: cono con escudo térmico sobre una cuna de tres brazos.
  - `module`: cilindro presurizado con escotilla iluminada.
  - `panel`: ala solar sobre el vacío, con su brazo.

## Diálogos

- **Antes de abrir el compartimento** solo habla Control: introducción, zonas y repliegue. Una prueba lo comprueba.
- **Cuando LUMA habla por primera vez** es tras calibrar el traductor (secuencia `point:translator`): «Ella me puso el nombre. Tu hermana».
- **Lo que sabe el jugador:** la cápsula prueba que alguien la envió tras el incidente, no que siga vivo.
- **Sin adelantos:** nada nombra Marte, Bennu ni a los supervivientes.
- **Cierre:** valida AUR-E01 y AUR-E02 y señala el archivo del relé lunar. El informe ofrece «Continuar a Luna».

Las secuencias `point:<id>` son nuevas en el motor: se reproducen una vez al completar ese punto, en cualquier nivel.

## Ficción y fuentes

- **Ficción:**
  - La estación de recepción.
  - La cápsula, LUMA y el traductor.
  - El tamaño de la estación, mayor que el de la EEI.
- **Simplificación:**
  - Botas magnéticas con el mismo movimiento estilizado del juego.
  - Coste de refrigeración al sol.
- **Observado, con fuente en los créditos:**
  - Órbita baja de unos 400 km, donde la gravedad sigue siendo de unos 8,7 m/s² pero la estación está en caída libre ([NASA, Space Station Facts](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/)).
  - Temperaturas de una EVA, de unos −157 a +121 °C, y la refrigeración del traje ([NASA, Spacewalk Spacesuit Basics](https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/)).

## Pendiente

- Vuelo 3D para M01, M02 y M06 (diseño de nave y lanzador, ascenso, acople pilotado y crucero). Mientras tanto siguen en `/?legacy&world=orbit`.
- Cuatro encargos y 15 hallazgos del capítulo.
- Medir los fps en Iris Xe.
