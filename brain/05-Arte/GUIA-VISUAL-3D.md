---
id: guia-visual-3d
type: arte
status: aplicada-en-luna
updated: 2026-11-14
tags: [orbita, arte, 3d, rendimiento]
---
# Guía visual 3D

Aspecto del juego 3D: 80 % de las referencias de mundo pequeño y cel-shading, 20 % de la interfaz de terminal ([tandas](../06-Produccion/TANDAS.md)). Todo se genera por código: no hay modelos, texturas ni licencias de terceros. Tipografía en [tipografía](TIPOGRAFIA.md).

## Reglas

1. **Luz pintada en tres tonos.** Luz, medio tono y sombra azulada, con un borde corto entre bandas, como una pincelada. No se usan degradados largos.
2. **Tinta.** Contorno oscuro (`#151a24`) en personajes, props, rocas y ecos. El terreno marca con tinta los cambios bruscos de pendiente. Se probó un tramado de tinta en las sombras y se descartó porque se leía como una cuadrícula o como lluvia.
3. **Sombras sin coste por cuadro.**
   - Terreno: las sombras del sol, las cavidades y las crestas se calculan una vez al cargar y se guardan en los colores de los vértices.
   - Personajes: una sombra de contacto que encoge con la altura del salto.
   - No hay mapas de sombras en tiempo real.
4. **Un acento por función.**
   - Cian: interfaz y objetivos pendientes.
   - Ámbar: avisos, objetivos completados, LUMA y ecos.
   - Dorado: el módulo de aterrizaje.
5. **Formas legibles a distancia.** El mástil del relé y los haces de los objetivos se ven desde todo el cráter.

## Paleta

| Uso | Color |
| --- | --- |
| Suelo con luz / medio / sombra | `#cfc9bc` / `#8e8c90` / `#3a4152` |
| Tinta | `#151a24` |
| Traje / sombra del traje / acento | `#ece8de` / `#c9c3b4` / `#ff9d4d` |
| LUMA / núcleo | `#ffb05c` / `#fff2c4` |
| Interfaz | fondo `#0b0f14`, texto `#d7dee6`, cian `#7fe3e0`, ámbar `#ffaf68` |

## Piezas y dónde están

| Pieza | Archivo | Técnica |
| --- | --- | --- |
| Materiales toon, contorno y texturas | [style.ts](../../src/engine/style.ts) | Rampa de 3 tonos con `NearestFilter`. El contorno es un casco invertido que desplaza cada vértice en el shader y vale también para mallas instanciadas. Las texturas (tela del traje con costuras y parche, visor con reflejo del horizonte, lámina dorada, paneles con remaches y rótulos, glifos de LUMA, huella de bota, Tierra, halo del sol) se dibujan en canvas. |
| Shader del terreno | `terrainMaterial` en style.ts | Sobre la luz horneada añade, píxel a píxel, ruido en varias escalas sin mosaico visible, microcráteres irregulares con borde iluminado y estratos de roca en las pendientes. El detalle se desvanece con la distancia y la calidad baja usa 3 octavas en lugar de 4. |
| Astronauta, LUMA y props | [models.ts](../../src/engine/models.ts) | Primitivas con contorno. Astronauta: rodilleras y coderas, puños y correas naranjas, botas con suela, cinturón, panel de pecho con luces que parpadean, mochila con rejillas y tanque, antena que se balancea, casco con visor, aro y lámparas. Animación de paso y de salto. LUMA: cubo redondeado, ojos que parpadean, mejillas, banda de traductor con glifos que se desplazan, núcleo que late y motas que orbitan. |
| Terreno, rocas, polvo, huellas y cielo | [world-view.ts](../../src/engine/world-view.ts) | Luz y sombras horneadas en colores de vértice. Hasta 320 rocas en una sola llamada de dibujo (instanciadas). Huellas de bota en un búfer circular de 480. Polvo reutilizable (192 motas; un soplo en cada paso desde calidad media) con gravedad lunar real. Franja tenue de la Vía Láctea en un domo, halo del sol y Tierra iluminada por el mismo sol. |
| Grano y viñeta | `.film` en ui.css | Capa CSS con ruido SVG y viñeta radial: sin coste de GPU. |
| Posproceso | [post.ts](../../src/engine/post.ts) | Media y alta: resplandor sobre todo lo que brilla, viñeta y corrimiento de color al hacer dash. Alta: rayos hacia el Sol (marcados en Marte, estela tenue en el vacío) y profundidad de campo en la toma de llegada. Baja: sin posproceso. Ajuste «efectos de imagen». |
| Efectos breves | [fx.ts](../../src/engine/fx.ts) | Rastro de LUMA (cristales instanciados que se encienden a su paso), halo cálido de su brillo en el frío, anillos de escáner (R), de aterrizaje y del módulo al posarse. |
| Cámaras | [cinematic.ts](../../src/engine/cinematic.ts), game.ts | Toma de llegada con barras y título; dash que abre el campo de visión; sacudida corta en aterrizajes duros; vista de casco con visor y lectura proyectada; modo foto. Con «reducir movimiento» no hay toma, ni sacudida, ni cambio de campo de visión. |
| Visor de casco | [src/ui/visor/](../../src/ui/visor/helmet.tsx) | Todo dibujado por código, sin imágenes. Marco oscuro con junta, pespuntes y tornillos; cristal con tinte frío, banda solar, reflejo y arañazos finos; vaho que late con la batería baja. Proyección en cian `#7fe3e0` con avisos en ámbar `#ffaf68`; cada trazo lleva un contratrazo oscuro para leerse sobre regolito claro. Grupo inferior: medidor de arco, barras de enlace, radar con barrido, cara de LUMA (ranura vacía y punteada cuando ya no está) y reloj. |

## Aspecto realista (15 de noviembre)

Desde el 15-nov-2026 el aspecto por defecto en calidad media y alta es el **realista**; el ilustrado descrito arriba sigue disponible en Ajustes → Aspecto y es el único en calidad baja. Reglas del realista:

1. Sin contornos de tinta ni bandas: materiales físicos (`surface()`), un Sol duro y sombras reales.
2. La sombra en mundos sin aire es oscura: solo la rellenan el rebote del suelo y la luz de la Tierra. No añadir luces de relleno de color.
3. El brillo es escaso: solo emisores (lámparas 2–4, núcleo de LUMA 4–6, haces ≤ 1,5, en radiancia de escena) y el Sol.
4. Las pistas de juego (haces de objetivo, balizas, rocas del atlas, rastro de LUMA) se leen por emisión, no por tinta.
5. Los colores del suelo son albedos medidos, no la paleta pastel. Ver [fuentes](../04-Ciencia/FUENTES.md#aspecto-realista-15-nov-2026).

Detalle técnico en [ADR-006](../03-Arquitectura/ADR/ADR-006.md).

## Presupuesto medido (render por software, 1280×720)

- 90–150 llamadas de dibujo y unos 165 000 triángulos en la Luna.
- Código del juego: 19 KB gzip + 10 KB de interfaz. three.js: unos 133 KB gzip. Sin archivos de arte que descargar, salvo los 70 KB de la tipografía.
- Pendiente: medir fps en Iris Xe. Los niveles de calidad reducen las rocas (50 % en bajo) y el número de píxeles.
