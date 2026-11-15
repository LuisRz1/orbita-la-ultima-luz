# Registro de cambios

## 2026-11-14 — Capítulo 1 en 3D: el juego va del nivel 1 al 3

- Estación de recepción «Quirófano azul» (C1-M03–M05): suministros, cotejo de la cápsula, compartimento donde aparece LUMA, traductor, medición de luz, registrador exterior y esclusa que valida AUR-E01 y AUR-E02.
- Elección de ruta en la EVA: armadura al sol (corta, gasta refrigeración) o baranda en sombra (larga, balizada).
- Cubiertas sobre el vacío con la Tierra debajo, chapa en lugar de regolito y cable de seguridad que recoge al jugador si cae.
- `/` abre el nivel 1; ruta Órbita → Luna → Marte con «Continuar a…» en cada informe. Los destinos ya jugados quedan abiertos.
- Contrato v2: `companionAfter`, `fallLimit`, `hazard: 'sun'` y diálogos `point:<id>`.

## 2026-11-14 — Nivel 3D de Marte y ramas unidas

- `main` une `feat/3d` (motor 3D, Luna Nácar, interior de nave, audio) y Primera luz (`feat/world-orbit`).
- Marte «Terracota»: valle de Aurora con hábitat, bitácora, afloramiento, equipo de campo, relé, mirador y terminal (C3-M03–M05 y autenticación de AUR-E04/E05). Se abre con `?level=mars` y se desbloquea al completar la Luna.
- Contingencia de energía: reparar el relé desata una tormenta de polvo sobre las dunas. Rodear por los vados balizados es más barato.
- Bioma por nivel (paleta, cielo con Fobos y Deimos, niebla, polvo con aire, viento audible, LUMA roja); la Luna conserva Nácar.
- Menú y créditos por destino, botón «Continuar a Marte», logro «Entre remolinos» e historial de intentos en la nave.
- Corregido: las partículas ambientales y el polvo de pasos y dash no se movían (el atributo copiaba el array).
- Corregidas dos pruebas e2e que seguían esperando la consola de diseño sustituida por la nave.

## 2026-11-14 — Primera luz en revisión

- Seis misiones de Tierra y órbita, de la configuración de nave al informe del nodo lunar.
- Diseño de misión con recursos vinculados, pilotaje, EVA, informe de fallo y crucero que reanuda su progreso.
- AUR-E01 y AUR-E02 autenticadas por separado; entrega a Luna sin migrar su partida ni cambiar los assets del kit.

## 2026-11-14 — Kit de mundos v1

- Base local compartida, Luna jugable de referencia y mapas de ensayo en Órbita, Marte y Bennu.
- 20 PNG originales, catálogo, contrato v1 y plantilla para entregar un mundo por separado.
- Planificación, movimiento, diario, terminal, informe y guardado verificados; vuelo y campaña siguen pendientes.

## 2026-10-14 — Revisión 1.2: historia de Aurora y misiones de rescate

- Título de trabajo Órbita: La última luz e historia principal completa con spoilers.
- Búsqueda de Aurora, rescate de la hermana del protagonista y regreso terrestre con supervivientes como objetivo central.
- Las 24 principales detallan acciones, aceptación y su aporte a pistas, rutas o capacidades de rescate.
- Cadena documental AUR-E01–AUR-E07, manifiesto y revelaciones compatibles con el orden libre de Luna y Marte.
- Reabastecimiento en Marte y salida directa hacia Bennu, sustituyendo la escala terrestre intermedia.
- Vínculo de LUMA con Aurora, reencuentro, sacrificio para salvar al jugador y epílogo sin resurrección.
- Objetivo local y seis lugares de demo; contratos, guardado, calidad, tareas y continuidad sincronizados.
- Diez Issues actualizados y verificados, manteniendo los 18 existentes abiertos; handoff de continuidad para agentes.

## 2026-10-14 — Revisión 1.1: campaña, LUMA y pilotaje

- Animal extraterrestre ficticio con traductor y paleta de evolución estelar para LUMA.
- Arco y continuidad posterior separados con spoilers.
- Cuatro capítulos de seis misiones con objetivos y condiciones de avance.
- Bennu como referencia real del destino final; visita y equipos humanos hipotéticos.
- Pilotaje local 2.5D, cruceros acelerados y ADR 004.
- Contratos, guardado, arte, ciencia, calidad y demo sincronizados.

## 2026-10-14 — Preparación documental inicial

- Publicación del plan acordado para un juego web isométrico de exploración y diseño de misiones.
- Creación del cerebro compatible con Obsidian y GitHub.
- Registro de decisiones del propietario, arquitectura, alcance, fuentes y criterios de aceptación.
- Instrucciones para agentes, tareas y continuidad del trabajo.
- Repositorio público y 13 Issues con aceptación, dependencias y etiquetas por fase.
- Separación entre la demo de hackathon y la campaña posterior.

No hay código del juego, assets de producción, dependencias instaladas ni despliegue jugable.
