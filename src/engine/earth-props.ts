import {
  BoxGeometry, CanvasTexture, CylinderGeometry, ExtrudeGeometry, Group, IcosahedronGeometry,
  LatheGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, Shape, SRGBColorSpace, Vector2, Vector3,
  type BufferGeometry,
} from 'three';
import type { Prop } from '../core/contract/level-v2.ts';
import { part } from './models.ts';
import { toon } from './style.ts';

function sign(text:string,width:number,height:number) {
  const canvas=document.createElement('canvas');
  canvas.width=256;
  canvas.height=64;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#203944';
  ctx.fillRect(0,0,256,64);
  ctx.fillStyle='#e79152';
  ctx.fillRect(0,58,256,6);
  ctx.fillStyle='#f5eee3';
  ctx.font='bold 37px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(text,128,30);
  const map=new CanvasTexture(canvas);
  map.colorSpace=SRGBColorSpace;
  return new Mesh(new PlaneGeometry(width,height),new MeshBasicMaterial({map}));
}

/** Ground equipment and buildings for the Earth launch complex. */
export function buildEarthProp({kind,solid}:Prop,base:number):Group|null {
  if(!kind.startsWith('earth-')||solid.kind!=='box')return null;
  const group=new Group();
  group.position.set(solid.x,base,solid.z);
  const w=solid.hx*2,d=solid.hz*2,h=solid.top-base;
  const concrete='#c2c1ae', white='#eeebe0', steel='#6b7a7e', frame='#34454d';
  const glass='#26434f', trim='#bf6840', signal='#e5b954';

  function place(mesh:Mesh,x:number,y:number,z:number,parent=group) {
    mesh.position.set(x,y,z);
    parent.add(mesh);
    return mesh;
  }
  function shape(geometry:BufferGeometry,color:string,x:number,y:number,z:number,outline=.024) {
    return place(part(geometry,toon(color),outline),x,y,z);
  }
  function box(width:number,height:number,depth:number,x:number,y:number,z:number,color:string,outline=0) {
    return shape(new BoxGeometry(width,height,depth),color,x,y,z,outline);
  }
  function tube(top:number,bottom:number,length:number,x:number,y:number,z:number,color:string,segments=12) {
    return shape(new CylinderGeometry(top,bottom,length,segments),color,x,y,z,.013);
  }
  function beam(from:Vector3,to:Vector3,color:string) {
    const delta=to.clone().sub(from);
    const center=from.clone().lerp(to,.5);
    const bar=box(.16,delta.length(),.16,center.x,center.y,center.z,color);
    bar.quaternion.setFromUnitVectors(new Vector3(0,1,0),delta.normalize());
  }

  switch(kind){
    case 'earth-control': {
      box(w,.26,d,0,.13,0,steel,.025);
      box(w*.98,h*.72,d*.98,0,h*.39,0,concrete,.035);
      box(w*1.02,.38,d*1.03,0,h*.78,0,frame,.026);
      box(w*.5,.52,d*.62,w*.17,h*.86,-d*.09,white);
      for(let i=-3;i<=3;i++){
        const x=i*w*.13;
        box(w*.114,h*.22,.075,x,h*.52,d*.493,glass);
        box(w*.107,.065,.085,x,h*.58,d*.498,'#70909a');
      }
      box(w*.19,h*.36,.155,0,h*.20,d*.5,glass,.012);
      box(.07,h*.36,.19,0,h*.20,d*.5,steel);
      box(w*.27,.18,1.85,0,h*.415,d*.54,white,.024);
      box(w*.98,.2,.07,0,h*.71,d*.498,trim);
      place(sign('CONTROL',w*.30,.9),0,h*.89,d*.514);
      tube(.07,.1,1.3,-w*.34,h*.90,-d*.23,frame,8);
      box(1.1,.07,.17,-w*.34,h*1.01,-d*.23,trim);
      break;
    }
    case 'earth-hangar': {
      const wall=h*.74;
      box(w,wall,d,0,wall*.5,0,steel,.032);
      const roof=new Shape().moveTo(-w*.52,0).lineTo(w*.52,0).lineTo(w*.39,h*.19)
        .lineTo(-w*.39,h*.19).closePath();
      shape(new ExtrudeGeometry(roof,{depth:d+.4,bevelEnabled:false}),frame,0,wall,-d/2-.2,.032);
      box(w*.68,wall*.79,.21,0,wall*.42,d/2+.055,'#566a72',.024);
      for(let i=-3;i<=3;i++)box(.08,wall*.77,.23,i*w*.096,wall*.42,d/2+.061,frame);
      box(w*.73,.24,.24,0,wall*.18,d/2+.083,trim);
      box(w*.12,.9,.06,-w*.41,wall*.58,d/2+.051,glass);
      box(w*.12,.9,.06,w*.41,wall*.58,d/2+.051,glass);
      place(sign('HANGAR',w*.25,.82),0,wall+h*.086,d/2+.215);
      break;
    }
    case 'earth-rocket': {
      const r=w*.37;
      tube(w*.41,w*.49,.45,0,.24,0,frame,16);
      tube(r*.96,r,h*.61,0,h*.414,0,white,22);
      tube(r,r,h*.048,0,h*.21,0,trim,22);
      tube(r*.68,r*.95,h*.11,0,h*.77,0,steel,22);
      tube(r*.14,r*.68,h*.175,0,h*.907,0,white,22);
      tube(.075,r*.14,h*.02,0,h*.984,0,trim,12);
      for(const side of [-1,1]){
        const x=side*r*.96;
        tube(r*.24,r*.31,h*.16,x,h*.212,0,concrete,12);
        tube(.03,r*.24,h*.064,x,h*.324,0,white,12);
        tube(r*.16,r*.25,h*.058,x,h*.105,0,frame,12);
      }
      place(sign('AURORA',r*1.43,.7),0,h*.58,r*.997);
      break;
    }
    case 'earth-tower': {
      const sides=[-w*.43,w*.43], ends=[-d*.43,d*.43];
      box(w,.32,d,0,.16,0,concrete,.022);
      for(const x of sides)for(const z of ends)box(.29,h,.29,x,h/2,z,trim,.024);
      const floors=5;
      for(let i=0;i<floors;i++){
        const bottom=i*h/floors,top=(i+1)*h/floors;
        box(w,.17,d,0,top-.11,0,frame);
        for(const z of ends){
          beam(new Vector3(sides[0],bottom+.15,z),new Vector3(sides[1],top-.15,z),steel);
          beam(new Vector3(sides[1],bottom+.15,z),new Vector3(sides[0],top-.15,z),steel);
        }
        const x=sides[1];
        beam(new Vector3(x,bottom+.15,ends[0]),new Vector3(x,top-.15,ends[1]),steel);
      }
      box(w*.88,.22,1.51,-w*.8,h*.70,0,trim,.024);
      box(1.52,1.31,1.51,0,h*.94,0,frame,.028);
      tube(.17,.18,.25,0,h*1.01,0,signal,8);
      break;
    }
    case 'earth-dish': {
      const r=w*.45;
      tube(w*.26,w*.33,h*.12,0,h*.06,0,concrete,16);
      tube(w*.16,w*.24,h*.45,0,h*.30,0,steel,12);
      const dish=new Group();
      dish.position.y=h*.63;
      dish.rotation.x=.84;
      group.add(dish);
      const points=Array.from({length:9},(_,i)=>new Vector2(r*i/8,r*.30*(i/8)**2));
      const profile=[...points,...points.toReversed().map(p=>new Vector2(p.x,p.y+.14))];
      place(part(new LatheGeometry(profile,28),toon(white)),0,0,0,dish);
      place(part(new CylinderGeometry(.08,.14,r*.60,10),toon(frame)),0,r*.34,0,dish);
      place(part(new CylinderGeometry(.24,.14,.3,12),toon(trim)),0,r*.66,0,dish);
      break;
    }
    case 'earth-van': {
      box(w*.92,h*.33,d,0,h*.36,0,frame,.025);
      box(w*.91,h*.51,d*.94,0,h*.65,0,white,.037);
      box(w*.77,h*.21,.055,0,h*.75,d*.475,glass);
      box(w*.96,.14,d*.94,0,h*.42,0,trim);
      box(w*.84,.16,.16,0,h*.26,d*.506,steel);
      for(const side of [-1,1]){
        box(.047,h*.19,d*.35,side*w*.466,h*.73,d*.23,glass);
        box(w*.21,.12,.08,side*w*.31,h*.46,d*.486,signal);
        for(const z of [-d*.30,d*.30])tube(h*.20,h*.20,w*.14,side*w*.424,h*.20,z,'#252e33').rotation.z=Math.PI/2;
      }
      break;
    }
    case 'earth-terminal': {
      box(w*.72,.11,d*.83,0,.055,0,concrete,.012);
      box(w*.49,h*.67,d*.56,0,h*.39,0,steel,.021);
      box(w,h*.26,d,0,h*.84,0,frame,.024);
      const display=box(w*.74,h*.11,.025,0,h*.864,d*.51,'#a2d7bc');
      display.rotation.x=-.1;
      box(w*.80,.041,.06,0,h*.75,d*.514,trim);
      break;
    }
    case 'earth-lamp': {
      tube(w*.22,w*.40,h*.97,0,h*.485,0,steel,8);
      const side=solid.x<5?1:-1;
      box(1.15,.105,.13,side*.52,h*.91,0,steel);
      box(.65,.095,.25,side*1.18,h*.891,0,white,.018);
      break;
    }
    case 'earth-fence': {
      const alongX=w>d,span=alongX?w:d,rail='#667679';
      if(alongX){
        for(const y of [.38,.93,h*.94])box(span,.063,.066,0,y,0,rail);
      }else{
        for(const y of [.38,.93,h*.94])box(.066,.063,span,0,y,0,rail);
      }
      const posts=Math.ceil(span/2.35);
      for(let i=0;i<=posts;i++){
        const offset=(i/posts-.5)*span;
        box(.09,h,.09,alongX?offset:0,h/2,alongX?0:offset,rail);
      }
      break;
    }
    case 'earth-bench': {
      const wood='#986744';
      for(const x of [-w*.33,w*.33])box(.12,h*.90,d*.67,x,h*.45,-d*.11,frame);
      box(w,.09,d,0,h*.47,0,wood,.019);
      box(w,.13,.085,0,h*.72,-d*.46,wood,.019);
      box(w,.13,.085,0,h*.89,-d*.46,wood,.019);
      break;
    }
    case 'earth-tree': {
      tube(w*.18,w*.33,h*.64,0,h*.32,0,'#765841',7);
      const crown=h*.259;
      shape(new IcosahedronGeometry(crown,0),'#3c6539',0,h*.76,0,.022);
      shape(new IcosahedronGeometry(crown*.8,0),'#5e8146',-crown*.52,h*.64,.13,.022);
      shape(new IcosahedronGeometry(crown*.77,0),'#507642',crown*.55,h*.70,-.12,.022);
      break;
    }
    default:return null;
  }
  return group;
}
