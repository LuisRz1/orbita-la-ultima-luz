// Lander interior interface: a top bar that fills in as stations are visited, and one small panel per station
// with a single decision. Replaces the two-panel console that showed everything at once.
import { useEffect } from 'react';
import { useStore } from 'zustand';
import type { Localized } from '../../core/contract/grid-v1.ts';
import { defaultParams } from '../../core/movement.ts';
import {
  accessories,
  actionCost, antennas, assessSuit, batteries, instrumentFor, instruments, jumpApex, lifeDrain, massLimit, reserve, thrusters,
  type InstrumentId, type SuitDesign,
} from '../../core/suit.ts';
import { useT, type StringKey } from '../i18n.ts';
import { MissionBrief } from './mission-brief.tsx';
import { commands, hud, type Objective, type StationId } from '../store.ts';

type Slot = 'battery' | 'thruster' | 'antenna';
const catalogs: Record<Slot, Record<string, { name: Localized; mass: number }>> = { battery: batteries, thruster: thrusters, antenna: antennas };
const stationName: Record<StationId, StringKey> = {
  battery: 'stBattery', thruster: 'stThruster', antenna: 'stAntenna', instruments: 'stInstruments', locker: 'stLocker', airlock: 'stAirlock',
};

function possible(o: Objective, d: SuitDesign) {
  const need = instrumentFor[o.action as keyof typeof instrumentFor];
  return !need || d.instruments.includes(need);
}

function TopBar({ draft, done, objectives }: { draft: SuitDesign; done: StationId[]; objectives: Objective[] }) {
  const { t } = useT();
  const stats = assessSuit(draft);
  const has = (s: StationId) => done.includes(s);
  const required = objectives.filter(o => o.required);
  const cost = required.filter(o => possible(o, draft)).reduce((sum, o) => sum + actionCost(o.power, o.action as never, draft), 0);
  const free = stats.capacity - cost - reserve;
  const anyDone = (['battery', 'thruster', 'antenna', 'instruments'] as const).some(has);
  return <div className="ship-bar" role="status" aria-label={t('suitStatus')}>
    <span className={has('battery') ? 'set' : ''}><i>▮</i>{has('battery') ? `${stats.capacity} u.` : '—'}</span>
    <span className={has('thruster') ? 'set' : ''}><i>▲</i>{has('thruster') ? (stats.airJumps ? t('airJump') : t('noAirJump')) : '—'}</span>
    <span className={has('antenna') ? 'set' : ''}><i>≋</i>{has('antenna') ? `${stats.commsRadius} m` : '—'}</span>
    <span className={has('instruments') ? 'set' : ''}><i>◆</i>{(['camera', 'drill', 'kit'] as InstrumentId[]).map(id => <b key={id} className={has('instruments') && draft.instruments.includes(id) ? 'on' : ''} />)}</span>
    {anyDone && <span className={'mass' + (stats.mass > massLimit ? ' over' : '')}>{t('mass')} {stats.mass}/{massLimit} kg</span>}
    {has('battery') && <span className={free < 20 ? 'warnv' : ''}>{t('freeEnergy')} {free} u. ≈ {(free / (lifeDrain * 2) / 60).toFixed(1)} min</span>}
    {has('instruments') && <span className="goals" aria-label={t('objectives')}>{required.map(o => <b key={o.id} title={t(o.title)} className={possible(o, draft) ? 'ok' : 'bad'} />)}</span>}
  </div>;
}

function optionLine(slot: Slot, id: string, t: ReturnType<typeof useT>['t'], draft: SuitDesign) {
  if (slot === 'battery') return `${batteries[id as keyof typeof batteries].capacity} u. · ${batteries[id as keyof typeof batteries].mass} kg`;
  if (slot === 'antenna') return `${antennas[id as keyof typeof antennas].radius} m · ${antennas[id as keyof typeof antennas].mass} kg`;
  const th = thrusters[id as keyof typeof thrusters];
  const apex = jumpApex(defaultParams, assessSuit({ ...draft, thruster: id as keyof typeof thrusters }));
  return (th.airJumps ? `${t('airJump')} ${th.airJumpCost} u.` : t('noAirJump')) + ` · ${t('upTo')} ${apex.toFixed(1)} m · ${th.mass} kg`;
}

function StationPanel({ id, draft, objectives }: { id: StationId; draft: SuitDesign; objectives: Objective[] }) {
  const { t } = useT();
  const slot = id === 'instruments' ? null : (id as Slot);
  const ids = slot ? Object.keys(catalogs[slot]) : [];
  const set = (next: SuitDesign) => commands.pick(next);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (slot && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const i = ids.indexOf(draft[slot]) + (e.key === 'ArrowRight' ? 1 : -1);
        if (i >= 0 && i < ids.length) set({ ...draft, [slot]: ids[i] } as SuitDesign);
      }
      if (e.key === 'Enter' || e.code === 'KeyE') { e.preventDefault(); commands.confirmStation(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const stats = assessSuit(draft);
  const unlocked = useStore(hud, st => st.accessories);
  return <section className="panel station" role="dialog" aria-label={t(stationName[id])} data-station={id}>
    <span className="panel-title">{t(stationName[id]).toUpperCase()}</span>
    <p className="station-why">{t(('why_' + id) as StringKey)}</p>
    <div className="options">
      {slot && ids.map(opt => <button key={opt} data-option={opt} data-sfx="ui-step" className={draft[slot] === opt ? 'on' : ''}
        onClick={() => set({ ...draft, [slot]: opt } as SuitDesign)}>
        <b>{t(catalogs[slot][opt].name)}</b><small>{optionLine(slot, opt, t, draft)}</small>
      </button>)}
      {!slot && (Object.keys(instruments) as InstrumentId[]).map(inst => {
        const on = draft.instruments.includes(inst);
        const unlocks = objectives.filter(o => o.required && instrumentFor[o.action as keyof typeof instrumentFor] === inst);
        return <button key={inst} data-instrument={inst} aria-pressed={on} className={on ? 'on' : ''}
          onClick={() => set({ ...draft, instruments: on ? draft.instruments.filter(x => x !== inst) : [...draft.instruments, inst] })}>
          <b>{on ? '■ ' : '□ '}{t(instruments[inst].name)}</b>
          <small>{t(instruments[inst].enables)} · {instruments[inst].mass} kg{unlocks.length ? ' · ' + unlocks.map(o => t(o.title)).join(', ') : ''}</small>
        </button>;
      })}
      {!slot && unlocked.length > 0 && <>
        <span className="panel-title accessory-title">{t('accessory')}</span>
        {[undefined, ...unlocked].map(acc => <button key={acc ?? 'none'} data-accessory={acc ?? 'none'} aria-pressed={draft.accessory === acc} className={draft.accessory === acc ? 'on' : ''}
          onClick={() => set({ ...draft, accessory: acc })}>
          <b>{draft.accessory === acc ? '■ ' : '□ '}{acc ? t(accessories[acc].name) : t('noAccessory')}</b>
          {acc && <small>{t(accessories[acc].enables)} · {accessories[acc].mass} kg</small>}
        </button>)}
      </>}
    </div>
    <div className="station-foot">
      <span className={stats.mass > massLimit ? 'bad' : ''}>{t('mass')} {stats.mass}/{massLimit} kg{stats.mass > massLimit ? ' · ' + t('overMass') : ''}</span>
      <button className="primary" data-confirm data-sfx="ui-confirm" onClick={() => commands.confirmStation()}>{t('confirmKey')}</button>
    </div>
  </section>;
}

export function ShipScreen() {
  const { t } = useT();
  const { ship, objectives, notice, now, attempts } = useStore(hud);
  if (!ship) return null;
  const showNotice = notice && now - notice.at < 7;
  return <div className="screen ship-screen">
    <TopBar draft={ship.draft} done={ship.done} objectives={objectives} />
    <MissionBrief draft={ship.draft} />
    {attempts.length > 0 && !ship.open && <section className="panel history" aria-label={t('attempts')}>
      <span className="panel-title">{t('attempts').toUpperCase()} · {attempts.length}</span>
      <ol>{attempts.slice(-5).reverse().map((a, i) => <li key={attempts.length - i} className={a.outcome}>
        {t(a.outcome === 'complete' ? 'complete' : 'recalled')} · {a.completed.length} · {Math.round(a.used)} u.
      </li>)}</ol>
    </section>}
    {ship.open && ship.open !== 'locker' && ship.open !== 'airlock' && <StationPanel id={ship.open} draft={ship.draft} objectives={objectives} />}
    {!ship.open && <div className="center-bottom">
      {showNotice && <p className={'notice ' + notice.tone} key={notice.at}><span>{t('noticeSystem')}</span>{t(notice.text)}</p>}
      {ship.near && <p className="prompt" data-prompt><kbd>E</kbd> {t('use')} · <b>{t(stationName[ship.near])}</b></p>}
      <p className="hint">{t('shipHint')}</p>
    </div>}
  </div>;
}
