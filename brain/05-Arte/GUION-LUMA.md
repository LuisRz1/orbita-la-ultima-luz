---
id: guion-voz-luma
type: arte
status: texto-bilingue
updated: 2026-11-15
tags: [orbita, luma, audio, spoilers]
---
# Guion de LUMA · ES / EN

Esta nota contiene spoilers. El subtítulo exacto que debe corresponder a cada grabación está en los módulos de diálogo. Las grabaciones incluidas pertenecen a `src/assets/voice/luma/`. Para integrar una toma del propietario, añade una entrada a [clips.json](../../public/assets/voice/luma/clips.json) con la clave `escena/evento/índice/es` o `escena/evento/índice/en`. La entrada del manifiesto tiene prioridad sobre la grabación incluida.

## Reproducción en la campaña

| Momento | Claves y guion |
| --- | --- |
| Estación | `station/point:translator/0–1` y `station/chat/1` usan las líneas del [primer saludo](../../src/levels/orbit/dialogue.ts). |
| Luna | Las líneas de ubicación, recuperación del archivo y regreso reutilizan el [guion lunar](../../src/levels/moon/dialogue.ts). `moon/intro/1`, `moon/point:habitat/0` y `moon/chat/0` toman la grabación que corresponde al texto en [la campaña lunar](../../src/levels/moon/campaign.ts). |
| Marte | `mars/intro/0–1` y `mars/chat/0` usan las tomas del [guion marciano](../../src/levels/mars/dialogue.ts), con el cansancio de la fase roja. |
| Bennu | `bennu/chat/0`, `bennu/point:contact/0` y `bennu/point:sister/1` toman las grabaciones del [guion de Bennu](../../src/levels/bennu/dialogue.ts). |
| Módulo de servicio | `service/intro/0`, `service/point:disconnect/1` y `service/point:life-line/0` usan el [guion de extracción](../../src/levels/extraction/dialogue.ts). |
| Cinemáticas | `scene-moon/line/1`, `scene-mars/line/1` y `scene-bennu/line/1` tienen clips incluidos. Los usa el [reproductor de campaña](../../src/ui/screens/campaign-scenes.tsx) tras archivar el hito del capítulo. |

## Tomas pendientes

| Clave antes del idioma | Español | English |
| --- | --- | --- |
| `station/chat/0` | ¿Puedes hacer el saludo otra vez? Cuando oigo los dos pulsos, sé que estás cerca. | Can you greet me again? When I hear the two pulses, I know you are close. |
| `station/point:keepsake/0` | Dormía junto a su mesa. Si me asustaba el ruido, ella dejaba la mano a mi lado hasta que se me pasaba. | I slept by her desk. If the noise frightened me, she left her hand beside me until it passed. |
| `moon-cruise/chat/0` | ¿Puedes dejar la luz encendida? Me dormí un momento. Quiero estar despierto cuando lleguemos. | Can you leave the light on? I fell asleep for a moment. I want to be awake when we arrive. |
| `moon/chat/1` | Aquí las sombras tienen un borde limpio. Quédate un momento conmigo donde todavía llega la luz. | The shadows have a sharp edge here. Stay with me for a moment while there is still light. |
| `moon/point:habitat/1` | Yo paso por el conducto. Tú mira desde la consola. Así no perdemos el enlace cuando cierre la tapa. | I can fit through the duct. Watch from the console so we keep the link when the cover shuts. |
| `moon/point:habitat/2` | ¿Nos quedamos aquí un momento? Desde el alunizaje me cuesta más seguirte. | Can we stay here a moment? It has been harder to keep up since we landed. |
| `mars/point:luma-rest/0` | Ella también me dejaba algo tibio cerca. Así aprendí que podía quedarme. | She used to leave something warm nearby too. That is how I learned I could stay. |
| `bennu/chat/1` | Ajusta tu línea. Si no puedes oír al traductor, mira mis dos patas. Aquí estoy. | Check your line. If you cannot hear the translator, look at my two paws. I am here. |
| `bennu/intro/0` | Si oyes su voz antes que yo, dime qué dice. Hoy el traductor tarda. | If you hear her voice first, tell me what she says. The translator is slow today. |
| `service/point:safe-bay/0` | ¿Te quedas aquí? Solo un momento. Ya veo a tu hermana. | Will you stay here? Just for a moment. I can see your sister. |

Cuando una línea no tiene grabación, conserva su subtítulo. Después de la despedida, el epílogo y las expediciones posteriores conservan el silencio de LUMA.
