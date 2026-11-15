import { option, type Campaign } from '../core/campaign.ts';
import { levels, type LevelModule } from './registry.ts';
import { point, t } from './expedition-shapes.ts';

export async function loadCampaignLevel(site:string,state:Campaign):Promise<LevelModule>{
  if(site==='moon'){
    const m=await import('./moon/campaign.ts');
    return {level:m.campaignMoon(option(state,'moon-site')==='slope'?'slope':'ridge'),dialogue:m.lunarCampaignDialogue};
  }
  if(site==='eva'){
    const m=await import('./orbit/level.ts');
    return {level:m.evaLevel(option(state,'eva-plan')==='sunlit'?'sunlit':'sheltered'),dialogue:{}};
  }
  if(site==='mars'){
    const m=await import('./mars/level.ts');
    return {level:m.marsLevel(option(state,'mars-site')==='basin'?'basin':'beacon'),dialogue:m.marsDialogue};
  }
  return levels[site]();
}

export async function loadReturnExpedition(site:string,state:Campaign):Promise<LevelModule>{
  const {level}=await loadCampaignLevel(site,state);
  const visits:Record<string,string[]>={
    moon:['geo-1','geo-2','geo-3'],mars:['outcrop','basin','ridge'],bennu:['access-west','access-east','sample'],
  };
  const title=t('Expedición de seguimiento','Follow-up expedition');
  return {dialogue:{},level:{...level,mission:'postgame-'+site,title,
    briefing:t('Puedes volver a los lugares del viaje. Recoge observaciones y ecos desde el módulo de apoyo.',
      'You can revisit places from the journey. Collect observations and echoes from the support lander.'),
    arrival:t('Canal de Control abierto. El diario de Aurora está en la nave.','Mission Control online. Aurora’s journal is aboard.'),
    outcome:t('Resultados de seguimiento archivados.','Follow-up results archived.'),
    exit:'post-return',props:level.props.filter(p=>p.kind!=='crew'),
    points:[...level.points.filter(p=>visits[site].includes(p.id)).map(p=>({...p,prerequisites:[],required:false})),
      point('post-return',level.zones[0].id,level.spawn.x,level.spawn.z,'upload',t('Regresar al módulo','Return to the lander'),
        t('Lecturas de seguimiento entregadas.','Follow-up readings submitted.'))],
  }};
}
