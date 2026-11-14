// Suit design console: one row per component with arrows, like an outfit picker, and a live evaluation
// that shows what each choice costs and enables before the sortie.
import { useEffect, useState } from 'react';
import type { Localized } from '../../core/contract/grid-v1.ts';
import { defaultParams } from '../../core/movement.ts';
import type { Attempt } from '../../core/save/progress3d.ts';
import {
  actionCost, antennas, assessSuit, batteries, dashCost, instrumentFor, instruments, jumpApex, lifeDrain, massLimit, proposals,
  reserve, thrusters, type InstrumentId, type SuitDesign,
} from '../../core/suit.ts';
import { useT, type StringKey } from '../i18n.ts';
import type { Objective } from '../store.ts';
type Slot = 'battery' | 'thruster' | 'antenna';
const catalogs: Record<Slot, Record<string, { name: Localized; mass: number }>> = { battery: batteries, thruster: thrusters, antenna: antennas };
const slotLabel: Record<Slot, StringKey> = { battery: 'slotBattery', thruster: 'slotThruster', antenna: 'slotAntenna' };

function detail(slot: Slot, id: string, t: ReturnType<typeof useT>['t']) {
  if (slot === 'battery') return `${batteries[id as keyof typeof batteries].capacity} u.`;
  if (slot === 'antenna') return `${antennas[id as keyof typeof antennas].radius} m`;
  const th = thrusters[id as keyof typeof thrusters];
  return th.airJumps ? `${t('airJump')} ${th.airJumpCost} u.${th.boost > 1 ? ' · ' + t('longDash') : ''}` : t('noAirJump');
}

const sameDesign = (a: SuitDesign, b: SuitDesign) => JSON.stringify(a) === JSON.stringify(b);

export function SuitConsole({ initial, objectives, attempts, onStart }: {
  initial: SuitDesign; objectives: Objective[]; attempts: Attempt[]; onStart(design: SuitDesign): void;
}) {
  const { t } = useT();
  const [design, setDesign] = useState<SuitDesign>(initial);
  useEffect(() => setDesign(initial), [initial]);
  const stats = assessSuit(design);
  const cycle = (slot: Slot, dir: number) => {
    const ids = Object.keys(catalogs[slot]);
    const next = ids[(ids.indexOf(design[slot]) + dir + ids.length) % ids.length];
    setDesign({ ...design, [slot]: next } as SuitDesign);
  };
  const toggle = (id: InstrumentId) => setDesign({ ...design,
    instruments: design.instruments.includes(id) ? design.instruments.filter(x => x !== id) : [...design.instruments, id] });

  const required = objectives.filter(o => o.required);
  const actionsCost = required.reduce((sum, o) => sum + actionCost(o.power, o.action as never, design), 0);
  const margin = stats.capacity - actionsCost - reserve;
  const minutes = margin / (lifeDrain * 2) / 60;
  const unreachable = required.filter(o => { const need = instrumentFor[o.action as keyof typeof instrumentFor]; return need && !design.instruments.includes(need); });
  const massPct = Math.min(100, stats.mass / massLimit * 100);

  return <div className="screen design-screen" role="dialog" aria-label={t('designDialog')}>
    <section className="panel design-left">
      <span className="panel-title">{t('designTitle')}</span>
      <div className="proposals">
        {proposals.map(p => <button key={p.id} data-proposal={p.id} className={sameDesign(p.design, design) ? 'on' : ''} onClick={() => setDesign(p.design)}>
          <b>{t(p.name)}</b><small>{t(p.summary)}</small>
        </button>)}
      </div>
      {(Object.keys(catalogs) as Slot[]).map(slot => <div className="slot" key={slot} data-slot={slot}>
        <span className="slot-label">{t(slotLabel[slot])}</span>
        <button aria-label={t('previous') + ' ' + t(slotLabel[slot])} onClick={() => cycle(slot, -1)}>◀</button>
        <span className="slot-value"><b>{t(catalogs[slot][design[slot]].name)}</b><small>{detail(slot, design[slot], t)} · {catalogs[slot][design[slot]].mass} kg</small></span>
        <button aria-label={t('next') + ' ' + t(slotLabel[slot])} onClick={() => cycle(slot, 1)}>▶</button>
      </div>)}
      <span className="slot-label inst">{t('instruments')}</span>
      {(Object.keys(instruments) as InstrumentId[]).map(id => <label className="instrument" key={id}>
        <input type="checkbox" data-instrument={id} checked={design.instruments.includes(id)} onChange={() => toggle(id)} />
        <span><b>{t(instruments[id].name)}</b><small>{t(instruments[id].enables)} · {instruments[id].mass} kg</small></span>
      </label>)}
    </section>

    <section className="panel design-right" aria-live="polite">
      <span className="panel-title">{t('evaluation')}</span>
      <div className="meter"><span>{t('mass')}</span><b className={stats.mass > massLimit ? 'bad' : ''}>{stats.mass} / {massLimit} kg</b></div>
      <div className="bar"><i style={{ width: massPct + '%' }} className={stats.mass > massLimit ? 'bad' : ''} /></div>
      <div className="meter"><span>{t('battery')}</span><b>{stats.capacity} u.</b></div>
      <div className="meter"><span>{t('requiredObjectives')}</span><b>−{actionsCost} u.</b></div>
      <div className="meter"><span>{t('reserve')}</span><b>−{reserve} u.</b></div>
      <div className="meter total"><span>{t('margin')}</span><b className={margin < 30 ? 'warn' : ''}>{margin} u. ≈ {minutes.toFixed(1)} min</b></div>
      <div className="meter"><span>{t('jumpHeight')}</span><b>{jumpApex(defaultParams, stats).toFixed(1)} m</b></div>
      <div className="meter"><span>{t('airDash')}</span><b>{stats.airJumps ? stats.airJumpCost + ' u.' : '—'} · {dashCost} u.</b></div>
      <div className="meter"><span>{t('linkRange')}</span><b>{stats.commsRadius} m</b></div>
      <ul className="checks">
        {required.map(o => { const need = instrumentFor[o.action as keyof typeof instrumentFor]; const ok = !need || design.instruments.includes(need);
          return <li key={o.id} className={ok ? '' : 'bad'}>{ok ? '✓' : '✗'} {t(o.title)} <small>{actionCost(o.power, o.action as never, design)} u.{need ? ' · ' + t(instruments[need].name).toLowerCase() : ''}</small></li>; })}
      </ul>
      {stats.problems.map((p, i) => <p className="problem" key={i}>{t(p)}</p>)}
      {unreachable.length > 0 && stats.problems.length === 0 && <p className="problem soft">{t('learnOnly')}</p>}
      <button className="primary" data-start disabled={stats.problems.length > 0} onClick={() => onStart(design)}>{t('startEva')}</button>
      {attempts.length > 0 && <div className="history">
        <span className="slot-label">{t('attempts')}</span>
        {attempts.slice(-4).reverse().map((a, i) => <div key={i} className="row"><span>#{attempts.length - i} · {batteries[a.design.battery].capacity} u. · {a.design.instruments.length} inst.</span>
          <b className={a.outcome === 'complete' ? 'ok' : 'warn'}>{t(a.outcome === 'complete' ? 'complete' : 'recalled')} · {a.used} u.</b></div>)}
      </div>}
    </section>
  </div>;
}
