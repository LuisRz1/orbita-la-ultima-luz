import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessible, defineWorld, route } from '../../src/core/contract/grid-v1.ts';
import { applyAction, begin, budget, restore, validateLoads } from '../../src/core/mission.ts';
import { moon, worlds } from '../../src/core/worlds/index.ts';

test('each destination supports both loads without optional activity and preserves the reserve', () => {
  for (const w of worlds) for (const plan of ['survey','repair'] as const) {
    let state = begin(w,plan);
    const exit = w.points.find(p=>p.id===w.exit)!;
    const atExit = {x:exit.position.x,y:exit.position.y-1};
    assert.equal(applyAction(w,state,w.exit,atExit).error,'requirements');
    let remaining = w.points.filter(p=>p.required&&p.id!==w.exit);
    while (remaining.length) {
      const p = remaining.find(p=>p.prerequisites.every(id=>state.completed.includes(id)));
      assert.ok(p);
      const walk = route(w,state.position,p.position);
      assert.notEqual(walk,null);
      let at = state.position;
      for (const step of walk!) { assert.ok(accessible(w,at,step)); at=step; }
      const result=applyAction(w,state,p.id,at);
      assert.equal(result.error,undefined,w.id+' '+p.id);
      state=result.state; remaining=remaining.filter(x=>x.id!==p.id);
    }
    const final=applyAction(w,state,w.exit,atExit);
    assert.equal(final.state.phase,'report');
    assert.ok(final.state.power>=2);
    assert.deepEqual(restore(w,JSON.parse(JSON.stringify(final.state))),final.state);
    assert.equal(applyAction(w,final.state,w.exit,atExit).error,'inactive');
  }
});
test('lunar exit requires the same evidence for each field order',()=>{
  const orders=[['sample','archive','relay'],['sample','relay','archive'],['archive','sample','relay'],
    ['archive','relay','sample'],['relay','sample','archive'],['relay','archive','sample']];
  for(const order of orders){
    let state=begin(moon,'repair');
    for(const id of order){
      const point=moon.points.find(p=>p.id===id)!;
      const steps=route(moon,state.position,point.position)!;
      const result=applyAction(moon,state,id,steps.at(-1)??state.position);
      assert.equal(result.error,undefined,id);
      state=result.state;
      assert.equal(applyAction(moon,state,id,state.position).error,'done');
    }
    assert.equal(state.power,budget.repair-8);
    assert.equal(applyAction(moon,state,'terminal',moon.spawn).state.phase,'report');
    assert.equal(restore(worlds[0],state),null);
  }
});
test('bad layouts and incompatible or forged progression are rejected',()=>{
  assert.throws(()=>defineWorld({...moon,spawn:moon.points[0].position}),/layout/);
  assert.throws(()=>defineWorld({...moon,points:moon.points.map(p=>p.id==='relay'?{...p,prerequisites:['terminal']}:p)}),/Circular/);
  assert.throws(()=>defineWorld({...moon,points:moon.points.map(p=>p.id==='sample'?{...p,prerequisites:['shelter']}:p)}),/Invalid prerequisite/);
  const normal=begin(moon,'survey');
  assert.equal(applyAction(moon,normal,'relay',moon.spawn).error,'distance');
  assert.equal(restore(moon,{...normal,phase:'report',completed:['terminal'],last:'terminal'}),null);
  assert.equal(restore(moon,{...normal,power:0}),null);
});
test('an optional interaction cannot take the power needed for mission completion',()=>{
  const difficult = defineWorld({...moon,points:moon.points.map(p=>p.id==='shelter'?{...p,power:100}:p)});
  const start=begin(difficult,'survey');
  const action=applyAction(difficult,start,'shelter',difficult.spawn);
  assert.equal(action.error,'power');
  assert.equal(action.state,start);
  const impossible=defineWorld({...moon,points:moon.points.map(p=>p.id==='relay'?{...p,power:100}:p)});
  assert.throws(()=>validateLoads(impossible),/return reserve/);
});
