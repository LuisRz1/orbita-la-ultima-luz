import { expect, test, type Page } from '@playwright/test';

type Api=Record<string,(...args:unknown[])=>unknown>;
const call=(page:Page,fn:string,...args:unknown[])=>page.evaluate(([name,args])=>
  (window.__orbita as unknown as Api)[name](...args),[fn,args] as const);
const area=(page:Page,id:string)=>page.locator('.campaign-game[data-stage="'+id+'"]');

async function settle(page:Page){
  await page.evaluate(()=>{
    const api=window.__orbita as unknown as Api;
    for(let i=0;i<12&&(api.state() as {dialogue:boolean}).dialogue;i++)api.advance();
  });
}
async function operate(page:Page,id:string,start:boolean,inspect?:(point:string)=>Promise<void>,withOptional=false){
  await expect(area(page,id)).toBeVisible();
  await page.waitForFunction(()=>typeof window.__orbita?.teleport==='function');
  await call(page,'pause',true);
  if(start)await call(page,'start','science');
  await settle(page);
  const level=await call(page,'level') as {points:{id:string;x:number;z:number;required:boolean}[]};
  for(const p of level.points.filter(p=>p.required||withOptional)){
    await call(page,'teleport',p.x,p.z);
    await call(page,'step',2);
    await settle(page);
    const voice=id==='station'&&p.id==='translator'?page.waitForResponse(r=>/\/point_translator-0-[\w-]+\.m4a$/.test(r.url())):null;
    await call(page,'press','interact');
    await call(page,'step',2);
    if(voice)expect((await voice).ok()).toBe(true);
    await settle(page);
    await call(page,'step',210);
    await settle(page);
    await inspect?.(p.id);
  }
  await expect(page.locator('[data-campaign-file]')).toBeEnabled();
  await page.locator('[data-campaign-file]').click();
}
async function fly(page:Page,id:string){
  await expect(area(page,id)).toBeVisible();
  await page.getByRole('button',{name:'Guiar maniobra'}).click();
  await call(page,'flightSteps',660);
  await expect(page.locator('[data-capture]')).toBeEnabled({timeout:20_000});
  await page.locator('[data-capture]').click();
}
async function route(page:Page,id:string,choice?:string){
  await expect(area(page,id)).toBeVisible();
  if(choice)await page.locator('[data-choice="'+choice+'"]').click();
  await page.locator('[data-route]').click();
}
async function cruise(page:Page,id:string){
  await expect(area(page,id)).toBeVisible();
  await page.locator('[data-cruise-start]').click();
  await page.locator('[data-cruise-end]').click({timeout:15_000});
}
async function file(page:Page,id:string){
  await expect(area(page,id)).toBeVisible();
  await page.locator('[data-file]').click();
}
async function skipStory(page:Page,id:string){
  await expect(page.locator('[data-story-scene="'+id+'"]')).toBeVisible();
  await page.getByRole('button',{name:/Saltar/}).click();
}
async function finishOpening(page:Page){
  await operate(page,'departure',false);
  await skipStory(page,'prologue');
}

async function currentEvidence(page:Page,id:string,status:'collected'|'validated'){
  await page.locator('[data-journal]').click();
  const journal=page.getByRole('dialog',{name:'Diario de campaña'});
  const evidence=journal.locator('[data-evidence="'+id+'"]');
  await expect(evidence).toHaveAttribute('data-evidence-status',status);
  if(status==='collected')await expect(evidence).not.toContainText('LUN-ARC-07');
  await page.keyboard.press('Escape');
  await expect(journal).toHaveCount(0);
}
test('full-viewport astronaut moves by keyboard, looks with the mouse, and the journal switches languages',async ({page})=>{
  await page.goto('/?campana&debug&quality=low');
  await finishOpening(page);
  await expect(area(page,'ground')).toBeVisible();
  await page.waitForFunction(()=>window.__orbita?.state?.());
  await call(page,'pause',true);
  expect(await page.locator('canvas').boundingBox()).toEqual({x:0,y:0,width:1440,height:960});
  await page.keyboard.press('v');
  await call(page,'step',2);
  await expect(page.locator('[data-helmet]')).toHaveCount(0);
  const before=await call(page,'state') as {x:number;z:number;cameraLook:{yaw:number}};
  await page.keyboard.down('d');
  await call(page,'step',36);
  await page.keyboard.up('d');
  const strafed=await call(page,'state') as typeof before;
  expect(strafed.x).toBeGreaterThan(before.x+2);
  expect(strafed.cameraLook.yaw).toBe(before.cameraLook.yaw);
  await page.keyboard.down('a');
  await call(page,'step',36);
  await page.keyboard.up('a');
  const poses:number[][][]=[];
  await page.keyboard.down('w');
  for(let i=0;i<3;i++){
    await call(page,'step',20);
    poses.push(await call(page,'pose') as number[][]);
  }
  await page.keyboard.up('w');
  const walked=await call(page,'state') as {z:number};
  expect(walked.z).toBeLessThan(before.z-3);
  expect(Math.max(...poses.map(stride=>Math.abs(stride[1][0]-stride[2][0])))).toBeGreaterThan(.32);
  expect(Math.min(...poses.flatMap(stride=>[stride[3][0],stride[4][0]]))).toBeLessThan(-.16);
  await page.mouse.move(830,390);
  await page.mouse.down({button:'right'});
  await page.mouse.move(975,436,{steps:6});
  await page.mouse.up({button:'right'});
  const turned=await call(page,'state') as {cameraLook:{yaw:number}};
  expect(Math.abs(turned.cameraLook.yaw-before.cameraLook.yaw)).toBeGreaterThan(.15);
  await page.keyboard.press('c');
  await call(page,'step',2);
  const centred=await call(page,'state') as {cameraLook:{yaw:number}};
  expect(Math.abs(centred.cameraLook.yaw-before.cameraLook.yaw)).toBeLessThan(.01);
  await page.locator('[data-campaign-lang]').click();
  await page.locator('[data-journal]').click();
  await expect(page.getByRole('dialog',{name:'Campaign journal'})).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Before liftoff');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-campaign-lang]').click();
  await page.getByRole('button',{name:'Pantalla completa',exact:true}).click();
  await expect(page.getByRole('button',{name:'Salir de pantalla completa'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Salir de pantalla completa'}).click();
  await page.keyboard.down('w');await call(page,'step',170);await page.keyboard.up('w');
  await expect(page.locator('[data-prompt]')).toContainText('Acceder a Control de misión');
  await page.keyboard.press('e');await call(page,'step',23);
  const reaching=await call(page,'pose') as number[][];
  expect(reaching[6][0]).toBeGreaterThan(.36);
  await call(page,'step',125);
  await page.locator('[data-campaign-file]').click();
  await expect(area(page,'design')).toBeVisible();
  await expect(page.locator('[data-dossier="EST-27"]')).toContainText('Meses después');
  await expect(page.locator('[data-dossier="AURORA / COMMS"]')).toContainText('Tu hermana' ,{ignoreCase:true});
  await page.getByRole('button',{name:/Registrar objetivo de búsqueda/}).click();
  await page.getByRole('button',{name:/Autorizar lanzamiento/}).click();
  await page.getByRole('button',{name:'Pilotar manualmente'}).click();
  await page.keyboard.down('q');await call(page,'flightSteps',260);await page.keyboard.up('q');
  await expect(page.getByText('La nave salió del corredor seguro.')).toBeVisible();
  await page.getByRole('button',{name:'Reintentar maniobra'}).click();
  await expect(page.locator('[data-capture]')).toBeDisabled();
});

test('Aurora: all 24 missions, seven validated document IDs, persistent farewell and rescue',async ({page})=>{
  test.setTimeout(310_000);
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('/?campana&debug&quality=low');
  await finishOpening(page);
  await operate(page,'ground',false);
  await expect(area(page,'design')).toBeVisible();
  await page.getByRole('button',{name:/Registrar objetivo de búsqueda/}).click();
  await page.getByLabel('Órbita de encuentro').selectOption('survey');
  const launch=page.getByRole('button',{name:/Autorizar lanzamiento/});
  await expect(launch).toBeDisabled();
  await page.getByRole('button',{name:/Propuesta ligera/}).click();
  await launch.click();
  await fly(page,'launch');await fly(page,'dock');
  await expect(area(page,'station')).toBeVisible();
  await page.waitForFunction(()=>typeof window.__orbita?.teleport==='function');
  await call(page,'pause',true);
  expect((await call(page,'state') as {companion:boolean}).companion).toBe(false);
  await page.keyboard.press('v');await call(page,'step',2);
  await expect(page.locator('[data-helmet]')).toBeVisible();
  await page.keyboard.press('v');await call(page,'step',2);
  await call(page,'teleport',-55,33);
  await page.keyboard.down('a');
  await call(page,'step',75);
  await page.keyboard.up('a');
  const atBulkhead=await call(page,'state') as {x:number};
  expect(atBulkhead.x).toBeGreaterThan(-57);
  expect(atBulkhead.x).toBeLessThan(-56.4);
  await operate(page,'station',false,async point=>{
    if(point==='capsule'){
      expect((await call(page,'state') as {companion:boolean}).companion).toBe(false);
      await currentEvidence(page,'AUR-E01','collected');
    }
    if(point==='protected-bay'){
      const state=await call(page,'state') as {companion:boolean;companionAt:{x:number;z:number}};
      expect(state.companion).toBe(true);
      expect(Math.hypot(state.companionAt.x-5.65,state.companionAt.z-2.35)).toBeLessThan(1);
      await expect(page.locator('.luma-talk')).toHaveCount(0);
    }
    if(point==='translator'){
      await page.keyboard.press('l');
      await call(page,'step',2);
      await expect(page.getByRole('dialog',{name:'LUMA'})).toContainText('los dos pulsos');
      await settle(page);
    }
    if(point==='capsule-auth')await currentEvidence(page,'AUR-E01','validated');
  });
  await route(page,'eva-plan');await operate(page,'eva',false,async point=>{
    if(point==='recorder')await currentEvidence(page,'AUR-E02','collected');
    if(point==='airlock')await currentEvidence(page,'AUR-E02','validated');
  });
  await route(page,'moon-plan','express');await fly(page,'moon-depart');
  await expect(page.locator('.first-light-cabin canvas')).toBeVisible();
  await page.getByRole('button',{name:'Asomarte al compartimento de LUMA'}).click();
  await expect(page.locator('.first-light-cabin-line')).toContainText('Me dormí un momento');
  await cruise(page,'moon-cruise');await fly(page,'moon-arrive');
  await expect(area(page,'moon-handoff')).toContainText('LUN-ARC-07');
  const lunarVoice=page.waitForResponse(r=>/\/complete-1-[\w-]+\.m4a$/.test(r.url()));
  await file(page,'moon-handoff');
  await expect(area(page,'scene-moon')).toBeVisible();
  await expect(page.locator('[data-story-scene="moon"]')).toContainText('La Luna… Ella la miraba mucho',{timeout:15_000});
  expect((await lunarVoice).ok()).toBe(true);
  await page.reload();
  await skipStory(page,'moon');
  await route(page,'moon-site');await fly(page,'moon-land');await operate(page,'moon',true);
  await fly(page,'moon-rise');await file(page,'moon-report');
  await skipStory(page,'mars');
  await route(page,'mars-plan');await fly(page,'mars-depart');await cruise(page,'mars-cruise');
  await fly(page,'mars-arrive');await route(page,'mars-site');await fly(page,'mars-land');
  await operate(page,'mars',true);await fly(page,'mars-rise');
  await expect(area(page,'rescue-plan')).toBeVisible();
  await page.locator('[data-choice="science"]').click();
  await expect(page.locator('[data-route]')).toBeDisabled();
  await route(page,'rescue-plan','rescue');
  await skipStory(page,'bennu');
  await fly(page,'bennu-depart');await cruise(page,'bennu-cruise');await fly(page,'bennu-arrive');
  await operate(page,'bennu',true);
  await operate(page,'service',false,async id=>{
    if(id==='disconnect'||id==='life-line')expect((await call(page,'state') as {gate:boolean}).gate).toBe(id==='disconnect');
  });
  await expect(area(page,'farewell')).toContainText('deja de respirar');
  await file(page,'farewell');
  await expect(area(page,'return-depart')).toBeVisible();
  await page.reload();
  await expect(area(page,'return-depart')).toBeVisible();
  await fly(page,'return-depart');await cruise(page,'return-cruise');await fly(page,'earth-dock');
  await operate(page,'earth',false,async ()=>{
    expect((await call(page,'state') as {companion:boolean}).companion).toBe(false);
  });
  await expect(area(page,'epilogue')).toContainText('Recepción confirmada');
  await file(page,'epilogue');
  await skipStory(page,'earth');
  await expect(area(page,'complete')).toContainText('Aurora está en casa');
  await page.locator('[data-journal]').click();
  await expect(page.locator('dialog [data-mission][data-status="complete"]')).toHaveCount(24);
  await expect(page.locator('dialog [data-evidence]')).toHaveCount(7);
  await expect(page.locator('dialog [data-evidence="AUR-E07"]')).toContainText('Validada');
  await page.keyboard.press('Escape');
  await area(page,'complete').getByRole('button',{name:'Marte ↗'}).click();
  await expect(area(page,'revisit-mars')).toBeVisible();
  await page.waitForFunction(()=>typeof window.__orbita?.teleport==='function');
  await call(page,'start','science');
  expect((await call(page,'state') as {companion:boolean}).companion).toBe(false);
  await expect(page.locator('.luma-talk')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('First Light completes independently and carries its evidence into the lunar chapter',async ({page})=>{
  test.setTimeout(160_000);
  await page.goto('/?campana&primera-luz&debug&quality=low');
  await finishOpening(page);
  await page.waitForFunction(()=>window.__orbita?.state?.());
  await call(page,'pause',true);
  await page.keyboard.down('Space');
  await call(page,'step',19);
  await page.keyboard.up('Space');
  const air=await call(page,'state') as {grounded:boolean;y:number};
  expect(air.grounded).toBe(false);
  expect(air.y).toBeGreaterThan(.35);
  const jump=await call(page,'pose') as number[][];
  expect(jump[3][0]).toBeLessThan(-.23);
  const impact=await page.evaluate(()=>{
    const api=window.__orbita as unknown as Api;
    for(let i=0;i<140&&!((api.state() as {grounded:boolean}).grounded);i++)api.step(1);
    api.step(4);
    return {state:api.state() as {grounded:boolean},pose:api.pose() as number[][]};
  });
  expect(impact.state.grounded).toBe(true);
  expect(impact.pose[0][3]).toBeLessThan(-.025);
  await operate(page,'ground',false);
  await page.getByRole('button',{name:/Registrar objetivo de búsqueda/}).click();
  await page.getByRole('button',{name:/Propuesta científica/}).click();
  await page.getByText('Archivo de alternativas · opcional',{exact:true}).click();
  await page.getByRole('button',{name:'Archivar comparación'}).click();
  await page.getByRole('button',{name:/Autorizar lanzamiento/}).click();
  await fly(page,'launch');await fly(page,'dock');
  await operate(page,'station',false,undefined,true);
  await route(page,'eva-plan','sunlit');await operate(page,'eva',false,undefined,true);
  await route(page,'moon-plan','economy');await fly(page,'moon-depart');await cruise(page,'moon-cruise');await fly(page,'moon-arrive');
  await file(page,'moon-handoff');
  await skipStory(page,'moon');
  await expect(area(page,'complete')).toContainText('Primera luz completado');
  await page.locator('[data-journal]').click();
  await expect(page.locator('dialog [data-mission][data-status="complete"]')).toHaveCount(6);
  await expect(page.locator('dialog')).toContainText('Encargos opcionales · 4/4');
  await expect(page.locator('dialog')).toContainText('Hallazgos de Primera luz · 15/15');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(area(page,'complete')).toContainText('Primera luz completado');
  await page.getByRole('button',{name:/Continuar con el capítulo 2/}).click();
  await expect(area(page,'moon-site')).toBeVisible();
  await currentEvidence(page,'AUR-E01','validated');
  await currentEvidence(page,'AUR-E02','validated');
  await page.locator('[data-journal]').click();
  await expect(page.getByRole('dialog')).toContainText('Encargos opcionales · 4/4');
  await page.keyboard.press('Escape');
  await route(page,'moon-site','slope');
  await expect(area(page,'moon-land')).toBeVisible();

  await page.goto('/?primera-luz&debug&quality=low');
  await expect(area(page,'complete')).toBeVisible();
  await page.getByRole('button',{name:/Continuar con el capítulo 2/}).click();
  await expect(page.getByRole('status')).toContainText('Ya hay una campaña guardada');
  await page.getByRole('button',{name:/Reanudar campaña guardada/}).click();
  await expect(area(page,'moon-land')).toBeVisible();
  await page.reload();
  await expect(area(page,'moon-land')).toBeVisible();
});
