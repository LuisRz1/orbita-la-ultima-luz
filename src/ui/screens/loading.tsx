// Loading screen: a small planet, LUMA's light tracing an orbit with a fading trail, and mission-clock status lines.
// Pure SVG and CSS (no assets), so it shows the instant the page opens.
import { useEffect, useState } from 'react';
import { useT } from '../i18n.ts';

const lines = [
  { es: 'Sincronizando reloj de misión', en: 'Syncing mission clock' },
  { es: 'Calibrando el traje', en: 'Calibrating the suit' },
  { es: 'Horneando la luz del terreno', en: 'Baking terrain light' },
  { es: 'Buscando la señal de Aurora', en: 'Searching for Aurora’s signal' },
  { es: 'Despertando a LUMA', en: 'Waking LUMA' },
];
const orbit = 'M 30 112 A 70 22 -14 1 1 170 88 A 70 22 -14 1 1 30 112 Z';

export function LoadingScreen({ leaving = false }: { leaving?: boolean }) {
  const { t } = useT();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % lines.length), 1400);
    return () => clearInterval(id);
  }, []);
  return <div className={'loading-screen' + (leaving ? ' leaving' : '')} role="status" aria-live="polite" data-loading>
    <svg className="loading-orbit" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="ld-planet" cx="38%" cy="34%" r="70%">
          <stop offset="0" stopColor="#e8e3d6" /><stop offset=".55" stopColor="#8d8a84" /><stop offset="1" stopColor="#1b1f26" />
        </radialGradient>
        <radialGradient id="ld-glow"><stop offset="0" stopColor="#fff6d8" /><stop offset=".35" stopColor="#ffcf7a" stopOpacity=".85" /><stop offset="1" stopColor="#ffaf68" stopOpacity="0" /></radialGradient>
        <clipPath id="ld-back"><rect x="0" y="0" width="200" height="100" /></clipPath>
        <clipPath id="ld-front"><rect x="0" y="100" width="200" height="100" /></clipPath>
      </defs>
      <path d={orbit} className="ld-path" />
      {/* The orbit's far half passes behind the planet: its light is drawn first, then the planet covers it. */}
      <g clipPath="url(#ld-back)">{[0, 1, 2, 3, 4, 5].map(k => <circle key={'b' + k} r={6 - k * 0.8} fill="url(#ld-glow)" opacity={1 - k * 0.15}>
        <animateMotion dur="4.2s" repeatCount="indefinite" path={orbit} begin={`${-k * 0.07}s`} />
      </circle>)}</g>
      <circle cx="100" cy="100" r="34" fill="url(#ld-planet)" />
      <circle cx="100" cy="100" r="34" className="ld-limb" />
      <g clipPath="url(#ld-front)">{[0, 1, 2, 3, 4, 5].map(k => <circle key={'f' + k} r={6 - k * 0.8} fill="url(#ld-glow)" opacity={1 - k * 0.15}>
        <animateMotion dur="4.2s" repeatCount="indefinite" path={orbit} begin={`${-k * 0.07}s`} />
      </circle>)}</g>
    </svg>
    <h1 className="loading-title">ÓRBITA</h1>
    <p className="loading-sub">{t({ es: 'LA ÚLTIMA LUZ', en: 'THE LAST LIGHT' })}</p>
    <p className="loading-line" key={i}><span>›</span> {t(lines[i])}<i>…</i></p>
    <i className="loading-bar" />
  </div>;
}
