---
id: niveles-3d
type: diseno
status: luna-en-gris-jugable
updated: 2026-11-14
tags: [orbita, diseno, niveles, 3d]
---
# Niveles 3D

Cómo se diseña un destino del juego 3D y ficha de la Luna, el primer nivel jugable. La decisión técnica está en [ADR 006](../03-Arquitectura/ADR/ADR-006.md); el avance en [tandas](../06-Produccion/TANDAS.md).

## Qué es un nivel

Un nivel es un archivo de datos (`src/levels/<id>/level.ts`) más una función de alturas (`terrain.ts`). El motor común pone cámara, movimiento, interfaz, enlace y guardado. Un nivel **no** programa controles, menús ni reglas de misión.

El contrato está en [level-v2.ts](../../src/core/contract/level-v2.ts):

| Campo | Para qué sirve |
| --- | --- |
| `terrain.height(x, z)` | Forma del suelo en metros. x crece al este, z al sur. Debe ser determinista. |
| `terrain.size`, `res` | Lado del terreno y resolución de la malla (Luna: 256 m, 257 vértices). |
| `sun` | Azimut y elevación; la luz y las sombras del suelo se calculan una vez al cargar. |
| `spawn` | Punto de aparición y de regreso tras un repliegue. |
| `comms` | Centro, radio con señal plena y franja de caída. Es el límite del mapa: fuera de él LUMA repliega al jugador. |
| `zones` | Regiones con nombre; al entrar aparece su título. |
| `points` | Objetivos: mismas reglas que el kit v1 (`prerequisites`, `power`, `required`, una sola salida `upload`) con posición en metros y radio de interacción. |
| `props` | Volúmenes sólidos (`box` o `cylinder`) con altura de techo: se puede subir encima o chocar con ellos. |
| `collectibles` | Ecos opcionales; con `y` quedan en el aire o sobre un sólido. |

## Reglas de diseño

1. **Todo lo obligatorio se alcanza a pie.** `checkLevel` recorre el terreno sin saltar desde el inicio; falla si un objetivo obligatorio queda aislado. Así una misión diseñada sin propulsor siempre se puede terminar.
2. **El movimiento abre atajos, no candados.** Doble salto y dash acortan rutas o llevan a ecos opcionales.
3. **Sin paredes invisibles.** Los límites son pendientes de más de 40° (el jugador resbala) y la caída del enlace.
4. **Un hito visible desde todas partes.** En la Luna, el mástil del relé con su luz.
5. **Desde cada objetivo se ve el siguiente hito**, no el camino.
6. **Ficción y modelo separados.** La gravedad de juego es estilizada; la interfaz muestra la real.

Comprobación: `pnpm test` ejecuta `checkLevel` sobre cada nivel registrado en las pruebas.

## Movimiento de referencia

Valores en [movement.ts](../../src/core/movement.ts); se ajustan en vivo con `?debug` (panel MOVIMIENTO) y se guardan en el navegador.

| Acción | Valor | Alcance práctico |
| --- | --- | --- |
| Salto | 5,5 m/s, gravedad 5 subiendo / 8 bajando | ~3 m de altura, ~12 m de distancia corriendo |
| Doble salto | 4,5 m/s, uno en el aire | ~5 m de altura total |
| Dash | 16 m/s durante 0,18 s, uno en el aire, recarga 0,8 s | cruza ~16 m en salto |
| Pendiente máxima | 40° | más inclinado resbala |

## Ficha: Luna en gris

| Zona | Posición | Objetivo | Cómo se llega |
| --- | --- | --- | --- |
| Zona de alunizaje | sur (0, 72) | Terminal de retorno (salida) y Refugio (opcional) | Inicio |
| Pico del relé | centro (0, 0) | Relé averiado | Rampa al suroeste a pie; acantilado de 4 m por doble salto |
| Cresta oeste | (−62, 8) | Mirador (opcional) | Dos escalones de 2,4 m: salto simple |
| Cráter en sombra | (58, −8) | Muestra de regolito | A pie, bajando al cuenco |
| La grieta | z = −56 | — | 16 m de ancho y 12 de hondo: salto + dash o rodeo por los extremos |
| Archivo norte | (0, −80) | Caché de Aurora | Tras la grieta |

Ocho ecos: techo del módulo, dos columnas, dos rocas grandes, cima del pico, cresta y fondo de la grieta. El borde del cráter (radio 95–112 m) supera los 40°; el enlace cae entre 100 y 120 m del centro.

Los textos y reglas de los seis objetivos vienen del mundo lunar v1 ([moon.ts](../../src/core/worlds/moon.ts)): la versión 2D y la 3D describen la misma misión.

## Ficha: Estación (capítulo 1)

Primer nivel del juego (`/`). Cubiertas sobre el vacío con botas magnéticas; detalle en [Estación «Quirófano azul»](ESTACION-QUIROFANO.md).

| Zona | Posición | Objetivo | Cómo se llega |
| --- | --- | --- | --- |
| Puerto de acople | sur (0, 62) | Suministros, medición de luz y esclusa (salida) | Inicio |
| Cuna de recepción | (−36, 37) | Cápsula, compartimento (aparece LUMA), traductor | Pasarela oeste |
| Armadura al sol | (0, −15) | — | Directo; gasta refrigeración |
| Baranda en sombra | x ≈ −37 | — | Largo, balizado, sin gasto |
| Brazo de antena | (0, −85) | Registrador exterior | Por cualquiera de las dos rutas |

Campos del contrato usados aquí: `companionAfter` (LUMA se une tras un punto), `fallLimit` (el cable de seguridad recoge al jugador por debajo de esa altura) y la zona `hazard: 'sun'`.

## Ficha: Marte

Valle de Aurora, capítulo 3: hábitat, valle, relé y contingencia de polvo. Coordenadas, misión, paleta y fuentes en [Marte «Terracota»](MARTE-TERRACOTA.md).

| Zona | Posición | Objetivo | Cómo se llega |
| --- | --- | --- | --- |
| Campamento de Aurora | sur (−8, 62) | Hábitat, bitácora y terminal (salida) | Inicio |
| Cauce seco | z ≈ 22 | — | 7 m de hondo: salto y dash por el centro, o vados balizados en x ≈ ±60 |
| Campo de dunas | (−4, −16) | — | A pie; gasta batería y mucho más tras reparar el relé |
| Meseta estratificada | (52, −8) | Afloramiento al pie; mirador (opcional) arriba | Rampa suroeste o doble salto |
| Colina del relé | (−52, −34) | Relé del valle | A pie |
| Cabecera del valle | (6, −80) | Equipo de campo | A pie |

Una zona puede tener `hazard` (`cold` o `dust`) y `surge` (contingencia: gasto mayor desde que se completa un punto). `checkLevel` comprueba que el punto de la contingencia exista.

## Ficha: Bennu

Refugio de Aurora, capítulo 4 (C4-M02 y M03). Diseño completo en [Bennu «Carbono»](BENNU-CARBONO.md).

| Zona | Posición | Objetivo | Cómo se llega |
| --- | --- | --- | --- |
| Punto de contacto | sur (0, 64) | Anclaje y enlace de voz | Inicio |
| El gran bloque | centro (0, 6) | Mirador (opcional) arriba | Ladera de cascotes del suroeste |
| Cara diurna | (62, 22) | — | A pie; el sol gasta batería |
| Campo de bloques | (44, −24) | Acceso este | A pie, terreno irregular |
| Cresta de grava | (−46, −20) | Acceso oeste | A pie; postes iluminados |
| Hondonada del refugio | norte (0, −72) | Archivo, muestra y refugio (salida) | A pie |

Campos nuevos del contrato: `movement` (microgravedad estilizada) y `tether` (la línea de anclaje sujeta al jugador a 6 m del suelo).

## Pendiente

- Energía, traje y consola de diseño (tanda 2): hoy los objetivos solo exigen sus requisitos.
- Frío del cráter en sombra y coste de dash y propulsor.
- Medir el rendimiento real en Iris Xe con `?debug`.
