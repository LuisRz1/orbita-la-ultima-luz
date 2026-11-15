---
id: guardado
type: especificacion
status: especificado-sin-implementar
updated: 2026-10-14
tags: [orbita, persistencia]
---
# Guardado y recuperación

IndexedDB mediante Dexie será el almacenamiento principal. El usuario podrá exportar e importar una partida como archivo de datos validado.

El kit local ya usa Dexie para reanudar los hitos de cada escenario con una clave de misión y una versión. Su [contrato v1](ADR/ADR-005.md) no implementa todavía exportación, migración de campaña ni guardado de evidencias globales.

C1 conserva su propia versión y tabla en `orbita-chapters`. La reanudación valida el diseño, el orden de los acoples, los puntos de cada región, las reservas y el progreso de crucero. La entrega lunar se calcula a partir del capítulo archivado, sin escribir ni migrar el registro `c2-reference`. No hay todavía un guardado global de campaña.

## Contenido persistente

Versión de esquema y contenido; perfil local; progreso de misiones; recursos estables; IDs de hallazgos; mejoras; semillas necesarias; memoria y decisiones escritas de LUMA; opciones.

Añadir capítulo y principales, etapas procesadas, condición de vida y paleta de LUMA; modo de control; nave, tramo e hitos de crucero.

Persistir piezas recuperadas y evidencias validadas de Aurora por separado, destinos revelados, manifiesto de supervivientes y estado de cada persona: localizada, embarcada y recibida. Conservar el plan de capacidad y reservas de la tripulación ampliada. Ver [contratos](CONTRATOS.md).

No guardar referencias de objetos Phaser, nodos DOM, funciones, credenciales ni una dependencia del historial completo de chat.

## Escritura

Guardar al completar hitos y al regresar, con escrituras transaccionales. El progreso visible confirmado debe corresponder a una escritura recuperable.

Autenticar una prueba y revelar su destino forman un mismo hito consistente. Embarcar o recibir a una persona actualiza su ID una vez. Los puntos de control de C4-M04, M05 y M06 conservan por separado evacuación, despedida y recepción terrestre para reanudar sin adelantar el resultado.

Al ocultar la pestaña, pausar la simulación y solicitar guardado cuando sea posible. No depender únicamente del cierre de la pestaña para persistir.

## Lectura y migración

Validar antes de reemplazar la partida activa. Mantener respaldo antes de migrar y rechazar versiones futuras con explicación, sin sobrescribir.

Si la cuota de almacenamiento o permisos impiden escribir, informar y ofrecer exportación. Una importación dañada no borra la partida existente.

## Aceptación

Recargar en un hito, repetir una entrega y exportar/importar conserva el estado sin premios duplicados. Sin red se puede completar la región ya cargada; una región no descargada debe comunicar su indisponibilidad.

Reanudar un crucero no vuelve a consumir suministros de un tramo ya resuelto. El marco de coordenadas se conserva al cambiar de modo. Cargar tras un cierre narrativo no revierte resultados ni repite escenas. La exploración posterior funciona con herramientas del jugador.

Recargar con una pieza de AUR-E03 o AUR-E05 pendiente no revela sus conclusiones. Restaurar antes y después de embarcar conserva el mismo conjunto de supervivientes y sus reservas. La recepción de datos o muestras no marca por error a una persona como rescatada.

## Ejecución 3D

`orbita-campaign-3d` almacena la ranura `aurora` en IndexedDB. [El contrato de campaña](../../src/core/campaign.ts) valida cada evento en orden al cargar. De ahí se reconstruyen misiones, combustible, carga aprobada, evidencias, despedida y recepción. El manifiesto registra a cada persona por ID. La transacción rechaza un evento fuera de orden y conserva el avance de otra pestaña que hubiese guardado primero.

Se guarda al confirmar una maniobra, archivar una salida, aprobar un plan o registrar un informe. Volver a abrir a mitad de una salida recupera el último informe archivado y conserva ecos, intentos y equipo en `orbita-3d`. El crucero se revierte al comienzo del tramo si se recarga antes de confirmarlo. Los guardados de la referencia lunar y de Phaser conservan sus bases.

La fase `farewell` se archiva antes del vuelo de regreso. Las expediciones posteriores usan perfiles separados y los textos de Control. Exportar e importar una partida sigue pendiente.

`/?campana&primera-luz` utiliza la ranura `primera-luz` y perfiles de salida con prefijo `first-light:`. Se detiene después del informe del nodo lunar. Los datos de `aurora` mantienen el progreso de toda la campaña. Los resultados del plan aceptan el indicador opcional `compared`; las partidas previas que carecen de ese dato siguen siendo compatibles. En C1 se comprueba el orden de las acciones de estación y EVA al archivar y al restaurar.
