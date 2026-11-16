import { option, type Campaign } from '../core/campaign.ts';
import type { LevelModule } from './registry.ts';
import { point, t } from './expedition-shapes.ts';

export async function loadCampaignLevel(site:string,state:Campaign):Promise<LevelModule>{
  const facts = await import('./facts.ts');
  if(site==='moon'){
    const m=await import('./moon/campaign.ts');
    return {level:m.campaignMoon(option(state,'moon-site')==='slope'?'slope':'ridge'),dialogue:m.lunarCampaignDialogue,
      facts:facts.moonFacts,biome:'nacar'};
  }
  if(site==='mars'){
    const m=await import('./mars/campaign.ts');
    return {level:m.marsLevel(option(state,'mars-site')==='basin'?'basin':'beacon'),dialogue:m.marsDialogue,
      facts:facts.marsFacts,biome:'terracota'};
  }
  if(site==='bennu'||site==='service'){
    const m=await import('./bennu/campaign.ts');
    return site==='service'
      ? {level:m.serviceLevel,dialogue:m.serviceDialogue,facts:facts.extractionFacts,biome:'carbono'}
      : {level:m.bennuLevel,dialogue:m.bennuDialogue,facts:facts.bennuFacts,biome:'carbono'};
  }
  const m=await import('./orbit/campaign.ts');
  if(site==='departure')return {level:m.departureLevel,dialogue:m.departureDialogue,facts:facts.orbitFacts,biome:'tierra'};
  if(site==='ground')return {level:m.groundLevel,dialogue:{},facts:facts.orbitFacts,biome:'tierra'};
  if(site==='station')return {level:m.stationLevel,dialogue:m.stationDialogue,facts:facts.orbitFacts,biome:'quirofano'};
  if(site==='eva')return {level:m.evaLevel(option(state,'eva-plan')==='sunlit'?'sunlit':'sheltered'),
    dialogue:{},facts:facts.orbitFacts,biome:'quirofano'};
  if(site==='earth')return {level:m.earthLevel,dialogue:m.earthDialogue,facts:facts.orbitFacts,biome:'tierra'};
  throw new Error('Unknown campaign site: '+site);
}

export async function loadReturnExpedition(site:string,state:Campaign):Promise<LevelModule>{
  const source=await loadCampaignLevel(site,state);
  const {level}=source;
  const visits:Record<string,string[]>={
    moon:['geo-1','geo-2','geo-3'],mars:['outcrop','basin','ridge'],bennu:['access-west','access-east','sample'],
  };
  const title=t('Expedición de seguimiento','Follow-up expedition');
  return {...source,dialogue:{},level:{...level,mission:'postgame-'+site,title,
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
