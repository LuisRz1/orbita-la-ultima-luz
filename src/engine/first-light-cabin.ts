import { Mesh, PerspectiveCamera, type MeshBasicMaterial } from 'three';
import { buildInterior } from './interior.ts';
import { buildLuma, buildProp } from './models.ts';
import { createViewport } from './renderer.ts';
import { setBiome } from './style.ts';
import { resolveLook, setLook } from './look.ts';
import { prefs } from '../ui/prefs.ts';

/** The crew cabin seen during the first transfer. It shares the campaign's furniture and player viewport. */
export function mountFirstLightCabin(host:HTMLElement){
  const {quality,look}=prefs.getState();
  const forced=new URLSearchParams(location.search).get('quality');
  const tier=forced==='low'||forced==='medium'||forced==='high'?forced:quality==='auto'?'medium':quality;
  const viewport=createViewport(host,tier);
  setBiome('quirofano');
  setLook(resolveLook(location.search,look,tier));
  const interior=buildInterior(),pet=buildLuma();
  const berth=buildProp({kind:'animal-berth',solid:{kind:'box',x:-.88,z:-.65,hx:.59,hz:.46,top:.98}},0);
  pet.group.position.set(-.89,.52,-.61);
  pet.group.rotation.y=2.72;
  interior.scene.add(berth,pet.group);

  const camera=new PerspectiveCamera(59,1,.08,25);
  camera.position.set(-.92,1.75,1.96);
  viewport.onResize((w,h)=>{camera.aspect=w/h;camera.updateProjectionMatrix();});
  const started=performance.now();
  let frame=0,last=started;
  function draw(now:number){
    frame=requestAnimationFrame(draw);
    const elapsed=(now-started)/1000;
    viewport.tick(Math.min(90,now-last));last=now;
    const reduced=prefs.getState().reduceMotion;
    const drift=reduced?0:Math.sin(elapsed*.65)*.075;
    camera.position.x=-.92+drift;
    camera.lookAt(viewport.width<700?-.6:.08,.68,-.44);
    pet.animate(elapsed,true,0,.78);
    viewport.renderer.render(interior.scene,camera);
  }
  frame=requestAnimationFrame(draw);
  return ()=>{
    cancelAnimationFrame(frame);
    pet.group.traverse(part=>{if(part instanceof Mesh)(part.material as MeshBasicMaterial).map?.dispose();});
    interior.dispose();
    viewport.dispose();
  };
}
