// End-of-sortie report: what happened, what each part of the battery went to, and which design decision explains it.
import { ledgerLabels, type LedgerKey, type Report } from '../../core/sortie.ts';
import { useT } from '../i18n.ts';
import type { Localized } from '../../core/contract/grid-v1.ts';
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export type SortieSummary={title:Localized;text:Localized;action:Localized;brief?:boolean};
export function SortieReport({report,onRedesign,onRetry,onComplete,saving,summary}:{
  report:Report;onRedesign():void;onRetry():void;onComplete?:()=>void;saving?:boolean;summary?:SortieSummary;
}) {
  const { t } = useT();
  const done = report.outcome === 'complete';
  const keys = (Object.keys(report.ledger) as LedgerKey[]).filter(k => report.ledger[k] > 0.05).sort((a, b) => report.ledger[b] - report.ledger[a]);
  return <div className="screen report-screen">
    <section className={'panel report' + (done ? '' : ' failed')} role="region" aria-label={t('reportRegion')}>
      <span className="panel-title">{t('reportTitle')}</span>
      <h2 className={done ? 'ok' : 'warn'}>{t(done&&summary?summary.title:done?'transmission':'partial')}</h2>
      {done&&summary&&<p className="sortie-summary">{t(summary.text)}</p>}
      {!(done&&summary?.brief)&&<>
      <div className="report-stats">
        <div><b>{report.requiredDone}/{report.required}</b><span>{t('required')}</span></div>
        <div><b>{Math.round(report.used)}/{report.capacity}</b><span>{t('energyUsed')}</span></div>
        <div><b>{clock(report.time)}</b><span>{t('duration')}</span></div>
        <div><b>{report.echoes}</b><span>{t('echoes')}</span></div>
      </div>
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
      </>}
      <div className="actions">
        {(!done||!summary?.brief)&&<button className={done ? '' : 'primary'} data-redesign onClick={onRedesign}>{t('redesign')}</button>}
        {onComplete?<button className="primary" data-campaign-file disabled={saving} onClick={onComplete}>
          {t(summary?.action??{es:'Archivar y continuar',en:'File and continue'})} ↗</button>:
          <button className={done ? 'primary' : ''} data-retry onClick={onRetry}>{t('retry')}</button>}
      </div>
      {!(done&&summary?.brief)&&<p className="model-note">{t('modelNote')}</p>}
    </section>
  </div>;
}
