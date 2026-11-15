// Helmet view interface: a drawn helmet frame, a HUD projected on the glass (canvas, see draw.ts) and a chin cluster
// with battery, link, radar scope and LUMA's state. Display only: it never changes progress, energy or rewards.
import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { reserve } from '../../core/suit.ts';
import { useT } from '../i18n.ts';
import { prefs } from '../prefs.ts';
import { hud, type LumaHud } from '../store.ts';
import { startHelmet } from './draw.ts';
import { radarRange } from './feed.ts';
import './visor.css';

// Visor opening in a 1600×900 box stretched to the screen; the chin rises toward the centre to hold the scope.
const opening = 'M800 30C1180 30 1420 56 1508 126C1562 170 1574 330 1570 520C1568 640 1544 704 1440 716C1240 704 1040 690 800 690C560 690 360 704 160 716C56 704 32 640 30 520C26 330 38 170 92 126C180 56 420 30 800 30Z';

function Frame() {
  return <svg className="helmet-frame" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="helmet-shell" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#161c26" /><stop offset="0.7" stopColor="#0d1118" /><stop offset="1" stopColor="#07090d" />
      </linearGradient>
    </defs>
    <path d={'M0 0H1600V900H0Z' + opening} fill="url(#helmet-shell)" fillRule="evenodd" />
    {/* Seal: rubber gasket, a lighter ridge, a highlight and the projector's cyan edge. */}
    <path d={opening} className="seal" />
    <path d={opening} className="ridge" />
    <path d={opening} className="shine" />
    {/* Padding stitches in the upper corners and the chin plate with its screws. */}
    <path d="M40 150C70 70 190 26 420 14M1560 150C1530 70 1410 26 1180 14" className="stitch" />
    <path d="M120 742C380 726 600 716 800 716C1000 716 1220 726 1480 742" className="plate" />
    {[[70, 760], [1530, 760], [70, 872], [1530, 872]].map(([x, y]) => <g key={x + '-' + y} className="screw"><circle cx={x} cy={y} r="7" /><path d={`M${x - 4} ${y - 3}L${x + 4} ${y + 3}`} /></g>)}
  </svg>;
}

/** Arc gauge over 270°: value arc, tick ring and an amber mark for the return reserve. */
function BatteryGauge() {
  const { t } = useT();
  const { energy, capacity, draining } = useStore(hud);
  const pct = capacity ? Math.max(0, Math.min(1, energy / capacity)) : 0, low = energy - reserve < 15;
  const mark = (capacity ? reserve / capacity : 0) * 270 - 135, arc = 'M21.7 78.3A40 40 0 1 1 78.3 78.3';
  return <div className={'gauge battery' + (low ? ' low' : '')} data-helmet-battery={low ? 'low' : 'ok'}>
    <svg viewBox="0 0 100 100">
      <path d={arc} className="track" pathLength="100" />
      <path d={arc} className="value" pathLength="100" strokeDasharray={`${pct * 100} 100`} />
      <path d="M50 4V13" className="reserve" transform={`rotate(${mark} 50 50)`} />
      <text x="50" y="52" className="num">{Math.round(energy)}</text>
      <text x="50" y="68" className="unit">/ {capacity} u.</text>
    </svg>
    <span>{t('battery')}</span>
    <em className={draining || low ? 'hot' : ''}>{draining ? '▲ ' + t(draining) : low ? t({ es: 'en reserva', en: 'at reserve' }) : t({ es: 'estable', en: 'steady' })}</em>
  </div>;
}

function LinkGauge() {
  const { t } = useT();
  const signal = useStore(hud, s => s.signal);
  const bars = Math.round(signal * 6), weak = signal < 0.5;
  return <div className={'gauge link' + (weak ? ' low' : '')} data-helmet-link={weak ? 'weak' : 'ok'}>
    <svg viewBox="0 0 100 100">
      {[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={12 + i * 13.5} y={62 - i * 9} width="9" height={14 + i * 9} className={i < bars ? 'on' : 'off'} />)}
      <text x="50" y="96" className="pct">{Math.round(signal * 100)}%</text>
    </svg>
    <span>{t({ es: 'enlace', en: 'link' })}</span>
    <em>{weak ? t({ es: 'débil', en: 'weak' }) : t({ es: 'nominal', en: 'nominal' })}</em>
  </div>;
}

/** Mission clock and required objectives, as a small flight-recorder window. */
function SortieClock() {
  const { t } = useT();
  const elapsed = useStore(hud, s => Math.floor(s.elapsed));
  const objectives = useStore(hud, s => s.objectives);
  const required = objectives.filter(o => o.required), done = required.filter(o => o.done).length;
  const two = (n: number) => String(n).padStart(2, '0'), step = Math.min(12, 64 / Math.max(1, required.length));
  return <div className="gauge clock" data-helmet-clock>
    <svg viewBox="0 0 100 100">
      <rect x="8" y="24" width="84" height="56" rx="6" />
      <text x="50" y="40" className="tag">T+</text>
      <text x="50" y="60">{two(Math.floor(elapsed / 60))}:{two(elapsed % 60)}</text>
      {required.map((o, i) => <rect key={o.id} className={'pip' + (o.done ? ' done' : '')} x={50 - required.length * step / 2 + i * step + 1.5} y="67" width={step - 3} height="6" />)}
    </svg>
    <span>{t({ es: 'misión', en: 'mission' })}</span>
    <em>{done}/{required.length} {t('objectives')}</em>
  </div>;
}

/** LUMA's slot: a small face while it is with you; an empty dashed socket once it is gone, for good. */
function LumaSlot({ luma }: { luma: LumaHud | null }) {
  const { t } = useT();
  if (!luma || luma.state === 'gone') return <div className="luma-slot empty" data-helmet-luma={luma ? 'gone' : 'none'}>
    <svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" rx="14" className="socket" /></svg>
    <span>LUMA</span>
    <em>{luma ? t({ es: 'ranura vacía', en: 'empty slot' }) : t({ es: 'sin emparejar', en: 'not paired' })}</em>
  </div>;
  const state = luma.state === 'carried' ? 'carried' : luma.alert ? 'alert' : luma.warm ? 'warm' : luma.state;
  const label = state === 'carried' ? t({ es: 'en tus brazos', en: 'in your arms' }) : state === 'alert' ? t({ es: 'alerta', en: 'alert' })
    : state === 'warm' ? t({ es: 'te calienta', en: 'warming you' }) : state === 'busy' ? t({ es: 'corriendo', en: 'running' })
    : state === 'cooldown' ? t({ es: 'descansa', en: 'resting' }) + ' ' + Math.ceil(luma.wait) + ' s' : t({ es: 'lista · G', en: 'ready · G' });
  const rest = luma.state === 'cooldown' && luma.cooldown ? 1 - luma.wait / luma.cooldown : 1;
  return <div className={'luma-slot ' + state} data-helmet-luma={state}>
    <svg viewBox="0 0 100 100">
      <rect x="20" y="20" width="60" height="60" rx="14" className="body" />
      <rect x="20" y="58" width="60" height="8" className="band" />
      {luma.state === 'cooldown' ? <path d="M32 43H44M56 43H68" className="eyes shut" /> : <><circle cx="38" cy="42" r="5" className="eyes" /><circle cx="62" cy="42" r="5" className="eyes" /></>}
      <rect x="20" y="88" width={60 * rest} height="4" className="rest" />
    </svg>
    <span>LUMA</span>
    <em>{label}</em>
  </div>;
}

function Helmet() {
  const { t } = useT();
  const calm = useStore(prefs, p => p.reduceMotion);
  const effects = useStore(prefs, p => p.effects);
  const luma = useStore(hud, s => s.luma);
  const low = useStore(hud, s => s.capacity > 0 && s.energy - reserve < 15);
  const glass = useRef<HTMLCanvasElement>(null), scope = useRef<HTMLCanvasElement>(null);
  useEffect(() => startHelmet(glass.current!, scope.current!), []);
  return <div className={'helmet' + (calm ? ' calm' : '') + (low ? ' low' : '')} data-visor data-helmet aria-hidden="true">
    <i className="helmet-tint" />{effects&&<><i className="helmet-glint" /><i className="helmet-fog" /></>}
    <canvas className="helmet-hud" ref={glass} data-helmet-hud />
    <Frame />
    {effects && !calm && <i className="helmet-sweep" />}
    <div className="helmet-chin" data-helmet-chin>
      <div className="side left"><BatteryGauge /><LinkGauge /></div>
      <div className="scope" data-helmet-radar><canvas ref={scope} /><small>{radarRange} m</small></div>
      <div className="side right"><LumaSlot luma={luma} /><SortieClock /></div>
    </div>
    <span className="sr">{t({ es: 'Vista de casco', en: 'Helmet view' })}</span>
  </div>;
}

/** Mounted only in the helmet view, so the power-on plays every time the player switches to it. */
export function HelmetHud() {
  const view = useStore(hud, s => s.view);
  return view === 'first' ? <Helmet /> : null;
}
