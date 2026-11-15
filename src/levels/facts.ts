// Title-screen data card and premise for each destination. Physical values come from the linked NASA fact sheet;
// operation, contact and status are story state (fiction).
import type { Localized } from '../core/contract/grid-v1.ts';

export type LevelFacts = {
  operation: string; body: Localized; gravity: string; atmosphere: Localized; temperature: string;
  lastContact: Localized; status: Localized; premise: Localized; source: { url: string; name: string };
};

const t = (es: string, en: string): Localized => ({ es, en });

export const moonFacts: LevelFacts = {
  operation: 'AURORA / C2', body: t('Luna · cráter de referencia', 'Moon · reference crater'), gravity: '1.62 m/s² · 1/6 g',
  atmosphere: t('exosfera, no respirable', 'exosphere, not breathable'), temperature: '−173 … +127 °C',
  lastContact: t('búsqueda suspendida', 'search called off'), status: t('en silencio', 'silent'),
  premise: t('La expedición Aurora desapareció y la búsqueda se suspendió. Tu hermana iba a bordo. Con LUMA, una criatura que nadie terminó de entender, sigues su rastro hasta un cráter de la Luna. Diseña cada salida, gestiona la batería y trae de vuelta lo que ella dejó.',
    'The Aurora expedition vanished and the search was called off. Your sister was on board. With LUMA, a creature no one quite understood, you follow the trail to a crater on the Moon. Design each sortie, manage the battery and bring back what she left behind.'),
  source: { url: 'https://science.nasa.gov/moon/facts/', name: 'NASA · Moon Facts' },
};

export const marsFacts: LevelFacts = {
  operation: 'AURORA / C3', body: t('Marte · valle de Aurora', 'Mars · Aurora valley'), gravity: '3.71 m/s² · 0.38 g',
  atmosphere: t('CO₂ (~95 %), ~1 % de la presión terrestre', 'CO₂ (~95%), ~1% of Earth’s pressure'), temperature: '−153 … +20 °C',
  lastContact: t('relé del valle en silencio', 'valley relay silent'), status: t('mensaje sin leer', 'unread message'),
  premise: t('El registro lunar señaló Marte. Aurora acampó en un valle de capas antiguas y luego desapareció. Con LUMA, cada vez más cansado, reactivas su hábitat, lees lo que dejó tu hermana y buscas el mensaje que el relé nunca llegó a enviar.',
    'The lunar record pointed to Mars. Aurora camped in a valley of ancient layers and then vanished. With LUMA, more tired every day, you bring their habitat back, read what your sister left and look for the message the relay never sent.'),
  source: { url: 'https://science.nasa.gov/mars/facts/', name: 'NASA · Mars Facts' },
};
