# Órbita: La última luz

Juego de exploración espacial en 3D para navegador (three.js): diseñas el traje con recursos limitados, exploras en tercera persona con un animal extraterrestre acompañante llamado **LUMA**, y un informe une cada decisión con su resultado. Responde al reto Space Mission Design Game de NASA Space Apps 2026.

Una cápsula de la expedición desaparecida Aurora regresa con LUMA y registros dañados. Tu hermana viajaba en esa expedición. Debes reconstruir su ruta, encontrar a los supervivientes y traerlos a la Tierra.

**La campaña 3D ya se juega en la rama de integración local.** Conecta 24 misiones principales, la expedición lunar Nácar y el epílogo, con texto en español e inglés. La referencia 2D se abre en `/?legacy`. Consulta la [guía de integración](brain/06-Produccion/CAMPANA-3D.md) para colaborar.

Este espacio local empezó con la documentación y un historial Git propio. Reutiliza la planificación de octubre, cuyo origen está registrado en la [bitácora del 14 de noviembre](brain/08-Bitacora/2026-11-14.md).

## Ejecutar localmente

Con Node 24 y pnpm 12.4.1, abre una terminal en este directorio:

~~~text
pnpm install --frozen-lockfile
pnpm dev
~~~

Abre la URL local de Vite. Para integradores: `pnpm test`, `pnpm build` y `pnpm test:e2e` (la prueba en Windows reutiliza Chrome instalado).

Elige **Jugar campaña de Aurora** o abre `/?campana` para entrar por el complejo de lanzamiento. Usa `WASD`, clic para girar la cámara con el ratón o arrastre derecho, rueda para zoom y `C` para centrar. `E` interactúa, `R` escanea, `L` habla con LUMA cuando está disponible, `Tab` abre el diario y `F` activa pantalla completa.

Abre `/?campana&primera-luz` para jugar las seis misiones del primer capítulo en un guardado independiente.

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

Preparar una misión → viajar → explorar → tomar decisiones → regresar → entender los resultados → desbloquear nuevas expediciones.

La campaña recorre la Tierra, órbita terrestre, Luna, Marte, Bennu y el regreso a la Tierra con **cuatro capítulos y 24 misiones principales**. Cada misión revela una pista, abre una ruta o permite rescatar a Aurora. El astronauta se ve de cuerpo completo en tercera persona. Hay muestras, observaciones, ecos opcionales y conversaciones escritas ligadas al lugar o la acción.

El pilotaje local conserva una simulación en dos ejes con cámara 3D. Los cruceros largos tienen planificación y tiempo acelerado. Cada capítulo muestra qué objetivos hacen falta para avanzar.

LUMA es una criatura viva con traductor ficticio. Su color evoluciona con los capítulos inspirado en una estrella similar al Sol. La documentación del cierre está marcada con spoilers.

La ambientación será un futuro cercano hipotético. Los datos científicos tendrán fuentes; bases, misiones humanas futuras, especie de LUMA y traductor estarán identificados como ficción.

## Tecnología acordada

Three.js, TypeScript, Vite, React, Zustand, Zod e IndexedDB con Dexie. El modo de referencia usa Phaser 4.2.1. La voz de LUMA se integra mediante clips que entrega el propietario. El recorrido funciona con el texto escrito.

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
