// End-of-sortie report: what happened, what each part of the battery went to, and which design decision explains it.
import { ledgerLabels, type LedgerKey, type Report } from '../../core/sortie.ts';
import { useStore } from 'zustand';
import { useT } from '../i18n.ts';
import { commands, hud } from '../store.ts';
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function SortieReport({ report, onRedesign, onRetry, onEpilogue }: { report: Report; onRedesign(): void; onRetry(): void; onEpilogue(): void }) {
  const { t } = useT();
  const { outcome, next, finale } = useStore(hud);
  const done = report.outcome === 'complete';
  const keys = (Object.keys(report.ledger) as LedgerKey[]).filter(k => report.ledger[k] > 0.05).sort((a, b) => report.ledger[b] - report.ledger[a]);
  return <div className="screen report-screen">
    <section className={'panel report' + (done ? '' : ' failed')} role="region" aria-label={t('reportRegion')}>
      <span className="panel-title">{t('reportTitle')}</span>
      <h2 className={done ? 'ok' : 'warn'}>{t(done ? 'transmission' : 'partial')}</h2>
      <div className="report-stats">
        <div><b>{report.requiredDone}/{report.required}</b><span>{t('required')}</span></div>
        <div><b>{Math.round(report.used)}/{report.capacity}</b><span>{t('energyUsed')}</span></div>
        <div><b>{clock(report.time)}</b><span>{t('duration')}</span></div>
        <div><b>{report.echoes}</b><span>{t('echoes')}</span></div>
      </div>
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
      <span className="slot-label">{t('engineering')}</span>
      <ul className="insights">{report.insights.map((s, i) => <li key={i}>{t(s)}</li>)}</ul>
      <div className="actions">
        <button className={done ? '' : 'primary'} data-redesign onClick={onRedesign}>{t('redesign')}</button>
        <button className={done && !next && !finale ? 'primary' : ''} data-retry onClick={onRetry}>{t('retry')}</button>
        {done && finale && <button className="primary" data-sfx="ui-confirm" data-epilogue-open onClick={onEpilogue}>{t('epilogue')} ↗</button>}
        {done && next && <button className="primary" data-sfx="ui-confirm" data-next={next.id} onClick={() => commands.travel(next.id)}>{t('continueTo')} {t(next.name)} ↗</button>}
      </div>
      <p className="model-note">{t('modelNote')}</p>
    </section>
  </div>;
}
