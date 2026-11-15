// Story lines for the chapter 1 station. Each sequence plays once per save.
// Before the protected bay is opened the player has not met LUMA, so only Control speaks in any sequence that can
// play earlier (intro, zones, recall). LUMA speaks after the translator is calibrated (`point:` sequences play right
// after that point is completed). Nothing names Mars, Bennu or the survivors: chapter 1 only knows the capsule.
import type { Line, Speaker } from '../moon/dialogue.ts';

const l = (speaker: Speaker, es: string, en: string): Line => ({ speaker, text: { es, en } });

export const orbitDialogue: Record<string, Line[]> = {
  intro: [
    l('CONTROL', 'Acople confirmado. Te damos la bienvenida a la estación de recepción. La cápsula de Aurora está en la cuna, al oeste del puerto.',
      'Docking confirmed. Welcome aboard the reception station. Aurora’s capsule is in the cradle, west of the port.'),
    l('CONTROL', 'Sabemos que alguien la envió después del incidente. No sabemos quién, ni si sigue vivo. Por eso estás aquí.',
      'We know someone sent it after the incident. We do not know who, or whether they are still alive. That is why you are here.'),
    l('CONTROL', 'El compartimento protegido lleva días con lecturas de movimiento. Ábrelo con cuidado.',
      'The protected bay has shown movement readings for days. Open it carefully.'),
  ],
  'zone:cradle': [
    l('CONTROL', 'La cuna sujeta la cápsula tal como llegó. No hemos tocado el compartimento: queríamos que lo abrieras tú.',
      'The cradle holds the capsule as it arrived. We have not touched the bay: we wanted you to open it.'),
  ],
  'zone:sunlit': [
    l('CONTROL', 'Sol directo en la armadura. Los paneles superan los cien grados: el traje gastará batería en refrigerarse.',
      'Direct sunlight on the truss. The panels go past a hundred degrees: the suit will spend battery on cooling.'),
  ],
  'zone:shade': [
    l('CONTROL', 'Baranda en sombra. Más larga, pero el traje no se calienta. Sigue las luces.', 'Shaded handrail. Longer, but the suit stays cool. Follow the lights.'),
  ],
  'zone:boom': [
    l('CONTROL', 'El registrador está al final del brazo. Grabó la llegada de la cápsula y el código de un enlace.',
      'The recorder is at the end of the boom. It logged the capsule’s arrival and the code of a link.'),
  ],
  'point:protected-bay': [
    l('CONTROL', 'Presión estable… Hay algo vivo ahí dentro. No es humano. Tranquilidad: no hagas movimientos bruscos.',
      'Pressure stable… There is something alive in there. It is not human. Easy: no sudden moves.'),
    l('CONTROL', 'Responde a gestos. Calibra el traductor del compartimento antes de seguir.', 'It responds to gestures. Calibrate the bay translator before going on.'),
  ],
  'point:translator': [
    l('LUMA', '…¿Me entiendes? Me llamo LUMA. Ella me puso el nombre. Tu hermana.', '…Do you understand me? My name is LUMA. She gave me the name. Your sister.'),
    l('LUMA', 'Huele a ella, tu traje. Iré contigo. No sé dónde está… pero sé que no me dejó por nada.',
      'Your suit smells of her. I will go with you. I do not know where she is… but I know she did not leave me for nothing.'),
  ],
  recalled: [
    l('CONTROL', 'El cable de seguridad te trajo de vuelta. Revisa el informe: la batería y la ruta dicen qué cambiar.',
      'The safety tether brought you back. Check the report: the battery and the route tell you what to change.'),
  ],
  complete: [
    l('CONTROL', 'AUR-E01 y AUR-E02 validadas. El enlace del registrador apunta al archivo del relé lunar: ahí está el tramo de navegación que falta.',
      'AUR-E01 and AUR-E02 validated. The recorder’s link points to the lunar relay archive: the missing navigation segment is there.'),
    l('LUMA', 'La Luna… Ella la miraba mucho por la ventana. Vamos.', 'The Moon… She used to look at it a lot through the window. Let us go.'),
    l('CONTROL', 'Preparamos tu traslado al nodo lunar. LUMA viajará en su cápsula protegida.', 'We are preparing your transfer to the lunar node. LUMA will travel in its protected pod.'),
  ],
};
