import { useState } from 'react';
import { useStore } from 'zustand';
import type { Report } from '../../core/sortie.ts';
import { AchievementToast, CinematicCard, Compass, DialogueBox, Fade, LumaCard, MissionPanel, PhotoHint, Prompt, Telemetry, ViewChip, ZoneTitle } from '../hud.tsx';
import { useT } from '../i18n.ts';
import { commands, hud } from '../store.ts';
import { HelmetHud } from '../visor/helmet.tsx';
import { Epilogue } from './epilogue.tsx';
import { MainMenu, PauseMenu } from './menu.tsx';
import { Prologue } from './prologue.tsx';
import { ShipScreen } from './ship.tsx';
import { SortieReport, type SortieSummary } from './sortie-report.tsx';

export function SortieScreen({onCampaign,onExit,onComplete,busy=false,summary,campaign=false}:{
  onCampaign?:()=>void;onExit?:()=>void;onComplete?:(report:Report)=>void;busy?:boolean;summary?:SortieSummary;campaign?:boolean;
}){
  const {t}=useT();
  const {phase,report,saveError,paused,cinematic,photo,prologue,view}=useStore(hud);
  const [epilogue,setEpilogue]=useState(false);
  let body=null;
  if(phase==='menu')body=prologue?<Prologue/>:<MainMenu onCampaign={onCampaign} onExit={onExit}/>;
  else if(phase==='ship')body=<><ShipScreen/><ViewChip/></>;
  else if(phase==='report'&&report)body=epilogue?<Epilogue onClose={()=>setEpilogue(false)}/>:
    <SortieReport report={report} onRedesign={()=>commands.redesign()} onRetry={()=>commands.retry()}
      onEpilogue={()=>setEpilogue(true)} onExit={campaign?onExit:undefined}
      onComplete={onComplete&&report.outcome==='complete'?()=>onComplete(report):undefined} saving={busy} summary={summary}/>;
  else if(phase==='eva'&&cinematic)body=<CinematicCard/>;
  else if(phase==='eva'&&photo)body=<PhotoHint/>;
  else if(phase==='eva')body=<>
    <HelmetHud/><MissionPanel/><Compass/><Telemetry/>
    {view!=='first'&&<LumaCard/>}<ZoneTitle/><Prompt/><ViewChip/>
    {paused&&<PauseMenu onExit={campaign?onExit:undefined}/>}
  </>;
  return <>
    {phase==='menu'&&<Fade/>}{body}{phase!=='menu'&&<Fade/>}
    {!(phase==='eva'&&paused)&&<DialogueBox/>}<AchievementToast/>
    {saveError&&<p className="save-error">{t('saveError')}</p>}
  </>;
}
