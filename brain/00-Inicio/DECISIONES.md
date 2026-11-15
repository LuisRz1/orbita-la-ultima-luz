---
id: decisiones-propietario
type: decisiones
status: acordado
updated: 2026-11-15
tags: [orbita, producto]
---
# Decisiones del propietario

| Tema | Decisión |
| --- | --- |
| Formato | Juego directo en navegador. |
| Estética | Tercera persona con cuerpo completo y vista de visor con `V`. Calidad automática y aspecto ilustrado de entrada. El aspecto realista y los efectos se pueden activar en Ajustes. [ADR 006](../03-Arquitectura/ADR/ADR-006.md). |
| Exploración | Mundo abierto por regiones amplias con límites visibles, sectores conectados y rutas alternativas. `WASD` y ratón en los cuatro capítulos. |
| Idioma y voz | Texto, diálogos y subtítulos ES/EN. El propietario genera la voz de LUMA con su modelo local e incorpora los clips por idioma. |
| Ciencia | Futuro cercano plausible con Sistema Solar real. |
| Duración | Objetivo de campaña completa de 12–20 horas. |
| Fecha del evento | 14–15 de noviembre de 2026. |
| Elegibilidad | Conservarla: preparación ahora, implementación durante el evento. |
| Compañero | Diálogos escritos y conversación con IA opcional. |
| Identidad de LUMA | Animal extraterrestre ficticio, compacto y cúbico; sustituye la propuesta de rover. |
| Comunicación | Sonidos y gestos con traductor ficticio. |
| Color | Paleta solar que evoluciona como una estrella similar al Sol según los capítulos. |
| Arco emocional | Deterioro reconocido gradualmente y despedida íntima y definitiva; nota con spoilers. |
| Después de la historia | Epílogo y mundo explorable con recuerdos y herramientas propias. |
| Viaje espacial | Pilotaje directo y trayectos largos acelerados; la vista pasa a 3D cuando el capítulo 1 se integre. |
| Movimiento | A pie con doble salto y dash; su coste de energía depende del traje diseñado. |
| Logros | Opcionales; nunca bloquean la historia. |
| Commits y publicación | El propietario coordina los commits y autorizó integrar y publicar la entrega del 15 de noviembre en GitHub y Vercel. |
| Coste de IA | Sin pagos por ahora; solo acceso gratuito disponible. |
| Repositorio | Código y assets en el repositorio público [LuisRz1/orbita-la-ultima-luz](https://github.com/LuisRz1/orbita-la-ultima-luz). La planificación original y los Issues se conservan en nasa-orbita. |
| Demo | Pública y jugable sin registro. |
| Plataforma inicial | Navegador de PC; teclado, ratón y mando. |
| Equipo | 2–3 personas, con ayuda de agentes. |
| Documentación | Cerebro de Obsidian específico para continuar el trabajo. |
| Acción del 14 de octubre | Publicar el plan y el cerebro en GitHub para compartirlos. |
| Objetivo narrativo | Buscar a Aurora, rescatar a la hermana del protagonista y traer a los supervivientes a la Tierra. |
| Publicación de historia | Subir la historia principal, el arco de LUMA y lo que se hará en cada misión. |

Valores fijados por el plan: un jugador, español e inglés, guardado local y compañero **LUMA**. El título de trabajo pasa de **Órbita: Cartógrafos del futuro** a **Órbita: La última luz** en la propuesta narrativa que el propietario pidió publicar.

Son metas de producción, pendientes de validación: 18 regiones, 24 misiones principales, 32 secundarias, 120 hallazgos y presupuestos de rendimiento. No convertirlos en resultados ya logrados.

Seis misiones por capítulo, Bennu y los objetivos concretos son la propuesta editorial desarrollada a partir de la solicitud. Ver [campaña](../02-Diseno/MUNDO-Y-CAMPANA.md). La paleta azul/verde/violeta/ámbar propuesta anteriormente queda sustituida por blanco-dorado/naranja/rojo/blanco azulado.

La [historia principal](../02-Diseno/HISTORIA-PRINCIPAL.md) documenta la propuesta de Aurora que el propietario pidió subir: cápsula con LUMA, registros lunares, investigación en Marte, reencuentro, evacuación, sacrificio y regreso. Los detalles del contenedor, manifiesto y fallo técnico son desarrollo editorial del plan; no requisitos oficiales de NASA ni citas del propietario. La escala terrestre intermedia de la revisión 1.1 queda sustituida por reabastecimiento en Marte.

Cambiar una decisión de producto requiere registrarlo aquí y actualizar el plan, alcance y tareas afectados. No volver a solicitar confirmación para la publicación pública que ya está autorizada.

## 15 de noviembre: aspecto por encima del coste de GPU

El propietario indicó en la sesión del 15-nov-2026 («olvida mi gráfica, no te limites») que el aspecto visual tiene prioridad sobre el presupuesto de Iris Xe. Se permite posproceso y efectos de mayor coste en calidad media y alta; la calidad baja debe seguir siendo usable en equipos débiles. Ese mismo día pidió que los gráficos arranquen al máximo por defecto (calidad alta, cielo pintado y efectos) para causar impacto en el jurado. Ver [ADR-006](../03-Arquitectura/ADR/ADR-006.md).

## 15 de noviembre: aspecto realista

El 15-nov-2026 el propietario pidió pasar del aspecto ilustrado (tinta y sombreado en tres tonos) a uno realista, inspirado en las técnicas de [Valle Morta](https://github.com/Leonxlnx/valle-morta) (MIT), y conservar el ilustrado como ajuste. Decidido: realista por defecto en calidad media y alta; la calidad baja usa el ilustrado salvo `?look=realista`. Se reimplementan las ideas; no se copian recursos. Ver [ADR-006](../03-Arquitectura/ADR/ADR-006.md).

## Entrega del 15 de noviembre

La última indicación del propietario bajó el coste gráfico de entrada. Se abre la configuración antes de cargar el motor, el acabado ilustrado usa texturas procedurales y los efectos avanzados se habilitan desde Ajustes. La historia y la secuencia de los cuatro capítulos siguen la ficha de campaña.
