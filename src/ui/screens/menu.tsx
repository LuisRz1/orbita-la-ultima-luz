// Title screen, pause, settings, achievements and credits. Structure after REGOLITH: large spaced title, premise,
// a vertical list and a data card, over a slow camera orbit of the crater.
import { useState } from 'react';
import { useStore } from 'zustand';
import { achievementIds, achievements } from '../../core/achievements.ts';
import { tierIds } from '../../engine/quality.ts';
import { useT } from '../i18n.ts';
import { prefs } from '../prefs.ts';
import { commands, hud } from '../store.ts';

type Sub = 'settings' | 'achievements' | 'credits' | null;

export function MainMenu({onCampaign,onExit}:{onCampaign?:()=>void;onExit?:()=>void}) {
  const { t } = useT();
  const { hasProgress, realGravity } = useStore(hud);
  const [sub, setSub] = useState<Sub>(null);
  if (sub) return <SubScreen sub={sub} onBack={() => setSub(null)} />;
  return <div className="screen menu-screen">
    <section className="menu-main">
      <h1 className="game-title">ÓRBITA</h1>
      <p className="game-subtitle">{t('subtitle')}</p>
      <p className="premise">{t('premise')}</p>
      <nav className="menu-list" aria-label="menu">
        {onCampaign&&<button className="first" data-menu="campaign" data-sfx="ui-confirm" onClick={onCampaign}>
          {t({es:'Jugar campaña de Aurora',en:'Play the Aurora campaign'})}</button>}
        {onExit&&<button className="first" onClick={onExit}>{t({es:'Volver a la portada',en:'Return to title'})}</button>}
        {hasProgress && <button className="first" data-menu="continue" onClick={() => commands.continueGame()}>{t('continue')}</button>}
        <button className={hasProgress ? '' : 'first'} data-sfx="ui-confirm" data-menu="new" onClick={() => commands.newGame()}>{t('newExpedition')}</button>
        <button data-sfx="ui-open" data-menu="settings" onClick={() => setSub('settings')}>{t('settings')}</button>
        <button data-sfx="ui-open" data-menu="achievements" onClick={() => setSub('achievements')}>{t('achievements')}</button>
        <button data-sfx="ui-open" data-menu="credits" onClick={() => setSub('credits')}>{t('credits')}</button>
      </nav>
    </section>
    <aside className="panel data-card" aria-label={t('operation')}>
      <dl>
        <dt>{t('operation')}</dt><dd>AURORA / C2</dd>
        <dt>{t('body')}</dt><dd>{t('moonBody')}</dd>
        <dt>{t('gravity')}</dt><dd>{realGravity.toFixed(2)} m/s² · 1/6 g</dd>
        <dt>{t('atmosphere')}</dt><dd>{t('exosphere')}</dd>
        <dt>{t('temperature')}</dt><dd>−173 … +127 °C</dd>
        <dt>{t('lastContact')}</dt><dd>{t('searchHalted')}</dd>
        <dt>{t('status')}</dt><dd className="blink">{t('silent')}</dd>
      </dl>
      <a className="source" href="https://science.nasa.gov/moon/facts/" target="_blank" rel="noreferrer">NASA · Moon Facts ↗</a>
    </aside>
  </div>;
}

export function PauseMenu({onExit}:{onExit?:()=>void}) {
  const { t } = useT();
  const [sub, setSub] = useState<Sub>(null);
  if (sub) return <SubScreen sub={sub} onBack={() => setSub(null)} />;
  return <div className="screen pause-screen">
    <section className="panel pause" role="dialog" aria-label={t('paused')}>
      <span className="panel-title">{t('paused').toUpperCase()}</span>
      <nav className="menu-list">
        <button className="first" data-pause="resume" onClick={() => commands.resume()}>{t('resume')}</button>
        <button onClick={() => setSub('settings')}>{t('settings')}</button>
        <button data-pause="abandon" onClick={() => commands.abandon()}>{t('abandon')}</button>
        <button data-pause="menu" onClick={onExit??(()=>commands.toMenu())}>{t('mainMenu')}</button>
      </nav>
    </section>
  </div>;
}

function SubScreen({ sub, onBack }: { sub: Exclude<Sub, null>; onBack(): void }) {
  const { t } = useT();
  return <div className="screen sub-screen">
    <section className="panel sub" role="dialog" aria-label={t(sub === 'settings' ? 'settings' : sub === 'achievements' ? 'achievements' : 'credits')}>
      {sub === 'settings' && <>
        <span className="panel-title">{t('settings').toUpperCase()}</span>
        <GameSettings />
      </>}
      {sub === 'achievements' && <Achievements />}
      {sub === 'credits' && <Credits />}
      <button className="back" data-sfx="ui-close" data-back onClick={onBack}>← {t('back')}</button>
    </section>
  </div>;
}

const qualityLabels = {
  auto: { es: 'Auto', en: 'Auto' },
  low: { es: 'Baja', en: 'Low' },
  medium: { es: 'Media', en: 'Medium' },
  high: { es: 'Alta', en: 'High' },
} as const;

export function GameSettings({ beforePlay = false }: { beforePlay?: boolean }) {
  const { t } = useT();
  const p = useStore(prefs);
  const [initialQuality] = useState(p.quality);
  return <>
    <div className="setting"><span>{t('language')}</span>
      <div className="choice" role="group" aria-label={t('language')}>
        {(['es', 'en'] as const).map(l => <button key={l} type="button" data-lang={l} aria-pressed={p.lang === l}
          className={p.lang === l ? 'on' : ''} onClick={() => prefs.setState({ lang: l })}>
          {l === 'es' ? 'Español' : 'English'}
        </button>)}
      </div>
    </div>
    <label className="setting"><span>{t('sensitivity')} · {p.sensitivity.toFixed(2)}</span>
      <input type="range" min={0.3} max={3} step={0.05} value={p.sensitivity} onChange={e => prefs.setState({ sensitivity: Number(e.target.value) })} />
    </label>
    {(['master', 'music', 'sfx'] as const).map(k => <label className="setting" key={k}>
      <span>{t(k === 'master' ? 'volumeMaster' : k === 'music' ? 'volumeMusic' : 'volumeSfx')} · {Math.round(p[k] * 100)}%</span>
      <input type="range" min={0} max={1} step={0.05} value={p[k]} data-volume={k} onChange={e => prefs.setState({ [k]: Number(e.target.value) })} />
    </label>)}
    {!beforePlay && <p className="setting-hint">{t('audioNote')}</p>}
    <div className="setting"><span>{t('reduceMotion')}</span>
      <div className="choice" role="group" aria-label={t('reduceMotion')}>
        {[true, false].map(value => <button key={String(value)} type="button" aria-pressed={p.reduceMotion === value}
          className={p.reduceMotion === value ? 'on' : ''} onClick={() => prefs.setState({ reduceMotion: value })}>
          {t(value ? 'on' : 'off')}
        </button>)}
      </div>
    </div>
    <div className="setting"><span>{t('quality')}</span>
      <div className="choice" role="group" aria-label={t('quality')}>
        {(['auto', ...tierIds] as const).map(quality => <button key={quality} type="button" aria-pressed={p.quality === quality}
          data-quality={quality} className={p.quality === quality ? 'on' : ''} onClick={() => prefs.setState({ quality })}>
          {t(qualityLabels[quality])}
        </button>)}
      </div>
    </div>
    {!beforePlay && p.quality !== initialQuality && <p className="setting-note">{t('applyReload')} <button onClick={() => window.location.reload()}>{t('reloadNow')}</button></p>}
  </>;
}

function Achievements() {
  const { t } = useT();
  const held = useStore(hud, s => s.achievements);
  return <>
    <span className="panel-title">{t('achievements').toUpperCase()} · {held.length}/{achievementIds.length}</span>
    <ul className="achievement-list">
      {achievementIds.map(id => <li key={id} className={held.includes(id) ? 'got' : ''} data-achievement={id}>
        <span aria-hidden="true">{held.includes(id) ? '■' : '□'}</span>
        <div><b>{t(achievements[id].title)}</b><small>{held.includes(id) ? t(achievements[id].desc) : t('lockedHint') + ' · ' + t(achievements[id].desc)}</small></div>
      </li>)}
    </ul>
  </>;
}

const sources = [
  { url: 'https://science.nasa.gov/moon/facts/', name: 'NASA · Moon Facts', use: { es: 'Gravedad (1/6 de la terrestre), temperaturas y exosfera del menú; hielo en sombras permanentes de los polos.', en: 'Gravity (1/6 of Earth), temperatures and exosphere in the menu; ice in permanently shadowed polar regions.' }, kind: 'observed' as const },
  { url: 'https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/', name: 'NASA Space Apps · Space Mission Design Game', use: { es: 'Reto que responde el bucle de diseño, simulación, informe y rediseño.', en: 'Challenge answered by the design, simulation, report and redesign loop.' }, kind: 'reference' as const },
  { url: 'https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf#page=8', name: 'NASA · Design and Develop Science Missions', use: { es: 'Idea de compromisos entre masa, energía e instrumentos.', en: 'Trade-offs between mass, power and instruments.' }, kind: 'simplified' as const },
  { url: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm', name: 'PDS · LRO LOLA', use: { es: 'Referencia de topografía lunar; el cráter del juego es procedural, no un producto LOLA.', en: 'Lunar topography reference; the game crater is procedural, not a LOLA product.' }, kind: 'fiction' as const },
];

function Credits() {
  const { t, lang } = useT();
  return <>
    <span className="panel-title">{t('credits').toUpperCase()}</span>
    <p>{t('creditsBody')}</p>
    <span className="slot-label">{t('sources')}</span>
    <ul className="source-list">
      {sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a><small><em>{t(s.kind)}</em> · {s.use[lang]}</small></li>)}
    </ul>
  </>;
}
