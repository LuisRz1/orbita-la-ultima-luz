---
id: luna-nacar
type: diseno
status: bloque-1-aplicado
updated: 2026-11-14
tags: [orbita, diseno, arte, luna, 3d]
---
# Luna «Nácar»: especificación de bioma, traje, nave y contenido

> Especificación del diseñador (agente), revisada por el agente principal. El bloque 1 (paleta, sombras teñidas, cielo, traje con medidor de batería y equipo visible, partículas) ya está aplicado; los bloques 2–4 están pendientes. Las coordenadas están contrastadas con `src/levels/moon/terrain.ts`. Lo marcado como FICCIÓN debe mostrarse así en la interfaz.


No se ha cambiado ningún archivo del repositorio. Coordenadas en metros: x crece hacia el este, z hacia el sur, y es la altura sobre `moonHeight`. Las he contrastado con terrain.ts. Por ejemplo, el suelo de la grieta en (−24, −62) está a −11,7 m, y (50, −66), (−46, −24) y (78, 20) quedan fuera de la grieta y de otras zonas.

## 1. Dirección de arte: la Luna «Nácar»

**Ambiente:** silencio, nácar, frío lúcido, nostalgia, juguete de vitrina. Es un mundo lavanda y perla bajo un cielo índigo, con sombras violeta en lugar de gris.

| Uso | Hex | Dónde se aplica |
|---|---|---|
| Suelo con luz | `#e9e1f2` | `palette.lit` (banda de luz horneada) |
| Suelo medio | `#a99cc8` | `palette.mid` |
| Suelo en sombra | `#4b3f7c` | `palette.shadow` |
| Sombra profunda (zona `shadow` y cuencos) | `#2a2350` | lerp extra si `sunVisibility = 0` y el vértice está en la zona fría |
| Tinta | `#1b1530` | `ink` (contornos y aristas del terreno) |
| Cielo cenit / franja de horizonte | `#0d0a22` / `#2b2459` | `palette.sky` y gradiente del domo (franja de 8° sobre el horizonte) |
| Niebla de profundidad | `#2b2459`, `Fog(60, 220)` | Recurso de estilo: la Luna no tiene aire y la guía de arte lo indica |
| Estrellas / Vía Láctea | `#f3ecff` / `#6b5aa8` con α 0,25 | |
| Rocas: luz / oscura | `#c7bcdc` / `#7f71a6` | `colors.rock` / `rockDark` |
| Cian (objetivo pendiente, interfaz) | `#7fe3e0` | Sin cambios |
| Ámbar (ecos, LUMA, avisos) | `#ffaf68` | Sin cambios |
| Dorado del módulo | `#f2c14e` | Lámina del módulo |
| Rosa (botín y páginas de diario) | `#ff9ec7` | Acento nuevo y exclusivo para el contenido secundario |
| Menta (rocas del atlas escaneables) | `#9dffc8` | Acento nuevo y exclusivo |
| Partículas | polvo `#d9cdef`, polvo levitado `#f6e9ff`, escarcha `#bfe9ff`, destellos `#fff3d6` | Ver la sección 6 |

**Cambio clave: sombras teñidas.** Hoy `toonGradient` multiplica por gris, así que las sombras se ven sucias. Propongo un `onBeforeCompile` en `toon()` que mezcle la banda oscura hacia el uniforme `uShade = #4b3f7c` (el valor de cada bioma), sin multiplicar hacia negro. Es una sola línea de shader y da la mayor ganancia de paleta por minuto de trabajo. La interfaz (`#0b0f14`, `#7fe3e0`, `#ffaf68`) contrasta bien sobre el índigo.

**Otros biomas (una línea cada uno):**

- **Órbita (C1) «Quirófano azul»:** blanco `#f7f9fc`, azul Tierra `#3d7fd9`, sombra `#9fb4d6`, acento coral `#ff7a5c`. Limpio y clínico.
- **Marte «Terracota y menta»:** suelo melocotón `#f0a77a`, medio `#c46b4e` y sombra ciruela `#6b3b4f`; cielo caramelo `#e9b98c` con halo de atardecer azul `#8fb7e6`, que es un fenómeno real.
- **Bennu «Carbón y oro rosa»:** suelo casi negro `#2b2628` / `#6e5f5a`, destellos `#ffcfa8`, cielo `#050307`, cobre `#e0915a`.

Estos tres biomas solo aparecen en la documentación; no se ven en la Luna.

## 2. Rediseño del traje: «Explorador redondo»

**Silueta:** casco burbuja grande, hombros anchos y botas anchas. Mide unas 3,4 cabezas y 1,80 m en total.

| Pieza | Primitiva | Medidas (m) | Color |
|---|---|---|---|
| Bota | `RoundedBox` 0,22×0,14×0,34, r 0,05 | y 0–0,14 | `#e9e2f2`, suela `#3b3358` |
| Pierna inferior | `Capsule` r 0,095, l 0,22 | tobillo 0,16 → rodilla 0,50 | `#f4efe6` |
| Fuelle de rodilla y codo | 2× `Torus` r 0,10, tubo 0,025 | | `#c8d4ea` (azul polvo) |
| Pierna superior | `Capsule` r 0,11, l 0,22 | pivote de cadera a 0,84 | `#f4efe6` |
| Pelvis | `RoundedBox` 0,42×0,18×0,30 | y 0,90 | `#e2dcef` |
| Torso rígido | `Sphere` r 0,30, escala (1, 1,05, 0,82) | centro 1,17 (0,86–1,48) | `#f4efe6` |
| Hombro | `Sphere` r 0,12 en x ±0,31, y 1,36, con aro `Torus` | | aro `#c8d4ea` |
| Brazo | `Capsule` r 0,085/0,08, l 0,17/0,15 | | `#f4efe6` |
| Guante | `Sphere` r 0,09, escala (1; 1,1; 0,85) | | `#c8d4ea`, puño `#ff7a5c` |
| Anillo de cuello | `Torus` r 0,17, tubo 0,04 | y 1,44 | `#3b3358` |
| Casco | `Sphere` r 0,25 | centro 1,58, techo 1,83 | concha `#f4efe6` |
| Visor | segmento de esfera r 0,255 | | índigo `#2b2a5c`, franja de reflejo `#7fe3e0` y brillo `#ff9ec7` |
| Mochila (PLSS) | `RoundedBox` 0,50×0,62×0,24, r 0,06 | en (0; 1,20; +0,27) | `#e9e2d4`, marco `#3b3358` |

**Cuatro detalles distintivos:**

1. **Franja coral en el muslo izquierdo y el brazo izquierdo** (`#ff7a5c`, banda de 0,06 m). Las franjas rojas identificaban al comandante en el traje EMU real.
2. **Medidor de batería diegético en la espalda.** Son cinco celdas de 0,07×0,06 m en la mochila, visibles desde la cámara trasera. Se pintan cian; ámbar por debajo del 30 % y coral cuando queda solo la reserva. Sustituye a mirar el HUD.
3. **El equipo elegido se ve en el traje:**
   - Antena (látigo): 0,25 / 0,45 / 0,70 m; la larga lleva un plato de r 0,08.
   - Propulsor: compacto, 2 toberas `Cylinder` r 0,05 bajo la mochila; potente, 4.
   - Cámara: caja de 0,10×0,07 en el pecho izquierdo con lente cian.
   - Taladro: funda `Cylinder` en el muslo derecho.
   - Kit: bolsa ámbar en el muslo izquierdo.
4. **Módulo de pecho redondo:** un `Cylinder` de r 0,09 con dos perillas y una única luz cian fija.

**Qué se elimina:** las tres luces que parpadean, la punta roja de la antena, los anillos-junta en cada tramo (los sustituyen los fuelles), las botas cuadradas, el tanque naranja lateral y la caja plana del pecho.

**Retoques de LUMA:**

- Pelaje ámbar `#ffb05c` con sombra teñida `#c4612e`.
- Orejas un 20 % más largas, con la punta rosa `#ff9ec7`.
- Ojos de 0,05×0,09 m.
- Nada más: la silueta ya funciona.

## 3. El módulo de aterrizaje

**Exterior** (sustituye a `kind: 'lander'`; colisión con `box` hx = hz = 3,2 y techo +4,6):

- **Etapa de descenso:** prisma octogonal `Cylinder(3, 3,2, 1,8, 8)` de lámina `#f2c14e` con tiras de tinta, sobre cuatro patas.
- **Cabina:** `Cylinder` r 2,4, h 2,6, de 1,8 a 4,4 m; color `#f4efe6` con banda coral `#ff7a5c` de 0,3 m.
- **Ventanas:** tres ojos de buey `Circle` r 0,35, emisivos `#ffe3a3`.
- **Escotilla norte:** 1,0×1,6 m, en (0; 1,8; 72,8).
- **Rampa:** `Box` de 1,2×0,1×4,6 m, de la escotilla hasta el suelo en (0, 68,6). Tiene unos 23° de pendiente y es solo visual: la salida es una animación.
- **Mástil:** con plato y una luz ámbar que parpadea a 1 Hz.

**Interior:** es una escena aparte (`InteriorCell`) que se cambia por la escena principal. Mide 6×5 m con 2,6 m de techo y la cámara va cerca (distancia 3,2 m, altura 1,9 m). Las coordenadas son locales, con el centro de la sala como origen.

| Puesto | Posición | Objetos 3D |
|---|---|---|
| 1. Baterías | (−2,6; 1,0) | Soporte con 3 cilindros de 0,25 / 0,35 / 0,50 m de alto |
| 2. Propulsor | (−2,6; −1,0) | Percha con 3 mochilas: sin toberas, 2 toberas, 4 toberas |
| 3. Antena | (2,6; 1,0) | 3 varillas en ganchos de pared |
| 4. Instrumentos | (2,6; −1,0) | Mesa de 1,4×0,6 m a 0,9 m con cámara, taladro y kit |
| Mesa holográfica | (0, 0), r 0,6 | Mapa del cráter con chinchetas cian por objetivo; rojas si son imposibles |
| Taquilla y casco | (0; 2,1) | Maniquí con el traje que se está montando |
| Cama de LUMA | (−1,6; 2,0) | Cojín ámbar |
| Esclusa | (0; −2,5) | Luz roja que pasa a verde y 2 ventanas en x = ±1,6 que muestran el pico |

Hay cuatro tiras de luz cálida `#ffe3a3` en el techo y partículas de polvo bajo cada una.

**Uso de un puesto:**

1. El jugador camina hasta el puesto, pisa un anillo cian y pulsa E.
2. La cámara se acerca y se despliega **un solo panel lateral** con las 3 opciones de esa pieza. Se recorren con ←/→ y se ve solo el cambio de esa pieza (por ejemplo «+4 kg, +40 u.»).
3. Con E se confirma: la pieza salta al traje con un *pop* de escala 0 → 1,15 → 1 en 0,25 s.

Al terminar, el jugador va a la taquilla (se pone el casco) y luego a la esclusa: despresurización de 2 s, se abre la escotilla y baja la rampa en 2,5 s con la cámara siguiéndolo. Recupera el control en (0, 67).

**Primera visita y repeticiones:**

| Situación | Flujo |
|---|---|
| Primera visita | Guiada: puestos en orden 1 → 4, solo se ilumina el siguiente |
| Hay un diseño previo; el menú ofrece «Salir con el mismo traje» | Aparición directa en (0, 67) y diálogo de una línea |
| «Ajustar traje» | Aparición junto a la mesa, con todo libre |
| «Rediseñar» tras un informe | Aparición frente al puesto causante del fallo: batería si fue energía, instrumentos si faltaba uno, antena si se perdió el enlace |

Para volver a entrar en el módulo durante la salida, se pulsa E al pie de la rampa, pero **solo** después de completar la misión o tras un repliegue. Así la batería no se recarga gratis.

## 4. Introducción y barra superior

**Barra superior (solo en el interior), de izquierda a derecha:**

`[▮ Batería —] [▲ Propulsor —] [≋ Enlace —] [◆ Instr. ○○○] │ Masa 0/28 kg ▬ │ Energía libre — │ Objetivos ○○○○`

- **Ranuras de pieza:** atenuadas con «—» hasta visitar su puesto. Después muestran el nombre corto y el dato clave (100 u., 2 toberas, 100 m, iconos llenos).
- **Masa:** aparece al confirmar la primera pieza. Se pone coral si pasa de 28 kg.
- **Energía libre** (capacidad − objetivos − reserva, en u. y minutos): aparece al confirmar la batería.
- **Objetivos:** aparece en el puesto 4. Es un círculo por objetivo obligatorio: cian si está cubierto, coral si es imposible. El nombre del objetivo solo se ve al pasar el cursor.

Lo que queda oculto hasta que hace falta:

- Altura de salto: solo en el puesto 2.
- Alcance del enlace: solo en el puesto 3.
- El informe completo: solo en la mesa.

**Los tres primeros minutos:**

| Tiempo | Qué ocurre | Texto en pantalla |
|---|---|---|
| 0:00 | Fundido desde la cabina oscura; las luces se encienden de una en una. LUMA duerme. | Solo «WASD moverse» |
| 0:08 | CONTROL dice una línea: «Relé del pico en silencio. Prepara el traje.» Se ilumina el anillo del puesto 1. | «E usar» |
| 0:20 | Batería: LUMA despierta y salta hasta el puesto. El panel muestra 3 cilindros. | Una línea por opción |
| 0:45 | Propulsor: se ve la mochila nueva en el maniquí. | «Doble salto: ~5 m» |
| 1:05 | Antena: la mesa holográfica dibuja el radio del enlace en el mapa. | |
| 1:25 | Instrumentos: las chinchetas se vuelven cian o rojas. | «Sin taladro, la caché queda imposible.» |
| 1:50 | Taquilla y esclusa. | — |
| 2:05 | Bajada por la rampa y el título «ZONA DE ALUNIZAJE». | |
| 2:20 | LUMA corre hacia el refugio: la línea existente de «marcas». | |
| 2:40 | Primer eco sobre el techo del módulo, visible desde la rampa. | Toast «Doble salto» |

## 5. Coleccionables y contenido secundario

**Regla de historia:** el botín son páginas del diario de la tripulación de Aurora escritas durante su estancia lunar. Hablan de rutinas, de cuidados y de la hermana manteniendo el relé. **No mencionan a LUMA** (aún no lo habían encontrado), ni destinos posteriores, ni el registro de campo, que es la prueba AUR-E03 del objetivo principal. Recogido ≠ validado: las páginas no son pruebas.

**Ruinas** (interiores con la misma tecnología `InteriorCell`, oscuras y alumbradas solo por la lámpara del casco con un cono `SpotLight` local):

- **R1. Refugio sepultado**
  - Dónde: cúpula medio enterrada en el cuenco (−46, −24), de r 7 y 1,4 m de hondo. Escotilla en el lado este, en (−41, −24).
  - Cómo se entra: abrir la esclusa por manivela cuesta 2 u.
  - Interior: 3×4 m.
  - Botín: página 1 del diario y la opción de traje **Forro térmico** (2 kg; frío en sombra ×0,5). Se basa en el aislamiento multicapa real.
- **R2. Tubo de la grieta**
  - Dónde: la boca está en la pared norte de la grieta, en (−24, −63), frente al suelo a −11,7 m. Se llega rodeando por los extremos, sin necesidad de saltar.
  - Interior: 4×8 m.
  - Botín: página 2 y el parche cosmético «Grieta».
  - Tarjeta: los tubos de lava lunares como refugio, según el LRO en Marius Hills.
- **R3. Antena caída**
  - Dónde: un plato de 6 m volcado en (78, 20), con una caseta debajo y la entrada en (75, 22).
  - Botín: página 3 y la opción **Panel solar de muñeca** (3 kg; +0,05 u./s parado al sol, 0 en sombra).

Las opciones nuevas van en una cuarta ranura, `accessories`, con un máximo de 1 y su masa incluida. **No son necesarias**: las dos propuestas siguen siendo viables sin ellas.

**Coleccionables, cuatro tipos:**

- **8 ecos ámbar.** Los que ya existen.
- **3 páginas rosas.** Una en cada ruina.
- **6 rocas del atlas en menta** (implementado el 15-nov: `src/levels/moon/atlas.ts`, se cataloga con `E`). Se escanean con la cámara a 1 u. cada una y dan una tarjeta con su fuente:
  1. Anortosita, en (−10, 18).
  2. Brecha, en (−38,5; −24).
  3. Perlas de vidrio naranja, en (34, 46). Es el «suelo naranja» del Apollo 17.
  4. Basalto, en (50, −66).
  5. Escarcha, en (52, −14). Se basa en el hielo de agua en sombra permanente confirmado por LCROSS.
  6. Roca con microimpactos, en (−77, −2): al pie oeste de la cresta. Se movió de (−68, 2) porque allí solo se llegaba saltando.
- **3 parches de misión.** Cosméticos para el traje.

**Misiones secundarias.** Empiezan solo al tocar su objeto disparador.

- **S1. Red sísmica**
  - Se recogen 3 geófonos de la caja de carga en (4, 80) y se plantan en (−24, 46), (40, 10) y (−34, −8), a 3 u. cada uno.
  - Recompensa: el parche «Sismo» y una tarjeta sobre los sismos superficiales registrados por los sismómetros del Apollo.
  - En partidas siguientes hay un sismo cosmético de 1 s: la cámara tiembla y cae polvo de las columnas.
- **S2. Balizas de Aurora**
  - 4 postes apagados entre el módulo y R1: (−12, 60), (−24, 40), (−34, 18) y (−40, −8). Repararlos cuesta 2 u. (1 u. con kit).
  - Recompensa: el camino queda iluminado para siempre (solo visual), el parche «Faro» y una pista hacia R1.
- **S3. Atlas completo** (6/6)
  - Recompensa: la variante de color del traje «Anortosita», con el cuerpo `#fbf8ff` y la franja `#9dffc8`.

**Compromiso de energía.** Con la batería estándar quedan 58 u. libres, unos 6 minutos caminando. Hacerlo todo (S1 9 u., S2 8 u., R1 2 u., atlas 6 u. y los desvíos) no cabe en una sola salida. Lo recogido **se guarda al momento** aunque haya repliegue, de modo que repetir rinde. En el módulo, la mesa holográfica muestra el coste estimado de cada secundaria activa.

**HUD exterior:**

- Arriba a la izquierda, una sola línea con el siguiente objetivo principal.
- Debajo, iconos de contador: ◆ 2/8 · ▲ 1/6 · ■ 0/3.
- Una línea rosa con la secundaria activa: solo una a la vez y solo mientras está activa.
- Se elimina la lista completa de objetivos y el panel RENDER pasa a `?debug`.

**Peligros suaves:**

- **Frío en sombra:** el que ya existe. Es real: el LRO Diviner midió unos 40 K en los cráteres en sombra permanente. Se añade escarcha en el visor.
- **Regolito suelto** en el fondo de los cuencos: velocidad ×0,8, huella más honda y doble de polvo. Es un hecho real presentado de forma simplificada.
- **Lluvia de micrometeoritos (FICCIÓN):** el flujo real es constante e invisible.
  - Solo aparece en las repeticiones, una vez por salida, en el minuto 4.
  - CONTROL avisa con 10 s de antelación y la lluvia dura 15 s.
  - Estar a la intemperie gasta 0,5 u./s, unas 7,5 u. como máximo.
  - Sirven de refugio el módulo, el refugio, las ruinas y el lado sombreado de las columnas en un radio de 2 m.
  - La interfaz lo marca como ficción.

## 6. Ambiente: partículas

Todas son `Points` animados en el shader con un uniforme de tiempo y posición en módulo: no se sube ningún búfer por cuadro.

| Sistema | Dónde | Cantidad | Color | Llamadas de dibujo |
|---|---|---|---|---|
| Polvo levitado | Caja de 40 m alrededor del jugador; sube a 0,05 m/s. Real pero estilizado: el resplandor del Apollo 17. | 300 | `#f6e9ff`, α 0,35, 2 px | 1 |
| Destellos de vidrio | Zonas con luz, parpadean | 60 | `#fff3d6` | 1 |
| Escarcha | Zona en sombra, cae a 0,2 m/s (ficción) | 120 | `#bfe9ff` | 1 |
| Polvo en el cono de la lámpara | Interiores | 80 | `#ffe3a3` | 1 por celda |
| Toberas | Ráfaga al hacer doble salto | 24 | `#ffffff` → `#7fe3e0` | Reutiliza el polvo |
| Paquetes de datos del relé | Tras repararlo, suben por el mástil | 20 | `#7fe3e0` | 1 |
| Tu nave en órbita | Un punto que cruza el cielo cada 90 s | 1 | `#ffe3a3` | 0 (dentro de las estrellas) |

Sin estelas de meteoritos: sin atmósfera no hay estelas, y es un punto educativo.

**Presupuesto:** ≤ 6 llamadas de dibujo y ≤ 600 puntos más; en calidad baja, la mitad.

## 7. Orden de implementación (unas 1,5 h cada bloque)

1. **Paleta y traje.**
   - Tokens del bioma Nácar en `palette`/`colors`.
   - Sombra teñida en `toon()`.
   - Domo de cielo con degradado y niebla.
   - Nuevo `buildAstronaut` con medidor de batería y piezas visibles según el diseño.
   - Polvo levitado.
   - Capturas de antes y después.
2. **Módulo e introducción.**
   - Exterior nuevo.
   - `InteriorCell` con los 4 puestos, la mesa, la taquilla y la esclusa.
   - Barra superior por pasos.
   - Salida por la rampa.
   - Flujo de repetición y rediseño.
   - Sustituye la consola de dos paneles.
3. **Botín y coleccionables.**
   - Contrato `level-v2`: `ruins`, `scanRocks`, `pages`.
   - R1–R3 reutilizando `InteriorCell`.
   - Ranura `accessories` con pruebas de que las propuestas siguen siendo viables.
   - Atlas de rocas.
   - HUD compacto.
   - Guardado al momento.
4. **Secundarias, peligros y pulido.**
   - S1–S3.
   - Regolito suelto, escarcha y micrometeoritos.
   - El resto de partículas.
   - Ampliar `checkLevel`: ruinas y geófonos alcanzables a pie.
   - Actualizar el ADR, NIVELES, MECANICAS, LOGROS, GUIA-VISUAL-3D, ESTADO-ACTUAL y la bitácora.
