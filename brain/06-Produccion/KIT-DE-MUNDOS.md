---
id: kit-de-mundos
type: guia
status: base-local-v1
updated: 2026-11-14
tags: [orbita, mundos, produccion, integracion]
---
# Kit de mundos v1 — guía para el equipo

Todos los destinos se juegan dentro de Órbita. El responsable de un mundo entrega su terreno, sus lugares de interés y la lógica de su misión en el contrato común. La base compartida dibuja la interfaz, mueve al astronauta y a LUMA, comprueba los objetivos y emite el informe. Si la misión necesita una operación nueva, se añade al motor común con una prueba y después se usa desde el mapa.

## Punto de partida

1. Desde la raíz, instala Node 24 y pnpm 12.4.1 si no los tienes. Ejecuta `pnpm install --frozen-lockfile` y `pnpm dev`. Abre la URL local que imprime Vite.
2. Prueba **Luna → Iniciar expedición**. Usa WASD o flechas, clic en terreno o selecciona objetivos en el diario para acercarte. Usa E o **Interactuar**, y R para escaneos cercanos.
3. Intenta entregar al inicio. El juego debe explicar qué falta. Registra la muestra de regolito, recupera la caché y restablece el relé. Vuelve a la terminal y verifica el informe. El refugio y el mirador se pueden omitir.
4. Prueba **Órbita, Marte y Bennu**: son escenarios de integración con el mismo motor, no capítulos jugables de la campaña. Su progreso se guarda por separado. Sirven para probar el aspecto y el recorrido sin revelar el desenlace.

El kit implementa un recorrido local de superficie. El crucero, el pilotaje orbital, el rescate completo, la progresión entre capítulos y el epílogo siguen en las fichas de campaña. La Luna de referencia transmite un registro parcial: no confirma Marte o Bennu ni valida todo AUR-E03.

## Reparto propuesto y archivos

| Encargo | Trabaja en | Entrega al integrador |
| --- | --- | --- |
| Base común | `src/kit/`, `src/main.tsx`, `src/style.css`, `public/art/`, registro `src/worlds/index.ts` | Versión del contrato, cámara, controles, HUD, LUMA, guardado, informe, catálogo y pruebas. |
| Órbita / C1 | `src/worlds/orbit.ts`; ficha C1 | Estación y EVA; entrega AUR-E01/AUR-E02 y llegada segura al nodo lunar. Coordinar acople y modo EVA con la base. |
| Luna / C2 | `src/worlds/moon.ts`; ficha C2 | Referencia y ampliación lunar. Diseñar sombra, rutas y relé. Las tres piezas completas se autentican solo en C2-M06. |
| Marte / C3 | `src/worlds/mars.ts`; ficha C3 | Hábitat, valle y relé. Entrega AUR-E04/AUR-E05 y capacidad de rescate desde el nodo marciano. |
| Bennu y Tierra / C4 | `src/worlds/bennu.ts`; ficha C4 | Contacto anclado, evacuación y recepción humana. Coordinar los hitos irreversibles de LUMA y el regreso con integración. |

Un responsable confirmado por tarea; los nombres se acuerdan en PREP-01. Con dos o tres personas, agrupen destinos. Para la hackathon mantengan un único mapa lunar integrado; los cuatro capítulos completos pertenecen a expansión. Nadie necesita duplicar la app para trabajar su parte.

Cada persona abre una rama por mundo, por ejemplo `feat/world-mars`. Las cuatro definiciones ya están separadas. Sustituye únicamente la tuya y deja que el integrador actualice el índice si cambia una ruta o un ID. Los ensayos pequeños pueden usar `trial.ts`; sustituir un ensayo por una misión de campaña requiere coordinación para cambiar la clave del guardado sin mezclar partidas. Los assets específicos nuevos se entregan con nombres prefijados por destino; quien mantiene el catálogo los incorpora. La fuente operativa de tareas sigue en [backlog](BACKLOG.md).

## Cómo empieza y termina un nivel

| Paso común | Qué aparece y quién lo decide |
| --- | --- |
| 1. Planificación | Título, lugar, objetivo y dos cargas en la misma pantalla. Mostrar coste y reserva. Cambiar de carga no ejecuta la misión. |
| 2. Llegada | Tras iniciar, el motor coloca al jugador en la casilla segura y publica el mensaje de llegada. En campaña, si hay un trayecto, navegación confirma primero la aproximación o el acople; el mapa no lo inventa. |
| 3. Operación | Un diario para todos los mundos. Escanear, recuperar, reparar y entregar usan las mismas señales. Activar localmente requiere proximidad, requisitos y energía. Un punto opcional no bloquea los principales. |
| 4. Retorno | La terminal solo admite el envío cuando están los objetivos obligatorios y quedan al menos 2 unidades del kit. Los opcionales no pueden gastar la energía necesaria para completar ese retorno. Una animación, clic lejano o diálogo no concede progreso. En campaña, la salida exige también la llegada de retorno o el manifiesto cuando corresponda. |
| 5. Informe | El motor muestra objetivos, energía usada, reserva y resultado escrito. Registra el hito una sola vez. Tras recargar se conserva el informe; se puede volver a planificar la referencia. |
| 6. Continuidad | La campaña futura valida evidencias y habilita el destino siguiente; el selector actual abre sesiones de ensayo independientes. No se conecta un mundo de prueba a la partida narrativa. |

### Entregas entre capítulos — spoilers de producción

| Mundo | Primera escena y datos recibidos | Última escena y datos entregados |
| --- | --- | --- |
| [Órbita](../02-Diseno/CAPITULOS/C1-PRIMERA-LUZ.md) | C1-M01, preparación en Tierra con aviso de cápsula recuperada. El protagonista todavía no conoce a LUMA. | C1-M06, informe en el nodo lunar tras trayectoria segura y AUR-E01/AUR-E02 confirmadas. Reutilizar la nave y registrar la protección de LUMA para la siguiente salida. |
| [Luna](../02-Diseno/CAPITULOS/C2-BAJO-OTRO-CIELO.md) | C2-M01 empieza en el nodo lunar con la pista de archivo. El equipo de superficie baja solo tras elegir sitio y validar aproximación; LUMA se reconoce por el ámbar. | C2-M06, ascenso y acople tras entregar ciencia, restablecer el relé y autenticar las tres piezas de AUR-E03. El informe revela la escala marciana, sin confirmar supervivientes. |
| [Marte](../02-Diseno/CAPITULOS/C3-EL-MUNDO-ROJO.md) | C3-M01, salida con AUR-E03 y reservas, crucero y llegada marciana; LUMA usa el rojo. El hábitat debe habilitarse antes del valle y el relé. | C3-M06, nodo marciano abastecido y plan de rescate viable. Une AUR-E04/AUR-E05, revela Bennu y la señal fechada de supervivencia, y guarda la capacidad para volver a la Tierra. |
| [Bennu y Tierra](../02-Diseno/CAPITULOS/C4-LO-QUE-QUEDA.md) | C4-M01, salida directa desde Marte con ruta autenticada, plazas y soporte de vida. Aproximación y anclaje; LUMA usa el blanco azulado. | C4-M05 registra el sacrificio una sola vez, después del embarque. C4-M06 confirma en Tierra a todas las personas del manifiesto y AUR-E07, cierra el informe y abre el epílogo sin LUMA vivo. |

La pantalla del informe distingue qué se recogió, qué se validó y qué queda por comprobar. Si un destino se divide en varias regiones, conserva la fase de misión y el flujo común; cruzar un límite de mapa no cierra el capítulo. El equipo de Luna prueba sus tres tareas de campo en cualquier orden; Marte prueba ambas permutaciones de sus salidas. El epílogo no hereda escenas que presupongan que LUMA está vivo.

## Diseño que puede variar

- Espacio, relieve, iluminación ambiental, equipo local, recursos y la decisión principal del destino.
- Diálogos y avisos escritos para lo que el jugador sabe en ese momento. Toda cadena de evidencia sigue [historia](../02-Diseno/HISTORIA-PRINCIPAL.md). La fuente de LUMA está en [su arco](../02-Diseno/ARCO-LUMA-SPOILERS.md).
- Modo de desplazamiento de campaña cuando esté disponible (superficie, vuelo, EVA o anclaje). Nunca simular Bennu como carrera planetaria en la versión final. El escenario de ensayo actual verifica el contrato, no la física de cada destino.

## Cómo entregar un mundo

Parte de [la definición lunar](../../src/worlds/moon.ts) y de la [plantilla](../09-Plantillas/MUNDO.md). Los datos de mapa de esta versión se editan como una cuadrícula lógica en TypeScript; la importación desde Tiled queda para la expansión. Mantén un ID estable por misión de prueba y por objetivo. Dibuja la región con las piezas del [catálogo compartido](../05-Arte/ASSETS-COMPARTIDOS.md). Ejecuta:

~~~text
pnpm test
pnpm build
pnpm test:e2e
~~~

En Windows las pruebas de navegador reutilizan Chrome instalado si está en su ruta habitual. En otro entorno, prepara Chromium con `pnpm exec playwright install chromium`. Registra un recorrido desde el inicio hasta el informe, una entrega temprana rechazada, un caso de recarga y una comparación visual con la Luna. Adjunta capturas o una grabación breve al PR y declara qué sigue siendo de prueba. La revisión final es del integrador; el equipo acuerda antes cualquier cambio en controles, archivos compartidos o contrato.
