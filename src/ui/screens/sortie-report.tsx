// End-of-sortie report: what happened, how the battery evolved, which design decision explains each result, how
// this attempt compares with the previous one and what to try next.
import { compareAttempts, decisionLinks, recommend, type Slot } from '../../core/debrief.ts';
import { ledgerLabels, type LedgerKey, type Report } from '../../core/sortie.ts';
import { antennas, assessSuit, batteries, instruments, reserve, thrusters, type SuitDesign } from '../../core/suit.ts';
import { useStore } from 'zustand';
import { useT, type StringKey } from '../i18n.ts';
import { commands, hud } from '../store.ts';
import { EnergyChart } from './energy-chart.tsx';
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const slotLabel: Record<Slot | 'mass', StringKey> = {
  battery: 'slotBattery', thruster: 'slotThruster', antenna: 'slotAntenna', instruments: 'instruments', accessory: 'accessory', mass: 'mass',
};

function DesignLine({ d }: { d: SuitDesign }) {
  const { t } = useT();
  return <small className="design-line">{t(batteries[d.battery].name)} · {t(thrusters[d.thruster].name)} · {t(antennas[d.antenna].name)} · {d.instruments.map(i => t(instruments[i].name)).join(', ') || '—'} · {assessSuit(d).mass} kg</small>;
}

export function SortieReport({ report, onRedesign, onRetry, onEpilogue }: { report: Report; onRedesign(): void; onRetry(): void; onEpilogue(): void }) {
  const { t } = useT();
  const { outcome, next, finale, attempts, objectives, accessories } = useStore(hud);
  const done = report.outcome === 'complete';
  const keys = (Object.keys(report.ledger) as LedgerKey[]).filter(k => report.ledger[k] > 0.05).sort((a, b) => report.ledger[b] - report.ledger[a]);
  const links = decisionLinks(report);
  const advice = recommend(report, objectives, accessories);
  // The current attempt is already saved as the last one; compare it with the one before.
  const prev = attempts.length > 1 ? attempts[attempts.length - 2] : null;
  const cur = attempts[attempts.length - 1];
  const cmp = prev && cur ? compareAttempts(prev, cur, objectives.filter(o => o.required).map(o => o.id)) : null;
  // The first two insights repeat the battery and mass rows of the decision table.
  const environment = report.insights.slice(2);
  const arrow = (a: number, b: number, better: 'up' | 'down') => (a === b ? '=' : (b > a) === (better === 'up') ? '▲' : '▼');
  return <div className="screen report-screen">
    <section className={'panel report' + (done ? '' : ' failed')} role="region" aria-label={t('reportRegion')}>
      <header className="report-head">
        <span className="panel-title">{t('reportTitle')} · {t('attemptN')} {attempts.length}</span>
        <h2 className={done ? 'ok' : 'warn'}>{t(done ? 'transmission' : 'partial')}</h2>
        <div className="report-stats">
          <div><b>{report.requiredDone}/{report.required}</b><span>{t('required')}</span></div>
          <div><b>{Math.round(report.used)}/{report.capacity}</b><span>{t('energyUsed')}</span></div>
          <div><b>{clock(report.time)}</b><span>{t('duration')}</span></div>
          <div><b>{report.echoes}</b><span>{t('echoes')}</span></div>
        </div>
      </header>
      <div className="report-cols">
        <div className="report-col">
          <span className="slot-label">{t('energyTrace')}</span>
          <EnergyChart trace={report.trace} marks={report.marks} capacity={report.capacity} reserve={reserve} />
          {done && outcome && <>
            <span className="slot-label">{t('outcomeTitle')}</span>
            <p className="outcome" data-outcome>{t(outcome)}</p>
          </>}
          {report.missed.length > 0 && <>
            <span className="slot-label">{t('missedWhy')}</span>
            <ul className="causes">{report.missed.map(m => <li key={m.id} data-missed={m.id}><b>{t(m.title)}</b> — {t(m.cause)}</li>)}</ul>
          </>}
          <span className="slot-label">{t('whereEnergy')}</span>
          <div className="ledger">{keys.map(k => <div key={k} className="ledger-row">
            <span>{t(ledgerLabels[k])}</span><i style={{ width: Math.max(2, report.ledger[k] / report.capacity * 100) + '%' }} /><b>{Math.round(report.ledger[k])} u.</b>
          </div>)}</div>
          {environment.length > 0 && <>
            <span className="slot-label">{t('environment')}</span>
            <ul className="insights">{environment.map((s, i) => <li key={i}>{t(s)}</li>)}</ul>
          </>}
        </div>
        <div className="report-col">
          <span className="slot-label">{t('decisionResult')}</span>
          <table className="links" data-links>
            <tbody>{links.map(l => <tr key={l.slot} className={l.tone} data-link={l.slot}>
              <th scope="row">{t(slotLabel[l.slot])}</th>
              <td><b>{t(l.choice)}</b><span>{t(l.effect)}</span></td>
            </tr>)}</tbody>
          </table>
          {cmp && <>
            <span className="slot-label">{t('vsPrevious')}</span>
            <div className="compare" data-compare>
              <p>{cmp.changes.length ? cmp.changes.map(c => <span key={c.slot} data-change={c.slot}>{t(slotLabel[c.slot])}: {t(c.from)} → <b>{t(c.to)}</b></span>)
                : <span>{t('sameDesign')}</span>}</p>
              <dl>
                <dt>{t('required')}</dt><dd>{cmp.required[0]} → {cmp.required[1]} <i>{arrow(cmp.required[0], cmp.required[1], 'up')}</i></dd>
                <dt>{t('energyUsed')}</dt><dd>{Math.round(cmp.used[0])} → {Math.round(cmp.used[1])} u.</dd>
                <dt>{t('duration')}</dt><dd>{clock(cmp.time[0])} → {clock(cmp.time[1])}</dd>
                <dt>{t('result')}</dt><dd>{t(cmp.outcome[0] === 'complete' ? 'complete' : 'recalled')} → <b>{t(cmp.outcome[1] === 'complete' ? 'complete' : 'recalled')}</b></dd>
              </dl>
            </div>
          </>}
          <span className="slot-label">{t('tryNext')}</span>
          <ol className="advice" data-advice-list>{advice.map(a => <li key={a.id} data-advice={a.id}>
            <p>{t(a.text)}</p>
            {a.design && <>
              <DesignLine d={a.design} />
              <button data-sfx="ui-confirm" data-apply={a.id} onClick={() => commands.redesignWith(a.design!)}>{t('loadProposal')}</button>
            </>}
          </li>)}</ol>
        </div>
      </div>
      <div className="actions">
        <button className={done ? '' : 'primary'} data-redesign onClick={onRedesign}>{t('redesign')}</button>
        <button className={done && !next && !finale ? 'primary' : ''} data-retry onClick={onRetry}>{t('retry')}</button>
        {done && finale && <button className="primary" data-sfx="ui-confirm" data-epilogue-open onClick={onEpilogue}>{t('epilogue')} ↗</button>}
        {done && next && <button className="primary" data-sfx="ui-confirm" data-next={next.id} onClick={() => commands.travel(next.id)}>{t('continueTo')} {t(next.name)} ↗</button>}
      </div>
      <p className="model-note">{t('modelNote')} {t('adviceNote')}</p>
    </section>
  </div>;
}
