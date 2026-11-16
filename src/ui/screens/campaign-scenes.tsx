import { type CampaignCinematic } from '../../core/campaign.ts';
import { t } from '../../core/orbit/engineering.ts';
import { marsDialogue } from '../../levels/mars/dialogue.ts';
import { moonDialogue, recordedLuma } from '../../levels/moon/dialogue.ts';
import { orbitDialogue } from '../../levels/orbit/dialogue.ts';
import { Prologue, StoryScene, type SceneLine } from './prologue.tsx';

const moon = t('Bajo otro cielo','Under another sky');
const mars = t('El mundo rojo','The red world');
const bennu = t('Lo que queda de la luz','What remains of the light');
const earth = t('Aurora en casa','Aurora is home');

const scenes:Record<Exclude<CampaignCinematic,'prologue'>, {name:ReturnType<typeof t>; lines:SceneLine[]}>= {
  moon:{name:moon,lines:[
    {cue:'world',tag:t('NODO LUNAR','LUNAR NODE'),text:t('El nodo recibió el código del archivo. La siguiente búsqueda empieza en la superficie.',
      'The node received the archive code. The next search begins on the surface.')},
    {...recordedLuma('orbit',orbitDialogue,'complete',1),speaker:'LUMA',cue:'world',tag:moon},
  ]},
  mars:{name:mars,lines:[
    {cue:'world',tag:t('ARCHIVO AUTENTICADO','ARCHIVE AUTHENTICATED'),text:t('La bitácora y la caché coinciden. Aurora dejó un puesto de campo en Marte.',
      'The log and the cache match. Aurora left a field station on Mars.')},
    {...recordedLuma('moon',moonDialogue,'complete',1),speaker:'LUMA',cue:'world',tag:mars},
  ]},
  bennu:{name:bennu,lines:[
    {cue:'world',tag:t('RUMBO A BENNU','BOUND FOR BENNU'),text:t('El mensaje se envió desde Bennu. Llevamos reservas para traerlos a casa. Falta oír su respuesta.',
      'The message came from Bennu. We have reserves to bring them home. We still have to hear their reply.')},
    {...recordedLuma('mars',marsDialogue,'complete',3),speaker:'LUMA',cue:'world',tag:bennu},
  ]},
  earth:{name:earth,lines:[
    {cue:'world',tag:t('TIERRA · RECEPCIÓN CONFIRMADA','EARTH · ARRIVAL CONFIRMED'),text:t('Las tres personas de Aurora están a salvo. Tu hermana vuelve contigo al patio del lanzamiento.',
      'All three members of Aurora are safe. Your sister goes back to the launch plaza with you.')},
    {cue:'world',tag:t('TU HERMANA','YOUR SISTER'),text:t('¿Nos sentamos un rato? Desde aquí todavía se ve la pista.',
      'Can we sit for a while? You can still see the runway from here.')},
  ]},
};

export function CampaignCinematicScene({scene,busy,onFinish}:{scene:CampaignCinematic;busy:boolean;onFinish:()=>void}) {
  return <div className="campaign-sky campaign-cinematic" data-destination={scene}>
    {scene==='prologue'?<>
      <div className="campaign-orbital-art" aria-hidden="true"><i/><b/><span/></div>
      <Prologue afterDeparture busy={busy} onFinish={onFinish}/>
    </>:<StoryScene {...scenes[scene]} destination={scene} busy={busy} onFinish={onFinish}/>}
  </div>;
}
