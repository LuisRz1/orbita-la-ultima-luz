// Story lines for the lunar level. Each sequence plays once per save. Chapter 2 tone: LUMA is warm but tires sooner.
// Rules from the main story: no line may name later destinations or evidence; the demo recovers only part of the trail.
import type { Localized } from '../../core/contract/grid-v1.ts';

export type Speaker = 'LUMA' | 'CONTROL' | 'AURORA';
export type Line = { speaker: Speaker; text: Localized };
const l = (speaker: Speaker, es: string, en: string): Line => ({ speaker, text: { es, en } });

export const moonDialogue: Record<string, Line[]> = {
  intro: [
    l('CONTROL', 'Enlace de superficie abierto. El relé del pico lleva días en silencio: sin él, nada de lo que encuentres llega a casa.',
      'Surface link open. The relay on the peak has been silent for days: without it, nothing you find reaches home.'),
    l('LUMA', 'Huele a polvo viejo. Y a algo que conozco… Tu hermana estuvo aquí. Lo sé por las marcas del refugio.',
      'It smells of old dust. And of something I know… Your sister was here. I can tell from the marks on the shelter.'),
    l('LUMA', 'Primero lo que pide la misión. Después, si quieres, buscamos sus ecos.',
      'First what the mission needs. Then, if you like, we look for her echoes.'),
  ],
  'zone:peak': [
    l('LUMA', 'Desde arriba se ve todo el cráter. Por eso pusieron aquí el relé.', 'From up here you can see the whole crater. That is why the relay is here.'),
  ],
  'zone:shadow': [
    l('LUMA', 'Aquí el sol no llega nunca. Mi traductor dice «frío». Yo digo «date prisa».', 'The sun never reaches this place. My translator says “cold”. I say “hurry”.'),
  ],
  'zone:rift': [
    l('LUMA', 'Es ancha. Salta y lánzate en el aire… o rodéala por los extremos. Las dos cosas valen.', 'It is wide. Jump and dash in the air… or go around the ends. Both are fine.'),
  ],
  'zone:archive': [
    l('LUMA', 'Ese contenedor lleva su sello. Lo cerró con cuidado, como quien piensa volver.', 'That container carries her seal. She closed it carefully, like someone who meant to come back.'),
  ],
  // Chapter 2 shows, in safe conditions, that LUMA can cross narrow spaces with its own protection and work simple
  // mechanisms (ARCO-LUMA-SPOILERS.md). The extraction on Bennu relies on the player having seen it here.
  'point:archive': [
    l('LUMA', 'El bloque se quedó encajado al fondo. Espera: yo quepo por el hueco.', 'The block got stuck at the back. Wait: I fit through the gap.'),
    l('LUMA', '…Mi luz me protege del frío de ahí dentro. Ya solté la traba. Tira ahora.', '…My light keeps the cold in there off me. I released the catch. Pull now.'),
  ],
  recalled: [
    l('LUMA', 'Volvemos. No es perder: ahora sabemos cuánto cuesta el camino.', 'We head back. It is not losing: now we know what the path costs.'),
    l('LUMA', '…Y yo necesitaba descansar un poco. No se lo digas a Control.', '…And I needed a little rest. Do not tell Control.'),
  ],
  complete: [
    l('CONTROL', 'Recibido el registro parcial de Aurora. Todavía no basta para saber adónde fue.', 'Partial Aurora record received. It is not enough yet to know where they went.'),
    l('LUMA', 'Pero ya sabemos que pasó por aquí. Es más de lo que teníamos ayer.', 'But now we know she passed through here. That is more than we had yesterday.'),
  ],
};
