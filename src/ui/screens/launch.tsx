import { useT } from '../i18n.ts';
import { GameSettings } from './menu.tsx';
import './launch.css';

export function LaunchSetup({ onPlay, onCampaign, onExpeditions }: {
  onPlay: () => void;
  onCampaign: () => void;
  onExpeditions: () => void;
}) {
  const { t } = useT();
  return <main className="launch-screen">
    <div className="launch-frame">
      <section className="launch-intro" aria-labelledby="launch-title">
        <div className="launch-orbit" aria-hidden="true"><i /></div>
        <header>
          <h1 id="launch-title">Órbita</h1>
          <p>{t({ es: 'La última luz', en: 'The Last Light' })}</p>
        </header>
        <p>{t({
          es: 'Una estación ha recuperado una cápsula de Aurora. Sigue su rastro y encuentra a tu hermana.',
          en: 'A station has recovered a capsule from Aurora. Follow its trail and find your sister.',
        })}</p>
        <dl className="launch-controls">
          <div><dt><kbd>WASD</kbd></dt><dd>{t({ es: 'Moverse', en: 'Move' })}</dd></div>
          <div><dt>{t({ es: 'Ratón', en: 'Mouse' })}</dt><dd>{t({ es: 'Girar la cámara', en: 'Look around' })}</dd></div>
          <div><dt><kbd>E</kbd></dt><dd>{t({ es: 'Interactuar', en: 'Interact' })}</dd></div>
          <div><dt><kbd>V</kbd></dt><dd>{t({ es: 'Cambiar cámara', en: 'Switch camera' })}</dd></div>
        </dl>
      </section>
      <section className="launch-settings" aria-labelledby="launch-settings-title">
        <h2 id="launch-settings-title">{t({ es: 'Configura tu partida', en: 'Set up your game' })}</h2>
        <GameSettings beforePlay />
        <div className="launch-actions">
          <button type="button" className="launch-play" data-sfx="ui-confirm" onClick={onPlay}>
            {t({ es: 'Jugar Primera luz', en: 'Play First Light' })} <span aria-hidden="true">→</span>
          </button>
          <button type="button" onClick={onCampaign}>{t({ es: 'Campaña de Aurora', en: 'Aurora campaign' })}</button>
          <button type="button" onClick={onExpeditions}>{t({ es: 'Expedición lunar', en: 'Lunar expedition' })}</button>
        </div>
      </section>
    </div>
  </main>;
}
