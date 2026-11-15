// Live-editable movement constants for the ?debug panel. Saved per browser so tuning survives reloads.
import { defaultParams, type MoveParams } from '../core/movement.ts';

const key = 'orbita-3d-tuning';

function load(): MoveParams {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<MoveParams> | null;
    if (saved && new URLSearchParams(window.location.search).has('debug')) return { ...defaultParams, ...saved };
  } catch { /* storage unavailable: defaults */ }
  return { ...defaultParams };
}

export const tuning: MoveParams = load();

export function setTuning(name: keyof MoveParams, value: number) {
  if (!Number.isFinite(value)) return;
  tuning[name] = value;
  try { localStorage.setItem(key, JSON.stringify(tuning)); } catch { /* ignore */ }
}

export function resetTuning() {
  Object.assign(tuning, defaultParams);
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
