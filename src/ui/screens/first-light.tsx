import { useEffect, useRef } from 'react';
import { firstLightArchive, fuelLeft, spacecraft, type Campaign } from '../../core/campaign.ts';
import { discoveries, extras } from '../../core/orbit/content.ts';
import { evaluateMission, t, type TransferRoute } from '../../core/orbit/engineering.ts';
import { archiveId, firstLightCabinLine, firstLightClosure, launchRequest, recoveryDossier } from '../../core/orbit/first-light.ts';
import { playLumaLine, stopLumaLine } from '../../engine/voice.ts';
import { useT } from '../i18n.ts';
import type { SortieSummary } from './sortie-report.tsx';

export const firstLightSummaries:Record<string,SortieSummary>={
  departure:{
    title:t('Aurora despega','Aurora lifts off'),
    text:t('La ves cruzar el patio rumbo a la lanzadera. Esa es la última vez que la ves en la Tierra antes del viaje.',
      'You watch her cross the plaza toward the shuttle. That is the last time you see her on Earth before the journey.'),
    action:t('Continuar','Continue'),brief:true,
  },
  ground:{
    title:t('Expediente de Aurora disponible','Aurora file available'),
    text:t('Control abrió el aviso de recuperación. Revísalo y prepara la nave con la que vas a buscar a tu hermana.',
      'Mission Control has opened the recovery notice. Read it and prepare the craft you will use to search for your sister.'),
    action:t('Abrir terminal de planificación','Open planning terminal'),brief:true,
  },
  station:{
    title:t('La cápsula es de Aurora','The capsule is from Aurora'),
    text:t('AUR-E01 quedó validada. LUMA espera en su cápsula de transporte. El registrador exterior conserva otra parte de la señal.',
      'AUR-E01 is validated. LUMA is waiting in his transport pod. The exterior recorder holds another part of the signal.'),
    action:t('Pasar a la esclusa','Proceed to the airlock'),
  },
  eva:{
    title:t('El registrador apunta a la Luna','The recorder points to the Moon'),
    text:t(`AUR-E02 quedó validada en la esclusa. El relé lunar guardó ${archiveId}. Entrega la lectura de iluminación y traza el traslado.`,
      `AUR-E02 was validated in the airlock. The lunar relay stored ${archiveId}. Submit the lighting observation and plan your transfer.`),
    action:t('Planificar traslado lunar','Plan the lunar transfer'),
  },
};

export function FirstLightDossier(){
  const {t:translate}=useT();
  return <div className="first-light-dossier">
    <div className="first-light-briefings">
      {recoveryDossier.map(entry=><article key={entry.id} data-dossier={entry.id}>
        <span className="mini">{entry.id}</span>
        <h2>{translate(entry.title)}</h2>
        <p>{translate(entry.text)}</p>
      </article>)}
    </div>
    <p className="first-light-order">{translate(launchRequest)}</p>
  </div>;
}

export function FirstLightArchive({state,points}:{state:Campaign;points:readonly string[]}){
  const {t:translate}=useT();
  const found=firstLightArchive(state);
  points.forEach(id=>found.add(id));
  return <div className="first-light-archive">
    <details>
      <summary>{translate(t('Hallazgos de Primera luz','First Light discoveries'))} · {discoveries.filter(item=>found.has(item.stage)).length}/{discoveries.length}</summary>
      <ul>{discoveries.filter(item=>found.has(item.stage)).map(item=><li key={item.label.en}>{translate(item.label)}</li>)}</ul>
    </details>
    <details>
      <summary>{translate(t('Encargos opcionales','Optional assignments'))} · {extras.filter(e=>found.has(e.id)).length}/{extras.length}</summary>
      <ul>{extras.map(item=><li key={item.id}>{found.has(item.id)?'✓':'○'} {translate(
        item.id==='keepsake'&&!found.has('capsule')?t('Recuerdo sin identificar','Unidentified keepsake'):item.text)}</li>)}</ul>
    </details>
  </div>;
}

export function FirstLightCabinSubtitle({open}:{open:boolean}){
  const {t:translate,lang}=useT();
  useEffect(()=>{
    if(!open)return;
    void playLumaLine('moon-cruise','chat',0,lang);
    return stopLumaLine;
  },[open,lang]);
  if(!open)return null;
  return <blockquote className="first-light-cabin-line" aria-live="polite">
    <b>LUMA</b> {translate(firstLightCabinLine)}
  </blockquote>;
}

export function FirstLightCabin(){
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const node=host.current;
    if(!node)return;
    let active=true,dispose:(()=>void)|undefined;
    import('../../engine/first-light-cabin.ts').then(({mountFirstLightCabin})=>{
      if(active)dispose=mountFirstLightCabin(node);
    }).catch(()=>{/* The transfer panel remains playable if this background cannot render. */});
    return ()=>{active=false;dispose?.();};
  },[]);
  return <div className="game-host first-light-cabin" ref={host} aria-hidden="true"/>;
}

export function FirstLightArrival({state,route}:{state:Campaign;route:TransferRoute}){
  const {t:translate}=useT();
  const arrival=state.log.find(entry=>entry.id==='moon-arrive')?.result;
  const fuelAtDocking=arrival?.kind==='flight'?arrival.telemetry.fuel:fuelLeft(state);
  const report=evaluateMission(spacecraft(state),route,fuelAtDocking);
  const {limits}=report;
  return <>
    <p>{translate(firstLightClosure)}</p>
    <dl className="first-light-results">
      <div><dt>{translate(t('Plan de vuelo','Flight plan'))}</dt><dd>{report.hours} / {limits.time} h</dd></div>
      <div><dt>{translate(t('Datos archivados','Data archived'))}</dt><dd>{limits.data} / {limits.link} GB</dd></div>
      <div><dt>{translate(t('Combustible al acoplar','Fuel at docking'))}</dt><dd>{report.fuel.toFixed(1)} u.</dd></div>
    </dl>
    <p className="first-light-order">{translate(t('Equipo entregado al nodo: lector del registrador, observación de luz y cápsula de transporte de LUMA. El siguiente paso es escoger dónde alunizar.',
      'Delivered to the node: recorder reader, lighting observation and LUMA’s transport pod. Next, choose a landing site.'))}</p>
  </>;
}
