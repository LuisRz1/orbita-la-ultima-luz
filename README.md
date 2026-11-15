# Órbita: La última luz

> **NASA Space Apps Challenge 2026 · Space Mission Design Game.** A browser game in 3D where every sortie is a small mission: design the spacesuit under a mass budget, go out and spend a limited battery, read a report that links each decision to its outcome, and redesign. **[English](#for-the-judges) · [Español](#para-el-jurado)**

**Para jugar.** La portada abre los ajustes. Elige idioma, sonido, cámara y gráficos, y pulsa **Jugar Primera luz**. Al cerrar C1 puedes llevar el informe a la campaña desde la elección de alunizaje.

**To play.** Setup opens first. Choose language, sound, camera and graphics, then choose **Play First Light**. After filing the Chapter 1 report you can continue the campaign from lunar landing site selection.

## For the judges

**What it is.** Your sister vanished with the Aurora expedition. With **LUMA**, an alien creature that speaks through a translator, you follow her trail from a station in Earth orbit to the Moon, Mars and the asteroid Bennu, and bring the survivors home. Each destination is a mission you plan and then fly as an EVA (spacewalk) in third person.

**How it answers the challenge.**

| Challenge asks for | In the game |
| --- | --- |
| Design a mission with limited resources | Suit design in the lander: battery, thruster, antenna, instruments and an accessory under a **28 kg** limit. More battery means more time outside but a lower jump; missing an instrument makes an objective impossible. The top bar shows mass, free energy and which objectives the suit can reach before you leave. |
| Simulate and manage it | During the EVA every second and every action draws on the battery: life support, walking, dash, double jump, instruments, cold in shadow, sun on the truss, dust storms on Mars. A **return reserve** can only be spent walking home; leaving radio range triggers a recall. |
| Evaluate: a report that links decisions to results | The **sortie report** has a battery-over-time chart with every objective, hazard and the moment the reserve was hit; a **decision → result** table (each suit part and what it caused); a **comparison with the previous attempt**; and up to three concrete **proposals** (always within the mass limit) you can load with one click. |
| Recoverable failure | Running low is a safe recall, never a game over. The report explains why and you redesign or retry. Attempts are saved in the browser. |
| NASA data, model separated from fiction | Menu → **Science: model and reality**: every mechanic next to the NASA figure it stands on, labelled *observation*, *simplification* or *fiction*, with its source. Rock atlas cards and title cards also cite NASA pages. |
| English and Spanish | The whole interface and LUMA's recorded voice, switchable in Settings. |

**Three-minute tour.** The game starts in your browser language (force it with `?lang=en` or `?lang=es`). Open it with `?demo` (opens every destination without touching saves) or `?level=moon` for the most complete chapter. Controls and HUD help are in the menu (**Controls and help**). Then:

1. **New expedition** → walk to the lit stations (WASD, **E** to use). Try a light suit **without the sample drill**; the top bar marks the cache objective in red.
2. Locker → airlock → explore. Follow the compass ◆; **E** at each lit objective. Watch the battery panel.
3. When the battery reaches the reserve, walk back to the lander (⌂). Read the report: the chart, the orange *instruments* row and the proposal "Carry the sample drill".
4. Click **Try this proposal**, leave again and complete the mission. The new report shows *versus the previous attempt*: what changed in the suit and how the result changed.
5. Menu → **Science: model and reality**.

**Controls.** WASD or arrows to move, mouse to look, Space to jump, Shift to dash, E to interact, V to switch to the helmet, C to centre the camera, F for fullscreen, and Esc to pause. G prompts LUMA to track a nearby objective when available.

**Run it.** Node 24 and pnpm 12.4.1: `pnpm install --frozen-lockfile`, then `pnpm dev` and open the local URL. Checks: `pnpm test` (rules), `pnpm build`, `pnpm test:e2e` (browser walkthroughs; `ORBITA_BROWSER` points to a Chromium build, `ORBITA_PORT` changes the preview port).

**Scope.** Battery, ranges and flight telemetry use educational scenario values. The campaign includes piloted local maneuvers and accelerated cruise, and its length and difficulty still need longer playtests. The 2D prototype is available at /?legacy&world=orbit.

## Para el jurado

**Qué es.** Tu hermana desapareció con la expedición Aurora. Con **LUMA**, una criatura extraterrestre que habla mediante un traductor, sigues su rastro desde una estación en órbita terrestre hasta la Luna, Marte y el asteroide Bennu, y traes a los supervivientes a casa. Cada destino es una misión que planificas y luego ejecutas como una EVA (salida extravehicular) en tercera persona.

**Cómo responde al reto.**

| El reto pide | En el juego |
| --- | --- |
| Diseñar una misión con recursos limitados | Diseño del traje en el módulo: batería, propulsor, antena, instrumentos y un accesorio con un límite de **28 kg**. Más batería da más tiempo fuera pero salta menos; sin el instrumento adecuado un objetivo es imposible. La barra superior muestra masa, energía libre y qué objetivos alcanza el traje antes de salir. |
| Simularla y gestionarla | En la EVA cada segundo y cada acción gastan batería: soporte vital, caminar, dash, doble salto, instrumentos, frío en sombra, sol en la armadura, tormentas de polvo en Marte. La **reserva de retorno** solo se gasta caminando de vuelta; salir del alcance de radio provoca un repliegue. |
| Evaluar: un informe que une decisiones y resultado | El **informe de salida** tiene un gráfico de la batería en el tiempo con cada objetivo, zona de gasto y el momento en que se tocó la reserva; una tabla **decisión → resultado** (cada pieza del traje y lo que causó); la **comparación con el intento anterior**; y hasta tres **propuestas** concretas (siempre dentro del límite de masa) que se cargan con un clic. |
| Fallo recuperable | Quedarse sin energía es un repliegue seguro, nunca un fin de partida. El informe explica por qué y rediseñas o repites. Los intentos se guardan en el navegador. |
| Datos NASA, modelo separado de la ficción | Menú → **Ciencia: modelo y realidad**: cada mecánica junto al dato de la NASA en que se apoya, con la etiqueta *observación*, *simplificación* o *ficción* y su fuente. Las fichas del atlas de rocas y del menú también citan páginas de la NASA. |
| Inglés y español | Toda la interfaz y la voz grabada de LUMA, desde Ajustes. |

**Recorrido de tres minutos.** El juego arranca en el idioma del navegador (fuérzalo con `?lang=es` o `?lang=en`). Ábrelo con `?demo` (abre todos los destinos sin tocar los guardados) o `?level=moon` para el capítulo más completo. La ayuda de controles y de la pantalla está en el menú (**Controles y ayuda**). Después:

1. **Nueva expedición** → camina a los puestos iluminados (WASD, **E** para usar). Prueba un traje ligero **sin taladro**: la barra superior marca en rojo el objetivo de la caché.
2. Taquilla → esclusa → explora. Sigue el ◆ de la brújula; **E** en cada objetivo iluminado. Vigila el panel de batería.
3. Cuando la batería toque la reserva, vuelve caminando al módulo (⌂). Lee el informe: el gráfico, la fila *instrumentos* en naranja y la propuesta «Lleva taladro de muestras».
4. Pulsa **Probar esta propuesta**, sal otra vez y completa la misión. El nuevo informe muestra *frente al intento anterior*: qué cambió en el traje y cómo cambió el resultado.
5. Menú → **Ciencia: modelo y realidad**.

**Controles.** WASD o flechas para moverte, ratón para mirar, Espacio para saltar, Shift para impulsarte, E para interactuar, V para cambiar al visor, C para centrar, F para pantalla completa y Esc para pausar. G activa el rastreo de LUMA cuando está disponible.

**Alcance.** La batería, el alcance y la telemetría usan valores del escenario educativo. La campaña combina maniobras locales pilotadas y crucero acelerado. Queda medir duración y dificultad con jugadores. El prototipo 2D sigue en /?legacy&world=orbit.

Guion de la demo de dos minutos: [GUION-DEMO](brain/06-Produccion/GUION-DEMO.md).

## Proyecto

Juego de exploración espacial en 3D para navegador (three.js): diseñas el traje con recursos limitados, exploras en tercera persona con un animal extraterrestre acompañante llamado **LUMA**, y un informe une cada decisión con su resultado. Responde al reto Space Mission Design Game de NASA Space Apps 2026.

Una cápsula de la expedición desaparecida Aurora regresa con LUMA y registros dañados. Tu hermana viajaba en esa expedición. Debes reconstruir su ruta, encontrar a los supervivientes y traerlos a la Tierra.

**Estado.** La campaña enlaza las 24 misiones principales en Tierra, estación, Luna, Marte y Bennu, y concluye con el regreso de Aurora. Guarda las siete pruebas, el manifiesto de rescate y la despedida. La expedición lunar conserva la demostración de diseño, informe, atlas y misiones secundarias del equipo. [Guía de integración](brain/06-Produccion/CAMPANA-3D.md).

Este espacio local empezó con la documentación y un historial Git propio. Reutiliza la planificación de octubre, cuyo origen está registrado en la [bitácora del 14 de noviembre](brain/08-Bitacora/2026-11-14.md).

## Ejecutar localmente

Con Node 24 y pnpm 12.4.1, abre una terminal en este directorio:

~~~text
pnpm install --frozen-lockfile
pnpm dev
~~~

Abre la URL local de Vite. Para integradores: `pnpm test`, `pnpm build` y `pnpm test:e2e` (la prueba en Windows reutiliza Chrome instalado).

`/` empieza en el nivel 1. Para abrir un destino concreto usa `?level=orbit`, `?level=moon`, `?level=mars`, `?level=bennu` o `?level=extraction`, y añade `&debug` para ver el panel de render. Fichas: [estación](brain/02-Diseno/ESTACION-QUIROFANO.md), [Luna](brain/02-Diseno/LUNA-NACAR.md), [Marte](brain/02-Diseno/MARTE-TERRACOTA.md) y [Bennu — SPOILERS](brain/02-Diseno/BENNU-CARBONO.md). La versión 2D completa de Primera luz se abre con `?legacy&world=orbit` ([guía](brain/08-Bitacora/HANDOFF-C1-PRIMERA-LUZ.md)).

## Empieza aquí

| Necesitas… | Abre… |
| --- | --- |
| Compartir la propuesta completa | [Plan del proyecto](PLAN.md) |
| Ver capítulos, misiones y requisitos | [Campaña](brain/02-Diseno/MUNDO-Y-CAMPANA.md) |
| Leer la historia completa y el desenlace | [Historia principal — SPOILERS](brain/02-Diseno/HISTORIA-PRINCIPAL.md) |
| Conocer el vínculo y el final de LUMA | [Arco de LUMA — SPOILERS](brain/02-Diseno/ARCO-LUMA-SPOILERS.md) |
| Conocer el pilotaje y los trayectos | [Viaje espacial](brain/02-Diseno/VIAJE-ESPACIAL.md) |
| Recorrer el cerebro del proyecto | [Inicio del vault](brain/00-Inicio/INICIO.md) |
| Saber qué está hecho y qué sigue | [Estado actual](brain/00-Inicio/ESTADO-ACTUAL.md) |
| Trabajar como agente o colaborador | [Instrucciones de trabajo](AGENTS.md) |
| Consultar tareas y dependencias | [Backlog](brain/06-Produccion/BACKLOG.md) |
| Construir un mundo con la misma base de juego | [Kit de mundos](brain/06-Produccion/KIT-DE-MUNDOS.md), [assets](brain/05-Arte/ASSETS-COMPARTIDOS.md) y [plantilla](brain/09-Plantillas/MUNDO.md) |
| Revisar investigación de juegos | [Comparativa de referentes](brain/01-Producto/INVESTIGACION-JUEGOS.md) |

## El juego

Preparar la salida → explorar → volver → entender el resultado en el informe → rediseñar → abrir el siguiente destino. La ruta es Órbita → Luna → Marte → Bennu → evacuación, y el regreso a la Tierra se cuenta en el epílogo.

La campaña completa prevista tiene **cuatro capítulos y 24 misiones principales** ([campaña](brain/02-Diseno/MUNDO-Y-CAMPANA.md)); el juego 3D cubre las misiones de superficie de cada capítulo. Los vuelos (maniobras, aproximaciones, acoplamientos y cruceros acelerados) siguen pendientes en 3D.

LUMA es una criatura viva con traductor ficticio. Su color evoluciona con los capítulos inspirado en una estrella similar al Sol. La documentación del cierre está marcada con spoilers.

La ambientación es un futuro cercano hipotético. Los datos científicos enlazan su fuente; bases, misiones humanas futuras, especie de LUMA y traductor están identificados como ficción.

## Tecnología acordada

three.js 0.187 (WebGL, sin motor de física: controlador propio sobre mapas de alturas), React 19 para la interfaz, Zustand, Zod, IndexedDB con Dexie, TypeScript y Vite. Audio procedural con Web Audio y voces de LUMA pregrabadas. Phaser solo para la versión 2D de `/?legacy`. Decisión en [ADR-006](brain/03-Arquitectura/ADR/ADR-006.md). Vercel para la publicación. El juego completo se juega sin pagar IA.

Las versiones del kit están fijadas en el lockfile. [Entorno](brain/06-Produccion/ENTORNO.md) distingue las herramientas usadas de las previstas.

## Calendario y elegibilidad

- **28 de octubre de 2026:** publicación del enunciado completo.
- **13 de noviembre:** revisión de guías de entrega, evaluación y horario de la sede.
- **14–15 de noviembre:** desarrollo de la demo durante el periodo autorizado.
- **Después del evento:** expansión por hitos hasta la campaña completa.

La FAQ oficial indica que los equipos no pueden empezar a trabajar en los retos antes de la hackathon. Se limitó la etapa previa a investigación, planificación y documentación. La preparación documental no constituye una certificación de elegibilidad. [FAQ oficial](https://www.spaceappschallenge.org/resources/participant-faqs/).

El propietario registró la apertura comunicada por su sede en [Cajamarca](brain/08-Bitacora/2026-11-14.md#apertura-en-cajamarca) antes de empezar este kit. La verificación del enunciado completo y de la entrega interna sigue pendiente.

## Abrir el cerebro en Obsidian

1. Clona o descarga este repositorio.
2. En Obsidian, selecciona **Abrir carpeta como bóveda**.
3. Elige la carpeta **brain**, no una bóveda personal existente.
4. Abre [INICIO](brain/00-Inicio/INICIO.md).

No requiere plugins. Los enlaces también se pueden recorrer desde GitHub. Las preferencias personales de Obsidian quedan fuera de Git.

## Colaborar y compartir

Código, assets y documentación del kit: [LuisRz1/orbita-la-ultima-luz](https://github.com/LuisRz1/orbita-la-ultima-luz), con historial propio. El [repositorio de planificación](https://github.com/LuisRz1/nasa-orbita) conserva el trabajo de octubre y el seguimiento en [Issues](https://github.com/LuisRz1/nasa-orbita/issues).

El trabajo se organizará con Issues, ramas y pull requests. Consulta [CONTRIBUTING](CONTRIBUTING.md) antes de empezar. Los responsables humanos de las tareas todavía están por asignar.

Proyecto independiente preparado para un reto de NASA Space Apps; no es un producto oficial ni implica aprobación de NASA.

## Licencias

El código original se publica bajo [MIT](LICENSE). La documentación y los recursos creativos originales se publican bajo [CC BY 4.0](LICENSE-CONTENT.md). El material de terceros conserva sus condiciones: [atribuciones y procedencia](THIRD-PARTY-NOTICES.md).
