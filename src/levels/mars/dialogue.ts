// Story lines for the Martian level. Each sequence plays once per save. Chapter 3 tone: LUMA's red phase; both
// acknowledge the wear, LUMA chooses to go on and nobody promises a cure (brain/02-Diseno/ARCO-LUMA-SPOILERS.md).
// Only `complete`, played after the terminal authenticates AUR-E04 and AUR-E05 together, may name Bennu.
import type { Line, Speaker } from '../moon/dialogue.ts';

const l = (speaker: Speaker, es: string, en: string): Line => ({ speaker, text: { es, en } });

export const marsDialogue: Record<string, Line[]> = {
  intro: [
    l('CONTROL', 'Enlace con Marte abierto. La luz tarda minutos en ir y volver: no esperes respuestas al momento. Planifica antes de actuar.',
      'Mars link open. Light takes minutes to go and come back: do not expect answers right away. Plan before you act.'),
    l('CONTROL', 'El registro lunar nos trajo a este valle. El campamento de Aurora lleva meses en silencio.',
      'The lunar record brought us to this valley. Aurora’s camp has been silent for months.'),
    l('LUMA', 'Este viento me cansa más que el frío de la Luna. Lo noto en las patas… Pero quiero estar aquí.',
      'This wind tires me more than the cold on the Moon. I feel it in my legs… But I want to be here.'),
    l('LUMA', 'Primero el hábitat. Si tu hermana dejó algo escrito, estará dentro.', 'The habitat first. If your sister left anything written, it will be inside.'),
  ],
  'zone:dunes': [
    l('LUMA', 'La arena se mueve sola. Cuando sopla fuerte, se come la batería. Las balizas marcan otro camino por los vados.',
      'The sand moves by itself. When the wind is strong it eats the battery. The lit posts mark another way through the fords.'),
  ],
  'zone:channel': [
    l('LUMA', 'Aquí corrió agua hace muchísimo tiempo. Se puede saltar… o bajar por los vados, donde están las luces.',
      'Water ran here a very long time ago. You can jump it… or go down through the fords, where the lights are.'),
  ],
  'zone:mesa': [
    l('LUMA', 'Capas y capas, como páginas. Tu hermana las midió una a una.', 'Layers and layers, like pages. Your sister measured them one by one.'),
  ],
  'zone:relay': [
    l('LUMA', 'Ese relé escuchó algo que nadie llegó a oír. Me tiemblan las orejas.', 'That relay heard something nobody got to hear. My ears are trembling.'),
  ],
  'zone:head': [
    l('LUMA', 'Dejaron el equipo con prisa. Como quien sale corriendo a buscar algo.', 'They left their kit in a hurry. Like someone running off to look for something.'),
  ],
  storm: [
    l('LUMA', 'Con tanto polvo me cuesta respirar… Vamos por el camino largo. No es perder tiempo: es llegar.',
      'With all this dust I find it hard to breathe… Let us take the long way. It is not wasting time: it is getting there.'),
  ],
  recalled: [
    l('LUMA', 'Volvemos. El valle seguirá aquí, y ahora sabemos lo que cuesta cruzarlo.', 'We head back. The valley will still be here, and now we know what it costs to cross.'),
    l('LUMA', '…Gracias por parar. Hoy estoy más rojo que ayer. Ya lo sé.', '…Thank you for stopping. I am redder today than yesterday. I know.'),
  ],
  complete: [
    l('CONTROL', 'Mensaje autenticado: integridad completa, fecha posterior a la avería. Lo cruzamos con la bitácora y la copia de navegación.',
      'Message authenticated: full integrity, dated after the failure. We matched it against the log and the navigation copy.'),
    l('CONTROL', 'Aurora se desvió hacia Bennu siguiendo la baliza. Hay supervivientes. Tu hermana está en el manifiesto.',
      'Aurora diverted to Bennu following the beacon. There are survivors. Your sister is on the manifest.'),
    l('LUMA', 'Bennu… Ahí me encontraron, ¿verdad? Lo recuerdo poco: una luz, y manos con guantes.',
      'Bennu… That is where they found me, isn’t it? I remember little: a light, and gloved hands.'),
    l('LUMA', 'Sé que cada día brillo distinto. No hace falta que lo digas. Vamos a buscarla igual.',
      'I know I glow differently every day. You do not need to say it. We are going to find her anyway.'),
    l('CONTROL', 'Empezamos a reconfigurar la nave en el nodo marciano: plazas, soporte vital y reservas para volver con todos.',
      'We are starting to reconfigure the ship at the Mars node: seats, life support and reserves to bring everyone home.'),
  ],
};
