---
id: estado-actual
type: estado
status: marte-3d-jugable
updated: 2026-11-14
tags: [orbita, continuidad]
---
# Estado actual

## Punto de continuación

**Último avance (rama local `feat/level-mars`, sobre un `main` que une `feat/3d` y `feat/world-orbit`):** Marte es el segundo destino 3D jugable ([ficha](../02-Diseno/MARTE-TERRACOTA.md)). Hábitat, bitácora, valle, relé y terminal cubren C3-M03–M05 y autentican AUR-E04/E05; la reparación del relé desata una contingencia de polvo que obliga a elegir la ruta de vuelta. Se desbloquea al completar la Luna (`?level=mars` lo abre directamente). El bioma pasa a ser por nivel y la Luna conserva Nácar. Verificado: build, 43 pruebas de reglas y 13 recorridos en Chrome, con capturas revisadas de seis zonas. Sin verificar: fps en Iris Xe, escucha humana del viento y equilibrio con partidas reales. Siguiente paso: vuelo 3D (tanda 6) para M01–M02 y el reabastecimiento de M06, y luego Bennu. La rama local `codex/campana-completa` del propietario, citada en los Issues #15–#18, no está publicada; al recibirla, compararla con esta antes de fusionar. Detalle en la [bitácora](../08-Bitacora/2026-11-14.md#nivel-3d-de-marte).

**Fase activa: reconstrucción 3D en la rama local `feat/3d`.** Tandas 0 y 1 cerradas: `/` abre la Luna en gris, jugable en tercera persona con salto, doble salto, dash, seis objetivos, ocho ecos, títulos de zona y repliegue al perder el enlace ([niveles](../02-Diseno/NIVELES.md)). El juego 2D sigue completo en `/?legacy`. La tanda 2 añadió el bucle del reto NASA: consola de diseño del traje, energía en juego, repliegue, informe con causas y rediseño, con intentos guardados ([mecánicas](../02-Diseno/MECANICAS.md)). La tanda 3 añadió menú principal, pausa, ajustes (idioma, sensibilidad, movimiento reducido, calidad), diez [logros](../02-Diseno/LOGROS.md), diálogos de LUMA y Control, interfaz en español e inglés y créditos con fuentes NASA. La tanda 4 dio el aspecto final: luz pintada en tres tonos, contornos de tinta, astronauta articulado, LUMA, props, rocas, polvo, halo del sol y Tierra ([guía visual 3D](../05-Arte/GUIA-VISUAL-3D.md)). La tanda 5 añadió [audio](../05-Arte/AUDIO.md) procedural grave, verificado con earshot, y un segundo pase visual: terreno con detalle por píxel, astronauta y LUMA detallados, texturas de props, huellas, Vía Láctea y grano. El despliegue en Vercel lo hace un compañero del equipo. Siguiente paso: tanda 6 (capítulo 1 en 3D) o pulir la Luna según la sesión del propietario; medir fps en Iris Xe. Leer [tandas](../06-Produccion/TANDAS.md) y [ADR 006](../03-Arquitectura/ADR/ADR-006.md).

Primera luz (capítulo 1 en 2D) conserva sus seis misiones jugables y su entrega al nodo lunar; ahora se abre con `/?legacy&world=orbit`. La demo pública y la campaña completa siguen pendientes. Los cambios de `feat/3d` están sin commit: los hace el propietario.

**Fecha de entrega sin confirmar:** el cierre general publicado es el 15 de noviembre a las 23:59 locales; el propietario cree que su sede entrega el lunes 16.

El 14 de noviembre se preparó una copia con historial independiente y la documentación original de octubre. El código, los assets y las guías del kit se publican en [LuisRz1/orbita-la-ultima-luz](https://github.com/LuisRz1/orbita-la-ultima-luz), rama main. El [registro del arranque](../08-Bitacora/2026-11-14.md) identifica la revisión de origen y la separación entre importación, desarrollo y publicación.

Se abrió este desarrollo después del aviso de Cajamarca comunicado por el propietario. Lee primero el [handoff de Primera luz](../08-Bitacora/HANDOFF-C1-PRIMERA-LUZ.md), el [kit de mundos](../06-Produccion/KIT-DE-MUNDOS.md) y el [catálogo](../05-Arte/ASSETS-COMPARTIDOS.md) antes de integrar mapas.

La revisión 1.2 integra la historia de Aurora en los cuatro capítulos y 24 misiones: buscar a la hermana del protagonista y a los supervivientes y traerlos a la Tierra. LUMA llega en la cápsula de emergencia, se deteriora y se sacrifica para salvar al jugador. El título de trabajo es Órbita: La última luz. Son especificaciones, no contenido jugable.

Leer [historia principal — spoilers](../02-Diseno/HISTORIA-PRINCIPAL.md), [campaña y misiones](../02-Diseno/MUNDO-Y-CAMPANA.md) y [handoff de esta revisión](../08-Bitacora/HANDOFF-2026-10-14.md). La ruta Tierra → Luna → Marte → Bennu → Tierra reabastece en Marte; sustituye la escala terrestre intermedia anterior.

## Entregado

- C1-M01–M06 con diseño de misión, pilotaje, encuentro de LUMA, EVA, informe y entrega lunar. El [contraste con el enunciado completo](../04-Ciencia/REQUISITOS-NASA.md) distingue el objetivo central de las sugerencias.
- Guardado propio de C1 y paso a Luna con AUR-E01/AUR-E02, sin escribir el guardado lunar. Los assets compartidos y el archivo de Luna se conservaron.

- Un proyecto Phaser/React con cuatro módulos de mundo, controles, sprites, planificación, diario, cierre validado, informe y guardado local compartidos.
- 20 PNG originales con un manifiesto y fuente reproducible. Luna tiene seis lugares y un cierre local; los otros tres escenarios tienen mapas separados y guardados independientes.
- Guía de integración, inicio y salida de los cuatro capítulos, contrato v1 y plantilla de entrega.
- Plan completo y README de entrada.
- Vault compatible con Obsidian y GitHub, sin plugins obligatorios.
- Especificaciones de producto, diseño, arquitectura, ciencia, arte y calidad.
- Cuatro fichas de capítulo con acciones, objetivos, desbloqueos y condiciones de cierre.
- Historia principal con motivo del viaje, cadena de pruebas AUR-E01–AUR-E07, reencuentro, evacuación y epílogo.
- Las 24 principales especifican su aporte al rescate. Contratos, guardado y QA contemplan revelaciones y manifiesto de supervivientes.
- Viaje espacial y arco de LUMA separado con spoilers.
- Decisiones del propietario y ADR.
- Instrucciones para agentes, plantillas y secuencia de tareas.
- La rama main del [repositorio público de origen](https://github.com/LuisRz1/nasa-orbita) conserva la planificación publicada.
- [18 Issues](https://github.com/LuisRz1/nasa-orbita/issues) con dependencias, aceptación y etiquetas por fase.

## Evidencia y límites

- Carpeta de partida vacía y sin Git, comprobado el 14 de octubre.
- Cuenta de publicación confirmada: LuisRz1.
- FAQ oficial revisada el 14 de octubre: fechas globales y restricción de trabajo previo siguen publicadas.
- Dependencias fijadas en `pnpm-lock.yaml`; `pnpm build`, siete pruebas de reglas y cuatro recorridos en Chrome en la rama de C1. Comprobación de apertura desde Vite y de ancho de pantalla en el nuevo flujo.
- Los escenarios de ensayo no validan la física de cada destino, no publican datos científicos y no escriben hitos de campaña.
- Publicación inicial confirmada en el commit ec0edf1; consultar Git para las actualizaciones posteriores.
- Revisión documental inicial: 45 archivos, 40 documentos Markdown, 32 notas y 63 enlaces válidos.
- Revisión 1.1: 52 archivos previstos para versionar, 47 documentos Markdown, 39 notas y 94 enlaces locales comprobados. Se verificaron seis misiones por capítulo, 18 regiones únicas y los totales 24/32/18/120.
- Revisión 1.2: 54 archivos para versionar, 49 documentos Markdown y 41 notas con IDs únicos. 140 enlaces locales, 24 principales, 18 regiones, siete evidencias y cuotas 24/32/18/120 comprobados. Revisión de patrones de secretos y formato sin incidencias.
- Diez Issues actualizados y leídos de nuevo para comprobar su contenido: #7–#11, #13 y #15–#18. Conservan estado abierto, dependencias y etiquetas de fase; hay 18 Issues en total.
- Calendario narrativo, tiempos de cápsula y autonomía del refugio pendientes de validar junto con las ventanas de vuelo. La historia propuesta no acredita una trayectoria real viable.
- El estado de publicación y los commits se comprueban en el historial y en la bitácora de esta entrega.

## Próximo trabajo permitido

1. Revisar el cambio de C1 sin fusionarlo antes de coordinar el capítulo lunar. El equipo de C2 conserva su misión y puede leer la entrega de C1 al preparar el descenso.
2. Ensayar en conjunto el paso al C2 final. Integrar sus maniobras de demo en [JAM-08](https://github.com/LuisRz1/nasa-orbita/issues/14) cuando el equipo lo coordine; el vuelo ya funciona para C1.
3. Confirmar las guías y entrega interna ([PREP-04](https://github.com/LuisRz1/nasa-orbita/issues/4)). La campaña completa, el mando, la exportación de guardado, el audio y el despliegue jugable requieren trabajo adicional.

Consulta [backlog](../06-Produccion/BACKLOG.md) para IDs, dependencias y enlaces a Issues.

## Preguntas externas pendientes

- Fuente pública del horario local y hora de entrega interna de Cajamarca.
- Condiciones de entrega y selección de productos de datos para los capítulos siguientes.
- Nombres y disponibilidad de los integrantes.
- Acceso gratuito real al modelo de conversación en la fecha de entrega.

Estas incógnitas tienen tareas de revisión; no justifican adelantar desarrollo.
