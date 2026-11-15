// Title screen, pause, settings, achievements and credits. Structure after REGOLITH: large spaced title, premise,
// a vertical list and a data card, over a slow camera orbit of the crater.
import { useState } from 'react';
import { useStore } from 'zustand';
import { achievementIds, achievements } from '../../core/achievements.ts';
import { tierIds } from '../../engine/quality.ts';
import { useT } from '../i18n.ts';
import { prefs } from '../prefs.ts';
import { commands, hud } from '../store.ts';

type Sub = 'settings' | 'achievements' | 'journal' | 'credits' | null;

export function MainMenu() {
  const { t } = useT();
  const { hasProgress, facts, destinations, collection } = useStore(hud);
  const [sub, setSub] = useState<Sub>(null);
  if (sub) return <SubScreen sub={sub} onBack={() => setSub(null)} />;
  return <div className="screen menu-screen">
    <section className="menu-main">
      <h1 className="game-title">ÓRBITA</h1>
      <p className="game-subtitle">{t('subtitle')}</p>
      <p className="premise">{facts ? t(facts.premise) : t('premise')}</p>
      <nav className="menu-list" aria-label="menu">
        {hasProgress && <button className="first" data-menu="continue" onClick={() => commands.continueGame()}>{t('continue')}</button>}
        <button className={hasProgress ? '' : 'first'} data-sfx="ui-confirm" data-menu="new" onClick={() => commands.newGame()}>{t('newExpedition')}</button>
        {destinations.filter(d => !d.current).map(d => d.unlocked
          ? <button key={d.id} data-sfx="ui-confirm" data-travel={d.id} onClick={() => commands.travel(d.id)}>{t('travelTo')} {t(d.name)} ↗</button>
          : <button key={d.id} disabled data-travel-locked={d.id}>{t(d.name)} · {t('routeLocked')}</button>)}
        <button data-sfx="ui-open" data-menu="settings" onClick={() => setSub('settings')}>{t('settings')}</button>
        <button data-sfx="ui-open" data-menu="achievements" onClick={() => setSub('achievements')}>{t('achievements')}</button>
        {collection.atlas.length + collection.pages.length > 0 && <button data-sfx="ui-open" data-menu="journal" onClick={() => setSub('journal')}>{t('journal')}</button>}
        <button data-sfx="ui-open" data-menu="credits" onClick={() => setSub('credits')}>{t('credits')}</button>
      </nav>
    </section>
    {facts && <aside className="panel data-card" aria-label={t('operation')}>
      <dl>
        <dt>{t('operation')}</dt><dd>{facts.operation}</dd>
        <dt>{t('body')}</dt><dd>{t(facts.body)}</dd>
        <dt>{t('gravity')}</dt><dd>{facts.gravity}</dd>
        <dt>{t('atmosphere')}</dt><dd>{t(facts.atmosphere)}</dd>
        <dt>{t('temperature')}</dt><dd>{facts.temperature}</dd>
        <dt>{t('lastContact')}</dt><dd>{t(facts.lastContact)}</dd>
        <dt>{t('status')}</dt><dd className="blink">{t(facts.status)}</dd>
      </dl>
      <a className="source" href={facts.source.url} target="_blank" rel="noreferrer">{facts.source.name} ↗</a>
    </aside>}
  </div>;
}

export function PauseMenu() {
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
        <button data-pause="menu" onClick={() => commands.toMenu()}>{t('mainMenu')}</button>
      </nav>
    </section>
  </div>;
}

function SubScreen({ sub, onBack }: { sub: Exclude<Sub, null>; onBack(): void }) {
  const { t } = useT();
  return <div className="screen sub-screen">
    <section className="panel sub" role="dialog" aria-label={t(sub === 'settings' ? 'settings' : sub === 'achievements' ? 'achievements' : sub === 'journal' ? 'journal' : 'credits')}>
      {sub === 'settings' && <Settings />}
      {sub === 'achievements' && <Achievements />}
      {sub === 'journal' && <Journal />}
      {sub === 'credits' && <Credits />}
      <button className="back" data-sfx="ui-close" data-back onClick={onBack}>← {t('back')}</button>
    </section>
  </div>;
}

function Settings() {
  const { t } = useT();
  const p = useStore(prefs);
  const [initialQuality] = useState(p.quality);
  return <>
    <span className="panel-title">{t('settings').toUpperCase()}</span>
    <div className="setting"><span>{t('language')}</span>
      <div className="choice">{(['es', 'en'] as const).map(l => <button key={l} data-lang={l} className={p.lang === l ? 'on' : ''} onClick={() => prefs.setState({ lang: l })}>{l.toUpperCase()}</button>)}</div>
    </div>
    <label className="setting"><span>{t('sensitivity')} · {p.sensitivity.toFixed(2)}</span>
      <input type="range" min={0.3} max={3} step={0.05} value={p.sensitivity} onChange={e => prefs.setState({ sensitivity: Number(e.target.value) })} />
    </label>
    {(['master', 'music', 'sfx'] as const).map(k => <label className="setting" key={k}>
      <span>{t(k === 'master' ? 'volumeMaster' : k === 'music' ? 'volumeMusic' : 'volumeSfx')} · {Math.round(p[k] * 100)}%</span>
      <input type="range" min={0} max={1} step={0.05} value={p[k]} data-volume={k} onChange={e => prefs.setState({ [k]: Number(e.target.value) })} />
    </label>)}
    <p className="setting-hint">{t('audioNote')}</p>
    <div className="setting"><span>{t('reduceMotion')}</span>
      <div className="choice">{[true, false].map(v => <button key={String(v)} className={p.reduceMotion === v ? 'on' : ''} onClick={() => prefs.setState({ reduceMotion: v })}>{t(v ? 'on' : 'off')}</button>)}</div>
    </div>
    <div className="setting"><span>{t('paintedSky')}</span>
      <div className="choice">{[true, false].map(v => <button key={String(v)} data-sky={String(v)} className={p.paintedSky === v ? 'on' : ''} onClick={() => prefs.setState({ paintedSky: v })}>{t(v ? 'on' : 'off')}</button>)}</div>
    </div>
    <div className="setting"><span>{t('quality')}</span>
      <div className="choice">{(['auto', ...tierIds] as const).map(q => <button key={q} className={p.quality === q ? 'on' : ''} onClick={() => prefs.setState({ quality: q })}>{q === 'auto' ? t('auto') : q}</button>)}</div>
    </div>
    {p.quality !== initialQuality && <p className="setting-note">{t('applyReload')} <button onClick={() => window.location.reload()}>{t('reloadNow')}</button></p>}
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

/** Rock atlas and Aurora journal of the current destination. Unfound entries stay as placeholders. */
function Journal() {
  const { t } = useT();
  const { atlas, pages } = useStore(hud, s => s.collection);
  return <>
    <span className="panel-title">{t('atlas').toUpperCase()} · {atlas.filter(a => a.fact).length}/{atlas.length}</span>
    <ul className="achievement-list journal-list">
      {atlas.map(a => <li key={a.id} className={a.fact ? 'got' : ''} data-entry={a.id}>
        <span aria-hidden="true" className="atlas">{a.fact ? '▲' : '△'}</span>
        <div><b>{t(a.title)}</b>{a.fact && <small>{t(a.fact)} · <em>{t(a.basis === 'observation' ? 'observation' : 'simplification')}</em> · <a href={a.source!.url} target="_blank" rel="noreferrer">{a.source!.name} ↗</a></small>}</div>
      </li>)}
    </ul>
    {pages.length > 0 && <>
      <span className="panel-title">{t('pages').toUpperCase()} · {pages.filter(p => p.text).length}/{pages.length}</span>
      <ul className="achievement-list journal-list">
        {pages.map(p => <li key={p.id} className={p.text ? 'got' : ''} data-entry={p.id}>
          <span aria-hidden="true" className="pages">{p.text ? '■' : '□'}</span>
          <div><b>{t(p.title)}</b>{p.text ? <small>{t(p.text)}</small> : <small>{t('lockedHint')}</small>}</div>
        </li>)}
      </ul>
    </>}
  </>;
}

const sources = [
  { url: 'https://www.nasa.gov/international-space-station/space-station-facts-and-figures/', name: 'NASA · Space Station Facts and Figures', use: { es: 'Órbita baja y estación de referencia del capítulo 1; la estación de recepción del juego es ficción.', en: 'Low orbit and reference station for chapter 1; the game’s reception station is fiction.' }, kind: 'reference' as const },
  { url: 'https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/', name: 'NASA · Spacewalk Spacesuit Basics', use: { es: 'Temperaturas de una EVA (unos −157 … +121 °C) y refrigeración del traje; el gasto de batería al sol es una simplificación.', en: 'EVA temperatures (about −157 … +121 °C) and suit cooling; the battery cost in sunlight is a simplification.' }, kind: 'simplified' as const },
  { url: 'https://science.nasa.gov/moon/facts/', name: 'NASA · Moon Facts', use: { es: 'Gravedad (1/6 de la terrestre), temperaturas y exosfera del menú; hielo en sombras permanentes de los polos.', en: 'Gravity (1/6 of Earth), temperatures and exosphere in the menu; ice in permanently shadowed polar regions.' }, kind: 'observed' as const },
  { url: 'https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/', name: 'NASA Space Apps · Space Mission Design Game', use: { es: 'Reto que responde el bucle de diseño, simulación, informe y rediseño.', en: 'Challenge answered by the design, simulation, report and redesign loop.' }, kind: 'reference' as const },
  { url: 'https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf#page=8', name: 'NASA · Design and Develop Science Missions', use: { es: 'Idea de compromisos entre masa, energía e instrumentos.', en: 'Trade-offs between mass, power and instruments.' }, kind: 'simplified' as const },
  { url: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm', name: 'PDS · LRO LOLA', use: { es: 'Referencia de topografía lunar; el cráter del juego es procedural, no un producto LOLA.', en: 'Lunar topography reference; the game crater is procedural, not a LOLA product.' }, kind: 'fiction' as const },
  { url: 'https://science.nasa.gov/mars/facts/', name: 'NASA · Mars Facts', use: { es: 'Gravedad (0,38 g), temperaturas y atmósfera de CO₂ del menú de Marte.', en: 'Gravity (0.38 g), temperatures and CO₂ atmosphere in the Mars menu.' }, kind: 'observed' as const },
  { url: 'https://science.nasa.gov/mission/msl-curiosity/', name: 'NASA · Curiosity (Gale crater)', use: { es: 'Capas sedimentarias depositadas por agua antigua; inspiran el valle y la meseta, que son inventados.', en: 'Sedimentary layers laid down by ancient water; they inspire the valley and mesa, which are invented.' }, kind: 'simplified' as const },
  { url: 'https://www.nasa.gov/sounds-from-beyond/', name: 'NASA · Sounds from Beyond (Perseverance)', use: { es: 'Marte transmite sonido en su atmósfera tenue (viento, remolinos): base del viento del nivel, generado por código.', en: 'Mars carries sound in its thin atmosphere (wind, dust devils): basis for the level’s wind, generated in code.' }, kind: 'simplified' as const },
  { url: 'https://science.nasa.gov/resource/dust-devils-on-mars/', name: 'NASA · Dust devils on Mars', use: { es: 'Remolinos de polvo observados por los rovers; la tormenta que provoca el relé es ficción de juego.', en: 'Dust devils seen by the rovers; the storm set off by the relay is game fiction.' }, kind: 'fiction' as const },
  { url: 'https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/', name: 'NASA · Sunrises and sunsets on Mars', use: { es: 'Cielo diurno anaranjado y halo azul junto al Sol por el polvo fino.', en: 'Orange daytime sky and a blue halo near the Sun from fine dust.' }, kind: 'observed' as const },
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
