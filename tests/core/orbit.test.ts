import { test } from 'node:test';
import assert from 'node:assert/strict';
import { route, type World } from '../../src/core/contract/grid-v1.ts';
import { exteriors, station, type EvaRoute } from '../../src/core/orbit/content.ts';
import {
  assessDesign, assessTransfer, defaultDesign, flightReserve, routes, scienceDesign, type Design, type TransferRoute,
} from '../../src/core/orbit/engineering.ts';
import { advanceFlight, flightChecks, flightFailure, initialFlight, neutral, type FlightId } from '../../src/core/orbit/flight.ts';
import {
  activateField, advanceCruise, authorizeLaunch, beginEva, captureFlight, collectedStages, completedMissions,
  currentFuel, evidence, fileReport, finishCruise, freshOrbit, fuelLeft, lunarHandoff, missionNumber, orbitReport,
  planTransfer, readBriefing, recordedData, restoreOrbit, setDesign, type OrbitState,
} from '../../src/core/orbit/progress.ts';

function guided(s:OrbitState,id:FlightId){
  let craft=initialFlight(id,fuelLeft(s),s.design.orbit);
  const mass=assessDesign(s.design).mass;
  for(let i=0;i<1800&&!flightChecks(id,craft).canCapture&&!flightFailure(craft);i++){
    craft=advanceFlight(id,craft,{...neutral,guide:true},1/60,mass);
  }
  assert.equal(flightFailure(craft),null);
  assert.equal(flightChecks(id,craft).canCapture,true);
  assert.ok(craft.fuel<fuelLeft(s));
  const next=captureFlight(s,id,craft);
  assert.notEqual(next,s,'guided approach must preserve the reserves: '+id);
  return next;
}
function use(s:OrbitState,field:'station'|'eva',world:World,id:string){
  const point=world.points.find(p=>p.id===id)!;
  const save=s[field]!;
  const walk=route(world,save.position,point.position);
  assert.notEqual(walk,null,id);
  const result=activateField(s,field,id,walk!.at(-1)??save.position);
  assert.equal(result.error,undefined,id);
  return result.state;
}

test('engineering decisions cause explainable mass, orbit, power, communications, science and time trade-offs',()=>{
  const light=assessDesign(defaultDesign),science=assessDesign(scienceDesign);
  assert.equal(light.ok,true);
  assert.equal(science.ok,true);
  assert.ok(science.observation.passes>light.observation.passes);
  assert.ok(science.mass>light.mass&&science.cost>light.cost&&science.data>light.data&&science.science>light.science);
  const unsuitable=assessDesign({...defaultDesign,objective:'illumination',orbit:'survey',instruments:['precision','camera']});
  assert.ok(unsuitable.constraints.some(c=>c.id==='orbit'&&!c.ok));
  assert.ok(unsuitable.constraints.some(c=>c.id==='power'&&!c.ok));
  assert.ok(unsuitable.constraints.some(c=>c.id==='link'&&!c.ok));
  const heavyOnCompact=assessDesign({...defaultDesign,structure:'endurance'});
  assert.ok(heavyOnCompact.constraints.some(c=>c.id==='mass'&&!c.ok));
  const expensive=assessDesign({...scienceDesign,structure:'endurance',instruments:['reader','precision','meter','camera']});
  assert.ok(expensive.constraints.some(c=>c.id==='budget'&&!c.ok));
  assert.ok(expensive.constraints.some(c=>c.id==='power'&&!c.ok));
  assert.equal(assessTransfer(defaultDesign,'economy',90).okTime,false);
  assert.equal(assessTransfer(scienceDesign,'economy',85).ok,true);
  assert.equal(assessTransfer(scienceDesign,'express',40).okFuel,false);
  const invalid=setDesign(readBriefing(freshOrbit()),{...defaultDesign,orbit:'survey'});
  assert.equal(authorizeLaunch(invalid),invalid);
});

test('capture requires position, closing speed and heading, and controls spend fuel',()=>{
  const a=initialFlight('dock',95,'direct');
  const drift=advanceFlight('dock',a,neutral,1/60,5900);
  assert.equal(drift.vx,a.vx);
  assert.ok(drift.x>a.x);
  assert.equal(drift.fuel,a.fuel);
  const brake=advanceFlight('dock',a,{...neutral,brake:true},1/60,5900);
  assert.ok(brake.vx<a.vx&&brake.fuel<a.fuel);
  const aligned={...a,x:-1,y:0,vx:0,vy:0,heading:0};
  assert.equal(flightChecks('dock',aligned).canCapture,true);
  assert.equal(flightChecks('dock',{...aligned,vx:8}).canCapture,false);
  assert.equal(flightChecks('dock',{...aligned,heading:45}).canCapture,false);
  assert.equal(flightChecks('dock',{...aligned,x:-10}).canCapture,false);
  assert.equal(flightChecks('dock',{...aligned,fuel:flightReserve-1}).canCapture,false);
});

test('both flight profiles can run all six missions, keep evidence ordered and restore a safe lunar handoff',()=>{
  for(const [design,evaRoute,transfer] of [
    [defaultDesign,'sheltered','express'],
    [scienceDesign,'sunlit','economy'],
  ] as [Design,EvaRoute,TransferRoute][]){
    let s=setDesign(readBriefing(freshOrbit()),design);
    assert.equal(lunarHandoff(s),null);
    s=authorizeLaunch(s);assert.equal(missionNumber(s),2);
    s=guided(s,'launch');assert.equal(missionNumber(s),3);
    assert.equal(restoreOrbit(s)?.phase,'dock');
    s=guided(s,'dock');
    assert.equal(activateField(s,'station','capsule-auth',{x:8,y:2}).error,'requirements');
    assert.equal(activateField(s,'station','supplies',station.spawn).error,undefined);
    s=use(s,'station',station,'supplies');
    s=use(s,'station',station,'capsule');
    assert.deepEqual(evidence(s),[]);
    assert.equal(missionNumber(s),4);
    for(const id of ['protected-bay','rest','protection','translator','capsule-auth'])s=use(s,'station',station,id);
    assert.deepEqual(evidence(s),['AUR-E01']);
    assert.equal(missionNumber(s),5);
    s=beginEva(s,evaRoute);
    const map=exteriors[evaRoute];
    s=use(s,'eva',map,'sun-record');
    assert.ok(recordedData(s)>0);
    s=use(s,'eva',map,'recorder');
    assert.deepEqual(evidence(s),['AUR-E01']);
    s=use(s,'eva',map,'airlock');
    assert.equal(recordedData(s),assessDesign(design).data);
    assert.deepEqual(evidence(s),['AUR-E01','AUR-E02']);
    s=planTransfer(s,transfer);
    s=guided(s,'depart');
    const startFuel=fuelLeft(s);
    assert.equal(finishCruise(s),s);
    s=advanceCruise(s);
    assert.equal(restoreOrbit(s)?.cruiseHours,s.cruiseHours);
    assert.ok(currentFuel(s)<startFuel);
    for(let i=0;i<30;i++)s=advanceCruise(s);
    assert.equal(currentFuel(s),startFuel-routes[transfer].fuel);
    s=finishCruise(s);
    assert.equal(fuelLeft(s),startFuel-routes[transfer].fuel);
    assert.deepEqual(restoreOrbit(s),s);
    s=guided(s,'lunar-approach');
    assert.equal(completedMissions(s),5);
    assert.equal(lunarHandoff(s),null);
    s=fileReport(s);
    const arrival=lunarHandoff(s);
    assert.equal(arrival?.entryMission,'C2-M01');
    assert.equal(arrival?.destination,'lunar-node');
    assert.deepEqual(arrival?.evidence,['AUR-E01','AUR-E02']);
    assert.equal(arrival?.companion.protected,true);
    assert.equal(completedMissions(s),6);
    assert.equal(restoreOrbit(JSON.parse(JSON.stringify(s)))?.phase,'complete');
    assert.equal(restoreOrbit({...s,cruiseHours:0}),null);
    assert.equal(restoreOrbit({...s,eva:{...s.eva,completed:['airlock'],last:'airlock'}}),null);
    assert.equal(fileReport(s),s);
    assert.ok(orbitReport(s)!.score<=100&&orbitReport(s)!.score>60);
    assert.equal(collectedStages(s).has('keepsake'),false);
  }
});
