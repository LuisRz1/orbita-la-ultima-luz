// Story lines for Bennu. Chapter 4 tone: LUMA in its blue-white phase, tired and tender; nobody names what is coming
// (brain/02-Diseno/ARCO-LUMA-SPOILERS.md). The sister speaks only at the refuge, after AUR-E06 is validated in person.
import type { Line, Speaker } from '../moon/dialogue.ts';

const l = (speaker: Speaker, es: string, en: string): Line => ({ speaker, text: { es, en } });

export const bennuDialogue: Record<string, Line[]> = {
  intro: [
    l('CONTROL', 'Contacto en Bennu. Velocidad igualada. Aquí no hay suelo que te sujete: ancla primero, camina despacio.',
      'Contact on Bennu. Velocity matched. There is no ground here to hold you: anchor first, walk slowly.'),
    l('LUMA', 'Ya he estado aquí. No lo recuerdo con los ojos… lo recuerdo con la luz.', 'I have been here before. I do not remember it with my eyes… I remember it with my light.'),
  ],
  'point:voice': [
    l('CONTROL', 'Canal local abierto. Hay respuesta. El refugio está ocupado.', 'Local channel open. There is an answer. The refuge is occupied.'),
    l('LUMA', 'Están ahí. Vamos con cuidado. No quiero que se nos caiga nada encima… ni a ellos.', 'They are there. Let us go carefully. I do not want anything falling on us… or on them.'),
  ],
  'zone:blocks': [
    l('LUMA', 'Estas piedras están apoyadas unas en otras, como cartas. Si empujas una, se mueven todas.', 'These stones lean on each other like cards. Push one and they all move.'),
  ],
  'zone:ridge': [
    l('LUMA', 'Aquí la grava está apretada. Por aquí sí se puede volver con gente.', 'The gravel is packed here. This way we can come back with people.'),
  ],
  'zone:dayside': [
    l('LUMA', 'El sol quema en esta cara. Mi luz se pone pálida. No pasa nada… solo vamos rápido.', 'The sun burns on this side. My light goes pale. It is nothing… let us just be quick.'),
  ],
  'zone:monolith': [
    l('LUMA', 'Este bloque es más viejo que todo lo que conozco. Y aun así está suelto, como nosotros.', 'This block is older than anything I know. And still it is loose, like us.'),
  ],
  recalled: [
    l('LUMA', 'Volvemos al anclaje. Ellos siguen ahí. Lo intentamos otra vez, mejor.', 'Back to the anchor. They are still there. We try again, better.'),
  ],
  complete: [
    l('AURORA', '…¿Eres tú? Te reconocí por la forma de caminar. Siempre ibas con prisa.', '…Is that you? I knew you by the way you walk. You were always in a hurry.'),
    l('AURORA', 'Somos cuatro. Todos vivos. Los demás no se creían que alguien vendría.', 'There are four of us. All alive. The others did not believe anyone would come.'),
    l('LUMA', 'Te dije que la encontraríamos. Te lo dije con las orejas, pero te lo dije.', 'I told you we would find her. I said it with my ears, but I said it.'),
    l('AURORA', 'Y tú… volviste. Pensé que la cápsula no llegaría a ninguna parte.', 'And you… came back. I thought the capsule would never reach anywhere.'),
    l('CONTROL', 'AUR-E06 validada en persona. Manifiesto confirmado: cuatro supervivientes. Preparad la evacuación y las reservas para volver todos.',
      'AUR-E06 validated in person. Manifest confirmed: four survivors. Prepare the evacuation and the reserves to bring everyone home.'),
  ],
};
