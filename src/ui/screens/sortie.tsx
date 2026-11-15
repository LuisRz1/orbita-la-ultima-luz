import { useStore } from 'zustand';
import type { Report } from '../../core/sortie.ts';
import { AchievementToast, Compass, DialogueBox, Fade, MissionPanel, Prompt, Telemetry, ZoneTitle } from '../hud.tsx';
import { useT } from '../i18n.ts';
import { commands, hud } from '../store.ts';
import { MainMenu, PauseMenu } from './menu.tsx';
import { ShipScreen } from './ship.tsx';
import { SortieReport, type SortieSummary } from './sortie-report.tsx';

export function SortieScreen({onCampaign,onExit,onComplete,busy=false,summary}:{
  onCampaign?:()=>void;onExit?:()=>void;onComplete?:(report:Report)=>void;busy?:boolean;summary?:SortieSummary;
}){
  const {t}=useT();
  const {phase,report,saveError,paused}=useStore(hud);
  let body=null;
  if(phase==='menu')body=<MainMenu onCampaign={onCampaign} onExit={onExit}/>;
  else if(phase==='ship')body=<ShipScreen/>;
  else if(phase==='report'&&report)body=<SortieReport report={report} onRedesign={()=>commands.redesign()} onRetry={()=>commands.retry()}
    onComplete={onComplete&&report.outcome==='complete'?()=>onComplete(report):undefined} saving={busy} summary={summary}/>;
  else if(phase==='eva')body=<>
    <MissionPanel/><Compass/><Telemetry/><ZoneTitle/><Prompt/><Fade/>
    {paused&&<PauseMenu onExit={onExit}/>}
  </>;
  return <>
    {body}<DialogueBox/><AchievementToast/>
    {saveError&&<p className="save-error">{t('saveError')}</p>}
  </>;
}
