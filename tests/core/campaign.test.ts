import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptStage, acknowledgeCampaignScene, activeStage, collectedEvidence, flightMinimum, fuelLeft, missionLog, newCampaign, pendingCampaignScene, people,
  restoreCampaign, spacecraft, validEvidence, voyage, type Campaign, type CampaignResult } from '../../src/core/campaign.ts';
import { bulkheadColliders, checkLevel, walkable, type LevelV2 } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { assessDesign, defaultDesign, scienceDesign } from '../../src/core/orbit/engineering.ts';
import { advanceFlight, flightChecks, initialFlight, neutral } from '../../src/core/orbit/flight.ts';
import { firstLightSuit, validFirstLightField } from '../../src/core/orbit/first-light.ts';
import { actionCost, assessSuit, proposals, reserve } from '../../src/core/suit.ts';
import { bennuLevel, serviceLevel } from '../../src/levels/bennu/campaign.ts';
import { marsLevel } from '../../src/levels/mars/campaign.ts';
import { campaignMoon } from '../../src/levels/moon/campaign.ts';
import { departureLevel, earthLevel, evaLevel, groundLevel, stationLevel } from '../../src/levels/orbit/campaign.ts';

const fieldLevels:LevelV2[]=[departureLevel,groundLevel,stationLevel,evaLevel('sheltered'),evaLevel('sunlit'),
  campaignMoon('ridge'),campaignMoon('slope'),marsLevel('beacon'),marsLevel('basin'),bennuLevel,serviceLevel,earthLevel];
test('all destinations and variants are connected on foot or by a continuous chain of anchors',()=>{
  for(const level of fieldLevels){
    const terrain=buildHeightfield(level.terrain.size,level.terrain.res,level.terrain.height);
    assert.deepEqual(checkLevel(level,terrain,defaultParams.maxSlope),[],level.mission);
    assert.ok(level.zones.every(z=>z.title.es&&z.title.en));
    const design=proposals.find(p=>p.id==='science')!.design;
    const actionEnergy=level.points.filter(p=>p.required).reduce((uses,p)=>uses+actionCost(p.power,p.action,design),0);
    assert.ok(actionEnergy+reserve+25<assessSuit(design).capacity,level.mission+' lacks a feasible energy margin');
  }
});

test('Earth and First Light props leave a walking approach to objectives and discoveries',()=>{
  for(const level of [departureLevel,groundLevel,earthLevel,stationLevel,evaLevel('sheltered'),evaLevel('sunlit')]){
    const hf=buildHeightfield(level.terrain.size,level.terrain.res,level.terrain.height);
    const bay=level.pressurizedBay;
    const colliders=[...(bay?bulkheadColliders(bay):[]),...level.props.map(({solid})=>solid)];
    const safe=(x:number,z:number)=>{
      if(bay&&(x<=bay.min.x||x>=bay.max.x||z<=bay.min.z||z>=bay.max.z))return false;
      if(level.anchorCourse&&!level.anchorCourse.anchors.some(a=>Math.hypot(a.x-x,a.z-z)<level.anchorCourse!.length))return false;
      return !colliders.some(s=>s.kind==='box'?
        Math.abs(s.x-x)<s.hx+defaultParams.radius&&Math.abs(s.z-z)<s.hz+defaultParams.radius:
        Math.hypot(s.x-x,s.z-z)<s.r+defaultParams.radius);
    };
    const reach=walkable(hf,level.spawn,defaultParams.maxSlope,safe),cell=hf.size/(hf.res-1);
    for(const {id,position} of level.collectibles){
      const i=Math.round((position.x+hf.size/2)/cell),j=Math.round((position.z+hf.size/2)/cell);
      assert.ok(reach[j*hf.res+i],level.mission+' / '+id);
    }
    for(const p of level.points){
      const i=Math.round((p.position.x+hf.size/2)/cell),j=Math.round((p.position.z+hf.size/2)/cell);
      assert.ok(reach[j*hf.res+i]||[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dz])=>
        reach[(j+dz)*hf.res+i+dx]&&Math.hypot(p.position.x-((i+dx)*cell-hf.size/2),
          p.position.z-((j+dz)*cell-hf.size/2))<=p.radius),level.mission+' / '+p.id);
    }
  }
});

test('the launch and reception scenes share Earth-specific infrastructure',()=>{
  for(const level of [departureLevel,groundLevel,earthLevel]){
    assert.equal(level.terrain,groundLevel.terrain);
    assert.ok(level.terrain.aprons?.length);
    assert.ok(level.terrain.markings?.length);
    assert.ok(level.props.every(p=>p.kind.startsWith('earth-')&&p.solid.kind==='box'));
    const assets=new Set(level.props.map(p=>p.kind));
    for(const kind of ['earth-control','earth-hangar','earth-rocket','earth-tower','earth-tree'] as const)assert.ok(assets.has(kind));
  }
});

test('First Light rejects proof out of order and both vehicle kits have a viable EVA reserve',()=>{
  const steps=['supplies','capsule','protected-bay','rest','protection','translator','capsule-auth'];
  assert.ok(validFirstLightField('station',steps,'sheltered'));
  assert.ok(!validFirstLightField('station',steps.toReversed(),'sheltered'));
  assert.ok(!validFirstLightField('station',[...steps,'keepsake'],'sheltered'));
  assert.ok(!validFirstLightField('eva',['sun-record','airlock','recorder'],'sheltered'));
  for(const design of [defaultDesign,scienceDesign]){
    const kit=firstLightSuit(design),stats=assessSuit(kit);
    assert.deepEqual(stats.problems,[]);
    assert.ok(kit.instruments.includes('camera')&&kit.instruments.includes('drill'));
    for(const level of [evaLevel('sheltered'),evaLevel('sunlit')]){
      const costs=level.points.filter(p=>p.required).reduce((sum,p)=>sum+actionCost(p.power,p.action,kit),0);
      assert.ok(costs+reserve+30<stats.capacity);
    }
  }
});

test('the playable opening is saved separately and prior mission logs resume directly',()=>{
  const fresh=newCampaign();
  assert.equal(pendingCampaignScene(fresh),'departure');
  assert.equal(acknowledgeCampaignScene(fresh,'prologue',true),fresh);
  const narrated=acknowledgeCampaignScene(fresh,'departure',true);
  assert.equal(pendingCampaignScene(narrated),'prologue');
  assert.deepEqual(restoreCampaign(JSON.parse(JSON.stringify(narrated))),narrated);
  assert.equal(restoreCampaign({...narrated,cinematic:'bennu'}),null);
  const opened=acknowledgeCampaignScene(narrated,'prologue',true);
  assert.equal(pendingCampaignScene(opened),null);
  assert.equal(pendingCampaignScene(acknowledgeCampaignScene(fresh,'departure',false)),null);
  assert.equal(missionLog(opened).length,0);
  const existing=acceptStage(fresh,'ground',{kind:'field',points:['control'],energy:64});
  assert.equal(pendingCampaignScene(restoreCampaign(existing)!),null);
});

test('both vehicle profiles can finish all 24 missions with valid maneuvers and ordered rescue evidence',()=>{
  for(const full of [false,true]){
    const init=newCampaign();
    let state=init;
    const choices:Record<string,string>={
      'eva-plan':full?'sunlit':'sheltered','moon-plan':full?'economy':'express','moon-site':full?'slope':'ridge',
      'mars-plan':full?'express':'efficient','mars-site':full?'basin':'beacon','rescue-plan':'rescue',
    };
    assert.equal(acceptStage(init,'epilogue',{kind:'report'}),init);
    for(let stage=activeStage(state);stage;stage=activeStage(state)){
      let result:CampaignResult={kind:'report'};
      if(stage.action==='design')result={kind:'design',design:full?scienceDesign:defaultDesign,briefing:true};
      else if(stage.action==='field'){
        if(stage.site==='bennu'){
          const missing=stage.required!.filter(id=>id!=='board-geologist');
          assert.equal(acceptStage(state,stage.id,{kind:'field',points:missing,energy:9}),state);
        }
        result={kind:'field',points:[...stage.required!],energy:34};
      }else if(stage.action==='briefing'){
        if(stage.id==='rescue-plan'){
          assert.ok(collectedEvidence(state).includes('AUR-E05'));
          assert.ok(!validEvidence(state).includes('AUR-E05'));
          assert.equal(acceptStage(state,stage.id,{kind:'choice',option:'science'}),state);
        }
        result={kind:'choice',option:choices[stage.id]};
      }else if(stage.action==='flight'){
        const leg=stage.flight!;
        let f=initialFlight(leg.mode,fuelLeft(state),spacecraft(state).orbit);
        for(let i=0;i<1600&&!flightChecks(leg.mode,f).canCapture;i++){
          f=advanceFlight(leg.mode,f,{...neutral,guide:true},1/60,assessDesign(spacecraft(state)).mass);
        }
        assert.ok(flightChecks(leg.mode,f).canCapture,stage.id);
        assert.ok(f.fuel>=flightMinimum(state,stage),stage.id+' fuel '+f.fuel);
        result={kind:'flight',telemetry:f};
      }else if(stage.action==='cruise'){
        result={kind:'cruise',hours:voyage(state,stage.id)!.time};
      }
      const next=acceptStage(state,stage.id,result);
      assert.notEqual(next,state,stage.id);
      assert.equal(acceptStage(next,stage.id,result),next,'no duplicate '+stage.id);
      state=next;
    }
    assert.equal(new Set(missionLog(state)).size,24);
    assert.equal(validEvidence(state).length,7);
    assert.equal(people.length,3);
    assert.deepEqual(restoreCampaign(JSON.parse(JSON.stringify(state))),state);
    assert.equal(restoreCampaign({...state,log:state.log.filter(x=>x.id!=='farewell')}),null);
  }
});
