// EVA suit design: the engineering decision behind each sortie. Values are gameplay values, not hardware data.
import { z } from 'zod';
import type { Localized } from './contract/grid-v1.ts';
import type { MoveParams } from './movement.ts';

const t = (es: string, en: string): Localized => ({ es, en });

export const batteries = {
  light: { name: t('Batería ligera', 'Light battery'), capacity: 60, mass: 4 },
  standard: { name: t('Batería estándar', 'Standard battery'), capacity: 100, mass: 8 },
  extended: { name: t('Batería extendida', 'Extended battery'), capacity: 150, mass: 14 },
} as const;
export const thrusters = {
  none: { name: t('Sin propulsor', 'No thruster'), airJumps: 0, airJumpCost: 0, boost: 1, mass: 0 },
  compact: { name: t('Propulsor compacto', 'Compact thruster'), airJumps: 1, airJumpCost: 6, boost: 1, mass: 5 },
  strong: { name: t('Propulsor potente', 'Strong thruster'), airJumps: 1, airJumpCost: 4, boost: 1.3, mass: 9 },
} as const;
export const antennas = {
  short: { name: t('Antena corta', 'Short antenna'), radius: 70, mass: 1 },
  medium: { name: t('Antena media', 'Medium antenna'), radius: 100, mass: 3 },
  long: { name: t('Antena larga', 'Long antenna'), radius: 130, mass: 6 },
} as const;
export const instruments = {
  camera: { name: t('Cámara espectral', 'Spectral camera'), mass: 2, enables: t('escanear', 'scan') },
  drill: { name: t('Taladro de muestras', 'Sample drill'), mass: 4, enables: t('recuperar', 'recover') },
  kit: { name: t('Kit de reparación', 'Repair kit'), mass: 3, enables: t('reparar a mitad de coste', 'repair at half cost') },
} as const;

export type BatteryId = keyof typeof batteries;
export type ThrusterId = keyof typeof thrusters;
export type AntennaId = keyof typeof antennas;
export type InstrumentId = keyof typeof instruments;

export const designSchema = z.object({
  battery: z.enum(['light', 'standard', 'extended']),
  thruster: z.enum(['none', 'compact', 'strong']),
  antenna: z.enum(['short', 'medium', 'long']),
  instruments: z.array(z.enum(['camera', 'drill', 'kit'])).max(3),
}).strict();
export type SuitDesign = z.infer<typeof designSchema>;

export const massLimit = 28;
export const reserve = 10;
/** Energy per unit of a point's `power` value from the mission data. */
export const actionScale = 4;
export const dashCost = 5;
/** Life support drains always; walking and running add to it. Units per second. */
export const lifeDrain = 0.08;
export const moveDrain = 0.08;
/** Mass above this lowers jump height. */
export const freeMass = 14;

export const proposals: { id: string; name: Localized; summary: Localized; design: SuitDesign }[] = [
  { id: 'light', name: t('Propuesta ligera', 'Light proposal'),
    summary: t('Ágil y con kit de reparación; batería justa.', 'Agile, with a repair kit; tight battery.'),
    design: { battery: 'standard', thruster: 'compact', antenna: 'medium', instruments: ['camera', 'drill', 'kit'] } },
  { id: 'science', name: t('Propuesta científica', 'Science proposal'),
    summary: t('Mucha energía; pesada y salta menos.', 'Lots of energy; heavy, jumps lower.'),
    design: { battery: 'extended', thruster: 'compact', antenna: 'medium', instruments: ['camera', 'drill'] } },
];

export type Action = 'scan' | 'salvage' | 'service' | 'upload';
export const instrumentFor: Partial<Record<Action, InstrumentId>> = { scan: 'camera', salvage: 'drill' };

export function suitMass(d: SuitDesign) {
  return batteries[d.battery].mass + thrusters[d.thruster].mass + antennas[d.antenna].mass +
    d.instruments.reduce((sum, id) => sum + instruments[id].mass, 0);
}

export type SuitStats = {
  mass: number; capacity: number; jumpFactor: number; airJumps: number; airJumpCost: number;
  dashTimeFactor: number; commsRadius: number; problems: Localized[];
};

export function assessSuit(d: SuitDesign): SuitStats {
  const mass = suitMass(d);
  const problems: Localized[] = [];
  if (mass > massLimit) problems.push(t(`Masa ${mass} kg: supera el límite de ${massLimit} kg.`, `Mass ${mass} kg exceeds the ${massLimit} kg limit.`));
  if (new Set(d.instruments).size !== d.instruments.length) problems.push(t('Instrumento repetido.', 'Duplicate instrument.'));
  const thruster = thrusters[d.thruster];
  return {
    mass, capacity: batteries[d.battery].capacity, jumpFactor: Math.max(0.6, 1 - Math.max(0, mass - freeMass) * 0.015),
    airJumps: thruster.airJumps, airJumpCost: thruster.airJumpCost, dashTimeFactor: thruster.boost,
    commsRadius: antennas[d.antenna].radius, problems,
  };
}

/** Movement constants for a suit: heavier suits jump lower; the thruster decides air jumps and dash length. */
export function suitMovement(base: MoveParams, s: SuitStats): MoveParams {
  return { ...base, jumpSpeed: base.jumpSpeed * s.jumpFactor, airJumps: s.airJumps,
    airJumpSpeed: base.airJumpSpeed * (s.dashTimeFactor > 1 ? 1.15 : 1), dashTime: base.dashTime * s.dashTimeFactor };
}

export function actionCost(power: number, action: Action, d: SuitDesign) {
  const full = power * actionScale;
  return action === 'service' && d.instruments.includes('kit') ? Math.ceil(full / 2) : full;
}

/** Jump apex in metres for a design, for the design console. */
export function jumpApex(base: MoveParams, s: SuitStats) {
  const v = base.jumpSpeed * s.jumpFactor;
  return v * v / (2 * base.gravityUp);
}
