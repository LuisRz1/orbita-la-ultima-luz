// In-sortie HUD: mission panel, telemetry, energy, prompts, zone titles, dialogue and achievement toasts.
import { useStore } from 'zustand';
import { achievements, type AchievementId } from '../core/achievements.ts';
import { reserve } from '../core/suit.ts';
import { useT } from './i18n.ts';
import { commands, hud } from './store.ts';

const clock = (s: number) => {
  const t = Math.floor(s);
  return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60].map(n => String(n).padStart(2, '0')).join(':');
};

export function MissionPanel() {
  const { t } = useT();
  const { levelTitle, objectives, echoes, elapsed } = useStore(hud);
  if (!levelTitle) return null;
  const done = objectives.filter(o => o.required && o.done).length, total = objectives.filter(o => o.required).length;
  return <section className="panel mission" aria-label={t('eva')}>
    <span className="panel-title">{t('eva')}</span>
    <h1>{t(levelTitle)}</h1>
    <div className="row"><span>{t('objectives')}</span><b>{done}/{total}</b></div>
    <div className="row"><span>{t('echoes')}</span><b>{echoes.found}/{echoes.total}</b></div>
    <div className="row"><span>MET</span><b>{clock(elapsed)}</b></div>
    <ol className="objectives">
      {objectives.map(o => <li key={o.id} data-objective={o.id} className={(o.done ? 'done' : '') + (o.required ? '' : ' optional')}>
        <span aria-hidden="true">{o.done ? '■' : '□'}</span> {t(o.title)}{o.required ? '' : ' ·' + t('optional')}
      </li>)}
    </ol>
  </section>;
}

export function Telemetry() {
  const { t } = useT();
  const { signal, player, realGravity, energy, capacity, draining } = useStore(hud);
  const bars = Math.round(signal * 10);
  const pct = capacity ? energy / capacity * 100 : 0;
  const low = energy - reserve < 15;
  return <>
    <section className="panel telemetry" aria-label={t('link')}>
      <span className="panel-title">{t('link')}</span>
      <div className={'signal' + (signal < 0.5 ? ' low' : '')} aria-label={t('signal') + ' ' + Math.round(signal * 100) + '%'}>
        {'▮'.repeat(bars)}<i>{'▯'.repeat(10 - bars)}</i> <b>{Math.round(signal * 100)}%</b>
      </div>
      <div className="row"><span>pos</span><b>{player.x.toFixed(0)} / {player.z.toFixed(0)}</b></div>
      <div className="row"><span>alt</span><b>{player.y.toFixed(1)} m</b></div>
      <div className="row"><span>vel</span><b>{player.speed.toFixed(1)} m/s</b></div>
    </section>
    <section className="panel energy-panel" aria-label={t('systems')}>
      <span className="panel-title">{t('systems')}</span>
      <div className="row"><span>{t('battery')}{draining ? ' · ' + t(draining) : ''}</span><b className={low ? 'warn' : ''}>{energy.toFixed(0)} / {capacity} u.</b></div>
      <div className="bar energy" role="progressbar" aria-label={t('energy')} aria-valuenow={Math.round(energy)} aria-valuemin={0} aria-valuemax={capacity}>
        <i style={{ width: pct + '%' }} className={low ? 'warn' : ''} />
        <s style={{ left: (capacity ? reserve / capacity * 100 : 0) + '%' }} title={t('reserve')} />
      </div>
      <div className="row"><span>{t('reserve')}</span><b>{reserve} u.</b></div>
    </section>
    <p className="gravity-note">g {realGravity.toFixed(2)} m/s² · {t('gravityNote')}</p>
  </>;
}

export function ZoneTitle() {
  const { t } = useT();
  const { zone, zoneAt, now } = useStore(hud);
  if (!zone || now - zoneAt > 4.2) return null;
  return <div className="zone-title" key={zoneAt} aria-live="polite">{t(zone)}</div>;
}

export function Prompt() {
  const { t } = useT();
  const { prompt, notice, now, locked, dialogue } = useStore(hud);
  const showNotice = notice && now - notice.at < 6 && !dialogue;
  return <div className="center-bottom">
    {showNotice && <p className={'notice ' + notice.tone} key={notice.at}>
      <span>{notice.tone === 'luma' ? t('noticeLuma') : notice.tone === 'warn' ? t('noticeWarn') : t('noticeSystem')}</span>{t(notice.text)}
    </p>}
    {prompt && !dialogue && <p className="prompt" data-prompt>
      <kbd>E</kbd> {t(prompt.verb)} · <b>{t(prompt.title)}</b>{prompt.cost > 0 && <em> · {prompt.cost} u.</em>}
      {prompt.blocked.length > 0 && <small>{t('requires')}: {prompt.blocked.map(b => t(b)).join(', ')}</small>}
      {prompt.missing && <small>{t('suitLacks')} {t(prompt.missing).toLowerCase()}</small>}
    </p>}
    {!locked && !dialogue && <p className="hint">{t('hint')}</p>}
  </div>;
}

/** Story dialogue: speaker tag, white card and an advance button, in the style of a visual-novel box. */
export function DialogueBox() {
  const { t } = useT();
  const line = useStore(hud, s => s.dialogue);
  if (!line) return null;
  return <div className="dialogue" role="dialog" aria-label={line.speaker} data-dialogue>
    <span className={'speaker ' + line.speaker.toLowerCase()}>{line.speaker}</span>
    <p>{t(line.text)}</p>
    <button onClick={() => commands.advance()} aria-label={t('advance')}>{t('advance')}</button>
  </div>;
}

export function AchievementToast() {
  const { t } = useT();
  const { toast, now } = useStore(hud);
  if (!toast || now - toast.at > 4.5) return null;
  const a = achievements[toast.id as AchievementId];
  return <div className="toast" key={toast.id + toast.at} role="status" data-toast={toast.id}>
    <span>{t('unlocked')}</span><b>{t(a.title)}</b><small>{t(a.desc)}</small>
  </div>;
}

export function Fade() {
  const fade = useStore(hud, s => s.fade);
  return fade > 0 ? <div className="fade" style={{ opacity: fade }} /> : null;
}
