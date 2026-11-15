---
id: audio-3d
type: arte
status: aplicado-en-luna
updated: 2026-11-14
tags: [orbita, arte, audio, 3d]
---
# Audio

Todo el audio se genera en tiempo real con Web Audio ([audio.ts](../../src/engine/audio.ts)): no hay archivos de sonido ni licencias de terceros, y la descarga no crece. El propietario pidió un sonido maduro, de registro grave y espacial.

## Música generativa

- **Tonalidad:** Re eólico, en registro grave. Ciclo de acordes Rem(add9) → Si♭maj7 → Solm9 → La sus4, uno cada 16–18 s, con 5 s de fundido cruzado.
- **Dron sub:** Re1 y Re2, con un batido lento por desafinación. Sostiene el grave bajo todo lo demás.
- **Pad:** sierras desafinadas por un filtro paso bajo que "respira" con un LFO de unos 14 s.
- **Campanas sueltas:** una cada 3–9 s, en una reverberación larga y oscura generada con ruido (sin archivos de impulso).
- **Ánimos:**

| Ánimo | Cuándo suena | Carácter |
| --- | --- | --- |
| menu | Menú y diseño | El más abierto |
| surface | Superficie | Por defecto en la salida |
| cold | Cráter en sombra | Filtro más cerrado y campanas una octava abajo |
| complete | Informe de misión completa | Resuelve |
| recalled | Informe de repliegue | Más oscuro |

## Efectos

En la Luna no hay aire. Lo que se oye es lo que llega a través del traje: sonidos sordos y graves.

| Evento | Sonido | Lectura de earshot |
| --- | --- | --- |
| Paso | Golpe sordo filtrado | "golpe sordo suave", plausible |
| Aterrizaje | Golpe grave | "golpe pesado", fuerte |
| Dash | Soplido con barrido | "soplido", fuerte |
| Doble salto | Siseo de gas a presión | "siseo de gas", plausible |
| Escaneo | Tono que sube | "tono de escaneo", plausible |
| Objetivo | Tres notas Re–La–Re | "campana de éxito", débil |
| Bloqueo | Zumbido de dos sierras | "zumbido de error", débil |
| Logro | Acorde que crece | "pad cálido", plausible |
| Batería en reserva | Latido | "latido", plausible |
| LUMA habla | Trinos con vibrato (traductor) | Lo lee como sintetizador; decisión de estilo |
| Control habla | Estática corta y tono Quindar de 2525 Hz (el pitido de las comunicaciones del Apolo) | Lo lee como campanita; decisión de estilo |
| Señal débil | Estática continua proporcional a la pérdida de enlace | — |

## Cómo se verificó

No se puede escuchar desde el agente. Por eso cada sonido se renderiza sin conexión (`renderWav` con `OfflineAudioContext`) y se analiza con [earshot](https://github.com/Leonxlnx/earshot) (MIT, modelos CLAP y AST en CPU, ejecutado con `uvx` sin instalarlo de forma global):

- `earshot describe` sobre la música del menú: "pad de sintetizador ambiental" (+3,8), "oscura y tensa", brillo de 265 Hz.
- `earshot describe` sobre el cráter frío: brillo de 158 Hz.
- `earshot match` sobre cada efecto, contra su descripción y alternativas.

Se rediseñaron cinco efectos que se leían como batería o palmas. El paso y la radio de Control quedan como decisiones de diseño documentadas en la tabla.

## Controles

Ajustes → volumen general, música y efectos. El audio se activa con el primer clic o tecla (norma de los navegadores) y se pausa al ocultar la pestaña.
