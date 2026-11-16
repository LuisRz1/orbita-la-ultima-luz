// Prologue of a new expedition: about 45 narrated words over the title scene, with letterbox bars, one visual cue
// per line and subtitles. Skippable at any time; the guided suit-up starts when it ends.
import { useEffect, useEffectEvent, useState } from 'react';
import type { Localized } from '../../core/contract/grid-v1.ts';
import { sound } from '../../engine/audio.ts';
import { bundledLumaVoice, playLumaLine, stopLumaLine } from '../../engine/voice.ts';
import type { LumaRecording } from '../../levels/moon/dialogue.ts';
import { useT } from '../i18n.ts';
import { prefs } from '../prefs.ts';
import { commands, hud } from '../store.ts';

const narration = import.meta.glob('../../assets/voice/prologue/*/*.m4a', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

type Cue = 'flatline' | 'stamp' | 'capsule' | 'glow' | 'title' | 'world';
export type SceneLine = { text: Localized; cue: Cue; tag: Localized; recording?: LumaRecording; speaker?: 'LUMA' };
export const prologueLines: SceneLine[] = [
  { text: { es: 'Hace meses, la expedición Aurora dejó de responder.', en: 'Months ago, the Aurora expedition stopped answering.' }, cue: 'flatline',
    tag: { es: 'EXP. AURORA · ÚLTIMO CONTACTO', en: 'EXP. AURORA · LAST CONTACT' } },
  { text: { es: 'Tu hermana iba a bordo. La búsqueda se suspendió.', en: 'Your sister was on board. The search was called off.' }, cue: 'stamp',
    tag: { es: 'BÚSQUEDA SUSPENDIDA', en: 'SEARCH SUSPENDED' } },
  { text: { es: 'Hasta hoy. Una cápsula de emergencia acaba de llegar a la estación.', en: 'Until today. An emergency capsule has just reached the station.' }, cue: 'capsule',
    tag: { es: 'ESTACIÓN DE RECEPCIÓN · CÁPSULA RECUPERADA', en: 'RECEPTION STATION · CAPSULE RECOVERED' } },
  { text: { es: 'Dentro viaja algo vivo.', en: 'Something inside it is alive.' }, cue: 'glow',
    tag: { es: 'BIOSEÑAL DETECTADA', en: 'BIOSIGNAL DETECTED' } },
  { text: { es: 'Prepara tu traje, piloto. Si queda una luz ahí fuera, vas a encontrarla.', en: 'Suit up, pilot. If there is still a light out there, you will find it.' }, cue: 'title',
    tag: { es: 'ÓRBITA · LA ÚLTIMA LUZ', en: 'ORBIT · THE LAST LIGHT' } },
];

/** Reading time when a line has no recording (or audio is blocked): about 2.6 words per second, at least 2.4 s. */
const readTime = (text: string) => Math.max(2.4, text.split(/\s+/).length / 2.6);

export function StoryScene({ name, lines, destination, heading, busy=false, onFinish }: {
  name:Localized; lines:SceneLine[]; destination?:'moon'|'mars'|'bennu'|'earth'; heading?:Localized;
  busy?:boolean; onFinish:()=>void;
}) {
  const { t, lang } = useT();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [ended,setEnded]=useState(false);
  const finish = () => {
    if(busy)return;
    setEnded(true);
    stopLumaLine();
    onFinish();
  };
  const finishAtEnd=useEffectEvent(finish);

  useEffect(() => {
    if(ended)return;
    let alive = true, timer: ReturnType<typeof setTimeout> | undefined;
    setShown(false);
    const line = lines[index];
    const url = !destination && narration[`../../assets/voice/prologue/${lang}/${index}.m4a`];
    const voice = line.speaker==='LUMA' ? playLumaLine('scene-'+destination,'line',index,lang,
      line.recording&&bundledLumaVoice(lang,line.recording)) : url ? sound.narrate(url) : Promise.resolve(0);
    const reveal = setTimeout(() => alive && setShown(true), 250);
    const last = index===lines.length-1;
    void voice.then(seconds => {
      if (!alive) return;
      const hold = (seconds || readTime(line.text[lang])) + (last ? 2.2 : 0.9);
      timer = setTimeout(() => {
        if(last)finishAtEnd();
        else setIndex(i=>i+1);
      }, hold*1000);
    });
    return () => { alive = false; clearTimeout(reveal); if (timer) clearTimeout(timer); stopLumaLine(); };
  }, [index, lang, lines, destination, ended]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (['Escape', 'Enter', 'Space', 'KeyE'].includes(e.code)) { e.preventDefault(); finish(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const line = lines[index];
  const calm = prefs.getState().reduceMotion;
  return <div className={'prologue' + (calm ? ' calm' : '')} data-prologue={destination?undefined:index}
    data-story-scene={destination??'prologue'} onClick={finish} role="dialog" aria-label={t(name)}>
    {destination&&<div className="story-orb" aria-hidden="true"/>}
    <i className="bar-top" /><i className="bar-bottom" />
    {heading&&index===0&&<span className="prologue-heading">{t(heading)}</span>}
    <div className={'prologue-cue ' + line.cue + (shown ? ' on' : '')} key={index} aria-hidden="true">
      {line.cue === 'flatline' && <svg viewBox="0 0 300 60"><path className="pulse" d="M0 30 H70 L80 12 L92 48 L104 22 L114 36 L124 30 H300" /></svg>}
      {line.cue === 'stamp' && <span className="stamp">{t(line.tag)}</span>}
      {line.cue === 'capsule' && <span className="beacon-dot" />}
      {line.cue === 'glow' && <span className="life-glow" />}
      {line.cue === 'title' && <><h2>ÓRBITA</h2><small>{t({ es: 'LA ÚLTIMA LUZ', en: 'THE LAST LIGHT' })}</small></>}
      {line.cue !== 'stamp' && line.cue !== 'title' && <span className="tag">{t(line.tag)}</span>}
    </div>
    <p className={'prologue-sub' + (shown ? ' on' : '')} key={'s' + index} aria-live="polite">
      {line.speaker&&<b>{line.speaker}</b>}{t(line.text)}
    </p>
    <button type="button" className="prologue-skip" disabled={busy}>
      {t(ended?{es:'Continuar',en:'Continue'}:{es:'Saltar · E / Espacio',en:'Skip · E / Space'})}
    </button>
  </div>;
}

export function Prologue({ onFinish, afterDeparture=false, busy=false }: {
  onFinish?: () => void; afterDeparture?:boolean; busy?:boolean;
} = {}) {
  return <StoryScene name={{es:'Prólogo',en:'Prologue'}} lines={prologueLines} busy={busy}
    heading={afterDeparture?{es:'Meses después',en:'Months later'}:undefined} onFinish={()=>{
      hud.setState({prologue:false});
      if(onFinish)onFinish();
      else commands.newGame();
    }}/>;
}
