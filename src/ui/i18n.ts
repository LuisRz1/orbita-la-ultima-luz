// Interface strings in Spanish and English. Game content (missions, dialogue, reports) carries its own texts.
import { useStore } from 'zustand';
import type { Localized } from '../core/contract/grid-v1.ts';
import { prefs } from './prefs.ts';

const s = (es: string, en: string): Localized => ({ es, en });

export const strings = {
  loading: s('CARGANDO SUPERFICIE…', 'LOADING SURFACE…'),
  eva: s('EVA · SUPERFICIE', 'EVA · SURFACE'),
  objectives: s('objetivos', 'objectives'), nextGoal: s('siguiente', 'next'), allDone: s('vuelve al módulo', 'head back to the lander'), echoes: s('ecos', 'echoes'), atlas: s('atlas', 'atlas'), beacons: s('balizas', 'beacons'), pages: s('diario', 'journal'), journal: s('Atlas y diario', 'Atlas and journal'), paintedSky: s('cielo pintado', 'painted sky'), accessory: s('accesorio', 'accessory'), epilogue: s('Epílogo', 'Epilogue'), patches: s('parches', 'patches'), patchOn: s('Llevar', 'Wear'), patchOff: s('Quitar', 'Remove'), noAccessory: s('Sin accesorio', 'No accessory'), observation: s('observación', 'observation'), simplification: s('simplificación', 'simplification'), optional: s('opc', 'opt'),
  link: s('ENLACE', 'LINK'), signal: s('Señal', 'Signal'), systems: s('SISTEMAS', 'SYSTEMS'), battery: s('batería', 'battery'),
  reserve: s('reserva de retorno', 'return reserve'), energy: s('Energía', 'Energy'),
  gravityNote: s('movimiento estilizado', 'stylised movement'),
  requires: s('requiere', 'requires'), suitLacks: s('el traje no lleva', 'the suit has no'),
  hint: s('clic para controlar la cámara · WASD mover · Espacio saltar (x2 en el aire) · Shift dash · E usar · Esc pausa',
    'click to control the camera · WASD move · Space jump (x2 in the air) · Shift dash · E use · Esc pause'),
  noticeLuma: s('LUMA', 'LUMA'), noticeWarn: s('AVISO', 'WARNING'), noticeSystem: s('SISTEMA', 'SYSTEM'),
  briefing: s('BRIEFING', 'BRIEFING'), saveError: s('Guardado local no disponible: el progreso no se conservará al recargar.', 'Local save unavailable: progress will not survive a reload.'),
  // design console
  designTitle: s('01 / DISEÑO DE TRAJE EVA', '01 / EVA SUIT DESIGN'), evaluation: s('02 / EVALUACIÓN', '02 / EVALUATION'),
  slotBattery: s('energía', 'power'), slotThruster: s('propulsor', 'thruster'), slotAntenna: s('enlace', 'link'), instruments: s('instrumentos', 'instruments'),
  previous: s('anterior', 'previous'), next: s('siguiente', 'next'),
  noAirJump: s('sin doble salto', 'no double jump'), airJump: s('doble salto', 'double jump'), longDash: s('dash largo', 'long dash'),
  mass: s('masa', 'mass'), requiredObjectives: s('objetivos obligatorios', 'required objectives'), margin: s('margen para moverte', 'margin to move'),
  jumpHeight: s('altura de salto (mantén Espacio)', 'jump height (hold Space)'), upTo: s('hasta', 'up to'),
  marginNote: s('sin contar frío ni saltos', 'excluding cold and jumps'), airJumpsLeft: s('dobles saltos', 'double jumps'), airDash: s('doble salto · dash', 'double jump · dash'), linkRange: s('alcance de enlace', 'link range'),
  learnOnly: s('Puedes salir así, pero no completarás la misión. Sirve para aprender.', 'You can head out like this, but you will not complete the mission. It is a way to learn.'),
  startEva: s('Iniciar EVA ↗', 'Start EVA ↗'), attempts: s('intentos', 'attempts'), complete: s('completa', 'complete'), recalled: s('repliegue', 'recall'),
  designDialog: s('Diseño de traje', 'Suit design'),
  // report
  reportTitle: s('03 / INFORME DE SALIDA', '03 / SORTIE REPORT'), reportRegion: s('Informe de salida', 'Sortie report'),
  transmission: s('Transmisión recibida', 'Transmission received'), partial: s('Repliegue con datos parciales', 'Recall with partial data'),
  required: s('obligatorios', 'required'), energyUsed: s('energía usada', 'energy used'), duration: s('duración', 'duration'),
  missedWhy: s('pendiente y por qué', 'pending and why'), whereEnergy: s('a dónde fue la batería', 'where the battery went'),
  engineering: s('lectura de ingeniería', 'engineering reading'), redesign: s('Rediseñar traje', 'Redesign suit'), retry: s('Repetir con este diseño', 'Retry with this design'),
  energyTrace: s('energía durante la salida', 'battery during the sortie'), hazardEntered: s('zona de gasto', 'drain zone'),
  linkLostMark: s('enlace perdido', 'link lost'), reserveReached: s('reserva alcanzada', 'reserve reached'),
  decisionResult: s('decisión → resultado', 'decision → result'), vsPrevious: s('frente al intento anterior', 'versus the previous attempt'),
  sameDesign: s('Mismo diseño: solo cambió cómo jugaste.', 'Same design: only your play changed.'), result: s('resultado', 'result'),
  tryNext: s('qué probar ahora', 'what to try next'), loadProposal: s('Probar esta propuesta ↗', 'Try this proposal ↗'),
  environment: s('entorno', 'environment'), attemptN: s('intento', 'attempt'),
  adviceNote: s('Las propuestas salen de reglas fijas sobre este informe; no cambian tu progreso.', 'Proposals come from fixed rules over this report; they never change your progress.'),
  modelNote: s('Valores de juego. La gravedad, la batería y el enlace son simplificaciones educativas, no datos de una misión real.',
    'Gameplay values. Gravity, battery and link are educational simplifications, not data from a real mission.'),
  // ship
  suitStatus: s('Estado del traje', 'Suit status'), freeEnergy: s('energía libre', 'free energy'), use: s('Usar', 'Use'),
  confirmKey: s('Confirmar · E', 'Confirm · E'),
  overMass: s('ajusta otra pieza antes de salir', 'adjust another part before leaving'),
  shipHint: s('WASD moverse · E usar el puesto iluminado · ratón para mirar', 'WASD move · E use the lit station · mouse to look'),
  stBattery: s('Soporte de baterías', 'Battery rack'), stThruster: s('Propulsores', 'Thrusters'), stAntenna: s('Antenas', 'Antennas'),
  stInstruments: s('Banco de instrumentos', 'Instrument bench'), stLocker: s('Taquilla', 'Locker'), stAirlock: s('Esclusa', 'Airlock'),
  why_battery: s('Más batería = más tiempo fuera, pero pesa y te hace saltar menos.', 'More battery = more time outside, but it is heavy and you jump lower.'),
  why_thruster: s('El propulsor da el doble salto: atajos y ecos altos. Cada uso gasta batería.', 'The thruster gives a double jump: shortcuts and high echoes. Each use costs battery.'),
  why_antenna: s('La antena fija hasta dónde llega tu enlace. Fuera de él, LUMA te trae de vuelta.', 'The antenna sets how far your link reaches. Beyond it, LUMA brings you back.'),
  why_instruments: s('Cada objetivo necesita su instrumento. No caben todos sin pasar de 28 kg.', 'Each objective needs its instrument. They do not all fit under 28 kg.'),
  why_locker: s('', ''), why_airlock: s('', ''),
  // menu, pause, settings
  subtitle: s('LA ÚLTIMA LUZ', 'THE LAST LIGHT'),
  premise: s('La expedición Aurora desapareció y la búsqueda se suspendió. Tu hermana iba a bordo. Con LUMA, una criatura que nadie terminó de entender, sigues su rastro hasta un cráter de la Luna. Diseña cada salida, gestiona la batería y trae de vuelta lo que ella dejó.',
    'The Aurora expedition vanished and the search was called off. Your sister was on board. With LUMA, a creature no one quite understood, you follow the trail to a crater on the Moon. Design each sortie, manage the battery and bring back what she left behind.'),
  loopTitle: s('Cómo se juega', 'How it plays'),
  loopDesign: s('Diseña', 'Design'), loopDesignHint: s('el traje: masa, batería, instrumentos', 'the suit: mass, battery, instruments'),
  loopExplore: s('Explora', 'Explore'), loopExploreHint: s('cada acción gasta batería', 'every action costs battery'),
  loopReport: s('Evalúa', 'Evaluate'), loopReportHint: s('qué decisión causó qué', 'which decision caused what'),
  loopRedesign: s('Rediseña', 'Redesign'), loopRedesignHint: s('fallar no bloquea', 'failing never blocks you'),
  route: s('Ruta de la búsqueda', 'Search route'), demoOpen: s('modo demo: todo abierto', 'demo mode: all open'),
  travelTo: s('Viajar a', 'Travel to'), routeLocked: s('completa el destino anterior', 'complete the previous destination'),
  continueTo: s('Continuar a', 'Continue to'), outcomeTitle: s('lo que ahora sabemos', 'what we know now'),
  continue: s('Continuar', 'Continue'),newExpedition: s('Nueva expedición', 'New expedition'), settings: s('Ajustes', 'Settings'),
  achievements: s('Logros', 'Achievements'), credits: s('Créditos y fuentes', 'Credits and sources'), back: s('Volver', 'Back'),
  operation: s('operación', 'operation'), body: s('cuerpo', 'body'), gravity: s('gravedad', 'gravity'), atmosphere: s('atmósfera', 'atmosphere'),
  temperature: s('temperatura', 'temperature'), lastContact: s('último contacto', 'last contact'), status: s('estado', 'status'),
  moonBody: s('Luna · cráter de referencia', 'Moon · reference crater'), exosphere: s('exosfera, no respirable', 'exosphere, not breathable'),
  silent: s('en silencio', 'silent'), searchHalted: s('búsqueda suspendida', 'search called off'),
  paused: s('Pausa', 'Paused'), resume: s('Continuar', 'Resume'), abandon: s('Abandonar salida (no cuenta como intento)', 'Abandon sortie (not counted as an attempt)'),
  mainMenu: s('Menú principal', 'Main menu'), language: s('Idioma', 'Language'), sensitivity: s('Sensibilidad del ratón', 'Mouse sensitivity'),
  reduceMotion: s('Reducir movimiento', 'Reduce motion'), quality: s('Calidad gráfica', 'Graphics quality'), auto: s('auto', 'auto'),
  applyReload: s('Se aplica al recargar.', 'Applies after reloading.'), reloadNow: s('Recargar ahora', 'Reload now'),
  volumeMaster: s('Volumen general', 'Master volume'), volumeMusic: s('Música', 'Music'), volumeSfx: s('Efectos', 'Effects'),
  audioNote: s('Audio generado en tiempo real: grave y lento, como se oye a través del traje.', 'Audio generated live: low and slow, as heard through the suit.'),
  on: s('sí', 'on'), off: s('no', 'off'), unlocked: s('LOGRO', 'ACHIEVEMENT'), lockedHint: s('bloqueado', 'locked'),
  advance: s('Continuar ▶', 'Continue ▶'),
  creditsBody: s('Juego creado para NASA Space Apps Challenge 2026 (reto Space Mission Design Game). Tipografía Perihelio Mono y arte generados por el equipo. Los datos científicos enlazan su fuente; todo lo demás es ficción o simplificación de juego.',
    'Game made for NASA Space Apps Challenge 2026 (Space Mission Design Game challenge). Perihelio Mono typeface and art generated by the team. Scientific data links its source; everything else is fiction or a gameplay simplification.'),
  sources: s('Fuentes', 'Sources'), observed: s('observación', 'observation'), simplified: s('simplificación', 'simplification'), fiction: s('ficción', 'fiction'), reference: s('referencia', 'reference'),
};

export type StringKey = keyof typeof strings;

/** Hook returning a translator for interface strings and any Localized value. */
export function useT() {
  const lang = useStore(prefs, p => p.lang);
  const t = (k: StringKey | Localized) => (typeof k === 'string' ? strings[k] : k)[lang];
  return { t, lang };
}
