---
id: estado-actual
type: estado
status: kit-jugable-local
updated: 2026-11-14
tags: [orbita, continuidad]
---
# Estado actual

## Punto de continuación

**Fase activa: implementación del kit de mundos.** La Luna tiene un recorrido jugable de referencia; Órbita, Marte y Bennu son ensayos de integración. La demo completa y la campaña siguen pendientes.

El 14 de noviembre se preparó una copia local con historial independiente y la documentación original de octubre. El [registro del arranque](../08-Bitacora/2026-11-14.md) identifica el origen y la revisión copiada. La copia no se publicó ni tiene remoto.

Se abrió este desarrollo después del aviso de Cajamarca comunicado por el propietario. Lee primero el [kit de mundos](../06-Produccion/KIT-DE-MUNDOS.md) y el [catálogo](../05-Arte/ASSETS-COMPARTIDOS.md) antes de repartir mapas y objetivos.

La revisión 1.2 integra la historia de Aurora en los cuatro capítulos y 24 misiones: buscar a la hermana del protagonista y a los supervivientes y traerlos a la Tierra. LUMA llega en la cápsula de emergencia, se deteriora y se sacrifica para salvar al jugador. El título de trabajo es Órbita: La última luz. Son especificaciones, no contenido jugable.

Leer [historia principal — spoilers](../02-Diseno/HISTORIA-PRINCIPAL.md), [campaña y misiones](../02-Diseno/MUNDO-Y-CAMPANA.md) y [handoff de esta revisión](../08-Bitacora/HANDOFF-2026-10-14.md). La ruta Tierra → Luna → Marte → Bennu → Tierra reabastece en Marte; sustituye la escala terrestre intermedia anterior.

## Entregado

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
- Dependencias fijadas en `pnpm-lock.yaml`; `pnpm build`, cuatro pruebas de reglas y dos recorridos en Chrome verificados.
- Los escenarios de ensayo no validan la física de cada destino, no publican datos científicos y no escriben hitos de campaña.
- Publicación inicial confirmada en el commit ec0edf1; consultar Git para las actualizaciones posteriores.
- Revisión documental inicial: 45 archivos, 40 documentos Markdown, 32 notas y 63 enlaces válidos.
- Revisión 1.1: 52 archivos previstos para versionar, 47 documentos Markdown, 39 notas y 94 enlaces locales comprobados. Se verificaron seis misiones por capítulo, 18 regiones únicas y los totales 24/32/18/120.
- Revisión 1.2: 54 archivos para versionar, 49 documentos Markdown y 41 notas con IDs únicos. 140 enlaces locales, 24 principales, 18 regiones, siete evidencias y cuotas 24/32/18/120 comprobados. Revisión de patrones de secretos y formato sin incidencias.
- Diez Issues actualizados y leídos de nuevo para comprobar su contenido: #7–#11, #13 y #15–#18. Conservan estado abierto, dependencias y etiquetas de fase; hay 18 Issues en total.
- Calendario narrativo, tiempos de cápsula y autonomía del refugio pendientes de validar junto con las ventanas de vuelo. La historia propuesta no acredita una trayectoria real viable.
- El estado de publicación y los commits se comprueban en el historial y en la bitácora de esta entrega.

## Próximo trabajo permitido

1. Confirmar quién lleva cada destino y quién integra el motor. Probar la Luna antes de abrir ramas individuales.
2. Revisar el enunciado completo y la entrega local ([PREP-03](https://github.com/LuisRz1/nasa-orbita/issues/3) y [PREP-04](https://github.com/LuisRz1/nasa-orbita/issues/4)); el horario de apertura ya está registrado según el aviso comunicado al dueño.
3. Completar primero crucero y aproximación comunes en [JAM-08](https://github.com/LuisRz1/nasa-orbita/issues/14), y ampliar Luna con fuentes y planificación de misión. La campaña, el mando, la exportación de guardado, el audio y la publicación requieren trabajo adicional.
4. Integrar cada entrega siguiendo el [handoff vigente](../08-Bitacora/HANDOFF-2026-11-14.md) y su ficha de mundo.

Consulta [backlog](../06-Produccion/BACKLOG.md) para IDs, dependencias y enlaces a Issues.

## Preguntas externas pendientes

- Fuente pública del horario local y hora de entrega interna de Cajamarca.
- Requisitos y datasets definitivos del enunciado completo.
- Nombres y disponibilidad de los integrantes.
- Acceso gratuito real al modelo de conversación en la fecha de entrega.

Estas incógnitas tienen tareas de revisión; no justifican adelantar desarrollo.
