import {
  AmbientLight, BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight,
  DodecahedronGeometry, Group, Line, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, PerspectiveCamera, Points, PointsMaterial, RingGeometry, Scene, SphereGeometry, Vector3,
} from 'three';
import type { FlightState } from '../core/orbit/flight.ts';
import { createViewport } from './renderer.ts';
import { earthTexture } from './style.ts';
import type { Tier } from './quality.ts';

export type FlightBody='earth'|'orbit'|'moon'|'mars'|'bennu';
const colors:Record<FlightBody,string>={earth:'#688db2',orbit:'#688db2',moon:'#bcb3ae',mars:'#cd8164',bennu:'#655e68'};
export const flightLook=()=>({azimuth:0,elevation:.1,distance:21});
type Look=ReturnType<typeof flightLook>;

export function buildFlightView(host:HTMLElement,body:FlightBody,tier:Tier){
  const viewport=createViewport(host,tier);
  const scene=new Scene();
  scene.background=new Color('#070c16');
  const camera=new PerspectiveCamera(58,1,.1,900);
  viewport.onResize((w,h)=>{camera.aspect=w/h;camera.updateProjectionMatrix();});
  const light=new DirectionalLight('#fff1db',2.4);
  light.position.set(-20,18,16);
  scene.add(light,new AmbientLight('#a3c4da',1.35));
  const earthMap=body==='earth'||body==='orbit'?earthTexture():null;
  const planet=new Mesh(body==='bennu'?new DodecahedronGeometry(43,1):new SphereGeometry(105,36,24),
    new MeshLambertMaterial({color:earthMap?'#b9c5ee':colors[body],map:earthMap,flatShading:body!=='earth'}));
  planet.position.set(-36,body==='bennu'?-42:-112,-159);
  scene.add(planet);
  const stars:Vector3[]=[];
  let seed=201;
  const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<820;i++)stars.push(new Vector3((rand()-.5)*720,(rand()-.5)*570,-250-rand()*400));
  scene.add(new Points(new BufferGeometry().setFromPoints(stars),
    new PointsMaterial({color:'#c1d4e9',size:1.5,sizeAttenuation:false})));

  const craft=new Group();
  const ceramic=new MeshLambertMaterial({color:'#e0dfd4'}), metal=new MeshLambertMaterial({color:'#526e84'});
  const hull=new Mesh(new CylinderGeometry(1.12,1.46,4.3,8),ceramic);
  hull.rotation.z=-Math.PI/2;
  craft.add(hull);
  const nose=new Mesh(new ConeGeometry(1.12,1.8,8),metal);nose.rotation.z=-Math.PI/2;nose.position.x=3.05;craft.add(nose);
  const window=new Mesh(new BoxGeometry(1.28,.16,.93),new MeshBasicMaterial({color:'#7de0df'}));
  window.position.set(1.2,1.02,.04);craft.add(window);
  for(const side of [-1,1]){
    const wing=new Mesh(new BoxGeometry(1.65,.18,2.35),metal);
    wing.position.set(-.66,0,1.84*side);craft.add(wing);
    const nozzle=new Mesh(new CylinderGeometry(.55,.68,.8,8),metal);
    nozzle.rotation.z=-Math.PI/2;nozzle.position.set(-2.52,0,side*.62);craft.add(nozzle);
    const nav=new Mesh(new BoxGeometry(.26,.21,.4),new MeshBasicMaterial({color:side===1?'#f5ad72':'#a9eccf'}));
    nav.position.set(-.8,.24,side*3);craft.add(nav);
  }
  scene.add(craft);

  const port=new Group();
  const ring=new Mesh(new RingGeometry(3.05,3.34,42),new MeshBasicMaterial({color:'#9de5d7',side:2}));
  ring.rotation.x=-Math.PI/2;
  port.add(ring);
  const ringHigh=ring.clone();ringHigh.rotation.set(0,Math.PI/2,0);port.add(ringHigh);
  const spine=new Mesh(new BoxGeometry(3.6,2.2,8),ceramic);spine.position.x=5.6;port.add(spine);
  const arrays=new Mesh(new BoxGeometry(2.6,.13,17),metal);arrays.position.x=6;port.add(arrays);
  scene.add(port);
  const traces:Vector3[]=[];
  for(let x=-104;x<0;x+=4)traces.push(new Vector3(x,-.12,0),new Vector3(x+2,-.12,0));
  for(const z of [-11,11])for(let x=-102;x<0;x+=9)traces.push(new Vector3(x,-.15,z),new Vector3(x+3.5,-.15,z));
  scene.add(new LineSegments(new BufferGeometry().setFromPoints(traces),
    new LineBasicMaterial({color:'#7ca5c0',transparent:true,opacity:.7})));
  const line=new Line(new BufferGeometry().setFromPoints([new Vector3(),new Vector3()]),
    new LineBasicMaterial({color:'#efbf86'}));
  line.frustumCulled=false;
  scene.add(line);

  return {
    draw(state:FlightState,look:Look,time:number,frameMs:number){
      viewport.tick(frameMs);
      craft.position.set(state.x,.2,state.y);
      craft.rotation.set(.16*Math.sin(time*1.3),-state.heading*Math.PI/180,0);
      planet.rotation.y=time*.017;
      const vector=line.geometry.attributes.position;
      vector.setXYZ(0,state.x,.4,state.y);
      vector.setXYZ(1,state.x+state.vx*.78,.4,state.y+state.vy*.78);
      vector.needsUpdate=true;
      const distance=look.distance;
      camera.position.set(state.x-distance*Math.cos(look.azimuth),8+distance*look.elevation,state.y+distance*Math.sin(look.azimuth)+11.5);
      camera.lookAt(Math.min(0,state.x+16),.1,state.y*.66);
      viewport.renderer.render(scene,camera);
    },
    dispose(){
      const materials=new Set<MeshBasicMaterial>();
      const geometry=new Set<BufferGeometry>();
      scene.traverse(object=>{
        const mesh=object as Mesh<BufferGeometry,MeshBasicMaterial>;
        if(mesh.geometry)geometry.add(mesh.geometry);
        if(mesh.material)materials.add(mesh.material);
      });
      geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());earthMap?.dispose();
      viewport.dispose();
    },
  };
}
