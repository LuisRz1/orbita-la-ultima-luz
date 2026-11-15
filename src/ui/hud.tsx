// In-sortie HUD: mission panel, telemetry, energy, prompts, zone titles, dialogue and achievement toasts.
import { useStore } from 'zustand';
import { achievements, type AchievementId } from '../core/achievements.ts';
import { reserve } from '../core/suit.ts';
import { debugEnabled } from '../engine/debug.ts';
import { useT } from './i18n.ts';
import { commands, hud } from './store.ts';

const clock = (s: number) => {
  const t = Math.floor(s);
  return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60].map(n => String(n).padStart(2, '0')).join(':');
};

export function MissionPanel() {
  const { t } = useT();
  const { levelTitle, objectives, echoes, elapsed, compass } = useStore(hud);
  if (!levelTitle) return null;
  const required = objectives.filter(o => o.required);
  const goal = compass.marks.find(m => m.kind === 'goal');
  return <section className="panel mission" aria-label={t('eva')}>
    <span className="panel-title">{t('eva')} · {clock(elapsed)}</span>
    <h1>{t(levelTitle)}</h1>
    <div className="next" data-next>
      <span>{t('nextGoal')}</span>
      <b>{goal?.label ? t(goal.label) : t('allDone')}</b>
      {goal && <em>{Math.round(goal.dist)} m</em>}
    </div>
    <div className="row"><span>{t('objectives')}</span>
      <b className="pips" aria-label={required.filter(o => o.done).length + '/' + required.length}>
        {required.map(o => <i key={o.id} data-objective={o.id} className={o.done ? 'done' : ''} title={t(o.title)} />)}
      </b>
    </div>
    <div className="row"><span>{t('echoes')}</span><b>{echoes.found}/{echoes.total}</b></div>
  </section>;
}

/** Compass strip: ±70° around the camera heading, cardinal ticks, the next objective and the lander. */
export function Compass() {
  const { t } = useT();
  const { compass } = useStore(hud);
  const span = 70 * Math.PI / 180;
  const rel = (bearing: number) => { let d = bearing - compass.heading; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const place = (bearing: number) => { const d = rel(bearing); return Math.abs(d) > span ? null : 50 + d / span * 50; };
  const cardinals: [string, number][] = [['N', Math.PI], ['E', Math.PI / 2], ['S', 0], ['O', -Math.PI / 2], ['NE', Math.PI * 0.75], ['SE', Math.PI / 4], ['SO', -Math.PI / 4], ['NO', -Math.PI * 0.75]];
  return <div className="compass" aria-hidden="true">
    {cardinals.map(([name, b]) => { const x = place(b); return x === null ? null : <span key={name} className={name.length > 1 ? 'minor' : ''} style={{ left: x + '%' }}>{name}</span>; })}
    {compass.marks.map(m => {
      const d = rel(m.bearing), x = Math.abs(d) > span ? (d > 0 ? 100 : 0) : 50 + d / span * 50;
      return <b key={m.id} className={'mark ' + m.kind + (Math.abs(d) > span ? ' edge' : '')} style={{ left: x + '%' }} data-mark={m.id}>
        {m.kind === 'home' ? '⌂' : '◆'}<small>{Math.round(m.dist)} m</small>
      </b>;
    })}
    <i className="center" />
    <span className="sr">{t('nextGoal')}</span>
  </div>;
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
      {debugEnabled() && <>
        <div className="row"><span>pos</span><b>{player.x.toFixed(0)} / {player.z.toFixed(0)}</b></div>
        <div className="row"><span>alt</span><b>{player.y.toFixed(1)} m</b></div>
        <div className="row"><span>vel</span><b>{player.speed.toFixed(1)} m/s</b></div>
      </>}
    </section>
    <section className="panel energy-panel" aria-label={t('systems')}>
      <span className="panel-title">{t('systems')}</span>
      <div className="row nowrap"><span>{t('battery')}{draining ? <em className="cold" title={t(draining)}> {draining.en === 'dust' ? '≋' : draining.en === 'sun' ? '☀' : '❄'}</em> : ''}</span><b className={low ? 'warn' : ''}>{energy.toFixed(0)} / {capacity} u.</b></div>
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
  const { prompt, notice, now, locked, dialogue, elapsed } = useStore(hud);
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
    {!dialogue && (elapsed < 25 || !locked) && <p className="hint">{t('hint')}</p>}
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
