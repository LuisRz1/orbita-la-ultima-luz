import { z } from 'zod';
import type { Localized } from '../../kit/contract.ts';
import { lowOrbitReference, observationModel } from './science.ts';

export const t = (es:string,en:string):Localized => ({es,en});
const item = (name:Localized, description:Localized) => ({name,description});

export const objectives = {
  trace:{...item(t('Rastrear el archivo de Aurora','Trace the Aurora archive'),
    t('Prioriza un registro de navegación recuperable.','Prioritize a usable navigation record.')), science:5},
  illumination:{...item(t('Caracterizar la iluminación exterior','Characterize exterior illumination'),
    t('Exige mayor detalle en la observación solar, sin abandonar el registro de Aurora.',
      'Require more detail in the solar observation while keeping the Aurora record as a goal.')), science:8},
};
export const structures = {
  scout:{...item(t('Nave ligera','Light support craft'),t('Menos masa y coste; menor autonomía y almacenamiento.',
    'Less mass and cost; lower endurance and storage.')), mass:4800, cost:20, draw:1.1, time:120, storage:16},
  endurance:{...item(t('Nave de larga duración','Endurance support craft'),t('Más soporte de vida y memoria; más masa y consumo base.',
    'More life support and memory; higher mass and baseline draw.')), mass:5700, cost:25, draw:1.4, time:156, storage:28},
};
export const batteries = {
  standard:{...item(t('Paneles y batería estándar','Standard panels and battery'),
    t('Ahorra masa. Adecuado para instrumentos de bajo consumo.','Saves mass. Suits low-power instruments.')), mass:300,cost:7, supply:3.4,time:0},
  expanded:{...item(t('Paneles y batería ampliados','Expanded panels and battery'),
    t('Más potencia y autonomía para sostener instrumentos y la nave.','More power and endurance for instruments and the spacecraft.')),
    mass:510,cost:11,supply:5.2,time:18},
};
export const antennas = {
  basic:{...item(t('Antena de banda estrecha','Narrowband antenna'),
    t('Ligera; necesita más tiempo para enviar un archivo grande.','Light; needs more time for a large file.')), mass:60,cost:3, draw:0.4,rate:0.5},
  dish:{...item(t('Antena direccional','Directional antenna'),
    t('Mayor tasa de transmisión con más peso, coste y consumo.','Higher data rate at higher mass, cost and draw.')), mass:170,cost:7,draw:0.8,rate:1.5},
};
export const launchers = {
  compact:{...item(t('Lanzador compacto','Compact launcher'),t('Más barato; limitado a la órbita directa.',
    'Cheaper; limited to the direct orbit.')), cost:12, lift:{direct:6100, survey:0}},
  heavy:{...item(t('Lanzador pesado','Heavy launcher'),t('Admite ambas órbitas; reduce el margen de presupuesto.',
    'Supports both orbits; leaves less budget headroom.')), cost:21,lift:{direct:7800,survey:7300}},
};
export const orbits = {
  direct:{...item(t('Órbita baja directa','Direct low Earth orbit'),
    t('Altitud de referencia de la ISS. Menos tránsito; la ventana de enlace de 10 h es del juego.',
      'ISS reference altitude. Shorter transit; the 10 h contact window is a game value.')),
    groundTime:8, contact:10, surveyHours:3, cost:0, fuel:100, height:lowOrbitReference.altitudeKm},
  survey:{...item(t('Órbita baja de reconocimiento','Survey low Earth orbit'),
    t('520 km en este escenario. Más oportunidades de observación; el encuentro requiere otra corrección.',
      '520 km in this scenario. More observing opportunities; the rendezvous needs another correction.')),
    groundTime:16, contact:14, surveyHours:5, cost:4, fuel:96, height:520},
};
export const instruments = {
  reader:{...item(t('Lector de registros','Record reader'),t('Recupera el registrador de Aurora con poco consumo.', 'Recovers the Aurora recorder with low draw.')),
    mass:160,power:0.5,cost:4,data:3,science:3,role:'reader'},
  precision:{...item(t('Lector de alta resolución','High-resolution reader'),t('Recupera más detalle, pero genera un archivo mayor.', 'Recovers more detail but generates a larger file.')),
    mass:300,power:0.9,cost:7,data:6,science:5,role:'reader'},
  meter:{...item(t('Fotómetro','Photometer'),t('Compara la iluminación con una lectura ligera.', 'Compares illumination with a lightweight reading.')),
    mass:90,power:0.5,cost:3,data:2,science:2,role:'light'},
  camera:{...item(t('Cámara de alto contraste','High-contrast camera'),t('Resuelve mejor los contrastes; suben masa, potencia, datos y coste.',
    'Resolves stronger contrasts at higher mass, power, data and cost.')), mass:260,power:1.1,cost:7,data:8,science:4,role:'light'},
} as const;
export const instrumentIds = ['reader','precision','meter','camera'] as const;

export const designSchema = z.object({
  objective:z.enum(['trace','illumination']), structure:z.enum(['scout','endurance']),
  battery:z.enum(['standard','expanded']), antenna:z.enum(['basic','dish']),
  launcher:z.enum(['compact','heavy']), orbit:z.enum(['direct','survey']),
  instruments:z.array(z.enum(instrumentIds)).max(4).refine(items=>new Set(items).size===items.length),
}).strict();
export type Design = z.infer<typeof designSchema>;
export const defaultDesign:Design = {objective:'trace',structure:'scout',battery:'standard',antenna:'basic',
  launcher:'compact',orbit:'direct',instruments:['reader','meter']};
export const scienceDesign:Design = {objective:'illumination',structure:'scout',battery:'expanded',antenna:'dish',
  launcher:'heavy',orbit:'survey',instruments:['precision','camera']};

export const routeIds = ['economy','express'] as const;
export type TransferRoute = typeof routeIds[number];
export const routes = {
  economy:{...item(t('Traslado de ahorro','Fuel-saving transfer'),
    t('Consume menos combustible; exige 120 horas de autonomía.', 'Uses less fuel; requires 120 hours of endurance.')), time:120,fuel:10},
  express:{...item(t('Traslado expreso','Fast transfer'),
    t('Reduce el tiempo a 72 horas; consume más combustible.', 'Cuts travel time to 72 hours; uses more fuel.')), time:72,fuel:22},
};
export const flightReserve = 12;
export const maxBudget = 90;
const evaKit = {mass:250,cost:5,power:0.2}; // Lleva equipo obligatorio de protección, acople y EVA.
const round = (value:number)=>Math.round(value*10)/10;
export type Constraint = {
  id:'orbit'|'mass'|'budget'|'power'|'data'|'link'|'time'|'instruments'|'science';
  label:Localized; used:number; limit:number; unit:string; ok:boolean; reason:Localized;
};

export function assessDesign(design:Design) {
  const craft=structures[design.structure], battery=batteries[design.battery], radio=antennas[design.antenna];
  const launcher=launchers[design.launcher], orbit=orbits[design.orbit];
  const payload=design.instruments.map(id=>instruments[id]);
  const total=(key:'mass'|'power'|'data'|'cost'|'science')=>payload.reduce((sum,value)=>sum+value[key],0);
  const mass=craft.mass+battery.mass+radio.mass+evaKit.mass+total('mass');
  const lift=launcher.lift[design.orbit];
  const cost=craft.cost+battery.cost+radio.cost+launcher.cost+orbit.cost+evaKit.cost+total('cost');
  const draw=round(craft.draw+radio.draw+evaKit.power+total('power'));
  const data=total('data'), link=radio.rate*orbit.contact;
  const observation=observationModel(orbit.height,orbit.surveyHours);
  const science=Math.min(total('science'),observation.scienceLimit), scienceNeeded=objectives[design.objective].science;
  const time=craft.time+battery.time, minTime=orbit.groundTime+routes.express.time;
  const roles=new Set(payload.map(i=>i.role));
  const constraints:Constraint[]=[
    {id:'orbit',label:t('Compatibilidad orbital','Orbital compatibility'),used:lift>0?1:0,limit:1,unit:'',ok:lift>0,
      reason:t('El lanzador compacto no llega al perfil de reconocimiento; cambia de órbita o lanzador.',
        'The compact launcher cannot reach the survey profile; switch orbit or launcher.')},
    {id:'mass',label:t('Masa / capacidad de carga','Mass / payload capacity'),used:mass,limit:lift,unit:'kg',ok:lift>0&&mass<=lift,
      reason:t('La estructura, sus sistemas y los instrumentos exceden la capacidad del lanzador para esa órbita.',
        'Structure, systems and instruments exceed the launcher capacity for that orbit.')},
    {id:'budget',label:t('Presupuesto','Budget'),used:cost,limit:maxBudget,unit:'cr',ok:cost<=maxBudget,
      reason:t('El coste total supera el presupuesto disponible. Revisa los componentes de mayor coste.',
        'Total cost exceeds the available budget. Review the most expensive components.')},
    {id:'power',label:t('Potencia demandada','Power demand'),used:draw,limit:battery.supply,unit:'kW',ok:draw<=battery.supply,
      reason:t('Nave, radio e instrumentos demandan más potencia de la disponible. Amplía el sistema o reduce la carga.',
        'Craft, radio and instruments draw too much power. Expand the power system or lighten the payload.')},
    {id:'data',label:t('Datos / memoria','Data / storage'),used:data,limit:craft.storage,unit:'GB',ok:data<=craft.storage,
      reason:t('El volumen de observación y escaneo no cabe en la memoria de la nave.',
        'Observation and scan data exceed onboard storage.')},
    {id:'link',label:t('Datos / enlace','Data / downlink'),used:data,limit:link,unit:'GB',ok:data<=link,
      reason:t('La tasa de la antena multiplicada por la ventana de contacto no permite entregar todos los datos.',
        'Antenna rate multiplied by the contact window cannot deliver all data.')},
    {id:'time',label:t('Tiempo mínimo / autonomía','Minimum time / endurance'),used:minTime,limit:time,unit:'h',ok:minTime<=time,
      reason:t('Ni el traslado más rápido cabe en la autonomía restante.',
        'Even the faster transfer exceeds available endurance.')},
    {id:'instruments',label:t('Tipos de instrumento','Instrument types'),used:roles.size,limit:2,unit:'',ok:roles.size===2,
      reason:t('La misión exige al menos un lector de registros y un instrumento de iluminación.',
        'The mission requires at least one record reader and one illumination instrument.')},
    {id:'science',label:t('Valor científico / mínimo','Science value / minimum'),used:science,limit:scienceNeeded,unit:'',ok:science>=scienceNeeded,
      reason:t('La combinación de instrumentos y oportunidades en órbita no alcanza el objetivo científico elegido.',
        'The instrument combination and observing opportunities do not reach the selected science goal.')},
  ];
  return {ok:constraints.every(c=>c.ok),constraints,mass,lift,cost,draw,power:battery.supply,
    data,storage:craft.storage,link,science,time,groundTime:orbit.groundTime,fuel:orbit.fuel,
    contact:orbit.contact,rate:radio.rate,altitude:orbit.height,observation};
}

export function assessTransfer(design:Design, id:TransferRoute, fuel:number) {
  const limits=assessDesign(design), route=routes[id];
  const hours=limits.groundTime+route.time;
  const fuelAfterCruise=fuel-route.fuel;
  // Además de la reserva de seguridad se prevé margen para salida y correcciones de aproximación.
  const okFuel=fuelAfterCruise>=flightReserve+12;
  return {ok:hours<=limits.time&&okFuel,okTime:hours<=limits.time,okFuel,hours,fuelAfterCruise};
}

export function evaluateMission(design:Design, route:TransferRoute, fuel:number) {
  const limits=assessDesign(design);
  const hours=limits.groundTime+routes[route].time;
  const sciencePoints=Math.min(20,Math.round(limits.science/12*20));
  const efficiency=Math.min(20,Math.round((maxBudget-limits.cost)/3+(limits.time-hours)/12+
    (fuel-flightReserve)/6));
  return {score:60+sciencePoints+efficiency,sciencePoints,efficiency, fuelUsed:limits.fuel-fuel, fuel, hours,limits};
}
