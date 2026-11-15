---
id: fuentes
type: bibliografia
status: inicial
updated: 2026-10-14
tags: [orbita, fuentes]
---
# Fuentes y catálogo previsto

| ID | Fuente | Uso previsto | Estado |
| --- | --- | --- | --- |
| NASA-FAQ-2026 | [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/) | Fechas y condiciones de participación. | Revisado 2026-10-14. |
| NASA-CHALLENGE-2026 | [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/) | Requisitos del reto. | Texto aportado por el propietario contrastado el 14 de noviembre. |
| NASA-C1-MISSION-DESIGN | [Design and Develop Science Missions](https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf#page=8) | Ciclo y segmentos de misión para el planificador orbital. | Referencia cualitativa integrada en C1. |
| NASA-C1-LEO | [Observing our Planet from Low Earth Orbit](https://www.nasa.gov/missions/station/iss-research/observing-our-planet-from-low-earth-orbit/) | Altitud aproximada de 400 km y periodo de unos 90 min de la ISS. | Valores de referencia en [science.ts](../../src/core/orbit/science.ts); pasadas y límites del juego simplificados. |
| NASA-C1-RENDEZVOUS | [Relative Navigation System](https://www.nasa.gov/isam/relative-navigation-system/) | Posición y velocidad relativas en el acercamiento. | Referencia de control local; tolerancias del juego. |
| NASA-C1-EVA | [Dark Sky, Bright Sun](https://science.nasa.gov/missions/hubble/dark-sky-bright-sun/) | Contraste de luz y sombra durante la EVA. | Fuente en el punto de observación; escenario ficticio. |
| NASA-MOON | [Moon Facts](https://science.nasa.gov/moon/facts/) | Contexto físico lunar. En el menú 3D: gravedad 1/6 de la terrestre, día hasta 127 °C y noche hasta −173 °C, exosfera no respirable. | Verificado el 14 de noviembre de 2026. La gravedad de juego es estilizada y la interfaz lo declara. |
| PDS-LOLA | [LRO LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) | Topografía lunar. | Catálogo identificado; ningún producto incorporado. |
| PDS-MOLA | [Mars Global Surveyor / MOLA](https://pds-geosciences.wustl.edu/missions/mgs/mola.html) | Topografía marciana. | Candidato; validar producto al usarlo. |
| JPL-HORIZONS | [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Efemérides y distancias. | Documentación consultada; no datos integrados. |
| NASA-STELLAR | [Vida de una estrella similar al Sol](https://science.nasa.gov/resource/the-life-cycle-of-a-sun-like-star-annotated/) | Metáfora visual de LUMA. | Consultado 2026-10-14. |
| NASA-SUN-COLOR | [SVS, Dynamic Earth](https://svs.gsfc.nasa.gov/4469) | Color visible y tinte artístico. | Consultado 2026-10-14. |
| NASA-BENNU | [Bennu](https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/) | Contacto, terreno y ausencia de atmósfera. | Consultado 2026-10-14; ningún dataset integrado. |
| NASA-FLIGHT | [Gravedad y mecánica](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-2/) | Fundamentos de vuelo. | Consultado 2026-10-14. |
| PHASER | [Versiones](https://phaser.io/download/phaser4) y [mapas](https://docs.phaser.io/phaser-editor/scene-editor/game-objects/tilemap-object) | Base técnica del motor. | Verificación inicial 2026-10-11. |
| VERCEL-AI | [AI Gateway Pricing](https://vercel.com/docs/ai-gateway/pricing) | Condiciones de uso gratuito. | Revisar de nuevo antes de activar. |

## Ficha de cada producto utilizado

ID interno; título; institución y autor; URL del producto concreto; versión; fecha de consulta; cuerpo o región; unidades; resolución; licencia o condiciones; recorte y transformaciones; limitaciones; ubicación del archivo derivado.

Una página de catálogo no sustituye la ficha del producto que termine utilizando el juego.

Las fuentes de reseñas están en [investigación](../01-Producto/INVESTIGACION-JUEGOS.md); no son fuentes científicas para parametrizar la simulación.

## Pantalla «Ciencia: modelo y realidad» (15-nov-2026)

El menú incluye una pantalla que pone cada mecánica junto al dato de la NASA en que se apoya, con la etiqueta observación, simplificación o ficción. Los datos están en [science.ts](../../src/levels/science.ts). Cada cifra se leyó en su página el 15 de noviembre:

| Dato | Página |
| --- | --- |
| Luna 1,62 m/s² (0,165 g) | [NSSDCA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) |
| Marte 3,73 m/s² de media (0,380 g), CO₂ 95,1 %, 6,36 mbar | [NSSDCA Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) |
| Luna +127 °C / −173 °C; hielo en cráteres polares en sombra | [NASA Moon Facts](https://science.nasa.gov/moon/facts/) |
| Tormentas de polvo que cubren gran parte de Marte | [NASA Mars Facts](https://science.nasa.gov/mars/facts/) |
| Bennu: medio kilómetro, 4,3 h, sin atmósfera, partículas expulsadas, 121,6 g traídos por OSIRIS-REx | [NASA Bennu Facts](https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/) |
| EVA −250 … 250 °F, refrigeración por agua, la mochila da electricidad y oxígeno | [NASA Spacewalk Spacesuit Basics](https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/) |
| Estación: ~90 min por vuelta, 16 al día, 5 millas/s | [NASA Space Station Facts and Figures](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/) |

Nota: NASA Mars Facts no da la gravedad; el valor 3,71 m/s² del indicador de Marte es el redondeo habitual y la fuente comprobada es la ficha NSSDCA (3,73 de media, 3,69 en el ecuador). La página de la estación tampoco da la altitud de 400 km que usa el menú del capítulo 1.

## Aspecto realista (15-nov-2026)

Valores de `Biome.real` en `src/engine/style.ts`. Consultados el 15-nov-2026.

| Valor en el juego | Dato y fuente | Etiqueta |
| --- | --- | --- |
| Albedo del regolito lunar ≈ 0,12 (`#625f5b`) | Albedo geométrico 0,12 y de Bond 0,11: [NSSDCA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) | observación |
| Sol a 1 ua = 8 unidades del motor (Luna y órbita) | Irradiancia solar 1361,0 W/m²: misma ficha. La unidad «8» es arbitraria | simplificación |
| Sol en Marte = 3,4 (43 % del de la Tierra) | Irradiancia 586,2 W/m², razón 0,431; semieje 1,524 ua: [NSSDCA Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) | observación |
| Albedo de Marte ≈ 0,25 con tinte rojizo (`#a5714e`) | Albedo de Bond 0,250: misma ficha. El tono es una elección de arte | simplificación |
| Sol en Bennu = 6,3 (79 %) | Distancia media 168 millones de km (1,12 ua): [NASA Bennu Facts](https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/); inverso del cuadrado | simplificación |
| Albedo de Bennu ≈ 0,044 (`#3a3a3c`) | Albedo geométrico 0,044 ± 0,002 (Lauretta et al. 2019), leído en la fuente secundaria [Wikipedia: 101955 Bennu](https://en.wikipedia.org/wiki/101955_Bennu) | observación (fuente secundaria) |
| Exposición por destino (0,62–6,5) | Sustituye a la exposición automática de una cámara; sin fuente | ficción técnica |
| Relleno de sombras (rebote × 0,7, luz terrestre) y niebla de Marte | Ajuste a ojo para que la sombra sea jugable; sin medida | simplificación |
| Rocas del atlas con brillo menta | Marca de juego | ficción |
