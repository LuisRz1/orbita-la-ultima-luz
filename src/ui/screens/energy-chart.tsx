// Battery over mission time for the sortie report: the line, the return reserve, numbered objectives, hazard
// zones entered, link losses and the moment the reserve was reached. Plain SVG, no canvas or library.
import type { TraceMark, TraceSample } from '../../core/sortie.ts';
import { useStore } from 'zustand';
import { useT } from '../i18n.ts';
import { prefs } from '../prefs.ts';

const W = 640, H = 176, L = 34, R = 12, T = 24, B = 22;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const glyph = { cold: '❄', dust: '≋', sun: '☀' } as const;

/** Battery level at time t: the last sample at or before it (samples after a spend share its time). */
export function energyAt(trace: TraceSample[], t: number) {
  let e = trace[0]?.e ?? 0;
  for (const q of trace) { if (q.t <= t) e = q.e; else break; }
  return e;
}

export function EnergyChart({ trace, marks, capacity, reserve }: { trace: TraceSample[]; marks: TraceMark[]; capacity: number; reserve: number }) {
  const { t } = useT();
  const still = useStore(prefs, p => p.reduceMotion);
  const end = Math.max(1, trace[trace.length - 1]?.t ?? 1);
  const x = (s: number) => L + (s / end) * (W - L - R);
  const y = (e: number) => T + (1 - Math.max(0, e) / capacity) * (H - T - B);
  const line = trace.map((q, i) => `${i ? 'L' : 'M'}${x(q.t).toFixed(1)},${y(q.e).toFixed(1)}`).join('');
  const area = `${line}L${x(end).toFixed(1)},${y(0)}L${x(0)},${y(0)}Z`;
  const points = marks.filter(m => m.kind === 'point');
  const last = trace[trace.length - 1];
  const summary = `${t('energyTrace')}: ${Math.round(trace[0]?.e ?? 0)} → ${Math.round(last?.e ?? 0)} u, ${clock(end)}`;
  return <figure className={'energy-chart' + (still ? '' : ' draw')} data-energy-chart>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} preserveAspectRatio="xMidYMid meet">
      {[0, 0.5, 1].map(f => <g key={f} className="grid">
        <line x1={L} x2={W - R} y1={y(capacity * f)} y2={y(capacity * f)} />
        <text x={L - 6} y={y(capacity * f) + 4} textAnchor="end">{Math.round(capacity * f)}</text>
      </g>)}
      {[0, 0.5, 1].map(f => <text key={f} className="axis" x={x(end * f)} y={H - 6} textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}>{clock(end * f)}</text>)}
      <rect className="reserve-band" x={L} y={y(reserve)} width={W - L - R} height={y(0) - y(reserve)} />
      <line className="reserve-line" x1={L} x2={W - R} y1={y(reserve)} y2={y(reserve)} />
      <text className="reserve-label" x={W - R - 4} y={y(reserve) - 4} textAnchor="end">{t('reserve')} · {reserve} u.</text>
      <path className="area" d={area} />
      <path className="line" d={line} pathLength={1} />
      {marks.filter(m => m.kind === 'hazard' || m.kind === 'recall').map((m, i) => <g key={m.kind + i} className={'event ' + m.kind} data-chart-mark={m.kind}>
        <line x1={x(m.t)} x2={x(m.t)} y1={T - 8} y2={y(0)} />
        <text x={x(m.t)} y={T - 10} textAnchor="middle">{m.kind === 'recall' ? '⟲' : glyph[m.hazard ?? 'cold']}<title>{t(m.label)} · {clock(m.t)}</title></text>
      </g>)}
      {marks.filter(m => m.kind === 'reserve').map(m => <g key="reserve" className="event reached" data-chart-mark="reserve">
        <circle cx={x(m.t)} cy={y(reserve)} r={5} /><title>{t(m.label)} · {clock(m.t)}</title>
      </g>)}
      {points.map((m, i) => <g key={m.id} className="point" data-chart-point={m.id}>
        <circle cx={x(m.t)} cy={y(energyAt(trace, m.t))} r={8} />
        <text x={x(m.t)} y={y(energyAt(trace, m.t)) + 4} textAnchor="middle">{i + 1}</text>
        <title>{t(m.label)} · {clock(m.t)}</title>
      </g>)}
    </svg>
    <figcaption>
      {points.map((m, i) => <span key={m.id}><b>{i + 1}</b> {t(m.label)}</span>)}
      {marks.some(m => m.kind === 'hazard') && <span className="legend-hazard">{[...new Set(marks.filter(m => m.kind === 'hazard').map(m => glyph[m.hazard ?? 'cold']))].join(' ')} {t('hazardEntered')}</span>}
      {marks.some(m => m.kind === 'recall') && <span className="legend-recall">⟲ {t('linkLostMark')}</span>}
      {marks.some(m => m.kind === 'reserve') && <span className="legend-reserve">● {t('reserveReached')}</span>}
    </figcaption>
  </figure>;
}
