// "Model and reality" for the Science screen: each game mechanic next to the NASA data it stands on, labelled as
// observation (taken as published), simplification (the idea is real, the numbers are gameplay) or fiction.
// Every quoted value was read on the linked page on 15 Nov 2026.
import type { Localized } from '../core/contract/grid-v1.ts';

export type Basis = 'observed' | 'simplified' | 'fiction';
export type ScienceRow = { id: string; topic: Localized; real: Localized; game: Localized; basis: Basis; source: { name: string; url: string } | null };

const t = (es: string, en: string): Localized => ({ es, en });
const moonSheet = { name: 'NASA NSSDCA · Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' };
const marsSheet = { name: 'NASA NSSDCA · Mars Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html' };
const suit = { name: 'NASA · Spacewalk Spacesuit Basics', url: 'https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/' };
const moon = { name: 'NASA · Moon Facts', url: 'https://science.nasa.gov/moon/facts/' };
const mars = { name: 'NASA · Mars Facts', url: 'https://science.nasa.gov/mars/facts/' };
const bennu = { name: 'NASA · Bennu Facts', url: 'https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/' };
const iss = { name: 'NASA · Space Station Facts and Figures', url: 'https://www.nasa.gov/international-space-station/space-station-facts-and-figures/' };
const design = { name: 'NASA · Design and Develop Science Missions', url: 'https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf#page=8' };

export const scienceRows: ScienceRow[] = [
  { id: 'suit-power', topic: t('Batería del traje', 'Suit battery'),
    real: t('La mochila del traje da electricidad, oxígeno y refrigeración; una salida dura varias horas.', 'The suit backpack provides electricity, oxygen and cooling; a spacewalk lasts multiple hours.'),
    game: t('Batería de 50, 85 o 120 u. que gastan el soporte vital, caminar y cada acción. El tiempo está comprimido a minutos.', 'A 50, 85 or 120 u battery drained by life support, walking and each action. Time is compressed to minutes.'),
    basis: 'simplified', source: suit },
  { id: 'suit-heat', topic: t('Calor y frío en una EVA', 'Heat and cold on a spacewalk'),
    real: t('De −157 °C a +121 °C al sol (−250 … 250 °F); agua fría circula por la prenda de refrigeración.', 'From −250 °F to 250 °F in sunlight; chilled water flows through the cooling garment.'),
    game: t('La armadura al sol (capítulo 1) y la sombra del cráter (Luna) gastan batería extra: refrigeración o frío.', 'The sunlit truss (chapter 1) and the shadowed crater (Moon) drain extra battery: cooling or cold.'),
    basis: 'simplified', source: suit },
  { id: 'orbit', topic: t('La estación en órbita', 'The station in orbit'),
    real: t('La estación da una vuelta a la Tierra cada ~90 minutos, 16 al día, a unos 8 km/s (5 millas/s).', 'The station circles Earth about every 90 minutes, 16 times a day, at five miles per second.'),
    game: t('Capítulo 1 en una estación de recepción inventada: botas magnéticas y cable de seguridad en lugar de flotar.', 'Chapter 1 on an invented reception station: magnetic boots and a safety tether instead of floating.'),
    basis: 'fiction', source: iss },
  { id: 'moon-gravity', topic: t('Gravedad lunar', 'Lunar gravity'),
    real: t('1,62 m/s², 0,165 de la terrestre.', '1.62 m/s², 0.165 of Earth’s.'),
    game: t('El indicador muestra el valor real; el salto está estilizado para que se pueda jugar.', 'The HUD shows the real value; the jump is stylised to stay playable.'),
    basis: 'observed', source: moonSheet },
  { id: 'moon-temp', topic: t('Sombra y hielo en la Luna', 'Shadow and ice on the Moon'),
    real: t('+127 °C a pleno sol y −173 °C a oscuras; hielo de agua concentrado en cráteres en sombra permanente de los polos.', '127 °C in full Sun and −173 °C in the dark; water ice concentrated in permanently shadowed polar craters.'),
    game: t('El cráter en sombra gasta +0,6 u./s por frío; el forro térmico lo reduce a la mitad.', 'The shadowed crater drains +0.6 u/s to the cold; the thermal liner halves it.'),
    basis: 'simplified', source: moon },
  { id: 'mars-gravity', topic: t('Gravedad y aire de Marte', 'Gravity and air on Mars'),
    real: t('3,73 m/s² (0,380 g); atmósfera de 95,1 % CO₂ a 6,36 mbar.', '3.73 m/s² (0.380 g); atmosphere 95.1% CO₂ at 6.36 mbar.'),
    game: t('El indicador muestra 3,71 m/s², el valor redondeado más citado; el salto conserva el estilo lunar para que se pueda jugar.', 'The HUD shows 3.71 m/s², the commonly quoted rounded value; the jump keeps the lunar style to stay playable.'),
    basis: 'simplified', source: marsSheet },
  { id: 'mars-dust', topic: t('Polvo en Marte', 'Dust on Mars'),
    real: t('A veces el viento levanta tormentas que cubren gran parte del planeta, y el polvo tarda meses en asentarse.', 'Winds sometimes raise storms that cover much of the planet, and the dust can take months to settle.'),
    game: t('Reparar el relé desata un frente de polvo sobre las dunas (1,6 u./s): la causa es ficción, la elección de ruta es el diseño.', 'Repairing the relay sets off a dust front over the dunes (1.6 u/s): the trigger is fiction, choosing the route is the design.'),
    basis: 'fiction', source: mars },
  { id: 'bennu', topic: t('Bennu', 'Bennu'),
    real: t('Medio kilómetro de ancho, una vuelta cada 4,3 h, sin gravedad suficiente para tener atmósfera; partículas sueltas que a veces salen expulsadas. OSIRIS-REx trajo 121,6 g en 2023.', 'Half a kilometre wide, one rotation every 4.3 h, too little gravity for an atmosphere; loose particles sometimes ejected. OSIRIS-REx returned 121.6 g in 2023.'),
    game: t('Microgravedad estilizada con línea de anclaje que limita la altura del salto.', 'Stylised microgravity with an anchor line that caps the jump height.'),
    basis: 'simplified', source: bennu },
  { id: 'trade-offs', topic: t('Compromisos de diseño', 'Design trade-offs'),
    real: t('Una misión científica reparte masa, energía y presupuesto entre instrumentos y sistemas.', 'A science mission shares mass, power and budget between instruments and systems.'),
    game: t('Límite de 28 kg: más batería o instrumentos pesan y bajan el salto; el informe une cada pieza con su resultado.', '28 kg limit: more battery or instruments weigh more and lower the jump; the report links each part to its result.'),
    basis: 'simplified', source: design },
  { id: 'link', topic: t('Enlace de radio', 'Radio link'),
    real: t('Sin cifra pública que reproducir: las antenas y alcances no copian ningún equipo real.', 'No published figure reproduced: antennas and ranges do not copy any real hardware.'),
    game: t('Antena de 70, 100 o 130 m; fuera del enlace LUMA te trae de vuelta.', '70, 100 or 130 m antenna; out of range, LUMA brings you back.'),
    basis: 'fiction', source: null },
  { id: 'story', topic: t('Aurora, LUMA y las ruinas', 'Aurora, LUMA and the ruins'),
    real: t('No existen: son la historia.', 'They do not exist: they are the story.'),
    game: t('La expedición, la criatura con traductor, las páginas del diario y la evacuación.', 'The expedition, the creature with a translator, the journal pages and the evacuation.'),
    basis: 'fiction', source: null },
];
