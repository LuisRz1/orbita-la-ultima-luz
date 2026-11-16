---
id: campana-implementacion-3d
type: produccion
status: integracion-local
updated: 2026-11-15
tags: [orbita, niveles, 3d, luma, continuidad]
---
# Integración de la campaña 3D

Abre la configuración inicial y elige **Jugar Primera luz** o **Campaña de Aurora**. La ruta `/?campana` reanuda la ranura completa. Usa V para cambiar al visor, C para centrar y F para pantalla completa. `/?legacy` accede a la referencia Phaser, `/?level=moon` abre la expedición lunar separada y `?campana&debug` añade instrumentos de prueba. Trabaja desde la carpeta del juego y usa Node 24 y pnpm 12.4.1.

`/?campana&primera-luz` abre las seis misiones de C1 en su propio guardado. **Continuar con el capítulo 2** lleva los hitos al nodo lunar si la campaña está vacía. Su [ficha jugable](../02-Diseno/CAPITULOS/C1-PRIMERA-LUZ.md) detalla las escenas y las dos validaciones.

En una partida nueva, usa `WASD` para caminar hasta tu hermana y `E` para despedirte. La escena ocurre en la Tierra antes de que salga Aurora. El prólogo original cubre el salto de meses y da paso a Control. LUMA aparece en el compartimento de la estación tras acoplar, transferir suministros y cotejar la cápsula. Después de calibrar el traductor, `L` iniciará una conversación cuando esté disponible.

## Contrato que aplica a cada destino

Usa el [estándar obligatorio](../../AGENTS.md). Coloca al jugador en un inicio protegido con un hito visible, un primer objetivo y una ruta de vuelta. La cámara y el HUD son comunes. En el informe, el motor comprueba objetivos, instrumentos, energía y regreso antes de habilitar el siguiente tramo. Los encuentros también tienen un área física y una acción situada. Los hallazgos opcionales enriquecen los desvíos.

| Área | Tamaño del terreno | Borde y circulación | Entrada / cierre |
| --- | ---: | --- | --- |
| Complejo terrestre | 288 m | Patio, pista, hangares y mirador conectados por pistas y relieve de borde. | Despídete en el patio y, tras el prólogo, llega a Control y aprueba el diseño de la misión. |
| Estación | 196 m | Módulos presurizados, laboratorios y acceso a la esclusa. | Transfiere carga, autentica la cápsula y prepara la protección de LUMA. |
| EVA | 155 m | Cubierta y anclajes solapados de 17 m, con dos rutas configurables. | Contrasta luz, recoge registrador y autentícalo de vuelta en la esclusa. |
| Luna | 256 m | Base, llanura, cráter, cresta y dos caminos alrededor de la grieta de Nácar. | Selecciona zona, equipa el traje, reúne las tres piezas en orden libre y coteja en órbita. |
| Marte | 320 m | Hábitat, valle, terrazas y relé, con dos accesos de aterrizaje. | Recupera geología y mensaje, resuelve una caída de potencia y reabastece en órbita. |
| Bennu | 240 m | Dos rutas por anclajes y zona de refugio. Velocidad limitada y línea visible. | Identifica y embarca a cada superviviente, confirma soporte vital y reservas. |
| Módulo de servicio | 84 m | Corredor y compuerta con colisión. | Libera el regreso del protagonista y registra la despedida en el compartimento. |
| Tierra | 288 m | Centro de recepción sobre el complejo terrestre. | Registra las tres recepciones, entrega muestras e informe y abre el epílogo. |

Los tamaños describen la malla, incluidos los bordes de seguridad. Las ubicaciones se componen para el juego. La microgravedad, la textura aparente y la trayectoria de contacto se simplifican mediante un parche local anclado. NASA documenta rocas de cohesión muy débil en Bennu y gravedad marciana de unos 3,7 m/s². [Bennu Facts](https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/) · [NASA Glenn Research Center](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/mars/).

## Datos, arte y texto

1. Define terreno, sectores, POI, sólidos y coleccionables en `src/levels/<id>/`, conforme a [LevelV2](../../src/core/contract/level-v2.ts). Mantén los IDs de misión y de pruebas ya guardados.
2. Integra cambios de terreno o de modelo que entregue el equipo en ese módulo. Actualiza altura de apoyo, colisión, visibilidad de hitos y rutas al sustituir geometría. El nivel lunar de referencia sigue en [moon/level.ts](../../src/levels/moon/level.ts) y su adaptación en [moon/campaign.ts](../../src/levels/moon/campaign.ts).
3. Alinea secuencia, pruebas y salida con [campaign.ts](../../src/core/campaign.ts). Las escenas, datos y UI mantienen separadas la prueba recogida y la conclusión validada.
4. Escribe cada línea como `{es, en}`. Añade diálogos situados a `point:<id>` y de zona a `zone:<id>`. Define `chat` para las conversaciones voluntarias con `L`. El motor habilita esa conversación cuando LUMA y su traductor están disponibles.
5. Los clips de LUMA se producen en el modelo local del propietario. Coloca los archivos autorizados en `public/assets/voice/luma/` y las entradas en [clips.json](../../public/assets/voice/luma/clips.json). La clave es `escena/evento/índice/idioma`, empezando en cero. El [guion bilingüe de LUMA](../05-Arte/GUION-LUMA.md) reúne los IDs y las líneas. El visor reproduce la pista correspondiente al idioma elegido y presenta el subtítulo durante toda la línea. Los clips se cancelan al pasar de línea, cerrar la escena o salir del juego. La última escena con voz usa `service/point:safe-bay`.
6. Mantén las transiciones de [campaña](../../src/ui/screens/campaign-scenes.tsx) ligadas al informe lunar de C1, al informe lunar de C2, al plan de rescate de C3 y al informe terrestre de C4. El siguiente destino se revela con la evidencia correspondiente. El epílogo terrestre retoma la despedida inicial.

## Prueba para entregar una región

- Recorre ambas vías con `WASD`, gira con ratón, vuelve con `C` y comprueba `F`. Verifica cruces, colisión y avisos de borde.
- Comprueba puntos requeridos con `checkLevel` y pon a prueba una combinación de traje inviable y otra con reserva. Valida inicio y salida del capítulo, más recuperación al recargar.
- Revisa el texto y la duración de las instrucciones en ambos idiomas. Cuando lleguen clips, sube volumen y comprueba que se escuche solo la línea actual.
- Registra mapa, seed, evidencia, pruebas y pendientes en [estado actual](../00-Inicio/ESTADO-ACTUAL.md) y en el Issue correspondiente. Mantén imágenes, ubicaciones y diálogos compatibles con la historia.
