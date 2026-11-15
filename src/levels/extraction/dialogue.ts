// Extraction and farewell (C4-M04–M05). Written, never generated. Few words, physical presence and silence.
// The farewell may recall only what the player really recorded (Memories); it changes nuance, never the outcome.
import type { Line, Speaker } from '../moon/dialogue.ts';
import type { Memories } from '../memories.ts';

const l = (speaker: Speaker, es: string, en: string): Line => ({ speaker, text: { es, en } });

export const extractionDialogue: Record<string, Line[]> = {
  intro: [
    l('CONTROL', 'Supervivientes confirmados. Prepara la evacuación: soporte vital, reservas, carga y la última desconexión.',
      'Survivors confirmed. Prepare the evacuation: life support, reserves, cargo and the last undocking.'),
    l('LUMA', 'Ella me ha tocado la cabeza. Como antes. Ya podemos irnos.', 'She touched my head. Like before. We can go now.'),
  ],
  'point:life-support': [
    l('AURORA', 'Estamos todos dentro. Ve a soltar el módulo; te esperamos.', 'We are all inside. Go and release the module; we will wait for you.'),
  ],
  'point:undock': [
    l('CONTROL', 'La desconexión se ha atascado. El seguro no suelta y te deja del lado exterior.', 'The undocking has jammed. The latch will not release and leaves you on the outside.'),
    l('CONTROL', 'La liberación manual está al otro lado de ese conducto. Tu traje no cabe y las herramientas no llegan desde ahí.',
      'The manual release is on the other side of that duct. Your suit does not fit and the tools cannot reach from there.'),
    l('LUMA', 'Yo sí quepo. Mi luz me protege. Ya pasé por sitios así.', 'I fit. My light protects me. I have been through places like this.'),
    l('LUMA', 'Me va a costar. Lo sé. Déjame hacerlo. Quiero hacerlo.', 'It will cost me. I know. Let me do it. I want to.'),
    l('CONTROL', 'Seguro liberado. La nave está libre.', 'Latch released. The ship is free.'),
    l('LUMA', '…Ya está. Ven a por mí. Llévame dentro.', '…Done. Come and get me. Take me inside.'),
  ],
};

/** The goodbye, built from the player's recorded memories (at most two of them). */
export function farewell(m: Memories): Line[] {
  const recalled: Line[] = [];
  if (m.pages.includes('ruin-dish')) recalled.push(l('LUMA', 'Ella escribió que la Tierra cabía detrás de un pulgar. Mírala ahora.', 'She wrote that the Earth fit behind a thumb. Look at it now.'));
  if (m.beacons) recalled.push(l('LUMA', 'Encendiste sus balizas en la Luna. Yo las veía desde lejos. Así se ve volver.', 'You lit her beacons on the Moon. I watched them from far away. That is what coming home looks like.'));
  if (m.atlas > 0) recalled.push(l('LUMA', 'Guardaste piedras de todos los sitios. Ahora sabes de qué están hechos.', 'You kept stones from every place. Now you know what they are made of.'));
  if (m.echoes > 0) recalled.push(l('LUMA', 'Encontraste sus ecos. Yo solo los olía; tú los veías.', 'You found her echoes. I could only smell them; you could see them.'));
  if (!recalled.length) recalled.push(l('LUMA', 'No hace falta recordar nada. Estuvimos.', 'We do not need to remember anything. We were there.'));
  return [
    l('LUMA', 'Aquí dentro se está caliente. Huele a ella.', 'It is warm in here. It smells of her.'),
    ...recalled.slice(0, 2),
    l('LUMA', 'Gracias por llevarme. Me gustó ir contigo.', 'Thank you for carrying me. I liked going with you.'),
    l('LUMA', '…', '…'),
    l('AURORA', 'Lo llevamos con nosotros. Hasta casa.', 'We take it with us. All the way home.'),
    l('CONTROL', 'Nave liberada. Rumbo a la Tierra con todos a bordo.', 'Ship released. Course set for Earth with everyone aboard.'),
  ];
}
