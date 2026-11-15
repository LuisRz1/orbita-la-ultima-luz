// Mission requirements inside the lander: every required objective with the instrument it needs and its energy
// cost for the suit being assembled, plus the energy budget. Planning information before leaving, not after.
import { useStore } from 'zustand';
import { actionCost, assessSuit, instrumentFor, instruments, lifeDrain, moveDrain, reserve, type Action, type SuitDesign } from '../../core/suit.ts';
import { useT } from '../i18n.ts';
import { hud } from '../store.ts';

export function MissionBrief({ draft }: { draft: SuitDesign }) {
  const { t } = useT();
  const { objectives, levelTitle, briefing } = useStore(hud);
  const required = objectives.filter(o => o.required);
  if (!required.length) return null;
  const stats = assessSuit(draft);
  const rows = required.map(o => {
    const need = instrumentFor[o.action as Action];
    const ok = !need || draft.instruments.includes(need);
    return { o, need, ok, cost: actionCost(o.power, o.action as Action, draft) };
  });
  const actions = rows.filter(r => r.ok).reduce((s, r) => s + r.cost, 0);
  const free = stats.capacity - reserve - actions;
  // Walking time left after the objectives, life support and movement both running.
  const minutes = Math.max(0, free) / (lifeDrain + moveDrain) / 60;
  return <section className="panel mission-brief" aria-label={t('briefTitle')} data-brief>
    <span className="panel-title">{t('briefTitle').toUpperCase()}</span>
    {levelTitle && <h3>{t(levelTitle)}</h3>}
    {briefing && <p className="brief-text">{t(briefing)}</p>}
    <ul>{rows.map(({ o, need, ok, cost }) => <li key={o.id} className={ok ? 'ok' : 'bad'} data-brief-row={o.id}>
      <span>{ok ? '✓' : '✗'} {t(o.title)}</span>
      <small>{need ? t(instruments[need].name) : t('noInstrument')}{cost ? ` · ${cost} u.` : ''}{o.action === 'service' && draft.instruments.includes('kit') ? ` · ${t('kitHalf')}` : ''}</small>
    </li>)}</ul>
    <dl>
      <dt>{t('battery')}</dt><dd>{stats.capacity} u.</dd>
      <dt>{t('objectivesCost')}</dt><dd>− {actions} u.</dd>
      <dt>{t('reserve')}</dt><dd>− {reserve} u.</dd>
      <dt className="total">{t('toMove')}</dt><dd className={'total' + (free < 20 ? ' warn' : '')} data-brief-free>{free} u. ≈ {minutes.toFixed(1)} min</dd>
    </dl>
  </section>;
}
