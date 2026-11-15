// Local save for the 3D game: last suit design and the history of attempts per level.
// A sortie in progress is not saved: reloading returns to the design console with the last design.
import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import { designSchema, type SuitDesign } from '../suit.ts';

export const attemptSchema = z.object({
  design: designSchema, outcome: z.enum(['complete', 'recalled']), completed: z.array(z.string()),
  used: z.number().nonnegative(), time: z.number().nonnegative(), echoes: z.number().int().nonnegative(),
}).strict();
export const progressSchema = z.object({
  version: z.literal(1), level: z.string(), design: designSchema, attempts: z.array(attemptSchema).max(50),
  echoes: z.array(z.string()),
  achievements: z.array(z.string()).default([]),
  /** Dialogue sequences already shown, so each plays once per save. */
  seen: z.array(z.string()).default([]),
  /** Rock atlas entries scanned, kept even if the sortie ends in a recall. */
  atlas: z.array(z.string()).default([]),
  /** Side-mission beacons repaired. */
  beacons: z.array(z.string()).default([]),
  /** Ruins opened; each one holds one journal page. */
  ruins: z.array(z.string()).default([]),
  /** Geophones planted (side mission S1). */
  geophones: z.array(z.string()).default([]),
}).strict();
export type Attempt = z.infer<typeof attemptSchema>;
export type Progress = z.infer<typeof progressSchema>;

class Saves extends Dexie {
  progress!: Table<{ id: string; data: unknown }, string>;
  constructor() { super('orbita-3d'); this.version(1).stores({ progress: 'id' }); }
}
let db: Saves | null = null;
const open = () => (db ??= new Saves());

export const emptyProgress = (level: string, design: SuitDesign): Progress => ({ version: 1, level, design, attempts: [], echoes: [], achievements: [], seen: [], atlas: [], beacons: [], ruins: [], geophones: [] });

/** Returns null when nothing is saved, and 'invalid' when the stored data does not match the schema. */
export async function readProgress(level: string): Promise<Progress | null | 'invalid'> {
  const row = await open().progress.get(level);
  if (!row) return null;
  const parsed = progressSchema.safeParse(row.data);
  return parsed.success && parsed.data.level === level ? parsed.data : 'invalid';
}

let tail = Promise.resolve();
/** Writes are serialised so a fast redesign cannot overwrite a newer save with an older one. */
export function writeProgress(p: Progress): Promise<void> {
  // An invalid save is reported through the promise (the HUD shows the save error) instead of throwing into the
  // game loop, where it would stop the sortie halfway through its report.
  const parsed = progressSchema.safeParse(p);
  if (!parsed.success) return Promise.reject(parsed.error);
  const data = parsed.data;
  tail = tail.catch(() => {}).then(() => open().progress.put({ id: data.level, data })).then(() => undefined);
  return tail;
}
