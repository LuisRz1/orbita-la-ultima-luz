---
id: luma
type: diseno
status: habilidades-implementadas
updated: 2026-11-15
tags: [orbita, companero, narrativa]
---
# LUMA

**Animal extraterrestre ficticio**, de cuerpo compacto y cúbico, patas cortas, ojos pequeños y apéndices expresivos. Sustituye al compañero rover del plan inicial; el vehículo de superficie del jugador es un equipo distinto.

La imagen del propietario es referencia de formas y expresividad, no un asset incorporado. El diseño será propio y conservará su silueta entre paletas.

Se expresa con sonidos, gestos y conducta. Un traductor ficticio convierte parte de esas señales en frases. El jugador lo conoce durante el prólogo orbital, dentro de la cápsula recuperada de Aurora, y aprende a reconocerlo antes de depender de la traducción.

Viajó con la expedición de la hermana del protagonista. Reconoce personas y objetos, y aporta recuerdos cotidianos que dan contexto a la búsqueda. Las coordenadas y las pruebas proceden de registros y observaciones; LUMA no reemplaza el trabajo del jugador. Ver [historia principal — SPOILERS](HISTORIA-PRINCIPAL.md).

LUMA acompaña, juega, busca cercanía, descansa y recuerda experiencias compartidas. Usa protección ambiental durante EVA y en superficie. Su origen no implica inmunidad al vacío o a la radiación. Las funciones científicas y de navegación pertenecen al equipo del jugador y la nave.

## Habilidades en superficie

Implementadas el 15 de noviembre en [luma-abilities.ts](../../src/core/luma-abilities.ts), con pruebas en `tests/core/luma-abilities.test.ts` y `tests/e2e/luma.spec.ts`. Son reglas deterministas del motor: la IA no las activa ni las modifica. Ayudan en el camino, pero no completan objetivos, no tocan la reserva de retorno ni revelan pruebas AUR-E0x. Todas las misiones y colecciones siguen teniendo solución con las herramientas del jugador ([arco](ARCO-LUMA-SPOILERS.md)).

| Habilidad | Control | Qué hace | Decisión que plantea |
| --- | --- | --- | --- |
| Rastrear | F | Olfatea y corre hasta 48 m dejando un rastro luminoso hacia lo más cercano que queda de Aurora: eco, entrada en ruinas, roca sin catalogar o baliza apagada. Sin nada pendiente, hacia el siguiente objetivo que se puede hacer. Luego recupera el aliento. | Cuándo gastarlo; mientras corre, no te calienta. |
| Brillo en el frío | Pasiva | En una zona de frío, si flota a menos de 4 m, ahorra una fracción del recargo de frío. Nunca reduce el soporte vital, el sol ni el polvo. El informe dice cuánto ahorró. | Mantenerlo cerca en la sombra o mandarlo a rastrear. |
| Presentir | Pasiva | Al dirigirte hacia una zona que gasta batería, se encoge y gruñe una vez por zona y salida. También se agazapa antes del sismo cosmético de la red S1. | Rodear o entrar preparado. |
| Alcanzar | F junto a una repisa | Una vez por salida, sube flotando hasta un eco cercano que el traje no alcanza de pie y lo trae. El resto sigue pidiendo salto o propulsor. Anticipa su gesto en la extracción, donde llega a lo que el traje no alcanza. | Usarlo aquí o guardarlo. |

El desgaste de la historia lo hace más lento y débil por capítulo, nunca más fuerte:

| Destino | Enfriamiento del rastreo | Brillo | Alcanzar |
| --- | --- | --- | --- |
| Órbita (tras unirse) | 16 s | 35 % | 1 |
| Luna | 20 s | 30 % | 1 |
| Marte | 26 s | 25 % | 1 |
| Bennu | 32 s | 20 % | 1 |
| Extracción | 40 s | 15 % | 0 |

En la extracción, una vez lo llevas en brazos, ya no corre ni alcanza. Tras la despedida las habilidades desaparecen: la tarjeta de LUMA queda como «En memoria. Nadie corre delante.», F solo devuelve una nota grave y el aviso «Pulsas F por costumbre», y el epílogo nombra esa costumbre. No hay sustituto con su personalidad.

## Tres capas

1. **Reacciones:** comentarios breves por eventos verificados.
2. **Diálogo escrito:** opciones y escenas con requisitos explícitos.
3. **Texto libre online:** preguntas opcionales cuando exista acceso gratuito.

La campaña completa se sostiene con las dos primeras capas. El chat libre no sustituye objetivos, pistas esenciales o escenas de historia.

## Colores y evolución

| Capítulo | Paleta | Referencia visual | Conducta |
| --- | --- | --- | --- |
| 1. Primera luz | Blanco cálido y dorado | Secuencia principal; dorado artístico. | Curiosidad, energía y primeros descansos breves. |
| 2. Bajo otro cielo | Ámbar y naranja | Transición simplificada hacia gigante roja. | Más reposo y reconocimiento de pequeñas molestias. |
| 3. El mundo rojo | Rojo cobrizo y carmesí | Gigante roja como metáfora. | Deterioro evidente y conversaciones sobre sus límites. |
| 4. Lo que queda de la luz | Blanco azulado | Remanente de enana blanca como metáfora. | Debilidad, calma y voluntad propia. |

El color cambia con hitos de capítulo; la conducta muestra el desgaste dentro de cada etapa. Postura, audio y texto complementan el color.

El Sol es blanco en luz visible; el dorado es una elección artística. Una estrella similar al Sol evoluciona hacia gigante roja y remanente de enana blanca, que sigue emitiendo luz mientras se enfría. Estas referencias no convierten a LUMA en una estrella ni fijan su temperatura.

Fuentes: [NASA, evolución estelar](https://science.nasa.gov/resource/the-life-cycle-of-a-sun-like-star-annotated/) y [NASA SVS, color solar](https://svs.gsfc.nasa.gov/4469).

## Memoria

Hallazgos registrados, decisiones de misión y opciones de conversación confirmadas por el juego. La memoria se guarda con IDs y eventos conocidos. El texto generado no escribe hechos directamente en el estado.

Se guardan también etapa narrativa, deterioro, paleta y condición de vida. La historia dirige el desgaste: esperar o explorar actividades opcionales no lo mata.

## Contexto online

Enviar solo región, objetivo, etapa de historia, resumen permitido del progreso, hechos científicos seleccionados y mensaje. La IA conoce únicamente información ya revelada. Mantener fuera los datos personales y la partida completa.

Responder como personaje, distinguir evidencia de especulación y citar únicamente fuentes suministradas por el servidor. Si una respuesta requiere un dato no disponible, reconocer el límite.

## Comportamiento y fallos

Aplicar pausas y límites de repetición a comentarios. No interrumpir una acción delicada con un diálogo largo. La conversación se puede cerrar y no bloquea los controles de forma permanente.

Sin red, credenciales, crédito, acceso al modelo o respuesta válida: mostrar disponibilidad con claridad y continuar con opciones escritas. La IA no controla recursos ni recompensas.

Una avería del servicio online no cambia su condición narrativa. El desenlace y la continuidad posterior se documentan en [Arco de LUMA — SPOILERS](ARCO-LUMA-SPOILERS.md), lectura obligatoria para narrativa, persistencia y QA.
