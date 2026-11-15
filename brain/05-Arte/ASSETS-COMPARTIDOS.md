---
id: assets-compartidos
type: guia
status: kit-v1
updated: 2026-11-14
tags: [orbita, arte, kit, produccion]
---
# Catálogo de assets compartidos

Los 20 PNG originales están en `public/art` y sus metadatos en el [manifiesto](../../src/legacy/art-manifest.json). Se usan ya en el juego local. El generador editable [export_art.py](../../tools/export_art.py) produce los PNG de forma determinista; ejecuta `python tools/export_art.py` con Pillow si cambias el arte común. Los PNG están incluidos y no se necesita Python para jugar. Recursos originales bajo CC BY 4.0; ver [licencia](../../LICENSE-CONTENT.md).

| Asset | Medida y secuencia | Uso |
| --- | --- | --- |
| Astronauta | Ficha de 32 × 40 px, hoja 128 × 160, anclaje (0.5, 0.875). | Mismo traje y escala en todos los mapas. |
| LUMA de Órbita, Luna, Marte, Bennu | 24 × 24 px por ficha, cuatro hojas de 96 × 96, anclaje (0.5, 0.875). | Misma anatomía, distintas paletas. Los cambios de postura y el arco completo requieren animación narrativa posterior. |
| Terreno de los cuatro destinos | Diamante base 48 × 24 px; ficha 48 × 28 con borde inferior y 4 variantes. | Profundidad desde el centro del diamante y grilla lógica común. |
| Hábitat, relé, caché, consola, baliza y lanzadera | PNG transparentes; medidas y origen en el manifiesto. | Reutilizar carcasas del mismo programa espacial. La lanzadera es un recurso visual listo para composición, sin pilotaje en el kit. |
| Rocas locales | 35 × 28 px por destino, anclaje (0.5, 0.89). | Cambiar textura y silueta secundaria sin tocar la escala de las colisiones. |
| Señales | 22 × 22 px cada icono. Orden: escaneo, recuperación, reparación, envío, completado. | Forma y texto además de color. |

Las hojas de personajes ordenan filas SE, SO, NO, NE y cuatro cuadros por fila. El cuadro 0 es reposo y 0–3 forman el paso del kit. La luz principal cae desde arriba a la izquierda; preservar las sombras bajo los pies y ordenar objetos por su casilla de apoyo. La cámara interna usa 960 × 540 y proyección común de semiejes 24/12. La escena ajusta zoom para encuadrar el mapa; un destino no altera la escala de un actor respecto a cada casilla. Exportar RGBA y conservar contornos nítidos. La casilla lógica ocupa una unidad.

## Paletas y señales

- Equipo humano: contorno #101521, estructura #293547, placas #EDEBE0, frentes #426F8B, señal #FFAF68.
- Interfaz común: fondo #0B1019, panel #111926, texto #E8EDF5, interacción #A4EADF, reserva #F2CF92. El estado tiene icono y etiqueta; no depende solo del color.
- Terreno: Órbita #313B52, Luna #5E617C, Marte #8D4C45, Bennu #494550. La base ambiental puede variar en cada mapa sin alterar el contraste de señales.
- LUMA: #FFEAA7 → #F1A246 → #C45A43 → #D9EEFF. La paleta de las muestras identifica visualmente el capítulo; no implementa el deterioro ni la muerte en campaña.

## Ampliación

Conservar la fuente, licencia, tamaño, origen, hecho/ficción y destino. Cada propuesta respeta la escala de referencia, la luz y el anclaje inferido, e incluye una captura junto al astronauta en vista de campo. Se puede producir un objeto nuevo, pero no una segunda versión de astronauta, consola o interfaz sin acordar un cambio común. Evitar suavizado y márgenes distintos al exportar hojas. La aprobación de actores o terrenos nuevos exige revisar al menos recorrido, oclusión y legibilidad con la Luna.

La primera versión no incluye banda sonora ni voz del traductor. La ampliación de audio sigue [animación y audio](ANIMACIONES-Y-AUDIO.md): señales con subtítulos y pista separada por tipo. No introducir un sonido obligatorio para completar un objetivo.
